# BuyWhere MCP Server

[![Product Hunt](https://img.shields.io/badge/Product%20Hunt-Launched%20May%206-%23DA552E?logo=producthunt&logOColor=white)](https://www.producthunt.com/posts/buywhere-mcp-server)
[![npm version](https://img.shields.io/npm/v/@buywhere/mcp-server.svg)](https://www.npmjs.com/package/@buywhere/mcp-server)
[![npm downloads](https://img.shields.io/npm/dm/@buywhere/mcp-server.svg)](https://www.npmjs.com/package/@buywhere/mcp-server)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![GitHub stars](https://img.shields.io/github/stars/BuyWhere/buywhere-mcp?style=social)](https://github.com/BuyWhere/buywhere-mcp)
[![Smithery](https://smithery.ai/badge/@BuyWhere/buywhere-mcp)](https://smithery.ai/server/@BuyWhere/buywhere-mcp)
[![MCP Registry](https://img.shields.io/badge/MCP%20Registry-published-blue)](https://github.com/modelcontextprotocol/registry)

---

## Build With BuyWhere Challenge

**$5,000 in prizes — Build AI agents that shop smarter**

Join the "Build With BuyWhere" AI Agent Developer Challenge! Use the BuyWhere MCP server to create AI agents that search, compare, and recommend products across Singapore, SEA, and US markets.

- **Prize pool:** $5,000 USD
- **Deadline:** June 30, 2026
- **Challenge page:** [buywhere.ai/challenge](https://buywhere.ai/challenge)

Build a shopping agent, price comparison tool, deal finder, or any creative AI agent use case. Winners get cash prizes and featured promotion on BuyWhere channels.

---

Product search API for AI agents via [Model Context Protocol](https://modelcontextprotocol.io). Search & compare 11M+ products across Singapore, SEA, and US markets — built for AI agent commerce, not store management.

Works with Claude Desktop, Cursor, VS Code Copilot, Cline, OpenCode, Codex, and any MCP-compatible client.

---

## Demo

![BuyWhere MCP in Claude Desktop](https://raw.githubusercontent.com/BuyWhere/buywhere-mcp/main/public/assets/demo/buywhere-mcp-claude-desktop.gif)

*44-second demo: product search, deal discovery, price comparison, and multi-region support.*

```text
User:   "Find me wireless earbuds under $50 available in Singapore"
Agent:  [calls search_products → returns 5 matching products]

User:   "Compare the top 3"
Agent:  [calls compare_prices → side-by-side with best-value pick]
```

## Quick Start

```bash
export BUYWHERE_API_KEY=bw_live_xxxx
npx -y @buywhere/mcp-server
```

Get your free API key → [buywhere.ai/api-keys](https://buywhere.ai/api-keys)

## Tutorials

- **[Part 1: MCP for Ecommerce — The Missing Infrastructure Layer for AI Agent Shopping](https://dev.to/buywhere/mcp-for-ecommerce-the-missing-infrastructure-layer-for-ai-agent-shopping-1i7d)** — Understanding the architecture and why agents need a product catalog API
- **[Part 2: Build a Real Shopping Agent in 15 Minutes](https://dev.to/buywhere/mcp-for-ecommerce-part-2-build-a-real-shopping-agent-in-15-minutes-4f5b)** — Hands-on tutorial: set up the MCP server, search products, compare prices, build a working agent

## Tools

| Tool | Description |
|------|-------------|
| `search_products` | Search catalog by keyword, category, price, region |
| `get_product` | Full product details by ID (prices, specs, images) |
| `compare_prices` | Side-by-side comparison of 2–5 products |
| `get_price` | Current prices across all merchants for one product |
| `get_affiliate_link` | Click-tracked affiliate URL for a product |
| `get_catalog` | Available product category taxonomy |

## Use Cases

- **AI agents** — search, compare, and recommend products across Singapore, SEA, and US markets in real time
- **Developers** — add cross-border shopping capability to any MCP-compatible app with zero API integration
- **Price comparison** — get multi-market pricing in a single query across Lazada, Shopee, Amazon, and local retailers

## Quick Setup

### Claude Desktop

Add to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "buywhere": {
      "command": "npx",
      "args": ["-y", "@buywhere/mcp-server"],
      "env": { "BUYWHERE_API_KEY": "bw_live_xxxx" }
    }
  }
}
```

### Cursor / VS Code / Cline

Same config — add to your MCP settings file:

```json
{
  "mcpServers": {
    "buywhere": {
      "command": "npx",
      "args": ["-y", "@buywhere/mcp-server"],
      "env": { "BUYWHERE_API_KEY": "bw_live_xxxx" }
    }
  }
}
```

## Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `BUYWHERE_API_KEY` | (required) | API key from [buywhere.ai/api-keys](https://buywhere.ai/api-keys) |
| `BUYWHERE_API_URL` | `https://api.buywhere.ai/mcp` | Custom API base URL |

## Install

```bash
# Run directly (no install)
npx -y @buywhere/mcp-server

# Install globally
npm install -g @buywhere/mcp-server
buywhere-mcp
```

## Development

```bash
git clone https://github.com/BuyWhere/buywhere-mcp.git
cd buywhere-mcp
npm install
npm run build
npm start
```

## Why BuyWhere?

BuyWhere is a product search API for AI agents. We aggregate 11M+ products from Singapore, Southeast Asia, and US markets into a single, agent-friendly interface — no store management, no Shopify integration. Just search and compare products in real time.

- **One API** — all markets, all retailers
- **Agent-native** — built for MCP from day one
- **Real-time** — live pricing and availability
- **Developer-first** — no SDK needed, just add the server

## A2A Protocol

BuyWhere also supports the [Agent-to-Agent (A2A)](https://github.com/google/A2A) protocol for multi-agent task delegation. View our Agent Card at `/.well-known/agent.json`.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for how to report issues, submit PRs, and suggest features.

## Support

If you find this project useful:

- ⭐ **Star the repo** — it helps others discover BuyWhere
- 🐛 [Open an issue](https://github.com/BuyWhere/buywhere-mcp/issues/new) for bugs or feature requests
- 💬 [Start a discussion](https://github.com/BuyWhere/buywhere-mcp/discussions) for questions or ideas
- 📣 Share it with other developers who build AI agent tools

## License

MIT
