---
title: "Natural-Language Product Search That Actually Returns What Users Meant"
slug: "natural-language-product-search-that-actually-returns-what-users-meant-4i9o"
tags: "mcp, aiagents, ecommerce, developers"
domain: "buywhere.hashnode.dev"
canonical: "https://dev.to/buywhere/natural-language-product-search-that-actually-returns-what-users-meant-4i9o"
enableToc: true
subtitle: "Prompt patterns for turning vague shopping intent into structured catalog queries with the BuyWhere MCP server"
seoTitle: "Natural-Language Product Search That Actually Returns What Users Meant"
seoDescription: "Prompt patterns for turning vague shopping intent into structured catalog queries with the BuyWhere MCP server"
---
# Natural-Language Product Search That Actually Returns What Users Meant

If you've built an AI shopping agent, you've seen this failure:

> User: "cheap but decent coffee machine for a small office"
> Agent: returns a $9.99 plastic travel kettle, a $2,400 espresso station, and 14 phone cases named "Coffee".

The model didn't fail at language. It failed at **query construction** — the step between understanding intent and hitting your catalog API. This post is a field guide to that step, using the BuyWhere MCP server's `search_products` tool as the target. The patterns transfer to any structured product search API you expose to agents.

## The core problem: vague ≠ empty

When a human says "cheap but decent," they're giving you **two constraints and a tolerance**, not zero information. The mistake most agents make is one of two extremes:

1. **Passing the raw string** into a keyword search — noise wins.
2. **Asking the model to guess exact filters** with no calibration — arbitrary price floors and ceilings.

The fix is to make the tool schema itself guide the model. BuyWhere's `search_products` accepts:

- `query` (text)
- `minPrice` / `maxPrice` (calibrated bounds)
- `minRating` (quality floor)
- `category` (controlled vocabulary)
- `merchants` (source filter)
- `limit`

Each field exists because a *class* of user phrases maps onto it. Here's the mapping table worth keeping next to your prompt:

| User says | Agent should set |
|---|---|
| "cheap", "budget", "under $X" | `maxPrice` (with a sanity floor, see below) |
| "decent", "don't want junk" | `minRating: 4.0` |
| "for a small office" | `query` refinement + category, NOT a price guess |
| "from Lazada only" / "trusted stores" | `merchants` |
| "best", "top" | `minRating` + sort, not `maxPrice` |

## Pattern 1: Always floor your ceilings

"Cheap coffee machine" almost never means "under $5." A model that sets `maxPrice: 5` gets zero results or garbage. A model that sets `maxPrice: 120` gets office-appropriate machines.

**Prompt rule that fixes it:** when the user says cheap/budget, derive `maxPrice` from the *category's realistic floor*, not from the adjective. In practice, instruct the agent:

```plaintext
When a user says "cheap" or "budget" without a number, set maxPrice to
roughly 1.5× the typical minimum viable price for that category, and
always pair a maxPrice under $50 with minRating >= 3.5 to filter
junk-result territory.
```

The `minRating` pairing is the important half. Price ceilings without quality floors are how you end up recommending phone cases.

## Pattern 2: Use-case phrases are query refinements, not filters

"Small office" doesn't map to any filter field — and that's fine. It belongs in `query`:

```python
search_products(query: "compact drip coffee machine office", maxPrice: 120, minRating: 4.0, limit: 8)
```

The failure mode to avoid: letting the model *invent* a `capacity: "small"` filter or silently dropping the constraint. Your tool schema should have no field the model can confidently hallucinate into — keep controlled vocabularies closed (`category` is an enum, not free text).

## Pattern 3: Two-step narrowing beats one-shot guessing

For genuinely ambiguous intent ("gift for my dad"), the winning pattern is:

1. Broad query, `limit: 5`, no price bounds — see what the catalog *wants* to return.
2. Read the price/rating distribution of those results, then issue a refined call with calibrated `maxPrice` / `minRating`.

This costs one extra tool call and dramatically beats guessing bounds from priors, because the catalog's distribution is ground truth. Agents that do this stop returning $2,400 espresso stations alongside travel kettles.

## Pattern 4: Freshness is part of relevance

A perfect match at a stale price is a worse answer than a good match at a current one. If your API exposes any `lastVerified`/freshness signal (BuyWhere's price data carries verification timestamps — see [our freshness post](https://dev.to/buywhere/when-is-a-price-fresh-enough-for-an-ai-shopping-agent-to-recommend-28po)), have the agent prefer or annotate it. "In stock, $89, verified 2h ago" builds trust in a way raw results never will.

## Try it

The BuyWhere MCP server exposes `search_products` alongside 11 other shopping tools (deals, price comparison, merchant lookup). Point any MCP client at the public endpoint and run the patterns above against a live multi-merchant catalog:

- MCP server: https://mcp.buywhere.ai
- Docs: https://api.buywhere.ai/docs
- Earlier in this series: [every MCP tool, with real examples](https://dev.to/buywhere/every-mcp-tool-in-the-buywhere-shopping-agent-api-with-real-examples-5a6j)

If you're building a shopping agent and hitting query-construction failures, the mapping table above is the 80% win. The remaining 20% is calibration against *your* catalog's distributions — which is exactly what pattern 3 automates.
