import random
import time
import logging
import re
from datetime import datetime, timedelta
from typing import List, Dict, Optional
from urllib.parse import quote_plus, parse_qs, urlparse, unquote
from bs4 import BeautifulSoup
from stealth_requests import StealthSession
import json


class WebScraping:
    DEFAULT_NUM_RESULTS = 100
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
        """
        Robustly parses date strings, including relative (e.g., "3 days ago")
        and absolute (e.g., "September 8, 2024") dates.
        """
        if not text:
            return None

        text_lower = text.lower()
        if "ago" in text_lower:
            try:
                num_match = re.search(r'(\d+)', text_lower)
                if not num_match:
                    return None
                
                num = int(num_match.group(1))
                today = datetime.now()

                if "hour" in text_lower:
                    return today - timedelta(hours=num)
                if "day" in text_lower:
                    return today - timedelta(days=num)
                if "week" in text_lower:
                    return today - timedelta(weeks=num)
                if "month" in text_lower:
                    return today - timedelta(days=num * 30)
                if "year" in text_lower:
                    return today - timedelta(days=num * 365)
            except Exception:
                pass 

        date_patterns = [
            (r"([A-Za-z]{3,9}\s\d{1,2},\s\d{4})", "%B %d, %Y"), # September 8, 2024
            (r"([A-Za-z]{3}\s\d{1,2},\s\d{4})", "%b %d, %Y"),   # Sep 8, 2024
            (r"(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})", "%Y-%m-%dT%H:%M:%S"), # 2024-09-08T14:30:00 (ISO format)
            (r"([A-Za-z]{3,9}\s\d{4})", "%B %Y"),              # September 2024
            (r"([A-Za-z]{3}\s\d{4})", "%b %Y"),                # Sep 2024
        ]
        
        for pattern, date_format in date_patterns:
            # Remove potential time zone offsets like +00:00
            cleaned_text = re.sub(r'[+-]\d{2}:\d{2}$', '', text)
            match = re.search(pattern, cleaned_text)
            if match:
                try:
                    return datetime.strptime(match.group(1), date_format)
                except ValueError:
                    continue
        
        return None

    @staticmethod
    def clean_bing_url(url: str) -> str:
        if url.startswith("http"):
            return url
        if "bing.com/ck/a" in url or "bing.com/aclick" in url:
            parsed = urlparse(url)
            qs = parse_qs(parsed.query)
            u_param = qs.get("u")
            if u_param:
                return unquote(u_param[0])
        return url

    def parse_web_page_for_date(self, url: str, session: StealthSession) -> Optional[datetime]:
        """
        Fetches the actual webpage URL as a last resort to find a publication date.
        Attempts meta tags, JSON-LD blocks, <time> tags, and heuristic text matches.
        """
        try:
            resp = session.get(
                url,
                timeout=10,
                allow_redirects=True,
                headers={
                    "User-Agent": (
                        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                        "AppleWebKit/537.36 (KHTML, like Gecko) "
                        "Chrome/120.0 Safari/537.36"
                    )
                },
            )

            if resp.status_code != 200:
                self.log.warning(f"Fallback fetch for {url} failed with status {resp.status_code}")
                return None

            html = resp.text
            if not html:
                return None

            soup = BeautifulSoup(html, "lxml")

            # meta tags
            meta_selectors = [
                ("meta[property='article:published_time']", "content"),
                ("meta[name='publication-date']", "content"),
                ("meta[name='date']", "content"),
                ("meta[name='sailthru.date']", "content"),
                ("meta[property='rnews:datePublished']", "content"),
                ("meta[property='og:published_time']", "content"),
                ("meta[name='publish_date']", "content"),
                ("meta[itemprop='datePublished']", "content"),
            ]

            for selector, attr in meta_selectors:
                tag = soup.select_one(selector)
                if tag and tag.get(attr):
                    parsed = self.parse_date(tag[attr])
                    if parsed:
                        return parsed

            # json-ld
            scripts = soup.find_all("script", type="application/ld+json")

            for script in scripts:
                if not script.string:
                    continue

                try:
                    data = json.loads(script.string)

                    # Handle either dict or list of dicts
                    items = data if isinstance(data, list) else [data]
                    for obj in items:
                        if not isinstance(obj, dict):
                            continue

                        for key in ("datePublished", "dateCreated", "uploadDate"):
                            if key in obj:
                                parsed = self.parse_date(obj[key])
                                if parsed:
                                    return parsed
                except Exception as e:
                    self.log.debug(f"Invalid or unparsable JSON-LD on {url}: {e}")
                    continue

            # time tags
            time_tag = soup.select_one("time[datetime]")
            if time_tag and time_tag.get("datetime"):
                parsed = self.parse_date(time_tag["datetime"])
                if parsed:
                    return parsed

            # final heuristic search for date-like text
            heuristic_tag = soup.select_one(
                "[class*='publi'], [class*='date'], [class*='timestamp'], [id*='date']"
            )
            if heuristic_tag:
                text = heuristic_tag.get_text(strip=True)
                if text:
                    parsed = self.parse_date(text)
                    if parsed:
                        return parsed

        except Exception as e:
            self.log.warning(f"Fallback for {url} failed: {e}")
            return None

        #self.log.debug(f"No date found for {url} using webpage fallback.")
        return None


    def parse_bing_results(self, html: str, search_type: str, session: StealthSession) -> List[Dict[str, str]]:
        """
        Now accepts the 'session' object to pass to the webpage fallback parser.
        """
        soup = BeautifulSoup(html, "lxml")
        results = []

        container_selectors = ".news-card, li.b_algo"
        if search_type == 'web':
            container_selectors = "li.b_algo"

        for item in soup.select(container_selectors):
            title, url, snippet, date_text = None, None, "", ""
            date = None
            a_tag = None 

            try:
                # news-card
                if item.name == 'div' and 'news-card' in item.get('class', []):
                    a_tag = item.find("a", class_="title")
                    snippet_tag = item.find("div", class_="snippet")
                    date_tag = item.find("span", class_="news_dt") 
                    if date_tag:
                        date_text = date_tag.get_text(strip=True)

                # li.b_algo
                elif item.name == 'li' and 'b_algo' in item.get('class', []):
                    h2 = item.find("h2")
                    a_tag = h2.find("a") if h2 else None
                    snippet_tag = item.select_one(".b_caption p") or item.find("p")

                    attribution_tag = item.select_one(".b_attribution")
                    if attribution_tag:
                        all_attr_texts = [text.strip() for text in attribution_tag.find_all(string=True, recursive=False)]
                        combined_attr_text = " ".join(filter(None, all_attr_texts))
                        spans_inside_attr = attribution_tag.find_all('span')
                        span_texts = " ".join([span.get_text(strip=True) for span in spans_inside_attr])
                        potential_date_strings = [combined_attr_text, span_texts]

                        for text_to_parse in potential_date_strings:
                                if text_to_parse:
                                    parsed_dt = self.parse_date(text_to_parse)
                                    if parsed_dt:
                                        date = parsed_dt
                                        break
                        if date:
                            date_text = combined_attr_text or span_texts 

                    # Fallback if b_attribution had no date
                    if not date:
                        fallback_selectors = [".b_meta .b_fact", ".b_fact"]
                        for selector in fallback_selectors:
                            date_tag = item.select_one(selector)
                            if date_tag:
                                temp_text = date_tag.get_text(strip=True)
                                if temp_text and any(char.isdigit() for char in temp_text):
                                    parsed_dt = self.parse_date(temp_text)
                                    if parsed_dt:
                                        date = parsed_dt
                                        date_text = temp_text
                                        break

                # parsing title, url, snippet
                if a_tag:
                    title = a_tag.get_text(strip=True)
                    url = self.clean_bing_url(a_tag.get("href", ""))
                if snippet_tag:
                    snippet = snippet_tag.get_text(strip=True)

            except Exception as e:
                self.log.warning(f"Error parsing item structure: {e} - HTML: {item.prettify()[:200]}")
                continue

            # Final date parsin attempt
            if not date and date_text:
                parsed_dt_final = self.parse_date(date_text)
                if parsed_dt_final:
                    date = parsed_dt_final

            # Final fallback: Parse the snippet text
            if not date and snippet:
                parsed_dt_snippet = self.parse_date(snippet)
                if parsed_dt_snippet:
                    date = parsed_dt_snippet
            
            # Webpage parsing fallback (in case no date found yet)
            if not date and url:
                date_from_page = self.parse_web_page_for_date(url, session)
                if date_from_page:
                    date = date_from_page

            # Only add if both title, url, and a valid date exist
            if title and url and date:
                results.append({
                    "title": title,
                    "url": url,
                    "snippet": snippet,
                    "date": date.strftime("%Y-%m-%d")
                })
            elif title or url:
                self.log.debug(f"Skipping result without date: Title='{title}', URL='{url}'")



        if not results and html: 
            self.log.warning(f"No results parsed from page. Container selectors '{container_selectors}' might be outdated.")

        return results

    def search_bing(self, query: str, num_results: int = DEFAULT_NUM_RESULTS, search_type: str = 'news') -> List[Dict[str, str]]:
        """
        Keeps fetching pages until 'num_results' WITH DATES are collected.
        Skips results without dates entirely.
        """
        results: List[Dict[str, str]] = []
        per_page = 10
        page = 0

        with StealthSession() as session:
            if hasattr(session, "headers"):
                session.headers.setdefault("User-Agent", self.USER_AGENT_FALLBACK)

            while len(results) < num_results:
                first = page * per_page + 1
                url = self.build_bing_search_url(query, first)

                try:
                    resp = session.get(url, timeout=15)
                except Exception as e:
                    self.log.warning(f"Request failed: {e}")
                    break

                if getattr(resp, "status_code", 200) != 200:
                    self.log.warning(f"Non-200 response: {resp.status_code}")
                    break

                html = getattr(resp, "text", "")
                page_results = self.parse_bing_results(html, search_type=search_type, session=session)

                # Only keep those with valid dates
                dated_results = [r for r in page_results if r.get("date")]

                self.log.info(f"Parsed {len(page_results)} results from page {page+1}, {len(dated_results)} with dates.")

                results.extend(dated_results)

                if not page_results:
                    self.log.warning("No results found on this page. Stopping search.")
                    break

                # Stop if we’ve reached the goal
                if len(results) >= num_results:
                    break

                # Delay and move to next page
                self.random_delay()
                page += 1

        return results[:num_results]

    @staticmethod
    def get_oldest_result(results: List[Dict[str, str]]) -> Optional[Dict[str, str]]:
        dated_results = [r for r in results if r.get("date")]
        if not dated_results:
            return None
        return min(dated_results, key=lambda x: datetime.strptime(x["date"], "%Y-%m-%d"))