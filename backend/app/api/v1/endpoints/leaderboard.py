from typing import Any, List
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.api import dependencies
from app.db.database import get_db
from app.models.user import User
from app.schemas.user import User as UserSchema

router = APIRouter()

@router.get("/", response_model=List[UserSchema])
async def get_leaderboard(
    current_user: User = Depends(dependencies.get_current_user_optional),
    db: AsyncSession = Depends(get_db),
    limit: int = 10,
) -> Any:
    result = await db.execute(
        select(User)
        .order_by(User.xp.desc())
        .limit(limit)
    )
    return result.scalars().all()
