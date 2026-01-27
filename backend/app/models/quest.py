from sqlalchemy import Integer, String, Text, Boolean, ForeignKey, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime
from app.db.database import Base

class Quest(Base):
    __tablename__ = "quests"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    title: Mapped[str] = mapped_column(String)
    description: Mapped[str] = mapped_column(Text)
    points: Mapped[int] = mapped_column(Integer, default=0)
    required_streak: Mapped[int] = mapped_column(Integer) # For streak-based quests
    
    user_quests: Mapped[list["UserQuest"]] = relationship("UserQuest", back_populates="quest", cascade="all, delete-orphan")

class UserQuest(Base):
    __tablename__ = "user_quests"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    quest_id: Mapped[int] = mapped_column(ForeignKey("quests.id"))
    completed: Mapped[bool] = mapped_column(Boolean, default=False)
    completion_date: Mapped[datetime] = mapped_column(DateTime, nullable=True)
    
    quest: Mapped["Quest"] = relationship("Quest", back_populates="user_quests")
