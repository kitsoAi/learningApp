from pydantic import BaseModel
from typing import List, Optional

class ChallengeOptionBase(BaseModel):
    text: str
    correct: bool
    image_src: Optional[str] = None
    audio_src: Optional[str] = None

class ChallengeOption(ChallengeOptionBase):
    id: int
    
    class Config:
        from_attributes = True

class ChallengeBase(BaseModel):
    type: str
    question: str
    correct_text: Optional[str] = None
    audio_src: Optional[str] = None
    order_index: int

class Challenge(ChallengeBase):
    id: int
    options: List[ChallengeOption] = []
    
    class Config:
        from_attributes = True

class LessonBase(BaseModel):
    title: str
    order_index: int

class Lesson(LessonBase):
    id: int
    challenges: List[Challenge] = []
    completed: bool = False # Computed field for frontend
    
    class Config:
        from_attributes = True

class UnitBase(BaseModel):
    title: str
    description: Optional[str] = None
    order_index: int

class Unit(UnitBase):
    id: int
    lessons: List[Lesson] = []
    locked: bool = True
    completed: bool = False
    
    class Config:
        from_attributes = True

class CourseBase(BaseModel):
    title: str
    description: Optional[str] = None
    image_src: Optional[str] = None
    order_index: int = 0

class CourseList(CourseBase):
    """Simplified course schema for listing - no nested relationships"""
    id: int
    locked: bool = True
    completed: bool = False
    
    class Config:
        from_attributes = True

class Course(CourseBase):
    """Full course schema with nested relationships"""
    id: int
    units: List[Unit] = []
    locked: bool = False
    completed: bool = False
    
    class Config:
        from_attributes = True
