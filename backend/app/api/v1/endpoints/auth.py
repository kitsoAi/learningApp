from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from authlib.integrations.starlette_client import OAuth
from app.api import dependencies
from app.core.config import settings
from app.core.security import create_access_token, create_refresh_token
from app.db.database import get_db
from app.schemas.user import Token, UserCreate, User
from app.services.auth_service import AuthService

router = APIRouter()
oauth = OAuth()
oauth.register(
    name='google',
    client_id=settings.GOOGLE_CLIENT_ID,
    client_secret=settings.GOOGLE_CLIENT_SECRET,
    server_metadata_url='https://accounts.google.com/.well-known/openid-configuration',
    client_kwargs={'scope': 'openid email profile'}
)

@router.post("/register", response_model=User)
async def register(
    user_in: UserCreate,
    db: AsyncSession = Depends(get_db)
) -> Any:
    auth_service = AuthService(db)
    user = await auth_service.register_user(user_in)
    return user

@router.post("/login", response_model=Token)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db)
) -> Any:
    auth_service = AuthService(db)
    user = await auth_service.authenticate_user(form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = create_access_token(subject=user.id)
    refresh_token = create_refresh_token(subject=user.id)
    return {
        "access_token": access_token, 
        "token_type": "bearer",
        "refresh_token": refresh_token
    }

@router.get("/google")
async def google_login(request: Request):
    redirect_uri = settings.GOOGLE_REDIRECT_URI
    return await oauth.google.authorize_redirect(request, redirect_uri)

@router.get("/google/callback", response_model=Token)
async def google_callback(request: Request, db: AsyncSession = Depends(get_db)):
    token = await oauth.google.authorize_access_token(request)
    user_info = token.get('userinfo')
    if not user_info: # explicit check if not automatically in token
         user_info = await oauth.google.userinfo(token=token)
         
    auth_service = AuthService(db)
    user = await auth_service.authenticate_google(
        email=user_info['email'],
        google_id=user_info['sub'],
        full_name=user_info.get('name'),
        image_src=user_info.get('picture')
    )
    
    access_token = create_access_token(subject=user.id)
    refresh_token = create_refresh_token(subject=user.id)
    # Ideally redirect to frontend with tokens in query params or cookie, 
    # but requirement says "Redirect to frontend with tokens". 
    # Returning JSON here isn't a redirect. 
    # But usually API returns JSON. If this is a browser redirect callback, we should RedirectResponse.
    # "Redirect to frontend with tokens" -> RedirectResponse(url=f"{FRONTEND_URL}?token=...")
    from fastapi.responses import RedirectResponse
    frontend_url = settings.FRONTEND_URL
    return RedirectResponse(
        url=f"{frontend_url}/auth/callback?access_token={access_token}&refresh_token={refresh_token}"
    )

@router.post("/refresh", response_model=Token)
async def refresh_token_endpoint(
    refresh_token: str,
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Refresh access token using a valid refresh token."""
    from jose import jwt, JWTError
    try:
        payload = jwt.decode(refresh_token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id = payload.get("sub")
        if not user_id or not payload.get("refresh"):
            raise HTTPException(status_code=401, detail="Invalid refresh token")
        
        # Generate new tokens
        access_token = create_access_token(subject=user_id)
        new_refresh_token = create_refresh_token(subject=user_id)
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "refresh_token": new_refresh_token
        }
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid refresh token")
