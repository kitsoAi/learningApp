from sqlalchemy import Integer, String, Text, Boolean, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from typing import List, Optional
from app.db.database import Base

class Course(Base):
    __tablename__ = "courses"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    title: Mapped[str] = mapped_column(String)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    image_src: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    order_index: Mapped[int] = mapped_column(Integer, default=0)
    
    units: Mapped[List["Unit"]] = relationship("Unit", back_populates="course", cascade="all, delete-orphan")

class Unit(Base):
    __tablename__ = "units"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    title: Mapped[str] = mapped_column(String)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    course_id: Mapped[int] = mapped_column(ForeignKey("courses.id"))
    order_index: Mapped[int] = mapped_column(Integer, default=0)
    
    course: Mapped["Course"] = relationship("Course", back_populates="units")
    lessons: Mapped[List["Lesson"]] = relationship("Lesson", back_populates="unit", cascade="all, delete-orphan")

class Lesson(Base):
    __tablename__ = "lessons"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    title: Mapped[str] = mapped_column(String)
    unit_id: Mapped[int] = mapped_column(ForeignKey("units.id"))
    order_index: Mapped[int] = mapped_column(Integer, default=0)
    
    unit: Mapped["Unit"] = relationship("Unit", back_populates="lessons")
    challenges: Mapped[List["Challenge"]] = relationship("Challenge", back_populates="lesson", cascade="all, delete-orphan")
    # Add backref for progress if needed, but progress links to lesson_id mainly.

class Challenge(Base):
    __tablename__ = "challenges"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    lesson_id: Mapped[int] = mapped_column(ForeignKey("lessons.id"))
    type: Mapped[str] = mapped_column(String) # e.g., "SELECT", "ASSIST", "TRANSLATE", "MATCH", "TAP_HEAR", "LISTEN_TYPE", "SPEAK"
    question: Mapped[str] = mapped_column(Text)
    correct_text: Mapped[Optional[str]] = mapped_column(Text, nullable=True) # For non-option based challenges
    audio_src: Mapped[Optional[str]] = mapped_column(String, nullable=True) # For listening/dictation challenges
    order_index: Mapped[int] = mapped_column(Integer, default=0)
    
    lesson: Mapped["Lesson"] = relationship("Lesson", back_populates="challenges")
    options: Mapped[List["ChallengeOption"]] = relationship("ChallengeOption", back_populates="challenge", cascade="all, delete-orphan")

class ChallengeOption(Base):
    __tablename__ = "challenge_options"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    challenge_id: Mapped[int] = mapped_column(ForeignKey("challenges.id"))
    text: Mapped[str] = mapped_column(String)
    correct: Mapped[bool] = mapped_column(Boolean, default=False)
    image_src: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    audio_src: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    
    challenge: Mapped["Challenge"] = relationship("Challenge", back_populates="options")
