import os
import logging
from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from sqlalchemy.orm import declarative_base, sessionmaker

# Load environment variables from .env
load_dotenv()

logger = logging.getLogger("adaptive_portal.database")

# Resolve database URL
RAW_DATABASE_URL = (
    os.getenv("SUPABASE_DB_URL")
    or os.getenv("SUPABASE_DATABASE_URL")
    or os.getenv("DATABASE_URL")
    or "sqlite:///./adaptive_portal.db"
)

def _normalize_url(url: str) -> str:
    if url.startswith("postgres://"):
        return url.replace("postgres://", "postgresql+psycopg2://", 1)
    if url.startswith("postgresql://") and not url.startswith("postgresql+"):
        return url.replace("postgresql://", "postgresql+psycopg2://", 1)
    return url

DATABASE_URL = _normalize_url(RAW_DATABASE_URL)
is_postgres = "postgres" in DATABASE_URL
is_sqlite = "sqlite" in DATABASE_URL
is_fallback = False
active_database_backend = "supabase_postgresql" if is_postgres else "sqlite"

try:
    if is_postgres:
        engine = create_engine(
            DATABASE_URL,
            connect_args={"connect_timeout": 5},
            pool_pre_ping=True
        )
        # Test connection quickly
        with engine.connect() as conn:
            conn.execute(text("SELECT 1;"))
        logger.info("Successfully connected to Supabase PostgreSQL database.")
    else:
        engine = create_engine(
            DATABASE_URL,
            connect_args={"check_same_thread": False}
        )
except Exception as e:
    # Safe fallback to SQLite if PostgreSQL is unreachable
    logger.warning("PostgreSQL connection failed (%s). Falling back to local SQLite.", str(e))
    DATABASE_URL = "sqlite:///./adaptive_portal.db"
    is_postgres = False
    is_sqlite = True
    is_fallback = True
    active_database_backend = "sqlite"
    engine = create_engine(
        DATABASE_URL,
        connect_args={"check_same_thread": False}
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
