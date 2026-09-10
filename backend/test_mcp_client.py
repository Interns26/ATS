# import asyncio

# from app.mcp.client import get_mcp_client


# async def main():
#     client = await get_mcp_client()

#     async with client:
#         tools = await client.list_tools()

#         print("\nAvailable MCP tools:")
#         print("-" * 40)

#         for tool in tools:
#             print(tool.name)


# if __name__ == "__main__":
#     asyncio.run(main())

import asyncio

from app.mcp.client import get_mcp_client


async def main():
    client = await get_mcp_client()

    async with client:
        result = await client.call_tool(
            "search_candidates",
            {
                "search": ""
            },
        )

        print("\nMCP tool result:")
        print("-" * 40)
        print(result)


if __name__ == "__main__":
    asyncio.run(main())