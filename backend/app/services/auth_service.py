from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.user import User
from app.schemas.user import UserCreate
from app.core.security import get_password_hash, verify_password, create_access_token, create_refresh_token
from fastapi import HTTPException, status

class AuthService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_user_by_email(self, email: str) -> User | None:
        result = await self.db.execute(select(User).where(User.email == email))
        return result.scalars().first()

    async def authenticate_user(self, email: str, password: str) -> User | None:
        user = await self.get_user_by_email(email)
        if not user or not user.hashed_password:
            return None
        if not verify_password(password, user.hashed_password):
            return None
        return user

    async def register_user(self, user_in: UserCreate) -> User:
        user = await self.get_user_by_email(user_in.email)
        if user:
            raise HTTPException(
                status_code=400,
                detail="Email already registered"
            )
        
        hashed_password = get_password_hash(user_in.password)
        db_user = User(
            email=user_in.email,
            hashed_password=hashed_password,
            full_name=user_in.full_name,
            points=0,
            hearts=5,
            xp=0,
            streak_count=0
        )
        self.db.add(db_user)
        await self.db.commit()
        await self.db.refresh(db_user)
        return db_user

    async def authenticate_google(self, email: str, google_id: str, full_name: str, image_src: str) -> User:
        user = await self.get_user_by_email(email)
        if not user:
            # Create new user
            db_user = User(
                email=email,
                google_id=google_id,
                full_name=full_name,
                image_src=image_src,
                is_active=True,
                points=0,
                hearts=5,
                xp=0,
                streak_count=0
            )
            self.db.add(db_user)
            await self.db.commit()
            await self.db.refresh(db_user)
            return db_user
        else:
            # Link Google ID if not linked
            if not user.google_id:
                user.google_id = google_id
                # Update other fields if needed
                if image_src:
                    user.image_src = image_src
                self.db.add(user)
                await self.db.commit()
                await self.db.refresh(user)
            return user
