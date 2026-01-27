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

if settings.ALLOWED_ORIGINS:
    origins = settings.ALLOWED_ORIGINS
    if isinstance(origins, str):
        origins = [o.strip() for o in origins.split(",")]
    
    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

app.include_router(api_router, prefix=settings.API_V1_STR)

# Mount static files for uploads
uploads_path = Path(settings.UPLOAD_DIR)
uploads_path.mkdir(exist_ok=True)
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

@app.get("/health")
async def health_check():
    return {"status": "ok"}
