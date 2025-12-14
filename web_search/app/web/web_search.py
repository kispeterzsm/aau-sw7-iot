import time
import logging
import dateparser
from datetime import datetime
from typing import List, Dict, Optional, Tuple
from urllib.parse import parse_qs, quote_plus, unquote, urlparse
from bs4 import BeautifulSoup
from stealth_requests import StealthSession
from deep_translator import GoogleTranslator
from langdetect import detect, LangDetectException
#from htmldate import find_date

class WebScraping:
    DEFAULT_NUM_RESULTS = 100
    DEFAULT_UNDATED_NUM_RESULTS = 15

    def __init__(self):
        self.log = logging.getLogger("WebScraping Class")
        logging.basicConfig(level=logging.DEBUG)
        self.interrupt = False
        
    def interrupt_search(self):
        """
        User can manually interrupt the search
        """
        self.interrupt = True

    def _translate_result(self, title: str, snippet: str) -> Tuple[str, str, Optional[str]]:
        """
        Translates title and snippet if they are not in English.
        Returns: translated_title, translated_snippet, original_lang_code
        """
        if not title:
            return title, snippet, None

        try:
            lang = detect(title)
            
            if lang == 'en':
                return title, snippet, None

            translator = GoogleTranslator(source='auto', target='en')
            to_translate = [title or "", snippet or ""]
            translations = translator.translate_batch(to_translate)
            translated_title, translated_snippet = translations[0], translations[1]
            if not translated_title:
                return title, snippet, None
            return translated_title, translated_snippet, lang
        except LangDetectException:
            return title, snippet, None
        except Exception as e:
            self.log.warning(f"Translation failed for '{title}': {e}")
            return title, snippet, None

    @staticmethod
    def build_bing_search_url(query: str, first: int = 0, market: Optional[str] = None) -> str:
        safe_q = quote_plus(query)
        url = f"https://www.bing.com/search?q={safe_q}&first={first}"
        if market:
            url += f"&mkt={market}"
        return url
        
    @staticmethod
    def parse_bing_date(text: str) -> Optional[datetime]:
        """
        Extracts the date from text using dateparser
        """
        if not text:
            return None

        text_lower = text.lower()
        return dateparser.parse(text_lower)

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

    '''
    # Gets the publication date from a website

    def get_date_from_url(self, url: str) -> Optional[datetime]:
        """
        Uses the htmldate to find publication date of a webpage
        """
        if not url:
            return None
        try:
            date_string = find_date(url) 
            if date_string:
                return datetime.strptime(date_string, "%Y-%m-%d")
            else:
                self.log.debug(f"No date found for {url}")
                return None
        except Exception as e:
            self.log.warning(f"Error using htmldate on {url}")
            return None
    '''

    def parse_bing_results(self, html: str, search_type: str) -> Tuple[List[Dict[str, str]], List[Dict[str, str]]]:
        """
        Parses Bing SERP Elements to retrieve title, url, snippet and date
        """
        soup = BeautifulSoup(html, "lxml")
        results_with_date = []
        websites = []

        container_selectors = ".news-card, li.b_algo"
        if search_type == 'web':
            container_selectors = "li.b_algo"

        for item in soup.select(container_selectors):
            title, url, snippet = None, None, ""
            date = None
            date_text = ""
            a_tag = None 

            try:
                # news-card structure
                if item.name == 'div' and 'news-card' in item.get('class', []):
                    a_tag = item.find("a", class_="title")
                    snippet_tag = item.find("div", class_="snippet")
                    date_tag = item.find("span", class_="news_dt") 
                    if date_tag:
                        date_text = date_tag.get_text(strip=True)

                # li.b_algo structure
                elif item.name == 'li' and 'b_algo' in item.get('class', []):
                    h2 = item.find("h2")
                    a_tag = h2.find("a") if h2 else None
                    snippet_tag = item.select_one(".b_caption p") or item.find("p")

                    # Logic to scrape date text from attribution/metadata elements
                    attribution_tag = item.select_one(".b_attribution")
                    if attribution_tag:
                        all_attr_texts = [text.strip() for text in attribution_tag.find_all(string=True, recursive=False)]
                        combined_attr_text = " ".join(filter(None, all_attr_texts))
                        spans_inside_attr = attribution_tag.find_all('span')
                        span_texts = " ".join([span.get_text(strip=True) for span in spans_inside_attr])
                        
                        for text_to_parse in [combined_attr_text, span_texts]:
                            if text_to_parse and any(char.isdigit() for char in text_to_parse):
                                date_text = text_to_parse
                                break
                    
                    if not date_text:
                        fallback_tags = item.select(".b_meta .b_fact, .b_fact, .news_dt")
                        for date_tag in fallback_tags:
                            temp_text = date_tag.get_text(strip=True)
                            if temp_text and any(char.isdigit() for char in temp_text):
                                date_text = temp_text
                                break
                
                # Parsing title, url, snippet
                if a_tag:
                    title = a_tag.get_text(strip=True)
                    url = self.clean_bing_url(a_tag.get("href", ""))
                if snippet_tag:
                    snippet = snippet_tag.get_text(strip=True)

            except Exception as e:
                self.log.warning(f"Error parsing item structure: {e} - HTML: {item.prettify()[:200]}")
                continue

            # Language detection
            original_title_text = title
            original_snippet_text = snippet
            translated_title, translated_snippet, original_lang = self._translate_result(original_title_text, original_snippet_text)
            title = translated_title
            snippet = translated_snippet

            if date_text:
                date = self.parse_bing_date(date_text)
            
            # Sort into the correct list
            if title and url and date:
                result_data = {
                    "title": title,
                    "url": url,
                    "snippet": snippet,
                    "date": date.strftime("%Y-%m-%d")
                }
                
                if original_lang:
                    result_data["title"] = f"{title} (original language source: {original_lang})"
                    result_data["original_title"] = original_title_text 
                    result_data["original_snippet"] = original_snippet_text 
                    result_data["original_language"] = original_lang
                
                results_with_date.append(result_data)
                
            elif title or url:
                # Website dates
                web_data = {
                    "title": title,
                    "url": url,
                    "snippet": snippet,
                }
                if original_lang:
                    web_data["title"] = f"{title} (original language source: {original_lang})"
                    web_data["original_title"] = original_title_text
                    web_data["original_snippet"] = original_snippet_text 
                    web_data["original_language"] = original_lang
                    
                websites.append(web_data)

        if not results_with_date and not websites and html: 
            self.log.warning(f"No results parsed from page. Container selectors '{container_selectors}' might be outdated.")

        return results_with_date, websites

    def search_bing(
        self,
        query: str,
        num_results: int = DEFAULT_NUM_RESULTS,
        num_undated_target: int = DEFAULT_UNDATED_NUM_RESULTS,
        search_type: str = 'news',
        market: Optional[str] = None,
        entities: Optional[List[Dict[str, str]]] = None
    ) -> Tuple[List[Dict[str, str]], List[Dict[str, str]]]:
        """
        - Detects language and sets region.
        - User can override market.
        - If detection fails, fallback to english (standard).
        """
        results_with_dates: List[Dict[str, str]] = []
        websites_without_dates: List[Dict[str, str]] = []

        seen_urls = set()
        per_page = 10
        page = 0

        # Limits to prevent prolonged waiting times
        MAX_PAGES = 100
        MAX_DURATION_SEC = 90
        start_time = time.time()
        
        # Reset the interrupt
        self.interrupt = False

        if market is None:
            self.log.warning(f"Language detection failed for '{query}', defaulting to US market.")
            final_market = "en-US"
        else: final_market = market

        with StealthSession() as session:
            while ((len(results_with_dates) < num_results or len(websites_without_dates) < num_undated_target) 
                    and page < MAX_PAGES
                    # timeout in case it takes too much time
                    and (time.time() - start_time <= MAX_DURATION_SEC)):
                
                #if time.time() - start_time > MAX_DURATION_SEC:
                #    self.log.warning(f"Search timed out after {MAX_DURATION_SEC} seconds. Returning partial results.")
                #    break
                
                # User interrupts search
                if self.interrupt: 
                    self.log.info('Search interrupted by user')
                    break

                first = page * per_page + 1
                url = self.build_bing_search_url(query, first, market=final_market)
                self.log.info(f"Fetching {url} ...")

                try:
                    resp = session.get(url, timeout=15)
                except Exception as e:
                    self.log.warning(f"Request failed: {e}")
                    break

                if resp.status_code != 200:
                    self.log.warning(f"Error: {resp.status_code}")
                    break

                html = getattr(resp, "text", "")
                
                page_dated_results, page_undated_websites = self.parse_bing_results(
                    html, search_type=search_type 
                ) 

                if not page_dated_results and not page_undated_websites:
                    self.log.warning("No results found on this page. Stopping search.")
                    break

                # Add to the list only different urls, prevents duplication
                for result in page_dated_results:
                    if result['url'] not in seen_urls and len(results_with_dates) < num_results:
                        results_with_dates.append(result)
                        seen_urls.add(result['url'])

                for result in page_undated_websites:
                    if result['url'] not in seen_urls and len(websites_without_dates) < num_undated_target:
                        websites_without_dates.append(result)
                        seen_urls.add(result['url'])

                if len(results_with_dates) >= num_results and len(websites_without_dates) >= num_undated_target:
                    self.log.info("Both dated and undated result targets met. Stopping search.")
                    break
                page += 1

        return results_with_dates[:num_results], websites_without_dates[:num_undated_target]

    @staticmethod
    def get_oldest_result(dated_results: List[Dict[str, str]]) -> Optional[Dict[str, str]]:
        if not dated_results:
            return None
        return min(dated_results, key=lambda x: datetime.strptime(x["date"], "%Y-%m-%d"))