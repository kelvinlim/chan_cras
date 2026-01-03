from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
password = "hku-admin-2026"
try:
    hashed = pwd_context.hash(password)
    print(f"Hashed: {hashed}")
    print(f"Verify: {pwd_context.verify(password, hashed)}")
except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()
