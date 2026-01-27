from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.database import get_db
from app.schemas.course import Course as CourseSchema
from app.schemas.course import Unit as UnitSchema
from app.services.course_service import CourseService

router = APIRouter()

from app.schemas.course import Course as CourseSchema, CourseList as CourseListSchema
from app.api.dependencies import get_current_user_optional
from app.models.user import User
from typing import Optional

@router.get("/", response_model=List[CourseSchema])
async def read_courses(
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
    skip: int = 0,
    limit: int = 100,
) -> Any:
    course_service = CourseService(db)
    user_id = current_user.id if current_user else None
    return await course_service.get_courses(user_id)


@router.get("/{course_id}", response_model=CourseSchema)
async def read_course(
    course_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
) -> Any:
    course_service = CourseService(db)
    user_id = current_user.id if current_user else None
    course = await course_service.get_course_with_progress(course_id, user_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    return course

@router.get("/{course_id}/units", response_model=List[UnitSchema])
async def read_course_units(
    course_id: int,
    db: AsyncSession = Depends(get_db),
) -> Any:
    course_service = CourseService(db)
    course = await course_service.get_course(course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    return course.units
