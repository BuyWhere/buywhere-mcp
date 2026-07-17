---
title: "Build an AI Shopping Agent with OpenAI Agents SDK + BuyWhere MCP"
slug: "build-an-ai-shopping-agent-with-openai-agents-sdk-buywhere-mcp-1ci0"
tags: "openai, agentsdk, mcp, tutorial"
domain: "buywhere.hashnode.dev"
canonical: "https://dev.to/buywhere/build-an-ai-shopping-agent-with-openai-agents-sdk-buywhere-mcp-1ci0"
enableToc: true
subtitle: "Step-by-step tutorial showing how to build a powerful AI shopping agent using OpenAI's Agents SDK and BuyWhere's MCP server for real-time product search and price comparison."
seoTitle: "Build an AI Shopping Agent with OpenAI Agents SDK + BuyWhere MCP"
seoDescription: "Step-by-step tutorial showing how to build a powerful AI shopping agent using OpenAI's Agents SDK and BuyWhere's MCP server for real-time product search and price comparison."
---
In this tutorial, you'll build an AI shopping agent that searches products, compares prices across retailers, and finds deals — all using natural language. We'll use:

- **OpenAI Agents SDK** — the official framework for building agentic AI apps
- **BuyWhere MCP Server** — a Model Context Protocol server that provides real-time product search and price comparison across 50M+ products

## Prerequisites

- Node.js 18+
- An OpenAI API key (with access to the Agents SDK)
- A BuyWhere API key (free at https://buywhere.ai)

## Step 1: Set up the project

```bash
mkdir shopping-agent
cd shopping-agent
npm init -y
npm install openai-agents @buywhere/mcp-server
```

## Step 2: Configure environment

Create a `.env` file:

```properties
OPENAI_API_KEY=sk-...
BUYWHERE_API_KEY=bw_...
```

## Step 3: Create the shopping agent

Create `index.ts`:

```typescript
import { Agent, Runner } from "openai-agents";
import { createBuyWhereMCPServer } from "@buywhere/mcp-server";
import dotenv from "dotenv";

dotenv.config();

async function main() {
  // Connect BuyWhere MCP as a tool for the agent
  const buywhere = await createBuyWhereMCPServer({
    apiKey: process.env.BUYWHERE_API_KEY!,
  });

  const agent = new Agent({
    name: "Shopping Agent",
    instructions: `You are a helpful shopping assistant. Use the BuyWhere 
      MCP tools to search for products, compare prices, and find deals. 
      Always show prices in SGD and include the retailer name.`,
    tools: [...buywhere.getTools()],
  });

  const result = await Runner.run(agent, {
    input: "Find the best price for Sony WH-1000XM6 headphones in Singapore",
  });

  console.log(result.output);
}

main().catch(console.error);
```

## Step 4: Run it

```bash
npx tsx index.ts
```

Example output:
```markdown
Here are the best prices for Sony WH-1000XM6 headphones in Singapore:

1. **Amazon SG** — SGD 398 (free shipping)
2. **Shopee SG** — SGD 429 (with voucher: SGD 399)
3. **Lazada SG** — SGD 449 (Lazada Bonus: SGD 419)
4. **Challenger** — SGD 459

**Best deal:** Amazon SG at SGD 398 — save SGD 61 vs retail price.
```

## How It Works

The OpenAI Agents SDK manages the agent lifecycle — reasoning, tool selection, and response generation. BuyWhere MCP provides the product data layer:

1. User asks a natural language question
2. The agent decides which BuyWhere tool to call
3. BuyWhere searches across retailers and returns structured product data
4. The agent synthesizes the results into a human-readable answer

## Going Further

Add more capabilities:

```typescript
// Price drop alerts
agent.addTool({
  name: "track_price",
  description: "Track price changes for a product",
  parameters: {
    productUrl: { type: "string" },
    targetPrice: { type: "number" },
  },
  execute: async ({ productUrl, targetPrice }) => {
    return buywhere.createPriceAlert(productUrl, targetPrice);
  },
});
```

## Resources

- [OpenAI Agents SDK docs](https://openai.github.io/openai-agents-python/) (Python) / [TypeScript SDK](https://github.com/openai/openai-agents-node)
- [BuyWhere MCP Server on npm](https://www.npmjs.com/package/@buywhere/mcp-server)
- [BuyWhere API docs](https://buywhere.ai/docs)

---

*BuyWhere — Compare prices across 20+ retailers. Save money. Shop smarter.*
