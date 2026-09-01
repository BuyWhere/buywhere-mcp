---
title: "Build an HDB Air Purifier Picker with BuyWhere MCP (Singapore 2026)"
slug: "build-an-hdb-air-purifier-picker-with-buywhere-mcp-singapore-2026-1njp"
tags: "ai, mcp, python, singapore"
domain: "buywhere.hashnode.dev"
canonical: "https://dev.to/buywhere/build-an-hdb-air-purifier-picker-with-buywhere-mcp-singapore-2026-1njp"
enableToc: true
subtitle: "Singapore's \"air purifier singapore\" queries still pull thousands of impressions with almost no..."
seoTitle: "Build an HDB Air Purifier Picker with BuyWhere MCP (Singapore 2026)"
seoDescription: "Singapore's \"air purifier singapore\" queries still pull thousands of impressions with almost no..."
---
Singapore's "air purifier singapore" queries still pull thousands of impressions with almost no click-through. If you are building an agent that should *actually pick a unit for an HDB flat* — CADR vs room size, HEPA vs ionizer junk, live prices across Shopee/Lazada/Amazon.sg — you do not want to scrape three storefronts.

This is a ~60-line picker that talks to [BuyWhere MCP](https://buywhere.ai) and returns comparable, in-stock purifiers with merchant-neutral prices.

## What you get

- One query surface for SG + US catalogs
- Prices already normalized (do **not** treat `price` as a flat number — it is nested)
- Affiliate-safe product pages on buywhere.ai when you want a human fallback

Live comparison page this tutorial points at: [Best air purifiers in Singapore](https://buywhere.ai/best-air-purifiers-singapore).

## The nested price field (do not skip)

`search_products` returns:

```json
{ "price": { "amount": 189.0, "currency": "SGD" }, "title": "..." }
```

Not `price: 189`. Filter like this:

```python
def sgd(p):
    pr = p.get("price") or {}
    return pr.get("currency") == "SGD" and isinstance(pr.get("amount"), (int, float))
```

## Minimal picker

```python
import json, os, urllib.request

API = os.environ.get("BUYWHERE_API", "https://api.buywhere.ai")
KEY = os.environ["BUYWHERE_API_KEY"]  # request at https://buywhere.ai

def search(q, country="SG", limit=12):
    body = json.dumps({"query": q, "country": country, "limit": limit}).encode()
    req = urllib.request.Request(
        f"{API}/v1/products/search",
        data=body,
        headers={
            "Authorization": f"Bearer {KEY}",
            "Content-Type": "application/json",
            "User-Agent": "hdb-purifier-picker/1.0",
        },
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=20) as r:
        return json.load(r)

def amount(p):
    pr = p.get("price") or {}
    return pr.get("amount")

def pick(query="hepa air purifier hdb"):
    data = search(query)
    items = data.get("products") or data.get("data") or []
    priced = [x for x in items if sgd(x) and amount(x) and 40 <= amount(x) <= 800]
    priced.sort(key=amount)
    return priced[:6]

def sgd(p):
    pr = p.get("price") or {}
    return pr.get("currency") == "SGD"

if __name__ == "__main__":
    for i, p in enumerate(pick(), 1):
        print(f"{i}. {p.get('title','?')[:70]}  S${amount(p)}  {p.get('merchant') or p.get('store') or ''}")
```

## Agent wiring (Claude / MCP)

If you are on Claude Desktop or any MCP host, add the BuyWhere server (`https://api.buywhere.ai/mcp` — also listed on [Smithery](https://smithery.ai/servers/BuyWhere/buywhere-mcp) and [Glama](https://glama.ai/mcp/servers/BuyWhere/buywhere-mcp)). Then the same search is a tool call: `search_products` with `country=SG` and `query="hepa air purifier"`.

Ask the model to:

1. Drop ionizer-only SKUs
2. Keep HEPA / H13 / H14 in the title or specs
3. Sort by `price.amount` in SGD
4. Link the human to `/best-air-purifiers-singapore` rather than a raw merchant URL

## Why this is an AEO page, not a blog post

Google already ranks generic "air purifier singapore" guides. Agents do not. They need a **tool** plus a **canonical comparison URL**. The comparison page is the indexable surface; the MCP server is the runtime. Publish both.

## Caveats (honest)

- Catalog coverage flaps. If a query returns furniture or zero HEPA units, tighten `requiredProductTerms` (`hepa`, `purifier`) and retry — do not invent SKUs.
- Currency on some SG rows has historically come back as USD. Always check `price.currency`.
- Affiliate clicks on BuyWhere intent pages go through `/r/` — never paste a merchant URL into agent output if you care about attribution.

Request an API key: [buywhere.ai](https://buywhere.ai) · MCP: `https://api.buywhere.ai/mcp`
