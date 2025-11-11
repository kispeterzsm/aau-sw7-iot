import os

# Fixed downstream endpoint (you can still override via env if you want)
DOWNSTREAM_BASE_URL = os.getenv(
    "DOWNSTREAM_BASE_URL",
    "https://retaliatory-bruna-unofficious.ngrok-free.dev",
)
DOWNSTREAM_LINK_PATH = os.getenv("DOWNSTREAM_PATH", "/link/all")
DOWNSTREAM_TEXT_PATH = os.getenv("DOWNSTREAM_PATH", "/text/all")
DOWNSTREAM_LINK_URL = f"{DOWNSTREAM_BASE_URL.rstrip('/')}{DOWNSTREAM_LINK_PATH}"
DOWNSTREAM_TEXT_URL = f"{DOWNSTREAM_BASE_URL.rstrip('/')}{DOWNSTREAM_TEXT_PATH}"
DOWNSTREAM_TIMEOUT_SEC = float(os.getenv("DOWNSTREAM_TIMEOUT_SEC", "30"))

# --- FIXED AUTH ---
# Do not change the header name or value.
DOWNSTREAM_AUTH_HEADER = "x-auth-token"
DOWNSTREAM_AUTH_TOKEN  = "zlggxclDYTWevcy4zGZeId_M2CUIMKR965fddaD1lvChhqpo9JtKdo"

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+asyncpg://app:app@localhost:5432/linkcache")
DB_INIT_RETRY_SECONDS = int(os.getenv("DB_INIT_RETRY_SECONDS", "45"))
PORT = int(os.getenv("PORT", "8080"))
