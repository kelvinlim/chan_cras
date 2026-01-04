from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session
import pyotp
import os
from typing import Optional
from jose import JWTError, jwt
from datetime import datetime, timedelta

from app.database import get_session
from app.models import User
from app.schemas import MFASetupResponse, MFAVerify
from app.auth import get_current_user, create_access_token, ALGORITHM

router = APIRouter(prefix="/auth/mfa", tags=["MFA"])

SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key")

@router.get("/setup", response_model=MFASetupResponse)
def setup_mfa(
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Generates a new TOTP secret for the user."""
    # Only generate if not already enabled, OR allow regeneration (overwrites old)
    secret = pyotp.random_base32()
    # Provisioning URI for QR code
    # Issuer name should be the system name
    totp = pyotp.TOTP(secret)
    provisioning_uri = totp.provisioning_uri(
        name=current_user.email, 
        issuer_name="HKU-CRAS"
    )
    
    # Store secret temporarily in User model (but don't enable yet)
    current_user.mfa_secret = secret
    session.add(current_user)
    session.commit()
    
    return {"secret": secret, "provisioning_uri": provisioning_uri}

@router.post("/enable")
def enable_mfa(
    verify_data: MFAVerify,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Verifies a code and enables MFA for the user."""
    if not current_user.mfa_secret:
        raise HTTPException(status_code=400, detail="MFA setup not initiated")
    
    totp = pyotp.TOTP(current_user.mfa_secret)
    if not totp.verify(verify_data.code):
        raise HTTPException(status_code=400, detail="Invalid verification code")
    
    current_user.mfa_enabled = True
    session.add(current_user)
    session.commit()
    
    return {"message": "MFA enabled successfully"}

@router.post("/disable")
def disable_mfa(
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Disables MFA for the current user."""
    current_user.mfa_enabled = False
    current_user.mfa_secret = None
    session.add(current_user)
    session.commit()
    return {"message": "MFA disabled successfully"}

@router.post("/verify")
def verify_mfa_login(
    verify_data: MFAVerify,
    session: Session = Depends(get_session)
):
    """Verifies the MFA code during login stage 2."""
    if not verify_data.mfa_token:
        raise HTTPException(status_code=400, detail="MFA token required")
    
    try:
        # Decode the temporary MFA token to get the user email
        payload = jwt.decode(verify_data.mfa_token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise HTTPException(status_code=401, detail="Invalid MFA token")
            
        # Optional: check if token is specifically an 'mfa' type if we add that to payload
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired MFA token")
        
    user = session.query(User).filter(User.email == email).first()
    if not user or not user.mfa_secret:
        raise HTTPException(status_code=401, detail="User not found or MFA not configured")
        
    totp = pyotp.TOTP(user.mfa_secret)
    if not totp.verify(verify_data.code):
        raise HTTPException(status_code=401, detail="Invalid MFA code")
        
    # Validation successful, issue final access token
    access_token = create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer"}
