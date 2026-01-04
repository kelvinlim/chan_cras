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
    sex: Optional[str] = None

class SubjectCreate(SubjectBase):
    study_id: uuid.UUID

class SubjectUpdate(BaseModel):
    lastname: Optional[str] = None
    firstname: Optional[str] = None
    middlename: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    birthdate: Optional[datetime] = None
    sex: Optional[str] = None

class SubjectRead(SubjectBase):
    id: uuid.UUID
    ref_code: str
    unique_uuid: uuid.UUID
    study_id: Optional[uuid.UUID] = None # For frontend display, we will populate this with the first study found
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

# --- User Schemas ---
class UserBase(BaseModel):
    lastname: str
    firstname: str
    middlename: Optional[str] = None
    email: EmailStr
    gmail: Optional[str] = None
    phone: Optional[str] = None
    status: str = "active"
    is_superuser: bool = False
    admin_level: int = 0
    mfa_enabled: bool = False
    metadata_blob: Dict[str, Any] = {}

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    lastname: Optional[str] = None
    firstname: Optional[str] = None
    middlename: Optional[str] = None
    email: Optional[EmailStr] = None
    gmail: Optional[str] = None
    phone: Optional[str] = None
    status: Optional[str] = None
    is_superuser: Optional[bool] = None
    admin_level: Optional[int] = None
    mfa_enabled: Optional[bool] = None
    password: Optional[str] = None
    metadata_blob: Optional[Dict[str, Any]] = None

class UserRead(UserBase):
    id: uuid.UUID
    ref_code: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# --- MFA Schemas ---
class MFASetupResponse(BaseModel):
    secret: str
    provisioning_uri: str

class MFAVerify(BaseModel):
    code: str
    mfa_token: Optional[str] = None # Used for login stage 2
