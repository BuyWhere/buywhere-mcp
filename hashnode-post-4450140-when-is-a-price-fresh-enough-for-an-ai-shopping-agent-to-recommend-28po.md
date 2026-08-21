---
title: "When Is a Price \"Fresh Enough\" for an AI Shopping Agent to Recommend?"
slug: "when-is-a-price-fresh-enough-for-an-ai-shopping-agent-to-recommend-28po"
tags: "mcp, aiagents, ecommerce, llms"
domain: "buywhere.hashnode.dev"
canonical: "https://dev.to/buywhere/when-is-a-price-fresh-enough-for-an-ai-shopping-agent-to-recommend-28po"
enableToc: true
subtitle: "The freshness problem in agent-grounded shopping, and the conventions we settled on after a quarter of running the BuyWhere MCP server across 394M products, 871K merchants, and 150K stores."
seoTitle: "When Is a Price \"Fresh Enough\" for an AI Shopping Agent to Recommend?"
seoDescription: "The freshness problem in agent-grounded shopping, and the conventions we settled on after a quarter of running the BuyWhere MCP server across 394M products, 871K merchants, and 150K stores."
---
# When Is a Price "Fresh Enough" for an AI Shopping Agent to Recommend?

Last week a developer asked us a question that stopped the conversation:

> "Your MCP server says the iPhone 17 256GB is $1,329 at Shopee SG. Is that price from right now, or from yesterday?"

The honest answer is: *it depends on when Shopee last updated its listing page*. If Shopee refreshed the page 4 minutes ago, our cache is 4 minutes stale. If they refreshed 36 hours ago, our cache is 36 hours stale. The MCP response says "$1,329" either way — but those are very different recommendations.

This post is about the freshness problem in agent-grounded shopping, and the conventions we settled on after a quarter of running the BuyWhere MCP server across **394M products**, **871K merchants**, and **150K stores**.

## Three freshness regimes, three different answers

We bucket every product record by how recently the source was crawled:

| Regime | Crawl age | What the agent should do |
|---|---|---|
| **Live** | ≤ 15 min | Cite the price with full confidence. Link to the merchant. |
| **Recent** | 15 min – 6 h | Cite the price, but disclose the age. "Verified at HH:MM:SSZ (X hours ago)." |
| **Stale** | > 6 h | Either suppress the price, or surface it with an explicit caveat: "Last seen at $X — may have changed." |

The hard cutoff isn't 6 hours because of a benchmark — it's because cross-merchant comparison breaks down past that point. If Shopee went up to $1,399 two hours ago and Lazada went down to $1,299, an agent citing a 7-hour-old snapshot can recommend the *wrong* winner. The cheaper one is now the more expensive one.

## The freshness timestamp is in the response, not a footer

Every product record carries `updated_at` at the top level. The MCP tools return it as part of the structured payload — your agent doesn't have to scrape it, infer it, or guess.

```json
{
  "product_id": "bw_sg_iphone17_256gb",
  "merchant": "Shopee Singapore",
  "price": 1329.00,
  "currency": "SGD",
  "url": "https://shopee.sg/...",
  "updated_at": "2026-08-21T04:32:11Z"
}
```

That timestamp is the source of truth. If your agent is comparing two products to decide which to recommend, the comparison should be on **(price, updated_at)** pairs, not on price alone. A slightly higher price from a 4-minute-old crawl is more reliable than a slightly lower price from a 9-hour-old crawl.

## What we do internally

We run a rolling 7-day re-crawl on the top 50K merchants. That sounds like a lot, but in practice:

- **Tier 1 (Shopee, Lazada, Amazon, Courts, Challenger, Harvey Norman):** every 15–60 minutes.
- **Tier 2 (regional mid-marketplaces, ~5K stores):** every 2–6 hours.
- **Tier 3 (long-tail independent stores, ~45K):** every 6–24 hours.

The tier is set by traffic volume and price-update frequency we measured over the last 90 days. A retailer that updates its price every 5 minutes but only gets 10 clicks a day doesn't need Tier 1 scraping — but a retailer that updates prices nightly and gets 5,000 clicks a day absolutely does.

## A pattern for the agent: surface the age, not just the price

Something we've seen work well in production:

```python
def recommend(products, max_age_seconds=6 * 3600):
    fresh = [p for p in products if age(p["updated_at"]) <= max_age_seconds]
    if not fresh:
        return None  # Don't recommend — we'd be guessing.
    fresh.sort(key=lambda p: p["price"])
    winner = fresh[0]
    return {
        "product_id": winner["product_id"],
        "price": winner["price"],
        "merchant": winner["merchant"],
        "verified_at": winner["updated_at"],
        "freshness": "live" if age(winner["updated_at"]) < 900 else "recent",
    }
```

The agent isn't just reporting the cheapest option — it's reporting the cheapest *still-believed* option. If the search returns nothing fresh enough, the right answer is "I don't have a current price", not the cheapest hallucination.

## What we don't yet do

- **No push-based deltas.** Retailers don't push price changes to us; we pull on a schedule. If Shopee raises a price at 14:00 and our next crawl is 14:47, we serve the old price for 47 minutes.
- **No merchant-reported freshness.** Some merchants publish their own "last updated" headers; we don't currently ingest these. We're starting to in the next quarter.
- **No probabilistic staleness.** A 6-hour-old price at a high-velocity retailer (Shopee flash sales) is riskier than a 6-hour-old price at a slow-moving one (a niche bookstore). We don't model that yet.

We're publishing the freshness conventions publicly so that other teams building shopping agents can adopt the same vocabulary. If your agent says "verified at HH:MM:SSZ", users learn to read that timestamp. If every agent uses a different scheme, the timestamp is just noise.

## Try it

- **Public health (no auth):** `curl https://api.buywhere.ai/health`
- **MCP server:** `npm i -g @buywhere/mcp-server`
- **Source for this article:** [github.com/buywhere/buywhere-mcp](https://github.com/buywhere/buywhere-mcp)
- **Conversation:** drop a comment here — what's your freshness threshold for "good enough" to recommend?

If you're building an agent that needs to *send a user to a real store* — and not invent one — the freshness timestamp is the smallest change that gets you the most reliability.
