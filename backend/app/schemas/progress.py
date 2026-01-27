from pydantic import BaseModel
from typing import Optional

class ProgressBase(BaseModel):
    lesson_id: int
    completed: bool = False
    hearts_used: int = 0
    points_earned: int = 0

class ProgressCreate(ProgressBase):
    pass

class ProgressUpdate(BaseModel):
    completed: Optional[bool] = None
    hearts_used: Optional[int] = None
    points_earned: Optional[int] = None

class Progress(ProgressBase):
    id: int
    user_id: int
    
    class Config:
        from_attributes = True
