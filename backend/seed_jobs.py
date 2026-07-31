"""
Seed script to create dummy approved jobs in PostgreSQL and provision their MinIO buckets.
Runs automatically or standalone.
"""
import json
import uuid
from app.services.database import get_connection, init_db
from app.services.storage import ensure_bucket_exists

DUMMY_JOBS = [
    {
        "title": "AI/ML Engineer",
        "location": "Faisalabad, Pakistan",
        "employment_type": "Permanent",
        "department": "Engineering",
        "description": "Build and deploy machine learning models that power core product features, from data pipelines to production inference.",
        "responsibilities": [
            "Design and train ML models for production use cases",
            "Build data pipelines for model training and evaluation",
            "Collaborate with backend engineers to deploy models at scale"
        ],
        "requirements": [
            "3+ years experience in ML/AI engineering",
            "Strong Python skills, experience with PyTorch or TensorFlow",
            "Familiarity with MLOps practices"
        ],
        "opening_date": "2026-06-01",
        "closing_date": "2026-12-31"
    },
    {
        "title": "Full Stack Software Engineer",
        "location": "Faisalabad, Pakistan",
        "employment_type": "Permanent",
        "department": "Engineering",
        "description": "Develop and maintain robust web applications using React, TypeScript, Python FastAPI, and PostgreSQL.",
        "responsibilities": [
            "Architect and implement RESTful API endpoints",
            "Build responsive, modern UI components in React",
            "Maintain relational databases and optimize queries"
        ],
        "requirements": [
            "2+ years experience with React and Python web frameworks",
            "Strong understanding of TypeScript and CSS",
            "Experience with PostgreSQL and Docker"
        ],
        "opening_date": "2026-07-01",
        "closing_date": "2026-12-31"
    },
    {
        "title": "HR Associate / Intern",
        "location": "Faisalabad, Pakistan",
        "employment_type": "Internship",
        "department": "People Operations",
        "description": "Support the HR team with recruitment coordination, onboarding, and day-to-day people operations.",
        "responsibilities": [
            "Coordinate interview scheduling with candidates and hiring managers",
            "Assist with onboarding new hires",
            "Maintain accurate candidate and employee records"
        ],
        "requirements": [
            "Currently pursuing or recently completed a degree in HR or Business",
            "Strong communication skills",
            "Comfortable working with spreadsheets and HR software"
        ],
        "opening_date": "2026-07-15",
        "closing_date": "2026-12-31"
    }
]


def seed_jobs():
    init_db()

    with get_connection() as conn:
        with conn.cursor() as cur:
            # Check if any jobs already exist
            cur.execute("SELECT COUNT(*) AS count FROM jobs")
            count = cur.fetchone()["count"]
            if count > 0:
                print(f"Jobs table already contains {count} job(s). Skipping seed.")
                return

            for job in DUMMY_JOBS:
                job_id = str(uuid.uuid4())
                short = job_id.replace("-", "")[:12]
                bucket_name = f"job-{short}"

                # 1. Create MinIO bucket
                ensure_bucket_exists(bucket_name)

                # 2. Insert approved job into Postgres
                cur.execute(
                    """
                    INSERT INTO jobs
                      (id, title, location, employment_type, department, description,
                       responsibilities, requirements, opening_date, closing_date,
                       is_approved, minio_bucket)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, TRUE, %s)
                    """,
                    (
                        job_id,
                        job["title"],
                        job["location"],
                        job["employment_type"],
                        job["department"],
                        job["description"],
                        json.dumps(job["responsibilities"]),
                        json.dumps(job["requirements"]),
                        job["opening_date"],
                        job["closing_date"],
                        bucket_name,
                    ),
                )
                print(f"Created approved job: '{job['title']}' (ID: {job_id}, Bucket: {bucket_name})")


if __name__ == "__main__":
    seed_jobs()
