from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from authlib.integrations.starlette_client import OAuth
from app.api import dependencies
from app.core.config import settings
from app.core.security import create_access_token, create_refresh_token
from app.db.database import get_db
from app.schemas.user import Token, UserCreate, User, FirebaseLoginRequest
import httpx
from jose import jwt
from app.services.auth_service import AuthService

router = APIRouter()

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

async def verify_firebase_token(token: str):
    # Using python-jose which is already in the project and works well with RS256/JWKS
    from jose import jwt, JWTError
    import httpx
    
    print(f"DEBUG: Starting Firebase token verification. Project ID: '{settings.FIREBASE_PROJECT_ID}'")
    
    if not settings.FIREBASE_PROJECT_ID:
        print("ERROR: FIREBASE_PROJECT_ID is not set in environment variables!")
        raise HTTPException(
            status_code=500, 
            detail="Server configuration error: FIREBASE_PROJECT_ID is missing"
        )

    jwks_url = "https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com"
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(jwks_url)
            jwks = response.json()
    except Exception as e:
        print(f"ERROR: Failed to fetch JWKS: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch Firebase public keys")
    
    try:
        unverified_header = jwt.get_unverified_header(token)
        kid = unverified_header.get('kid')
        if not kid:
            raise HTTPException(status_code=401, detail="Missing 'kid' in token header")
            
        # Find the correct key in JWKS
        key = None
        for k in jwks.get('keys', []):
            if k.get('kid') == kid:
                key = k
                break
        
        if not key:
            print(f"ERROR: No matching key found for kid: {kid}")
            raise HTTPException(status_code=401, detail=f"No matching key found for kid: {kid}")

        # Verify the token
        payload = jwt.decode(
            token, 
            key, 
            algorithms=['RS256'],
            audience=settings.FIREBASE_PROJECT_ID,
            issuer=f"https://securetoken.google.com/{settings.FIREBASE_PROJECT_ID}"
        )
        print(f"DEBUG: Token verified successfully for user: {payload.get('email')}")
        return payload
    except JWTError as e:
        print(f"ERROR: Token verification failed: {str(e)}")
        raise HTTPException(
            status_code=401, 
            detail=f"Token verification failed: {str(e)}. (Project: {settings.FIREBASE_PROJECT_ID})"
        )
    except Exception as e:
        print(f"ERROR: Unexpected verification error: {str(e)}")
        raise HTTPException(
            status_code=401, 
            detail=f"Unexpected error during token verification: {str(e)}"
        )

@router.post("/firebase", response_model=Token)
async def firebase_login(
    request: FirebaseLoginRequest,
    db: AsyncSession = Depends(get_db)
) -> Any:
    payload = await verify_firebase_token(request.token)
    
    email = payload.get('email')
    uid = payload.get('sub')
    full_name = payload.get('name')
    picture = payload.get('picture')
    
    if not email:
        raise HTTPException(status_code=400, detail="Email not found in token")
        
    auth_service = AuthService(db)
    user = await auth_service.authenticate_firebase(
        email=email,
        uid=uid,
        full_name=full_name,
        image_src=picture
    )
    
    access_token = create_access_token(subject=user.id)
    refresh_token = create_refresh_token(subject=user.id)
    
    return {
        "access_token": access_token, 
        "token_type": "bearer",
        "refresh_token": refresh_token
    }
