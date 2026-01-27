from pydantic import BaseModel
from typing import Optional

# Challenge Option schemas
class ChallengeOptionCreate(BaseModel):
    text: str
    correct: bool
    image_src: Optional[str] = None
    audio_src: Optional[str] = None

class ChallengeOptionUpdate(BaseModel):
    text: Optional[str] = None
    correct: Optional[bool] = None
    image_src: Optional[str] = None
    audio_src: Optional[str] = None

# Challenge schemas
class ChallengeCreate(BaseModel):
    lesson_id: int
    type: str  # "SELECT", "ASSIST", etc.
    question: str
    correct_text: Optional[str] = None
    audio_src: Optional[str] = None
    order_index: int = 0

class ChallengeUpdate(BaseModel):
    type: Optional[str] = None
    question: Optional[str] = None
    correct_text: Optional[str] = None
    audio_src: Optional[str] = None
    order_index: Optional[int] = None

# Lesson schemas
class LessonCreate(BaseModel):
    title: str
    unit_id: int
    order_index: int = 0

class LessonUpdate(BaseModel):
    title: Optional[str] = None
    order_index: Optional[int] = None

# Unit schemas
class UnitCreate(BaseModel):
    title: str
    description: Optional[str] = None
    course_id: int
    order_index: int = 0

class UnitUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    order_index: Optional[int] = None

# Course schemas
class CourseCreate(BaseModel):
    title: str
    description: Optional[str] = None
    image_src: Optional[str] = None
    order_index: int = 0

class CourseUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    image_src: Optional[str] = None
    order_index: Optional[int] = None
