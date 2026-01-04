from sqlmodel import Session, select
from app.database import engine
from app.models import User
from app.auth import get_password_hash
import json

def create_admin_user(email, password, firstname, lastname):
    with Session(engine) as session:
        # Check if user already exists
        statement = select(User).where(User.email == email)
        results = session.exec(statement)
        existing_user = results.first()
        
        if existing_user:
            print(f"User {email} already exists. Updating password and admin level...")
            user = existing_user
        else:
            print(f"Creating new admin user {email}...")
            user = User(
                email=email,
                firstname=firstname,
                lastname=lastname,
                admin_level=2,
                is_superuser=True,
                status="active"
            )
        
        # Hash and set password in metadata_blob
        hashed_pw = get_password_hash(password)
        if not user.metadata_blob:
            user.metadata_blob = {}
        user.metadata_blob["hashed_password"] = hashed_pw
        
        session.add(user)
        session.commit()
        session.refresh(user)
        print(f"User {email} is now a super administrator.")

if __name__ == "__main__":
    import sys
    if len(sys.argv) < 3:
        print("Usage: python create_admin.py <email> <password> [firstname] [lastname]")
    else:
        email = sys.argv[1]
        password = sys.argv[2]
        firstname = sys.argv[3] if len(sys.argv) > 3 else "Admin"
        lastname = sys.argv[4] if len(sys.argv) > 4 else "User"
        create_admin_user(email, password, firstname, lastname)
