---
title: "Compare two products with BuyWhere MCP compare_products_v2 (2026)"
slug: "compare-two-products-with-buywhere-mcp-compareproductsv2-2026-1enc"
tags: "mcp, python, ai, shopping"
domain: "buywhere.hashnode.dev"
canonical: "https://dev.to/buywhere/compare-two-products-with-buywhere-mcp-compareproductsv2-2026-1enc"
enableToc: true
subtitle: "Compare two products with BuyWhere MCP compare_products_v2   You do not need a scraper farm..."
seoTitle: "Compare two products with BuyWhere MCP compare_products_v2 (2026)"
seoDescription: "Compare two products with BuyWhere MCP compare_products_v2   You do not need a scraper farm..."
---
# Compare two products with BuyWhere MCP `compare_products_v2`

You do not need a scraper farm to answer "which of these two laptops is cheaper right now." BuyWhere's MCP server exposes `compare_products_v2` over JSON-RPC at `https://api.buywhere.ai/mcp`.

Live listing: [Smithery](https://smithery.ai/servers/BuyWhere/buywhere-mcp) · [Glama](https://glama.ai/mcp/servers/BuyWhere/buywhere-mcp)

## Why this exists

Affiliate product cards on BuyWhere intent pages (for example [best gaming laptops US](https://buywhere.ai/best-gaming-laptops-us) and [best 4K monitors Singapore](https://buywhere.ai/best-4k-monitors-singapore)) already route through `/r/` merchant links. Agents should use the same catalog, not HTML.

The remote MCP surface currently lists **13 tools** (`search_products` + `*_v2` variants). `compare_products_v2` is the one that returns a side-by-side price/spec payload.

## Minimal Python (stdlib only)

```python
import json, urllib.request

MCP = "https://api.buywhere.ai/mcp"

def rpc(method, params=None, id=1):
    body = json.dumps({"jsonrpc": "2.0", "id": id, "method": method, "params": params or {}}).encode()
    req = urllib.request.Request(MCP, data=body, headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.load(r)

# 1. list tools (sanity)
tools = [t["name"] for t in rpc("tools/list")["result"]["tools"]]
assert "compare_products_v2" in tools

# 2. search two SKUs in one country
def search(q, country="US"):
    res = rpc("tools/call", {
        "name": "search_products_v2",
        "arguments": {"query": q, "country": country, "limit": 5},
    })
    return res

print(search("gaming laptop rtx 4070"))
```

Call `compare_products_v2` with two product ids from the search result. Always read **nested** `price.amount` / `price.currency` — the catalog does not flatten those fields.

## Guardrails that actually matter

- **Currency is nested.** Filter `price.currency == "USD"` or `"SGD"` before ranking.
- **US iPhone search still returns accessories.** If you asked for a phone and got $13 cases, that is a catalog gap, not a client bug.
- **Do not scrape merchant URLs.** Route humans through BuyWhere `/r/` pages; agents use MCP.

## Install

Remote: `https://api.buywhere.ai/mcp`

npx: `npx @buywhere/mcp`

If you are wiring this into Claude / Cursor / Smithery, the 13-tool list is the source of truth — not a 5-tool `smithery.yaml` excerpt.

Prices move. Re-query; do not cache a "cheapest" claim in prose.
