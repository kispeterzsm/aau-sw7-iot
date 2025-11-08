import os
from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from nlp import NLP_Pipeline
from web import WebScraping
from typing import List, Dict, Any, Optional
from contextlib import asynccontextmanager
import torch
import asyncio
from dotenv import load_dotenv
import json
from pathlib import Path
import uvicorn
from newspaper import Article
from web.sitecontent import get_site_data
from langdetect import detect


# Directory
BASE_DIR = Path(__file__).parent

# Load env variables
load_dotenv()

# Models list and market map
ml_models = {}
MARKET_MAP = {}

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Load models and market map on startup and keep them in memory.
    """
    global MARKET_MAP

    print("Initializing...")

    HF_TOKEN = os.getenv("HF_TOKEN")
    if not HF_TOKEN:
        print("Warning: HF_TOKEN environment variable not set.")

    ml_models["scraper"] = WebScraping()
    ml_models["nlp_pipe"] = NLP_Pipeline(HF_TOKEN)

    market_map_path = BASE_DIR / "market_map.json"

    # Load the market map
    try:
        with open(market_map_path, "r") as f:
            MARKET_MAP = json.load(f)
        print(f"Successfully loaded {len(MARKET_MAP)} market mappings.")
    except Exception as e:
        print(f"FATAL ERROR: Could not load market_map.json: {e}")

    print("Initialization Complete.")

    yield

    print("Cleaning up models...")
    ml_models.clear()
    torch.cuda.empty_cache()

app = FastAPI(title="NLP Service", lifespan=lifespan)
AUTH_TOKEN_NGROK = os.getenv("AUTH_TOKEN_NGROK")


@app.get("/health")
def health_check():
    """
    A public endpoint to check if the server is alive
    and if the GPU is detected.
    """
    return {"status": "ok", "gpu_available": torch.cuda.is_available()}


@app.middleware("http")
async def verify_token(request: Request, call_next):
    if request.url.path == "/health":
        response = await call_next(request)
        return response

    token = request.headers.get("x-auth-token") or request.query_params.get("token")

    if not AUTH_TOKEN_NGROK:
        print("FATAL ERROR: AUTH_TOKEN_NGROK environment variable is not set on the server.")
        return JSONResponse(status_code=500, content={"error": "Server configuration error"})
        
    if token != AUTH_TOKEN_NGROK:
        return JSONResponse(status_code=403, content={"error": "Forbidden: Invalid or missing token"})
    
    response = await call_next(request)
    return response


class Input(BaseModel):
    input: str
    search_depth: int
    market: Optional[str] = None


class TextResponse(BaseModel):
    warning: Optional[str] = None
    result: List[Dict[str, Any]]
    oldest_result: Optional[Dict[str, Any]] = None


class CombinedResponse(BaseModel):
    warning: Optional[str] = None
    result: List[Dict[str, Any]]
    oldest_result: Optional[Dict[str, Any]] = None


def _get_market_code(user_input: Optional[str]) -> Optional[str]:
    """Translates user-friendly market input to an official code."""
    if not user_input:
        return None

    user_market_key = user_input.lower()
    code = MARKET_MAP.get(user_market_key)

    if code:
        return code

    return user_input


async def _process_text_input(text_input: str) -> dict:
    nlp_pipe = ml_models["nlp_pipe"]
    
    text_input = text_input.strip()
    words = text_input.split()
    
    queries = []
    warning_message = None

    if len(words) <= 3:
        warning_message = "Input is very short. Search results may not be accurate for origin tracing."
        # Still
        queries = await asyncio.to_thread(nlp_pipe.do_the_thing, text_input, top_x=1)
    elif len(text_input.split('.')) <= 2: # Check if it's a single sentence
        queries = await asyncio.to_thread(nlp_pipe.do_the_thing, text_input, top_x=1)
    else:
        queries = await asyncio.to_thread(nlp_pipe.do_the_thing, text_input, top_x=3)
    
    return {"queries": queries, "warning": warning_message}


@app.post("/link/all", response_model=CombinedResponse)
async def link_all(data: Input):
    nlp_pipe = ml_models["nlp_pipe"]
    scraper = ml_models["scraper"]

    try:
        original_lang = detect(data.input)
    except:
        original_lang = 'en'

    try:
        article, original_lang = await asyncio.to_thread(get_site_data, data.input)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to fetch article: {e}")

    final_market = _get_market_code(data.market) or _get_market_code(original_lang)

    queries = await asyncio.to_thread(nlp_pipe.do_the_thing, article)
    all_dated_results = []

    for query in queries:
        results_with_dates, websites_without_dates = await asyncio.to_thread(
            scraper.search_bing,
            query["search_term"],
            num_results=data.search_depth,
            num_undated_target=data.search_depth,
            market=final_market
        )

        query["news_results"] = results_with_dates
        query["website_results"] = websites_without_dates
        all_dated_results.extend(results_with_dates)

    oldest = await asyncio.to_thread(scraper.get_oldest_result, all_dated_results)
    return {"warning": None, "result": queries, "oldest_result": oldest}


@app.post("/text/all", response_model=CombinedResponse)
async def text_all(data: Input):
    scraper = ml_models["scraper"]
    processed_input = await _process_text_input(data.input)
    queries = processed_input["queries"]
    final_market = _get_market_code(data.market)
    all_dated_results = []

    for query in queries:
        results_with_dates, websites_without_dates = await asyncio.to_thread(
            scraper.search_bing,
            query["search_term"],
            num_results=data.search_depth,
            num_undated_target=data.search_depth,
            market=final_market
        )

        query["news_results"] = results_with_dates
        query["website_results"] = websites_without_dates
        all_dated_results.extend(results_with_dates)

    oldest = await asyncio.to_thread(scraper.get_oldest_result, all_dated_results)
    return {"warning": processed_input["warning"], "result": queries, "oldest_result": oldest}


@app.post("/link/news", response_model=TextResponse)
async def link_news(data: Input):
    nlp_pipe = ml_models["nlp_pipe"]
    scraper = ml_models["scraper"]

    try:
        article, original_lang = await asyncio.to_thread(get_site_data, data.input)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to fetch article: {e}")

    queries = await asyncio.to_thread(nlp_pipe.do_the_thing, article)
    final_market = _get_market_code(data.market) or _get_market_code(original_lang)
    all_dated_results = []

    for query in queries:
        results_with_dates, _ = await asyncio.to_thread(
            scraper.search_bing,
            query["search_term"],
            num_results=data.search_depth,
            num_undated_target=0,
            search_type="news",
            market=final_market
        )
        query["results"] = results_with_dates
        all_dated_results.extend(results_with_dates)

    oldest = await asyncio.to_thread(scraper.get_oldest_result, all_dated_results)
    return {"warning": None, "result": queries, "oldest_result": oldest}


@app.post("/link/websites", response_model=TextResponse)
async def link_websites(data: Input):
    nlp_pipe = ml_models["nlp_pipe"]
    scraper = ml_models["scraper"]

    try:
        article, original_lang = await asyncio.to_thread(get_site_data, data.input)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to fetch article: {e}")

    queries = await asyncio.to_thread(nlp_pipe.do_the_thing, article)
    final_market = _get_market_code(data.market) or _get_market_code(original_lang)

    for query in queries:
        _, websites_without_dates = await asyncio.to_thread(
            scraper.search_bing,
            query["search_term"],
            num_results=0,
            num_undated_target=data.search_depth,
            search_type="web",
            market=final_market
        )
        query["results"] = websites_without_dates

    return {"warning": None, "result": queries, "oldest_result": None}


@app.post("/text/news", response_model=TextResponse)
async def text_news(data: Input):
    scraper = ml_models["scraper"]

    processed_input = await _process_text_input(data.input)
    queries = processed_input["queries"]
    final_market = _get_market_code(data.market)
    all_dated_results = []

    for query in queries:
        results_with_dates, _ = await asyncio.to_thread(
            scraper.search_bing,
            query["search_term"],
            num_results=data.search_depth,
            num_undated_target=0,
            search_type="news",
            market=final_market
        )

        query["results"] = results_with_dates
        all_dated_results.extend(results_with_dates)

    oldest = await asyncio.to_thread(scraper.get_oldest_result, all_dated_results)
    return {"warning": processed_input["warning"], "result": queries, "oldest_result": oldest}


@app.post("/text/websites", response_model=TextResponse)
async def text_websites(data: Input):
    scraper = ml_models["scraper"]

    processed_input = await _process_text_input(data.input)
    queries = processed_input["queries"]
    final_market = _get_market_code(data.market)

    for query in queries:
        _, websites_without_dates = await asyncio.to_thread(
            scraper.search_bing,
            query["search_term"],
            num_results=0,
            num_undated_target=data.search_depth,
            search_type="web",
            market=final_market
        )
        query["results"] = websites_without_dates

    return {"warning": processed_input["warning"], "result": queries, "oldest_result": None}