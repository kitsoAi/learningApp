import asyncio
import os
import sys
from sqlalchemy import text, select

# Add the parent directory to sys.path to allow imports from app
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.db.database import AsyncSessionLocal, engine, Base
from app.models.course import Course, Unit, Lesson, Challenge, ChallengeOption
from app.models.quest import Quest

CURRICULUM_DATA = {
    "courses": [
        {
            "title": "Learn Setswana",
            "description": "Learn Setswana, the beautiful Bantu language of Botswana and South Africa. This comprehensive course uses interactive exercises to build your skills fast.",
            "image_src": "/flags/bw.svg",
            "units": [
                {
                    "title": "Unit 1: Basics & Greetings",
                    "description": "Master basic pronunciation and greetings",
                    "order_index": 1,
                    "lessons": [
                        {
                            "title": "Formal Greetings",
                            "order_index": 1,
                            "challenges": [
                                {
                                    "type": "MATCH",
                                    "question": "Match the formal greetings",
                                    "order_index": 1,
                                    "options": [
                                        {"text": "Man", "image_src": "rra", "correct": True},
                                        {"text": "Woman", "image_src": "mma", "correct": True},
                                        {"text": "Hello (Formal)", "image_src": "Dumêla", "correct": True},
                                        {"text": "How are you?", "image_src": "o tsogile jang?", "correct": True}
                                    ]
                                },
                                {
                                    "type": "TRANSLATE",
                                    "question": "Translate: 'Hello sir'",
                                    "correct_text": "Dumêla rra",
                                    "order_index": 2,
                                    "options": [
                                        {"text": "Dumêla", "correct": True},
                                        {"text": "rra", "correct": True},
                                        {"text": "mma", "correct": False}
                                    ]
                                }
                            ]
                        }
                    ]
                },
                {
                    "title": "Unit 2: Essential Verbs",
                    "description": "Core action words for daily life",
                    "order_index": 2,
                    "lessons": [
                        {
                            "title": "Common Verbs",
                            "order_index": 1,
                            "challenges": [
                                {
                                    "type": "MATCH",
                                    "question": "Match the verbs to meanings",
                                    "order_index": 1,
                                    "options": [
                                        {"text": "To eat", "image_src": "go ja", "correct": True},
                                        {"text": "To sleep", "image_src": "go robala", "correct": True},
                                        {"text": "To walk", "image_src": "go tsamaya", "correct": True},
                                        {"text": "To see", "image_src": "go bôna", "correct": True}
                                    ]
                                },
                                {
                                    "type": "TRANSLATE",
                                    "question": "Translate: 'I am learning'",
                                    "correct_text": "Ke a ithuta",
                                    "order_index": 2,
                                    "options": [
                                        {"text": "Ke", "correct": True},
                                        {"text": "a", "correct": True},
                                        {"text": "ithuta", "correct": True},
                                        {"text": "ja", "correct": False}
                                    ]
                                }
                            ]
                        }
                    ]
                },
                {
                    "title": "Unit 3: Useful Expressions",
                    "description": "Express needs and ask questions",
                    "order_index": 3,
                    "lessons": [
                        {
                            "title": "Daily Needs",
                            "order_index": 1,
                            "challenges": [
                                {
                                    "type": "LISTEN_TYPE",
                                    "question": "Listen and type: 'I am tired'",
                                    "audio_src": "/assets/es_woman.mp3",
                                    "correct_text": "Ke lapile",
                                    "order_index": 1,
                                    "options": []
                                },
                                {
                                    "type": "TAP_HEAR",
                                    "question": "Translate: 'I don't know'",
                                    "correct_text": "Ga ke itse",
                                    "order_index": 2,
                                    "options": [
                                        {"text": "Ga", "correct": True},
                                        {"text": "ke", "correct": True},
                                        {"text": "itse", "correct": True},
                                        {"text": "batle", "correct": False}
                                    ]
                                }
                            ]
                        }
                    ]
                },
                {
                    "title": "Unit 4: Home & Family",
                    "description": "Talk about your household and relatives",
                    "order_index": 4,
                    "lessons": [
                        {
                            "title": "The Family",
                            "order_index": 1,
                            "challenges": [
                                {
                                    "type": "MATCH",
                                    "question": "Match family members",
                                    "order_index": 1,
                                    "options": [
                                        {"text": "Father", "image_src": "ntate", "correct": True},
                                        {"text": "Mother", "image_src": "mmê", "correct": True},
                                        {"text": "Child", "image_src": "ngwana", "correct": True},
                                        {"text": "Grandma", "image_src": "nkuku", "correct": True}
                                    ]
                                }
                            ]
                        }
                    ]
                },
                {
                    "title": "Unit 8: Safari & Nature",
                    "description": "Learn about the animals and landscape of Botswana",
                    "order_index": 8,
                    "lessons": [
                        {
                            "title": "Safari Animals",
                            "order_index": 1,
                            "challenges": [
                                {
                                    "type": "MATCH",
                                    "question": "Match the animal names",
                                    "order_index": 1,
                                    "options": [
                                        {"text": "Lion", "image_src": "Tau", "correct": True},
                                        {"text": "Elephant", "image_src": "Tlou", "correct": True},
                                        {"text": "Zebra", "image_src": "Pitse ya naga", "correct": True},
                                        {"text": "Giraffe", "image_src": "Thutlwa", "correct": True}
                                    ]
                                },
                                {
                                    "type": "TRANSLATE",
                                    "question": "Translate: 'I see a lion'",
                                    "correct_text": "Ke bona tau",
                                    "order_index": 2,
                                    "options": [
                                        {"text": "Ke", "correct": True},
                                        {"text": "bona", "correct": True},
                                        {"text": "tau", "correct": True},
                                        {"text": "mosadi", "correct": False}
                                    ]
                                }
                            ]
                        }
                    ]
                },
                {
                    "title": "Unit 9: Survival Setswana",
                    "description": "Essential phrases for traveling and asking for help",
                    "order_index": 9,
                    "lessons": [
                        {
                            "title": "Asking for Directions",
                            "order_index": 1,
                            "challenges": [
                                {
                                    "type": "TRANSLATE",
                                    "question": "Translate: 'Where is the shop?'",
                                    "correct_text": "Shopo e kae?",
                                    "order_index": 1,
                                    "options": [
                                        {"text": "Shopo", "correct": True},
                                        {"text": "e", "correct": True},
                                        {"text": "kae?", "correct": True},
                                        {"text": "mang?", "correct": False}
                                    ]
                                },
                                {
                                    "type": "SPEAK",
                                    "question": "Say: 'Ke tswa kwa Botswana'",
                                    "correct_text": "Ke tswa kwa Botswana",
                                    "audio_src": "/assets/es_man.mp3",
                                    "order_index": 2,
                                    "options": []
                                }
                            ]
                        }
                    ]
                },
                {
                    "title": "Unit 10: Travel & Transport",
                    "description": "Navigate your way through Botswana with ease",
                    "order_index": 10,
                    "lessons": [
                        {
                            "title": "Getting Around",
                            "order_index": 1,
                            "challenges": [
                                {
                                    "type": "LISTEN_SELECT",
                                    "question": "Listen and select the correct vehicle",
                                    "audio_src": "/assets/es_man.mp3",
                                    "order_index": 1,
                                    "options": [
                                        {"text": "Bese (Bus)", "correct": True, "image_src": "/assets/bus.svg"},
                                        {"text": "Koloi (Car)", "correct": False, "image_src": "/assets/car.svg"}
                                    ]
                                },
                                {
                                    "type": "MATCH",
                                    "question": "Match the travel terms",
                                    "order_index": 2,
                                    "options": [
                                        {"text": "Ticket", "image_src": "Thekethe", "correct": True},
                                        {"text": "Station", "image_src": "Setaishene", "correct": True},
                                        {"text": "Road", "image_src": "Tsela", "correct": True},
                                        {"text": "Airport", "image_src": "Boemafofane", "correct": True}
                                    ]
                                }
                            ]
                        }
                    ]
                },
                {
                    "title": "Unit 11: Daily Life & Emotions",
                    "description": "Express your feelings and describe your day",
                    "order_index": 11,
                    "lessons": [
                        {
                            "title": "Feelings",
                            "order_index": 1,
                            "challenges": [
                                {
                                    "type": "ASSIST",
                                    "question": "How do you say 'I am happy'?",
                                    "order_index": 1,
                                    "options": [
                                        {"text": "Ke itumetse", "correct": True},
                                        {"text": "Ke hutsafetse", "correct": False}
                                    ]
                                },
                                {
                                    "type": "LISTEN_TYPE",
                                    "question": "Listen and type: 'I am sad'",
                                    "audio_src": "/assets/es_woman.mp3",
                                    "correct_text": "Ke hutsafetse",
                                    "order_index": 2,
                                    "options": []
                                }
                            ]
                        }
                    ]
                }
            ]
        }
    ],
    "quests": [
        {"title": "Day 1", "description": "Start your journey by maintaining a 1-day streak.", "required_streak": 1, "points": 10},
        {"title": "Day 3", "description": "Reach a 3-day streak.", "required_streak": 3, "points": 30},
        {"title": "Day 7", "description": "Reach a 7-day streak.", "required_streak": 7, "points": 100},
        {"title": "Day 14", "description": "Reach a 14-day streak.", "required_streak": 14, "points": 250},
        {"title": "Day 30", "description": "Reach a 1-month streak.", "required_streak": 30, "points": 1000}
    ]
}

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

async def seed_data():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        
    async with AsyncSessionLocal() as db:
        await clear_database(db)
        
        # 1. Seed Courses, Units, Lessons, Challenges
        for course_data in CURRICULUM_DATA["courses"]:
            print(f"Creating course: {course_data['title']}")
            course = Course(
                title=course_data['title'],
                description=course_data.get('description'),
                image_src=course_data.get('image_src'),
                order_index=course_data.get('order_index', 0)
            )
            db.add(course)
            await db.flush()

            for unit_data in course_data.get("units", []):
                unit = Unit(
                    title=unit_data['title'],
                    description=unit_data.get('description'),
                    order_index=unit_data.get('order_index', 0),
                    course_id=course.id
                )
                db.add(unit)
                await db.flush()

                for lesson_data in unit_data.get("lessons", []):
                    lesson = Lesson(
                        title=lesson_data['title'],
                        order_index=lesson_data.get('order_index', 0),
                        unit_id=unit.id
                    )
                    db.add(lesson)
                    await db.flush()

                    for challenge_data in lesson_data.get("challenges", []):
                        challenge = Challenge(
                            lesson_id=lesson.id,
                            type=challenge_data['type'],
                            question=challenge_data['question'],
                            correct_text=challenge_data.get('correct_text'),
                            audio_src=challenge_data.get('audio_src'),
                            order_index=challenge_data.get('order_index', 0)
                        )
                        db.add(challenge)
                        await db.flush()

                        for option_data in challenge_data.get("options", []):
                            option = ChallengeOption(
                                challenge_id=challenge.id,
                                text=option_data['text'],
                                correct=option_data['correct'],
                                image_src=option_data.get('image_src'),
                                audio_src=option_data.get('audio_src')
                            )
                            db.add(option)

        # 2. Seed Quests
        print("Seeding quests...")
        for q_data in CURRICULUM_DATA["quests"]:
            quest = Quest(**q_data)
            db.add(quest)
        
        await db.commit()
        print("Database seeded successfully!")

if __name__ == "__main__":
    asyncio.run(seed_data())
