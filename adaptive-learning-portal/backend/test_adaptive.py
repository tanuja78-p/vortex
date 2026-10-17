from app.main import app
from app.database import engine, Base, SessionLocal
from app.seed_data import seed_database
from app.adaptive_engine import select_adaptive_questions_with_reasons
from app.routers.quiz import get_adaptive_comparison

Base.metadata.create_all(bind=engine)
db = SessionLocal()
seed_database(db)

comp = get_adaptive_comparison(student_a_id='s1', student_b_id='s2', db=db)
print("=== ADAPTIVE COMPARISON TEST ===")
print("Module:", comp.module_name)
print("Divergence:", comp.divergence_percentage, "%")
print("Executive Summary:", comp.executive_summary)
print("\n--- STUDENT A: Alex Johnson (Struggling) ---")
for idx, item in enumerate(comp.student_a.path):
    print(f"{idx+1}. [{item.question.difficulty}] {item.question.title} ({item.target_concept_name})")
    print(f"   Strategy: {item.strategy}")
    print(f"   Reason:   {item.selection_reason}")

print("\n--- STUDENT B: Sarah Smith (Advanced) ---")
for idx, item in enumerate(comp.student_b.path):
    print(f"{idx+1}. [{item.question.difficulty}] {item.question.title} ({item.target_concept_name})")
    print(f"   Strategy: {item.strategy}")
    print(f"   Reason:   {item.selection_reason}")

db.close()
