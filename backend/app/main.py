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

import os
from app.routers import studies, subjects, procedures, events, settings, users, auth_google

app = FastAPI(
    title="Clinical Research Management System (CRAS)",
    description="FDA Part 11 Compliant Research Management Platform",
    version="0.1.0",
    root_path=os.getenv("CRAS_API_ROOT_PATH", "")
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Login endpoint
@app.post("/auth/login")
async def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    session: Session = Depends(get_session)
):
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

# Protected common endpoints
@app.get("/users/me", response_model=User)
async def read_users_me(current_user: User = Depends(get_current_user)):
    return current_user

# Include routers
app.include_router(studies.router)
app.include_router(subjects.router)
app.include_router(procedures.router)
app.include_router(events.router)
app.include_router(settings.router)
app.include_router(users.router)
app.include_router(auth_google.router)

@app.get("/")
def read_root():
    return {"message": "Welcome to HKU CRAS API"}
