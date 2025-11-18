# app/db.py
import time, asyncio, json, re
from typing import Optional, Dict, Any, Tuple
from sqlalchemy.ext.asyncio import create_async_engine, AsyncEngine
from sqlalchemy import text
from .settings import DATABASE_URL, DB_INIT_RETRY_SECONDS
engine = create_async_engine(
    DATABASE_URL,
    future=True,
    echo=False,
    pool_pre_ping=True,
    connect_args={"ssl": True},
)

CREATE_TABLE_SQL = """
CREATE TABLE IF NOT EXISTS link_cache (
    id           BIGSERIAL PRIMARY KEY,
    cache_key    TEXT UNIQUE,
    url          TEXT,
    search_depth INTEGER,
    response     JSONB NOT NULL,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
"""

CREATE_USERS_SQL = """
CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
"""

CREATE_SUBSCRIPTIONS_SQL = """
CREATE TABLE IF NOT EXISTS subscriptions (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plan TEXT NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
"""

MIGRATIONS_SQL = [
    "ALTER TABLE link_cache ADD COLUMN IF NOT EXISTS cache_key TEXT;",
    "ALTER TABLE link_cache ADD COLUMN IF NOT EXISTS url TEXT;",
    "ALTER TABLE link_cache ADD COLUMN IF NOT EXISTS search_depth INTEGER;",
    "DO $$ BEGIN CREATE UNIQUE INDEX IF NOT EXISTS link_cache_cache_key_idx ON link_cache(cache_key); EXCEPTION WHEN OTHERS THEN END $$;",
    "CREATE TABLE IF NOT EXISTS users (id BIGSERIAL PRIMARY KEY, email TEXT UNIQUE NOT NULL, password_hash TEXT NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW());",
    "CREATE TABLE IF NOT EXISTS subscriptions (id BIGSERIAL PRIMARY KEY, user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE, plan TEXT NOT NULL, active BOOLEAN NOT NULL DEFAULT TRUE, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW());",
]

_CACHE_KEY_RE = re.compile(r"^(?P<url>.+?)::d(?P<depth>\d+)$")


def _split_cache_key(cache_key: str) -> Tuple[str, Optional[int]]:
    m = _CACHE_KEY_RE.match(cache_key)
    if not m:
        return cache_key, None
    u = m.group("url")
    d = int(m.group("depth"))
    return u, d


SELECT_BY_CACHE_KEY_SQL = "SELECT response FROM link_cache WHERE cache_key = :cache_key LIMIT 1;"
SELECT_BY_URL_SQL = "SELECT response FROM link_cache WHERE url = :url LIMIT 1;"

UPSERT_BY_CACHE_KEY_SQL = """
INSERT INTO link_cache (cache_key, url, search_depth, response, created_at, updated_at)
VALUES (:cache_key, :url, :search_depth, CAST(:response AS JSONB), NOW(), NOW())
ON CONFLICT (cache_key) DO UPDATE
SET response = EXCLUDED.response,
    url = COALESCE(EXCLUDED.url, link_cache.url),
    search_depth = COALESCE(EXCLUDED.search_depth, link_cache.search_depth),
    updated_at = NOW();
"""

BACKFILL_CACHE_KEY_SQL = """
UPDATE link_cache
SET cache_key = COALESCE(cache_key, url || '::d' || COALESCE(search_depth::text, '0'))
WHERE cache_key IS NULL AND url IS NOT NULL;
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
                await conn.execute(text(CREATE_USERS_SQL))
                await conn.execute(text(CREATE_SUBSCRIPTIONS_SQL))
                for sql in MIGRATIONS_SQL:
                    await conn.execute(text(sql))
                await conn.execute(text(BACKFILL_CACHE_KEY_SQL))
            print("[db] ready")
            return
        except Exception as e:
            last_err = e
            print(f"[db] not ready yet: {e}; retrying...")
            await asyncio.sleep(2)
    raise RuntimeError(f"DB not reachable after {DB_INIT_RETRY_SECONDS}s: {last_err}")


async def fetch_cached(cache_key: str) -> Optional[Dict[str, Any]]:
    if engine is None:
        raise RuntimeError("DB engine not initialized; call init_db() first.")

    async with engine.begin() as conn:
        row = (await conn.execute(text(SELECT_BY_CACHE_KEY_SQL), {"cache_key": cache_key})).first()
    if row and row[0] is not None:
        return row[0]

    base_url, _ = _split_cache_key(cache_key)
    if base_url != cache_key:
        async with engine.begin() as conn:
            row = (await conn.execute(text(SELECT_BY_URL_SQL), {"url": base_url})).first()
        if row and row[0] is not None:
            return row[0]

    return None


async def save_response(cache_key: str, data: Dict[str, Any]) -> None:
    if engine is None:
        raise RuntimeError("DB engine not initialized; call init_db() first.")

    url, depth = _split_cache_key(cache_key)
    payload = json.dumps(data)
    async with engine.begin() as conn:
        await conn.execute(
            text(UPSERT_BY_CACHE_KEY_SQL),
            {
                "cache_key": cache_key,
                "url": url,
                "search_depth": depth,
                "response": payload,
            },
        )

async def create_user(email: str, password_hash: str) -> int:
    async with engine.begin() as conn:
        row = await conn.execute(
            text("INSERT INTO users (email, password_hash) VALUES (:e, :p) RETURNING id"),
            {"e": email, "p": password_hash}
        )
        return row.scalar()

async def get_user(email: str):
    async with engine.begin() as conn:
        row = await conn.execute(
            text("SELECT id, email, password_hash, created_at FROM users WHERE email=:e"),
            {"e": email}
        )
        return row.first()
    
async def create_subscription(user_id: int, plan: str):
    async with engine.begin() as conn:
        await conn.execute(
            text("INSERT INTO subscriptions (user_id, plan) VALUES (:u, :p)"),
            {"u": user_id, "p": plan}
        )

async def get_user_subscriptions(user_id: int):
    async with engine.begin() as conn:
        rows = await conn.execute(
            text("SELECT id, plan, active, created_at FROM subscriptions WHERE user_id=:u"),
            {"u": user_id}
        )
        return rows.fetchall()