from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.api import dependencies
from app.db.database import get_db
from app.models.user import User
from app.schemas.user import User as UserSchema
from app.services.user_service import UserService
from sqlalchemy import select

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
