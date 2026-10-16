from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from datetime import datetime
from ..database import get_db

router = APIRouter(prefix="/api/health", tags=["health"])

@router.get("")
def check_health(db: Session = Depends(get_db)):
    db_status = "healthy"
    try:
        db.execute(text("SELECT 1"))
    except Exception as e:
        db_status = f"unhealthy: {str(e)}"

    return {
        "status": "ok",
        "service": "adaptive-learning-portal",
        "timestamp": datetime.utcnow().isoformat(),
        "database": db_status,
        "execution_runner": "sandboxed-isolated-subprocess",
        "viva_engine": "hybrid-deterministic-rubric"
    }
