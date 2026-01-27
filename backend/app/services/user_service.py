from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.user import User
from app.models.quest import Quest, UserQuest
from app.schemas.user import UserUpdate
from datetime import date, timedelta, datetime

class UserService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_user(self, user_id: int) -> User | None:
        result = await self.db.execute(select(User).where(User.id == user_id))
        return result.scalars().first()

    async def update_user(self, user: User, user_in: UserUpdate) -> User:
        update_data = user_in.model_dump(exclude_unset=True)
        if "password" in update_data:
            # Password hashing should be handled by service caller or here if needed, 
            # keeping simple for now assuming already hashed or main update endpoint handles specific logic
            # Actually, let's leave password update out of generic update for safety or assume hashed.
            # But the requirement calls for separate logic. 
            pass
        
        for field, value in update_data.items():
            setattr(user, field, value)
        
        self.db.add(user)
        await self.db.commit()
        await self.db.refresh(user)
        return user

    async def add_xp(self, user: User, xp: int) -> User:
        user.xp += xp
        user.points += xp # Also add points for now

        
        today = date.today()
        
        if user.last_activity_date == today:
            # Same day, just add XP
            pass
        elif user.last_activity_date == today - timedelta(days=1):
            # Consecutive day
            user.streak_count += 1
            if user.streak_count > user.longest_streak:
                user.longest_streak = user.streak_count
            user.last_activity_date = today
            user.streak_frozen = False 
            # Spec: "If streak_frozen = True and only 1 day missed: Keep streak, disable freeze" -> This is for broken streak.
        else:
            # Check if streak frozen
            # default last_activity_date is None for new users
            if user.last_activity_date is None:
                user.streak_count = 1
                user.last_activity_date = today
                user.longest_streak = 1
            else:
                days_missed = (today - user.last_activity_date).days
                # days_missed = 1 means yesterday (handled above)
                # days_missed = 2 means missed 1 day (yesterday)
                
                if user.streak_frozen and days_missed == 2:
                    # Protected by freeze
                    user.streak_frozen = False # Disable freeze
                    # Keep streak count? Spec: "Keep streak, disable freeze"
                    # But we also need to update last_activity_date to today so they don't lose it tomorrow?
                    user.last_activity_date = today
                    # Doesn't increment streak count? Usually it doesn't.
                else:
                    # Reset streak
                    user.streak_count = 1
                    user.last_activity_date = today
        
        # Check for streak quests
        await self._check_streak_quests(user)
        
        self.db.add(user)
        await self.db.commit()
        await self.db.refresh(user)
        return user

    async def _check_streak_quests(self, user: User):
        """Check and award quests based on current streak."""
        # Find quests user hasn't completed yet
        result = await self.db.execute(
            select(Quest)
            .where(Quest.required_streak <= user.streak_count)
        )
        eligible_quests = result.scalars().all()
        
        # Get already completed quest IDs
        completed_result = await self.db.execute(
            select(UserQuest.quest_id)
            .where(UserQuest.user_id == user.id)
        )
        completed_ids = set(completed_result.scalars().all())
        
        for quest in eligible_quests:
            if quest.id not in completed_ids:
                # Award quest
                user_quest = UserQuest(
                    user_id=user.id,
                    quest_id=quest.id,
                    completed=True,
                    completion_date=datetime.utcnow()
                )
                self.db.add(user_quest)
                user.points += quest.points # Reward points

    async def refill_hearts(self, user: User) -> User:
        user.hearts = 5
        self.db.add(user)
        await self.db.commit()
        await self.db.refresh(user)
        return user

    async def reduce_hearts(self, user: User) -> User:
        if user.hearts > 0:
            user.hearts -= 1
            self.db.add(user)
            await self.db.commit()
            await self.db.refresh(user)
        return user
