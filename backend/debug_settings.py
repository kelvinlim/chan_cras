import os
import sys
import psycopg2
from os.path import abspath, dirname

# Add backend directory to sys.path
sys.path.insert(0, abspath(dirname(__file__)))

from app.database import settings

print(f"Loaded PG_USER: {settings.PG_USER}")
print(f"Loaded PG_DB: {settings.PG_DB}")
print(f"Password length: {len(settings.PG_PASSWORD)}")

try:
    conn = psycopg2.connect(
        host=settings.PG_HOST,
        port=settings.PG_PORT,
        user=settings.PG_USER,
        password=settings.PG_PASSWORD,
        database=settings.PG_DB
    )
    print("Direct connection successful!")
    conn.close()
except Exception as e:
    print(f"Direct connection failed: {e}")
