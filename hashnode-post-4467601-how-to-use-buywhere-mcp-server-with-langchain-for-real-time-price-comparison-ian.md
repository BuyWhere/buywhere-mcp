---
title: "How to Use BuyWhere MCP Server with LangChain for Real-Time Price Comparison"
slug: "how-to-use-buywhere-mcp-server-with-langchain-for-real-time-price-comparison-ian"
tags: "ai, langchain, mcp, ecommerce"
domain: "buywhere.hashnode.dev"
canonical: "https://dev.to/buywhere/how-to-use-buywhere-mcp-server-with-langchain-for-real-time-price-comparison-ian"
enableToc: true
subtitle: "Build an AI-powered price comparison agent using BuyWhere's MCP server and LangChain. Search millions of products across 10+ merchants in Southeast Asia."
seoTitle: "How to Use BuyWhere MCP Server with LangChain for Real-Time Price Comparison"
seoDescription: "Build an AI-powered price comparison agent using BuyWhere's MCP server and LangChain. Search millions of products across 10+ merchants in Southeast Asia."
---
# How to Use BuyWhere MCP Server with LangChain for Real-Time Price Comparison

Building AI agents that can actually shop and compare prices across real merchants is surprisingly hard. You need live product data, price feeds, and deal detection — not static training snapshots.

[BuyWhere](https://buywhere.sg) solves this with an MCP (Model Context Protocol) server that gives your LLM agent direct access to a live product catalog spanning 10+ merchants across Singapore, Malaysia, Thailand, Vietnam, and more.

In this post, I'll show you how to integrate BuyWhere's MCP server with LangChain to build a price-comparison agent.

## What is BuyWhere?

BuyWhere is a product discovery platform that aggregates real-time pricing from major Southeast Asian merchants. Think of it as a live API for e-commerce intelligence — product search, deal detection, price comparison, and best-price finding across merchants.

## The MCP Server

BuyWhere exposes six tools via the MCP protocol:

| Tool | What it does |
|------|-------------|
| `search_products` | Search the product catalog by keyword, region, merchant, price range |
| `get_product` | Get full details for a specific product |
| `compare_products` | Side-by-side comparison of 2-10 products |
| `get_deals` | Currently discounted products, sorted by discount % |
| `list_categories` | Browse product categories |
| `find_best_price` | Find the cheapest price across all merchants |

### Connecting to the MCP Server

The endpoint is `https://api.buywhere.ai/mcp`.

Protocol: HTTP POST, JSON-RPC 2.0, authenticated via Bearer token.

Register for an API key at `https://api.buywhere.ai/v1/auth/register`.

## Integration with LangChain

Here is a minimal example using LangChain's MCP tool adapter:

```python
from langchain_mcp_adapters.tools import load_mcp_tools
from langchain_openai import ChatOpenAI
from langchain.agents import AgentExecutor, create_tool_calling_agent
from langchain_core.prompts import ChatPromptTemplate
from mcp import ClientSession
from mcp.client.sse import sse_client

async with sse_client("https://api.buywhere.ai/mcp") as (read, write):
    async with ClientSession(read, write) as session:
        await session.initialize()
        tools = await load_mcp_tools(session)

        llm = ChatOpenAI(model="gpt-4o")
        prompt = ChatPromptTemplate.from_messages([
            ("system", "You are a price comparison assistant."),
            ("human", "{input}"),
            ("placeholder", "{agent_scratchpad}")
        ])
        agent = create_tool_calling_agent(llm, tools, prompt)
        executor = AgentExecutor(agent=agent, tools=tools)

        result = await executor.ainvoke({
            "input": "Find the cheapest iPhone 15 in Singapore"
        })
        print(result["output"])
```

## Practical Use Cases

- **Price alert bots** — Monitor specific products and notify when prices drop
- **Deal hunters** — Surface the best discounts across all merchants
- **Market research** — Compare pricing strategies across competitors
- **Shopping assistants** — Natural language product search with price context
- **Inventory intelligence** — Track product availability and pricing trends

## Why MCP?

MCP gives your agent structured, typed access to BuyWhere's data without building custom API wrappers. The agent can discover available tools at runtime, compose multi-step queries (search then compare then find best price), and handle errors gracefully.

This is especially valuable for LLM agents that need to make real-world decisions about pricing and purchases.

## Getting Started

1. Get your API key: `https://api.buywhere.ai/v1/auth/register`
2. Install the MCP adapter: `pip install langchain-mcp-adapters`
3. Point your agent at `https://api.buywhere.ai/mcp`
4. Start building price-aware agents

## What's Next

We are expanding the catalog to cover more merchants and markets. If you're building something with MCP and need real e-commerce data, check out [BuyWhere](https://buywhere.sg) or open an issue on the [GitHub repo](https://github.com/nicholasgriffintn/buywhere).

---

*Built by the BuyWhere team. Questions? Reach out on [GitHub](https://github.com/nicholasgriffintn/buywhere).*
