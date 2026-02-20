import asyncio
import os
import sys
from sqlalchemy import select

# Add the parent directory to sys.path to allow imports from app
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.db.database import AsyncSessionLocal, engine
from app.models.course import Course, Unit, Lesson, Challenge, ChallengeOption

async def verify_db():
    async with AsyncSessionLocal() as db:
        # Get Course
        result = await db.execute(select(Course).where(Course.title == "Learn Setswana"))
        course = result.scalars().first()
        if not course:
            print("Course 'Learn Setswana' not found!")
            return
        
        print(f"Verified Course: {course.title} (ID: {course.id})")
        
        # Get Units
        result = await db.execute(select(Unit).where(Unit.course_id == course.id).order_by(Unit.order_index))
        units = result.scalars().all()
        for unit in units:
            print(f"  Unit: {unit.title} (Order: {unit.order_index})")
            
            # Get Lessons
            result = await db.execute(select(Lesson).where(Lesson.unit_id == unit.id).order_by(Lesson.order_index))
            lessons = result.scalars().all()
            for lesson in lessons:
                print(f"    Lesson: {lesson.title}")
                
                # Get Challenges
                result = await db.execute(select(Challenge).where(Challenge.lesson_id == lesson.id).order_by(Challenge.order_index))
                challenges = result.scalars().all()
                for challenge in challenges:
                    print(f"      Challenge Type: {challenge.type} | Q: {challenge.question[:50]}... | Correct: {challenge.correct_text}")
                    
                    # Get Options
                    result = await db.execute(select(ChallengeOption).where(ChallengeOption.challenge_id == challenge.id))
                    options = result.scalars().all()
                    if options:
                        print(f"        Options: {[opt.text for opt in options]}")

if __name__ == "__main__":
    asyncio.run(verify_db())
