# Copyright (c) 2026 Uworx UK. All rights reserved.

from typing import TypedDict

from .models import ResumeInfo
from .models import ATSResult


class ResumeState(TypedDict):

    resume_path: str

    job_description: str

    resume_text: str

    parsed_resume: ResumeInfo

    ats_result: ATSResult