---
title: "How I built a price-comparison MCP server (and how you can call it from Claude or Cursor)"
slug: "how-i-built-a-price-comparison-mcp-server"
subtitle: "An MCP server that finds the cheapest price across Amazon, Best Buy, Shopee, Lazada, Apple Store, and 4 more retailers — across 9 countries — in under 2 seconds. Here's the architecture and how to wire it into Claude or Cursor in 5 minutes."
tags: "mcp, modelcontextprotocol, claude, cursor, llm, devtools, api, comparison, ecommerce, indie-hacker"
domain: "buywhere.hashnode.dev"
canonical: "https://buywhere.ai/developers"
seoTitle: "How I built a price-comparison MCP server (and how you can call it from Claude or Cursor)"
seoDescription: "Build a price-comparison MCP server that searches Amazon, Best Buy, Shopee, Lazada, and more across 9 countries. Full architecture, code samples, and a 5-minute Claude/Cursor wiring guide."
coverImage: "https://buywhere.ai/og/mcp-build.png"
enableToc: true
---

# I was checking 5 sites to buy one thing. So I built an MCP server.

Every time I want to buy a laptop, headphones, or a vacuum, I do the same dance: open Amazon, switch to Shopee, then Best Buy, then Lazada, then Apple Store, then spend 20 minutes copy-pasting prices into a spreadsheet.

Last quarter, I missed a SGD 350 price drop on a Zenbook 14 OLED because Amazon.sg undercut ASUS Store SG by exactly that much, and I didn't know. So I did what any reasonable engineer would do at 1am: I started building an MCP server.

Three weeks later, **BuyWhere** is live at [buywhere.ai](https://buywhere.ai?utm_source=hashnode&utm_medium=social&utm_campaign=june30_25k&utm_content=hashnode_mcp_build_2026w24). It is a price-comparison MCP server that searches **9 retailers across 9 countries** in parallel and returns the cheapest real-time price, all callable from inside Claude or Cursor.

This post covers: the architecture, the parts that surprised me, the code, and a 5-minute wiring guide so you can call it from Claude or Cursor by the end of this read.

## What BuyWhere actually does

Given a product query (free text or structured) and a country code, BuyWhere:

1. Fans out the query to the configured retailers for that country (US: Amazon, Best Buy, Walmart, eBay, Apple, B&H. SG: Amazon.sg, Shopee SG, Lazada SG, Apple Store SG, Challenger, Best Denki, Harvey Norman. … 7 more country configs.)
2. Normalizes each retailer's product page into `{title, price, currency, url, retailer, in_stock}` records
3. Sorts by price ascending, returns the top N
4. Caches per-(query, country, retailer) tuples for 5 minutes to stay polite
5. Returns JSON that's directly consumable by an LLM

The MCP surface is small on purpose — three tools and one resource:

```jsonc
{
  "tools": [
    { "name": "search_prices",      "description": "Search products and return ranked prices across retailers in a country" },
    { "name": "compare_product",    "description": "Resolve a product to a canonical SKU and return its price across all configured retailers" },
    { "name": "list_cheapest",      "description": "Top N cheapest products in a category for a country" }
  ],
  "resources": [
    { "uri": "buywhere://merchant/{country}", "name": "Merchant list with status" }
  ]
}
```

That's it. No scraping pipeline in the LLM. The MCP server does the dirty work; the LLM just asks "what's the cheapest iPhone 17 in Singapore right now?" and gets an answer.

## The architecture (with the parts that surprised me)

```
┌────────────────────┐    JSON-RPC over stdio / SSE     ┌──────────────────────┐
│  Claude / Cursor   │ ───────────────────────────────▶  │  BuyWhere MCP server │
│  (the LLM client)  │ ◀───────────────────────────────  │  (Node, Fastify)     │
└────────────────────┘    tool calls + results           └──────────┬───────────┘
                                                                     │
                                                          ┌──────────┴───────────┐
                                                          │   Per-retailer       │
                                                          │   adapters           │
                                                          │  (Amazon, Shopee,   │
                                                          │   Lazada, Best Buy, │
                                                          │   Apple, …)          │
                                                          └──────────┬───────────┘
                                                                     │
                                                              retailer APIs / pages
```

Three things surprised me during the build:

**1. Retailer normalization is 80% of the work.** Every adapter deals with different units (USD vs SGD vs JPY), different tax semantics (US prices are pre-tax; SG prices include GST), different "in stock" semantics, and wildly different rate limits. I ended up with a single `Money` type and a per-retailer currency converter pinned to a 1-hour exchange-rate snapshot.

**2. The MCP spec is genuinely small.** Once you internalize `tools` + `resources` + JSON-RPC, the surface area is small enough to fit on a sticky note. I went from "first 200-line scaffold" to "shipping in 3 weeks" mostly because the protocol doesn't get in your way.

**3. Caching is the difference between a demo and a product.** Without caching, the same query from 4 different LLM users in 5 minutes would have hit 36 retailer endpoints. The 5-minute cache per (query, country, retailer) tuple brought the steady-state hit rate to ~12% and kept me under Shopee's and Lazada's rate limits.

## The code: 5 minutes to wire it into Claude or Cursor

This is the part you came for. Three steps.

### Step 1 — Grab an API key

Sign up at [buywhere.ai/api-keys](https://buywhere.ai/api-keys?utm_source=hashnode&utm_medium=social&utm_campaign=june30_25k&utm_content=hashnode_mcp_build_2026w24) (free tier is 1,000 calls/month, no card required). You'll get `bw_live_…` formatted keys.

### Step 2 — Add BuyWhere to your Claude Desktop config

Edit `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) or `%APPDATA%\Claude\claude_desktop_config.json` (Windows):

```json
{
  "mcpServers": {
    "buywhere": {
      "command": "npx",
      "args": ["-y", "@buywhere/mcp-server"],
      "env": {
        "BUYWHERE_API_KEY": "bw_live_replace_me"
      }
    }
  }
}
```

Restart Claude Desktop. Done. You should see a small 🔌 icon in the input box, and the tools `search_prices`, `compare_product`, and `list_cheapest` will appear.

### Step 3 — Try it

Open a new Claude conversation and ask:

> "What is the cheapest iPhone 17 in Singapore right now?"

Claude will call `search_prices` and return something like:

```json
{
  "results": [
    { "retailer": "Shopee SG",       "price": 1219, "currency": "SGD", "url": "https://shopee.sg/…" },
    { "retailer": "Amazon.sg",       "price": 1249, "currency": "SGD", "url": "https://www.amazon.sg/…" },
    { "retailer": "Lazada SG",       "price": 1259, "currency": "SGD", "url": "https://www.lazada.sg/…" },
    { "retailer": "Challenger",      "price": 1299, "currency": "SGD", "url": "https://www.challenger.sg/…" },
    { "retailer": "Apple Store SG",  "price": 1299, "currency": "SGD", "url": "https://www.apple.com/sg/" }
  ],
  "cheapest": "Shopee SG",
  "savingsVsMSRP": 80
}
```

For Cursor, the wiring is identical — `Cursor → Settings → MCP → Add new global MCP server` and paste the same JSON.

## What's in the JSON-LD toolbox (for the SEO/agent crowd)

BuyWhere also publishes structured data: every comparison page ships with `Article` + `FAQPage` + `Product` JSON-LD, which is what makes ChatGPT and Perplexity cite us for "best X in Y" queries. If you want the same AEO surface for your own comparison content, the schema is in [the docs](https://buywhere.ai/quickstart?utm_source=hashnode&utm_medium=social&utm_campaign=june30_25k&utm_content=hashnode_mcp_build_2026w24).

## What I'd do differently

- **Skip the eBay adapter** unless you have a real use case — the affiliate API is more paperwork than it's worth at low volume.
- **Add a `compare_products` (plural) tool** that batches 5-10 SKUs at once for "I have a shortlist, find the cheapest right now" workflows. Adding it later is the kind of thing that bumps a casual user into a power user.
- **Set up an A/B for the cache TTL** — 5 minutes is conservative for "in stock" but stale for "price". I'd split it next time.

## Try it

- Sign up: [buywhere.ai/api-keys](https://buywhere.ai/api-keys?utm_source=hashnode&utm_medium=social&utm_campaign=june30_25k&utm_content=hashnode_mcp_build_2026w24)
- Docs + schema: [buywhere.ai/quickstart](https://buywhere.ai/quickstart?utm_source=hashnode&utm_medium=social&utm_campaign=june30_25k&utm_content=hashnode_mcp_build_2026w24)
- Source repo: [github.com/BuyWhere/buywhere-mcp](https://github.com/BuyWhere/buywhere-mcp)
- npm: `npm i -g @buywhere/mcp-server`

If you build something with it, ping me — I curate a weekly roundup of "things people made with BuyWhere" and I'd love to feature what you ship.

— Lyra, BuyWhere team
