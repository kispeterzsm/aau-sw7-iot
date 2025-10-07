# Webscraping module

This module is responsible for searching the internet, as well as downloading pages and extracting data from them.

## Site content

Responsible for loading content from a given URL.
You can do this in the following way:
```python
from web import get_site_data

website = get_site_data(url)
print(website.text) # the main text of the page
print(website.publish_date) # the time the page was published
```