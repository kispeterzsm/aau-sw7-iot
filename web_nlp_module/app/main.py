import os
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from nlp import NLP_Pipeline
from web import get_site_data, WebScraping
from typing import List, Dict, Any, Optional
from contextlib import asynccontextmanager
import torch
import asyncio

# models list
ml_models = {}

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Load models on startup and keep them in memory.
    """
    print("Initializing...")
    HF_TOKEN = os.getenv("HF_TOKEN")
    if not HF_TOKEN:
        print("Warning: HF_TOKEN environment variable not set.")
        
    ml_models["scraper"] = WebScraping()
    ml_models["nlp_pipe"] = NLP_Pipeline(HF_TOKEN)
    
    print("Initialization Complete.")
    yield
    print("Cleaning up models...")
    ml_models.clear()
    torch.cuda.empty_cache()

app = FastAPI(title="NLP Service", lifespan=lifespan)

class Input(BaseModel):
    input: str
    # default to 100 if there is no input
    search_depth: int

# in case users asks only for one or the other
class TextResponse(BaseModel):
    """Response for single-type search (news OR web)"""
    warning: Optional[str] = None
    result: List[Dict[str, Any]]

# in case the users would like to view the combined list
class CombinedResponse(BaseModel):
    """New response for combined search (news AND web)"""
    warning: Optional[str] = None
    result: List[Dict[str, Any]]

async def _process_text_input(text_input: str) -> dict:
    """
    Implements your text classification logic.
    Analyzes text and returns search queries and a warning if needed.
    """
    nlp_pipe = ml_models["nlp_pipe"]
    
    text_input = text_input.strip()
    words = text_input.split()
    
    queries = []
    warning_message = None

    if len(words) <= 3:
        warning_message = "Input is very short. Search results may not be accurate for origin tracing."
        queries = [{"sentence": text_input, "search_term": text_input}]
    else:
        sentences = await asyncio.to_thread(nlp_pipe.split_into_sentences, text_input)
        
        if len(sentences) == 1:
            queries = [{"sentence": text_input, "search_term": text_input}]
        else:
            queries = await asyncio.to_thread(nlp_pipe.do_the_thing, text_input, top_x=3)
    
    return {"queries": queries, "warning": warning_message}

@app.post("/link/all", response_model=CombinedResponse)
async def link_all(data: Input):
    """
    Fetch content, run NLP ONCE, and return both news and website sources
    """
    nlp_pipe = ml_models["nlp_pipe"]
    scraper = ml_models["scraper"]
    
    try:
        article = await asyncio.to_thread(get_site_data, data.input)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to fetch article: {e}")
    
    queries = await asyncio.to_thread(nlp_pipe.do_the_thing, article)

    for query in queries:
        results_with_dates, websites_without_dates = await asyncio.to_thread(
            scraper.search_bing,
            query["search_term"], 
            num_results=data.search_depth,
            num_undated_target=data.search_depth,
            search_type='web'
        )
        
        query["news_results"] = results_with_dates
        query["website_results"] = websites_without_dates

    return {"warning": None, "result": queries}


@app.post("/text/all", response_model=CombinedResponse)
async def text_all(data: Input):
    """
    Analyzes raw text and returns both news and website results
    """
    scraper = ml_models["scraper"]
    
    processed_input = await _process_text_input(data.input)
    queries = processed_input["queries"]
    
    for query in queries:
        results_with_dates, websites_without_dates = await asyncio.to_thread(
            scraper.search_bing,
            query["search_term"], 
            num_results=data.search_depth,
            num_undated_target=data.search_depth,
            search_type='web'
        )
        
        query["news_results"] = results_with_dates
        query["website_results"] = websites_without_dates
    
    return {"warning": processed_input["warning"], "result": queries}



@app.post("/link/news", response_model=TextResponse)
async def link_news(data: Input):
    """
    Fetch content and return ONLY news sources.
    """
    nlp_pipe = ml_models["nlp_pipe"]
    scraper = ml_models["scraper"]
    
    article = await asyncio.to_thread(get_site_data, data.input)
    queries = await asyncio.to_thread(nlp_pipe.do_the_thing, article)

    for query in queries:
        results_with_dates, _ = await asyncio.to_thread(
            scraper.search_bing,
            query["search_term"], 
            num_results=data.search_depth,
            num_undated_target=0,
            search_type='news'
        )
        query["results"] = results_with_dates

    return {"warning": None, "result": queries}


@app.post("/link/websites", response_model=TextResponse)
async def link_websites(data: Input):
    """
    Fetch content and return ONLY website sources.
    """
    nlp_pipe = ml_models["nlp_pipe"]
    scraper = ml_models["scraper"]
    
    article = await asyncio.to_thread(get_site_data, data.input)
    queries = await asyncio.to_thread(nlp_pipe.do_the_thing, article)

    for query in queries:
        _, websites_without_dates = await asyncio.to_thread(
            scraper.search_bing,
            query["search_term"], 
            num_results=0,
            num_undated_target=data.search_depth,
            search_type='web'
        )
        query["results"] = websites_without_dates

    return {"warning": None, "result": queries}

@app.post("/text/news", response_model=TextResponse)
async def text_news(data: Input):
    """
    Analyzes raw text and returns ONLY news results.
    """
    scraper = ml_models["scraper"]
    
    processed_input = await _process_text_input(data.input)
    queries = processed_input["queries"]
    
    for query in queries:
        results_with_dates, _ = await asyncio.to_thread(
            scraper.search_bing,
            query["search_term"], 
            num_results=data.search_depth,
            num_undated_target=0,
            search_type='news'
        )
        query["results"] = results_with_dates
    
    return {"warning": processed_input["warning"], "result": queries}


@app.post("/text/websites", response_model=TextResponse)
async def text_websites(data: Input):
    """
    Analyzes raw text and returns ONLY website results.
    """
    scraper = ml_models["scraper"]

    processed_input = await _process_text_input(data.input)
    queries = processed_input["queries"]
    
    for query in queries:
        _, websites_without_dates = await asyncio.to_thread(
            scraper.search_bing,
            query["search_term"], 
            num_results=0,
            num_undated_target=data.search_depth,
            search_type='web'
        )
        query["results"] = websites_without_dates
    
    return {"warning": processed_input["warning"], "result": queries}