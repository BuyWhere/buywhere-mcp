# buywhere-mcp

[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![npm](https://img.shields.io/npm/v/buywhere-mcp)](https://www.npmjs.com/package/buywhere-mcp)

MCP server for the [BuyWhere](https://buywhere.ai) product catalog. Lets Claude Desktop, Cursor, Windsurf, and other MCP-compatible agents search and retrieve products without writing any HTTP code.

## Setup

### 1. Get your API key

Sign up at [buywhere.ai/dashboard](https://buywhere.ai/dashboard) and copy your API key.

### 2. Configure your client

#### Claude Desktop

Open `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) or `%APPDATA%\Claude\claude_desktop_config.json` (Windows) and add:

```json
{
  "mcpServers": {
    "buywhere": {
      "command": "npx",
      "args": ["-y", "buywhere-mcp"],
      "env": {
        "BUYWHERE_API_KEY": "your_api_key_here"
      }
    }
  }
}
```

#### Cursor

Open **Settings → MCP** and add a new server, or edit `~/.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "buywhere": {
      "command": "npx",
      "args": ["-y", "buywhere-mcp"],
      "env": {
        "BUYWHERE_API_KEY": "your_api_key_here"
      }
    }
  }
}
```

#### Remote / Streamable HTTP

BuyWhere also exposes a hosted MCP endpoint for agents that support remote connections:

```
https://api.buywhere.ai/mcp
```

Requires `Authorization: Bearer <your-api-key>` header.

---

## Tools

| Tool | Description |
|------|-------------|
| `search_products` | Search by keyword or natural language |
| `get_product` | Fetch full details for a single product |
| `get_price` | Compare prices across all merchants |
| `compare_prices` | Side-by-side comparison of 2–5 products |
| `get_affiliate_link` | Get click-tracked affiliate URL |
| `get_catalog` | List available product categories |

## Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `BUYWHERE_API_KEY` | yes | Your BuyWhere API key |
| `BUYWHERE_API_URL` | no | Override base URL (default: `https://api.buywhere.ai`) |

## Development

```bash
npm install
npm run build
BUYWHERE_API_KEY=your_key node dist/index.js
```

## License

MIT

