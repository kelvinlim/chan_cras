import os
import urllib.parse
from sqlmodel import create_engine, Session, SQLModel
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PG_HOST: str = "localhost"
    PG_PORT: int = 5432
    PG_USER: str = "postgres"
    PG_PASSWORD: str = "postgres"
    PG_DB: str = "cras"
    GOOGLE_CLIENT_ID: str = ""
    
    @property
    def DATABASE_URL(self) -> str:
        encoded_password = urllib.parse.quote_plus(self.PG_PASSWORD)
        return f"postgresql://{self.PG_USER}:{encoded_password}@{self.PG_HOST}:{self.PG_PORT}/{self.PG_DB}"
    
    model_config = {
        "env_file": os.path.join(os.path.dirname(__file__), "../../.env"),
        "extra": "ignore"
    }

settings = Settings()

engine = create_engine(settings.DATABASE_URL, echo=True)

def get_session():
    with Session(engine) as session:
        yield session
