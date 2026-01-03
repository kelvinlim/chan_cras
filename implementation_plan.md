# CRAS Implementation Plan

This plan outlines the development of the Clinical Research Management System (CRAS) for HKU, ensuring FDA Part 11 compliance, modern UI/UX with HKU branding, and a flexible data schema.

## Development Standards (from .cursorrules)
- **TDD (Test-Driven Development)**: Write tests before implementation.
- **Documentation**: Use Sphinx-style docstrings for Python and JSDoc for TypeScript.
- **Functional Clarity**: Small, focused functions (max 20-30 lines).
- **Conventional Commits**: Use `type(scope): description` for all git commits.
- **Coverage**: Maintain minimum 80% test coverage.

## Proposed Changes

### Backend (FastAPI + SQLModel)

#### [NEW] [models.py](file:///home/kelvin/Projects/chan_cras/backend/app/models.py)
Implementation of SQLModel entities:
- `BaseModel`: Shared fields (id, ref_code, created_at, etc.)
- `User`: Admin and access control, linked to studies.
- `Study`: Clinical research project details.
- `StudyUserAccess`: [NEW] Many-to-many relationship between Users and Studies.
- `Subject`: Participant data with unique UUID for privacy.
- `Procedure`: Protocol definitions with JSONB schemas.
- `Event`: Transactional clinical data records (Ref: `ev-XXXXXX`).
- `AuditLog`: FDA Part 11 compliant change tracking.
    - **Reconstruction Support**: Design schema to allow "playing back" any table to any point in time by storing comprehensive diffs or state snapshots.

- **Ref Code Format Update**:
    - Study: `st-A7B9X2`
    - Event: `ev-A7B9X2`
    - Procedure: `pr-A7B9X2`
    - Subject: `su-A7B9X2`

#### [MODIFY] [utils.py](file:///home/kelvin/Projects/chan_cras/backend/app/utils.py)
- `generate_short_code`: Enhanced to support prefixes and toggleable middle hyphens.
- `uuid7`: Time-sortable UUID generation.

#### [NEW] [database.py](file:///home/kelvin/Projects/chan_cras/backend/app/database.py)
- SQLModel engine and session configuration.
- Alembic initialization for migrations.

---

### Frontend (React + Tailwind)

#### [NEW] [tailwind.config.js](file:///home/kelvin/Projects/chan_cras/frontend/tailwind.config.js)
- Extend theme with HKU Green (`#024638`).
- Configure typography for Inter (UI) and Merriweather (Headings).

#### [NEW] [Layout.tsx](file:///home/kelvin/Projects/chan_cras/frontend/src/components/Layout.tsx)
- Main application shell featuring the HKU Shield and Wordmark in the navigation bar.
- Responsive sidebar for study navigation.

#### [NEW] [StudyDashboard.tsx](file:///home/kelvin/Projects/chan_cras/frontend/src/pages/StudyDashboard.tsx)
- Overview of active studies and recent clinical events.
- **Weekly Calendar View**: A calendar component displaying all events across accessible studies for the current week.
    - **Interactive Events**: Users can click on an event to open a modal/view for displaying and editing event details.
- **Create New Event**: Button to initiate event creation (Study, Subject, Procedure).
    - **Persistent Selections ("Sticky")**: Chosen values for Study, Subject, and Procedure persist across sessions (using local storage or user profile).

#### [NEW] [DynamicForm.tsx](file:///home/kelvin/Projects/chan_cras/frontend/src/components/DynamicForm.tsx)
- **Schema-Driven UI**: Renders form fields dynamically based on the `JSONB` schema from the `Procedure` model.
- **Supported Fields**: `text`, `number`, `date`, `select` (dropdown).
- **Validation**: Ensures required fields are populated before submission.
- **Integration**: Feeds data into the `Event.procedure_data` field.

#### [NEW] [EntityManagement]
Dedicated views for Studies, Subjects, and Procedures:
- **State-based Routing**: Manage active view (`dashboard`, `studies`, `subjects`, `procedures`) in `App.tsx`.
- **List & Edit Logic**: Implement consistent CRUD interfaces for all core entities using shared components.

---

### Security & Compliance

#### [NEW] [auth.py](file:///home/kelvin/Projects/chan_cras/backend/app/auth.py)
- Google OAuth2 integration.
- **Local Login Fallback**: If selected, the username/password are authenticated against the local `User` table.
- RBAC (Role-Based Access Control) decorators.

## Verification Plan

### Automated Tests
- `pytest`: Validate model relationships and JSONB indexing.
- **Dynamic Form Testing**: Vitest tests to ensure `DynamicForm.tsx` correctly renders various schema types and enforces required fields.
- **Audit Playback Test**: Verify that a table state can be accurately reconstructed from the `AuditLog` for any past datetime.

### Manual Verification
- Verify that AuditLog captures every change to the `Event` table.
- Visual inspection of the UI against HKU Branding Guidelines (color contrast, logo clear space).
- Test Google Auth login flow.
