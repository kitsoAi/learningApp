from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.progress import UserProgress
from app.models.course import Lesson
from typing import List

class ProgressService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_user_progress(self, user_id: int) -> List[UserProgress]:
        result = await self.db.execute(select(UserProgress).where(UserProgress.user_id == user_id))
        return list(result.scalars().all())

    async def get_lesson_progress(self, user_id: int, lesson_id: int) -> UserProgress | None:
        result = await self.db.execute(
            select(UserProgress)
            .where(UserProgress.user_id == user_id, UserProgress.lesson_id == lesson_id)
        )
        return result.scalars().first()

    async def mark_lesson_completed(self, user_id: int, lesson_id: int, hearts_used: int, points_earned: int) -> UserProgress:
        progress = await self.get_lesson_progress(user_id, lesson_id)
        if progress:
             progress.completed = True
             progress.hearts_used = hearts_used
             progress.points_earned = points_earned
             # Maybe accumulate points?
        else:
            progress = UserProgress(
                user_id=user_id,
                lesson_id=lesson_id,
                completed=True,
                hearts_used=hearts_used,
                points_earned=points_earned
            )
            self.db.add(progress)
        
        await self.db.commit()
        await self.db.refresh(progress)
        return progress
