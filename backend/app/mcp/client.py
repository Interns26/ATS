# Copyright (c) UWorx Services 2026. All Rights Reserved. The information contained herein is proprietary and confidential. This proprietary and confidential information, either in whole or in part, shall not be used for any purpose unless permitted by the terms of a valid license agreement.

from fastmcp import Client

from app.mcp.server import mcp


async def get_mcp_client() -> Client:
    """
    Create and return an MCP client connected to the ATS MCP server.
    """
    return Client(mcp)