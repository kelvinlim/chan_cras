from fastapi import APIRouter, Depends, HTTPException, status
import json
from sqlmodel import Session, select
from typing import List
from app.database import get_session
from app.models import Procedure, User
from app.schemas import ProcedureCreate, ProcedureUpdate, ProcedureRead
from app.auth import get_current_user
from app.audit import log_change
from datetime import datetime

router = APIRouter(prefix="/procedures", tags=["Procedures"])

@router.post("/", response_model=ProcedureRead, status_code=status.HTTP_201_CREATED)
def create_procedure(
    procedure_in: ProcedureCreate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """
    Creates a new research procedure/protocol.
    The `form_data_schema` JSONB field allows defining dynamic form fields.
    """
    db_procedure = Procedure.from_orm(procedure_in)
    db_procedure.created_by = current_user.email
    db_procedure.updated_by = current_user.email
    
    session.add(db_procedure)
    session.commit()
    session.refresh(db_procedure)
    
    # Audit Log
    log_change(
        session=session,
        table_name="procedure",
        record_id=db_procedure.id,
        action="INSERT",
        changed_by=current_user.email,
        new_state=json.loads(db_procedure.json())
    )
    session.commit()
    
    return db_procedure

@router.get("/", response_model=List[ProcedureRead])
def list_procedures(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Lists all procedures."""
    statement = select(Procedure)
    results = session.exec(statement).all()
    return results

@router.get("/{procedure_id}", response_model=ProcedureRead)
def get_procedure(
    procedure_id: str,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Returns details for a specific procedure."""
    procedure = session.get(Procedure, procedure_id)
    if not procedure:
        raise HTTPException(status_code=404, detail="Procedure not found")
    return procedure

@router.patch("/{procedure_id}", response_model=ProcedureRead)
def update_procedure(
    procedure_id: str,
    procedure_in: ProcedureUpdate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Updates protocol definitions and audits the changes."""
    db_procedure = session.get(Procedure, procedure_id)
    if not db_procedure:
        raise HTTPException(status_code=404, detail="Procedure not found")
    
    prev_state = json.loads(db_procedure.json())
    
    procedure_data = procedure_in.dict(exclude_unset=True)
    for key, value in procedure_data.items():
        setattr(db_procedure, key, value)
    
    db_procedure.updated_at = datetime.utcnow()
    db_procedure.updated_by = current_user.email
    
    session.add(db_procedure)
    session.commit()
    session.refresh(db_procedure)
    
    # Audit Log
    log_change(
        session=session,
        table_name="procedure",
        record_id=db_procedure.id,
        action="UPDATE",
        changed_by=current_user.email,
        prev_state=prev_state,
        new_state=json.loads(db_procedure.json())
    )
    session.commit()
    
    return db_procedure
