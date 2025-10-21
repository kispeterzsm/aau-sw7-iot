# WebScraping

A lightweight and stealthy Python utility for scraping Bing search results. This tool leverages `stealth-requests` to reduce detection and parses search result data, including titles, URLs, snippets, and dates when available. 
The project simulates a web search on Bing and can be used to find the oldest webpage from a list of results.

- `Input:` A search query (string).
- `Output:` A list of search results, or the single oldest result from that list.

---

## Usage
### Example

A simple example that given a string as input it will return the oldest source from a list of 100 webpages.

```python
# --- Example Usage ---
if __name__ == "__main__":
    scraper = WebScraping(verbose=True)
    query = input("Enter a search query: ").strip()
    all_results = scraper.search_bing(query, num_results=100)
    print(f"Fetched {len(all_results)} results.")

    oldest = scraper.get_oldest_result(all_results)
    if oldest:
        print("Oldest result:")
        print(f"Title: {oldest['title']}")
        print(f"URL: {oldest['url']}")
        print(f"Date: {oldest['date']}")
        print(f"Snippet: {oldest['snippet']}")
    else:
        print("No dated results found.")
```

## Site content

Responsible for loading content from a given URL.
You can do this in the following way:
```python
from web import get_site_data

website = get_site_data(url)
print(website.text) # the main text of the page
print(website.publish_date) # the time the page was published
```