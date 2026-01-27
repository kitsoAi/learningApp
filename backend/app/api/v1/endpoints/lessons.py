from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.database import get_db
from app.schemas.course import Lesson as LessonSchema
from app.schemas.course import Challenge as ChallengeSchema
from app.services.course_service import CourseService

router = APIRouter()

@router.get("/{lesson_id}", response_model=LessonSchema)
async def read_lesson(
    lesson_id: int,
    db: AsyncSession = Depends(get_db),
) -> Any:
    course_service = CourseService(db)
    lesson = await course_service.get_lesson(lesson_id)
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
    return lesson

@router.get("/{lesson_id}/challenges", response_model=List[ChallengeSchema])
async def read_lesson_challenges(
    lesson_id: int,
    db: AsyncSession = Depends(get_db),
) -> Any:
    course_service = CourseService(db)
    lesson = await course_service.get_lesson(lesson_id)
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
    return lesson.challenges
