from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.api import dependencies
from app.db.database import get_db
from app.models.user import User
from app.models.quest import Quest, UserQuest
from app.schemas.quest import QuestProgress

router = APIRouter()

@router.get("/", response_model=List[QuestProgress])
async def read_quests(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(dependencies.get_current_user),
) -> Any:
    """Retrieve quests with current user's completion status."""
    # Fetch all quests
    result = await db.execute(select(Quest))
    quests = result.scalars().all()
    
    # Fetch user's completed quests
    user_quests_result = await db.execute(
        select(UserQuest.quest_id)
        .where(UserQuest.user_id == current_user.id, UserQuest.completed == True)
    )
    completed_quest_ids = set(user_quests_result.scalars().all())
    
    # Map to QuestProgress schema
    progress = []
    for quest in quests:
        progress.append(QuestProgress(
            id=quest.id,
            title=quest.title,
            description=quest.description,
            points=quest.points,
            required_streak=quest.required_streak,
            completed=quest.id in completed_quest_ids
        ))
    
    return progress
