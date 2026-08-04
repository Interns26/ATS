# Copyright (c) UWorx Services 2026. All Rights Reserved. The information contained herein is proprietary and confidential. This proprietary and confidential information, either in whole or in part, shall not be used for any purpose unless permitted by the terms of a valid license agreement.

from typing import TypedDict

from .models import ResumeInfo
from .models import ATSResult


class ResumeState(TypedDict):

    resume_path: str

    job_description: str

    resume_text: str

    parsed_resume: ResumeInfo

    ats_result: ATSResult