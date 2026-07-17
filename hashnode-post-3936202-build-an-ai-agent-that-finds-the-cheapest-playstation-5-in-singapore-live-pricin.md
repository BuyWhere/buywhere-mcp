---
title: "Build an AI Agent That Finds the Cheapest PlayStation 5 in Singapore — Live Pricing via MCP"
slug: "build-an-ai-agent-that-finds-the-cheapest-playstation-5-in-singapore-live-pricing-via-mcp-1d15"
tags: "mcp, agents, singapore, ai"
domain: "buywhere.hashnode.dev"
canonical: "https://dev.to/buywhere/build-an-ai-agent-that-finds-the-cheapest-playstation-5-in-singapore-live-pricing-via-mcp-1d15"
enableToc: true
subtitle: "Shopping for a PlayStation 5 in Singapore? Prices vary wildly between FairPrice, Lazada, Shopee,..."
seoTitle: "Build an AI Agent That Finds the Cheapest PlayStation 5 in Singapore — Live Pricing via MCP"
seoDescription: "Shopping for a PlayStation 5 in Singapore? Prices vary wildly between FairPrice, Lazada, Shopee,..."
---
Shopping for a PlayStation 5 in Singapore? Prices vary wildly between FairPrice, Lazada, Shopee, Courts, and Challenger — by SGD 80-150 on any given day.

Instead of checking 7 tabs manually, let your AI agent do it. Here's how to build a 30-line agent that searches live prices across Singapore's major retailers using BuyWhere MCP.

## What You'll Build

A Claude-powered agent that:

1. Searches PS5 prices across 7+ Singapore retailers in real time
2. Returns the cheapest option with merchant name and price
3. Can answer follow-up questions like "what about Xbox?"

## Step 1: Get BuyWhere MCP running

Add BuyWhere to your Claude Desktop config:

```json
{
  "mcpServers": {
    "buywhere": {
      "command": "npx",
      "args": ["@buywhere/mcp-server"],
      "env": {
        "BUYWHERE_API_KEY": "<your-key>"
      }
    }
  }
}
```

Get a free API key at [buywhere.ai/api-keys](https://buywhere.ai/api-keys).

## Step 2: Ask the agent

Once configured, just ask:

> "Find me the cheapest PlayStation 5 in Singapore right now. Include the price, merchant, and direct URL for each option."

BuyWhere responds with live data from FairPrice, Lazada, Shopee, Courts, Challenger, Best Denki, and Harvey Norman — all in real time, no scraping.

## Step 3: Keep going

Because it's an MCP tool, you can chain follow-ups:

- "Which one has free delivery?"
- "Compare PS5 Digital vs Disc edition prices"
- "Set a price alert for when it drops below SGD 700"

## Why This Matters

Traditional price comparison sites are static — they scrape on a schedule and show stale data. BuyWhere gives AI agents **live** inventory-level pricing from each merchant's actual API.

For developers: the same MCP server powers automated deal alerts, multi-merchant order bots, and cross-border price arbitrage agents.

---

**Try it:** [buywhere.ai](https://buywhere.ai) | **npm:** `@buywhere/mcp-server` | **Docs:** [docs.buywhere.ai](https://docs.buywhere.ai)
