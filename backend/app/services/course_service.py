from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.models.course import Course, Unit, Lesson, Challenge
from app.models.progress import UserProgress
from typing import List, Optional

class CourseService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_courses(self, user_id: Optional[int] = None) -> List[Course]:
        result = await self.db.execute(
            select(Course).order_by(Course.order_index).options(
                selectinload(Course.units)
                .selectinload(Unit.lessons)
                .selectinload(Lesson.challenges)
                .selectinload(Challenge.options)
            )
        )
        courses = list(result.scalars().all())
        
        if not user_id:
            # For anonymous users, first course is unlocked, others locked
            for i, course in enumerate(courses):
                course.locked = i > 0
                course.completed = False
            return courses

        # Fetch all completed lesson IDs for the user
        progress_result = await self.db.execute(
            select(UserProgress.lesson_id).where(
                UserProgress.user_id == user_id,
                UserProgress.completed == True
            )
        )
        completed_lesson_ids = set(progress_result.scalars().all())

        # Determine completion and locking for each course
        previous_course_completed = True # First course is always unlocked
        for course in courses:
            # A course is completed if all its lessons are completed
            course_all_lessons = [l.id for u in course.units for l in u.lessons]
            if not course_all_lessons:
                # If a course has no lessons, consider it completed if it's not the first one?
                # Actually, let's say it's completed if it exists.
                course.completed = True
            else:
                course.completed = all(lid in completed_lesson_ids for lid in course_all_lessons)
            
            # A course is locked if the previous course was NOT completed
            course.locked = not previous_course_completed
            
            # Prepare for next iteration
            previous_course_completed = course.completed

        return courses

    async def get_course(self, course_id: int) -> Course | None:
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
        return result.scalars().first()

    async def get_course_with_progress(self, course_id: int, user_id: Optional[int] = None) -> Course | None:
        course = await self.get_course(course_id)
        if not course:
            return None
        
        if not user_id:
            return course

        # Fetch all completed lesson IDs for the user
        progress_result = await self.db.execute(
            select(UserProgress.lesson_id).where(
                UserProgress.user_id == user_id,
                UserProgress.completed == True
            )
        )
        completed_lesson_ids = set(progress_result.scalars().all())

        # Sort units by order_index just in case
        course.units.sort(key=lambda x: x.order_index)

        # Overlay progress and determine unit locking
        previous_unit_completed = True # First unit is always unlocked
        for unit in course.units:
            unit_lessons_count = len(unit.lessons)
            completed_unit_lessons = 0
            
            for lesson in unit.lessons:
                lesson.completed = lesson.id in completed_lesson_ids
                if lesson.completed:
                    completed_unit_lessons += 1
            
            # Unit completion: all lessons are completed
            unit.completed = unit_lessons_count > 0 and completed_unit_lessons == unit_lessons_count
            
            # Unit locking: previous unit must be completed
            unit.locked = not previous_unit_completed
            
            # Pass forward for next unit
            previous_unit_completed = unit.completed
        
        return course

    async def get_lesson(self, lesson_id: int) -> Lesson | None:
        result = await self.db.execute(
            select(Lesson)
            .where(Lesson.id == lesson_id)
            .options(selectinload(Lesson.challenges).selectinload(Challenge.options))
        )
        return result.scalars().first()

