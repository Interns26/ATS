# Copyright (c) 2026 Uworx UK. All rights reserved.

# Standalone demo script — run from the backend/ directory with:
#   python -m workflow.app
# (workflow is now a package, so it must be run with -m, not `python workflow/app.py`)
from concurrent.futures import ThreadPoolExecutor

from pathlib import Path

from .graph import graph


JOB_DESCRIPTION = """
# Job Description: Junior Software Engineer (Full Stack)

## Location

Pittsburgh, PA (Hybrid)

## About the Role

We are looking for a motivated Junior Software Engineer to join our product engineering team. The ideal candidate is passionate about building web and mobile applications, enjoys solving challenging software problems, and is eager to work with modern technologies in a collaborative environment.

As a Software Engineer, you will contribute to the design, development, testing, and deployment of scalable applications while working closely with cross-functional teams.

## Responsibilities

* Design, develop, and maintain web and mobile applications.
* Build responsive front-end interfaces using HTML5 and CSS.
* Develop backend services and APIs using Python and Django.
* Write clean, maintainable, and efficient code following software engineering best practices.
* Participate in code reviews and use Git for version control.
* Collaborate with designers, researchers, and product managers to deliver high-quality software.
* Debug, test, and optimize applications for performance and reliability.
* Implement data structures and algorithms to solve engineering problems.
* Work on Android application development where required.
* Contribute to technical documentation and software design discussions.

## Required Qualifications

* Bachelor's degree in Computer Science or related field (or expected graduation within one year).
* Strong programming skills in Java and Python.
* Experience with HTML5 and CSS.
* Experience developing applications using Django.
* Familiarity with Git version control.
* Knowledge of object-oriented programming, software design patterns, and data structures.
* Understanding of software engineering principles.
* Excellent problem-solving and communication skills.
* Ability to work effectively in a collaborative team environment.

## Preferred Qualifications

* Experience developing Android applications.
* Experience building REST APIs.
* Exposure to computer vision or machine learning projects.
* Experience with crowdsourcing or human-computer interaction projects.
* Familiarity with SQL databases.
* Experience using OCR APIs or third-party web APIs.
* Leadership experience in academic or personal software projects.

## Nice to Have

* Experience with natural language processing.
* Experience with cloud platforms.
* Open-source contributions or GitHub portfolio.
* Participation in university research projects.

## Benefits

* Competitive salary
* Hybrid work environment
* Professional development budget
* Mentorship opportunities
* Health benefits
* Flexible working hours

 
"""


def process_resume(path):

    state = {

        "resume_path": str(path),

        "job_description": JOB_DESCRIPTION

    }

    result = graph.invoke(state)

    return result


BASE_DIR = Path(__file__).resolve().parent
resume_folder = BASE_DIR.parent.parent / "storage" / "resumes"

files = list(resume_folder.glob("*.pdf"))
files += list(resume_folder.glob("*.docx"))

# Process up to 10 resumes simultaneously
with ThreadPoolExecutor(max_workers=10) as executor:

    results = list(
        executor.map(
            process_resume,
            files
        )
    )

for r in results:

    print("=" * 60)

    print(r["parsed_resume"])

    print()

    print(r["ats_result"])