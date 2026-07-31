"""
Postgres database service.

Provides get_connection() for use in routers, and init_db() which is
called once at startup to ensure all tables exist.
"""
import os
from contextlib import contextmanager

import psycopg2
import psycopg2.extras
from dotenv import load_dotenv

load_dotenv()


def _get_dsn() -> str:
    return (
        f"host={os.getenv('POSTGRES_HOST', 'localhost')} "
        f"port={os.getenv('POSTGRES_PORT', '5432')} "
        f"dbname={os.getenv('POSTGRES_DB', 'ats_db')} "
        f"user={os.getenv('POSTGRES_USER', 'ats')} "
        f"password={os.getenv('POSTGRES_PASSWORD', 'ats_password')}"
    )


@contextmanager
def get_connection():
    """Yields a psycopg2 connection; commits on success, rolls back on error."""
    conn = psycopg2.connect(_get_dsn(), cursor_factory=psycopg2.extras.RealDictCursor)
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


_CREATE_TABLES_SQL = """
CREATE TABLE IF NOT EXISTS jobs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title           TEXT NOT NULL,
    location        TEXT,
    employment_type TEXT,
    department      TEXT,
    description     TEXT,
    responsibilities JSONB,
    requirements    JSONB,
    opening_date    DATE,
    closing_date    DATE,
    is_approved     BOOLEAN DEFAULT FALSE,
    minio_bucket    TEXT,
    created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS candidates (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email           TEXT NOT NULL,
    first_name      TEXT NOT NULL,
    last_name       TEXT NOT NULL,
    city            TEXT,
    state_province  TEXT,
    mobile_number   TEXT,
    how_heard       TEXT,
    created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS applications (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    candidate_id        UUID REFERENCES candidates(id),
    job_id              UUID REFERENCES jobs(id),
    resume_minio_key    TEXT NOT NULL,
    submitted_at        TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS qualifications (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id  UUID REFERENCES applications(id),
    qualification   TEXT,
    subject         TEXT,
    institute       TEXT,
    grade           TEXT,
    graduation_year TEXT
);

CREATE TABLE IF NOT EXISTS work_experience (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id      UUID REFERENCES applications(id),
    job_field           TEXT,
    organization        TEXT,
    job_title           TEXT,
    start_date          TEXT,
    currently_working   BOOLEAN,
    end_date            TEXT,
    starting_salary     TEXT,
    ending_salary       TEXT,
    job_description     TEXT
);
"""


def init_db() -> None:
    """Create all tables if they don't already exist. Called once at startup."""
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(_CREATE_TABLES_SQL)
