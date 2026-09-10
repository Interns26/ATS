# Copyright (c) UWorx Services 2026. All Rights Reserved. The information contained herein is proprietary and confidential. This proprietary and confidential information, either in whole or in part, shall not be used for any purpose unless permitted by the terms of a valid license agreement.

from fastmcp import FastMCP

from app.services.database import get_connection


mcp = FastMCP("ATS MCP Server")


@mcp.tool
def search_candidates(search: str = "") -> list[dict]:
    """
    Search candidates by name, email, city, or current job title.
    """

    search = search.strip()

    with get_connection() as conn:
        with conn.cursor() as cursor:

            if search:
                query = """
                    SELECT
                        id,
                        first_name,
                        last_name,
                        email,
                        city,
                        state_province,
                        mobile_number,
                        years_of_experience,
                        current_job_title,
                        current_employer,
                        created_at
                    FROM candidates
                    WHERE
                        first_name ILIKE %s
                        OR last_name ILIKE %s
                        OR email ILIKE %s
                        OR city ILIKE %s
                        OR current_job_title ILIKE %s
                    ORDER BY created_at DESC
                    LIMIT 20;
                """

                pattern = f"%{search}%"

                cursor.execute(
                    query,
                    (
                        pattern,
                        pattern,
                        pattern,
                        pattern,
                        pattern,
                    ),
                )

            else:
                query = """
                    SELECT
                        id,
                        first_name,
                        last_name,
                        email,
                        city,
                        state_province,
                        mobile_number,
                        years_of_experience,
                        current_job_title,
                        current_employer,
                        created_at
                    FROM candidates
                    ORDER BY created_at DESC
                    LIMIT 20;
                """

                cursor.execute(query)

            rows = cursor.fetchall()

            return [dict(row) for row in rows]


@mcp.tool
def get_candidate(candidate_id: str) -> dict:
    """
    Get detailed information about one candidate by candidate ID.
    """

    with get_connection() as conn:
        with conn.cursor() as cursor:

            query = """
                SELECT
                    id,
                    first_name,
                    last_name,
                    email,
                    city,
                    state_province,
                    mobile_number,
                    phone_number,
                    cnic,
                    address,
                    years_of_experience,
                    current_job_title,
                    current_employer,
                    how_heard,
                    created_at
                FROM candidates
                WHERE id = %s;
            """

            cursor.execute(query, (candidate_id,))

            row = cursor.fetchone()

            if not row:
                return {
                    "found": False,
                    "message": "Candidate not found."
                }

            return {
                "found": True,
                "candidate": dict(row)
            }


@mcp.tool
def search_jobs(search: str = "") -> list[dict]:
    """
    Search approved jobs by title, department, location, or employment type.
    """

    search = search.strip()

    with get_connection() as conn:
        with conn.cursor() as cursor:

            if search:
                query = """
                    SELECT
                        id,
                        title,
                        location,
                        employment_type,
                        department,
                        description,
                        responsibilities,
                        requirements,
                        opening_date,
                        closing_date,
                        num_positions,
                        created_at
                    FROM jobs
                    WHERE
                        is_approved = TRUE
                        AND (
                            title ILIKE %s
                            OR department ILIKE %s
                            OR location ILIKE %s
                            OR employment_type ILIKE %s
                        )
                    ORDER BY created_at DESC
                    LIMIT 20;
                """

                pattern = f"%{search}%"

                cursor.execute(
                    query,
                    (
                        pattern,
                        pattern,
                        pattern,
                        pattern,
                    ),
                )

            else:
                query = """
                    SELECT
                        id,
                        title,
                        location,
                        employment_type,
                        department,
                        description,
                        responsibilities,
                        requirements,
                        opening_date,
                        closing_date,
                        num_positions,
                        created_at
                    FROM jobs
                    WHERE is_approved = TRUE
                    ORDER BY created_at DESC
                    LIMIT 20;
                """

                cursor.execute(query)

            rows = cursor.fetchall()

            return [dict(row) for row in rows]


@mcp.tool
def get_job(job_id: str) -> dict:
    """
    Get detailed information about one approved job by job ID.
    """

    with get_connection() as conn:
        with conn.cursor() as cursor:

            query = """
                SELECT
                    id,
                    title,
                    location,
                    employment_type,
                    department,
                    description,
                    responsibilities,
                    requirements,
                    opening_date,
                    closing_date,
                    num_positions,
                    created_by,
                    created_at
                FROM jobs
                WHERE
                    id = %s
                    AND is_approved = TRUE;
            """

            cursor.execute(query, (job_id,))

            row = cursor.fetchone()

            if not row:
                return {
                    "found": False,
                    "message": "Approved job not found."
                }

            return {
                "found": True,
                "job": dict(row)
            }
@mcp.tool
def search_applications(search: str = "") -> list[dict]:
    """
    Search applications by candidate name, email, job title,
    location, or department.
    """

    search = search.strip()

    with get_connection() as conn:
        with conn.cursor() as cursor:

            if search:
                query = """
                    SELECT
                        a.id AS application_id,
                        a.candidate_id,
                        c.first_name,
                        c.last_name,
                        c.email,
                        a.job_id,
                        j.title AS job_title,
                        j.location,
                        j.department,
                        j.employment_type,
                        a.resume_minio_key,
                        a.submitted_at
                    FROM applications a
                    JOIN candidates c
                        ON c.id = a.candidate_id
                    JOIN jobs j
                        ON j.id = a.job_id
                    WHERE
                        c.first_name ILIKE %s
                        OR c.last_name ILIKE %s
                        OR c.email ILIKE %s
                        OR j.title ILIKE %s
                        OR j.location ILIKE %s
                        OR j.department ILIKE %s
                    ORDER BY a.submitted_at DESC
                    LIMIT 20;
                """

                pattern = f"%{search}%"

                cursor.execute(
                    query,
                    (
                        pattern,
                        pattern,
                        pattern,
                        pattern,
                        pattern,
                        pattern,
                    ),
                )

            else:
                query = """
                    SELECT
                        a.id AS application_id,
                        a.candidate_id,
                        c.first_name,
                        c.last_name,
                        c.email,
                        a.job_id,
                        j.title AS job_title,
                        j.location,
                        j.department,
                        j.employment_type,
                        a.resume_minio_key,
                        a.submitted_at
                    FROM applications a
                    JOIN candidates c
                        ON c.id = a.candidate_id
                    JOIN jobs j
                        ON j.id = a.job_id
                    ORDER BY a.submitted_at DESC
                    LIMIT 20;
                """

                cursor.execute(query)

            rows = cursor.fetchall()

            return [dict(row) for row in rows]


@mcp.tool
def get_candidate_applications(candidate_id: str) -> dict:
    """
    Get all applications submitted by one candidate.
    """

    with get_connection() as conn:
        with conn.cursor() as cursor:

            query = """
                SELECT
                    a.id AS application_id,
                    a.candidate_id,
                    c.first_name,
                    c.last_name,
                    c.email,
                    a.job_id,
                    j.title AS job_title,
                    j.location,
                    j.department,
                    j.employment_type,
                    a.resume_minio_key,
                    a.submitted_at
                FROM applications a
                JOIN candidates c
                    ON c.id = a.candidate_id
                JOIN jobs j
                    ON j.id = a.job_id
                WHERE a.candidate_id = %s
                ORDER BY a.submitted_at DESC;
            """

            cursor.execute(query, (candidate_id,))

            rows = cursor.fetchall()

            if not rows:
                return {
                    "found": False,
                    "message": "No applications found for this candidate."
                }

            return {
                "found": True,
                "candidate": {
                    "id": str(rows[0]["candidate_id"]),
                    "first_name": rows[0]["first_name"],
                    "last_name": rows[0]["last_name"],
                    "email": rows[0]["email"],
                },
                "applications": [dict(row) for row in rows],
            }

@mcp.tool
def get_job_applications(job_id: str) -> dict:
    """
    Get all applications submitted for one job.
    """

    with get_connection() as conn:
        with conn.cursor() as cursor:

            job_query = """
                SELECT
                    id,
                    title,
                    location,
                    department,
                    employment_type
                FROM jobs
                WHERE
                    id = %s
                    AND is_approved = TRUE;
            """

            cursor.execute(job_query, (job_id,))

            job = cursor.fetchone()

            if not job:
                return {
                    "found": False,
                    "message": "Approved job not found."
                }

            application_query = """
                SELECT
                    a.id AS application_id,
                    a.candidate_id,
                    c.first_name,
                    c.last_name,
                    c.email,
                    a.resume_minio_key,
                    a.submitted_at
                FROM applications a
                JOIN candidates c
                    ON c.id = a.candidate_id
                WHERE a.job_id = %s
                ORDER BY a.submitted_at DESC;
            """

            cursor.execute(application_query, (job_id,))

            rows = cursor.fetchall()

            return {
                "found": True,
                "job": dict(job),
                "applications": [dict(row) for row in rows],
                "application_count": len(rows),
            }


@mcp.tool
def get_candidate_resume_analysis(candidate_id: str) -> dict:
    """
    Get resume analysis and ATS results for a candidate.
    """

    with get_connection() as conn:
        with conn.cursor() as cursor:

            query = """
                SELECT
                    ra.id,
                    ra.email,
                    ra.job_id,
                    ra.filename,
                    ra.parsed_resume,
                    ra.ats_result,
                    ra.created_at
                FROM resume_analysis ra
                JOIN candidates c
                    ON LOWER(c.email) = LOWER(ra.email)
                WHERE c.id = %s
                ORDER BY ra.created_at DESC;
            """

            cursor.execute(query, (candidate_id,))

            rows = cursor.fetchall()

            if not rows:
                return {
                    "found": False,
                    "message": "No resume analysis found for this candidate."
                }

            return {
                "found": True,
                "analyses": [dict(row) for row in rows],
            }
        
if __name__ == "__main__":
    mcp.run()