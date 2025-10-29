from typing import List, Dict, Any, Optional
import asyncio
from datetime import datetime, timedelta, timezone

import httpx
import feedparser
from dateutil import parser as dtparser
from fastapi import APIRouter

router = APIRouter(prefix="/news", tags=["news"])

RSS_FEEDS = [
    "https://feeds.bbci.co.uk/news/rss.xml",
    "https://www.reutersagency.com/feed/?best-topics=top-news&post_type=best",
    "https://www.aljazeera.com/xml/rss/all.xml",
    "https://apnews.com/hub/apf-topnews?output=rss",
    "https://rss.cnn.com/rss/edition.rss",
    "https://feeds.nytimes.com/nyt/rss/HomePage",
]

def _parse_pubdate(entry: Dict[str, Any]) -> Optional[datetime]:
    for key in ("published", "updated"):
        if entry.get(key):
            try:
                dt = dtparser.parse(entry[key])
                return dt.astimezone(timezone.utc) if dt.tzinfo else dt.replace(tzinfo=timezone.utc)
            except Exception:
                pass
    for key in ("published_parsed", "updated_parsed"):
        if entry.get(key):
            try:
                return datetime(*entry[key][:6], tzinfo=timezone.utc)
            except Exception:
                pass
    return None

async def _fetch_feed(client: httpx.AsyncClient, url: str) -> List[Dict[str, Any]]:
    try:
        r = await client.get(url, timeout=15)
        r.raise_for_status()
    except Exception:
        return []
    parsed = feedparser.parse(r.text)
    items: List[Dict[str, Any]] = []
    source = (parsed.feed.get("title") if parsed and parsed.get("feed") else url)  # type: ignore[attr-defined]
    for e in parsed.entries:
        link = e.get("link")
        title = (e.get("title") or "").strip()
        if not link or not title:
            continue
        pub = _parse_pubdate(e) or datetime.now(timezone.utc)
        items.append({
            "title": title,
            "url": link,
            "source": source,
            "published_at": pub.isoformat(),
            "_published_dt": pub,
        })
    return items

@router.get("/top")
async def top_news(limit: int = 10):
    now = datetime.now(timezone.utc)
    cutoff = now - timedelta(days=1)

    async with httpx.AsyncClient() as client:
        results = await asyncio.gather(*[_fetch_feed(client, u) for u in RSS_FEEDS])

    all_items = [it for sub in results for it in sub]
    fresh = [it for it in all_items if it["_published_dt"] >= cutoff]

    dedup: Dict[str, Dict[str, Any]] = {}
    for it in fresh:
        u = it["url"]
        if u not in dedup or it["_published_dt"] > dedup[u]["_published_dt"]:
            dedup[u] = it

    items_sorted = sorted(dedup.values(), key=lambda x: x["_published_dt"], reverse=True)[: max(1, min(50, limit))]
    for it in items_sorted:
        it.pop("_published_dt", None)

    return {
        "status": "ok",
        "count": len(items_sorted),
        "generated_at": now.isoformat(),
        "items": items_sorted,
    }
