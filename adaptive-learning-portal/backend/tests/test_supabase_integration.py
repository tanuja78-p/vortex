import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.supabase_client import (
    get_safe_supabase_config,
    normalize_postgres_url,
    mask_connection_string,
    verify_supabase_connection,
    DEFAULT_PROJECT_REF,
)
from app.supabase_models import EXPECTED_SUPABASE_TABLES, SupabaseBase

@pytest.fixture
def client():
    return TestClient(app)

def test_supabase_models_table_list():
    """Ensure all 17 tables from 0001_current_prototype_schema.sql are registered in SupabaseBase metadata."""
    registered_tables = set(SupabaseBase.metadata.tables.keys())
    for table_name in EXPECTED_SUPABASE_TABLES:
        assert table_name in registered_tables, f"Missing model for table {table_name}"
    assert len(EXPECTED_SUPABASE_TABLES) == 17

def test_normalize_postgres_url():
    """Test PostgreSQL connection URL normalization for SQLAlchemy 2.0+."""
    assert normalize_postgres_url("postgres://user:pass@host:5432/db") == "postgresql+psycopg2://user:pass@host:5432/db"
    assert normalize_postgres_url("postgresql://user:pass@host:5432/db") == "postgresql+psycopg2://user:pass@host:5432/db"
    assert normalize_postgres_url("postgresql+psycopg2://user:pass@host:5432/db") == "postgresql+psycopg2://user:pass@host:5432/db"

def test_mask_connection_string():
    """Verify that credentials and passwords are strictly stripped/masked."""
    masked = mask_connection_string("postgresql://postgres:SecretPassword123@db.uqkkohqascqralvetmxc.supabase.co:5432/postgres")
    assert "SecretPassword123" not in masked
    assert "postgres:***@db.uqkkohqascqralvetmxc.supabase.co:5432/postgres" in masked

def test_safe_config_structure():
    """Check that get_safe_supabase_config returns non-sensitive metadata."""
    cfg = get_safe_supabase_config()
    assert "project_ref" in cfg
    assert cfg["project_ref"] == DEFAULT_PROJECT_REF
    assert "driver" in cfg
    assert cfg["driver"] == "psycopg2"
    assert "configured" in cfg

def test_verify_supabase_connection_fallback():
    """Verify behavior when no credentials are provided."""
    res = verify_supabase_connection()
    assert "configured" in res
    assert "connected" in res
    assert "migration_applied" in res
    assert "status" in res
    if not res["configured"]:
        assert res["connected"] is False
        assert "fallback" in res["status"].lower()

def test_health_endpoint_backward_compatibility(client):
    """Confirm /api/health retains database: healthy and includes supabase metadata."""
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["database"] == "healthy"
    assert "database_backend" in data
    assert "supabase" in data
    assert "project_ref" in data["supabase"]
    assert data["supabase"]["project_ref"] == DEFAULT_PROJECT_REF

def test_supabase_health_endpoint(client):
    """Confirm /api/health/supabase endpoint is responsive and safe."""
    response = client.get("/api/health/supabase")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "supabase_verification" in data
    verif = data["supabase_verification"]
    assert "configured" in verif
    assert "connected" in verif
