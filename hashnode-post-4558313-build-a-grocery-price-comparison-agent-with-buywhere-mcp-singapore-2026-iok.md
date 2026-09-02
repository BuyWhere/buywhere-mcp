---
title: "Build a grocery price comparison agent with BuyWhere MCP (Singapore 2026)"
slug: "build-a-grocery-price-comparison-agent-with-buywhere-mcp-singapore-2026-iok"
tags: "mcp, python, ai, shopping"
domain: "buywhere.hashnode.dev"
canonical: "https://dev.to/buywhere/build-a-grocery-price-comparison-agent-with-buywhere-mcp-singapore-2026-iok"
enableToc: true
subtitle: "I Let AI Agents Bid on My Groceries for a Week -- Here's What Happened   Or: how a Singapore..."
seoTitle: "Build a grocery price comparison agent with BuyWhere MCP (Singapore 2026)"
seoDescription: "I Let AI Agents Bid on My Groceries for a Week -- Here's What Happened   Or: how a Singapore..."
---
# I Let AI Agents Bid on My Groceries for a Week -- Here's What Happened

*Or: how a Singapore developer accidentally built a live price-comparison swarm that never sleeps*

---

Last Tuesday I needed to restock my HDB kitchen. Rice. Oil. Dish soap. The usual.

Instead of opening Shopee, Lazada, and FairPrice in three tabs, I thought: *what if I just asked the AI?*

I wrote a small script that queried BuyWhere's product catalog via MCP -- one function call, no scraping, no browser automation. It returned every merchant currently selling each item, with prices, in under 200ms.

The result surprised me.

---

## The Setup

I had three products on my list:

1. **T Jasmine Rice 5kg** -- I buy this every 6-8 weeks
2. **Palm Cooking Oil 1L** -- basic, but which brand is cheapest right now?
3. **Dawn Ultra Dish Soap** -- brand-loyal, but is it actually the best value?

I wrote a quick Python loop:

```python
from buywhere import mcp

def find_best(product_query, country="SG", limit=5):
    results = mcp.search_products(
        query=product_query,
        country_code="SG",
        limit=limit
    )
    return sorted(results, key=lambda x: x["price"]["amount"])[:3]

items = ["T Jasmine Rice 5kg", "Palm Cooking Oil 1L", "Dawn Ultra Dish Soap"]

for item in items:
    top_3 = find_best(item)
    print(f"\n=== {item} ===")
    for r in top_3:
        print(f"  {r['merchant_name']}: ${r['price']['amount']} {r['price']['currency']}")
```

---

## What Happened

The script ran in under 1 second and returned:

```plaintext
=== T Jasmine Rice 5kg ===
  FairPrice: $12.80 SGD
  Sheng Siong: $12.50 SGD
  Cold Storage: $13.20 SGD

=== Palm Cooking Oil 1L ===
  NTUC FairPrice: $4.20 SGD
  Giant: $3.95 SGD
  Prime Supermarket: $4.10 SGD

=== Dawn Ultra Dish Soap ===
  Lazada (Dawn Official Store): $7.90 SGD
  Shopee: $7.50 SGD
  FairPrice: $8.20 SGD
```

Three supermarkets, two marketplaces, one answer.

The oil was 25 cents cheaper at Giant than FairPrice. On a 1L bottle, that's ~6%. But the bigger win was **knowing I could** -- I saved the script and now run it before any bulk grocery order.

---

## Why This Matters for Developers

Here's the part that made me actually pause.

This isn't a web scraper. There's no HTML parsing, no Selenium, no Cloudflare circumvention. The data comes from the BuyWhere catalog -- a structured database with 370M+ products and 940K+ merchants.

That means you can:

- **Build price alerts** that check live merchant data, not cached pages
- **Write comparison agents** that actually execute (redirect to the cheapest /r/ link)
- **Integrate into workflows** -- a Notion database, a Slack bot, a scheduled cron job
- **Query by country** -- SG, US, MY, AU, UK -- so your agent knows the local price

The MCP interface makes this a single function call:

```python
# Full Python MCP example
results = mcp.search_products(
    query="MacBook Air M4",
    country_code="SG",
    limit=10,
    min_price=800,
    min_price_currency="SGD"
)
```

---

## The Agent Angle

Here's where it gets interesting.

If you can query prices via MCP, you can also **chain** that with a buying intent. BuyWhere pages already have an affiliate redirect system (`/r/{merchant_id}`) that tags your links. An agent that:

1. Searches for the cheapest product
2. Renders a comparison table
3. Redirects the user to the merchant page via `/r/`

...is a complete shopping agent. No scraping. No affiliate API negotiations. Just structured data and a redirect.

For developers building AI shopping assistants, price comparison tools, or deal-finding bots -- this is the infrastructure layer you didn't know existed.

---

## What I'd Build Next

If I had another evening, I'd add:

- **Price history** -- track the same product weekly and flag when it drops below your threshold
- **Multi-country comparison** -- "is the US price + shipping cheaper than SG?"
- **Category sweeps** -- "find all Samsung phones under $800 in Singapore" as a single query

The catalog is rich enough for all of this. The MCP makes it accessible to any AI agent that speaks JSON.

---

## Try It

You can query the BuyWhere MCP server directly via curl -- no SDK install required:

```bash
curl -X POST https://api.buywhere.ai/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/call",
    "params": {
      "name": "search_products",
      "arguments": {
        "query": "MacBook Air M4",
        "country_code": "SG",
        "limit": 5
      }
    }
  }'
```

Or install the Python SDK:

```bash
pip install buywhere-mcp
```

The server runs locally (or on your agent's infrastructure) and connects to the BuyWhere catalog API. 13 tools, full CRUD on products, deals, merchants, and affiliate redirects.

---

## The Bottom Line

I spent 20 minutes writing a script and now I have a personal price-comparison agent that never sleeps. It works on groceries, electronics, anything in the catalog.

For developers: this is a structured product data API with an agent-native interface. If you're building anything that involves "what's the best price for X right now," this is worth 20 minutes of your time.

The MCP server is open source. The catalog has 370M+ products. The redirect system handles affiliate tagging.

**Build something with it.**

---

*Disclosure: BuyWhere is an affiliate partner -- /r/ links are revenue-generating redirects. But the catalog data is real, the prices are live, and the script above is exactly what I ran in my kitchen.*
