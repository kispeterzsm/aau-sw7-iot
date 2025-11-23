import os
import logging
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from contextlib import asynccontextmanager
from dotenv import load_dotenv
import torch
from nlp import NLP_Pipeline, get_site_data
from newspaper import Article

# Load env variables
load_dotenv()

# Setup Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("NLP_Service")

ml_models = {}

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing NLP Service...")
    HF_TOKEN = os.getenv("HF_TOKEN")
    if not HF_TOKEN:
        logger.warning("HF_TOKEN not set. Model download might fail if gated.")

    try:
        ml_models["nlp_pipe"] = NLP_Pipeline(HF_TOKEN)
        logger.info("NLP Model loaded successfully.")
    except Exception as e:
        logger.error(f"Failed to load NLP model: {e}")
        raise e
    yield
    ml_models.clear()
    torch.cuda.empty_cache()

app = FastAPI(title="NLP GPU Service", lifespan=lifespan)

# --- Request Model ---
class ProcessRequest(BaseModel):
    content: Optional[str] = None      # For raw text
    article_url: Optional[str] = None  # For URLs
    is_article: bool = False 
    top_x: int = 5
    query_variations: int = 1

# --- Endpoints ---
@app.get("/health")
def health_check():
    return {"status": "ok", "gpu_available": torch.cuda.is_available()}

@app.post("/process")
def process_content(data: ProcessRequest):
    """
    Accepts text OR url, runs NLP, returns search queries.
    """
    nlp_pipe = ml_models.get("nlp_pipe")
    if not nlp_pipe:
        raise HTTPException(status_code=503, detail="NLP Model not ready")

    try:
        # From /link/all
        if data.article_url:
            logger.info(f"Fetching article from: {data.article_url}")
            article, lang = get_site_data(data.article_url)
            
            # Pass the full article object to the pipeline
            queries = nlp_pipe.do_the_thing(
                article, 
                top_x=data.top_x, 
                query_variations=data.query_variations
            )
            # Return detected lang so Web Service knows which market to use
            return {"queries": queries, "detected_lang": lang}

        # From /text/all
        elif data.content:
            if data.is_article:
                dummy_article = Article("") 
                dummy_article.set_text(data.content)
                dummy_article.set_summary(data.content) 
                queries = nlp_pipe.do_the_thing(dummy_article, top_x=data.top_x, query_variations=data.query_variations)
            else:
                queries = nlp_pipe.do_the_thing(data.content, top_x=data.top_x, query_variations=data.query_variations)
            
            return {"queries": queries, "detected_lang": "en"}

        else:
            raise HTTPException(status_code=400, detail="Must provide 'content' or 'article_url'")

    except Exception as e:
        logger.error(f"NLP Processing Error: {e}")
        raise HTTPException(status_code=500, detail=f"NLP Error: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8080)