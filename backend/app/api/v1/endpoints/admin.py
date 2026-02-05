from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.api import dependencies
from app.db.database import get_db
from app.models.user import User
from app.schemas.user import User as UserSchema
from app.services.user_service import UserService
from sqlalchemy import select, func
from app.models.course import Course, Unit, Lesson, Challenge

router = APIRouter()

@router.get("/users", response_model=List[UserSchema])
async def list_all_users(
    current_admin: User = Depends(dependencies.get_current_admin_user),
    db: AsyncSession = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
) -> Any:
    """Admin only: List all users."""
    result = await db.execute(select(User).offset(skip).limit(limit))
    users = result.scalars().all()
    return users

@router.post("/users/{user_id}/make-admin")
async def make_user_admin(
    user_id: int,
    current_admin: User = Depends(dependencies.get_current_admin_user),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Admin only: Grant admin privileges to a user."""
    user_service = UserService(db)
    user = await user_service.get_user(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user.is_admin = True
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return {"message": f"User {user.email} is now an admin"}

@router.delete("/users/{user_id}/remove-admin")
async def remove_user_admin(
    user_id: int,
    current_admin: User = Depends(dependencies.get_current_admin_user),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Admin only: Revoke admin privileges from a user."""
    user_service = UserService(db)
    user = await user_service.get_user(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Prevent removing admin from yourself
    if user.id == current_admin.id:
        raise HTTPException(status_code=400, detail="Cannot remove admin privileges from yourself")
    
    user.is_admin = False
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return {"message": f"Admin privileges removed from {user.email}"}
@router.get("/analytics")
async def get_analytics(
    current_admin: User = Depends(dependencies.get_current_admin_user),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Admin only: Get platform-wide analytics."""
    # Counts
    user_count = (await db.execute(select(func.count(User.id)))).scalar()
    course_count = (await db.execute(select(func.count(Course.id)))).scalar()
    unit_count = (await db.execute(select(func.count(Unit.id)))).scalar()
    lesson_count = (await db.execute(select(func.count(Lesson.id)))).scalar()
    challenge_count = (await db.execute(select(func.count(Challenge.id)))).scalar()
    
    # Average XP per user
    avg_xp = (await db.execute(select(func.avg(User.xp)))).scalar() or 0
    
    # Active users (users with points > 0)
    active_users = (await db.execute(select(func.count(User.id)).where(User.xp > 0))).scalar()
    
    return {
        "total_users": user_count,
        "total_courses": course_count,
        "total_units": unit_count,
        "total_lessons": lesson_count,
        "total_challenges": challenge_count,
        "average_xp": round(float(avg_xp), 2),
        "active_users": active_users,
    }
