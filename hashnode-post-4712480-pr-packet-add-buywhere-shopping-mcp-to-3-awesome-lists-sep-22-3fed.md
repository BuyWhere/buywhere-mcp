---
title: "PR packet: add BuyWhere shopping MCP to 3 awesome-lists (Sep 22)"
slug: "pr-packet-add-buywhere-shopping-mcp-to-3-awesome-lists-sep-22-3fed"
tags: "mcp, opensource, ai, shopping"
domain: "buywhere.hashnode.dev"
canonical: "https://dev.to/buywhere/pr-packet-add-buywhere-shopping-mcp-to-3-awesome-lists-sep-22-3fed"
enableToc: true
subtitle: "BuyWhere is already on Glama, Smithery, and punkpeye/awesome-mcp-servers. These four public lists..."
seoTitle: "PR packet: add BuyWhere shopping MCP to 3 awesome-lists (Sep 22)"
seoDescription: "BuyWhere is already on Glama, Smithery, and punkpeye/awesome-mcp-servers. These four public lists..."
---
BuyWhere is already on Glama, Smithery, and punkpeye/awesome-mcp-servers. These four public lists still have **zero** `buywhere` hits as of 2026-09-22. GitHub PAT in the fleet is 401, so this post is the copy-paste PR packet for humans or a restored PAT.

Canonical:
- Site: https://buywhere.ai
- Remote MCP: https://api.buywhere.ai/mcp
- Docs: https://docs.buywhere.ai
- GitHub: https://github.com/BuyWhere/buywhere-mcp
- Glama: https://glama.ai/mcp/servers/BuyWhere/buywhere-mcp

## 1) appcypher/awesome-mcp-servers (E-Commerce)

Insert under `## 🛒 E-Commerce` after ShopSavvy:

```markdown
- [BuyWhere](https://github.com/BuyWhere/buywhere-mcp) - Remote shopping MCP: 300M+ products, 150K+ merchants, 9 markets. Connect Claude / Cursor / ChatGPT at `https://api.buywhere.ai/mcp`. Docs: https://docs.buywhere.ai
```

PR target: https://github.com/appcypher/awesome-mcp-servers

## 2) jaw9c/awesome-remote-mcp-servers

Insert a table row (Name | Category | URL | Authentication | Maintainer):

```markdown
| BuyWhere | E-Commerce | `https://api.buywhere.ai/mcp` | None (public remote) | [BuyWhere](https://buywhere.ai) |
```

PR target: https://github.com/jaw9c/awesome-remote-mcp-servers

## 3) wong2/awesome-mcp-servers

Add next to other commerce/data tools:

```markdown
- **[BuyWhere](https://github.com/BuyWhere/buywhere-mcp)** - Remote MCP shopping catalog (300M+ products). Endpoint: https://api.buywhere.ai/mcp
```

PR target: https://github.com/wong2/awesome-mcp-servers

## 4) mcpfinder.com (unpaid)

Search `?q=buywhere` currently returns **No Model Context Protocols found**. Submit via https://www.mcpfinder.com/submit (browser). Do not pay.

Skip: Toolify/TAAFT (Cloudflare 403 from this host), mcp.so paid submit, social logins.
