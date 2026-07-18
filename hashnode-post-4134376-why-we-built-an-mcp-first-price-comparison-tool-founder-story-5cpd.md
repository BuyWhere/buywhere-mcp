---
title: "Why We Built an MCP-First Price Comparison Tool (Founder Story)"
slug: "why-we-built-an-mcp-first-price-comparison-tool-founder-story-5cpd"
tags: "ai, mcp, ecommerce, startup"
domain: "buywhere.hashnode.dev"
canonical: "https://dev.to/buywhere/why-we-built-an-mcp-first-price-comparison-tool-founder-story-5cpd"
enableToc: true
subtitle: "When I started shopping for a laptop last month, I hit the same wall everyone does.  Open 15 tabs...."
seoTitle: "Why We Built an MCP-First Price Comparison Tool (Founder Story)"
seoDescription: "When I started shopping for a laptop last month, I hit the same wall everyone does.  Open 15 tabs...."
---
When I started shopping for a laptop last month, I hit the same wall everyone does.

Open 15 tabs. Compare prices across Shopee, Lazada, Amazon, Courts, Challenger, and a half-dozen regional retailers. Copy-paste model numbers into spreadsheets. Factor in shipping. Do the math again. Realize the same SKU is 30–50% cheaper on a different marketplace in a different country.

So we built **BuyWhere** — an MCP (Model Context Protocol) server that plugs into Claude, Cursor, or any MCP-compatible AI assistant.

## The problem: comparison shopping is broken

Price comparison sites cache data. They show you last week's prices. They cover a handful of big retailers and ignore regional marketplaces where the real deals live. And none of them work inside the AI tools you already use every day.

Meanwhile, AI assistants like Claude and Cursor are great at reasoning but can't access live commerce data. Ask "Where's the cheapest MacBook Air M3 in Singapore?" and you'll get a generic answer with no real prices.

## The fix: MCP-first, agent-native commerce

BuyWhere is an MCP server. When you connect it to Claude Desktop, Cursor, or any MCP-compatible client, your AI assistant can:

- **Search live product catalogs** across 9+ retailers in 9 countries (Singapore, Malaysia, US, Japan, Hong Kong, Australia, UK, Canada, Germany)
- **Compare prices in real time** — no cached data, no stale results
- **Find the best deal** across borders, including shipping and currency factors

No API keys to manage. No signup walls. Just ask.

## How it works under the hood

BuyWhere runs as a local MCP server that exposes a set of tools to your AI assistant:

- `search_products` — query the live catalog by keyword, category, or SKU
- `find_best_price` — compare a specific product across all retailers
- `get_deals` — surface current promotions and discounts

Behind the scenes, the server hits retailer APIs and scrape endpoints in parallel, normalizes the results into a single comparison view, and returns structured data your AI agent can reason about.

## Try it now

If you're using Claude Desktop or Cursor, add BuyWhere to your MCP config:

```json
{
  "mcpServers": {
    "buywhere": {
      "url": "https://mcp.buywhere.ai/mcp"
    }
  }
}
```

Then ask your assistant: *"What's the cheapest iPhone 17 Pro in Singapore right now?"*

You'll get live prices from every retailer we cover, ranked by total cost.

## What's next

We're expanding retailer coverage across Southeast Asia and adding more agent-native features — structured deal feeds, price-drop alerts, and affiliate handoff so you can go from comparison to checkout in one step.

The future of shopping is conversational. Your AI assistant should be able to find the best price, compare options, and help you buy — all in natural language. That's what we're building.

---

**Links:**
- [BuyWhere](https://buywhere.ai/?utm_source=devto&utm_medium=article&utm_campaign=founder_story&utm_content=mcp_first)
- [MCP Server](https://mcp.buywhere.ai/mcp)
- [Full API docs](https://buywhere.ai/docs)

*Would love to hear what you're comparing — drop a comment and I'll run a live query.*
