---
title: "Build a Smart Shopping List that Finds Real Prices with BuyWhere MCP"
slug: "build-a-smart-shopping-list-that-finds-real-prices-with-buywhere-mcp-k8"
tags: "python, mcp, shopping, api"
domain: "buywhere.hashnode.dev"
canonical: "https://dev.to/buywhere/build-a-smart-shopping-list-that-finds-real-prices-with-buywhere-mcp-k8"
enableToc: true
subtitle: "W9 Dev.to Draft — Build a Smart Shopping List with BuyWhere MCP   Target: Developers..."
seoTitle: "Build a Smart Shopping List that Finds Real Prices with BuyWhere MCP"
seoDescription: "W9 Dev.to Draft — Build a Smart Shopping List with BuyWhere MCP   Target: Developers..."
---
# W9 Dev.to Draft — Build a Smart Shopping List with BuyWhere MCP

**Target:** Developers building AI apps / agents who need product data
**Hook:** Shopping lists are boring. Let's make one that actually finds real prices and availability.
**Stack:** Python, BuyWhere MCP server, rich terminal output
**Length:** ~900 words, code-first, tutorial format

---

## Metadata
- Title: "Build a Smart Shopping List that Finds Real Prices with BuyWhere MCP"
- Tags: python, mcp, shopping, tutorial, api
- Canonical URL: https://dev.to/buywhere/build-a-smart-shopping-list-with-buywhere-mcp

---

## Body

### What We're Building

A CLI shopping list that tracks items across multiple countries, finds the cheapest merchant, and alerts you when prices drop. No scraped HTML, no merchant APIs — just a clean product catalog.

### Prerequisites

```bash
pip install buywhere-mcp
# or: npx @buywhere/mcp-server
```

You'll also need the MCP server running. The fastest way:

```bash
npx @buywhere/mcp-server --key YOUR_API_KEY
```

### The Core Logic

```python
import asyncio
from buywhere import BuyWhereClient

async def find_best_deal(client, product_query, countries=["US", "SG"]):
    """Find the cheapest price for a product across multiple markets."""
    results = {}

    for country in countries:
        products = await client.search_products(
            query=product_query,
            country=country,
            limit=5
        )
        if products:
            # Sort by price, take the cheapest
            cheapest = min(products, key=lambda p: p["price"]["amount"])
            results[country] = {
                "price": cheapest["price"]["amount"],
                "currency": cheapest["price"]["currency"],
                "merchant": cheapest["merchant"]["name"],
                "url": cheapest["url"]
            }

    return results

async def main():
    client = BuyWhereClient()

    shopping_list = [
        "Sony WH-1000XM5",
        "MacBook Air M4",
        "iPad Air"
    ]

    for item in shopping_list:
        print(f"\n{'='*50}")
        print(f"  {item}")
        print('='*50)

        deals = await find_best_deal(client, item)

        for country, info in deals.items():
            flag = "🇺🇸" if country == "US" else "🇸🇬"
            print(f"  {flag} {country}: {info['currency']} {info['price']:.2f} @ {info['merchant']}")

        best = min(deals.values(), key=lambda x: x["price"])
        print(f"\n  → Best deal: {best['currency']} {best['price']:.2f} in {[c for c, d in deals.items() if d == best][0]}")

if __name__ == "__main__":
    asyncio.run(main())
```

### Why This Works

The BuyWhere catalog covers 370M+ products across 940K+ merchants. The `search_products` tool does the heavy lifting:

- **Country filtering** — `country: "SG"` returns SGD prices and SG-available merchants
- **Merchant data** — each result includes the merchant name and a tracking URL
- **Price objects** — prices are structured (`{amount, currency}`) so you never mix SGD with USD

### Adding Price Alerts

The real value: monitoring prices over time.

```python
from datetime import datetime, timedelta

async def check_price_history(client, product_query, days=7):
    """Check if a product's price has changed in the last N days."""

    products = await client.search_products(query=product_query, limit=10)

    for product in products:
        last_updated = product.get("updated_at")
        if last_updated:
            age = datetime.now() - datetime.fromisoformat(last_updated)
            if age < timedelta(days=days):
                print(f"  Recently updated: {product['name']} — {product['price']}")
```

### Cross-Border Arbitrage

The killer feature: **find the same product cheaper in another market**.

```python
async def arbitrage_check(client, product_query):
    """Check if the same product is cheaper across borders."""
    sg_results = await client.search_products(query=product_query, country="SG", limit=3)
    us_results = await client.search_products(query=product_query, country="US", limit=3)

    if not sg_results or not us_results:
        return None

    sg_cheapest = min(sg_results, key=lambda p: p["price"]["amount"])
    us_cheapest = min(us_results, key=lambda p: p["price"]["amount"])

    # Convert USD to SGD for comparison (approximate)
    us_price_sgd = us_cheapest["price"]["amount"] * 1.35  # rough SGD rate

    if us_price_sgd < sg_cheapest["price"]["amount"]:
        savings = sg_cheapest["price"]["amount"] - us_price_sgd
        return {
            "product": sg_cheapest["name"],
            "sg_price": f"SGD {sg_cheapest['price']['amount']:.2f}",
            "us_price_converted": f"SGD {us_price_sgd:.2f}",
            "savings": f"SGD {savings:.2f}",
            "merchant": us_cheapest["merchant"]["name"]
        }

    return None
```

### Connecting to a Real App

This isn't just a toy. Swap the print statements for a notification:

```python
import os
import smtplib

def notify_deal(deal):
    message = f"""
    Price alert for {deal['product']}:
    Buy from {deal['merchant']} for {deal['savings']} less.
    {deal['url']}
    """
    # Send via your preferred channel
    print(message)  # or: slack_message(message), telegram_message(message)
```

### The MCP Advantage

Traditional price tracking requires:
1. Scraping merchant sites (fragile, often blocked)
2. Negotiating affiliate API access (slow, requires partnerships)
3. Manual price updates (error-prone)

BuyWhere MCP gives you a **structured, maintained product catalog** with merchant tracking built in. The catalog is refreshed continuously — no scraping infrastructure required.

### Getting Your API Key

Sign up at **buywhere.ai/developers** — free tier includes 1,000 searches/month. The MCP server handles rate limiting and retries automatically.

### What's Next

- Add currency conversion with live exchange rates
- Store results in a SQLite database for history
- Add merchant rating filtering
- Build a weekly digest email

The full code is on GitHub (placeholder link). Questions? Drop them below or open an issue on the MCP server repo.

---

**Word count:** ~880 words
**Code blocks:** 6
**Estimated read time:** 5 minutes
**CTA:** Get your API key at buywhere.ai/developers
