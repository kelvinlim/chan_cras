from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from typing import List
import json

from app.database import get_session
from app.models import User
from app.auth import get_current_user, admin_required, get_password_hash
from app.schemas import UserCreate, UserUpdate, UserRead
from app.audit import log_change

router = APIRouter(prefix="/users", tags=["Users"])

@router.get("/", response_model=List[UserRead])
def list_users(
    session: Session = Depends(get_session),
    current_user: User = Depends(admin_required(2))
):
    """Lists all users (Administrator only)."""
    statement = select(User)
    results = session.exec(statement).all()
    return results

@router.post("/", response_model=UserRead, status_code=status.HTTP_201_CREATED)
def create_user(
    user_in: UserCreate,
    session: Session = Depends(get_session),
    current_user: User = Depends(admin_required(2))
):
    """Creates a new user (Administrator only)."""
    # Check if email exists
    existing = session.exec(select(User).where(User.email == user_in.email)).first()
    if existing:
        raise HTTPException(status_code=400, detail="User with this email already exists")

    # Hash password and store in metadata_blob
    hashed_pw = get_password_hash(user_in.password)
    
    # Prepare data for model
    user_data = user_in.dict(exclude={"password"})
    db_user = User.from_orm(user_data)
    
    # Initialize metadata_blob if needed and set password
    if not db_user.metadata_blob:
        db_user.metadata_blob = {}
    db_user.metadata_blob["hashed_password"] = hashed_pw
    
    db_user.created_at = db_user.created_at.utcnow()
    db_user.updated_at = db_user.created_at
    
    # Ensure ref_code is set (default_factory should handle this, but being explicit)
    from app.utils import generate_user_code
    if not db_user.ref_code:
        db_user.ref_code = generate_user_code()
        
    db_user.created_by = current_user.email
    db_user.updated_by = current_user.email
    
    session.add(db_user)
    session.commit()
    session.refresh(db_user)
    
    # Audit Log
    log_change(
        session=session,
        table_name="user",
        record_id=db_user.id,
        action="INSERT",
        changed_by=current_user.email,
        new_state=json.loads(db_user.json())
    )
    session.commit()
    
    return db_user

@router.patch("/{user_id}", response_model=UserRead)
def update_user(
    user_id: str,
    user_in: UserUpdate,
    session: Session = Depends(get_session),
    current_user: User = Depends(admin_required(2))
):
    """Updates user details (Administrator only)."""
    db_user = session.get(User, user_id)
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    prev_state = json.loads(db_user.json())
    
    update_data = user_in.dict(exclude_unset=True)
    
    if "password" in update_data:
        hashed_pw = get_password_hash(update_data.pop("password"))
        new_blob = dict(db_user.metadata_blob or {})
        new_blob["hashed_password"] = hashed_pw
        db_user.metadata_blob = new_blob
    
    for key, value in update_data.items():
        setattr(db_user, key, value)
    
    db_user.updated_at = db_user.updated_at.utcnow()
    db_user.updated_by = current_user.email
    
    session.add(db_user)
    session.commit()
    session.refresh(db_user)
    
    # Audit Log
    log_change(
        session=session,
        table_name="user",
        record_id=db_user.id,
        action="UPDATE",
        changed_by=current_user.email,
        prev_state=prev_state,
        new_state=json.loads(db_user.json())
    )
    session.commit()
    
    return db_user

@router.delete("/{user_id}")
def delete_user(
    user_id: str,
    session: Session = Depends(get_session),
    current_user: User = Depends(admin_required(2))
):
    """Deactivates a user (Administrator only)."""
    db_user = session.get(User, user_id)
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Instead of hard delete, we'll set status to inactive
    prev_state = json.loads(db_user.json())
    db_user.status = "inactive"
    db_user.updated_by = current_user.email
    
    session.add(db_user)
    session.commit()
    
    # Audit Log
    log_change(
        session=session,
        table_name="user",
        record_id=db_user.id,
        action="DEACTIVATE",
        changed_by=current_user.email,
        prev_state=prev_state,
        new_state=json.loads(db_user.json())
    )
    session.commit()
    
    return {"message": "User deactivated successfully"}
