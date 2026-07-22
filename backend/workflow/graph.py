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

