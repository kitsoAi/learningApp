from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class QuestBase(BaseModel):
    title: str
    description: str
    points: int
    required_streak: int

class Quest(QuestBase):
    id: int
    
    class Config:
        from_attributes = True

class UserQuestBase(BaseModel):
    quest_id: int
    completed: bool = False
    completion_date: Optional[datetime] = None

class UserQuest(UserQuestBase):
    id: int
    quest: Quest
    
    class Config:
        from_attributes = True

class QuestProgress(Quest):
    completed: bool = False
    
    class Config:
        from_attributes = True
