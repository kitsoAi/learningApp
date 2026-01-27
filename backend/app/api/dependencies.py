from typing import Generator, Annotated
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from pydantic import ValidationError
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.config import settings
from app.db.database import get_db
from app.models.user import User
from app.schemas.user import TokenPayload
from app.services.user_service import UserService

oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_STR}/auth/login")

async def get_current_user(
    token: Annotated[str, Depends(oauth2_scheme)],
    db: Annotated[AsyncSession, Depends(get_db)]
) -> User:
    print(f"DEBUG: get_current_user: received token (start): {token[:10]}...")
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        token_data = TokenPayload(**payload)
        print(f"DEBUG: get_current_user: token decoded successfully for sub: {token_data.sub}")
    except (JWTError, ValidationError) as e:
        print(f"DEBUG: get_current_user: JWT error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Could not validate credentials",
        )
    
    user_service = UserService(db)
    user = await user_service.get_user(int(token_data.sub))
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user = await user_service.get_user(int(token_data.sub))
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

oauth2_scheme_optional = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_STR}/auth/login", auto_error=False)

async def get_current_user_optional(
    token: Annotated[str | None, Depends(oauth2_scheme_optional)],
    db: Annotated[AsyncSession, Depends(get_db)]
) -> User | None:
    if not token:
        return None
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        token_data = TokenPayload(**payload)
    except (JWTError, ValidationError):
        return None
    
    user_service = UserService(db)
    user = await user_service.get_user(int(token_data.sub))
    return user
 


async def get_current_admin_user(
    current_user: Annotated[User, Depends(get_current_user)]
) -> User:
    """Dependency to ensure current user is an admin."""
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions. Admin access required."
        )
    return current_user
