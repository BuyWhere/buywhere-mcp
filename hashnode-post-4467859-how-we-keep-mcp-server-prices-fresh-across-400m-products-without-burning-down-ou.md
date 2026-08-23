---
title: "How We Keep MCP Server Prices Fresh Across 400M Products (Without Burning Down Our Database)"
slug: "how-we-keep-mcp-server-prices-fresh-across-400m-products-without-burning-down-our-database-26n5"
tags: "mcp, ai, buildinpublic, llm"
domain: "buywhere.hashnode.dev"
canonical: "https://dev.to/buywhere/how-we-keep-mcp-server-prices-fresh-across-400m-products-without-burning-down-our-database-26n5"
enableToc: true
subtitle: "After watching AI shopping agents recommend stale prices for weeks, we rebuilt our data pipeline to keep MCP server responses under 4 hours old — here's the architecture and the hard lessons."
seoTitle: "How We Keep MCP Server Prices Fresh Across 400M Products (Without Burning Down Our Database)"
seoDescription: "After watching AI shopping agents recommend stale prices for weeks, we rebuilt our data pipeline to keep MCP server responses under 4 hours old — here's the architecture and the hard lessons."
---
When we launched [BuyWhere MCP](https://buywhere.ai/developers) — a shopping data server for AI agents — we thought the hard part was getting 296M products into a single endpoint.

We were wrong.

The hard part was keeping those prices *fresh*.

## The Problem: AI Agents Recommend Stale Prices

Within the first month, users reported something uncomfortable: Claude, GPT, and local Llama agents were confidently recommending products with prices that were weeks old. Not because the LLM was hallucinating — our MCP server was actually returning them. The data was stale in *our* database.

For a price comparison tool, stale data isn't a bug. It's the product failing.

## What We Tried First (And Why It Failed)

### Approach 1: Crawl everything every 6 hours

With 296M products across Shopify, Amazon, and Shopee stores, re-crawling everything every 6 hours meant:
- ~4.9M requests per cycle
- ~163K requests per hour
- Immediate IP blocks from every major marketplace

That lasted about 90 minutes before rate limits shut us down.

### Approach 2: Crawl top 10% most-viewed products hourly

Better, but it created a popularity bias. Long-tail products — the exact queries AI agents are *best* at finding — stayed stale for days.

Users searching for "best adapter for Canon R5 to Fuji lens mount" got prices from last month.

## The Architecture That Actually Works

We landed on a three-tier freshness system:

### Tier 1: Hot Products (freshness target: < 1 hour)
- Products appearing in agent conversations (search/get_deals calls)
- Products in active price-drop alerts
- ~2M products, crawled every 45 minutes

### Tier 2: Warm Products (freshness target: < 12 hours)
- Products in comparison pages and deal roundups
- ~50M products, crawled on a rolling 6-hour window

### Tier 3: Long-tail (freshness target: < 72 hours)
- Everything else
- ~348M products, crawled on a 3-day rolling window
- Re-crawl triggered on access ("stale-read-through" pattern)

The key insight: **crawl frequency should follow access patterns, not catalog size.**

### The Stale-Read-Through Pattern

When an agent queries a product that hasn't been refreshed recently:
1. Serve the cached price with a `freshness: stale` flag
2. Queue an async re-crawl for that product
3. If the product is queried again within the freshness window, serve the refreshed price

This means the products people actually look at get refreshed automatically, without pre-crawling the entire catalog.

## Results After 3 Months

| Metric | Before | After |
|--------|--------|-------|
| Median price age | 14 days | 6 hours |
| P99 price age | 31 days | 72 hours |
| Stale price complaints | ~40/week | ~2/week |
| Crawl volume | 4.9M/cycle | 1.2M/day |

## The MCP Server Implementation

For MCP servers serving real-time data, here's what matters:

1. **Include freshness metadata** in your tool responses. Our `search_products` and `get_deals` tools return `lastUpdated` timestamps so agents can decide whether to trust a price.

2. **Don't block on freshness**. A slightly stale price with a freshness flag is more useful than a 30-second timeout while you re-crawl.

3. **Let the agent decide**. We added a `maxAge` parameter so agents can request only fresh data when accuracy matters (e.g., before a purchase recommendation).

```json
{
  "tool": "search_products",
  "params": {
    "query": "Sony WH-1000XM5",
    "country": "SG",
    "maxAge": 1440
  },
}
```

## What I'd Do Differently

- **Start with the access log, not the catalog.** We wasted 3 weeks crawling products nobody was looking at.
- **Add freshness flags from day one.** Retroactive freshness tracking is painful.
- **Treat crawl failures as data.** When Shopee blocks us, that's a signal that our crawl pattern needs rotation — not just a retry.

---

If you're building an MCP server that serves real-world data (not just static docs), freshness is your hardest problem. Happy to chat about what's worked for us.

[BuyWhere MCP](https://buywhere.ai/developers) is live with 400M+ products if you want to test a shopping agent.
