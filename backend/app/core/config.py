import os
from typing import List, Union
from pydantic_settings import BaseSettings, SettingsConfigDict


def _database_url_from_env() -> str:
    return (
        os.getenv("DATABASE_URL")
        or os.getenv("POSTGRES_URL")
        or os.getenv("POSTGRES_PRISMA_URL")
        or os.getenv("POSTGRES_URL_NON_POOLING")
        or ""
    )


def _firebase_project_id_from_env() -> str:
    return (
        os.getenv("FIREBASE_PROJECT_ID")
        or os.getenv("NEXT_PUBLIC_FIREBASE_PROJECT_ID")
        or ""
    )


class Settings(BaseSettings):
    PROJECT_NAME: str = "Puolingo API"
    API_V1_STR: str = "/api/v1"
    VERCEL_ENV: str = ""
    
    DATABASE_URL: str = _database_url_from_env()
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    DB_POOL_SIZE: int = 20
    DB_MAX_OVERFLOW: int = 10
    DB_POOL_TIMEOUT: int = 30
    DB_POOL_RECYCLE: int = 1800
    DB_POOL_MODE: str = "auto"
    DB_SSL_MODE: str = "auto"
    DB_PREPARED_STATEMENT_CACHE_SIZE: int = 100
    DB_DISABLE_POSTGRES_JIT: bool = False
    
    GOOGLE_CLIENT_ID: str = ""
    GOOGLE_CLIENT_SECRET: str = ""
    GOOGLE_REDIRECT_URI: str = "http://localhost:8000/api/v1/auth/google/callback"
    
    FRONTEND_URL: str = "http://localhost:3000"
    ALLOWED_ORIGINS: Union[List[str], str] = ["http://localhost:3000", "http://puolingo.com"]
    UPLOAD_DIR: str = "uploads"
    FIREBASE_PROJECT_ID: str = _firebase_project_id_from_env()

    model_config = SettingsConfigDict(case_sensitive=True, env_file=".env", extra="ignore")

settings = Settings()
