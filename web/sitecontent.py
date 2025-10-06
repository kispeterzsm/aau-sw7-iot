from newspaper import Article

def get_article_text(url):
    """
    Extracts the main article text using newspaper3k.
    Handles most news sites very well.
    """
    article = Article(url)
    article.download()
    article.parse()
    return article.text