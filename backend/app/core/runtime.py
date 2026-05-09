import os
from pathlib import Path

from app.core.config import settings


def is_running_on_vercel() -> bool:
    return bool(settings.VERCEL_ENV or os.getenv("VERCEL"))


def local_uploads_supported() -> bool:
    return not is_running_on_vercel()


def get_uploads_path() -> Path:
    return Path(settings.UPLOAD_DIR)
