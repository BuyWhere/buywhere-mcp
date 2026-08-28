---
title: "Build an air-quality agent that picks the right HDB purifier using MCP"
slug: "build-an-air-quality-agent-that-picks-the-right-hdb-purifier-using-mcp-5ece"
tags: "ai, mcp, python, singapore"
domain: "buywhere.hashnode.dev"
canonical: "https://dev.to/buywhere/build-an-air-quality-agent-that-picks-the-right-hdb-purifier-using-mcp-5ece"
enableToc: true
subtitle: "How to combine BuyWhere MCP with a small Python agent to recommend an air purifier sized to your HDB room and Haze season — live Singapore pricing across 25+ merchants"
seoTitle: "Build an air-quality agent that picks the right HDB purifier using MCP"
seoDescription: "How to combine BuyWhere MCP with a small Python agent to recommend an air purifier sized to your HDB room and Haze season — live Singapore pricing across 25+ merchants"
---
Singapore's PSI can swing from 20 to 200 in a single afternoon. Most people buy an air purifier that's the wrong size for their room, or that costs 40% more than they need to.

This post shows how to build a small AI agent that recommends the right air purifier for your specific HDB room and budget — using live pricing data from Singapore merchants.

The agent does three things:

1. Reads your room size (in square meters) and budget (in SGD)
2. Searches the BuyWhere MCP catalog for air purifiers that match
3. Ranks them by CADR-per-dollar and includes live merchant links

The whole thing fits in 70 lines of Python.

## Why CADR-per-dollar matters more than brand

Every air purifier advertises a CADR (Clean Air Delivery Rate) measured in m³/h. For HDB rooms, the rule of thumb is:

> CADR needed = room area (m²) × 8

A 12 m² bedroom needs a purifier with at least 96 m³/h CADR. A 25 m² living room needs 200 m³/h. Most people don't know this, and end up buying a purifier that's undersized — which does nothing during Haze season.

Two purifiers with the same price can have wildly different CADR. The right comparison is **CADR per dollar**, not price.

## What the agent looks like

The MCP server exposes a `search_products` tool. Our agent just calls it with the right query and filters the response.

```python
import json
import subprocess
from pathlib import Path

def search_buywhere(query: str, country: str = "SG", limit: int = 30) -> list:
    """Search BuyWhere MCP and return priced products."""
    payload = {
        "jsonrpc": "2.0",
        "id": 1,
        "method": "tools/call",
        "params": {
            "name": "search_products",
            "arguments": {
                "query": query,
                "country": country,
                "limit": limit,
                "min_price": 50,
                "max_price": 2000,
            },
        },
    }
    result = subprocess.run(
        ["curl", "-s", "-X", "POST",
         "https://mcp.buywhere.ai/mcp",
         "-H", "Content-Type: application/json",
         "-d", json.dumps(payload)],
        capture_output=True, text=True, check=True,
    )
    return json.loads(result.stdout)["result"]["data"]

def recommend(room_m2: float, budget_sgd: float) -> dict:
    """Pick the best CADR-per-dollar air purifier for an HDB room."""
    needed_cadr = room_m2 * 8
    products = search_buywhere("air purifier HEPA")
    scored = []
    for p in products:
        cadr = p.get("cadr_m3h") or 0
        price = p["price_sgd"]
        if cadr >= needed_cadr and price <= budget_sgd:
            scored.append({
                "title": p["title"],
                "merchant": p["merchant"],
                "price_sgd": price,
                "cadr_m3h": cadr,
                "cadr_per_dollar": round(cadr / price, 2),
                "link": f"https://buywhere.ai/r/direct/{p['id']}",
            })
    scored.sort(key=lambda x: x["cadr_per_dollar"], reverse=True)
    return {
        "needed_cadr": needed_cadr,
        "recommendations": scored[:5],
    }

if __name__ == "__main__":
    import sys
    room = float(sys.argv[1]) if len(sys.argv) > 1 else 12
    budget = float(sys.argv[2]) if len(sys.argv) > 2 else 800
    print(json.dumps(recommend(room, budget), indent=2))
```

Save as `purifier_agent.py`. Run with `python purifier_agent.py 12 800` and you'll get the top 5 air purifiers sized for a 12 m² HDB room at S$800 — ranked by CADR per dollar.

## Why this works

The agent has three properties that a static comparison page can't:

1. **Always-live data.** Every call hits the current BuyWhere catalog. Prices, stock, and merchant count update without code changes.
2. **Personalised recommendations.** Same agent, different rooms → different recommendations. No manual curation.
3. **Composable.** You can extend it with PSI data, weather APIs, or your existing smart-home agent.

## Production notes

- Add a 5-minute cache if you're hitting MCP more than once per user session.
- The BuyWhere MCP server enforces rate limits per API key; sign up at mcp.buywhere.ai to get a key.
- For production, swap `subprocess.run(curl)` for `httpx.AsyncClient` — the JSON-RPC schema is identical.

## What to ship next

If you're building a real estate or smart home product, you can wrap this agent in a Telegram bot, a Discord slash command, or a Webflow embed. The agent is the backend — the chat surface is up to you.

The point isn't "use AI for shopping." The point is: **live, structured product data is what makes AI agents useful for commerce**, and the MCP pattern is the simplest way to wire it up.

Try it on your own HDB room and tell me what you get.
