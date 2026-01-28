import asyncio
import os
import sys

# Add the parent directory to sys.path to allow imports from app
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.db.database import AsyncSessionLocal
from app.models.user import User
from app.core.security import get_password_hash

async def create_admin_user():
    """Create an admin user for testing"""
    async with AsyncSessionLocal() as db:
        # Check if admin already exists
        from sqlalchemy import select
        result = await db.execute(select(User).where(User.email == "admin@puolingo.com"))
        existing_admin = result.scalar_one_or_none()
        
        if existing_admin:
            print("❌ Admin user already exists!")
            return
        
        # Create admin user
        admin_user = User(
            email="admin@puolingo.com",
            full_name="Admin User",
            hashed_password=get_password_hash("admin123"),  # Default password
            is_active=True,
            is_admin=True,
            hearts=5,
            points=0,
            xp=0,
            streak_count=0,
            longest_streak=0,
            streak_frozen=False
        )
        
        db.add(admin_user)
        await db.commit()
        
        print("✅ Admin user created successfully!")
        print("📧 Email: admin@puolingo.com")
        print("🔑 Password: admin123")
        print("\n⚠️  IMPORTANT: Change this password in production!")

if __name__ == "__main__":
    asyncio.run(create_admin_user())
