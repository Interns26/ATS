# # Copyright (c) UWorx Services 2026. All Rights Reserved. The information contained herein is proprietary and confidential. This proprietary and confidential information, either in whole or in part, shall not be used for any purpose unless permitted by the terms of a valid license agreement.

# import os

# from dotenv import load_dotenv
# from fastapi import APIRouter, HTTPException
# from google import genai
# from pydantic import BaseModel

# load_dotenv()

# router = APIRouter(
#     prefix="/ai-assistant",
#     tags=["AI Assistant"],
# )


# class ChatRequest(BaseModel):
#     message: str


# class ChatResponse(BaseModel):
#     response: str


# def get_gemini_client() -> genai.Client:
#     api_key = os.getenv("GEMINI_API_KEY")

#     if not api_key:
#         raise HTTPException(
#             status_code=500,
#             detail="GEMINI_API_KEY is not configured.",
#         )

#     return genai.Client(api_key=api_key)


# @router.post("/chat", response_model=ChatResponse)
# async def chat(request: ChatRequest):
#     if not request.message.strip():
#         raise HTTPException(
#             status_code=400,
#             detail="Message cannot be empty.",
#         )

#     try:
#         client = get_gemini_client()

#         response = client.models.generate_content(
#             model="gemini-3.6-flash",
#             contents=[
#                 {
#                     "role": "user",
#                     "parts": [
#                         {
#                             "text": (
#                                 "You are the AI Assistant for an Applicant "
#                                 "Tracking System (ATS). "
#                                 "You help recruiters and hiring managers with "
#                                 "candidate recruitment questions. "
#                                 "Be concise, professional, and helpful. "
#                                 "You have access to ATS data through approved "
#                                 "ATS tools. "
#                                 "When a recruiter asks about candidates, jobs, "
#                                 "applications, or resume analysis, use the "
#                                 "appropriate ATS tool instead of guessing or "
#                                 "inventing information. "
#                                 "Base ATS-related answers only on the data "
#                                 "returned by the tools.\n\n"
#                                 f"Recruiter question: {request.message}"
#                             )
#                         }
#                     ],
#                 }
#             ],
#         )

#         content = response.text

#         if not content:
#             raise HTTPException(
#                 status_code=502,
#                 detail="Gemini returned an empty response.",
#             )

#         return ChatResponse(
#             response=content
#         )

#     except HTTPException:
#         raise

#     except Exception as exc:
#         error_message = str(exc)

#         print(f"Gemini API error: {error_message}")

#         # Rate limit
#         if "429" in error_message or "RESOURCE_EXHAUSTED" in error_message:
#             raise HTTPException(
#                 status_code=429,
#                 detail=(
#                     "Gemini API rate limit has been reached. "
#                     "Please try again later."
#                 ),
#             )

#         # Invalid API key / authentication
#         if "401" in error_message or "API key" in error_message:
#             raise HTTPException(
#                 status_code=401,
#                 detail="Gemini API authentication failed. Check the API key.",
#             )

#         # Permission / access error
#         if "403" in error_message or "PERMISSION_DENIED" in error_message:
#             raise HTTPException(
#                 status_code=403,
#                 detail=(
#                     "Gemini API access was denied. "
#                     "Please check your API key and project permissions."
#                 ),
#             )

#         # Gemini server/service error
#         if "500" in error_message or "503" in error_message:
#             raise HTTPException(
#                 status_code=503,
#                 detail=(
#                     "Gemini AI is temporarily unavailable. "
#                     "Please try again later."
#                 ),
#             )

#         # Unknown Gemini error
#         raise HTTPException(
#             status_code=502,
#             detail="Unable to get a response from Gemini AI.",
#         )








# Copyright (c) UWorx Services 2026. All Rights Reserved. The information contained herein is proprietary and confidential. This proprietary and confidential information, either in whole or in part, shall not be used for any purpose unless permitted by the terms of a valid license agreement.

import os
from typing import Any

from dotenv import load_dotenv
from fastapi import APIRouter, HTTPException
from google import genai
from google.genai import types
from pydantic import BaseModel

from app.mcp.client import get_mcp_client


load_dotenv()


router = APIRouter(
    prefix="/ai-assistant",
    tags=["AI Assistant"],
)


class ChatRequest(BaseModel):
    message: str


class ChatResponse(BaseModel):
    response: str


SYSTEM_INSTRUCTION = """
You are the AI Assistant for an Applicant Tracking System (ATS).

You help recruiters and hiring managers with:
- Candidates
- Jobs
- Applications
- Resume analysis

You have access to real ATS data through MCP tools.

IMPORTANT RULES:
1. When the recruiter asks about ATS data, always use the appropriate ATS tool.
2. Never invent candidates, jobs, applications, or resume information.
3. Base ATS-related answers only on information returned by the MCP tools.
4. If the requested information is not available, clearly say so.
5. For general questions that do not require ATS data, answer normally.
6. Be concise, professional, and helpful.

FORMATTING RULES:
1. Always present ATS data in a clean, readable format.
2. Never return a large block of information as one paragraph.
3. When listing multiple candidates, jobs, or applications, use a Markdown table when the information is tabular.
4. Use clear headings for different sections.
5. Use bullet points for details that do not fit naturally into a table.
6. Keep each record visually separated and easy to scan.
7. Do not unnecessarily display internal UUIDs/IDs unless the recruiter specifically asks for them.
8. For candidates, prefer columns such as:
   - Name
   - Email
   - Phone
   - Current Title
   - Experience
   - Location
9. For jobs, prefer columns such as:
   - Job Title
   - Department
   - Location
   - Status
10. For applications, prefer columns such as:
   - Candidate
   - Job
   - Status
   - Applied Date
11. For resume analysis, organize the response into sections such as:
   - Candidate
   - Skills
   - Experience
   - Education
   - Strengths
   - Overall assessment
12. If a field is missing, display "Not provided" instead of leaving awkward gaps.
13. Do not expose raw JSON, Python objects, or MCP tool output to the recruiter.
14. Make the final response look like a professional recruiter-facing assistant response.
"""


# ---------------------------------------------------------------------------
# Gemini client
# ---------------------------------------------------------------------------

def get_gemini_client() -> genai.Client:
    api_key = os.getenv("GEMINI_API_KEY")

    if not api_key:
        raise HTTPException(
            status_code=500,
            detail="GEMINI_API_KEY is not configured.",
        )

    return genai.Client(api_key=api_key)


# ---------------------------------------------------------------------------
# Convert MCP JSON Schema to Gemini-compatible schema
# ---------------------------------------------------------------------------

def clean_schema(schema: Any) -> dict:
    """
    Convert an MCP JSON schema into a Gemini-compatible
    function parameter schema.

    FastMCP may include JSON Schema fields that Gemini's
    function declaration format does not support.
    """

    if not isinstance(schema, dict):
        return {
            "type": "OBJECT",
            "properties": {},
        }

    def clean(value: Any) -> Any:

        if isinstance(value, dict):

            cleaned = {}

            for key, item in value.items():

                # Fields not accepted by Gemini function schemas.
                if key in {
                    "$schema",
                    "additionalProperties",
                    "additional_properties",
                }:
                    continue

                # Gemini schema types are represented in uppercase.
                if key == "type" and isinstance(item, str):
                    cleaned[key] = item.upper()
                else:
                    cleaned[key] = clean(item)

            return cleaned

        if isinstance(value, list):
            return [clean(item) for item in value]

        return value

    result = clean(schema)

    if "type" not in result:
        result["type"] = "OBJECT"

    return result


# ---------------------------------------------------------------------------
# Get MCP tools
# ---------------------------------------------------------------------------

async def get_mcp_tools():
    """
    Read the available tools from the ATS MCP server
    and convert them into Gemini function declarations.
    """

    client = await get_mcp_client()

    async with client:
        tools = await client.list_tools()

    declarations = []

    for tool in tools:

        # FastMCP 4.x uses input_schema.
        input_schema = getattr(
            tool,
            "input_schema",
            None,
        )

        if input_schema is None:
            input_schema = {
                "type": "object",
                "properties": {},
            }

        declaration = {
            "name": tool.name,
            "description": (
                tool.description
                or f"ATS tool: {tool.name}"
            ),
            "parameters": clean_schema(
                input_schema
            ),
        }

        declarations.append(declaration)

    print(
        f"Loaded {len(declarations)} MCP tools:"
    )

    for declaration in declarations:
        print(
            f"  - {declaration['name']}"
        )

    return declarations


# ---------------------------------------------------------------------------
# Execute MCP tool
# ---------------------------------------------------------------------------

async def execute_mcp_tool(
    tool_name: str,
    arguments: dict,
):
    """
    Execute an MCP tool through the MCP client.
    """

    client = await get_mcp_client()

    async with client:

        result = await client.call_tool(
            tool_name,
            arguments,
        )

    if getattr(result, "is_error", False):
        raise RuntimeError(
            f"MCP tool '{tool_name}' returned an error."
        )

    # FastMCP structured result.
    data = getattr(
        result,
        "data",
        None,
    )

    if data is not None:
        return data

    # Fallback to text content.
    content = getattr(
        result,
        "content",
        [],
    )

    output = []

    for item in content:

        text = getattr(
            item,
            "text",
            None,
        )

        if text is not None:
            output.append(text)

    return output


# ---------------------------------------------------------------------------
# AI Assistant Chat
# ---------------------------------------------------------------------------

@router.post(
    "/chat",
    response_model=ChatResponse,
)
async def chat(request: ChatRequest):

    # -----------------------------------------------------------------------
    # Validate message
    # -----------------------------------------------------------------------

    if not request.message.strip():

        raise HTTPException(
            status_code=400,
            detail="Message cannot be empty.",
        )

    try:

        # -------------------------------------------------------------------
        # Create Gemini client
        # -------------------------------------------------------------------

        gemini_client = get_gemini_client()

        # -------------------------------------------------------------------
        # Get MCP tools
        # -------------------------------------------------------------------

        mcp_tools = await get_mcp_tools()

        gemini_tool = types.Tool(
            function_declarations=mcp_tools
        )

        # -------------------------------------------------------------------
        # Gemini configuration
        # -------------------------------------------------------------------

        config = types.GenerateContentConfig(
            system_instruction=SYSTEM_INSTRUCTION,
            tools=[
                gemini_tool
            ],
        )

        # -------------------------------------------------------------------
        # Initial conversation
        # -------------------------------------------------------------------

        contents = [
            types.Content(
                role="user",
                parts=[
                    types.Part.from_text(
                        text=request.message
                    )
                ],
            )
        ]

        # -------------------------------------------------------------------
        # Gemini <-> MCP tool-calling loop
        # -------------------------------------------------------------------

        max_tool_rounds = 5

        for round_number in range(
            max_tool_rounds
        ):

            print(
                f"Gemini processing round "
                f"{round_number + 1}"
            )

            # ---------------------------------------------------------------
            # Ask Gemini
            # ---------------------------------------------------------------

            response = (
                gemini_client.models.generate_content(
                    model="gemini-3.6-flash",
                    contents=contents,
                    config=config,
                )
            )

            # ---------------------------------------------------------------
            # Validate response
            # ---------------------------------------------------------------

            if not response.candidates:

                raise HTTPException(
                    status_code=502,
                    detail=(
                        "Gemini returned no candidates."
                    ),
                )

            model_content = (
                response.candidates[0].content
            )

            # ---------------------------------------------------------------
            # Add Gemini response to conversation
            # ---------------------------------------------------------------

            contents.append(
                model_content
            )

            # ---------------------------------------------------------------
            # Find function calls
            # ---------------------------------------------------------------

            function_calls = []

            for part in model_content.parts:

                function_call = getattr(
                    part,
                    "function_call",
                    None,
                )

                if function_call:
                    function_calls.append(
                        function_call
                    )

            # ---------------------------------------------------------------
            # No function call = final answer
            # ---------------------------------------------------------------

            if not function_calls:

                final_text = response.text

                if not final_text:

                    raise HTTPException(
                        status_code=502,
                        detail=(
                            "Gemini returned an empty response."
                        ),
                    )

                return ChatResponse(
                    response=final_text
                )

            # ---------------------------------------------------------------
            # Execute requested MCP tools
            # ---------------------------------------------------------------

            function_response_parts = []

            for function_call in function_calls:

                tool_name = function_call.name

                arguments = dict(
                    function_call.args or {}
                )

                print(
                    "Gemini requested MCP tool: "
                    f"{tool_name}"
                )

                print(
                    f"MCP arguments: {arguments}"
                )

                try:

                    tool_result = (
                        await execute_mcp_tool(
                            tool_name,
                            arguments,
                        )
                    )

                    print(
                        f"MCP tool '{tool_name}' "
                        "executed successfully."
                    )

                except Exception as tool_error:

                    print(
                        f"MCP tool error for "
                        f"'{tool_name}': "
                        f"{tool_error}"
                    )

                    tool_result = {
                        "error": str(
                            tool_error
                        )
                    }

                # -----------------------------------------------------------
                # Create Gemini function response
                # -----------------------------------------------------------
                # -----------------------------------------------------------
                # Create Gemini function response
                # -----------------------------------------------------------
                function_response_parts.append(
                    types.Part.from_function_response(
                        name=tool_name,
                        response={
                            "result": tool_result
                        },
                    )
                )

            # ---------------------------------------------------------------
            # Send MCP results back to Gemini
            # ---------------------------------------------------------------

            contents.append(
                types.Content(
                    role="user",
                    parts=function_response_parts,
                )
            )

        # -------------------------------------------------------------------
        # Too many tool calls
        # -------------------------------------------------------------------

        raise HTTPException(
            status_code=502,
            detail=(
                "The AI tool-calling process "
                "exceeded the maximum number of steps."
            ),
        )

    # -----------------------------------------------------------------------
    # FastAPI errors
    # -----------------------------------------------------------------------

    except HTTPException:
        raise

    # -----------------------------------------------------------------------
    # Other errors
    # -----------------------------------------------------------------------

    except Exception as exc:

        error_message = str(exc)

        print(
            "Gemini/MCP API error: "
            f"{error_message}"
        )

        # -------------------------------------------------------------------
        # Rate limit
        # -------------------------------------------------------------------

        if (
            "429" in error_message
            or "RESOURCE_EXHAUSTED"
            in error_message
        ):

            raise HTTPException(
                status_code=429,
                detail=(
                    "Gemini API rate limit has "
                    "been reached. Please try again later."
                ),
            )

        # -------------------------------------------------------------------
        # Authentication
        # -------------------------------------------------------------------

        if (
            "401" in error_message
            or "API key"
            in error_message
        ):

            raise HTTPException(
                status_code=401,
                detail=(
                    "Gemini API authentication failed. "
                    "Check the API key."
                ),
            )

        # -------------------------------------------------------------------
        # Permission
        # -------------------------------------------------------------------

        if (
            "403" in error_message
            or "PERMISSION_DENIED"
            in error_message
        ):

            raise HTTPException(
                status_code=403,
                detail=(
                    "Gemini API access was denied. "
                    "Please check your API key "
                    "and project permissions."
                ),
            )

        # -------------------------------------------------------------------
        # Temporary Gemini failure
        # -------------------------------------------------------------------

        if (
            "500" in error_message
            or "503" in error_message
        ):

            raise HTTPException(
                status_code=503,
                detail=(
                    "Gemini AI is temporarily unavailable. "
                    "Please try again later."
                ),
            )

        # -------------------------------------------------------------------
        # Generic error
        # -------------------------------------------------------------------

        raise HTTPException(
            status_code=502,
            detail=(
                "Unable to process the AI Assistant request."
            ),
        )