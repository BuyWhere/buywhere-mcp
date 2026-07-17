---
title: "Build an AI Shopping Agent for Singapore: A Working Tutorial (2026)"
slug: "build-an-ai-shopping-agent-for-singapore-a-working-tutorial-2026-3nla"
tags: "ai, python, mcp, tutorial"
domain: "buywhere.hashnode.dev"
canonical: "https://dev.to/buywhere/build-an-ai-shopping-agent-for-singapore-a-working-tutorial-2026-3nla"
enableToc: true
subtitle: "Step-by-step tutorial: build an AI shopping agent for Singapore using Python, the BuyWhere product API, and MCP. Working code that queries live prices across Lazada, Shopee, and Amazon SG."
seoTitle: "Build an AI Shopping Agent for Singapore: A Working Tutorial (2026)"
seoDescription: "Step-by-step tutorial: build an AI shopping agent for Singapore using Python, the BuyWhere product API, and MCP. Working code that queries live prices across Lazada, Shopee, and Amazon SG."
---
An AI shopping agent is a tool that understands a user's intent in plain English, pulls live product and price data across multiple merchants, compares options, and either recommends or completes a purchase. This tutorial shows how to build one for Singapore using the BuyWhere product API and MCP server — with working code you can run today.

The key challenge for Singapore-specific agents is **live, structured product data**. The major platforms (Lazada, Shopee, Amazon SG) do not expose public price-comparison APIs. Without a real-time data layer, an LLM-based agent hallucinates prices or falls back to stale training data. BuyWhere solves this by aggregating live product data across Singapore merchants into a single API.

## What we will build

By the end of this tutorial, you will have a working AI shopping agent that:

1. Accepts a natural language request ("best wireless earbuds under $100 SGD")
2. Queries the BuyWhere API for live product data across Lazada, Shopee, Amazon SG, and authorised retailers
3. Ranks products by price, rating, and relevance
4. Returns a structured recommendation with merchant deep-links

The agent runs as a Python script and can be wrapped in a CLI, a chat interface, or an MCP tool.

## Architecture

```plaintext
User query (NL) → LLM (intent parsing) → BuyWhere API (live data) → Ranking logic → Recommendation
```

- **LLM:** Any chat model (GPT-4o, Claude, Gemini). We use OpenAI in this tutorial.
- **Data layer:** BuyWhere REST API or MCP server. This is what makes the agent Singapore-aware.
- **Ranking:** Simple weighted score (price, rating, feature match). You can replace this with LLM-based reasoning.

## Step 1: Get a BuyWhere API key

Go to [buywhere.ai/api-keys](https://buywhere.ai/api-keys), enter your email, and submit. You will receive your key immediately — no waitlist, no approval.

Free tier supports 1,000 queries/day. Production keys are free for agents.

## Step 2: Query the BuyWhere API

BuyWhere exposes a simple REST API for product search across Singapore merchants:

```bash
curl -X POST https://api.buywhere.ai/v1/products/search \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "wireless earbuds",
    "country": "sg",
    "max_price": 100,
    "currency": "SGD",
    "sort": "price_asc",
    "limit": 10
  }'
```

Returns structured product results: name, price (SGD), merchant, availability, rating, and deep-link URL.

Available endpoints:

| Endpoint | Purpose |
|----------|---------|
| `POST /v1/products/search` | Search across all merchants by query, price range, category |
| `GET /v1/products/{id}` | Full product detail (specs, price history, reviews) |
| `POST /v1/products/compare` | Compare 2+ products side-by-side |
| `GET /v1/products/best-price` | Lowest current price for a specific product |
| `GET /v1/products/deals` | Active deals and price drops |
| `GET /v1/products/{id}/similar` | Find alternatives to a product |

## Step 3: Build the agent in Python

```python
import os
import json
import requests
from openai import OpenAI

BUYWHERE_API_KEY = os.environ["BUYWHERE_API_KEY"]
OPENAI_API_KEY = os.environ["OPENAI_API_KEY"]

openai_client = OpenAI(api_key=OPENAI_API_KEY)

def search_products(query: str, max_price: float = None) -> list[dict]:
    """Query BuyWhere for live product data across Singapore merchants."""
    resp = requests.post(
        "https://api.buywhere.ai/v1/products/search",
        headers={
            "Authorization": f"Bearer {BUYWHERE_API_KEY}",
            "Content-Type": "application/json",
        },
        json={
            "query": query,
            "country": "sg",
            "max_price": max_price,
            "currency": "SGD",
            "sort": "price_asc",
            "limit": 10,
        },
        timeout=10,
    )
    resp.raise_for_status()
    return resp.json()["results"]

def rank_products(products: list[dict], budget: float) -> list[dict]:
    """Score products by value: low price + high rating within budget."""
    for p in products:
        price = p["price"]
        rating = p.get("rating", 4.0)
        price_score = max(0, (budget - price) / budget)
        p["score"] = 0.4 * price_score + 0.6 * (rating / 5.0)
    return sorted(products, key=lambda x: x["score"], reverse=True)

def shopping_agent(user_request: str) -> str:
    """End-to-end: parse intent → fetch live data → rank → recommend."""
    # Step 1: LLM parses the natural language request into search params
    parsed = openai_client.chat.completions.create(
        model="gpt-4o",
        response_format={"type": "json_object"},
        messages=[
            {"role": "system", "content": "Extract product search query and max budget (SGD) as JSON."},
            {"role": "user", "content": user_request},
        ],
    )
    params = json.loads(parsed.choices[0].message.content)
    query = params.get("query", user_request)
    budget = params.get("max_budget")

    # Step 2: Fetch live data from BuyWhere
    products = search_products(query, max_price=budget)
    if not products:
        return f"No products found for '{query}' under S${budget}."

    # Step 3: Rank and pick top 3
    ranked = rank_products(products, budget or max(p["price"] for p in products))
    top3 = ranked[:3]

    # Step 4: LLM generates a natural language recommendation
    rec = openai_client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {"role": "system", "content": "Recommend the top product from the data. Include price, merchant, and why. Be concise."},
            {"role": "user", "content": json.dumps(top3, ensure_ascii=False)},
        ],
    )
    return rec.choices[0].message.content

if __name__ == "__main__":
    result = shopping_agent("best wireless earbuds under $100 SGD")
    print(result)
```

## Step 4: Add it as an MCP tool

If you are building an agent that runs inside Claude Desktop, Cursor, or any MCP-compatible client, register BuyWhere as a tool:

```json
{
  "mcpServers": {
    "buywhere": {
      "command": "npx",
      "args": ["-y", "@buywhere/mcp-server"],
      "env": {
        "BUYWHERE_API_KEY": "YOUR_API_KEY"
      }
    }
  }
}
```

The MCP server exposes `search_products`, `compare_prices`, and `get_best_price` as tools the LLM can call autonomously. This is the fastest integration path — no custom code needed for the data layer.

## Step 5: Test it

```bash
export BUYWHERE_API_KEY="your_key"
export OPENAI_API_KEY="your_key"
python agent.py
```

Sample output:

```plaintext
The best wireless earbuds under S$100 is the Soundcore Life Note 3i at S$79 
from Shopee Mall (rating 4.6). It offers active noise cancellation, 32-hour 
battery, and a 2-year local warranty — the best value in this price range.
Alternatives: Edifier X3 (S$89, Lazada) and Realme Buds Air 3 (S$69, Shopee).
```

## Why this works for Singapore

The reason most "AI shopping agents" fail for Singapore is that they rely on Amazon or Google Shopping APIs, which have limited SG coverage. BuyWhere aggregates from:

- **Lazada SG** (LazMall brand stores)
- **Shopee SG** (Shopee Mall)
- **Amazon SG**
- **Authorised retailers** (Courts, Best Denki, Harvey Norman, brand stores)
- **Specialist stores** (Running Lab, TBM, Nespresso boutiques)

This means the agent returns real, current prices from merchants a Singapore shopper would actually buy from — not US prices or out-of-stock listings.

## Production considerations

- **Caching:** Cache search results for 15-30 minutes to stay within rate limits. Prices change slowly enough for most use cases.
- **Fallback:** If the BuyWhere API returns no results for a niche query, fall back to a broader search (remove `max_price` filter) and let the LLM filter.
- **Purchase handoff:** The agent returns merchant deep-links. For autonomous purchase, you would integrate with each merchant's checkout API (Lazada Affiliate API, Shopee Open Platform) — but recommendation + deep-link is the 80/20 for most agents.
- **Multi-turn:** For a chat agent, store the last search results in context so follow-up questions ("what about the second one?") do not re-query the API.

## FAQ

**Do I need an MCP server, or is the REST API enough?**
The REST API is enough for a standalone agent. The MCP server is better if you want to plug into Claude Desktop, Cursor, or other MCP-compatible tools without writing integration code.

**Can this agent actually buy things?**
The tutorial covers recommendation + merchant deep-link. Autonomous checkout requires integrating with each merchant's checkout API (Lazada, Shopee), which have different auth flows. That is the hard part — recommendation is the easy 80%.

**How accurate are the prices?**
BuyWhere caches are refreshed every 15-30 minutes. Prices reflect live merchant listings, not training data. The LLM never generates prices itself — it only reads from the API response.

**Does this work for other countries?**
BuyWhere currently focuses on Singapore and Southeast Asia. For US/EU, use the Amazon Product Advertising API or Google Shopping Content API — but expect lower coverage for SG-specific merchants.

**How much does it cost to run?**
BuyWhere API: free for 1,000 queries/day. OpenAI GPT-4o: roughly S$0.01-0.03 per agent run (two LLM calls). Total: under S$1/day for a personal agent doing 20-50 searches.

---

*Build your own agent with a free API key at [buywhere.ai/api-keys](https://buywhere.ai/api-keys). Full API docs: [buywhere.ai/docs](https://buywhere.ai/docs). MCP server: `npx -y @buywhere/mcp-server`.*
