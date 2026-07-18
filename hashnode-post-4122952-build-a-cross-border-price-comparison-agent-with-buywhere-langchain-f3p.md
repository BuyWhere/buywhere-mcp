---
title: "Build a Cross-Border Price Comparison Agent with BuyWhere + LangChain"
slug: "build-a-cross-border-price-comparison-agent-with-buywhere-langchain-f3p"
tags: "python, ai, mcp, langchain"
domain: "buywhere.hashnode.dev"
canonical: "https://dev.to/buywhere/build-a-cross-border-price-comparison-agent-with-buywhere-langchain-f3p"
enableToc: true
subtitle: "Build a Cross-Border Price Comparison Agent with BuyWhere + LangChain   Want to build an AI..."
seoTitle: "Build a Cross-Border Price Comparison Agent with BuyWhere + LangChain"
seoDescription: "Build a Cross-Border Price Comparison Agent with BuyWhere + LangChain   Want to build an AI..."
---
# Build a Cross-Border Price Comparison Agent with BuyWhere + LangChain

Want to build an AI agent that compares laptop prices across Singapore, Malaysia, Japan, and the US — in one query?

This tutorial shows you how to use the `buywhere-langchain` package (PyPI, MIT) to build a working price comparison agent in under 30 lines of Python.

## Why this matters

Cross-border e-commerce is exploding. The same MacBook Air M4 can cost **30–50% less** in one country vs another. But manually checking 9+ retailer sites across currencies is impractical.

BuyWhere normalizes this: one API queries 20+ retailers across 9 countries (SG, MY, JP, HK, AU, UK, US, CA, DE) and returns live, real-time prices.

## Setup

```bash
pip install buywhere-langchain langchain-openai
```

Set your API key:

```bash
export BUYWHERE_API_KEY="your-key"
export OPENAI_API_KEY="sk-..."
```

Get a free BuyWhere API key at [buywhere.ai/api-keys](https://buywhere.ai/api-keys).

## The Agent

```python
from langchain_openai import ChatOpenAI
from langchain.agents import AgentExecutor, create_openai_functions_agent
from langchain import hub
from langchain.tools import tool
from buywhere_langchain import BuyWhereTool

@tool
def compare_prices(product: str) -> str:
    """Search and compare prices for a product across 9 countries."""
    bw = BuyWhereTool(api_key="your-key")
    return bw.search(product)

llm = ChatOpenAI(model="gpt-4o", temperature=0)
tools = [compare_prices]
prompt = hub.pull("hwchase17/openai-functions-agent")

agent = AgentExecutor(
    agent=create_openai_functions_agent(llm, tools, prompt),
    tools=tools,
    verbose=True,
)

result = agent.invoke({
    "input": "Find the cheapest MacBook Air M4 across Singapore, Japan, and the US. Compare prices in SGD."
})
print(result["output"])
```

## What it returns

Live structured results with:

- Retailer name, product name, and price
- Currency and converted SGD equivalent
- Stock status and product URL
- Country of origin

## Why this works for agents

BuyWhere is built as an **MCP-first API** — the same endpoint that powers Claude Desktop integrations also works as a LangChain tool. No scraping infra, no proxies, no CAPTCHA handling.

The `buywhere-langchain` package wraps the REST API into a LangChain-compatible `BaseTool` so your agent can call it like any other function.

## Deploy it

This agent runs anywhere Python runs: Railway, Modal, Fly.io, or your own server. The full working example with FastAPI deployment is on [GitHub](https://github.com/BuyWhere/buywhere-langchain).

---

*Built with BuyWhere — cross-border product search for AI agents.*
