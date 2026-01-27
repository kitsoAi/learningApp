from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import date

class UserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None
    is_active: Optional[bool] = True
    is_admin: Optional[bool] = False

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    password: Optional[str] = None
    image_src: Optional[str] = None

class UserInDBBase(UserBase):
    id: int
    image_src: Optional[str] = None
    hearts: int
    points: int
    xp: int
    streak_count: int
    last_activity_date: Optional[date] = None
    longest_streak: int
    streak_frozen: bool
    
    class Config:
        from_attributes = True

class User(UserInDBBase):
    pass

class Token(BaseModel):
    access_token: str
    token_type: str
    refresh_token: str

class TokenPayload(BaseModel):
    sub: Optional[str] = None
