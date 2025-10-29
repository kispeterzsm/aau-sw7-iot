import time, asyncio, json
from typing import Optional, Dict, Any
from sqlalchemy.ext.asyncio import create_async_engine, AsyncEngine
from sqlalchemy import text
from .settings import DATABASE_URL, DB_INIT_RETRY_SECONDS

engine: Optional[AsyncEngine] = None

CREATE_TABLE_SQL = """
CREATE TABLE IF NOT EXISTS link_cache (
    id          BIGSERIAL PRIMARY KEY,
    url         TEXT NOT NULL UNIQUE,
    response    JSONB NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
"""
SELECT_BY_URL_SQL = "SELECT response FROM link_cache WHERE url = :url LIMIT 1;"
INSERT_OR_UPDATE_SQL = """
INSERT INTO link_cache (url, response, created_at, updated_at)
VALUES (:url, CAST(:response AS JSONB), NOW(), NOW())
ON CONFLICT (url) DO UPDATE SET response = EXCLUDED.response, updated_at = NOW();
"""

async def init_db() -> None:
    global engine
    if engine is None:
        engine = create_async_engine(DATABASE_URL, future=True, echo=False, pool_pre_ping=True)
    deadline = time.monotonic() + DB_INIT_RETRY_SECONDS
    last_err = None
    while time.monotonic() < deadline:
        try:
            async with engine.begin() as conn:
                await conn.execute(text(CREATE_TABLE_SQL))
            print("[db] ready")
            return
        except Exception as e:
            last_err = e
            print(f"[db] not ready yet: {e}; retrying...")
            await asyncio.sleep(2)
    raise RuntimeError(f"DB not reachable after {DB_INIT_RETRY_SECONDS}s: {last_err}")

async def fetch_cached(url: str) -> Optional[Dict[str, Any]]:
    async with engine.begin() as conn:
        row = (await conn.execute(text(SELECT_BY_URL_SQL), {"url": url})).first()
    return row[0] if row else None

async def save_response(url: str, data: Dict[str, Any]) -> None:
    async with engine.begin() as conn:
        await conn.execute(text(INSERT_OR_UPDATE_SQL), {"url": url, "response": json.dumps(data)})
