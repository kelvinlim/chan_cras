import sys
from os.path import abspath, dirname
from sqlmodel import Session, select

# Add backend directory to sys.path
sys.path.insert(0, abspath(dirname(__file__)))

from app.database import engine
from app.models import User
from app.auth import get_password_hash

def seed():
    with Session(engine) as session:
        # Check if admin already exists
        admin_email = "admin@hku.hk"
        existing = session.exec(select(User).where(User.email == admin_email)).first()
        
        if existing:
            print(f"User {admin_email} already exists.")
            return

        print(f"Creating seed user: {admin_email}...")
        admin_user = User(
            lastname="Admin",
            firstname="System",
            email=admin_email,
            status="active",
            is_superuser=True,
            admin_level=10,
            created_by="system",
            updated_by="system",
            metadata_blob={
                "hashed_password": get_password_hash("hku-admin-2026")
            }
        )
        session.add(admin_user)
        session.commit()
        print("Seed user created successfully!")

if __name__ == "__main__":
    seed()
