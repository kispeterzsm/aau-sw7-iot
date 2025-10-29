from typing import Dict
import time, httpx
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from .schemas import WrapRequest, WrapResponse
from .settings import DOWNSTREAM_URL, DOWNSTREAM_TIMEOUT_SEC, PORT
from . import db
from . import news


app = FastAPI(title="Link Wrapper API", version="2.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"],
)
app.include_router(news.router)


@app.on_event("startup")
async def startup() -> None:
    await db.init_db()

@app.get("/health")
def health() -> Dict[str, str]:
    return {"status": "ok"}

@app.post("/wrap", response_model=WrapResponse)
async def wrap(req: WrapRequest) -> WrapResponse:
    # 1) check DB
    cached = await db.fetch_cached(str(req.url))
    if cached is not None:
        return WrapResponse(status="ok", cached=True, source_url=req.url, downstream_ms=0, data=cached)

    # 2) call downstream
    payload = {"input": str(req.url), "search_depth": req.search_depth}
    headers = {"Content-Type": "application/json"}

    start = time.perf_counter()
    try:
        async with httpx.AsyncClient(timeout=DOWNSTREAM_TIMEOUT_SEC) as client:
            resp = await client.post(DOWNSTREAM_URL, json=payload, headers=headers)
    except httpx.RequestError as e:
        raise HTTPException(status_code=502, detail=f"Downstream connection error: {e}")

    elapsed_ms = int((time.perf_counter() - start) * 1000)
    if not (200 <= resp.status_code < 300):
        raise HTTPException(status_code=502, detail={
            "message": "Downstream non-2xx",
            "status_code": resp.status_code,
            "body": _safe_json(resp),
        })
    data = _safe_json(resp)

    # 3) save & return
    try:
        await db.save_response(str(req.url), data)
    except Exception as e:
        print(f"[warn] DB write failed: {e}")
    return WrapResponse(status="ok", cached=False, source_url=req.url, downstream_ms=elapsed_ms, data=data)

def _safe_json(response: httpx.Response):
    try:
        return response.json()
    except ValueError:
        return {"raw": response.text}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=PORT, reload=True)
