from concurrent.futures import ThreadPoolExecutor

from pathlib import Path

from graph import graph


JOB_DESCRIPTION = """
We want a web developer
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