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

Your task is to evaluate how well the candidate matches the job posting with strict consistency and determinism.

Format:
{ats_format_instructions}

Guidelines:
1. STRICT 1-TO-1 REQUIREMENT EVALUATION:
   - Identify every distinct requirement and responsibility listed in the Job Description (including experience length, education degree, key responsibilities, and core skills).
   - Evaluate each JD bullet point strictly ONCE as either a `matched_section` (if satisfied with resume evidence) or a `missing_requirement` (if unsatisfied).
   - DO NOT merge multiple JD bullet points into a single requirement, and DO NOT split a single JD bullet point into multiple sub-requirements.
2. TECHNICAL SKILLS MATCHING:
   - Match technical tools using standard technology names.
   - Perform GENERALIZED SEMANTIC SKILL DEDUCTION: A candidate satisfies a skill if they have either (a) explicit keyword mentions on their resume, OR (b) demonstrated practical experience with the core underlying technologies comprising that skill domain.
   - Recognize standard industry synonyms and equivalent frameworks (e.g., React = React.js, Postgres = PostgreSQL, Python = PyTorch/FastAPI).
   - List missing technical tools in `missing_skills` and matched tools in `matched_skills`. Avoid duplicate or overlapping entries.
3. HOLISTIC EVALUATION & RECOMMENDATION:
   - Evaluate overall candidate suitability and provide an objective `ats_score` (0 to 100) taking into account skills match, experience level, and responsibility alignment.
   - Recommendation must be one of: "Interview", "Consider", or "Reject".

Resume:

{resume}

Job Description:

{jd}
"""
,
    input_variables=["resume", "jd"],
    partial_variables={"ats_format_instructions": ats_parser.get_format_instructions()}
)