# Copyright (c) UWorx Services 2026. All Rights Reserved. The information contained herein is proprietary and confidential. This proprietary and confidential information, either in whole or in part, shall not be used for any purpose unless permitted by the terms of a valid license agreement.

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
    password_hash   TEXT,
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

CREATE TABLE IF NOT EXISTS resume_analysis (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email           TEXT NOT NULL,
    job_id          TEXT NOT NULL,
    filename        TEXT NOT NULL,
    parsed_resume   JSONB NOT NULL,
    ats_result      JSONB NOT NULL,
    created_at      TIMESTAMPTZ DEFAULT now(),
    UNIQUE(email, job_id)
);

CREATE TABLE IF NOT EXISTS team_leads (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            TEXT NOT NULL UNIQUE,
    username        TEXT NOT NULL UNIQUE,
    password_hash   TEXT NOT NULL,
    role            TEXT NOT NULL DEFAULT 'team_lead',
    created_at      TIMESTAMPTZ DEFAULT now()
);
"""


def _seed_team_leads(cur) -> None:
    from app.services.auth import hash_password
    cur.execute("SELECT COUNT(*) AS count FROM team_leads")
    if cur.fetchone()["count"] == 0:
        default_leads = [
            ("Sarah Jenkins", "sarah", hash_password("password123"), "team_lead"),
            ("Alex Morgan", "alex", hash_password("password123"), "team_lead"),
            ("David Chen", "david", hash_password("password123"), "team_lead"),
            ("Emily Taylor", "emily", hash_password("password123"), "team_lead"),
        ]
        for name, username, pw_hash, role in default_leads:
            cur.execute(
                "INSERT INTO team_leads (name, username, password_hash, role) VALUES (%s, %s, %s, %s)",
                (name, username, pw_hash, role),
            )


def init_db() -> None:
    """Create all tables if they don't already exist. Called once at startup."""
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(_CREATE_TABLES_SQL)
            cur.execute("ALTER TABLE candidates ADD COLUMN IF NOT EXISTS password_hash TEXT;")
            cur.execute("ALTER TABLE candidates ADD COLUMN IF NOT EXISTS cnic TEXT;")
            cur.execute("ALTER TABLE candidates ADD COLUMN IF NOT EXISTS phone_number TEXT;")
            cur.execute("ALTER TABLE candidates ADD COLUMN IF NOT EXISTS years_of_experience INT;")
            cur.execute("ALTER TABLE candidates ADD COLUMN IF NOT EXISTS current_job_title TEXT;")
            cur.execute("ALTER TABLE candidates ADD COLUMN IF NOT EXISTS current_employer TEXT;")
            _seed_team_leads(cur)
