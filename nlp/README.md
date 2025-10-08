# NLP Module

The NLP module is responsible for creating a list of search queries.

- `Input:` A piece of text, for example a new article.
- `Output:` A list of web search style strings.

## Usage

Create a HuggingFace token which allows you to access Gemma models. Afterwards, run this code when the program starts up. This will take a few minutes to load. __Cuda compatible GPU required!!!__

```python
from nlp import NLP_Pipeline

nlp_pipe = NLP_Pipeline(hf_token)
```
If you have a URL to an article, do something like this:
```python
from nlp import NLP_Pipeline
from web import get_site_data

hf_token=""
nlp_pipe = NLP_Pipeline(hf_token)

def url_to_searchterms(url:str, top_x:int=5):
    article=get_site_data(url)
    output=nlp_pipe.do_the_thing(article)
    return output

url=""
url_to_searchterms(url)
```
If you just have text you want to process, run it like this: 

```python
output=nlp_pipe.do_the_thing(input_text)
print(output)
```