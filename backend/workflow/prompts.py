# Copyright (c) 2026 Uworx UK. All rights reserved.

from .models import ResumeInfo
from .models import ATSResult
from langchain_core.output_parsers import PydanticOutputParser
from langchain_core.prompts import PromptTemplate

resume_parser = PydanticOutputParser(pydantic_object=ResumeInfo)
ats_parser = PydanticOutputParser(pydantic_object=ATSResult)
RESUME_PROMPT = PromptTemplate(
    template="""
You are an expert resume parser.

Extract the requested information from the resume.

{resume_format_instructions}

Rules:

1. Only extract information explicitly mentioned.
2. If a field is missing, return null for single-value fields.
3. Return an empty list for missing list fields.
4. Do not infer or hallucinate information.
5. Preserve the original wording whenever possible.

Resume:

{resume}
"""
,
input_variables=["resume"],
partial_variables={"resume_format_instructions": resume_parser.get_format_instructions()}
)


ATS_PROMPT = PromptTemplate(
    template="""
You are an experienced ATS (Applicant Tracking System).

You will receive:

1. A structured resume.
2. A job description.

Your task is to evaluate how well the resume matches the job description.

Format:
   {ats_format_instructions}

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
,
input_variables=["resume", "jd"],
partial_variables={"ats_format_instructions": ats_parser.get_format_instructions()}
)