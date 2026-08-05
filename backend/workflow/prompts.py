# Copyright (c) UWorx Services 2026. All Rights Reserved. The information contained herein is proprietary and confidential. This proprietary and confidential information, either in whole or in part, shall not be used for any purpose unless permitted by the terms of a valid license agreement.

from .models import ResumeInfo, ATSResult
from langchain_core.output_parsers import PydanticOutputParser
from langchain_core.prompts import PromptTemplate

resume_parser = PydanticOutputParser(pydantic_object=ResumeInfo)
ats_parser = PydanticOutputParser(pydantic_object=ATSResult)

RESUME_PROMPT = PromptTemplate(
    template="""
You are an expert resume parser.

Extract the requested information from the candidate resume.

{resume_format_instructions}

Rules:

1. Only extract information explicitly mentioned or directly derived from job dates/titles.
2. If a field is missing, return null for single-value fields.
3. Return an empty list for missing list fields.
4. Estimate total years_of_experience based on work history dates if available.
5. Determine seniority_level (Junior, Mid-level, Senior, Lead) based on titles and experience length.
6. Do not hallucinate unstated qualifications.
7. Preserve original wording whenever possible.

Resume:

{resume}
"""
,
    input_variables=["resume"],
    partial_variables={"resume_format_instructions": resume_parser.get_format_instructions()}
)


ATS_PROMPT = PromptTemplate(
    template="""
You are an experienced ATS (Applicant Tracking System) hiring evaluation assistant.

You will receive:
1. A structured candidate resume profile.
2. A complete job description (including Role Summary, Responsibilities, and Requirements).

Your task is to evaluate how well the candidate matches the job posting.

Format:
{ats_format_instructions}

Guidelines:
1. Match technical skills, framework experience, certifications, education, and years of experience against the Job Summary, Responsibilities, and Requirements.
2. Recognize technology synonyms and equivalents (e.g., React = React.js, Postgres = PostgreSQL, AWS = Cloud Infrastructure, Python = PyTorch/Django/FastAPI).
3. Every item in matched_sections must contain:
   - job_requirement: The exact requirement or responsibility from the job description.
   - resume_evidence: Explicit proof or experience snippet from the resume satisfying it.
4. Put any unsatisfied core requirement or responsibility in missing_requirements.
5. Put any missing technical skill or tool in missing_skills.
6. Evaluate overall candidate fit and provide a realistic ats_score (0 to 100) taking into account skills, responsibilities, and experience level.
7. Recommendation must be one of: "Interview", "Consider", or "Reject".

Resume:

{resume}

Job Description:

{jd}
"""
,
    input_variables=["resume", "jd"],
    partial_variables={"ats_format_instructions": ats_parser.get_format_instructions()}
)