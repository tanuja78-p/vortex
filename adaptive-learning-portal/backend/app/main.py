from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from .database import engine, Base, SessionLocal
from .models import *
from .seed_data import seed_database
from .routers import health, students, concepts, quiz, coding, viva, teacher

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
    version="1.0.0",
    description="Backend API for OP-02 Adaptive Learning & Assessment with viva validation and teacher human-review queue",
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
        "documentation": "/docs"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
