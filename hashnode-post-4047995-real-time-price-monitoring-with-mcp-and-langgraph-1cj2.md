---
title: "Real-time price monitoring with MCP and LangGraph"
slug: "real-time-price-monitoring-with-mcp-and-langgraph-1cj2"
tags: "mcp, langgraph, python, aiagents"
domain: "buywhere.hashnode.dev"
canonical: "https://dev.to/buywhere/real-time-price-monitoring-with-mcp-and-langgraph-1cj2"
enableToc: true
subtitle: "Build a price-drop alert agent with LangGraph and the BuyWhere MCP server"
seoTitle: "Real-time price monitoring with MCP and LangGraph"
seoDescription: "Build a price-drop alert agent with LangGraph and the BuyWhere MCP server"
---
# Build a price-monitoring agent with MCP and LangGraph

Price drops happen fast. This post shows how to build a LangGraph agent that monitors products and notifies you when prices change.

## The agent pattern

We use a stateful LangGraph agent with the BuyWhere MCP server. The agent runs on a schedule, checks prices, compares with previous values, and reports changes.

## Setup

```bash
pip install langgraph langchain-mcp-adapters langchain-anthropic mcp
```

## The monitoring agent

```python
import asyncio
from langchain_mcp_adapters.client import MultiServerMCPClient
from langchain_anthropic import ChatAnthropic

BUYWHERE_API_KEY = "sk-buywhere-your-key"
ANTHROPIC_API_KEY = "sk-ant-your-key"

async def monitor_prices():
    async with MultiServerMCPClient({
        "buywhere": {
            "command": "npx",
            "args": ["-y", "@buywhere/mcp-server"],
            "env": {"BUYWHERE_API_KEY": BUYWHERE_API_KEY},
            "transport": "stdio",
        }
    }) as client:
        tools = await client.get_tools()
        model = ChatAnthropic(model="claude-sonnet-4-6", api_key=ANTHROPIC_API_KEY).bind_tools(tools)
        result = await model.ainvoke([
            ("user", "Check the current price of Sony WH-1000XM5 across all SG retailers.")
        ])
        print(result.content)

asyncio.run(monitor_prices())
```

## Extending to real monitoring

Add a scheduler and price comparison store. The key insight is that MCP tool calls return structured JSON, so you can log prices and compare them across runs.

## What's next

- Add Telegram alerts for price drops >5%
- Track multiple products via config file
- Deploy as a scheduled serverless function

Full source: [github.com/BuyWhere/buywhere-mcp](https://github.com/BuyWhere/buywhere-mcp)

---

*Get a free API key at [buywhere.ai/api-keys](https://buywhere.ai/api-keys)*
