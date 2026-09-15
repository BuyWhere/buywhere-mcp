---
title: "BuyWhere MCP directory packet (300M+ products, remote endpoint)"
slug: "buywhere-mcp-directory-packet-300m-products-remote-endpoint-3n54"
tags: "mcp, ai, opensource, api"
domain: "buywhere.hashnode.dev"
canonical: "https://dev.to/buywhere/buywhere-mcp-directory-packet-300m-products-remote-endpoint-3n54"
enableToc: true
subtitle: "Public MCP packet for directory maintainers: remote endpoint, 13 tools, 300M+ products / 150K+ merchants / 9 markets."
seoTitle: "BuyWhere MCP directory packet (300M+ products, remote endpoint)"
seoDescription: "Public MCP packet for directory maintainers: remote endpoint, 13 tools, 300M+ products / 150K+ merchants / 9 markets."
---
BuyWhere is an agent-native product catalog. One MCP endpoint gives shopping agents keyword search over 300M+ products from 150K+ merchants with products across 9 markets.

## Canonical endpoint

- Remote MCP: https://api.buywhere.ai/mcp (HTTP 200, name=buywhere-catalog)
- Site: https://buywhere.ai
- Docs: https://docs.buywhere.ai
- GitHub: https://github.com/BuyWhere/buywhere-mcp
- Smithery listing: https://smithery.ai/servers/partners/BuyWhere
- Glama listing: https://glama.ai/mcp/servers/BuyWhere/buywhere-mcp

Register a key (no email):

```http
POST https://api.buywhere.ai/v1/auth/register
{"agent_name": "your-agent"}
```

Then JSON-RPC against the MCP URL with a Bearer token.

## Tools (v1 + v2)

v1: search_products, get_product, compare_products, get_deals, list_categories, find_best_price, find_similar, ingest_products

v2 (require deliver_to): search_products_v2, get_product_v2, compare_products_v2, get_deals_v2, find_best_price_v2

## Why this post exists

Directory maintainers and agent runtimes keep asking for a single public, copy-paste packet. This is that packet. Claims are limited to 300M+ products, 150K+ merchants with products, and 9 markets.

If you maintain an MCP / AI-tools directory and BuyWhere is missing or stale, use the URLs above — especially the remote endpoint rather than npx @buywhere/mcp-server as the only path.
