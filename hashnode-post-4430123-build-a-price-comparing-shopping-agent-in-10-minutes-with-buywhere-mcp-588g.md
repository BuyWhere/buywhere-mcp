---
title: "Build a Price-Comparing Shopping Agent in 10 Minutes with BuyWhere MCP"
slug: "build-a-price-comparing-shopping-agent-in-10-minutes-with-buywhere-mcp-588g"
tags: "mcp, aiagents, opensource, ecommerce"
domain: "buywhere.hashnode.dev"
canonical: "https://dev.to/buywhere/build-a-price-comparing-shopping-agent-in-10-minutes-with-buywhere-mcp-588g"
enableToc: true
subtitle: "Build a Price-Comparing Shopping Agent in 10 Minutes with BuyWhere MCP   The Model Context..."
seoTitle: "Build a Price-Comparing Shopping Agent in 10 Minutes with BuyWhere MCP"
seoDescription: "Build a Price-Comparing Shopping Agent in 10 Minutes with BuyWhere MCP   The Model Context..."
---
# Build a Price-Comparing Shopping Agent in 10 Minutes with BuyWhere MCP

The Model Context Protocol (MCP) lets an LLM talk to live tools instead of pretending to know current prices. In this post, I'll wire a small Python agent to the [BuyWhere MCP server](https://buywhere.ai?utm_source=devto&utm_medium=blog&utm_campaign=june30_25k&utm_content=mcp_agent_2026w33) so it can compare real product prices across Shopee, Lazada, Amazon SG/US/JP/HK, Courts, and Challenger.

## What you need

- Python 3.10+
- `pip install mcp` (the official MCP SDK)
- A free BuyWhere API key from https://buywhere.ai/api-keys?utm_source=devto&utm_medium=blog&utm_campaign=june30_25k&utm_content=mcp_agent_2026w33

## The agent

```python
from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client
import asyncio

server = StdioServerParameters(
    command="npx",
    args=["-y", "@buywhere/mcp-server"],
    env={"BUYWHERE_API_KEY": "<your-key>"}
)

async def run():
    async with stdio_client(server) as (read, write):
        async with ClientSession(read, write) as session:
            await session.initialize()
            result = await session.call_tool(
                "search_products",
                {"query": "iPhone 17 256GB", "country_code": "SG", "limit": 5}
            )
            print(result)

asyncio.run(run())
```

## What comes back

The tool returns structured listings with merchant, price, currency, URL, and last-seen timestamp. No scraping boilerplate, no rate-limit roulette, no HTML parsing.

## Add comparison logic

```python
async def compare(query, country="SG"):
    await session.initialize()
    best = await session.call_tool(
        "find_best_price",
        {"query": query, "country_code": country}
    )
    deals = await session.call_tool(
        "get_deals",
        {"query": query, "country_code": country, "limit": 5}
    )
    return {"best": best, "deals": deals}
```

## Why MCP over a REST wrapper?

- **Schema in the model context** — the LLM sees tool names, argument types, and descriptions inline.
- **Live data** — prices are refreshed from real merchant feeds, not a static training cutoff.
- **Composability** — chain `search_products` → `find_best_price` → `get_deals` the same way you chain function calls.

## Try it

1. Grab a key: https://buywhere.ai/api-keys?utm_source=devto&utm_medium=blog&utm_campaign=june30_25k&utm_content=mcp_agent_2026w33
2. Install the server: `npx -y @buywhere/mcp-server`
3. Ask your agent: *"What's the cheapest iPhone 17 256GB in Singapore right now?"*

If you build something cool, drop a link in the comments.
