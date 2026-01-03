from fastapi import APIRouter, Depends, HTTPException, status
import json
from sqlmodel import Session, select
from typing import List, Optional
from app.database import get_session
from app.models import Event, User
from app.auth import get_current_user
from app.audit import log_change
from datetime import datetime
from pydantic import BaseModel
import uuid

# Define basic Event schemas inline for now or move to schemas.py
class EventBase(BaseModel):
    study_id: uuid.UUID
    subject_id: uuid.UUID
    procedure_id: uuid.UUID
    start_datetime: datetime
    end_datetime: datetime = None
    status: str = "pending"
    notes: Optional[str] = None
    metadata_blob: dict = {}
    procedure_data: dict = {}

class EventCreate(EventBase):
    pass

class EventRead(EventBase):
    id: uuid.UUID
    ref_code: str
    created_at: datetime

    class Config:
        from_attributes = True

router = APIRouter(prefix="/events", tags=["Events"])

@router.post("/", response_model=EventRead, status_code=status.HTTP_201_CREATED)
def create_event(
    event_in: EventCreate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Records a new clinical event (procedure performanced on a subject)."""
    db_event = Event.from_orm(event_in)
    db_event.created_by = current_user.email
    db_event.updated_by = current_user.email
    
    session.add(db_event)
    session.commit()
    session.refresh(db_event)
    
    # Audit Log
    log_change(
        session=session,
        table_name="event",
        record_id=db_event.id,
        action="INSERT",
        changed_by=current_user.email,
        new_state=json.loads(db_event.json())
    )
    session.commit()
    
    return db_event

@router.get("/", response_model=List[EventRead])
def list_events(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Lists all clinical events."""
    statement = select(Event)
    results = session.exec(statement).all()
    return results

@router.patch("/{event_id}", response_model=EventRead)
def update_event(
    event_id: str,
    event_data: dict, # Dynamic data update
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Updates event status or procedure data and logs the change."""
    db_event = session.get(Event, event_id)
    if not db_event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    prev_state = json.loads(db_event.json())
    
    for key, value in event_data.items():
        if hasattr(db_event, key):
            setattr(db_event, key, value)
    
    db_event.updated_at = datetime.utcnow()
    db_event.updated_by = current_user.email
    
    session.add(db_event)
    session.commit()
    session.refresh(db_event)
    
    # Audit Log
    log_change(
        session=session,
        table_name="event",
        record_id=db_event.id,
        action="UPDATE",
        changed_by=current_user.email,
        prev_state=prev_state,
        new_state=json.loads(db_event.json())
    )
    session.commit()
    
    return db_event

@router.delete("/{event_id}")
def delete_event(
    event_id: uuid.UUID,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Deletes an event and logs the change."""
    db_event = session.get(Event, event_id)
    if not db_event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    prev_state = json.loads(db_event.json())
    
    session.delete(db_event)
    session.commit()
    
    # Audit Log
    log_change(
        session=session,
        table_name="event",
        record_id=db_event.id,
        action="DELETE",
        changed_by=current_user.email,
        prev_state=prev_state,
        new_state=None
    )
    session.commit()
    
    return {"message": "Event deleted successfully"}
