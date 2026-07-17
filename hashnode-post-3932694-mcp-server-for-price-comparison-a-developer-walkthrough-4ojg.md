---
title: "MCP Server for Price Comparison: A Developer Walkthrough"
slug: "mcp-server-for-price-comparison-a-developer-walkthrough-4ojg"
tags: "programming"
domain: "buywhere.hashnode.dev"
canonical: "https://dev.to/buywhere/mcp-server-for-price-comparison-a-developer-walkthrough-4ojg"
enableToc: true
subtitle: "A practical walkthrough of the BuyWhere MCP server for AI agents and copilots. Includes setup, search, and price-comparison examples."
seoTitle: "MCP Server for Price Comparison: A Developer Walkthrough"
seoDescription: "A practical walkthrough of the BuyWhere MCP server for AI agents and copilots. Includes setup, search, and price-comparison examples."
---
# MCP Server for Price Comparison: A Developer Walkthrough

If you are building an AI shopping agent, price-comparison tool, or any copilot that needs product data, you have probably noticed the gap: most LLMs do not have real-time retailer pricing. BuyWhere solves this with an MCP (Model Context Protocol) server that exposes structured product search across 9 countries and 9 retailers.

In this walkthrough, I will show you how to set up the BuyWhere MCP server, query it from Claude or Cursor, and integrate it into a price-comparison workflow.

## Prerequisites

- Python 3.10+
- An API key from [buywhere.ai/api-keys](https://buywhere.ai/api-keys) (free tier available)
- Claude Desktop, Cursor, or any MCP-compatible client

## Step 1: Install the MCP Server

```bash
npm install -g @buywhere/mcp-server
```

Or run it directly:

```bash
npx @buywhere/mcp-server
```

## Step 2: Configure Your MCP Client

In your `claude_desktop_config.json` (~/Library/Application Support/Claude/ on macOS):

```json
{
  "mcpServers": {
    "buywhere": {
      "command": "npx",
      "args": ["@buywhere/mcp-server"],
      "env": {
        "BUYWHERE_API_KEY": "your-api-key-here"
      }
    }
  }
}
```

Restart your Claude or Cursor session.

## Step 3: Search for Products

Once connected, use the `search_products` tool:

```plaintext
search_products query="best laptop for developers 2026" location="Singapore" limit=5
```

Sample response:

```json
{
  "products": [
    {
      "name": "MacBook Air 13 M3",
      "price": 1299,
      "currency": "SGD",
      "retailer": "Amazon.sg",
      "url": "https://amazon.sg/...",
      "in_stock": true
    }
  ]
}
```

## Step 4: Compare Prices Across Retailers

Use `compare_prices` to get the same product across all available retailers:

```plaintext
compare_prices product_name="MacBook Air 13 M3"
```

This returns a sorted list from cheapest to most expensive across Shopee SG, Lazada, Amazon.sg, and 6 other retailers.

## Supported Countries

- 🇸🇬 Singapore
- 🇺🇸 United States
- 🇬🇧 United Kingdom
- 🇩🇪 Germany
- 🇫🇷 France
- 🇦🇺 Australia
- 🇯🇵 Japan
- 🇰🇷 South Korea
- 🇭🇰 Hong Kong

## What You Get

The MCP server exposes 4 tools:

| Tool | Description |
|------|-------------|
| `search_products` | Full-text product search |
| `compare_prices` | Same product across all retailers |
| `get_product_details` | Deep info: specs, reviews, stock |
| `get_retailer_list` | All supported retailers per country |

## Free API Key

Get started at [buywhere.ai/api-keys](https://buywhere.ai/api-keys) — no credit card required.

---

_This post is part of a series on building AI shopping agents with MCP. See also: [Build a LangChain price-comparison agent with BuyWhere MCP](https://dev.to/buywhere/build-a-langchain-price-comparison-agent-with-buywhere-mcp-5hdk)._
