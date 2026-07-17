---
title: "Real-time cross-border price comparison with MCP"
slug: "real-time-cross-border-price-comparison-with-mcp-273i"
tags: "mcp, python, ecommerce, pricecomparison"
domain: "buywhere.hashnode.dev"
canonical: "https://dev.to/buywhere/real-time-cross-border-price-comparison-with-mcp-273i"
enableToc: true
subtitle: "Compare product prices across 9 countries in real time using the BuyWhere MCP server and a simple Python client"
seoTitle: "Real-time cross-border price comparison with MCP"
seoDescription: "Compare product prices across 9 countries in real time using the BuyWhere MCP server and a simple Python client"
---
Shoppers in Singapore know the drill: check Shopee, check Lazada, check Amazon.sg, maybe check a local retailer — all for the same product. Now imagine scaling that to 9 countries, 11 million products, and getting the answer in one query instead of 30 browser tabs.

That is exactly what the BuyWhere MCP server does. This post walks through a real example: finding the cheapest Sony WH-1000XM5 across Singapore, the US, and Japan in under three seconds.

## Why cross-border price comparison matters

Cross-border shopping in Singapore is massive. Consumers routinely check whether electronics, beauty products, and household goods are cheaper on Amazon US, Amazon Japan, or a local SG platform before pulling the trigger.

The problem is that each marketplace has its own search, its own currency, its own shipping logic, and its own API — or no API at all. Doing this manually takes 15-20 minutes per product. With MCP, it takes one function call.

## What the BuyWhere MCP server exposes

The BuyWhere MCP server exposes a single `products_search` tool that accepts:

- `query` — product name or brand
- `country` — country code (sg, us, jp, gb, etc.)
- `limit` — results per page (default 10)
- `page` — pagination

The response includes merchant name, price, currency, product URL, and a BuyWhere deep-link. You can call it from any MCP-compatible client: Claude Desktop, Cursor, VS Code with the MCP extension, or a plain Python script.

## Real example: Sony WH-1000XM5 across 3 countries

Here is what a cross-border query looks like in Python:

```python
import asyncio
from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client

async def compare_across_countries():
    server_params = StdioServerParameters(
        command="npx",
        args=["-y", "@buywhere/mcp-server"]
    )
    
    async with stdio_client(server_params) as (read, write):
        async with ClientSession(read, write) as session:
            await session.initialize()
            
            countries = ["sg", "us", "jp"]
            results = {}
            
            for country in countries:
                result = await session.call_tool(
                    "products_search",
                    {"query": "Sony WH-1000XM5", "country": country, "limit": 3}
                )
                results[country] = result.content
            
            return results

prices = asyncio.run(compare_across_countries())
```

The response gives you structured product data with prices, merchants, and direct URLs. You can feed this directly into a comparison table, a price-drop alert, or a ReAct agent decision loop.

## Building a comparison agent with LangChain

Here is a minimal LangChain tool-calling agent that searches across multiple countries and picks the cheapest option:
```python
from langchain.agents import AgentExecutor, create_openai_tools_agent
from langchain.tools import tool
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate

@tool
def search_product(query: str, country: str) -> str:
    """Search for a product in a given country's marketplaces."""
    # Calls BuyWhere MCP server under the hood
    ...

tools = [search_product]
prompt = ChatPromptTemplate.from_messages([
    ("system", "You are a cross-border price comparison assistant. "
               "Search across sg, us, jp, gb, and de markets. "
               "Present results as a ranked table."),
    ("human", "{input}"),
    ("placeholder", "{agent_scratchpad}"),
])

llm = ChatOpenAI(model="gpt-4o")
agent = create_openai_tools_agent(llm, tools, prompt)
agent_executor = AgentExecutor(agent=agent, tools=tools, verbose=True)

result = agent_executor.invoke({
    "input": "Find the cheapest Sony WH-1000XM5 across SG, US, and Japan"
})
print(result["output"])
```

## Why MCP is the right interface for this

Before MCP, integrating product search into an AI agent meant:

- Writing a custom API client for each marketplace
- Handling authentication and rate limits per provider
- Building a unified schema layer
- Updating when any marketplace changed their API

With MCP, the BuyWhere server handles all of that. Your agent only needs to speak the MCP protocol — one client, one schema, one integration point.

## Try it yourself

1. Install the server: `npx @buywhere/mcp-server`
2. Connect from Claude Desktop, Cursor, or your own Python client
3. Start comparing prices across 9 countries in real time

The BuyWhere MCP server covers 11 million products across Singapore, US, Japan, UK, Germany, Australia, India, UAE, and Canada — all through one MCP tool.

---

*This is the second post in a 4-part series on building AI shopping agents with MCP. Follow BuyWhere on [dev.to](https://dev.to/buywhere) for the next post: Building an AI shopping agent that actually buys things.*
