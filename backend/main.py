from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pathlib import Path
from app.api.v1.router import api_router
from app.core.config import settings
from app.db.database import engine, Base
# Import models to ensure they are registered for create_all
from app import models

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Create tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    # Shutdown
    await engine.dispose()

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url="/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

@app.middleware("http")
async def log_requests(request, call_next):
    origin = request.headers.get("origin")
    method = request.method
    url = request.url
    print(f"DEBUG: Incoming request {method} {url} | Origin: {origin}")
    response = await call_next(request)
    return response

if settings.ALLOWED_ORIGINS:
    origins = settings.ALLOWED_ORIGINS
    if isinstance(origins, str):
        import json
        try:
            # Try to parse as JSON list (common in ECS/Docker env vars)
            origins = json.loads(origins)
        except json.JSONDecodeError:
            # Fallback to comma-separated string
            origins = [o.strip() for o in origins.split(",")]
    
    # Ensure common dev origins are always there
    if "http://localhost:3000" not in origins:
        origins.append("http://localhost:3000")
    
    print(f"DEBUG: Setting CORS allowed_origins to: {origins}")
    
    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
        expose_headers=["*"]
    )

@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    import traceback
    print(f"ERROR: Global exception caught: {str(exc)}")
    traceback.print_exc()
    return {
        "detail": str(exc),
        "traceback": traceback.format_exc(),
        "type": type(exc).__name__
    }

app.include_router(api_router, prefix=settings.API_V1_STR)

# Mount static files for uploads
uploads_path = Path(settings.UPLOAD_DIR)
uploads_path.mkdir(exist_ok=True)
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

@app.get("/health")
async def health_check():
    return {"status": "ok"}
