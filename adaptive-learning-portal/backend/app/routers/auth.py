"""
Auth router — demo login (no real JWT).
POST /api/auth/login   { email, role }  → LoginResponse
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Student, Teacher
from ..schemas import LoginRequest, LoginResponse

router = APIRouter(prefix="/api/auth", tags=["auth"])

@router.post("/login", response_model=LoginResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    email = payload.email.strip().lower()
    role  = payload.role.strip().lower()

    if role == "student":
        user = db.query(Student).filter(Student.email == email).first()
        if not user:
            raise HTTPException(status_code=404, detail="Student not found")
        return LoginResponse(
            user_id          = user.id,
            name             = user.name,
            role             = "student",
            batch_id         = user.batch_id,
            is_first_login   = user.is_first_login,
            onboarding_done  = user.onboarding_done,
            diagnostic_done  = user.diagnostic_done,
        )

    elif role == "teacher":
        user = db.query(Teacher).filter(Teacher.email == email).first()
        if not user:
            raise HTTPException(status_code=404, detail="Teacher not found")
        return LoginResponse(
            user_id          = user.id,
            name             = user.name,
            role             = "teacher",
            batch_id         = user.batch_id,
            is_first_login   = False,
            onboarding_done  = True,
            diagnostic_done  = True,
        )

    raise HTTPException(status_code=400, detail="Invalid role; must be 'student' or 'teacher'")
