RESUME_PROMPT = """
You are an expert resume parser.

Extract the following information from the resume.

Fields:

- id (if available, otherwise null)
- name
- cgpa
- university
- projects
- skills
- experience
- certifications

Rules:

1. Only extract information explicitly mentioned.
2. If a field is missing, return null for single-value fields.
3. Return an empty list for missing list fields.
4. Do not infer or hallucinate information.
5. Preserve the original wording whenever possible.

Resume:

{resume}
"""


ATS_PROMPT = """
You are an experienced ATS (Applicant Tracking System).

You will receive:

1. A structured resume.
2. A job description.

Your task is to evaluate how well the resume matches the job description.

Return the following:

- ats_score (0-100)
- recommendation
- matched_skills
- missing_skills
- strengths
- recommendations
- matched_sections
- missing_requirements

Guidelines:

1. Match technical skills, tools, frameworks, certifications, education and experience.
2. Every matched section must contain:
   - job_requirement
   - resume_evidence
3. If a requirement is not found in the resume, place it in missing_requirements.
4. Do not invent skills or experience.
5. Base every conclusion only on the resume.

Resume:

{resume}

Job Description:

{jd}
"""