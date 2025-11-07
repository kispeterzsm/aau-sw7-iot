import os
from fastapi import FastAPI
from pydantic import BaseModel
from nlp import NLP_Pipeline
from web import get_site_data, WebScraping
# from fastapi.middleware.cors import CORSMiddleware

# start app
app = FastAPI(title="Local NLP Service")

# load env variables
HF_TOKEN = os.getenv("HF_TOKEN")

# download models, etc.
print("Initializing...")
scraper = WebScraping()
nlp_pipe = NLP_Pipeline(HF_TOKEN)

# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=[
#         "http://localhost:3000",
#         "http://127.0.0.1:3000",
#         "http://frontend:3000",
#     ],
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )

class Input(BaseModel):
    input: str
    search_depth: int # how many websearch results do you want  

@app.post("/link/news")
def link_news(data: Input):
    """
    Fetch content, run NLP, and return ONLY news sources (dated results).
    """
    article=get_site_data(data.input)
    queries=nlp_pipe.do_the_thing(article)

    for query in queries:
        # Call search_bing, but only capture the first list (results_with_dates)
        results_with_dates, _ = scraper.search_bing(
            query["search_term"], 
            num_results=data.search_depth,
            num_undated_target=0,
            search_type='news'
        )
        query["results"] = results_with_dates

    return {"result": queries}


@app.post("/link/websites")
def link_websites(data: Input):
    """
    Fetch content, run NLP, and return ONLY website sources undated results
    """
    # process the text
    article=get_site_data(data.input)
    queries=nlp_pipe.do_the_thing(article)

    for query in queries:
        # Call search_bing, but only capture the second list (websites_without_dates)
        _, websites_without_dates = scraper.search_bing(
            query["search_term"], 
            num_results=0,
            num_undated_target=data.search_depth,
            search_type='web'
        )
        query["results"] = websites_without_dates

    return {"result": queries}

@app.post("/text")
def text(data: Input):
    """
    Bypasses nlp and searches directly
    """
    #TODO
    output = {"message": "Endpoint not implemented"} 

    return {"result": output}