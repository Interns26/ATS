from dotenv import load_dotenv

load_dotenv()

from langchain_google_genai import ChatGoogleGenerativeAI

from parser import extract_resume_text

from prompts import RESUME_PROMPT
from prompts import ATS_PROMPT

from models import ResumeInfo
from models import ATSResult

llm = ChatGoogleGenerativeAI(
    model="gemini-2.5-flash",
    temperature=0
)


def extract_text_node(state):

    text = extract_resume_text(
        state["resume_path"]
    )

    return {
        "resume_text": text
    }


def parse_resume_node(state):

    structured_llm = llm.with_structured_output(
        ResumeInfo
    )

    result = structured_llm.invoke(

        RESUME_PROMPT.format(
            resume=state["resume_text"]
        )
    )

    return {
        "parsed_resume": result
    }


def ats_node(state):

    structured_llm = llm.with_structured_output(
        ATSResult
    )

    result = structured_llm.invoke(

        ATS_PROMPT.format(

            resume=state["parsed_resume"],

            jd=state["job_description"]

        )
    )

    return {
        "ats_result": result
    }