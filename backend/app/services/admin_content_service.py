from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from sqlalchemy.orm import selectinload
from app.models.course import Course, Unit, Lesson, Challenge, ChallengeOption
from app.schemas.admin_content import (
    CourseCreate, CourseUpdate,
    UnitCreate, UnitUpdate,
    LessonCreate, LessonUpdate,
    ChallengeCreate, ChallengeUpdate,
    ChallengeOptionCreate, ChallengeOptionUpdate
)
from typing import List

class AdminContentService:
    def __init__(self, db: AsyncSession):
        self.db = db

    # Course CRUD
    async def create_course(self, course_in: CourseCreate) -> Course:
        course = Course(**course_in.model_dump())
        self.db.add(course)
        await self.db.commit()
        await self.db.refresh(course)
        return course

    async def update_course(self, course_id: int, course_in: CourseUpdate) -> Course | None:
        result = await self.db.execute(
            select(Course)
            .where(Course.id == course_id)
            .options(
                selectinload(Course.units)
                .selectinload(Unit.lessons)
                .selectinload(Lesson.challenges)
                .selectinload(Challenge.options)
            )
        )
        course = result.scalars().first()
        if not course:
            return None
        
        update_data = course_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(course, field, value)
        
        self.db.add(course)
        await self.db.commit()
        await self.db.refresh(course)
        return course

    async def delete_course(self, course_id: int) -> bool:
        result = await self.db.execute(select(Course).where(Course.id == course_id))
        course = result.scalars().first()
        if not course:
            return False
        await self.db.delete(course)
        await self.db.commit()
        return True

    # Unit CRUD
    async def create_unit(self, unit_in: UnitCreate) -> Unit:
        unit = Unit(**unit_in.model_dump())
        self.db.add(unit)
        await self.db.commit()
        await self.db.refresh(unit)
        return unit

    async def update_unit(self, unit_id: int, unit_in: UnitUpdate) -> Unit | None:
        result = await self.db.execute(
            select(Unit)
            .where(Unit.id == unit_id)
            .options(
                selectinload(Unit.lessons)
                .selectinload(Lesson.challenges)
                .selectinload(Challenge.options)
            )
        )
        unit = result.scalars().first()
        if not unit:
            return None
        
        update_data = unit_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(unit, field, value)
        
        self.db.add(unit)
        await self.db.commit()
        await self.db.refresh(unit)
        return unit

    async def delete_unit(self, unit_id: int) -> bool:
        result = await self.db.execute(select(Unit).where(Unit.id == unit_id))
        unit = result.scalars().first()
        if not unit:
            return False
        await self.db.delete(unit)
        await self.db.commit()
        return True

    # Lesson CRUD
    async def create_lesson(self, lesson_in: LessonCreate) -> Lesson:
        lesson = Lesson(**lesson_in.model_dump())
        self.db.add(lesson)
        await self.db.commit()
        await self.db.refresh(lesson)
        return lesson

    async def update_lesson(self, lesson_id: int, lesson_in: LessonUpdate) -> Lesson | None:
        result = await self.db.execute(
            select(Lesson)
            .where(Lesson.id == lesson_id)
            .options(selectinload(Lesson.challenges).selectinload(Challenge.options))
        )
        lesson = result.scalars().first()
        if not lesson:
            return None
        
        update_data = lesson_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(lesson, field, value)
        
        self.db.add(lesson)
        await self.db.commit()
        await self.db.refresh(lesson)
        return lesson

    async def delete_lesson(self, lesson_id: int) -> bool:
        result = await self.db.execute(select(Lesson).where(Lesson.id == lesson_id))
        lesson = result.scalars().first()
        if not lesson:
            return False
        await self.db.delete(lesson)
        await self.db.commit()
        return True

    # Challenge CRUD
    async def create_challenge(self, challenge_in: ChallengeCreate) -> Challenge:
        challenge = Challenge(**challenge_in.model_dump())
        self.db.add(challenge)
        await self.db.commit()
        await self.db.refresh(challenge)
        return challenge

    async def update_challenge(self, challenge_id: int, challenge_in: ChallengeUpdate) -> Challenge | None:
        result = await self.db.execute(
            select(Challenge)
            .where(Challenge.id == challenge_id)
            .options(selectinload(Challenge.options))
        )
        challenge = result.scalars().first()
        if not challenge:
            return None
        
        update_data = challenge_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(challenge, field, value)
        
        self.db.add(challenge)
        await self.db.commit()
        await self.db.refresh(challenge)
        return challenge

    async def delete_challenge(self, challenge_id: int) -> bool:
        result = await self.db.execute(select(Challenge).where(Challenge.id == challenge_id))
        challenge = result.scalars().first()
        if not challenge:
            return False
        await self.db.delete(challenge)
        await self.db.commit()
        return True

    # Challenge Option CRUD
    async def create_challenge_option(self, option_in: ChallengeOptionCreate, challenge_id: int) -> ChallengeOption:
        option = ChallengeOption(challenge_id=challenge_id, **option_in.model_dump())
        self.db.add(option)
        await self.db.commit()
        await self.db.refresh(option)
        return option

    async def update_challenge_option(self, option_id: int, option_in: ChallengeOptionUpdate) -> ChallengeOption | None:
        result = await self.db.execute(select(ChallengeOption).where(ChallengeOption.id == option_id))
        option = result.scalars().first()
        if not option:
            return None
        
        update_data = option_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(option, field, value)
        
        self.db.add(option)
        await self.db.commit()
        await self.db.refresh(option)
        return option

    async def delete_challenge_option(self, option_id: int) -> bool:
        result = await self.db.execute(select(ChallengeOption).where(ChallengeOption.id == option_id))
        option = result.scalars().first()
        if not option:
            return False
        await self.db.delete(option)
        await self.db.commit()
        return True
