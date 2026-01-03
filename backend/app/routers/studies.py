from fastapi import APIRouter, Depends, HTTPException, status
import json
import uuid
from sqlmodel import Session, select
from typing import List
from app.database import get_session
from app.models import Study, User, StudySubjectLink
from app.schemas import StudyCreate, StudyUpdate, StudyRead, SubjectRead
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
    try:
        log_change(
            session=session,
            table_name="study",
            record_id=db_study.id,
            action="INSERT",
            changed_by=current_user.email,
            new_state=json.loads(db_study.json())
        )
        session.commit()
    except Exception as e:
        # We record the error but don't fail the primary transaction if audit fails
        # In a real production system, you might want stricter adherence.
        print(f"Audit Log Error (Study Create): {e}")
    
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

# --- M2M Study-Subject Linkage ---

@router.post("/{study_id}/subjects/{subject_id}", status_code=status.HTTP_201_CREATED)
def link_subject_to_study(
    study_id: uuid.UUID,
    subject_id: uuid.UUID,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Associates a subject with a study."""
    # Check if link already exists
    statement = select(StudySubjectLink).where(
        StudySubjectLink.study_id == study_id,
        StudySubjectLink.subject_id == subject_id
    )
    existing = session.exec(statement).first()
    if existing:
        return {"message": "Subject already linked to study"}
    
    link = StudySubjectLink(study_id=study_id, subject_id=subject_id)
    session.add(link)
    
    # Audit log (optional but recommended for FDA compliance)
    log_change(
        session=session,
        table_name="studysubjectlink",
        record_id=study_id, # Linking can be audited on the study record or a join table record
        action="LINK_SUBJECT",
        changed_by=current_user.email,
        new_state={"subject_id": str(subject_id)}
    )
    
    session.commit()
    return {"message": "Subject linked successfully"}

@router.delete("/{study_id}/subjects/{subject_id}")
def unlink_subject_from_study(
    study_id: uuid.UUID,
    subject_id: uuid.UUID,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Removes the association between a subject and a study."""
    statement = select(StudySubjectLink).where(
        StudySubjectLink.study_id == study_id,
        StudySubjectLink.subject_id == subject_id
    )
    link = session.exec(statement).first()
    if not link:
        raise HTTPException(status_code=404, detail="Link not found")
    
    session.delete(link)
    
    log_change(
        session=session,
        table_name="studysubjectlink",
        record_id=study_id,
        action="UNLINK_SUBJECT",
        changed_by=current_user.email,
        prev_state={"subject_id": str(subject_id)}
    )
    
    session.commit()
    return {"message": "Subject unlinked successfully"}

@router.get("/{study_id}/subjects", response_model=List[SubjectRead])
def get_study_subjects(
    study_id: uuid.UUID,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Returns all subjects associated with a specific study."""
    study = session.get(Study, study_id)
    if not study:
        raise HTTPException(status_code=404, detail="Study not found")
    return study.subjects
