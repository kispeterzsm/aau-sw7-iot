from newspaper import Article
from typing import Tuple
from newspaper import Article
from langdetect import detect, DetectorFactory
DetectorFactory.seed = 0

def get_site_data(url: str) -> Tuple[Article, str]:
    article = Article(url)
    article.download()
    article.parse()
    try:
        # Detect language from the full article text
        lang = detect(article.text)
    except:
        lang = 'en' # Default to english if detection fails
    return article, lang