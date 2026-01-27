from fastapi import APIRouter
from app.api.v1.endpoints import auth, users, courses, lessons, progress, admin, admin_content, leaderboard, quests

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(admin.router, prefix="/admin", tags=["admin"])
api_router.include_router(admin_content.router, prefix="/admin/content", tags=["admin-content"])
api_router.include_router(courses.router, prefix="/courses", tags=["courses"])
api_router.include_router(lessons.router, prefix="/lessons", tags=["lessons"])
api_router.include_router(progress.router, prefix="/progress", tags=["progress"])
api_router.include_router(leaderboard.router, prefix="/leaderboard", tags=["leaderboard"])
api_router.include_router(quests.router, prefix="/quests", tags=["quests"])
