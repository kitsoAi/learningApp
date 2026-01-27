from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
import uuid
import os
from sqlalchemy.ext.asyncio import AsyncSession
from app.api import dependencies
from app.db.database import get_db
from app.core.config import settings
from app.models.user import User
from app.schemas.course import Course, Unit, Lesson, Challenge, ChallengeOption
from app.schemas.admin_content import (
    CourseCreate, CourseUpdate,
    UnitCreate, UnitUpdate,
    LessonCreate, LessonUpdate,
    ChallengeCreate, ChallengeUpdate,
    ChallengeOptionCreate, ChallengeOptionUpdate
)
from app.services.admin_content_service import AdminContentService

router = APIRouter()

# ========== MEDIA UPLOAD ==========

@router.post("/upload")
async def upload_media(
    file: UploadFile = File(...),
    current_admin: User = Depends(dependencies.get_current_admin_user),
) -> Any:
    """Admin only: Upload an image or audio file."""
    # Check file extension
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in [".png", ".jpg", ".jpeg", ".mp3", ".wav", ".svg"]:
        raise HTTPException(status_code=400, detail="Invalid file type")

    # Ensure upload directory exists
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    
    # Generate unique filename
    file_extension = os.path.splitext(file.filename)[1]
    filename = f"{uuid.uuid4()}{file_extension}"
    file_path = os.path.join(settings.UPLOAD_DIR, filename)
    
    # Save file
    with open(file_path, "wb") as f:
        content = await file.read()
        f.write(content)
    
    # Return the URL
    # Assuming the server is reachable at FRONTEND_URL but we want the API root
    # For now, return the relative path from /uploads
    return {"url": f"/uploads/{filename}", "filename": filename}

# ========== COURSE ENDPOINTS ==========

@router.post("/courses", response_model=Course)
async def create_course(
    course_in: CourseCreate,
    current_admin: User = Depends(dependencies.get_current_admin_user),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Admin only: Create a new course."""
    service = AdminContentService(db)
    return await service.create_course(course_in)

@router.put("/courses/{course_id}", response_model=Course)
async def update_course(
    course_id: int,
    course_in: CourseUpdate,
    current_admin: User = Depends(dependencies.get_current_admin_user),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Admin only: Update a course."""
    service = AdminContentService(db)
    course = await service.update_course(course_id, course_in)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    return course

@router.delete("/courses/{course_id}")
async def delete_course(
    course_id: int,
    current_admin: User = Depends(dependencies.get_current_admin_user),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Admin only: Delete a course."""
    service = AdminContentService(db)
    success = await service.delete_course(course_id)
    if not success:
        raise HTTPException(status_code=404, detail="Course not found")
    return {"message": "Course deleted successfully"}

# ========== UNIT ENDPOINTS ==========

@router.post("/units", response_model=Unit)
async def create_unit(
    unit_in: UnitCreate,
    current_admin: User = Depends(dependencies.get_current_admin_user),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Admin only: Create a new unit."""
    service = AdminContentService(db)
    return await service.create_unit(unit_in)

@router.put("/units/{unit_id}", response_model=Unit)
async def update_unit(
    unit_id: int,
    unit_in: UnitUpdate,
    current_admin: User = Depends(dependencies.get_current_admin_user),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Admin only: Update a unit."""
    service = AdminContentService(db)
    unit = await service.update_unit(unit_id, unit_in)
    if not unit:
        raise HTTPException(status_code=404, detail="Unit not found")
    return unit

@router.delete("/units/{unit_id}")
async def delete_unit(
    unit_id: int,
    current_admin: User = Depends(dependencies.get_current_admin_user),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Admin only: Delete a unit."""
    service = AdminContentService(db)
    success = await service.delete_unit(unit_id)
    if not success:
        raise HTTPException(status_code=404, detail="Unit not found")
    return {"message": "Unit deleted successfully"}

# ========== LESSON ENDPOINTS ==========

@router.post("/lessons", response_model=Lesson)
async def create_lesson(
    lesson_in: LessonCreate,
    current_admin: User = Depends(dependencies.get_current_admin_user),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Admin only: Create a new lesson."""
    service = AdminContentService(db)
    return await service.create_lesson(lesson_in)

@router.put("/lessons/{lesson_id}", response_model=Lesson)
async def update_lesson(
    lesson_id: int,
    lesson_in: LessonUpdate,
    current_admin: User = Depends(dependencies.get_current_admin_user),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Admin only: Update a lesson."""
    service = AdminContentService(db)
    lesson = await service.update_lesson(lesson_id, lesson_in)
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
    return lesson

@router.delete("/lessons/{lesson_id}")
async def delete_lesson(
    lesson_id: int,
    current_admin: User = Depends(dependencies.get_current_admin_user),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Admin only: Delete a lesson."""
    service = AdminContentService(db)
    success = await service.delete_lesson(lesson_id)
    if not success:
        raise HTTPException(status_code=404, detail="Lesson not found")
    return {"message": "Lesson deleted successfully"}

# ========== CHALLENGE ENDPOINTS ==========

@router.post("/challenges", response_model=Challenge)
async def create_challenge(
    challenge_in: ChallengeCreate,
    current_admin: User = Depends(dependencies.get_current_admin_user),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Admin only: Create a new challenge."""
    service = AdminContentService(db)
    return await service.create_challenge(challenge_in)

@router.put("/challenges/{challenge_id}", response_model=Challenge)
async def update_challenge(
    challenge_id: int,
    challenge_in: ChallengeUpdate,
    current_admin: User = Depends(dependencies.get_current_admin_user),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Admin only: Update a challenge."""
    service = AdminContentService(db)
    challenge = await service.update_challenge(challenge_id, challenge_in)
    if not challenge:
        raise HTTPException(status_code=404, detail="Challenge not found")
    return challenge

@router.delete("/challenges/{challenge_id}")
async def delete_challenge(
    challenge_id: int,
    current_admin: User = Depends(dependencies.get_current_admin_user),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Admin only: Delete a challenge."""
    service = AdminContentService(db)
    success = await service.delete_challenge(challenge_id)
    if not success:
        raise HTTPException(status_code=404, detail="Challenge not found")
    return {"message": "Challenge deleted successfully"}

# ========== CHALLENGE OPTION ENDPOINTS ==========

@router.post("/challenges/{challenge_id}/options", response_model=ChallengeOption)
async def create_challenge_option(
    challenge_id: int,
    option_in: ChallengeOptionCreate,
    current_admin: User = Depends(dependencies.get_current_admin_user),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Admin only: Create a new challenge option."""
    service = AdminContentService(db)
    return await service.create_challenge_option(option_in, challenge_id)

@router.put("/options/{option_id}", response_model=ChallengeOption)
async def update_challenge_option(
    option_id: int,
    option_in: ChallengeOptionUpdate,
    current_admin: User = Depends(dependencies.get_current_admin_user),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Admin only: Update a challenge option."""
    service = AdminContentService(db)
    option = await service.update_challenge_option(option_id, option_in)
    if not option:
        raise HTTPException(status_code=404, detail="Challenge option not found")
    return option

@router.delete("/options/{option_id}")
async def delete_challenge_option(
    option_id: int,
    current_admin: User = Depends(dependencies.get_current_admin_user),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Admin only: Delete a challenge option."""
    service = AdminContentService(db)
    success = await service.delete_challenge_option(option_id)
    if not success:
        raise HTTPException(status_code=404, detail="Challenge option not found")
    return {"message": "Challenge option deleted successfully"}
