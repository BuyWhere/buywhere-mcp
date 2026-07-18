---
title: "Build a Price Comparison Agent with BuyWhere + LlamaIndex"
slug: "build-a-price-comparison-agent-with-buywhere-llamaindex-1ddf"
tags: "llamaindex, ai, mcp, ecommerce"
domain: "buywhere.hashnode.dev"
canonical: "https://dev.to/buywhere/build-a-price-comparison-agent-with-buywhere-llamaindex-1ddf"
enableToc: true
subtitle: "How to integrate BuyWhere as a LlamaIndex tool so your AI agents can query structured price comparisons across 9 countries."
seoTitle: "Build a Price Comparison Agent with BuyWhere + LlamaIndex"
seoDescription: "How to integrate BuyWhere as a LlamaIndex tool so your AI agents can query structured price comparisons across 9 countries."
---
## Build a Price Comparison Agent with BuyWhere + LlamaIndex

If you're building AI agents with LlamaIndex, your agents can now query BuyWhere for structured price comparisons across 9 countries and get back JSON that's ready for downstream processing.

**Use case:** An agent that helps users find the best deal on a laptop, then routes them to the retailer with checkout context pre-filled.

## The Integration

The integration is simple — wrap BuyWhere's search endpoint as a LlamaIndex `FunctionTool`:

```python
from llama_index.core.tools import FunctionTool
import requests

def buywhere_search(product: str) -> dict:
    response = requests.get(
        f"https://buywhere.ai/api/search?q={product}"
    )
    return response.json()

price_tool = FunctionTool.from_defaults(
    fn=buywhere_search,
    description="Search BuyWhere for product prices across 9 countries"
)
```

That's it — your LlamaIndex agent can now search for prices, compare across markets, and make recommendations backed by real-time data.

## What BuyWhere Returns

Each search returns a standardized product schema:

```json
{
  "title": "MacBook Air M4 13-inch",
  "brand": "Apple",
  "price": 1299.00,
  "currency": "SGD",
  "merchant": "Lazada",
  "country": "SG",
  "in_stock": true,
  "url": "https://..."
}
```

Your agent gets structured data it can reason about — no HTML scraping, no regex parsing.

## Why This Matters for Agentic Commerce

The missing piece for most AI shopping agents is reliable, structured product data. BuyWhere provides:

- **11M+ products** across Singapore, Southeast Asia, and US markets
- **Standardized schema** — title, brand, GTIN, price, currency, stock, merchant
- **Sub-second latency** — your agent doesn't wait
- **Free tier** — 1,000 API calls/month, no credit card

## Getting Started

1. Get an API key at [buywhere.ai/api-keys](https://buywhere.ai/api-keys)
2. Install LlamaIndex: `pip install llama-index`
3. Wrap the API call as shown above
4. Add it to your agent's tool list

Or use the MCP server directly:

```bash
npx @buywhere/mcp-server --api-key YOUR_KEY
```

## What's Next

We're seeing early adopters build:

- **Deal-finding agents** that compare prices across 3+ retailers in real-time
- **Procurement copilots** that source the cheapest supplier for B2B orders
- **Price monitoring agents** that alert when a target price is hit

If you're building something similar, we'd love to hear about it.

---

*BuyWhere is an open-source price comparison API for AI agents. [GitHub](https://github.com/BuyWhere/buywhere-mcp) | [Docs](https://buywhere.ai)*
