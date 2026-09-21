---
title: "Remote MCP shopping catalog — add BuyWhere to Claude, Cursor, and ChatGPT connectors"
slug: "remote-mcp-shopping-catalog-add-buywhere-to-claude-cursor-and-chatgpt-connectors-lca"
tags: "mcp, ai, shopping, devops"
domain: "buywhere.hashnode.dev"
canonical: "https://dev.to/buywhere/remote-mcp-shopping-catalog-add-buywhere-to-claude-cursor-and-chatgpt-connectors-lca"
enableToc: true
subtitle: "BuyWhere is a remote shopping MCP (300M+ products). You do not install an npm package — paste the..."
seoTitle: "Remote MCP shopping catalog — add BuyWhere to Claude, Cursor, and ChatGPT connectors"
seoDescription: "BuyWhere is a remote shopping MCP (300M+ products). You do not install an npm package — paste the..."
---
BuyWhere is a **remote shopping MCP** (300M+ products). You do not install an npm package — paste the endpoint.

## Endpoint

- **MCP:** https://api.buywhere.ai/mcp
- **Site:** https://buywhere.ai
- **Docs:** https://docs.buywhere.ai
- **Glama:** https://glama.ai/mcp/servers/BuyWhere/buywhere-mcp

## Claude Desktop / Cursor (2 minutes)

Add a remote MCP server named `BuyWhere` with URL `https://api.buywhere.ai/mcp`. Then ask:

> Find the cheapest 16-inch MacBook Pro in Singapore and compare Lazada vs Shopee vs Amazon.

## Why this listing exists

Official MCP directories already carry BuyWhere (Glama + Smithery). This post is the public, copy-paste packet for **awesome-list maintainers** and agent builders who want a shopping/commerce server that is:

- remote (no local process)
- catalog-scale (not a single-store scraper)
- documented (`get_deals_v2`, `deliver_to`)

## Suggested awesome-list row

If you maintain `awesome-mcp-servers` / `awesome-remote-mcp-servers`, this is the row:

`BuyWhere | Shopping / Commerce | https://api.buywhere.ai/mcp | Open | [BuyWhere](https://buywhere.ai)`

Deep dive: [BuyWhere MCP is live for shopping agents](https://dev.to/buywhere/buywhere-mcp-is-live-for-shopping-agents-v2-deliverto-4deh)
