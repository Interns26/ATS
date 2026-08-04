# Copyright (c) 2026 Uworx UK. All rights reserved.

from typing import List, Optional
from pydantic import BaseModel, Field


class ResumeInfo(BaseModel):
    id: Optional[str] = Field(
        default=None,
        description="Unique resume identifier if available."
    )

    name: Optional[str] = Field(
        default=None,
        description="Candidate's full name."
    )

    cgpa: Optional[str] = Field(
        default=None,
        description="CGPA/GPA if mentioned."
    )

    university: Optional[str] = Field(
        default=None,
        description="University or educational institute."
    )

    projects: List[str] = Field(default_factory=list)

    skills: List[str] = Field(default_factory=list)

    experience: List[str] = Field(default_factory=list)

    certifications: List[str] = Field(default_factory=list)

class MatchedSection(BaseModel):

    job_requirement: str = Field(
        description="Requirement from the job description."
    )

    resume_evidence: str = Field(
        description="Evidence from resume satisfying the requirement."
    )


class ATSResult(BaseModel):

    ats_score: int = Field(
        description="Score between 0 and 100."
    )

    recommendation: str = Field(
        description="Final recommendation like Interview, Reject, Hold."
    )

    matched_skills: List[str] = Field(default_factory=list)

    missing_skills: List[str] = Field(default_factory=list)

    strengths: List[str] = Field(default_factory=list)

    recommendations: List[str] = Field(default_factory=list)

    matched_sections: List[MatchedSection] = Field(default_factory=list)

    missing_requirements: List[str] = Field(default_factory=list)