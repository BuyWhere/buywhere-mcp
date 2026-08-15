---
title: "Build a Price-Comparing AI Shopping Agent in 10 Minutes with BuyWhere MCP"
slug: "build-a-price-comparing-ai-shopping-agent-in-10-minutes-with-buywhere-mcp-2p0d"
tags: "mcp, ai, agents, tutorial"
domain: "buywhere.hashnode.dev"
canonical: "https://dev.to/buywhere/build-a-price-comparing-ai-shopping-agent-in-10-minutes-with-buywhere-mcp-2p0d"
enableToc: true
subtitle: "Learn how to set up an MCP server that gives AI agents access to 296M+ real products across 100K+ merchants for autonomous price comparison."
seoTitle: "Build a Price-Comparing AI Shopping Agent in 10 Minutes with BuyWhere MCP"
seoDescription: "Learn how to set up an MCP server that gives AI agents access to 296M+ real products across 100K+ merchants for autonomous price comparison."
---
# Build a Price-Comparing AI Shopping Agent in 10 Minutes

The Model Context Protocol (MCP) is how AI agents connect to the tools and data they need. In this tutorial, you will set up a **BuyWhere MCP server** that gives any AI agent real-time access to **296M+ products across 100K+ merchants** -- ready for price comparison, deal finding, and autonomous shopping workflows.

## What You Will Build

- A working MCP server connected to a live product catalog
- 8 tools for searching, comparing, and finding deals on real products
- A Claude Desktop / Cursor integration that can search products by natural language

## Prerequisites

- Node.js 18+
- A free BuyWhere API key ([get one here](https://buywhere.ai))
- Claude Desktop, Cursor, or any MCP-compatible client

## Step 1: Get Your API Key

{"error":"agent_name is required"}

You will get back an API key instantly. The free tier includes **10,000 API calls/month**.

## Step 2: Install the MCP Server


changed 94 packages in 2s

33 packages are looking for funding
  run `npm fund` for details

## Step 3: Configure Your MCP Client

Add this to your Claude Desktop `claude_desktop_config.json`:



## Step 4: Start Using the Tools

Once connected, you have access to **8 MCP tools**:

| Tool | Description |
|------|-------------|
| `search_products` | Search across 296M+ products by keyword, category, or region |
| `get_product` | Get detailed info for a specific product |
| `compare_products` | Side-by-side price comparison across merchants |
| `find_best_price` | Find the lowest price for any product |
| `get_deals` | Browse current deals and discounts |
| `list_categories` | Browse available product categories |
| `find_similar` | Find similar products for comparison |
| `ingest_products` | Add custom products to the catalog |

## Example: Natural Language Price Comparison

Ask your AI agent:

> "Find me the cheapest iPhone 16 Pro 256GB across all merchants in Singapore"

The agent will:
1. Call `search_products` with the query and region `SG`
2. Call `compare_products` on the top results
3. Return a ranked list with prices, merchants, and links

## Example: Deal Discovery

> "What are today's best deals on wireless earbuds under $50 in the US?"

The agent uses `get_deals` filtered by category and price range, then `find_best_price` to verify.

## Supported Regions

BuyWhere covers **9 regions**: US, Singapore, Japan, Vietnam, Thailand, Indonesia, Philippines, Malaysia, India

## Why MCP for Shopping?

Traditional product APIs require one integration per merchant, manual data refresh, and a human UI. With MCP + BuyWhere:

- **One API, all merchants** -- query 100K+ stores in a single call
- **Real-time data** -- prices update continuously
- **Agent-native** -- built for AI, not humans browsing storefronts

## Resources

- **REST API**: https://api.buywhere.ai/openapi.json
- **MCP Endpoint**: https://api.buywhere.ai/mcp
- **GitHub**: https://github.com/BuyWhere/buywhere-mcp
- **Docs**: https://api.buywhere.ai/docs

---

*BuyWhere is the product catalog API built for AI agents. Free tier available at [buywhere.ai](https://buywhere.ai).*
