import os

DOWNSTREAM_BASE_URL = os.getenv("DOWNSTREAM_BASE_URL", "https://posted-hits-social-portland.trycloudflare.com")
DOWNSTREAM_PATH = "/link/news"
DOWNSTREAM_URL = f"{DOWNSTREAM_BASE_URL.rstrip('/')}{DOWNSTREAM_PATH}"
DOWNSTREAM_TIMEOUT_SEC = float(os.getenv("DOWNSTREAM_TIMEOUT_SEC", "30"))

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+asyncpg://app:app@localhost:5432/linkcache")
DB_INIT_RETRY_SECONDS = int(os.getenv("DB_INIT_RETRY_SECONDS", "45"))
PORT = int(os.getenv("PORT", "8080"))
