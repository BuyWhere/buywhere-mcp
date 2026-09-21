---
title: "Copy-paste: add BuyWhere shopping MCP to awesome-mcp-servers lists"
slug: "copy-paste-add-buywhere-shopping-mcp-to-awesome-mcp-servers-lists-16hg"
tags: "mcp, ai, shopping, opensource"
domain: "buywhere.hashnode.dev"
canonical: "https://dev.to/buywhere/copy-paste-add-buywhere-shopping-mcp-to-awesome-mcp-servers-lists-16hg"
enableToc: true
subtitle: "BuyWhere is a remote shopping MCP (300M+ products). No npm install — paste the endpoint into Claude,..."
seoTitle: "Copy-paste: add BuyWhere shopping MCP to awesome-mcp-servers lists"
seoDescription: "BuyWhere is a remote shopping MCP (300M+ products). No npm install — paste the endpoint into Claude,..."
---
BuyWhere is a **remote** shopping MCP (300M+ products). No npm install — paste the endpoint into Claude, Cursor, or ChatGPT connectors.

## Canonical listing packet

- **Name:** BuyWhere
- **Site:** https://buywhere.ai
- **MCP:** https://api.buywhere.ai/mcp
- **Docs:** https://docs.buywhere.ai
- **Glama (live):** https://glama.ai/mcp/servers/BuyWhere/buywhere-mcp
- **Walkthrough:** https://dev.to/buywhere/buywhere-mcp-is-live-for-shopping-agents-v2-deliverto-4deh

## Suggested README row (awesome-mcp-servers)

```markdown
- [BuyWhere](https://github.com/BuyWhere/buywhere-mcp) - Remote shopping catalog MCP (300M+ products, Singapore + SEA). Endpoint: `https://api.buywhere.ai/mcp`.
```

## Lists that should include a shopping / commerce MCP

If you maintain one of these, a one-line PR helps agents find a real catalog:

1. [punkpeye/awesome-mcp-servers](https://github.com/punkpeye/awesome-mcp-servers)
2. [wong2/awesome-mcp-servers](https://github.com/wong2/awesome-mcp-servers)
3. [appcypher/awesome-mcp-servers](https://github.com/appcypher/awesome-mcp-servers)
4. [jaw9c/awesome-remote-mcp-servers](https://github.com/jaw9c/awesome-remote-mcp-servers)

Remote-only lists: use the endpoint `https://api.buywhere.ai/mcp` (HTTP MCP, not a local stdio binary).

## 60-second Claude Desktop config

```json
{
  "mcpServers": {
    "buywhere": {
      "url": "https://api.buywhere.ai/mcp"
    }
  }
}
```

Then ask: *Find the cheapest 16-inch laptop in Singapore under $2000 and show two merchants.*

Questions: https://docs.buywhere.ai
