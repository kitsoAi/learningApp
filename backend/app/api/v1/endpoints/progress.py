from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.ext.asyncio import AsyncSession
from app.api import dependencies
from app.db.database import get_db
from app.models.user import User
from app.schemas.progress import Progress as ProgressSchema
from app.services.progress_service import ProgressService
from app.services.user_service import UserService

router = APIRouter()

@router.get("/", response_model=List[ProgressSchema])
async def read_progress(
    current_user: User = Depends(dependencies.get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Any:
    progress_service = ProgressService(db)
    return await progress_service.get_user_progress(current_user.id)

@router.post("/lesson/{lesson_id}/complete", response_model=ProgressSchema)
async def complete_lesson(
    lesson_id: int,
    hearts_used: int = Body(0, embed=True),
    points_earned: int = Body(10, embed=True), # Default points?
    current_user: User = Depends(dependencies.get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Any:
    progress_service = ProgressService(db)
    user_service = UserService(db)
    
    # Mark complete
    progress = await progress_service.mark_lesson_completed(
        current_user.id, lesson_id, hearts_used, points_earned
    )
    
    # Update user XP/Streak
    await user_service.add_xp(current_user, points_earned)
    
    return progress
