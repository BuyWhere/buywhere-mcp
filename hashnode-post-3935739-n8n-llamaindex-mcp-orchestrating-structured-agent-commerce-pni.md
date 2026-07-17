---
title: "n8n + LlamaIndex + MCP: orchestrating structured agent commerce"
slug: "n8n-llamaindex-mcp-orchestrating-structured-agent-commerce-pni"
tags: "programming"
domain: "buywhere.hashnode.dev"
canonical: "https://dev.to/buywhere/n8n-llamaindex-mcp-orchestrating-structured-agent-commerce-pni"
enableToc: true
subtitle: "The problem with general-purpose shopping agents   Most AI shopping assistants answer..."
seoTitle: "n8n + LlamaIndex + MCP: orchestrating structured agent commerce"
seoDescription: "The problem with general-purpose shopping agents   Most AI shopping assistants answer..."
---
## The problem with general-purpose shopping agents

Most AI shopping assistants answer product questions from training data. They hallucinate prices, invent product availability, and have no way to check merchants in real time. That works for demos. It fails in production.

A useful shopping agent needs three things:
1. **A reasoning layer** — to break "what's the best laptop for programming under $1500" into structured sub-questions
2. **A workflow layer** — to orchestrate multi-step research across sources
3. **A data layer** — to fetch live product prices, ratings, and merchant availability from a structured catalog

This post shows how to wire all three together using [LlamaIndex](https://www.llamaindex.com/) for reasoning, [n8n](https://n8n.io/) for workflow orchestration, and the [BuyWhere MCP server](https://buywhere.ai/mcp) for live product data.

---

## Architecture overview

```plaintext
User query
    │
    ▼
LlamaIndex agent (reasoning + query planning)
    │
    ├── "search laptops under $1500, Singapore"
    │
    ▼
n8n workflow (triggered by webhook or scheduler)
    │
    ├── receives structured query from LlamaIndex
    ├── calls BuyWhere MCP server → live product results
    ├── enriches results (filter, rank, format)
    └── returns structured response to agent
    │
    ▼
LlamaIndex synthesizes final answer
    │
    ▼
User
```

The MCP server acts as the **structured data bridge** — LlamaIndex talks to it via the MCP protocol, n8n talks to it via REST. The two can be used independently or together.

---

## 1. Set up the BuyWhere MCP server

The BuyWhere MCP server exposes a product catalog via the Model Context Protocol. Install it in your project:

```bash
npm install @buywhere/mcp-server
```

Configure it in your MCP settings (`~/.config/code/mcp.json` or your agent runtime's config):

```json
{
  "mcpServers": {
    "buywhere": {
      "command": "npx",
      "args": ["@buywhere/mcp-server"]
    }
  }
}
```

Required env var:
```bash
BUYWHERE_API_KEY=your_key_here
```

You can get a free API key at [buywhere.ai/api-keys](https://buywhere.ai/api-keys).

### Available MCP tools

| Tool | Description |
|------|-------------|
| `buywhere_search_products` | Full-text search across 20+ merchant platforms |
| `buywhere_get_deals` | Discounted products by category or discount % |
| `buywhere_get_categories` | Top-level product categories |

All tools return structured JSON with product name, price, merchant, URL, rating, and availability.

---

## 2. Build the LlamaIndex reasoning layer

Install the required packages:

```bash
pip install llama-index llama-index-agent-openai llama-index-tools-buywhere
```

Set up the agent with BuyWhere as a tool:

```python
from llama_index.agent.openai import OpenAIAgent
from llama_index.tools.buywhere import (
    BuyWhereSearchProductsTool,
    BuyWhereGetDealsTool,
    BuyWhereGetCategoriesTool,
)

# Register BuyWhere MCP tools
tools = [
    BuyWhereSearchProductsTool(),
    BuyWhereGetDealsTool(),
    BuyWhereGetCategoriesTool(),
]

agent = OpenAIAgent.from_tools(tools, verbose=True)
```

Now the agent can reason about shopping queries and call the product catalog in context:

```python
response = agent.chat(
    "Compare the top 3 laptops under $1500 available in Singapore right now. "
    "Include battery life and merchant rating for each."
)
print(response)
```

LlamaIndex plans the sub-questions, calls the BuyWhere tools to get live data, and synthesizes a grounded answer — no hallucinated prices.

---

## 3. Orchestrate with n8n workflows

For more complex multi-step flows, use n8n to wire the BuyWhere API directly into your workflow:

### n8n nodes for BuyWhere

The [`n8n-nodes-buywhere`](https://github.com/buywhere/n8n-nodes-buywhere) community node provides three operations:

- **Search Products** — full-text search with filters (domain, region, price range, currency)
- **Get Categories** — category tree with product counts
- **Get Deals** — current discounts by category or discount threshold

### Example: weekly deal digest workflow

```plaintext
[Schedule Trigger: every Monday 9am]
        │
        ▼
[BuyWhere: Get Deals → category="laptops", min_discount=15%]
        │
        ▼
[Code: Filter to items with rating >= 4.0]
        │
        ▼
[HTML Template: render deal cards]
        │
        ▼
[Email / Slack / Discord: send digest]
```

The workflow runs autonomously, surfaces current deals, and never surfaces stale prices.

### Example: LlamaIndex + n8n hybrid

```plaintext
[Webhook: receives LlamaIndex query]
        │
        ▼
[n8n: Call BuyWhere API with structured filters]
        │
        ▼
[Code: Normalize response to LlamaIndex tool format]
        │
        ▼
[Respond to LlamaIndex agent with results]
```

This gives you the best of both: LlamaIndex's reasoning + n8n's reliable job execution + BuyWhere's live catalog.

---

## 4. Structured product data you can trust

The BuyWhere catalog covers 20+ merchant platforms across Singapore, Southeast Asia, and US markets. Each product record includes:

```json
{
  "name": "ASUS ZenBook 14 OLED UM3402YA-KM090W",
  "price": 1298.00,
  "currency": "SGD",
  "merchant": "Shopee",
  "merchant_url": "https://shopee.sg/...",
  "rating": 4.7,
  "review_count": 1240,
  "in_stock": true,
  "last_updated": "2026-06-15T08:32:00Z",
  "category": "laptops",
  "tags": ["oled", "ultrabook", "amd"]
}
```

Compare this to scraping storefront pages: no HTML parsing, no rate limiting, no merchant TOS violations.

---

## 5. Handling edge cases

### No results found

When a query matches nothing, the MCP tool returns an empty array. Have your agent fall back gracefully:

```python
results = buywhere_tool.search("hypothetical product xyz")
if not results:
    return "No matching products found. Try broadening your search."
```

### Price freshness

Product prices change frequently. The `last_updated` field tells you when the price was last fetched. For price-sensitive use cases, filter to items updated within 24 hours:

```python
fresh_results = [
    r for r in results
    if (datetime.now() - parse_date(r["last_updated"])).days < 1
]
```

### Regional variants

Use the `region` and `country_code` parameters to scope results to the right market:

```python
buywhere_tool.search(
    "best noise-cancelling headphones",
    region="southeast_asia",
    country_code="SG",
    currency="SGD"
)
```

---

## Putting it together

The combination of LlamaIndex + n8n + BuyWhere gives you a production-ready shopping agent:

- **LlamaIndex** handles reasoning, query decomposition, and response synthesis
- **n8n** handles workflow orchestration, scheduling, and multi-channel delivery
- **BuyWhere MCP / API** handles live product data — prices, stock, ratings, merchant links

You can start with a single tool (just the BuyWhere MCP server) and layer in LlamaIndex reasoning and n8n automation as your use case matures.

Get your free API key at [buywhere.ai/api-keys](https://buywhere.ai/api-keys?utm_source=devto&utm_medium=blog&utm_campaign=june30_25k&utm_content=frameworks_w26) and connect the BuyWhere MCP server to your agent in minutes.

---

*This post is part of a series on building structured AI commerce agents. The previous post covered [building an MCP server for price comparison](/mcp-walkthrough).*
