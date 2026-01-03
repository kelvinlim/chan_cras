import uuid
from datetime import datetime
from typing import Any, Dict, Optional, Type, TypeVar
from sqlmodel import Session, select, SQLModel
from app.models import AuditLog

T = TypeVar("T", bound=SQLModel)

def log_change(
    session: Session,
    table_name: str,
    record_id: uuid.UUID,
    action: str,
    changed_by: str,
    prev_state: Optional[Dict[str, Any]] = None,
    new_state: Optional[Dict[str, Any]] = None,
) -> AuditLog:
    """
    Records a change entry in the AuditLog.
    
    :param session: Active database session.
    :param table_name: Name of the table being modified.
    :param record_id: ID of the record being modified.
    :param action: Action performed (INSERT, UPDATE, DELETE).
    :param changed_by: ID or email of the user who made the change.
    :param prev_state: dictionary representing the state before the change.
    :param new_state: dictionary representing the state after the change.
    :return: The created AuditLog entry.
    """
    log_entry = AuditLog(
        table_name=table_name,
        record_id=record_id,
        action=action,
        changed_by=changed_by,
        changed_at=datetime.utcnow(),
        prev_state=prev_state or {},
        new_state=new_state or {}
    )
    session.add(log_entry)
    return log_entry

def reconstruct_state(
    session: Session,
    table_name: str,
    record_id: uuid.UUID,
    at_datetime: datetime
) -> Optional[Dict[str, Any]]:
    """
    Reconstructs the state of a specific record at a given point in time
    by playing back the audit log.
    
    :param session: Active database session.
    :param table_name: Name of the table.
    :param record_id: ID of the record.
    :param at_datetime: The target point in time for reconstruction.
    :return: A dictionary representing the record state at that time, or None.
    """
    # Find the most recent audit log entry before or at the specified datetime
    statement = (
        select(AuditLog)
        .where(
            AuditLog.table_name == table_name,
            AuditLog.record_id == record_id,
            AuditLog.changed_at <= at_datetime
        )
        .order_by(AuditLog.changed_at.desc())
    )
    latest_log = session.exec(statement).first()
    
    if not latest_log:
        return None
    
    # In our implementation, we store the full 'new_state' in each log entry.
    # This makes reconstruction a O(1) database lookup instead of a full playback.
    # If the record was DELETED at that time, we'd check if the action was DELETE.
    if latest_log.action == "DELETE":
        return None
        
    return latest_log.new_state
