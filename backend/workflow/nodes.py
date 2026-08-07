# Copyright (c) UWorx Services 2026. All Rights Reserved. The information contained herein is proprietary and confidential. This proprietary and confidential information, either in whole or in part, shall not be used for any purpose unless permitted by the terms of a valid license agreement.

import os
from dotenv import load_dotenv

load_dotenv()

from langchain_groq import ChatGroq
from langchain_google_genai import ChatGoogleGenerativeAI
from .parser import extract_resume_text
from .prompts import RESUME_PROMPT, ATS_PROMPT
from .models import ResumeInfo, ATSResult
from langchain_core.output_parsers import PydanticOutputParser

resume_parser = PydanticOutputParser(pydantic_object=ResumeInfo)
ats_parser = PydanticOutputParser(pydantic_object=ATSResult)

primary_llm = ChatGroq(
    model="llama-3.3-70b-versatile",
    temperature=0,
    api_key=os.getenv("GROQ_API_KEY")
)

def _invoke_llm(prompt_text: str):
    return primary_llm.invoke(prompt_text)


def extract_text_node(state):
    text = extract_resume_text(state["resume_path"])
    return {"resume_text": text}


def parse_resume_node(state):
    prompt_text = RESUME_PROMPT.format(resume=state["resume_text"])
    response = _invoke_llm(prompt_text)
    result = resume_parser.parse(response.content)
    return {"parsed_resume": result}


def ats_node(state):
    prompt_text = ATS_PROMPT.format(
        resume=state["parsed_resume"],
        jd=state["job_description"]
    )
    response = _invoke_llm(prompt_text)
    result = ats_parser.parse(response.content)

    # Deduplicate matched & missing skills case-insensitively for score stability
    clean_matched_skills = list({s.strip().lower(): s.strip() for s in result.matched_skills if s and s.strip()}.values())
    matched_set_lower = {s.lower() for s in clean_matched_skills}
    clean_missing_skills = list({s.strip().lower(): s.strip() for s in result.missing_skills if s and s.strip() and s.strip().lower() not in matched_set_lower}.values())
    
    result.matched_skills = clean_matched_skills
    result.missing_skills = clean_missing_skills

    # Calculate balanced ATS Score
    total_skills = len(clean_matched_skills) + len(clean_missing_skills)
    skill_ratio = (len(clean_matched_skills) / total_skills) if total_skills > 0 else 1.0

    total_reqs = len(result.matched_sections) + len(result.missing_requirements)
    req_ratio = (len(result.matched_sections) / total_reqs) if total_reqs > 0 else 1.0

    # 40% Skills match + 40% Requirements match + 20% LLM evaluation score
    computed_score = int((skill_ratio * 40) + (req_ratio * 40) + (result.ats_score * 0.20))
    result.ats_score = max(0, min(100, computed_score))

    # Recommendation adjustment based on final score
    if result.ats_score >= 70:
        result.recommendation = "Interview"
    elif result.ats_score >= 50:
        result.recommendation = "Consider"
    else:
        result.recommendation = "Reject"

    return {"ats_result": result}