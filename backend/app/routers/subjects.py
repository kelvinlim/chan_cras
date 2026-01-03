from fastapi import APIRouter, Depends, HTTPException, status
import json
from sqlmodel import Session, select
from typing import List
from app.database import get_session
from app.models import Subject, User
from app.schemas import SubjectCreate, SubjectUpdate, SubjectRead
from app.auth import get_current_user
from app.audit import log_change
from datetime import datetime

router = APIRouter(prefix="/subjects", tags=["Subjects"])

@router.post("/", response_model=SubjectRead, status_code=status.HTTP_201_CREATED)
def create_subject(
    subject_in: SubjectCreate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Adds a new research subject (participant)."""
    db_subject = Subject.from_orm(subject_in)
    db_subject.created_by = current_user.email
    db_subject.updated_by = current_user.email
    
    session.add(db_subject)
    session.commit()
    session.refresh(db_subject)
    
    # Audit Log
    log_change(
        session=session,
        table_name="subject",
        record_id=db_subject.id,
        action="INSERT",
        changed_by=current_user.email,
        new_state=json.loads(db_subject.json())
    )
    session.commit()
    
    return db_subject

@router.get("/", response_model=List[SubjectRead])
def list_subjects(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Lists all subjects."""
    statement = select(Subject)
    results = session.exec(statement).all()
    return results

@router.get("/{subject_id}", response_model=SubjectRead)
def get_subject(
    subject_id: str,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Returns details for a specific subject."""
    subject = session.get(Subject, subject_id)
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")
    return subject

@router.patch("/{subject_id}", response_model=SubjectRead)
def update_subject(
    subject_id: str,
    subject_in: SubjectUpdate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Updates participant information and audits the change."""
    db_subject = session.get(Subject, subject_id)
    if not db_subject:
        raise HTTPException(status_code=404, detail="Subject not found")
    
    prev_state = json.loads(db_subject.json())
    
    subject_data = subject_in.dict(exclude_unset=True)
    for key, value in subject_data.items():
        setattr(db_subject, key, value)
    
    db_subject.updated_at = datetime.utcnow()
    db_subject.updated_by = current_user.email
    
    session.add(db_subject)
    session.commit()
    session.refresh(db_subject)
    
    # Audit Log
    log_change(
        session=session,
        table_name="subject",
        record_id=db_subject.id,
        action="UPDATE",
        changed_by=current_user.email,
        prev_state=prev_state,
        new_state=json.loads(db_subject.json())
    )
    session.commit()
    
    return db_subject
