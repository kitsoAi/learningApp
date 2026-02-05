from typing import Any
from fastapi import APIRouter, Depends, Body
from sqlalchemy.ext.asyncio import AsyncSession
from app.api import dependencies
from app.db.database import get_db
from app.models.user import User
from app.schemas.user import User as UserSchema, UserUpdate
from app.services.user_service import UserService
import uuid
import os
from app.core.config import settings
from fastapi import UploadFile, File

router = APIRouter()

@router.post("/upload")
async def upload_user_media(
    file: UploadFile = File(...),
    current_user: User = Depends(dependencies.get_current_user),
) -> Any:
    """Upload a profile avatar."""
    # Check file extension
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in [".png", ".jpg", ".jpeg", ".svg"]:
        raise HTTPException(status_code=400, detail="Invalid image type")

    # Ensure upload directory exists
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    
    # Generate unique filename
    filename = f"avatar_{current_user.id}_{uuid.uuid4().hex[:8]}{ext}"
    file_path = os.path.join(settings.UPLOAD_DIR, filename)
    
    # Save file
    with open(file_path, "wb") as f:
        content = await file.read()
        f.write(content)
    
    return {"url": f"/uploads/{filename}", "filename": filename}

@router.get("/me", response_model=UserSchema)
async def read_users_me(
    current_user: User = Depends(dependencies.get_current_user),
) -> Any:
    return current_user

@router.patch("/me", response_model=UserSchema)
async def update_user_me(
    user_in: UserUpdate,
    current_user: User = Depends(dependencies.get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Any:
    user_service = UserService(db)
    return await user_service.update_user(current_user, user_in)

@router.post("/me/hearts/refill", response_model=UserSchema)
async def refill_hearts(
    current_user: User = Depends(dependencies.get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Any:
    user_service = UserService(db)
    return await user_service.refill_hearts(current_user)

@router.post("/me/hearts/reduce", response_model=UserSchema)
async def reduce_hearts(
    current_user: User = Depends(dependencies.get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Any:
    user_service = UserService(db)
    return await user_service.reduce_hearts(current_user)

@router.post("/me/xp/add", response_model=UserSchema)
async def add_xp(
    xp: int = Body(..., embed=True),
    current_user: User = Depends(dependencies.get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Any:
    user_service = UserService(db)
    return await user_service.add_xp(current_user, xp)

@router.get("/me/streak")
async def get_streak(
    current_user: User = Depends(dependencies.get_current_user),
) -> Any:
    return {
        "streak_count": current_user.streak_count,
        "longest_streak": current_user.longest_streak,
        "streak_frozen": current_user.streak_frozen,
        "last_activity_date": current_user.last_activity_date
    }

@router.post("/me/streak/freeze")
async def freeze_streak(
    current_user: User = Depends(dependencies.get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Any:
    # Logic to activate freeze (e.g. deduct points/gems?)
    # For now just set true
    current_user.streak_frozen = True
    db.add(current_user)
    await db.commit()
    await db.refresh(current_user)
    return {"status": "streak frozen"}
