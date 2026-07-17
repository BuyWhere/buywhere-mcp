---
title: "Build an AI Shopping Assistant with BuyWhere MCP in 10 Minutes (2026)"
slug: "build-an-ai-shopping-assistant-with-buywhere-mcp-in-10-minutes-2026-2e66"
tags: "mcp, ai, api, tutorial"
domain: "buywhere.hashnode.dev"
canonical: "https://dev.to/buywhere/build-an-ai-shopping-assistant-with-buywhere-mcp-in-10-minutes-2026-2e66"
enableToc: true
subtitle: "A copy-paste walkthrough that wires Claude Desktop (or any MCP client) into a 134M+ product catalog. 10 minutes, no credit card."
seoTitle: "Build an AI Shopping Assistant with BuyWhere MCP in 10 Minutes (2026)"
seoDescription: "A copy-paste walkthrough that wires Claude Desktop (or any MCP client) into a 134M+ product catalog. 10 minutes, no credit card."
---
# Build an AI Shopping Assistant with BuyWhere MCP in 10 Minutes (2026)

A copy-paste walkthrough that turns Claude Desktop (or any MCP-compatible client) into a price-comparison shopping agent over **134M+ products across 75K+ merchants** — under 10 minutes, no credit card.

> **What you'll build:** A working MCP client that answers questions like *"Find the cheapest 65-inch TV under $800 in stock at a US merchant with free shipping"* by combining Claude's reasoning with live BuyWhere catalog data.
>
> **What you need:** Node 18+ and a BuyWhere API key (free, 1,000 calls/month, no credit card). Sign up at `POST https://api.buywhere.ai/v1/auth/register` or via the dashboard.

---

## Why MCP for shopping assistants

Most LLM shopping demos break at the same seam: the model *knows* products from training data, but it has no way to ask the live catalog. MCP (Model Context Protocol) closes that seam — the model calls structured tools, the tools return real prices, the model reasons over real data.

BuyWhere exposes 6 MCP tools, all backed by a single REST catalog. You don't pick a transport — you get the same answer whether the agent calls MCP or REST.

---

## Step 1 — Get a free API key (60 seconds)

```bash
curl -X POST https://api.buywhere.ai/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"you@example.com","tier":"free"}'
```

Response:

```json
{
  "api_key": "bw_live_•••",
  "tier": "free",
  "monthly_limit": 1000,
  "reset_at": "2026-07-01T00:00:00Z"
}
```

Save the key — it's the only auth header you need. Free tier gives 1,000 calls/month, no credit card.

---

## Step 2 — Install the MCP server (90 seconds)

The official npm package handles the SSE transport, tool registration, and auth header. One install, one config entry.

```bash
npm install -g @buywhere/mcp-server
```

Or use npx without a global install:

```bash
npx -y @buywhere/mcp-server
```

Verify the package exists:

```bash
npm view @buywhere/mcp-server
# name: @buywhere/mcp-server
# version: 1.x.x
```

The package spins up an MCP server that proxies to `https://api.buywhere.ai/mcp` over streamable HTTP — your client just needs the URL and bearer token.

---

## Step 3 — Wire it into Claude Desktop (3 minutes)

Open `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) or `%APPDATA%\Claude\claude_desktop_config.json` (Windows). Add:

```json
{
  "mcpServers": {
    "buywhere": {
      "command": "npx",
      "args": ["-y", "@buywhere/mcp-server"],
      "env": {
        "BUYWHERE_API_KEY": "bw_live_•••"
      }
    }
  }
}
```

Restart Claude Desktop. You should see a 🔌 icon and a "buywhere" server with **6 tools**: `search_products`, `get_product`, `get_price`, `compare_prices`, `get_affiliate_link`, `get_catalog`.

> **Tip:** Any MCP-compatible client works the same way — Cursor, Continue.dev, Cline, Zed, custom agents. The MCP server URL is `https://api.buywhere.ai/mcp` and the auth header is `Authorization: Bearer bw_live_•••`.

---

## Step 4 — Test with a real shopping question (2 minutes)

Open a new Claude conversation and ask:

> *"I'm looking for a 65-inch TV under $800 from a US merchant with free shipping and at least 4-star reviews. Compare the top 3 options and recommend one."*

Claude will:

1. Call `search_products` with filters: `q=65 inch TV`, `country=US`, `max_price=800`, `shipping=free`, `min_rating=4`.
2. Call `get_price` on the top 3 results to confirm live availability.
3. Call `compare_prices` to get the side-by-side breakdown.
4. Return a recommendation with affiliate links.

The whole flow is < 5 seconds. Every price is live — the model never falls back on its training memory.

---

## Step 5 — Call the same data from custom code (3 minutes)

MCP is the easiest path, but sometimes you need REST (serverless, custom UIs, non-MCP clients). Same data, same auth:

```js
// search.js — find AirPods Pro under $250 in SG, sorted by price asc
const r = await fetch(
  'https://api.buywhere.ai/v1/products/search?' + new URLSearchParams({
    q: 'airpods pro',
    country: 'SG',
    currency: 'SGD',
    max_price: 250,
    in_stock: 'true',
    sort: 'price_asc',
    limit: 10
  }),
  { headers: { Authorization: `Bearer ${process.env.BUYWHERE_API_KEY}` } }
);
const { data } = await r.json();
console.log(`${data.length} results, cheapest: SGD ${data[0].price}`);
```

```js
// compare.js — side-by-side for 3 product IDs
const ids = [123, 456, 789].join(',');
const r = await fetch(
  `https://api.buywhere.ai/v1/products/compare?ids=${ids}`,
  { headers: { Authorization: `Bearer ${process.env.BUYWHERE_API_KEY}` } }
);
const { data } = await r.json();
for (const p of data) {
  console.log(`${p.title} — SGD ${p.price_range.min}–${p.price_range.max} (${p.merchant_count} merchants)`);
}
```

The REST endpoints and MCP tools return the same payload shape, so a quick swap between transports won't break your client.

---

## What "live" actually means

Pulled at 20:22 UTC on 2026-06-22 from `GET /v1/catalog/stats`:

| Field             | Value         |
| ----------------- | ------------- |
| `total_products`  | 134,481,184   |
| `total_merchants` | 75,918        |
| `active_products` | 133,136,372   |

The catalog is fed by continuous merchant ingestion — the same `maglev` pipeline that powers the MCP tools. When a merchant updates a price or goes out of stock, the next `search_products` call reflects it within minutes.

---

## Where to go next

- **MCP guide with code samples** — `https://api.buywhere.ai/docs/guides/mcp`
- **OpenAPI spec** — `https://api.buywhere.ai/docs`
- **GitHub examples** (Claude Desktop, Cursor, serverless, custom agents) — `https://github.com/BuyWhere/buywhere`
- **Pricing** — `https://buywhere.ai/pricing` (Free 1K/mo · Starter $9/50K · Pro $49/500K · Enterprise custom)
- **SLA** — 99.5% uptime on production

---

## Honest tradeoffs

BuyWhere is not a fit for every shopping agent:

- **Pre-orders and unlisted SKUs** aren't covered until merchants publish them.
- **Out-of-stock propagation** is minutes, not seconds — for sub-minute tick data, build a direct merchant integration.
- **Per-merchant historical data** beyond what merchants publish is out of scope.
- **Shipping fee accuracy** is best-effort — final cart total may differ at checkout.

For 95% of consumer shopping intents, the catalog is the right backbone. For the other 5%, the docs list direct merchant API options.

---

*Built and verified by the BuyWhere AEO/Content team. Questions: `api@buywhere.ai`. Canonical URL: `https://buywhere.ai/blog/buywhere-mcp-integration-walkthrough-2026`.*
