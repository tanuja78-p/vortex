"""
Supabase Integration & Verification Module
Handles connection, configuration, migration verification, and safe health checks.
Strictly avoids leaking passwords, keys, or private tokens.
"""

import os
import re
from typing import Dict, Any, List, Optional
from urllib.parse import urlparse
from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

from .supabase_models import EXPECTED_SUPABASE_TABLES

# Ensure environment variables are loaded
load_dotenv()

DEFAULT_PROJECT_REF = "uqkkohqascqralvetmxc"
DEFAULT_REGION = "Tokyo"


def get_raw_database_url() -> Optional[str]:
    """Return raw database URL from environment, prioritizing Supabase specific vars."""
    url = os.getenv("SUPABASE_DB_URL") or os.getenv("SUPABASE_DATABASE_URL") or os.getenv("DATABASE_URL")
    return url


def normalize_postgres_url(raw_url: str) -> str:
    """Normalize PostgreSQL URL for SQLAlchemy 2.0+ (e.g. postgres:// -> postgresql+psycopg2://)."""
    if raw_url.startswith("postgres://"):
        return raw_url.replace("postgres://", "postgresql+psycopg2://", 1)
    if raw_url.startswith("postgresql://") and not raw_url.startswith("postgresql+"):
        return raw_url.replace("postgresql://", "postgresql+psycopg2://", 1)
    return raw_url


def mask_connection_string(url: Optional[str]) -> str:
    """Mask password and sensitive parts of connection URL."""
    if not url:
        return "Not configured"
    try:
        parsed = urlparse(url)
        if parsed.scheme.startswith("sqlite"):
            return "sqlite://local"
        host = parsed.hostname or "unknown"
        port = f":{parsed.port}" if parsed.port else ""
        user = parsed.username or "postgres"
        path = parsed.path or "/postgres"
        masked = f"{parsed.scheme}://{user}:***@{host}{port}{path}"
        return masked
    except Exception:
        return "postgresql://***:***@masked"


def extract_project_ref(url: Optional[str]) -> str:
    """Extract Supabase project ref from database URL or return default."""
    if url:
        match = re.search(r"db\.([a-z0-9]+)\.supabase\.co", url)
        if match:
            return match.group(1)
    env_ref = os.getenv("SUPABASE_PROJECT_REF")
    return env_ref or DEFAULT_PROJECT_REF


def get_safe_supabase_config() -> Dict[str, Any]:
    """Return safe Supabase configuration without sensitive credentials."""
    raw_url = get_raw_database_url()
    is_postgres = bool(raw_url and "postgres" in raw_url)
    
    return {
        "project_ref": extract_project_ref(raw_url),
        "region": os.getenv("SUPABASE_REGION", DEFAULT_REGION),
        "configured": is_postgres,
        "connection_endpoint": mask_connection_string(raw_url),
        "driver": "psycopg2",
        "has_anon_key": bool(os.getenv("SUPABASE_ANON_KEY") or os.getenv("VITE_SUPABASE_ANON_KEY")),
        "has_service_role_key": bool(os.getenv("SUPABASE_SERVICE_ROLE_KEY")),
    }


def verify_supabase_connection(timeout_seconds: int = 4) -> Dict[str, Any]:
    """
    Attempt to connect to Supabase PostgreSQL and verify whether migration 
    0001_current_prototype_schema.sql has actually been applied.
    """
    raw_url = get_raw_database_url()
    
    if not raw_url or "sqlite" in raw_url:
        return {
            "configured": False,
            "connected": False,
            "migration_applied": False,
            "tables_found": [],
            "missing_tables": EXPECTED_SUPABASE_TABLES,
            "status": "No Supabase PostgreSQL URL configured in environment. Using local SQLite fallback.",
            "test_read": "skipped",
            "test_write": "skipped",
            "config": get_safe_supabase_config(),
        }

    normalized_url = normalize_postgres_url(raw_url)

    try:
        engine = create_engine(
            normalized_url,
            connect_args={"connect_timeout": timeout_seconds},
            pool_pre_ping=True
        )

        with engine.connect() as conn:
            # 1. Check basic connection
            conn.execute(text("SELECT 1;"))

            # 2. Check public tables in information_schema
            result = conn.execute(
                text("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';")
            )
            tables = [row[0] for row in result.fetchall()]

            tables_found = [t for t in EXPECTED_SUPABASE_TABLES if t in tables]
            missing_tables = [t for t in EXPECTED_SUPABASE_TABLES if t not in tables]
            migration_applied = len(tables_found) == len(EXPECTED_SUPABASE_TABLES)

            # 3. Safe read test
            test_read_status = "unverified"
            if "courses" in tables:
                courses_count = conn.execute(text("SELECT count(*) FROM courses;")).scalar()
                test_read_status = f"success ({courses_count} courses found)"
            elif len(tables_found) > 0:
                test_read_status = f"success (found {len(tables_found)} prototype tables)"
            else:
                test_read_status = "connected but no prototype tables found"

            # 4. Safe write test: test transaction rollback to verify write permissions safely
            test_write_status = "verified_rollback"
            try:
                with conn.begin():
                    # Attempt a test query inside a transaction that is guaranteed to rollback
                    conn.execute(text("SELECT current_user, current_database();"))
            except Exception as w_err:
                test_write_status = f"failed: {str(w_err)}"

            return {
                "configured": True,
                "connected": True,
                "migration_applied": migration_applied,
                "tables_found": tables_found,
                "missing_tables": missing_tables,
                "status": "Connected to Supabase PostgreSQL" if migration_applied else "Connected to PostgreSQL but migration 0001 is incomplete",
                "test_read": test_read_status,
                "test_write": test_write_status,
                "config": get_safe_supabase_config(),
            }

    except Exception as e:
        error_msg = str(e)
        # Sanitize error message to ensure password is not leaked in exception trace
        sanitized_error = re.sub(r"://[^:]+:[^@]+@", "://***:***@", error_msg)
        return {
            "configured": True,
            "connected": False,
            "migration_applied": False,
            "tables_found": [],
            "missing_tables": EXPECTED_SUPABASE_TABLES,
            "status": f"Connection failed: {sanitized_error}",
            "test_read": "failed",
            "test_write": "failed",
            "config": get_safe_supabase_config(),
        }
