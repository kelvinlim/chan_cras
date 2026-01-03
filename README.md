# Clinical Research Management System (CRAS)

CRAS is a purpose-built platform for the University of Hong Kong (HKU) to manage clinical study data, research subjects, and protocol-driven events. It is designed with a focus on **FDA Part 11 compliance**, high performance, and a premium user experience tailored to research institutional standards.

## 🏛️ Architecture & Design

The project follows a modern full-stack architecture with a clear separation between the data-intensive backend and the reactive frontend.

### Backend (app/backend)
- **Framework**: [FastAPI](https://fastapi.tiangolo.com/) for high-performance Async API development.
- **ORM & Validation**: [SQLModel](https://sqlmodel.tiangolo.com/) (SQLAlchemy + Pydantic) for unified database modeling and data validation.
- **Database**: [PostgreSQL](https://www.postgresql.org/) utilizing `JSONB` for flexible, indexable metadata and state storage.
- **Migrations**: [Alembic](https://alembic.sqlalchemy.org/) for version-controlled database schema evolution.
- **Authentication**: JWT-based secure sessions with hybrid support for **Google OAuth2** and a **Local Admin Fallback**.

### Frontend (app/frontend)
- **Framework**: [React](https://reactjs.org/) + [TypeScript](https://www.typescriptlang.org/) via [Vite](https://vitejs.dev/).
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) with a custom design system adhering to **HKU Branding Guidelines**.
- **Icons**: [Lucide React](https://lucide.dev/) for consistent, legible iconography.
- **Component Design**: Modular architecture including a responsive Layout, Interactive Weekly Calendar, and "Sticky" Event Management forms.

## ✨ Key Compliance & Implementation Features

### 1. FDA Part 11 Audit Trail
A fundamental requirement for clinical research. Every mutation in the database is recorded in a dedicated `AuditLog` table.
- **State Capture**: Stores `prev_state` and `new_state` as JSONB snapshots.
- **State Playback**: Includes a backend utility to reconstruct the exact state of any record at any point in time.

### 2. Time-Sortable Data Integrity
- **UUID v7**: Used for primary keys across all models. Unlike standard UUIDs, UUID v7 is time-ordered, ensuring efficient database indexing and predictable sorting.
- **Reference Codes**: Human-readable, searchable identifiers with entity-specific prefixes and a 6-character alphanumeric sequence (e.g., `st-A7B9X2`).
    - `st-` : Studies
    - `su-` : Subjects (Participants)
    - `ev-` : Events (Clinical Encounters)
    - `pr-` : Procedures (Protocol Definitions)
    - `us-` : Users
    Codes are generated using a specialized alphabet to avoid ambiguous characters (like 0/O or 1/I).

### 3. Premium HKU Branding
The UI is built with a "HKU First" design philosophy:
- **Brand Colors**: Primary use of HKU Green (`#024638`) for institutional identity.
- **Typography**: Merriweather (Serif) for high-impact headings and Inter (Sans) for data-dense UI elements.
- **Interactive Calendar**: A custom-built weekly view for clinical staff to manage complex subject scheduling.

### 4. "Sticky" User Experience
To reduce data entry fatigue, the event creation system features "Sticky" selections. The system persists user choices for **Study**, **Subject**, and **Procedure** across browser sessions using LocalStorage, anticipating the researcher's next action.

## 🛠️ Getting Started

### Backend Setup
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
alembic upgrade head
python3 -m uvicorn app.main:app --port 8005 --reload
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

## 📊 Database Schema Summary
- **User**: Administrative and researcher profiles with RBAC.
- **Study**: Clinical project definitions.
- **Subject**: Participant tracking with time-sortable UUIDs.
- **Procedure**: Protocol definitions with dynamic JSONB form schemas.
- **Event**: Transactional records linking subjects to procedures.
- **AuditLog**: The immutable source of truth for all data changes.
