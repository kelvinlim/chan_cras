from datetime import datetime
from typing import Optional, Dict, Any, List
from pydantic import BaseModel, EmailStr
import uuid

# --- Study Schemas ---
class StudyBase(BaseModel):
    title: str
    description: Optional[str] = None
    principal_investigator: str
    is_active: bool = True
    metadata_blob: Dict[str, Any] = {}

class StudyCreate(StudyBase):
    pass

class StudyUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    principal_investigator: Optional[str] = None
    is_active: Optional[bool] = None
    metadata_blob: Optional[Dict[str, Any]] = None

class StudyRead(StudyBase):
    id: uuid.UUID
    ref_code: str
    created_at: datetime
    updated_at: datetime
    created_by: str
    updated_by: str

    class Config:
        from_attributes = True

# --- Subject Schemas ---
class SubjectBase(BaseModel):
    lastname: str
    firstname: str
    middlename: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    birthdate: datetime
    gender: Optional[str] = None

class SubjectCreate(SubjectBase):
    pass

class SubjectUpdate(BaseModel):
    lastname: Optional[str] = None
    firstname: Optional[str] = None
    middlename: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    birthdate: Optional[datetime] = None
    gender: Optional[str] = None

class SubjectRead(SubjectBase):
    id: uuid.UUID
    ref_code: str
    unique_uuid: uuid.UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# --- Procedure Schemas ---
class ProcedureBase(BaseModel):
    study_id: uuid.UUID
    name: str
    description: str
    form_data_schema: Dict[str, Any] = {}
    metadata_blob: Dict[str, Any] = {}

class ProcedureCreate(ProcedureBase):
    pass

class ProcedureUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    form_data_schema: Optional[Dict[str, Any]] = None
    metadata_blob: Optional[Dict[str, Any]] = None

class ProcedureRead(ProcedureBase):
    id: uuid.UUID
    ref_code: str
    created_at: datetime

    class Config:
        from_attributes = True
