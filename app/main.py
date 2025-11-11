from typing import Dict
import time
import httpx
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import ValidationError

from .schemas import WrapRequest, WrapResponse, WrapData
from .settings import (
    DOWNSTREAM_LINK_URL,
    DOWNSTREAM_TEXT_URL,
    DOWNSTREAM_TIMEOUT_SEC,
    PORT,
    DOWNSTREAM_AUTH_HEADER,
    DOWNSTREAM_AUTH_TOKEN,
)
from . import db
from . import news


# ---------- Pydantic v1/v2 Helpers ----------
def _parse_wrap_data(obj) -> WrapData:
    """Parses raw dict into WrapData model in v1/v2."""
    if hasattr(WrapData, "parse_obj"):   # pydantic v1
        return WrapData.parse_obj(obj)
    return WrapData.model_validate(obj)  # pydantic v2


def _to_dict(model) -> dict:
    if hasattr(model, "dict"):
        return model.dict()             # pydantic v1
    return model.model_dump()           # pydantic v2
# -------------------------------------------


app = FastAPI(title="Link Wrapper API", version="2.3.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(news.router)


@app.on_event("startup")
async def startup() -> None:
    await db.init_db()


@app.get("/health")
def health() -> Dict[str, str]:
    return {"status": "ok"}


@app.post("/search/link", response_model=WrapResponse)
async def wrapLink(req: WrapRequest) -> WrapResponse:
    """
    1) Check cache
    2) If miss → call downstream
    3) Validate/normalize response
    4) Store in DB
    5) Return WrapResponse
    """

    # Cache key includes search depth
    cache_key = f"{str(req.url)}::d{req.search_depth}"

    # ---- 1) CACHE ----
    cached = await db.fetch_cached(cache_key)
    if cached is not None:
        try:
            data_model = _parse_wrap_data(cached)
        except ValidationError:
            data_model = None

        if data_model is not None:
            return WrapResponse(
                status="ok",
                cached=True,
                source_url=req.url,
                downstream_ms=0,
                data=data_model,
            )

    # ---- 2) DOWNSTREAM CALL ----
    payload = {"input": str(req.url), "search_depth": req.search_depth}

    headers = {
        "Content-Type": "application/json",
        DOWNSTREAM_AUTH_HEADER: DOWNSTREAM_AUTH_TOKEN,  
    }


    print(f"[downstream] URL={DOWNSTREAM_LINK_URL}")
    start = time.perf_counter()

    try:
        async with httpx.AsyncClient(timeout=DOWNSTREAM_TIMEOUT_SEC) as client:
            resp = await client.post(DOWNSTREAM_LINK_URL, json=payload, headers=headers)
    except httpx.RequestError as e:
        raise HTTPException(status_code=502, detail=f"Downstream connection error: {e!s}")

    elapsed_ms = int((time.perf_counter() - start) * 1000)

    if not (200 <= resp.status_code < 300):
        raise HTTPException(
            status_code=502,
            detail={
                "message": "Downstream non-2xx",
                "status_code": resp.status_code,
                "body": _safe_json(resp),
            },
        )

    raw = _safe_json(resp)
    print(raw)
    # ---- 3) VALIDATE ----
    try:
        data_model = _parse_wrap_data(raw)
    except ValidationError as ve:
        raise HTTPException(
            status_code=502,
            detail={
                "message": "Downstream payload did not match expected schema",
                "errors": ve.errors(),
            },
        )

    # ---- 4) SAVE ----
    try:
        await db.save_response(cache_key, _to_dict(data_model))
    except Exception as e:
        print(f"[warn] DB write failed: {e!s}")

    # ---- 5) RETURN ----
    return WrapResponse(
        status="ok",
        cached=False,
        source_url=req.url,
        downstream_ms=elapsed_ms,
        data=data_model,
    )


@app.post("/search/text", response_model=WrapResponse)
async def wrapText(req: WrapRequest) -> WrapResponse:
    """
    1) Check cache
    2) If miss → call downstream
    3) Validate/normalize response
    4) Store in DB
    5) Return WrapResponse
    """

    # Cache key includes search depth
    cache_key = f"{str(req.url)}::d{req.search_depth}"

    # ---- 1) CACHE ----
    cached = await db.fetch_cached(cache_key)
    if cached is not None:
        try:
            data_model = _parse_wrap_data(cached)
        except ValidationError:
            data_model = None

        if data_model is not None:
            return WrapResponse(
                status="ok",
                cached=True,
                source_url=req.url,
                downstream_ms=0,
                data=data_model,
            )

    # ---- 2) DOWNSTREAM CALL ----
    payload = {"input": str(req.url), "search_depth": req.search_depth}

    headers = {
        "Content-Type": "application/json",
        DOWNSTREAM_AUTH_HEADER: DOWNSTREAM_AUTH_TOKEN,  
    }


    print(f"[downstream] URL={DOWNSTREAM_TEXT_URL}")
    start = time.perf_counter()

    try:
        async with httpx.AsyncClient(timeout=DOWNSTREAM_TIMEOUT_SEC) as client:
            resp = await client.post(DOWNSTREAM_TEXT_URL, json=payload, headers=headers)
    except httpx.RequestError as e:
        raise HTTPException(status_code=502, detail=f"Downstream connection error: {e!s}")

    elapsed_ms = int((time.perf_counter() - start) * 1000)

    if not (200 <= resp.status_code < 300):
        raise HTTPException(
            status_code=502,
            detail={
                "message": "Downstream non-2xx",
                "status_code": resp.status_code,
                "body": _safe_json(resp),
            },
        )

    raw = _safe_json(resp)
    print(raw)
    # ---- 3) VALIDATE ----
    try:
        data_model = _parse_wrap_data(raw)
    except ValidationError as ve:
        raise HTTPException(
            status_code=502,
            detail={
                "message": "Downstream payload did not match expected schema",
                "errors": ve.errors(),
            },
        )

    # ---- 4) SAVE ----
    try:
        await db.save_response(cache_key, _to_dict(data_model))
    except Exception as e:
        print(f"[warn] DB write failed: {e!s}")

    # ---- 5) RETURN ----
    return WrapResponse(
        status="ok",
        cached=False,
        source_url=req.url,
        downstream_ms=elapsed_ms,
        data=data_model,
    )



def _safe_json(response: httpx.Response):
    try:
        return response.json()
    except ValueError:
        return {"raw": response.text}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=PORT, reload=True)
