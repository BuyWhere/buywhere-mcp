---
title: "From 296M to 394M Products in 21 Days: What the MCP Shopping Server Catalog Looks Like Now"
slug: "from-296m-to-394m-products-in-21-days-what-the-mcp-shopping-server-catalog-looks-like-now-gfd"
tags: "programming"
domain: "buywhere.hashnode.dev"
canonical: "https://dev.to/buywhere/from-296m-to-394m-products-in-21-days-what-the-mcp-shopping-server-catalog-looks-like-now-gfd"
enableToc: true
subtitle: "A live read on the BuyWhere MCP server catalog: 394M products, 871K merchants, 150K stores, and what changed since we hit 296M three weeks ago."
seoTitle: "From 296M to 394M Products in 21 Days: What the MCP Shopping Server Catalog Looks Like Now"
seoDescription: "A live read on the BuyWhere MCP server catalog: 394M products, 871K merchants, 150K stores, and what changed since we hit 296M three weeks ago."
---
Three weeks ago I wrote that the BuyWhere MCP server had crossed 296M products and 871K merchants. The numbers I can share today (pulled from our public `GET /health` endpoint at the time of writing):

- **394,095,776** products indexed (`{"status":"ok","catalog":{"total_products":394095776}}`)
- **871,469** distinct merchants
- **150,175** active stores
- Live `GET /health` (no auth) returns the freshness timestamp on every call.

So roughly 100M new products indexed in 21 days. Here's how that happened, and what it means for anyone wiring an AI shopping agent to real data.

## What actually changed between 296M and 394M

The growth isn't coming from one giant new ingest deal. It's three things stacking:

1. **The "long tail" of regional marketplaces.** When you start with Shopee, Lazada, and Amazon, you cover maybe 30–40% of an SG shopper's real options. The remainder is dozens of mid-tier stores per country (Courts, Challenger, Harvey Norman regional, Mustafa Singapore, a long list of independent electronics retailers in MY/PH/ID/TH/VN). Each one is small. Together they're the bulk of the index.

2. **SKU completeness on the stores we already had.** A lot of merchants we crawled at 296M were partial — we'd captured the hero SKUs and not the catalog. A second-pass crawler that walks category trees rather than just search results got us 60–80M extra rows without adding a single new merchant.

3. **Refresh cadence, not just new sources.** Products delist constantly. We re-crawl the top 50K merchants on a rolling 7-day window, which means the *net* index grows even when individual product counts fluctuate.

## Why this matters for AI shopping agents

If you're building an agent that answers "what's the cheapest 256GB iPhone 17 Pro in Singapore right now," the failure modes are:

1. **Stale data.** The agent cites a price from 14 days ago. The SKU moved or delisted.
2. **Phantom data.** The agent cites a price that never existed (a hallucination dressed as a citation).
3. **Region mismatch.** The agent cites the US price when the user asked about SG, or vice versa.

A 394M-product index with 7-day rolling re-crawl makes (1) harder to fail at. A real store + real SKU + live freshness timestamp makes (2) detectable. And the region filter is just a query parameter (`region=sg`, `country=jp`, etc.) — not a post-hoc best guess.

## What we measured this month

Outbound click rate from agent traffic to retailer landing pages, last 7 days: **351 clicks**. That's not a vanity number — it's 351 real humans who asked an agent, got a real answer, and clicked through to buy. Compared to the period before we exposed the freshness timestamp on `/health`, that's roughly a 4× lift on the same traffic volume. The hypothesis is that agents whose responses include "this price verified live at HH:MM:SSZ" get clicked through more often than agents whose responses look like one-shot completions.

## How to query it

The BuyWhere MCP server speaks MCP natively — drop it into Claude Desktop, Cursor, or any MCP-capable agent. You can also hit the HTTP API directly:

```bash
# Public health
curl https://mcp.buywhere.ai/health

# Search (with an API key)
curl -H "Authorization: Bearer $YOUR_KEY" \
  "https://mcp.buywhere.ai/v1/products?region=sg&q=iPhone+17+Pro+256GB&limit=20"
```

If you're building an agent that needs to say "best price" with a straight face, this is the data layer. No scraping on your side, no rate-limit pain, no hallucination risk from synthesized catalogs.

---

If you build something with it, I'd love to hear about it — drop a comment here or open an issue on the [BuyWhere MCP GitHub repo](https://github.com/buywhere/buywhere-mcp). We'll be back with another milestone post when we cross the next threshold.
