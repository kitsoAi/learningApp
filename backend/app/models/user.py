from sqlalchemy import Integer, String, Boolean, DateTime, Date
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime, date
from typing import Optional
from app.db.database import Base

class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    email: Mapped[str] = mapped_column(String, unique=True, index=True)
    full_name: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    hashed_password: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    is_admin: Mapped[bool] = mapped_column(Boolean, default=False)
    firebase_id: Mapped[Optional[str]] = mapped_column(String, unique=True, nullable=True)
    image_src: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    
    # Game mechanics
    hearts: Mapped[int] = mapped_column(Integer, default=5)
    points: Mapped[int] = mapped_column(Integer, default=0)
    xp: Mapped[int] = mapped_column(Integer, default=0)
    
    # Streak tracking
    streak_count: Mapped[int] = mapped_column(Integer, default=0)
    last_activity_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    longest_streak: Mapped[int] = mapped_column(Integer, default=0)
    streak_frozen: Mapped[bool] = mapped_column(Boolean, default=False)
    
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    progress: Mapped[list["UserProgress"]] = relationship("UserProgress", back_populates="user")
