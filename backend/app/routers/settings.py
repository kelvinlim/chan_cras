from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from typing import List, Optional
import uuid
from app.database import get_session
from app.models import SystemSetting, User
from app.schemas import SubjectRead # Temporary placeholder if needed, usually we define specific schemas
from app.auth import get_current_user, admin_required
from app.audit import log_change

router = APIRouter(prefix="/settings", tags=["Settings"])

@router.get("/", response_model=List[SystemSetting])
async def list_settings(
    session: Session = Depends(get_session),
    current_user: User = Depends(admin_required)
):
    """Admin only: List all system settings."""
    return session.exec(select(SystemSetting)).all()

@router.get("/config")
async def get_public_config(session: Session = Depends(get_session)):
    """Public: Get non-sensitive configuration."""
    # Specifically expose timezone
    tz_setting = session.exec(select(SystemSetting).where(SystemSetting.key == "DEFAULT_TIMEZONE")).first()
    return {
        "DEFAULT_TIMEZONE": tz_setting.value if tz_setting else "Asia/Hong_Kong"
    }

@router.patch("/{key}", response_model=SystemSetting)
async def update_setting(
    key: str,
    value: str,
    session: Session = Depends(get_session),
    current_user: User = Depends(admin_required)
):
    """Admin only: Update a system setting."""
    setting = session.exec(select(SystemSetting).where(SystemSetting.key == key)).first()
    if not setting:
        # Create it if it doesn't exist? For now, just raise error if we expect predefined keys
        raise HTTPException(status_code=404, detail="Setting not found")
    
    prev_state = setting.dict()
    setting.value = value
    
    session.add(setting)
    session.commit()
    session.refresh(setting)
    
    log_change(
        session=session,
        table_name="system_setting",
        record_id=setting.id,
        action="UPDATE",
        changed_by=current_user.email,
        prev_state=prev_state,
        new_state=setting.dict()
    )
    
    return setting

@router.post("/", response_model=SystemSetting, status_code=status.HTTP_201_CREATED)
async def create_setting(
    setting_in: SystemSetting, # Using model as simple schema for now
    session: Session = Depends(get_session),
    current_user: User = Depends(admin_required)
):
    """Admin only: Create a new system setting."""
    session.add(setting_in)
    session.commit()
    session.refresh(setting_in)
    
    log_change(
        session=session,
        table_name="system_setting",
        record_id=setting_in.id,
        action="INSERT",
        changed_by=current_user.email,
        prev_state={},
        new_state=setting_in.dict()
    )
    
    return setting_in
