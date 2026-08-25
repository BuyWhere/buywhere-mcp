---
title: "BuyWhere MCP now listed on Glama"
slug: "buywhere-mcp-now-listed-on-glama-4h8m"
tags: "mcp, aiagents, ecommerce, developers"
domain: "buywhere.hashnode.dev"
canonical: "https://dev.to/buywhere/buywhere-mcp-now-listed-on-glama-4h8m"
enableToc: true
subtitle: "If you're building a shopping agent in 2026, you've probably noticed the directory walls are starting..."
seoTitle: "BuyWhere MCP now listed on Glama"
seoDescription: "If you're building a shopping agent in 2026, you've probably noticed the directory walls are starting..."
---
If you're building a shopping agent in 2026, you've probably noticed the directory walls are starting to matter less than the protocol behind them.

BuyWhere is now listed on [Glama](https://glama.ai/mcp/servers/BuyWhere/buywhere-mcp) — alongside the other agentic commerce servers the MCP community is collecting.

Glama curates MCP servers by quality signal — the listing page surfaces tool inventory and a one-line capability summary, so you can see exactly what the server exposes before you wire it in.

Why this matters for builders:

- **One endpoint.** Point your client at `https://mcp.buywhere.ai/mcp`. Works with Claude, GPT, LangChain, raw tool loops.
- **Live cross-merchant catalog, not a feed.** Millions of products across Shopee, Lazada, Amazon, and 870K+ other merchants, refreshed hourly.
- **13 MCP tools** out of the box, including v2 variants: `search_products`, `get_product`, `compare_products`, `find_best_price`, `get_deals`, `list_categories`, `find_similar`, `ingest_products` — plus `_v2` versions of the core five with region-aware parameters.

Quick taste:

```json
{
  "method": "tools/call",
  "params": {
    "name": "search_products_v2",
    "arguments": { "q": "laptop", "deliver_to": "US", "limit": 3 }
  }
}
```

That call was verified against the live server during the listing review — 3 real results, no hallucination.

Try the server, then go poke the listing:
https://glama.ai/mcp/servers/BuyWhere/buywhere-mcp

We'll keep updating the catalog and the registry entry as the protocol evolves.
