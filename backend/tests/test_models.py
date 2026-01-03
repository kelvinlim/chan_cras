import pytest
import uuid
from datetime import datetime, timedelta
from sqlmodel import Session, create_engine, SQLModel, select
from app.models import User, Study, Subject, Procedure, Event, AuditLog, StudyUserAccess

# Mock DB for testing
sqlite_url = "sqlite://"
engine = create_engine(sqlite_url, connect_args={"check_same_thread": False})

@pytest.fixture(name="session")
def session_fixture():
    SQLModel.metadata.create_all(engine)
    with Session(engine) as session:
        yield session
    SQLModel.metadata.drop_all(engine)

def test_user_study_relationship(session: Session):
    """Test many-to-many relationship between User and Study."""
    user = User(lastname="Doe", firstname="John", email="john@hku.hk", created_by="system", updated_by="system")
    study = Study(title="Cancer Research", principal_investigator="Dr. Smith", created_by="system", updated_by="system")
    
    session.add(user)
    session.add(study)
    session.commit()
    
    # Add link
    access = StudyUserAccess(study_id=study.id, user_id=user.id, access_level=2)
    session.add(access)
    session.commit()
    
    # Refresh and check
    session.refresh(user)
    session.refresh(study)
    
    assert len(user.studies) == 1
    assert user.studies[0].title == "Cancer Research"
    assert len(study.users) == 1
    assert study.users[0].firstname == "John"

def test_audit_log_playback(session: Session):
    """Test that we can reconstruct state at any point in time."""
    record_id = uuid.uuid4()
    table_name = "event"
    
    # State 1 at 10:00
    t1 = datetime(2025, 1, 1, 10, 0, 0)
    log1 = AuditLog(
        table_name=table_name,
        record_id=record_id,
        action="INSERT",
        changed_by="user1",
        changed_at=t1,
        new_state={"status": "pending", "data": "A"}
    )
    session.add(log1)
    
    # State 2 at 11:00
    t2 = datetime(2025, 1, 1, 11, 0, 0)
    log2 = AuditLog(
        table_name=table_name,
        record_id=record_id,
        action="UPDATE",
        changed_by="user2",
        changed_at=t2,
        prev_state={"status": "pending", "data": "A"},
        new_state={"status": "completed", "data": "A"}
    )
    session.add(log2)
    
    # State 3 at 12:00
    t3 = datetime(2025, 1, 1, 12, 0, 0)
    log3 = AuditLog(
        table_name=table_name,
        record_id=record_id,
        action="UPDATE",
        changed_by="user1",
        changed_at=t3,
        prev_state={"status": "completed", "data": "A"},
        new_state={"status": "completed", "data": "B"}
    )
    session.add(log3)
    session.commit()
    
    def get_state_at(dt: datetime):
        statement = select(AuditLog).where(
            AuditLog.record_id == record_id,
            AuditLog.table_name == table_name,
            AuditLog.changed_at <= dt
        ).order_by(AuditLog.changed_at.desc())
        latest_log = session.exec(statement).first()
        return latest_log.new_state if latest_log else None

    # Check playback
    assert get_state_at(datetime(2025, 1, 1, 10, 30)) == {"status": "pending", "data": "A"}
    assert get_state_at(datetime(2025, 1, 1, 11, 30)) == {"status": "completed", "data": "A"}
    assert get_state_at(datetime(2025, 1, 1, 13, 0)) == {"status": "completed", "data": "B"}
    assert get_state_at(datetime(2025, 1, 1, 9, 0)) is None
