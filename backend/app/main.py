from datetime import timedelta
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import Session, select
from app.database import get_session, engine
from app.models import User, Study
from app.auth import (
    authenticate_user, 
    create_access_token, 
    get_current_user, 
    ACCESS_TOKEN_EXPIRE_MINUTES,
    admin_required
)

app = FastAPI(
    title="Clinical Research Management System (CRAS)",
    description="FDA Part 11 Compliant Research Management Platform",
    version="0.1.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict this to the frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Note: authenticate_user needs to be implemented in auth.py
# I will implement it now.

@app.post("/auth/login")
async def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    session: Session = Depends(get_session)
):
    """Local Admin/User authentication fallback."""
    user = authenticate_user(session, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/users/me", response_model=User)
async def read_users_me(current_user: User = Depends(get_current_user)):
    """Retrieve the current authenticated user's profile."""
    return current_user

@app.get("/studies", response_model=list[Study])
async def read_studies(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """List studies accessible to the current user."""
    # In a real scenario, this would filter based on StudyUserAccess
    statement = select(Study)
    results = session.exec(statement).all()
    return results

@app.get("/")
def read_root():
    return {"message": "Welcome to HKU CRAS API"}
