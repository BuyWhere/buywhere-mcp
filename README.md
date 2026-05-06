# @buywhere/mcp-server

[![npm version](https://img.shields.io/npm/v/@buywhere/mcp-server.svg)](https://www.npmjs.com/package/@buywhere/mcp-server)
[![npm downloads](https://img.shields.io/npm/dm/@buywhere/mcp-server.svg)](https://www.npmjs.com/package/@buywhere/mcp-server)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**Cross-border product catalog for AI agents.** Search and compare products from Singapore, SEA, and US markets via [Model Context Protocol](https://modelcontextprotocol.io).

Works with Claude Desktop, Cursor, VS Code Copilot, Cline, OpenCode, Codex, and any MCP-compatible client.

## Quick Start

```bash
export BUYWHERE_API_KEY=bw_live_xxxx
npx -y @buywhere/mcp-server
```

Get your free API key: [buywhere.ai/api-keys](https://buywhere.ai/api-keys)

## What You Can Do

| Tool | Description |
|------|-------------|
| `search_products` | Search catalog by keyword, category, price, region |
| `get_product` | Full product details by ID (prices, specs, images) |
| `compare_products` | Side-by-side comparison of 2-5 products |
| `get_deals` | Current price drops and promotions across markets |
| `list_categories` | Available product category taxonomy |

## Use Cases

**For AI agents**: Enable your agent to search, compare, and recommend products across Singapore, Southeast Asia, and US markets in real time.

**For developers**: Add cross-border shopping capability to any MCP-compatible app. No API integration needed — just add the server config.

**For price comparison**: Get multi-market pricing in a single query. Compare Lazada, Shopee, Amazon, and local retailer prices through one interface.

## Setup

Add to your MCP client config (`claude_desktop_config.json`, `.cursor/mcp.json`, etc.):

```json
{
  "mcpServers": {
    "buywhere": {
      "command": "npx",
      "args": ["-y", "@buywhere/mcp-server"],
      "env": {
        "BUYWHERE_API_KEY": "bw_live_xxxx"
      }
    }
  }
}
```

## Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `BUYWHERE_API_KEY` | (required) | Your API key from [buywhere.ai/api-keys](https://buywhere.ai/api-keys) |
| `BUYWHERE_API_URL` | `https://api.buywhere.ai/mcp` | Custom API base URL |

## Markets

| Market | Currency |
|--------|----------|
| Singapore | SGD |
| United States | USD |
| Japan | JPY |
| South Korea | KRW |
| China | CNY |
| Australia | AUD |

## MCP Directory Listings

BuyWhere is listed on these MCP directories:

- [Glama](https://glama.ai/mcp/servers/BuyWhere/buywhere-mcp) — 22,918 servers
- [Smithery](https://smithery.ai/server/@buywhere/mcp-server)
- [MCP.so](https://mcp.so/server/@buywhere/mcp-server)

## Tutorials & Guides

Complete tutorials for building AI shopping agents:

- **[Complete Guide to AI Agent Commerce](https://buywhere.hashnode.dev/buywhere-mcp-complete-guide-ai-agent-commerce)** — Start here
- **[MCP for Ecommerce Part 1](https://buywhere.hashnode.dev/mcp-for-ecommerce-the-missing-infrastructure-layer-for-ai-agent-shopping)** — The infrastructure argument
- **[MCP for Ecommerce Part 2](https://buywhere.hashnode.dev/mcp-for-ecommerce-part-2-build-a-real-shopping-agent-in-15-minutes-1)** — Build a real shopping agent in 15 minutes
- **[Cross-Border Price Comparison](https://buywhere.hashnode.dev/build-a-cross-border-price-comparison-agent-in-10-minutes-with-buywhere-mcp-1)** — Compare across 6 markets
- **[30-Second Quick Start](https://buywhere.hashnode.dev/what-if-your-ai-agent-could-shop-for-you-try-this-in-30-seconds)** — One command
- **[Build With BuyWhere Challenge](https://buywhere.hashnode.dev/build-an-ai-shopping-agent-in-1-hour-win-api-credits-get-featured)** — Win API credits

Full blog: [buywhere.hashnode.dev](https://buywhere.hashnode.dev)

## Development

```bash
git clone https://github.com/BuyWhere/buywhere-mcp.git
cd buywhere-mcp
npm install
npm run build
npm start
```

## Why BuyWhere?

BuyWhere is the first cross-border product catalog API built for AI agents. We aggregate products from Singapore, Southeast Asia, and US markets into a single, agent-friendly interface.

- **One API** — all markets, all retailers
- **Agent-native** — built for MCP from day one
- **Real-time** — live pricing and availability
- **Developer-first** — no SDK needed, just add the server

## License

MIT
