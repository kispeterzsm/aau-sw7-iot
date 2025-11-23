# Web Search Module

A lightweight and stealthy Python service for scraping Bing search results. It acts as the primary gateway for the system, handling text processing requests and passing heavy NLP tasks to a separate GPU service.

- **Input:** A URL or raw text.
- **Output:** A list of relevant search results (news & web) and the oldest source found.

## Setup (Docker)

This module runs as a standard lightweight Python container (CPU only).

### Build & Run
Run the full stack (including the NLP service) using Docker Compose:

```bash
docker-compose up --build
```

## Usage & Testing
To test the web search module an authentication token is required in order to bypass the ngrok tunneling and the body that the api requests is the folowing:

```
{
  "input": "https://english.alarabiya.net/News/world/2025/11/23/trump-says-ukraine-has-expressed-no-gratitude-for-us-efforts",
  "search_depth": 1,
  "market": "Italy"
}
```

The market parameter is optional and has been coded to be user friendly (e.g. Italy -> it-IT)

And the expected results should be the following:

```
{
    "warning": "...",
    "result": [
        {
            "sentence": "...",
            "importance": 3,
            "search_term": "...",
            "news_results": [
                {
                    "title": "...",
                    "url": "...",
                    "snippet": "...",
                    "date": "YYYY-MM-DD"
                }
            ],
            "website_results": [
                {
                    "title": "...",
                    "url": "...",
                    "snippet": "..."
                }
            ]
        }
    ],
    "oldest_result": {
        "title": "...",
        "url": "...",
        "snippet": "...",
        "date": "YYYY-MM-DD"
    }
}
```