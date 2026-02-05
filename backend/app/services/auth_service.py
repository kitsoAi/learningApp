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
            
        # Special case: Ensure the default admin user always has admin privileges
        if email == "admin@puolingo.com" and not user.is_admin:
            user.is_admin = True
            self.db.add(user)
            await self.db.commit()
            await self.db.refresh(user)
            
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
        # Repurposing for backward compatibility or removing
        user = await self.get_user_by_email(email)
        if not user:
            db_user = User(
                email=email,
                firebase_id=google_id, # Link it to firebase_id
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
            if not user.firebase_id:
                user.firebase_id = google_id
                if image_src:
                    user.image_src = image_src
                self.db.add(user)
                await self.db.commit()
                await self.db.refresh(user)
            return user

    async def authenticate_firebase(self, email: str, uid: str, full_name: str | None, image_src: str | None) -> User:
        user = await self.get_user_by_email(email)
        if not user:
            # Check by uid first to be sure
            result = await self.db.execute(select(User).where(User.firebase_id == uid))
            user = result.scalars().first()
            
        if not user:
            # Create new user
            db_user = User(
                email=email,
                firebase_id=uid,
                full_name=full_name,
                image_src=image_src,
                is_active=True,
                points=0,
                hearts=5,
                xp=0,
                streak_count=0,
                is_admin=(email == "admin@puolingo.com") # Set admin if email matches
            )
            self.db.add(db_user)
            await self.db.commit()
            await self.db.refresh(db_user)
            return db_user
        else:
            # Update user info if missing
            should_update = False
            if image_src and not user.image_src:
                user.image_src = image_src
                should_update = True
            if full_name and not user.full_name:
                user.full_name = full_name
                should_update = True
            if not user.firebase_id:
                user.firebase_id = uid
                should_update = True
            
            # Special case: Ensure the default admin user always has admin privileges
            if email == "admin@puolingo.com" and not user.is_admin:
                user.is_admin = True
                should_update = True
            
            if should_update:
                self.db.add(user)
                await self.db.commit()
                await self.db.refresh(user)
            
            return user
