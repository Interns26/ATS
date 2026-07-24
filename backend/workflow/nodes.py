from dotenv import load_dotenv

load_dotenv()

from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_groq import ChatGroq

from parser import extract_resume_text

from prompts import RESUME_PROMPT
from prompts import ATS_PROMPT

from models import ResumeInfo
from models import ATSResult
from langchain_core.output_parsers import PydanticOutputParser

resume_parser = PydanticOutputParser(pydantic_object=ResumeInfo)
ats_parser = PydanticOutputParser(pydantic_object=ATSResult)

# llm = ChatGoogleGenerativeAI(
#     model="gemini-2.5-flash-lite",
#     temperature=0
# )

llm = ChatGroq(
    model="llama-3.3-70b-versatile",
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

 #Code with bugs
    # structured_llm = llm.with_structured_output(
    #     ResumeInfo
    # )

    # result = structured_llm.invoke(

    #     RESUME_PROMPT.format(
    #         resume=state["resume_text"],
    #         resume_format_instructions=resume_parser.get_format_instructions()
    #     )
    # )
    prompt_text = RESUME_PROMPT.format(
        resume=state["resume_text"]
    )

    response = llm.invoke(prompt_text)

    result = resume_parser.parse(response.content)
    return {
        "parsed_resume": result
    }




def ats_node(state):

 #Code with bugs
    # structured_llm = llm.with_structured_output(
    #     ATSResult
    # )

    # result = structured_llm.invoke(

    #     ATS_PROMPT.format(

    #         resume=state["parsed_resume"],

    #         jd=state["job_description"]

    #         ats_format_instructions=ats_parser.get_format_instructions()

    #     )
    # )
    prompt_text = ATS_PROMPT.format(
        resume=state["parsed_resume"],
        jd=state["job_description"]
    )
    response = llm.invoke(prompt_text)
    result = ats_parser.parse(response.content)
    i = len(result.missing_skills)
    j = len(result.matched_skills)
    result.ats_score = int((j / (i + j)) * 100) if (i + j) > 0 else 0
    
    return {
        "ats_result": result
    }