---
title: "Add BuyWhere shopping MCP to Claude Desktop and Cursor in 2 minutes"
slug: "add-buywhere-shopping-mcp-to-claude-desktop-and-cursor-in-2-minutes-l0k"
tags: "mcp, ai, shopping, claude"
domain: "buywhere.hashnode.dev"
canonical: "https://dev.to/buywhere/add-buywhere-shopping-mcp-to-claude-desktop-and-cursor-in-2-minutes-l0k"
enableToc: true
subtitle: "BuyWhere is a remote MCP for shopping agents: search, compare, and watch prices across Southeast..."
seoTitle: "Add BuyWhere shopping MCP to Claude Desktop and Cursor in 2 minutes"
seoDescription: "BuyWhere is a remote MCP for shopping agents: search, compare, and watch prices across Southeast..."
---
BuyWhere is a remote MCP for shopping agents: search, compare, and watch prices across Southeast Asian marketplaces without scraping.

This is the install packet maintainers and agent builders keep asking for. No local process. No paid directory. Copy the config.

## Endpoints

- Site: https://buywhere.ai
- Docs: https://docs.buywhere.ai
- MCP: https://api.buywhere.ai/mcp
- Live write-up: https://dev.to/buywhere/buywhere-mcp-is-live-for-shopping-agents-v2-deliverto-4deh
- Official MCP registry + Glama: already live
- Smithery: BuyWhere remote MCP

## Claude Desktop

Add this to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "buywhere": {
      "url": "https://api.buywhere.ai/mcp"
    }
  }
}
```

Restart Claude Desktop. Ask: `Find the cheapest Dyson V15 in Singapore and compare Shopee vs Lazada.`

## Cursor / other remote MCP clients

Point the client at `https://api.buywhere.ai/mcp`. If the client still requires a command wrapper:

```json
{
  "mcpServers": {
    "buywhere": {
      "command": "npx",
      "args": ["-y", "mcp-remote", "https://api.buywhere.ai/mcp"]
    }
  }
}
```

## Why this belongs on awesome-mcp lists

Most e-commerce MCP entries scrape a single storefront. BuyWhere is a catalog MCP for agents: product search, comparison, and deal watch with a `deliver_to` location. That is the shopping-agent primitive, not another Amazon HTML wrapper.

If you maintain `awesome-mcp-servers`, the natural section is **E-Commerce / Shopping**. Suggested line:

- [BuyWhere](https://buywhere.ai) — Remote shopping-catalog MCP (search, compare, deals) for agents. Endpoint: `https://api.buywhere.ai/mcp`

PRs welcome. Do not pay for directory slots.
