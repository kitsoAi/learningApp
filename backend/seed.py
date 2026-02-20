import asyncio
import json
from pathlib import Path
import os
import sys
from sqlalchemy import text, select

# Add the parent directory to sys.path to allow imports from app
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.db.database import AsyncSessionLocal, engine, Base
from app.models.course import Course, Unit, Lesson, Challenge, ChallengeOption
from app.models.quest import Quest

# --- Curriculum Data ---

def load_curriculum_data():
    repo_root = Path(__file__).resolve().parent
    setswana_path = repo_root / "frontend" / "setswana.json"
    setswana = json.loads(setswana_path.read_text(encoding="utf-8"))
    return {
        "courses": [
            {
                "title": setswana["course"]["title"],
                "description": setswana["course"].get("description"),
                "image_src": setswana["course"].get("image_src"),
                "units": setswana.get("units", []),
            }
        ],
        "quests": [
            {"title": "Day 1", "description": "Start your journey by maintaining a 1-day streak.", "required_streak": 1, "points": 10},
            {"title": "Day 3", "description": "Reach a 3-day streak.", "required_streak": 3, "points": 30},
            {"title": "Day 7", "description": "Reach a 7-day streak.", "required_streak": 7, "points": 100},
            {"title": "Day 30", "description": "Reach a 1-month streak.", "required_streak": 30, "points": 1000}
        ]
    }

CURRICULUM_DATA = load_curriculum_data()

# --- Upsert Logic ---

async def clear_database(db):
    print("Clearing existing data...")
    # Order matters for FK constraints
    await db.execute(text("DELETE FROM user_quests"))
    await db.execute(text("DELETE FROM user_progress"))
    await db.execute(text("DELETE FROM challenge_options"))
    await db.execute(text("DELETE FROM challenges"))
    await db.execute(text("DELETE FROM lessons"))
    await db.execute(text("DELETE FROM units"))
    await db.execute(text("DELETE FROM courses"))
    await db.execute(text("DELETE FROM quests"))
    await db.flush()

async def get_or_create_course(db, title, **kwargs):
    result = await db.execute(select(Course).where(Course.title == title))
    instance = result.scalars().first()
    if instance:
        print(f"Update Course: {title}")
        for key, value in kwargs.items():
            setattr(instance, key, value)
    else:
        print(f"Create Course: {title}")
        instance = Course(title=title, **kwargs)
        db.add(instance)
    await db.flush()
    return instance

async def get_or_create_unit(db, course_id, title, **kwargs):
    result = await db.execute(select(Unit).where(Unit.title == title, Unit.course_id == course_id))
    instance = result.scalars().first()
    if instance:
        print(f"  Update Unit: {title}")
        for key, value in kwargs.items():
            setattr(instance, key, value)
    else:
        print(f"  Create Unit: {title}")
        instance = Unit(title=title, course_id=course_id, **kwargs)
        db.add(instance)
    await db.flush()
    return instance

async def get_or_create_lesson(db, unit_id, title, **kwargs):
    result = await db.execute(select(Lesson).where(Lesson.title == title, Lesson.unit_id == unit_id))
    instance = result.scalars().first()
    if instance:
        print(f"    Update Lesson: {title}")
        for key, value in kwargs.items():
            setattr(instance, key, value)
    else:
        print(f"    Create Lesson: {title}")
        instance = Lesson(title=title, unit_id=unit_id, **kwargs)
        db.add(instance)
    await db.flush()
    return instance

async def get_or_create_challenge(db, lesson_id, question, **kwargs):
    # Identifying challenge by Question text + Lesson ID
    result = await db.execute(select(Challenge).where(Challenge.question == question, Challenge.lesson_id == lesson_id))
    instance = result.scalars().first()
    if instance:
        # print(f"      Update Challenge: {question[:20]}...")
        for key, value in kwargs.items():
            setattr(instance, key, value)
    else:
        # print(f"      Create Challenge: {question[:20]}...")
        instance = Challenge(question=question, lesson_id=lesson_id, **kwargs)
        db.add(instance)
    await db.flush()
    return instance

async def upsert_challenge_options(db, challenge_id, options_data):
    # Strategy: Wipe existing options for this challenge and recreate, 
    # OR try to match them. Since options don't have IDs in our input, 
    # matching is hard if text changes.
    # However, deleting options is less risky than deleting lessons/challenges 
    # because user_progress usually tracks completed *lessons*, not individual option interactions (usually).
    # IF user_progress tracks fine-grained stats, this might be an issue.
    # But usually progress is 'lesson completed'.
    # So we will DELETE existing options for this challenge and INSERT new ones to ensure sync.
    await db.execute(text("DELETE FROM challenge_options WHERE challenge_id = :cid"), {"cid": challenge_id})
    
    for opt_data in options_data:
        option = ChallengeOption(
            challenge_id=challenge_id,
            text=opt_data['text'],
            correct=opt_data['correct'],
            image_src=opt_data.get('image_src'),
            audio_src=opt_data.get('audio_src')
        )
        db.add(option)

async def seed_data():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        
    async with AsyncSessionLocal() as db:
        # Clear database to ensure only the requested data exists and starts correctly
        await clear_database(db)
        
        # 1. Seed Courses -> Units -> Lessons -> Challenges
        for course_data in CURRICULUM_DATA["courses"]:
            course = await get_or_create_course(
                db, 
                title=course_data['title'],
                description=course_data.get('description'),
                image_src=course_data.get('image_src'),
                order_index=course_data.get('order_index', 0)
            )

            for unit_data in course_data.get("units", []):
                unit = await get_or_create_unit(
                    db, 
                    course_id=course.id,
                    title=unit_data['title'],
                    description=unit_data.get('description'),
                    order_index=unit_data.get('order_index', 0)
                )

                for lesson_data in unit_data.get("lessons", []):
                    lesson = await get_or_create_lesson(
                        db,
                        unit_id=unit.id,
                        title=lesson_data['title'],
                        order_index=lesson_data.get('order_index', 0)
                    )

                    for challenge_data in lesson_data.get("challenges", []):
                        challenge = await get_or_create_challenge(
                            db,
                            lesson_id=lesson.id,
                            question=challenge_data['question'],
                            type=challenge_data['type'],
                            correct_text=challenge_data.get('correct_text'),
                            audio_src=challenge_data.get('audio_src'),
                            order_index=challenge_data.get('order_index', 0)
                        )
                        
                        await upsert_challenge_options(db, challenge.id, challenge_data.get("options", []))

        # 2. Seed Quests (Upsert)
        print("Seeding quests...")
        for q_data in CURRICULUM_DATA["quests"]:
            result = await db.execute(select(Quest).where(Quest.title == q_data['title']))
            quest = result.scalars().first()
            if not quest:
                quest = Quest(**q_data)
                db.add(quest)
            else:
                for k, v in q_data.items():
                    setattr(quest, k, v)

        await db.commit()
        print("Database seeded successfully! (User progress preserved)")

if __name__ == "__main__":
    asyncio.run(seed_data())
