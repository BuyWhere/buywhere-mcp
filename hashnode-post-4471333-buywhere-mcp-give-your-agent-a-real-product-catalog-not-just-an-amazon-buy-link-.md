---
title: "BuyWhere MCP — give your agent a real product catalog, not just an Amazon buy link"
slug: "buywhere-mcp-give-your-agent-a-real-product-catalog-not-just-an-amazon-buy-link-300a"
tags: "mcp, ai, opensource, webdev"
domain: "buywhere.hashnode.dev"
canonical: "https://dev.to/buywhere/buywhere-mcp-give-your-agent-a-real-product-catalog-not-just-an-amazon-buy-link-300a"
enableToc: true
subtitle: "If you're building an AI agent that needs to shop — not just pick the first Amazon result — there's a..."
seoTitle: "BuyWhere MCP — give your agent a real product catalog, not just an Amazon buy link"
seoDescription: "If you're building an AI agent that needs to shop — not just pick the first Amazon result — there's a..."
---
If you're building an AI agent that needs to *shop* — not just pick the first Amazon result — there's a missing leg in most stacks today: a real, live, cross-merchant product catalog.

**The two legs of agentic commerce**

Most agent-shopping MCPs today (Agent Rails, WEM Price Compare, Nexez Agentic Commerce, etc.) solve the *buy-link* leg: take a query, return a buyable URL. That's great for the last hop.

What's harder is the *catalog/search* leg:

- find the same SKU across 10+ merchants in 12+ countries
- compare prices in real currency
- spot in-stock vs out-of-stock
- handle the case where "iPhone 17" means 4 different SKUs

That's what **BuyWhere** does. It's a live product catalog and comparison MCP, already exposed both as an MCP server (`buywhere-mcp`) and as a plain REST surface.

**What you can hand back to your agent today**

The canonical entry point for agents is the compare surface, which returns `{ merchant, price, currency, url, in_stock }` rows. A few live examples:

- Laptops — https://buywhere.ai/compare?p=laptop&from=dev-community
- Headphones — https://buywhere.ai/compare?p=headphones&from=dev-community
- iPhone — https://buywhere.ai/compare?p=iphone&from=dev-community
- iPhone 17 — https://buywhere.ai/compare?p=iphone-17&from=dev-community
- MacBook Air M3 — https://buywhere.ai/compare?p=macbook-air-m3&from=dev-community

Each `?p=<slug>` maps to a deduplicated cross-merchant comparison. Behind the scenes we serve results from a real catalog (live merchants, refreshed pricing, not affiliate feeds).

**Drop-in pattern for an MCP agent**

If your agent has access to the MCP transport, the server entry is in the official registry as `buywhere-mcp`. If it only speaks HTTP, you can hit the compare endpoint directly — same schema.

A typical agent flow:

1. User asks: "find me the cheapest in-stock iPhone 17 with at least 256GB in Singapore."
2. Agent calls `buywhere.compare(p="iphone-17", country="sg", min_storage_gb=256)`.
3. Agent receives a sorted list of `(merchant, price_sgd, url, in_stock)` rows.
4. Agent hands the top row back to the user, *or* hands it to a buy-link MCP (Agent Rails / WEM / etc.) to complete the purchase.

That second hop is where most agent-shopping stacks are already wired. BuyWhere is just the missing first hop.

**Why this matters now**

A lot of "agent shopping" demos today default to one merchant because the catalog leg is genuinely hard. We already do it for ~12 countries (SG/MY/HK/ID/PH/TH/VN/JP/KR/TW/AU/US at varied coverage), and we're exposing it through MCP precisely so agent frameworks don't have to maintain their own scrapers.

If you're maintaining one of the buy-link MCPs above (or building a new agent-shopping stack), happy to coordinate on a shared comparison schema so we don't fragment the agent ecosystem.

**Links**

- MCP repo: https://github.com/BuyWhere/buywhere-mcp
- Compare surface: https://buywhere.ai/compare?p=laptop&from=dev-community
- Example write-up (12-country price comparison): https://buywhere.ai/blog/cheapest-macbook-air-m3-12-countries-compared
- iPhone upgrade trade-off: https://buywhere.ai/blog/iphone-16-vs-iphone-17-upgrade-worth-it-2026

Drop a comment if you'd like to coordinate on schema or wiring.
