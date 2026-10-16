import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from .database import engine, Base, SessionLocal, is_sqlite, is_postgres, active_database_backend
from .models import *
from .seed_data import seed_database
from .routers import health, students, concepts, quiz, coding, viva, teacher
from .supabase_client import verify_supabase_connection

logger = logging.getLogger("adaptive_portal")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Requirement 10: Ensure startup does NOT run SQLite-specific Base.metadata.create_all()
    # against Supabase PostgreSQL and create incompatible tables.
    if is_sqlite:
        logger.info("Initializing local SQLite schema and seed data.")
        Base.metadata.create_all(bind=engine)
        db = SessionLocal()
        try:
            seed_database(db)
        finally:
            db.close()
    else:
        logger.info("Connected to Supabase PostgreSQL (%s). Preserving Supabase schema 0001.", active_database_backend)
        # Verify Supabase schema status without mutating tables
        res = verify_supabase_connection(timeout_seconds=3)
        if res.get("connected"):
            logger.info("Supabase verification: %s. Tables verified: %d", res.get("status"), len(res.get("tables_found", [])))
        else:
            logger.warning("Supabase verification note: %s", res.get("status"))
    yield

app = FastAPI(
    title="Adaptive Learning & Assessment Portal API",
    version="1.0.0",
    description="Backend API for OP-02 Adaptive Learning & Assessment with Supabase integration and SQLite local fallback",
    lifespan=lifespan
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(health.router)
app.include_router(students.router)
app.include_router(concepts.router)
app.include_router(quiz.router)
app.include_router(coding.router)
app.include_router(viva.router)
app.include_router(teacher.router)

@app.get("/")
def root():
    return {
        "message": "Welcome to Adaptive Learning & Assessment Portal API",
        "health_check": "/api/health",
        "supabase_check": "/api/health/supabase",
        "documentation": "/docs"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
