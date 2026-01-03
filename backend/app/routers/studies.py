from fastapi import APIRouter, Depends, HTTPException, status
import json
from sqlmodel import Session, select
from typing import List
from app.database import get_session
from app.models import Study, User
from app.schemas import StudyCreate, StudyUpdate, StudyRead
from app.auth import get_current_user, admin_required
from app.audit import log_change
from datetime import datetime

router = APIRouter(prefix="/studies", tags=["Studies"])

@router.post("/", response_model=StudyRead, status_code=status.HTTP_201_CREATED)
def create_study(
    study_in: StudyCreate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """
    Creates a new research study. 
    Administrative access is NOT strictly required for creation, but can be configured.
    """
    db_study = Study.from_orm(study_in)
    db_study.created_by = current_user.email
    db_study.updated_by = current_user.email
    
    session.add(db_study)
    session.commit()
    session.refresh(db_study)
    
    # Audit Log
    log_change(
        session=session,
        table_name="study",
        record_id=db_study.id,
        action="INSERT",
        changed_by=current_user.email,
        new_state=json.loads(db_study.json())
    )
    session.commit()
    
    return db_study

@router.get("/", response_model=List[StudyRead])
def list_studies(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Lists all studies that the current user has access to."""
    # TODO: Implement granular StudyUserAccess filtering
    statement = select(Study)
    results = session.exec(statement).all()
    return results

@router.get("/{study_id}", response_model=StudyRead)
def get_study(
    study_id: str,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Returns details for a specific study."""
    study = session.get(Study, study_id)
    if not study:
        raise HTTPException(status_code=404, detail="Study not found")
    return study

@router.patch("/{study_id}", response_model=StudyRead)
def update_study(
    study_id: str,
    study_in: StudyUpdate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Updates an existing study and records the change in the audit log."""
    db_study = session.get(Study, study_id)
    if not db_study:
        raise HTTPException(status_code=404, detail="Study not found")
    
    prev_state = json.loads(db_study.json())
    
    study_data = study_in.dict(exclude_unset=True)
    for key, value in study_data.items():
        setattr(db_study, key, value)
    
    db_study.updated_at = datetime.utcnow()
    db_study.updated_by = current_user.email
    
    session.add(db_study)
    session.commit()
    session.refresh(db_study)
    
    # Audit Log
    log_change(
        session=session,
        table_name="study",
        record_id=db_study.id,
        action="UPDATE",
        changed_by=current_user.email,
        prev_state=prev_state,
        new_state=json.loads(db_study.json())
    )
    session.commit()
    
    return db_study

@router.delete("/{study_id}", status_code=status.HTTP_204_NO_CONTENT)
@admin_required
def delete_study(
    study_id: str,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Deletes a study. Requires administrative privileges."""
    db_study = session.get(Study, study_id)
    if not db_study:
        raise HTTPException(status_code=404, detail="Study not found")
    
    prev_state = json.loads(db_study.json())
    
    session.delete(db_study)
    
    # Audit Log
    log_change(
        session=session,
        table_name="study",
        record_id=db_study.id,
        action="DELETE",
        changed_by=current_user.email,
        prev_state=prev_state,
        new_state={}
    )
    
    session.commit()
    return None
