---
title: "Build a Singapore deals watcher with BuyWhere get_deals_v2 (MCP)"
slug: "build-a-singapore-deals-watcher-with-buywhere-getdealsv2-mcp-4h16"
tags: "ai, mcp, python, api"
domain: "buywhere.hashnode.dev"
canonical: "https://dev.to/buywhere/build-a-singapore-deals-watcher-with-buywhere-getdealsv2-mcp-4h16"
enableToc: true
subtitle: "Agents should not scrape Shopee, Lazada, and Amazon to notice a price drop. BuyWhere MCP already..."
seoTitle: "Build a Singapore deals watcher with BuyWhere get_deals_v2 (MCP)"
seoDescription: "Agents should not scrape Shopee, Lazada, and Amazon to notice a price drop. BuyWhere MCP already..."
---
Agents should not scrape Shopee, Lazada, and Amazon to notice a price drop. BuyWhere MCP already normalizes those catalogs. This is a ~40-line watcher that registers a headless API key, calls `get_deals_v2`, and prints the cheapest live deals for Singapore.

Live MCP surface (verified 2026-09-02): 13 tools on `https://api.buywhere.ai/mcp` — 8 v1 + 5 v2 including `get_deals_v2` and `find_best_price_v2`. Directories: [Smithery](https://smithery.ai/servers/BuyWhere/buywhere-mcp) and [Glama](https://glama.ai/mcp/servers/BuyWhere/buywhere-mcp).

## 1. Get a key (no email)

```bash
curl -s -X POST "https://api.buywhere.ai/v1/auth/register?verify=false" \
  -H "Content-Type: application/json" \
  -d '{"agent_name":"deals-watcher"}'
```

The JSON returns `api_key`. 1000 requests/day free. Store it as `BUYWHERE_API_KEY`.

## 2. Call get_deals_v2 over JSON-RPC

MCP is HTTP POST JSON-RPC 2.0, not SSE.

```python
import json, os, urllib.request

KEY = os.environ["BUYWHERE_API_KEY"]
payload = {
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {
        "name": "get_deals_v2",
        "arguments": {"country": "SG", "limit": 8},
    },
}
req = urllib.request.Request(
    "https://api.buywhere.ai/mcp",
    data=json.dumps(payload).encode(),
    headers={
        "Content-Type": "application/json",
        "Authorization": "Bearer " + KEY,
    },
)
with urllib.request.urlopen(req, timeout=30) as r:
    body = json.load(r)

content = (body.get("result") or {}).get("content") or []
text = content[0]["text"] if content else json.dumps(body)
data = json.loads(text) if isinstance(text, str) and text[:1] in "[{" else text
items = data if isinstance(data, list) else data.get("deals") or data.get("products") or []

def amount(p):
    price = p.get("price") or {}
    if isinstance(price, dict):
        return price.get("amount"), price.get("currency")
    return p.get("amount"), p.get("currency")

for p in items[:8]:
    amt, cur = amount(p)
    title = p.get("title") or p.get("name")
    print(f"{cur} {amt}  {title}")
```

**Price shape:** `price` is nested `{amount, currency}`. Do not read a flat `price` number.

## 3. Cron it

Run every 30 minutes. Swap `country` to `US` for the US catalog. Pair with `find_best_price_v2` when you already know the SKU.

## Try it on a live page

US budget laptops (affiliate hops via `/r/`, never merchant URLs): [best-budget-laptops-us](https://buywhere.ai/best-budget-laptops-us).

Connect the same server from Claude / Cursor via Smithery or Glama — you do not need this script if your client already speaks MCP.
