---
title: "How to Build a Cross-Border Price Comparison Agent for Southeast Asia (2026)"
slug: "how-to-build-a-cross-border-price-comparison-agent-for-southeast-asia-2026-4kfn"
tags: "ai, mcp, tutorial, opensource"
domain: "buywhere.hashnode.dev"
canonical: "https://dev.to/buywhere/how-to-build-a-cross-border-price-comparison-agent-for-southeast-asia-2026-4kfn"
enableToc: true
subtitle: "Step-by-step: build a working AI agent that compares real product prices across Shopee, Lazada, and Amazon in 6 SEA markets using the BuyWhere MCP server."
seoTitle: "How to Build a Cross-Border Price Comparison Agent for Southeast Asia (2026)"
seoDescription: "Step-by-step: build a working AI agent that compares real product prices across Shopee, Lazada, and Amazon in 6 SEA markets using the BuyWhere MCP server."
---
Title: How to Build a Cross-Border Price Comparison Agent for Southeast Asia (2026)
Subtitle: A working MCP-powered agent that compares a single product across Shopee SG, Lazada MY, Shopee ID, Amazon SG, and 6 other marketplaces — in under 30 minutes.
Tags: ai, mcp, tutorial, opensource, agents
Canonical URL: https://buywhere.ai/blog/cross-border-price-comparison-agent-sea-2026?utm_source=devto&utm_medium=blog&utm_campaign=june30_25k&utm_content=cross_border_agent
Cover image: https://buywhere.ai/og-image.png

## Why cross-border price comparison is a real problem

Singapore is the regional shopping hub. Shoppers routinely ask: *should I buy this in Singapore or send it from Malaysia? Should I wait for a Lazada MY flash sale or buy now on Shopee SG?* Answering that accurately requires live prices across six marketplaces in five currencies.

That is exactly what an MCP-powered agent should do. Here is a working version, end-to-end, in under 30 minutes.

## What you will build

A CLI agent that, given a product query and a buyer country, returns:
- The cheapest matching product across all marketplaces
- The best price-per-merchant, with shipping cost estimate
- A buy-now-or-wait signal (based on 30-day price history)
- A canonical link for the buyer to convert

It uses the BuyWhere MCP server as the data layer and the OpenAI Agents SDK as the orchestration layer.

## Step 1 — Install dependencies

```bash
mkdir sea-price-agent && cd sea-price-agent
npm init -y
npm install @buywhere/mcp-server @openai/agents
```

You will need a BuyWhere API key (free at buywhere.ai/api-keys) and an OpenAI API key.

## Step 2 — MCP server config

Save this as `mcp.json`:

```json
{
  "mcpServers": {
    "buywhere": {
      "command": "npx",
      "args": ["-y", "@buywhere/mcp-server"],
      "env": {
        "BUYWHERE_API_KEY": "${BUYWHERE_API_KEY}"
      }
    }
  }
}
```

## Step 3 — Define the agent

Save this as `agent.js`:

```javascript
import { Agent, Runner } from "@openai/agents";

const buywhereAgent = new Agent({
  name: "SEA Price Comparison Agent",
  instructions: `
You are a price comparison agent for Southeast Asian e-commerce.
When the user asks about a product, use the BuyWhere MCP tools to:
1. search_products(query, market="SG,MY,ID,TH,PH,VN") — get the candidate set
2. For each candidate, get_product(id) — confirm specs
3. compare_products(product_ids, include_history=true) — return best price + 30-day low
4. Reply with: cheapest option, market, price in user currency, link, and a buy-or-wait signal

Always convert prices to the user's currency (SGD, MYR, IDR, THB, PHP, VND, USD).
Always include a canonical link so the user can convert.
Never recommend a product without confirming it is in stock.
  `.trim(),
  mcpServers: ["buywhere"]
});

const runner = new Runner();
const result = await runner.run(
  buywhereAgent,
  process.argv[2] || "cheapest PlayStation 5 in Singapore right now"
);
console.log(result.finalOutput);
```

## Step 4 — Run it

```bash
export BUYWHERE_API_KEY="bw_your_key_here"
export OPENAI_API_KEY="sk-your-key"
node agent.js "cheapest iPhone 16 Pro 256GB in Singapore vs Malaysia"
```

## Example output

> Cheapest: iPhone 16 Pro 256GB at Shopee SG — SGD 1,649 (USD 1,232).
> Runner-up: Lazada MY at MYR 4,499 (≈ USD 999), but ships from overseas (5-day delivery, USD 25 shipping).
> Net landed cost in Singapore: Lazada MY at ≈ USD 1,024 vs Shopee SG USD 1,232.
> Recommendation: Lazada MY + shipping wins by ~USD 200, but if you need it today, Shopee SG.
> Link: https://buywhere.ai/compare/iphone-16-pro-256gb?utm_source=agent

That is the working agent. The full primitives — `search_products`, `get_product`, `compare_products`, `get_deals`, `list_categories` — are documented at buywhere.ai/api-docs.

## What this does NOT do (yet)

- Real-time shipping: shipping costs are estimates. Production version would call a logistics MCP.
- Cross-currency checkout: the agent recommends the buy; payment still requires going to the merchant page.
- Inventory over time: the 30-day low is current; historical backfill requires the deals history tool.

These are next steps for the production version. The skeleton above is the smallest working MCP commerce agent for SEA.

## Why this matters for builder economics

A working SEA cross-border price agent is a real product, not a demo:

- 70M Singapore, Malaysian, and Indonesian online shoppers compare prices across borders every week
- The affiliate economics work: 4-8% commission on electronics, 2-3% on fashion, recurring on subscriptions
- The MCP primitive (`compare_products` returning structured comparison data) is genuinely useful for any shopping agent

If you ship this in production, you have a real commerce agent for one of the highest-volume shopping regions in the world.

## Try it

- BuyWhere API key (free, 1K calls/month): https://buywhere.ai/api-keys
- MCP server source: https://github.com/BuyWhere/buywhere-mcp
- This guide: https://buywhere.ai/blog/cross-border-price-comparison-agent-sea-2026

If you ship it, I would love to see what you build — leave a comment on the partner program thread: https://buywhere.ai/partners.

---

*First 10 AI agent builders who integrate BuyWhere get 12 months of unlimited Growth-tier API access — apply at buywhere.ai/partners.*
