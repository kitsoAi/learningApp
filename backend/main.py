import json
from pathlib import Path
from urllib.parse import urlsplit
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

from app.core.config import settings
from app.api.v1.router import api_router


def _normalize_origin(origin: str) -> str:
    origin = origin.strip().rstrip("/")
    if not origin:
        return ""

    parsed = urlsplit(origin)
    if not parsed.scheme or not parsed.netloc:
        return ""

    return f"{parsed.scheme}://{parsed.netloc}"


def _normalize_origins(origins):
    candidates = []

    if isinstance(origins, list):
        candidates = origins
    elif isinstance(origins, str):
        try:
            parsed = json.loads(origins)
            if isinstance(parsed, list):
                candidates = parsed
            else:
                candidates = [origins]
        except Exception:
            # Also support comma-separated values for simple env configuration.
            candidates = [candidate.strip() for candidate in origins.split(",")]

    normalized = []
    seen = set()
    for candidate in candidates:
        if not isinstance(candidate, str):
            continue

        normalized_origin = _normalize_origin(candidate)
        if normalized_origin and normalized_origin not in seen:
            seen.add(normalized_origin)
            normalized.append(normalized_origin)

    return normalized


app = FastAPI(title=settings.PROJECT_NAME)

# CORS
allowed_origins = _normalize_origins(settings.ALLOWED_ORIGINS)
for frontend_origin in _normalize_origins(settings.FRONTEND_URL):
    if frontend_origin not in allowed_origins:
        allowed_origins.append(frontend_origin)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API routes
app.include_router(api_router, prefix=settings.API_V1_STR)


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(status_code=500, content={"detail": str(exc)})


# Static uploads
uploads_path = Path(settings.UPLOAD_DIR)
uploads_path.mkdir(exist_ok=True)
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")
