from newspaper import Article
from typing import Tuple
from langdetect import detect, DetectorFactory
# Using stealthsession to avoid detection because download is not working anymore
from stealth_requests import StealthSession 

DetectorFactory.seed = 0

def get_site_data(url: str) -> Tuple[Article, str]:
    print(f"Stealth downloading: {url}")
    with StealthSession() as session:
        response = session.get(url, timeout=15)
        response.raise_for_status()
        html_content = response.text

    article = Article(url)
    article.set_html(html_content)
    article.parse()
    
    try:
        lang = detect(article.text)
    except:
        lang = 'en'
        
    return article, lang