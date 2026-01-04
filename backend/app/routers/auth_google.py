from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from google.oauth2 import id_token
from google.auth.transport import requests
from sqlmodel import Session, select
from app.database import get_session, settings
from app.models import User
from app.auth import create_access_token

router = APIRouter(prefix="/auth/google", tags=["Authentication"])

GOOGLE_CLIENT_ID = settings.GOOGLE_CLIENT_ID

class GoogleToken(BaseModel):
    token: str

@router.post("/login")
def google_login(
    token_in: GoogleToken,
    session: Session = Depends(get_session)
):
    """
    Verifies a Google ID token and returns a local JWT if the user exists.
    """
    if not GOOGLE_CLIENT_ID:
        raise HTTPException(
            status_code=500,
            detail="Google Client ID not configured"
        )

    try:
        # Verify the ID token
        idinfo = id_token.verify_oauth2_token(
            token_in.token, 
            requests.Request(), 
            GOOGLE_CLIENT_ID
        )

        # ID token is valid. Get user's email from it.
        email = idinfo['email'].lower()
        print(f"Verified Google email: {email}")
        
        # Check if user exists in the primary email field (case-insensitive)
        from sqlalchemy import func
        user = session.exec(select(User).where(func.lower(User.email) == email)).first()
        
        if not user:
            print(f"User {email} not found in database")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Google account {email} is not authorized for this system"
            )
            
        if user.status != "active":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User account is inactive"
            )

        # Create local access token
        access_token = create_access_token(data={"sub": user.email})
        return {"access_token": access_token, "token_type": "bearer"}

    except ValueError as e:
        # Invalid token
        print(f"Google verification error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Google ID Token"
        )
