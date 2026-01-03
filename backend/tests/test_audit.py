import pytest
import uuid
from datetime import datetime, timedelta
from sqlmodel import Session, create_engine, SQLModel
from app.models import AuditLog
from app.audit import log_change, reconstruct_state

# Mock DB for testing
sqlite_url = "sqlite://"
engine = create_engine(sqlite_url, connect_args={"check_same_thread": False})

@pytest.fixture(name="session")
def session_fixture():
    SQLModel.metadata.create_all(engine)
    with Session(engine) as session:
        yield session
    SQLModel.metadata.drop_all(engine)

def test_log_change(session: Session):
    """Test that log_change correctly adds an entry to the AuditLog."""
    record_id = uuid.uuid4()
    log_change(
        session,
        table_name="event",
        record_id=record_id,
        action="INSERT",
        changed_by="admin@hku.hk",
        new_state={"status": "pending"}
    )
    session.commit()
    
    log = session.get(AuditLog, session.exec(select(AuditLog.id).where(AuditLog.record_id == record_id)).first())
    assert log is not None
    assert log.table_name == "event"
    assert log.action == "INSERT"
    assert log.new_state == {"status": "pending"}

def test_reconstruct_state_simple(session: Session):
    """Test simple state reconstruction."""
    record_id = uuid.uuid4()
    t1 = datetime.utcnow() - timedelta(hours=1)
    
    # Manually adding logs (using log_change would use current time, harder to test specific 'at')
    log1 = AuditLog(
        table_name="event",
        record_id=record_id,
        action="INSERT",
        changed_by="u1",
        changed_at=t1,
        new_state={"val": 1}
    )
    session.add(log1)
    session.commit()
    
    # Reconstruct at t1 + 30 mins
    state = reconstruct_state(session, "event", record_id, t1 + timedelta(minutes=30))
    assert state == {"val": 1}
    
    # Reconstruct before t1
    state_before = reconstruct_state(session, "event", record_id, t1 - timedelta(minutes=30))
    assert state_before is None

def test_reconstruct_with_delete(session: Session):
    """Test reconstruction when a record was deleted."""
    record_id = uuid.uuid4()
    t1 = datetime.utcnow() - timedelta(hours=2)
    t2 = datetime.utcnow() - timedelta(hours=1)
    
    session.add(AuditLog(
        table_name="study", record_id=record_id, action="INSERT", 
        changed_by="u1", changed_at=t1, new_state={"name": "S1"}
    ))
    session.add(AuditLog(
        table_name="study", record_id=record_id, action="DELETE", 
        changed_by="u1", changed_at=t2, prev_state={"name": "S1"}
    ))
    session.commit()
    
    # State between t1 and t2
    assert reconstruct_state(session, "study", record_id, t1 + timedelta(minutes=30)) == {"name": "S1"}
    # State after t2
    assert reconstruct_state(session, "study", record_id, t2 + timedelta(minutes=30)) is None

from sqlmodel import select # Ensure select is available for the test helper
