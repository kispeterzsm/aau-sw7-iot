import requests
import json

import configparser
from fastapi import FastAPI
from pydantic import BaseModel
from web import get_site_data, WebScraping
from model_server.article_conversions import article_to_dict

CONFIG = configparser.ConfigParser()
CONFIG_FILE_PATH = 'backend/settings.cfg'
CONFIG.read(CONFIG_FILE_PATH)
print(CONFIG.get('endpoints', 'nlp_url'))

# from fastapi.middleware.cors import CORSMiddleware

# start app
app = FastAPI(title="Local NLP Service")
scraper = WebScraping()
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

    article = get_site_data(data.input)
    url = CONFIG.get('endpoints', 'nlp_url')

    request_response = requests.post(url, json=article_to_dict(article))
    print(f'{str(request_response)}\n\n\n\n\n', flush=True)
    if(request_response.status_code == 200):

        for query in request_response:
            print(f'{query}\n\n\n\n\n', flush=True)

            # Call search_bing, but only capture the first list (results_with_dates)
            results_with_dates, _ = scraper.search_bing(
                query["search_term"], 
                num_results=data.search_depth,
                num_undated_target=0,
                search_type='news'
            )
            query["results"] = results_with_dates

    return {"result": request_response}


@app.post("/link/websites")
def link_websites(data: Input):
    """
    Fetch content, run NLP, and return ONLY website sources undated results
    """
    # process the text

    article = get_site_data(data.input)
    url = CONFIG.get('endpoints', 'nlp_url')

    request_response = requests.post(url, json=article_to_dict(article))
    print(f'{str(request_response.content)}', flush=True)
    decoded = request_response.content.decode("utf-8")
    queries_response = json.loads(decoded)
    print(queries_response)
    if(request_response.status_code == 200):
        for query in queries_response:
            # Call search_bing, but only capture the second list (websites_without_dates)
            _, websites_without_dates = scraper.search_bing(
                query["search_term"], 
                num_results=0,
                num_undated_target=data.search_depth,
                search_type='web'
            )
            query["results"] = websites_without_dates

    return {"result": queries_response}

@app.post("/text")
def text(data: Input):
    """
    Bypasses nlp and searches directly
    """
    #TODO
    output = {"message": "Endpoint not implemented"} 

    return {"result": output}
