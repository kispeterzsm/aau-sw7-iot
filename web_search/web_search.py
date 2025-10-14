import random
import time
import logging
from datetime import datetime
from typing import List, Dict, Optional
from urllib.parse import quote_plus, parse_qs, urlparse, unquote
from bs4 import BeautifulSoup
from stealth_requests import StealthSession


class WebScraping:
    DEFAULT_NUM_RESULTS = 100 # Default numbers of search results, can be changed to suit needs
    DELAY_RANGE = (0.8, 1.8)
    USER_AGENT_FALLBACK = (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/115.0 Safari/537.36"
    )

    def __init__(self, verbose: bool = False):
        self.log = logging.getLogger("WebScraping")
        logging.basicConfig(level=logging.DEBUG if verbose else logging.INFO,
                            format="%(asctime)s [%(levelname)s] %(message)s")

    @staticmethod
    def random_delay():
        time.sleep(random.uniform(*WebScraping.DELAY_RANGE))

    @staticmethod
    def build_bing_search_url(query: str, first: int = 0) -> str:
        safe_q = quote_plus(query)
        return f"https://www.bing.com/search?q={safe_q}&first={first}"

    @staticmethod
    def parse_date(text: str) -> Optional[datetime]:
        import re
        date_patterns = [
            r"([A-Za-z]{3,9}\s\d{1,2},\s\d{4})",  # e.g. September 8, 2024
            r"([A-Za-z]{3,9}\s\d{4})",            # e.g. Sep 2024
        ]
        for pattern in date_patterns:
            match = re.search(pattern, text)
            if match:
                try:
                    return datetime.strptime(match.group(1), "%B %d, %Y")
                except ValueError:
                    try:
                        return datetime.strptime(match.group(1), "%b %Y")
                    except ValueError:
                        continue
        return None

    @staticmethod
    def clean_bing_url(url: str) -> str:
        """
        Return the real target URL from a Bing redirect if present.
        Handles:
        - Direct URLs (return as-is)
        - Bing redirect URLs with u= parameter (URL-decoded)
        """
        if url.startswith("http"):
            return url  # Already a direct link

        if "bing.com/ck/a" in url or "bing.com/aclick" in url:
            parsed = urlparse(url)
            qs = parse_qs(parsed.query)
            u_param = qs.get("u")
            if u_param:
                return unquote(u_param[0])
        
        return url


    def parse_bing_results(self, html: str) -> List[Dict[str, str]]:
        soup = BeautifulSoup(html, "lxml")
        results = []

        for li in soup.select("li.b_algo"):
            h2 = li.find("h2")
            a = h2.find("a") if h2 else None
            title = a.get_text(strip=True) if a else None
            url = self.clean_bing_url(a["href"]) if a and a.has_attr("href") else None

            snippet_tag = li.find("p")
            snippet = snippet_tag.get_text(strip=True) if snippet_tag else ""

            date_tag = li.find("span", class_="news_dt") or li.find("span", class_="b_adSlug")
            date_text = date_tag.get_text(strip=True) if date_tag else ""
            date = self.parse_date(date_text or snippet)

            if title and url:
                results.append({
                    "title": title,
                    "url": url,
                    "snippet": snippet,
                    "date": date.strftime("%Y-%m-%d") if date else None
                })

        return results

    def search_bing(self, query: str, num_results: int = DEFAULT_NUM_RESULTS) -> List[Dict[str, str]]:
        results: List[Dict[str, str]] = []

        with StealthSession() as session:
            if hasattr(session, "headers"):
                session.headers.setdefault("User-Agent", self.USER_AGENT_FALLBACK)

            per_page = 10
            pages = max(1, (num_results + per_page - 1) // per_page)

            for page in range(pages):
                first = page * per_page + 1
                url = self.build_bing_search_url(query, first)
                #self.log.info(f"Fetching Bing page {page + 1}/{pages} -> {url}") useful for debugging and viewing progress 

                try:
                    resp = session.get(url, timeout=15)
                except Exception as e:
                    self.log.warning(f"Request failed: {e}")
                    break

                if getattr(resp, "status_code", 200) != 200:
                    self.log.warning(f"Non-200 response: {resp.status_code}")
                    continue

                html = getattr(resp, "text", "")

                page_results = self.parse_bing_results(html)
                results.extend(page_results)

                if len(results) >= num_results:
                    break

                self.random_delay()

        return results[:num_results]

    @staticmethod
    def get_oldest_result(results: List[Dict[str, str]]) -> Optional[Dict[str, str]]:
        dated_results = [r for r in results if r.get("date")]
        if not dated_results:
            return None
        return min(dated_results, key=lambda x: datetime.strptime(x["date"], "%Y-%m-%d"))