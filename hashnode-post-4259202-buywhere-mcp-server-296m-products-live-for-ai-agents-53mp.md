---
title: "BuyWhere MCP Server: 296M+ Products Live for AI Agents"
slug: "buywhere-mcp-server-296m-products-live-for-ai-agents-53mp"
tags: "mcp, ai, agents, ecommerce"
domain: "buywhere.hashnode.dev"
canonical: "https://dev.to/buywhere/buywhere-mcp-server-296m-products-live-for-ai-agents-53mp"
enableToc: true
subtitle: "BuyWhere's MCP server is now live, letting AI agents search, compare, and find best prices across 296M+ products from 214,000+ merchants and 20+ countries."
seoTitle: "BuyWhere MCP Server: 296M+ Products Live for AI Agents"
seoDescription: "BuyWhere's MCP server is now live, letting AI agents search, compare, and find best prices across 296M+ products from 214,000+ merchants and 20+ countries."
---
## BuyWhere is now agent-native

We just shipped the **BuyWhere MCP server** at `https://api.buywhere.ai/mcp` — an 8-tool Model Context Protocol endpoint that any AI agent can connect to for real-time product discovery, price comparison, and deal hunting across our 296,510,560-product catalog (live count: 293.5M active).

## Why an MCP server?

Modern AI agents need a structured way to shop — not a wall of HTML to scrape. The MCP standard gives Claude, Cursor, custom agents, and LangChain a clean tool-use surface. One HTTP transport, eight well-typed tools, free tier available (1,000 calls/month).

## The eight tools

1. **`search_products`** — full-text search with `q`, `country_code`, `region`, `category`, `merchant`, `min_price`, `max_price`, `compact`. The flagship tool. Pass `deliver_to: "SG"` to rank results by whether they actually ship to Singapore.
2. **`get_product`** — full detail by product UUID (price, brand, specs, ratings, availability).
3. **`compare_products`** — side-by-side compare 2–10 products with normalized price + currency.
4. **`find_best_price`** — the cheapest deliverable listing for a product name + country.
5. **`get_deals`** — curated deals for a region/category, sorted by discount %.
6. **`find_similar`** — k-nearest neighbours using vector similarity on title + description.
7. **`list_categories`** — the 50-leaf taxonomy with product counts.
8. **`ingest_products`** — admin tool for merchants to submit feeds (Shopee, Lazada, Amazon SG, Walmart, etc).

## Live install snippet

```json
{
  "mcpServers": {
    "buywhere": {
      "url": "https://api.buywhere.ai/mcp",
      "headers": {
        "Authorization": "Bearer ${BUYWHERE_API_KEY}"
      }
    }
  }
}
```

Free API key: https://api.buywhere.ai/v1/auth/register (1,000 calls/month, no credit card).

## Coverage

- **Singapore (SG)** — Shopee, Lazada, Amazon SG, FairPrice, Harvey Norman, Carousell
- **Southeast Asia (SEA)** — Vietnam, Thailand, Malaysia, Philippines, Indonesia
- **United States (US)** — Amazon US, Walmart, Best Buy
- **20 regions** total across the catalog; `deliver_to` filter for shippable-first ranking

## Why this matters

If you're building a shopping agent — or just want Claude/Cursor to find the cheapest AirPods Pro in Singapore that actually ship here — the BuyWhere MCP server is a one-line drop-in. We carry 214,306 merchants and add ~3M new products a week.

## Resources

- Live MCP endpoint: https://api.buywhere.ai/mcp
- MCP docs: https://api.buywhere.ai/docs/guides/mcp
- Agent manifest (`glama.json`): https://github.com/BuyWhere/buywhere/blob/main/glama.json
- Smithery manifest: https://github.com/BuyWhere/buywhere/blob/main/smithery.yaml
- Listings: Glama, Smithery, mcp.so, official MCP Registry (registry.modelcontextprotocol.io)
- Issue tracker / feedback: https://github.com/BuyWhere/buywhere/issues

Ping us at api@buywhere.ai if you want a higher rate limit or are a merchant who wants to ship through the catalog.
