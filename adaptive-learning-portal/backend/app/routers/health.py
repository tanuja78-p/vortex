from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from datetime import datetime, timezone
from ..database import get_db, active_database_backend, is_fallback
from ..supabase_client import get_safe_supabase_config, verify_supabase_connection

router = APIRouter(prefix="/api/health", tags=["health"])

@router.get("")
def check_health(db: Session = Depends(get_db)):
    db_status = "healthy"
    try:
        db.execute(text("SELECT 1"))
    except Exception as e:
        db_status = f"unhealthy: {str(e)}"

    safe_supabase = get_safe_supabase_config()

    return {
        "status": "ok",
        "service": "adaptive-learning-portal",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "database": db_status,
        "database_backend": active_database_backend,
        "is_fallback": is_fallback,
        "supabase": {
            "project_ref": safe_supabase["project_ref"],
            "configured": safe_supabase["configured"],
            "connection_endpoint": safe_supabase["connection_endpoint"],
            "status": "configured" if safe_supabase["configured"] else "unconfigured_local_fallback"
        },
        "execution_runner": "sandboxed-isolated-subprocess",
        "viva_engine": "hybrid-deterministic-rubric"
    }

@router.get("/supabase")
def check_supabase_health():
    """
    Detailed Supabase verification endpoint.
    Checks live PostgreSQL connectivity, verifies if migration 0001 tables exist,
    and returns sanitized connection status. Never exposes passwords or tokens.
    """
    verification = verify_supabase_connection(timeout_seconds=4)
    return {
        "status": "ok",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "supabase_verification": verification
    }
