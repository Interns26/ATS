# Copyright (c) UWorx Services 2026. All Rights Reserved. The information contained herein is proprietary and confidential. This proprietary and confidential information, either in whole or in part, shall not be used for any purpose unless permitted by the terms of a valid license agreement.

from langgraph.graph import StateGraph
from langgraph.graph import END

from .state import ResumeState

from .nodes import extract_text_node
from .nodes import parse_resume_node
from .nodes import ats_node


builder = StateGraph(ResumeState)

builder.add_node(
    "extract",
    extract_text_node
)

builder.add_node(
    "parse",
    parse_resume_node
)

builder.add_node(
    "ats",
    ats_node)


builder.set_entry_point(
    "extract"
)

builder.add_edge(
    "extract",
    "parse"
)

builder.add_edge(
    "parse",
    "ats"
)

builder.add_edge(
    "ats",
    END
)

graph = builder.compile()

