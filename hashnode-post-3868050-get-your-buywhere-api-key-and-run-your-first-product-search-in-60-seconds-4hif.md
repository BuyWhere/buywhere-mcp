---
title: "Get your BuyWhere API key and run your first product search in 60 seconds"
slug: "get-your-buywhere-api-key-and-run-your-first-product-search-in-60-seconds-4hif"
tags: "mcp, api, aiagents, developer"
domain: "buywhere.hashnode.dev"
canonical: "https://dev.to/buywhere/get-your-buywhere-api-key-and-run-your-first-product-search-in-60-seconds-4hif"
enableToc: true
subtitle: "Get your BuyWhere API key and run your first product search in 60 seconds   BuyWhere gives..."
seoTitle: "Get your BuyWhere API key and run your first product search in 60 seconds"
seoDescription: "Get your BuyWhere API key and run your first product search in 60 seconds   BuyWhere gives..."
---
# Get your BuyWhere API key and run your first product search in 60 seconds

BuyWhere gives AI agents real-time access to prices, availability, and product data across thousands of merchants. As of this week, the self-serve developer API is live — you can get your key and make your first query in under a minute.

## Step 1: Request your API key

Go to [buywhere.ai/api-keys](https://buywhere.ai/api-keys), enter your email, and submit. You'll receive your key immediately on the page and by email.

No waitlist. No approval required.

## Step 2: Make your first query

```bash
curl -X POST https://api.buywhere.ai/v1/search \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"query": "noise-cancelling headphones under $200", "country": "SG"}'
```

You'll get back structured product results: name, price, merchant, availability, and URL.

## Step 3: Add BuyWhere to your AI agent

### With CrewAI

```python
from crewai_tools import MCPServerAdapter

buywhere_tool = MCPServerAdapter(
    server_params={
        "command": "npx",
        "args": ["-y", "@buywhere/mcp-server"],
        "env": {"BUYWHERE_API_KEY": "YOUR_API_KEY"}
    }
)
```

### With Mastra

```typescript
import { createMCPClient } from "@mastra/mcp";

const buywhere = createMCPClient({
  transport: {
    type: "stdio",
    command: "npx",
    args: ["-y", "@buywhere/mcp-server"],
    env: { BUYWHERE_API_KEY: "YOUR_API_KEY" }
  }
});
```

### With Claude Desktop

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "buywhere": {
      "command": "npx",
      "args": ["-y", "@buywhere/mcp-server"],
      "env": { "BUYWHERE_API_KEY": "YOUR_API_KEY" }
    }
  }
}
```

## What you can query

- **Product search**: natural language queries, filtered by country and price range
- **Price comparison**: compare the same product across merchants
- **Availability check**: real-time in-stock status
- **Merchant lookup**: find which merchants carry a specific product

## Why developers are using BuyWhere

AI agents need real-world data to be useful to shoppers. BuyWhere connects agents to live merchant inventory — no scraping, no rate-limiting headaches, no stale data.

The MCP server exposes clean tool definitions that LLMs understand natively. Your agent can answer "where can I buy X for the best price?" with a single tool call.

## Get started now

1. [Request your API key →](https://buywhere.ai/api-keys)
2. Install the MCP server: `npm install -g @buywhere/mcp-server`
3. Drop the config into your agent framework of choice

Questions? Join the discussion in [r/MCP](https://reddit.com/r/mcp) or open an issue at [github.com/BuyWhere/buywhere-mcp](https://github.com/BuyWhere/buywhere-mcp).
