---
title: "Building a Cross-Border Price-Comparison Agent: A Live Build Log"
slug: "building-a-cross-border-price-comparison-agent-a-live-build-log-gmh"
tags: "ai, mcp, langchain, tutorial"
domain: "buywhere.hashnode.dev"
canonical: "https://dev.to/buywhere/building-a-cross-border-price-comparison-agent-a-live-build-log-gmh"
enableToc: true
subtitle: "A live build log of a cross-border price-comparison agent — what shipped, what broke, and the 3 patterns we use on every integration. (LangChain + BuyWhere MCP, real query logs.)"
seoTitle: "Building a Cross-Border Price-Comparison Agent: A Live Build Log"
seoDescription: "A live build log of a cross-border price-comparison agent — what shipped, what broke, and the 3 patterns we use on every integration. (LangChain + BuyWhere MCP, real query logs.)"
---
## Why a build log (and not another tutorial)

Every AI shopping tutorial shows the same thing: install the SDK, call a tool, ship. None of them show what happens when the API returns a price that is *stale*, the merchant is *geo-blocked*, or the agent has to reconcile *four different currencies* for a single shopper query.

This is the build log of a working cross-border shopping agent — what we shipped, what broke, and the patterns we now use on every customer integration.

## What we are building

A conversational agent that takes a product brief ("noise-cancelling headphones under SGD 400") and returns the **three cheapest matching offers across SG, US, and JP retailers in real time**, with currency conversion and shipping transparency.

It uses [BuyWhere MCP](https://mcp.buywhere.ai/agent.json) as the price-discovery layer (5M+ products, 6M+ offers, 100+ merchants, 5 currency modes).

## The architecture, after three iterations

**v1 — naive**: agent calls `search_products`, picks top 3, returns them. Failed because the agent had no idea which offers were *in stock* or *shippable* to the user.

**v2 — offer-aware**: agent calls `search_products` (with `mode=offer`), then calls `get_product` on each to pull current price + shipping. Failed because round-trips to `get_product` added 8–11s of uncached latency on the first request.

**v3 — multi-region, currency-normalised** (the one that ships):

1. `search_products` with `mode=offer` and a regional filter
2. Filter offers by in-stock + ships_to=user_region *in the agent prompt*
3. For cross-region results, call `find_similar` to get the same product in the local catalog and pick the cheaper of (local offer + shipping) vs (foreign offer + conversion + shipping)
4. Return three results with a one-line rationale per choice

The result is a 1.2–2.4s response time and a 73% click-through on the top result, measured over 1,800 shopper queries last week.

## Three patterns we use on every integration now

### 1. Always pass `mode=offer` for shopping tasks

`mode=product` returns the canonical product card (good for browsing and category pages). `mode=offer` returns the cheapest *live* offers per merchant (good for shopping decisions). Mixing them in the same agent flow gives the model two different mental models of "cheapest" and the answers stop being reproducible.

### 2. Always specify currency at search time

The `currency` parameter on `search_products` is a conversion *and* a filter — it returns the offer converted to your target currency *and* skips offers that the merchant does not ship to your region. We default to USD for global use cases and SGD for SG-locked ones. Without it, you get a mix of currencies the user has to reconcile.

### 3. Always treat `find_similar` as a re-pricing tool, not a discovery tool

`find_similar` finds the same product across merchants. In a price-comparison agent, the right move is: take the top result, then call `find_similar` to see if the same SKU is cheaper elsewhere *in the same currency*. Discovery is `search_products`; re-pricing is `find_similar`.

## What we learned (and what we are still figuring out)

- **The agent prompt is the cache**. Same model, same tool, same data — different system prompt, different result quality. We have a `prompts/shopper.md` that we update whenever a regression slips in.
- **Latency is a feature, not a bug**. A 1.2s response is a *better* answer than a 0.6s response that omits the shipping-cost check.
- **The hardest problem is still data freshness**. BuyWhere re-prices every offer on a 4–6h cadence. For sale items, that is not enough — we are now testing 1h re-pricing for items under 20% off and 15-minute for items under 50% off.

## Try it yourself

The full build (LangChain + BuyWhere MCP) takes about 30 minutes if you have Node 20+ and an OpenAI key:

```bash
# install the MCP server
npm install -g @buywhere/mcp-server
# set credentials
export BUYWHERE_API_KEY=...
# clone the reference agent
git clone https://github.com/buywhere/shopper-agent-example
cd shopper-agent-example && npm install && npm start
```

The repo includes a [case-study notebook](https://github.com/buywhere/shopper-agent-example/blob/main/case-study.md) that walks through each iteration and the exact queries that motivated the design decisions above.

---

*Building a cross-border shopping agent and want a second pair of eyes? We are running free integration calls this month — book one at partners@buywhere.ai.*
