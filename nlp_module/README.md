# NLP Module

The NLP module is responsible for creating a list of search queries.

- `Input:` A piece of text, for example a new article.
- `Output:` A list of web search style strings.

## Setup (Docker)

**Crucial:** You must build the base image **first** to download and cache the heavy model (4GB+).

# Build Base Image (Downloads Model)
# Replace 'your_token' with your actual HuggingFace token
```bash
docker build -f Dockerfile.base --build-arg HF_TOKEN="your_token" -t local/llm-base:v1 .
```
# 2. Run Service
```bash
docker-compose up --build
```

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
    output=nlp_pipe.execute_pipeline(article)
    return output

url=""
url_to_searchterms(url)
```
If you just have text you want to process, run it like this: 

```python
output=nlp_pipe.execute_pipeline(input_text)
print(output)
```