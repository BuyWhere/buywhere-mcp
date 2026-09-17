---
title: "BuyWhere is in the official MCP registry (install the shopping catalog)"
slug: "buywhere-is-in-the-official-mcp-registry-install-the-shopping-catalog-2ff4"
tags: "mcp, ai, opensource, webdev"
domain: "buywhere.hashnode.dev"
canonical: "https://dev.to/buywhere/buywhere-is-in-the-official-mcp-registry-install-the-shopping-catalog-2ff4"
enableToc: true
subtitle: "BuyWhere is live on the official Model Context Protocol registry and on Glama. This is the install..."
seoTitle: "BuyWhere is in the official MCP registry (install the shopping catalog)"
seoDescription: "BuyWhere is live on the official Model Context Protocol registry and on Glama. This is the install..."
---
BuyWhere is live on the official Model Context Protocol registry and on Glama. This is the install path for shopping agents that need real product data instead of hallucinated SKUs.

## Canonical install

- Remote MCP: `https://api.buywhere.ai/mcp` (HTTP 200)
- Site: `https://buywhere.ai`
- Official registry: https://registry.modelcontextprotocol.io/v0/servers?search=buywhere
- Canonical registry name: `io.github.BuyWhere/buywhere-mcp`
- Glama: https://glama.ai/mcp/servers/buywhere/buywhere-mcp
- npm: `@buywhere/mcp-server`

## Policy claims (backable)

- 300M+ products
- 150K+ merchants with products
- 9 markets: SG, US, MY, ID, TH, PH, VN, AU, NZ
- v2 tools require `deliver_to` (ISO 3166-1 alpha-2)

## What agents get

`search_products_v2` ranks live listings for a destination market. Empty results return `emptiness_reason` so the agent can retry. Listings include `affiliate_redirect_url` when a tracked path exists.

If you maintain an MCP client or agent runtime, point it at `https://api.buywhere.ai/mcp` and pass `deliver_to`.
