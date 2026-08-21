---
title: "Every MCP Tool in the BuyWhere Shopping Agent API — With Real Examples"
slug: "every-mcp-tool-in-the-buywhere-shopping-agent-api-with-real-examples-5a6j"
tags: "mcp, aiagents, ecommerce, developers"
domain: "buywhere.hashnode.dev"
canonical: "https://dev.to/buywhere/every-mcp-tool-in-the-buywhere-shopping-agent-api-with-real-examples-5a6j"
enableToc: true
subtitle: "The complete guide to the BuyWhere MCP shopping agent tools: search_products, find_best_price, compare_products, and 5 others — with real usage examples for AI developers."
seoTitle: "Every MCP Tool in the BuyWhere Shopping Agent API — With Real Examples"
seoDescription: "The complete guide to the BuyWhere MCP shopping agent tools: search_products, find_best_price, compare_products, and 5 others — with real usage examples for AI developers."
---
# Every MCP Tool in the BuyWhere Shopping Agent API — With Real Examples

If you're building a shopping agent — whether a Discord bot, a WhatsApp assistant, or a voice interface — you need real product data. Not scraped HTML, not outdated listings, not invented prices. Real, current, cross-merchant data.

BuyWhere exposes its catalog via the Model Context Protocol (MCP), so any AI agent that speaks MCP can query **394M+ products** across Shopee, Lazada, Amazon, and 870K+ other merchants in SEA and the US.

This post covers all 8 MCP tools with practical examples.

## The 8 tools at a glance

| Tool | When to use it |
|---|---|
| `search_products` | Keyword search across the full catalog |
| `get_product` | Fetch one product by ID |
| `compare_products` | Side-by-side product comparison |
| `find_best_price` | "What's the cheapest X?" |
| `get_deals` | Products with the biggest discounts |
| `list_categories` | Browse available categories |
| `find_similar` | "Products like this one" |
| `ingest_products` | Push products into the catalog |

---

## search_products

Keyword search. Pass `deliver_to` when you know the buyer's market — it scopes the scan and prevents cross-market confusion.

```python
# Find iPhone 17 deals in Singapore
{"q": "iPhone 17", "deliver_to": "SG", "limit": 5}
```

Returns schema.org/Product entities with name, image, offers (AggregateOffer with lowPrice/highPrice), and — if you pass `compact: true` — a normalized `price_usd` for easy cross-currency comparison.

Key parameters:
- `deliver_to` — preferred over `country_code` when you know the buyer's market
- `compact` — 40% smaller response; use it in agent loops
- `mode` — `hybrid` (default, FTS+vector), `keyword` (FTS only), or `semantic` (vector only)

---

## get_product

Fetch one specific product by its BuyWhere UUID. Use this after `search_products` or `find_similar` gives you a product ID.

```python
# Get full details for a specific product
{"id": "bw_sg_iphone17_256gb"}
```

Returns the complete product record: brand, description, images, offers from every merchant who carries it, and the `updated_at` timestamp so you know how fresh the price is.

---

## compare_products

Side-by-side comparison. Pass up to 20 product IDs and get a normalized table: price, brand, rating, and category for each.

```python
{"product_ids": ["bw_sg_iphone17_256", "bw_sg_s24u_256", "bw_sg_pixel9_256"]}
```

This is the tool behind "which phone should I buy?" flows. The output makes it trivial to render a comparison card or let the agent pick a winner.

---

## find_best_price

The highest-intent tool: "where is X cheapest?" It returns the same AggregateOffer structure but sorted by `lowPrice` ascending.

```python
{"q": "MacBook Air M3 256gb", "deliver_to": "SG"}
```

Returns the cheapest listing across all merchants, with the `updated_at` timestamp so the agent can decide whether to trust it (see: our [price freshness conventions post](https://dev.to/buywhere/when-is-a-price-fresh-enough-for-an-ai-shopping-agent-to-recommend-28po)).

Key behavior: returns the best *currently-believed* price. If the best-priced result is stale, the second-best might still be fresh. Your agent should compare on `(price, updated_at)` pairs, not price alone.

---

## get_deals

Products sorted by discount percentage (biggest first). Great for "what's on sale this week?"

```python
{"category": "Laptops", "deliver_to": "SG", "limit": 20}
```

Returns schema.org/Product entities with `offers.aggregateOffer.highPrice` (original) and `offers.aggregateOffer.lowPrice` (sale price) — so the discount percentage is directly computable.

---

## list_categories

Discover what's available. No parameters required.

```python
{}
```

Returns a flat list of top-level categories: "Laptops", "Smartphones", "Televisions", "Cameras", etc. Use this to build the first step of a browse flow, or to validate that a category your user mentioned actually exists.

---

## find_similar

Vector-similarity search: "show me products like this one." Takes a product ID, returns up to 10 nearest neighbors.

```python
{"product_id": "bw_sg_pixel9_256"}
```

Under the hood this is a 1024-dimension embedding index. The results aren't keyword-based — they're semantically similar products (same use case, same tier, same form factor). Useful for "alternatives to X" features or recommendation widgets.

---

## ingest_products

The write path: push a batch of products into the catalog. Used by merchant partners or internal ingestion pipelines — not by end-user agents.

```python
{"products": [{"name": "...", "brand": "...", "price": 1299.00}]}
```

Accepts up to 100 products per call. Returns a count of inserted vs updated records.

---

## Which tool for which flow?

| User says | Use |
|---|---|
| "Find me a laptop for under $1000" | `search_products` with `max_price` |
| "What's the cheapest MacBook Air?" | `find_best_price` |
| "Compare iPhone 17 vs Galaxy S24" | `compare_products` |
| "What's on sale?" | `get_deals` |
| "Show me cameras" | `list_categories` then `search_products` |
| "What else is like this?" | `find_similar` |
| "I found a product — give me details" | `get_product` |

---

## Quick start

```bash
# Install the SDK
npm i @buywhere/mcp-server

# Or call the REST endpoint directly
curl https://api.buywhere.ai/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"tools/list","params":{},"id":1}'
```

No credit card. Free tier includes 10,000 MCP calls/month. Get your key at [buywhere.ai/dashboard](https://buywhere.ai/dashboard).

Full MCP spec: [buywhere.ai/docs/mcp](https://buywhere.ai/docs/mcp)

---

## One thing to remember

The MCP response for every product tool includes an `updated_at` timestamp. Price changes — that's the one thing that can turn a good recommendation into a bad one between your agent checking and the user clicking through. Check it. Surface it. It's there for a reason.

*Next post: how BuyWhere keeps 394M prices fresh enough to trust — and the 6-hour cutoff we settled on after running this in production.*
