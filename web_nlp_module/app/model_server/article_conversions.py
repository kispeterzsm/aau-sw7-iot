from datetime import datetime

from newspaper import Article


def article_to_dict(article: Article) -> dict:
    """
    Turns an article object into a dict
    """
    return {
        "input": {
            "url": article.url,
            "title": article.title,
            "text": article.text,
            "authors": article.authors,
            "publish_date": article.publish_date.isoformat() if article.publish_date else None,
            "top_image": article.top_image,
        }
    }


def dict_to_article(input_dict : dict) -> Article:
    """
    Turns a dict into an article object
    """
    article_data = input_dict["input"]

    # Recreate the Article object
    article = Article(article_data["url"])

    # Manually populate its attributes
    article.title = article_data.get("title")
    article.text = article_data.get("text")
    article.authors = article_data.get("authors") or []
    article.top_image = article_data.get("top_image")

    # Convert publish_date back to datetime
    if article_data.get("publish_date"):
        article.publish_date = datetime.fromisoformat(article_data["publish_date"])
    else:
        article.publish_date = None

    article.is_downloaded = True
    article.download_state = 2
    article.is_parsed = True

    return article