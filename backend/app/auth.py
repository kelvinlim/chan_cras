import os
from datetime import datetime, timedelta
from typing import Optional, List
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlmodel import Session, select
from app.database import get_session
from app.models import User

# Security configuration
SECRET_KEY = os.getenv("SECRET_KEY", "7e8f5c9d2b1a4a3e9b8c7d6e5a4b3c2d1e0f9a8b7c6d5e4f3a2b1c0d9e8f7a6")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 4320 # 3 days

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifies a plain password against a hash."""
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    """Generates a bcrypt hash of a password."""
    return pwd_context.hash(password)

def authenticate_user(session: Session, email: str, password: str) -> Optional[User]:
    """Authenticates a user against the local database."""
    user = session.exec(select(User).where(User.email == email)).first()
    if not user:
        return None
    # For local admin auth, we assume User table has a hashed_password or similar.
    # To stick to part 11 and our SDD, we'll check against a password stored in metadata_blob
    # or a dedicated field if we added it (we didn't yet, so I'll check metadata_blob['hashed_password'])
    stored_hash = user.metadata_blob.get("hashed_password")
    if not stored_hash or not verify_password(password, stored_hash):
        return None
    return user

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Generates a JWT access token."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(
    token: str = Depends(oauth2_scheme), 
    session: Session = Depends(get_session)
) -> User:
    """Dependency to retrieve the current authenticated user."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
        
    user = session.exec(select(User).where(User.email == email)).first()
    if user is None:
        raise credentials_exception
    return user

def admin_required(admin_level: int = 1):
    """Higher-order function for RBAC level enforcement."""
    async def decorator(current_user: User = Depends(get_current_user)):
        if not current_user.is_superuser and current_user.admin_level < admin_level:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Operation not permitted for this administrative level"
            )
        return current_user
    return decorator
