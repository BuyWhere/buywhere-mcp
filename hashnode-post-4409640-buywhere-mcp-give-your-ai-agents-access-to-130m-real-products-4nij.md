---
title: "BuyWhere MCP: Give Your AI Agents Access to 130M+ Real Products"
slug: "buywhere-mcp-give-your-ai-agents-access-to-130m-real-products-4nij"
tags: "ai, mcp, shopping, developer"
domain: "buywhere.hashnode.dev"
canonical: "https://dev.to/buywhere/buywhere-mcp-give-your-ai-agents-access-to-130m-real-products-4nij"
enableToc: true
subtitle: "AI assistants are becoming the primary interface for product discovery. But most can only hallucinate..."
seoTitle: "BuyWhere MCP: Give Your AI Agents Access to 130M+ Real Products"
seoDescription: "AI assistants are becoming the primary interface for product discovery. But most can only hallucinate..."
---
AI assistants are becoming the primary interface for product discovery. But most can only hallucinate product info or rely on scraped data that is stale by the time it hits the training set.

BuyWhere is a real-time product catalog API with native MCP support that gives AI agents instant access to live pricing data.

## What BuyWhere Provides

- **130M+ products** from **75K+ verified merchants**
- **9 regions**: Singapore, US, Japan, Vietnam, Thailand, Indonesia, Philippines, Malaysia, India
- **7 MCP tools**: `search_products`, `get_product`, `compare_products`, `find_best_price`, `get_deals`, `list_categories`, `find_similar`

## Quick Start

Add this to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "buywhere": {
      "url": "https://api.buywhere.ai/mcp"
    }
  }
}
```

Restart Claude Desktop and you can immediately ask questions like:

- "Find me the best deal on AirPods Pro under $200"
- "Compare iPhone 16 prices across US retailers"
- "What electronics are on sale in Singapore right now?"

## Why This Matters

Most AI shopping assistants are limited to:
- Training data that is months old
- Single-retailer views with no cross-store comparison
- Fake or hallucinated product listings

BuyWhere solves this with:
- **Live, real-time pricing** across thousands of retailers
- **Cross-retailer price comparison** with deal detection
- **Structured product data** including specs, ratings, and availability
- **MCP-native** so any MCP-compatible assistant works out of the box

## Use Cases

**Price comparison agents**: "Find me the cheapest wireless earbuds under $50 with noise cancellation"

**Deal discovery**: Monitor price drops and alert when items hit target prices

**Product research**: Get structured specs, ratings, and availability data in real-time

**Cross-border shopping**: Compare prices across 9 Asian and US markets

## Developer Experience

The API follows standard REST patterns with MCP as the primary interface:

```python
import requests

# Direct REST API
response = requests.get(
    "https://api.buywhere.ai/api/products/search",
    params={"q": "airpods pro", "country_code": "SG"}
)

# Or use MCP tools in any compatible agent
# search_products, get_product, compare_products, 
# find_best_price, get_deals, list_categories, find_similar
```

## Free Tier

Start with **10K API calls/month** on the free tier. Paid plans available for high-volume agents and production deployments.

## Links

- [Docs](https://api.buywhere.ai/docs)
- [API](https://api.buywhere.ai)
- [GitHub](https://github.com/BuyWhere/buywhere-mcp)
- [MCP Registry](https://github.com/BuyWhere/buywhere-mcp): `io.github.BuyWhere/buywhere-mcp@1.0.5`

---

Built BuyWhere because AI assistants kept giving me fake product recommendations. Real data, real prices, real-time.

What would you build with this? Feedback welcome in the comments.
