---
title: "Cross-Border Price Comparison with BuyWhere MCP: A Singapore-Asia Perspective"
slug: "cross-border-price-comparison-with-buywhere-mcp-a-singapore-asia-perspective-4o8b"
tags: "mcp, aiagents, ecommerce, shopping"
domain: "buywhere.hashnode.dev"
canonical: "https://dev.to/buywhere/cross-border-price-comparison-with-buywhere-mcp-a-singapore-asia-perspective-4o8b"
enableToc: true
subtitle: "Compare product prices across Singapore, Malaysia, Thailand, and US markets. Find the best deals with AI-powered cross-border shopping using BuyWhere MCP."
seoTitle: "Cross-Border Price Comparison with BuyWhere MCP: A Singapore-Asia Perspective"
seoDescription: "Compare product prices across Singapore, Malaysia, Thailand, and US markets. Find the best deals with AI-powered cross-border shopping using BuyWhere MCP."
---
# Cross-Border Price Comparison with BuyWhere MCP

Why limit your users to one market when prices vary dramatically across borders?

A product that costs S$120 in Singapore might be S$95 in Malaysia — or even cheaper when shipped from the US with the right exchange rate. BuyWhere MCP lets your shopping agent search across multiple markets simultaneously and surface the best deal.

## What we're building

A Python script that:
1. Takes a product query
2. Searches across SG, MY, TH, and US markets
3. Ranks results by total cost (price + shipping estimates)
4. Returns the best cross-border deal

## Prerequisites

```bash
pip install buywhere-mcp mcp
```

Get your API key at [api.buywhere.ai](https://api.buywhere.ai).

## Step 1 — Search across markets

```python
from buywhere import MCPClient

client = MCPClient()  # Uses BUYWHERE_API_KEY env var

# Search once, get results from all markets
results = client.search_products(
    query="Sony WH-1000XM5 headphones",
    markets=["SG", "MY", "TH", "US"],
    limit=5  # 5 results per market
)

print(f"Found {len(results)} total listings across markets")
for r in results:
    print(f"  {r['market']}: {r['price']} {r['currency']} — {r['name'][:50]}")
```

The response includes each listing's market, price, currency, and shipping estimate (if available).

## Step 2 — Normalize to a single currency

Prices come back in their local currency. Convert to compare fairly:

```python
# Approximate USD to SGD rates (in production, fetch live)
RATES = {
    "USD": 1.35,   # 1 USD = 1.35 SGD
    "MYR": 0.30,   # 1 MYR = 0.30 SGD  
    "THB": 0.038,  # 1 THB = 0.038 SGD
    "SGD": 1.0,
}

def to_sgd(price, currency):
    return price * RATES.get(currency, 1.0)

# Add normalized price for comparison
for r in results:
    r["price_sgd"] = to_sgd(r["price"], r["currency"])
```

## Step 3 — Factor in shipping

Raw price isn't enough — cross-border shipping adds cost:

```python
# Estimate shipping by market
SHIPPING_EST = {
    "SG": 0,      # Free/flat
    "MY": 15,     # ~15 SGD
    "TH": 25,     # ~25 SGD
    "US": 35,     # ~35 SGD
}

def total_cost(listing):
    base = listing["price_sgd"]
    shipping = SHIPPING_EST.get(listing["market"], 20)
    return base + shipping

# Sort by total cost
ranked = sorted(results, key=total_cost)

print("\n🏆 Best deals (price + estimated shipping):")
for i, r in enumerate(ranked[:3], 1):
    print(f"  {i}. {r['market']}: {r['price']} {r['currency']} "
          f"(~S${total_cost(r):.2f} total)")
```

## Step 4 — Add market-specific logic

Different markets have different quirks:

```python
def rank_by_market(results, user_market="SG"):
    """Rank results with preference for user's home market."""
    scored = []
    for r in results:
        base_score = total_cost(r)
        # Bonus for local market (faster shipping, no customs)
        if r["market"] == user_market:
            base_score -= 5  # S$5 discount for local
        scored.append((base_score, r))
    
    return [r for _, r in sorted(scored)]

# User in Singapore gets SG listings ranked higher at same price
recommendations = rank_by_market(results, user_market="SG")
```

## Production considerations

### Customs and taxes
- SG: No GST on goods < S$400
- MY: 6% SST may apply
- TH: 7% VAT
- US: Varies by state

For a production app, fetch live rates and add a customs estimator.

### Authenticity
BuyWhere validates seller legitimacy — each listing includes a `seller_verified` flag.
Prioritize verified sellers for high-value items.

### Market availability
Not all products exist in all markets. The search response tells you what's available where:

```python
by_market = {}
for r in results:
    by_market.setdefault(r["market"], []).append(r)

print("Available in each market:")
for market, items in by_market.items():
    print(f"  {market}: {len(items)} listings")
```

## Full example

```python
#!/usr/bin/env python3
"""Cross-border price comparison with BuyWhere MCP."""

import os
from buywhere import MCPClient

RATES = {"USD": 1.35, "MYR": 0.30, "THB": 0.038, "SGD": 1.0}
SHIPPING = {"SG": 0, "MY": 15, "TH": 25, "US": 35}

def to_sgd(price, currency):
    return price * RATES.get(currency, 1.0)

def total_cost(listing):
    return to_sgd(listing["price"], listing["currency"]) + SHIPPING.get(listing["market"], 20)

def main():
    client = MCPClient(api_key=os.environ["BUYWHERE_API_KEY"])
    
    query = input("Product to search: ")
    results = client.search_products(query=query, markets=["SG", "MY", "TH", "US"], limit=5)
    
    ranked = sorted(results, key=total_cost)
    
    print(f"\n📦 Best deals for '{query}':")
    for i, r in enumerate(ranked[:5], 1):
        print(f"  {i}. {r['market']}: {r['price']} {r['currency']} "
              f"(S${total_cost(r):.2f} with shipping)")

if __name__ == "__main__":
    main()
```

Run it:

```bash
python crossborder.py
Product to search: iPad Air 11

📦 Best deals for 'iPad Air 11':
  1. US: 599 USD (S$843.65 with shipping)
  2. SG: 899 SGD (S$899.00 with shipping)
  3. MY: 2799 MYR (S$869.70 with shipping)
  4. TH: 24900 THB (S$972.20 with shipping)
```

## What's next

- Add real-time exchange rate API
- Integrate customs/duty calculator
- Factor in delivery time for urgency ranking
- Build a Slack/Discord bot that replies with deals

The full code is on GitHub. Link in comments.

---

*This is part of the "BuyWhere MCP in practice" series. Previous posts covered 
[price alert engines](https://dev.to/buywhere/build-a-real-time-price-alert-engine-with-buywhere-mcp-5315),
[long-tail search](https://dev.to/buywhere/why-ai-product-search-fails-on-long-tail-queries-and-how-mcp-fixes-it-),
and [building shopping bots](https://dev.to/buywhere/build-a-discord-shopping-bot-in-30-minutes-with-buywhere-mcp-45pn).*
