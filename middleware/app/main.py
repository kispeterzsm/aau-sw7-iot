from typing import Dict, Optional, Tuple, Any, Callable
import time
import httpx
import hashlib
from urllib.parse import urlparse, urlunparse

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import ValidationError

from .schemas import WrapRequest, WrapResponse, WrapData, RegisterRequest
from .settings import (
    DOWNSTREAM_LINK_URL,
    DOWNSTREAM_TEXT_URL,
    DOWNSTREAM_TIMEOUT_SEC,
    PORT,
    DOWNSTREAM_AUTH_HEADER,
    DOWNSTREAM_AUTH_TOKEN,
)
from . import db
from .db import create_user, get_user, create_subscription, get_user_subscriptions
from . import news


def _parse_wrap_data(obj) -> WrapData:
    if hasattr(WrapData, "parse_obj"):
        return WrapData.parse_obj(obj)
    return WrapData.model_validate(obj)


def _to_dict(model) -> dict:
    if hasattr(model, "dict"):
        return model.dict()
    return model.model_dump()


def _normalize_url(u: str) -> str:
    p = urlparse(str(u).strip())
    scheme = (p.scheme or "https").lower()
    netloc = p.netloc.lower()
    path = p.path.rstrip("/") or "/"
    query = p.query
    return urlunparse((scheme, netloc, path, "", query, ""))


def _cache_key(url: str, depth: Optional[int]) -> str:
    return f"{_normalize_url(url)}::d{depth}"


def _coerce_cached_to_wrapdata(obj: Any) -> Optional[WrapData]:
    candidate = obj
    if isinstance(obj, dict) and "data" in obj and isinstance(obj["data"], dict):
        candidate = obj["data"]
    try:
        return _parse_wrap_data(candidate)
    except ValidationError:
        return None


async def _try_return_stale(cache_key: str, source_url: str) -> Optional[WrapResponse]:
    cached = await db.fetch_cached(cache_key)
    if cached is not None:
        dm = _coerce_cached_to_wrapdata(cached)
        if dm is not None:
            return WrapResponse(
                status="ok",
                cached=True,
                source_url=_normalize_url(source_url),
                downstream_ms=0,
                data=dm,
            )
    return None


async def _call_downstream(
    url: str,
    payload: dict,
    timeout_sec: float,
    auth_header: str,
    auth_token: str,
) -> Tuple[int, Any, int]:
    headers = {
        "Content-Type": "application/json",
        auth_header: auth_token,
    }
    start = time.perf_counter()
    try:
        async with httpx.AsyncClient(timeout=timeout_sec) as client:
            resp = await client.post(url, json=payload, headers=headers)
    except httpx.RequestError as e:
        elapsed_ms = int((time.perf_counter() - start) * 1000)
        raise HTTPException(status_code=502, detail=f"Downstream connection error: {e!s}")
    elapsed_ms = int((time.perf_counter() - start) * 1000)
    body = _safe_json(resp)
    return resp.status_code, body, elapsed_ms


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


async def _handle_wrap(
    req: WrapRequest,
    downstream_url: str,
) -> WrapResponse:
    norm_url = _normalize_url(req.input)
    cache_key = _cache_key(req.input, req.search_depth)

    cached = await db.fetch_cached(cache_key)
    if cached is not None:
        cached_model = _coerce_cached_to_wrapdata(cached)
        if cached_model is not None:
            return WrapResponse(
                status="ok",
                cached=True,
                source_url=norm_url,
                downstream_ms=0,
                data=cached_model,
            )

    payload = {"input": str(req.input), "search_depth": req.search_depth}

    try:
        status_code, raw, elapsed_ms = await _call_downstream(
            url=downstream_url,
            payload=payload,
            timeout_sec=DOWNSTREAM_TIMEOUT_SEC,
            auth_header=DOWNSTREAM_AUTH_HEADER,
            auth_token=DOWNSTREAM_AUTH_TOKEN,
        )
    except HTTPException:
        stale = await _try_return_stale(cache_key, norm_url)
        if stale:
            return stale
        raise

    if not (200 <= status_code < 300):
        stale = await _try_return_stale(cache_key, norm_url)
        if stale:
            return stale
        raise HTTPException(
            status_code=502,
            detail={"message": "Downstream non-2xx", "status_code": status_code, "body": raw},
        )

    try:
        data_model = _parse_wrap_data(raw)
    except ValidationError as ve:
        stale = await _try_return_stale(cache_key, norm_url)
        if stale:
            return stale
        raise HTTPException(
            status_code=502,
            detail={"message": "Downstream payload did not match expected schema", "errors": ve.errors()},
        )

    try:
        await db.save_response(cache_key, _to_dict(data_model))
    except Exception:
        pass

    return WrapResponse(
        status="ok",
        cached=False,
        source_url=norm_url,
        downstream_ms=elapsed_ms,
        data=data_model,
    )


@app.post("/search/link", response_model=WrapResponse)
async def wrapLink(req: WrapRequest) -> WrapResponse:
    return await _handle_wrap(req, downstream_url=DOWNSTREAM_LINK_URL)


@app.post("/search/text", response_model=WrapResponse)
async def wrapText(req: WrapRequest) -> WrapResponse:
    return await _handle_wrap(req, downstream_url=DOWNSTREAM_TEXT_URL)


@app.post("/register")
async def register_user(req: RegisterRequest):
    h = hashlib.sha256(req.password.encode()).hexdigest()
    uid = await create_user(req.email, h)
    return {"id": uid, "email": req.email}


@app.post("/login")
async def login(req: RegisterRequest):
    user = await get_user(req.email)
    if not user:
        raise HTTPException(400, "invalid login")
    h = hashlib.sha256(req.password.encode()).hexdigest()
    if h != user.password_hash:
        raise HTTPException(400, "invalid login")
    return {"id": user.id, "email": user.email}


@app.post("/subscribe")
async def subscribe(user_id: int, plan: str):
    await create_subscription(user_id, plan)
    return {"status": "ok"}


@app.get("/subscriptions/{user_id}")
async def subscriptions(user_id: int):
    return await get_user_subscriptions(user_id)


def _safe_json(response: httpx.Response):
    try:
        return response.json()
    except ValueError:
        return {"raw": response.text}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=PORT, reload=True)
