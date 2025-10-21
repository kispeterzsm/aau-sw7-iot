import os
from fastapi import FastAPI
from pydantic import BaseModel
from nlp import NLP_Pipeline
from web import get_site_data, WebScraping

# start app
app = FastAPI(title="Local NLP Service")

# load env variables
HF_TOKEN = os.getenv("HF_TOKEN")

# download models, etc.
print("Initializing...")
scraper = WebScraping()
nlp_pipe = NLP_Pipeline(HF_TOKEN)

class Input(BaseModel):
    text: str
    url: str
    search_depth: int # how many websearch results do you want

@app.post("/link")
def link(data: Input):
    """
    Fetch content from the web and process it using the local LLM.
    """
    # process the text
    article=get_site_data(data.url)
    queries=nlp_pipe.do_the_thing(article)

    # do the websearch
    for query in queries:
        results=scraper.search_bing(query["search_term"], num_results=data.search_depth)
        for result in results:
            if result["date"] is None:
                result["date"]=get_site_data(result["url"]).publish_date
        query["results"] = results

    return {"result": queries}

@app.post("/text")
def text(data: Input):
    """
    Bypasses nlp and searches directly
    """

    #TODO

    return {"result": output}
