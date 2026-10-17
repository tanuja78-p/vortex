from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from .database import engine, Base, SessionLocal
from .models import *
from .seed_data import seed_database
from .routers import (
    health, students, concepts, quiz, coding, viva, teacher,
    auth, onboarding, proctor, remediation
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize database tables
    Base.metadata.create_all(bind=engine)
    # Seed data
    db = SessionLocal()
    try:
        seed_database(db)
    finally:
        db.close()
    yield

app = FastAPI(
    title="Adaptive Learning & Assessment Portal API",
    version="2.0.0",
    description=(
        "Backend API for the Vortex Adaptive Learning Portal — "
        "student/teacher roles, batches, onboarding, mastery decay, "
        "live proctor console, cluster alerts, remediation sets, "
        "paste-diff session recording, and human-review queue."
    ),
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

# Core routers (existing)
app.include_router(health.router)
app.include_router(students.router)
app.include_router(concepts.router)
app.include_router(quiz.router)
app.include_router(coding.router)
app.include_router(viva.router)
app.include_router(teacher.router)

# New feature routers
app.include_router(auth.router)
app.include_router(onboarding.router)
app.include_router(proctor.router)
app.include_router(remediation.router)

@app.get("/")
def root():
    return {
        "message": "Welcome to Vortex Adaptive Learning Portal API v2",
        "health_check": "/api/health",
        "documentation": "/docs"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
