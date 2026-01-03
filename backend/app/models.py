import uuid
from datetime import datetime
from typing import Optional, List, Dict, Any
from sqlmodel import SQLModel, Field, Relationship
from sqlalchemy.dialects.postgresql import JSONB
from app.utils import (
    uuid7, 
    generate_short_code, 
    generate_study_code, 
    generate_event_code, 
    generate_procedure_code, 
    generate_subject_code
)

# --- Base Model ---
class BaseModel(SQLModel):
    """
    Base model featuring UUID7 IDs, human-readable Ref Codes, and audit timestamps.
    """
    id: uuid.UUID = Field(default_factory=uuid7, primary_key=True)
    ref_code: str = Field(
        unique=True, 
        index=True, 
        max_length=12
    )
    created_at: datetime = Field(default_factory=datetime.utcnow)
    created_by: Optional[str] = Field(default=None)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    updated_by: Optional[str] = Field(default=None)

# --- Join Table for Study/User Access ---
class StudyUserAccess(SQLModel, table=True):
    """
    Many-to-many mapping for User access to specific Studies.
    """
    study_id: uuid.UUID = Field(foreign_key="study.id", primary_key=True)
    user_id: uuid.UUID = Field(foreign_key="user.id", primary_key=True)
    access_level: int = Field(default=1)  # 1=Read, 2=CRUD

# --- Entity Models ---

class User(BaseModel, table=True):
    """
    System users with administrative and study-level access.
    """
    lastname: str
    firstname: str
    middlename: Optional[str] = None
    email: str = Field(index=True, unique=True)
    phone: Optional[str] = None
    gmail: Optional[str] = None  # For Google Auth mapping
    
    status: str = Field(default="active")  # active, inactive
    is_superuser: bool = False
    admin_level: int = Field(default=0)  # 0=none, 1=study limited, 2=study full
    ref_code: str = Field(default_factory=lambda: generate_short_code(prefix="us-", use_mid_hyphen=False), unique=True, index=True)
    
    metadata_blob: Dict[str, Any] = Field(default={}, sa_type=JSONB)
    
    # Relationships
    studies: List["Study"] = Relationship(back_populates="users", link_model=StudyUserAccess)

class Study(BaseModel, table=True):
    """
    A clinical research project.
    """
    title: str
    description: Optional[str] = None
    principal_investigator: str
    ref_code: str = Field(default_factory=generate_study_code, unique=True, index=True)
    is_active: bool = True
    
    metadata_blob: Dict[str, Any] = Field(default={}, sa_type=JSONB)
    
    # Relationships
    users: List["User"] = Relationship(back_populates="studies", link_model=StudyUserAccess)
    procedures: List["Procedure"] = Relationship(back_populates="study")
    events: List["Event"] = Relationship(back_populates="study")

class Subject(BaseModel, table=True):
    """
    Clinical research participants.
    """
    lastname: str
    firstname: str
    middlename: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    ref_code: str = Field(default_factory=generate_subject_code, unique=True, index=True)
    birthdate: datetime
    gender: Optional[str] = None
    
    # Privacy: Random UUID4 for data sharing (contains no timestamp info)
    unique_uuid: uuid.UUID = Field(default_factory=uuid.uuid4, index=True)
    
    # Relationships
    events: List["Event"] = Relationship(back_populates="subject")

class Procedure(BaseModel, table=True):
    """
    Protocol definitions with dynamic schemas.
    """
    study_id: uuid.UUID = Field(foreign_key="study.id")
    name: str  
    ref_code: str = Field(default_factory=generate_procedure_code, unique=True, index=True)
    description: str  
    
    form_data_schema: Dict[str, Any] = Field(default={}, sa_type=JSONB) 
    metadata_blob: Dict[str, Any] = Field(default={}, sa_type=JSONB)

    # Relationships
    study: Optional[Study] = Relationship(back_populates="procedures")
    events: List["Event"] = Relationship(back_populates="procedure")

class Event(BaseModel, table=True):
    """
    Transactional record of a procedure performed on a subject.
    """
    study_id: uuid.UUID = Field(foreign_key="study.id")
    subject_id: uuid.UUID = Field(foreign_key="subject.id")
    procedure_id: uuid.UUID = Field(foreign_key="procedure.id")
    
    start_datetime: datetime
    end_datetime: Optional[datetime] = None
    
    ref_code: str = Field(default_factory=generate_event_code, unique=True, index=True)
    status: str = Field(default="pending")  # pending, completed, cancelled, no_show
    
    metadata_blob: Dict[str, Any] = Field(default={}, sa_type=JSONB)
    procedure_data: Dict[str, Any] = Field(default={}, sa_type=JSONB)
    
    # Relationships
    study: Optional[Study] = Relationship(back_populates="events")
    subject: Optional[Subject] = Relationship(back_populates="events")
    procedure: Optional[Procedure] = Relationship(back_populates="events")

# --- Audit Log (FDA Part 11) ---

class AuditLog(SQLModel, table=True):
    """
    Tracks all changes for compliance and state reconstruction.
    """
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    table_name: str
    record_id: uuid.UUID
    action: str  # INSERT, UPDATE, DELETE
    changed_by: str
    changed_at: datetime = Field(default_factory=datetime.utcnow)
    
    # prev_state stores full record BEFORE change
    # new_state stores full record AFTER change
    prev_state: Dict[str, Any] = Field(default={}, sa_type=JSONB)
    new_state: Dict[str, Any] = Field(default={}, sa_type=JSONB)
