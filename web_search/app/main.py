import os
import json
import asyncio
import requests
from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from contextlib import asynccontextmanager
from dotenv import load_dotenv
from pathlib import Path
from web import WebScraping 
from langdetect import detect

# Directory & Env
BASE_DIR = Path(__file__).parent
load_dotenv()

# Configurations
NLP_SERVICE_URL = os.getenv("NLP_SERVICE_URL", "http://nlp-service:8080") 
AUTH_TOKEN_NGROK = os.getenv("AUTH_TOKEN_NGROK")

ml_models = {}
MARKET_MAP = {}

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Initializing Web Search Service...")
    
    ml_models["scraper"] = WebScraping()
    
    market_map_path = BASE_DIR / "market_map.json"
    try:
        if market_map_path.exists():
            with open(market_map_path, "r") as f:
                global MARKET_MAP
                MARKET_MAP = json.load(f)
            print(f"Loaded {len(MARKET_MAP)} markets.")
    except Exception as e:
        print(f"Warning: Could not load the market map: {e}")

    yield
    ml_models.clear()

app = FastAPI(title="Web Search Gateway", lifespan=lifespan)

# --- Middleware ---
@app.middleware("http")
async def verify_token(request: Request, call_next):
    if request.url.path == "/health":
        return await call_next(request)

    token = request.headers.get("x-auth-token") or request.query_params.get("token")
    
    if AUTH_TOKEN_NGROK and token != AUTH_TOKEN_NGROK:
        return JSONResponse(status_code=403, content={"error": "Forbidden: Invalid or missing token"})
    
    return await call_next(request)

# --- Helper ---
def _get_market_code(user_input: Optional[str]) -> Optional[str]:
    if not user_input: return None
    return MARKET_MAP.get(user_input.lower(), user_input)

# --- Inputs ---
class Input(BaseModel):
    input: str 
    search_depth: int
    market: Optional[str] = None

class CombinedResponse(BaseModel):
    warning: Optional[str] = None
    result: List[Dict[str, Any]]
    oldest_result: Optional[Dict[str, Any]] = None

# --- Endpoints ---
@app.get("/health")
def health_check():
    return {"status": "ok"}

@app.post("/link/all", response_model=CombinedResponse)
async def link_all(data: Input):
    scraper = ml_models["scraper"]

    try:
        payload = {
            "article_url": data.input,  # Send URL
            "is_article": True, 
            "top_x": 5, 
            "query_variations": 1 
        }
        
        # Call the GPU service
        response = requests.post(f"{NLP_SERVICE_URL}/process", json=payload)
        response.raise_for_status()
        
        resp_data = response.json()
        queries = resp_data["queries"]
        detected_lang = resp_data.get("detected_lang", "en") 

    except Exception as e:
        print(f"NLP Service Error: {e}")
        if hasattr(e, 'response') and e.response is not None:
             print(f"NLP Response: {e.response.text}")
        raise HTTPException(status_code=500, detail=f"NLP Service Failed: {e}")

    final_market = _get_market_code(data.market) or _get_market_code(detected_lang)

    # 2. Search Bing (Run locally on CPU)
    all_dated_results = []

    for query in queries:
        term = query.get("search_term") 
        
        results_with_dates, websites_without_dates = await asyncio.to_thread(
            scraper.search_bing,
            term,
            num_results=data.search_depth,
            num_undated_target=data.search_depth,
            market=final_market
        )

        query["news_results"] = results_with_dates
        query["website_results"] = websites_without_dates
        all_dated_results.extend(results_with_dates)

    oldest = await asyncio.to_thread(scraper.get_oldest_result, results_with_dates)
    return {"warning": None, "result": queries, "oldest_result": oldest}


@app.post("/text/all", response_model=CombinedResponse)
async def text_all(data: Input):
    scraper = ml_models["scraper"]
    
    text_input = data.input.strip()
    words = text_input.split()
    warning_message = None
    
    queries = []

    # If the sentence is short it will automatically search it instead of passing it to the LLM in order to improve performance
    if len(words) < 5: 
        warning_message = "Input is very short. Searching directly."
        queries = [{"search_term": text_input, "sentence": text_input}]
        data.search_depth = 30

        try:
            original_lang = detect(text_input)
        except:
            original_lang = 'en'
            
    else:
        # If the sentence is long pass it to NLP service
        data.search_depth = 5
        try:
            top_x = 1 if len(text_input.split('.')) <= 2 else 3
            
            payload = {
                "content": text_input, 
                "is_article": False, 
                "top_x": top_x,
                "query_variations": 1
            }
            response = requests.post(f"{NLP_SERVICE_URL}/process", json=payload)
            response.raise_for_status()
            resp_data = response.json()
            queries = resp_data["queries"]
            original_lang = resp_data.get("detected_lang", "en")
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"NLP Service Failed: {e}")

    # Search Bing
    final_market = _get_market_code(data.market) or _get_market_code(original_lang)
    all_dated_results = []

    for query in queries:
        term = query.get("search_term")
        
        results_with_dates, websites_without_dates = await asyncio.to_thread(
            scraper.search_bing,
            term,
            num_results=data.search_depth,
            num_undated_target=data.search_depth,
            market=final_market
        )

        query["news_results"] = results_with_dates
        query["website_results"] = websites_without_dates
        all_dated_results.extend(results_with_dates)

    oldest = await asyncio.to_thread(scraper.get_oldest_result, all_dated_results)
    return {"warning": warning_message, "result": queries, "oldest_result": oldest}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)