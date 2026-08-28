---
title: "How to track Shopee price history and find the best deals"
slug: "how-to-track-shopee-price-history-and-find-the-best-deals-9lk"
tags: "ai, mcp, python, ecommerce"
domain: "buywhere.hashnode.dev"
canonical: "https://dev.to/buywhere/how-to-track-shopee-price-history-and-find-the-best-deals-9lk"
enableToc: true
subtitle: "Track price drops on Shopee across Singapore, Malaysia, and other markets using AI agents and the BuyWhere MCP"
seoTitle: "How to track Shopee price history and find the best deals"
seoDescription: "Track price drops on Shopee across Singapore, Malaysia, and other markets using AI agents and the BuyWhere MCP"
---
Shopee runs flash sales, vouchers, and seller discounts so frequently that the "sale price" is often just the normal price. The real question isn't "is this on sale?" — it's "is this actually cheaper than it was last week?"

Tracking Shopee price history manually means checking the same listing every day and hoping you remember what you saw. AI agents can automate this — but only if they have access to real price data across merchants.

## The problem with Shopee prices

Shopee prices fluctuate daily. A product listed at $89 might be $79 during a flash sale, $85 with a voucher, or $92 the day after. The listed "original price" is often inflated to make discounts look bigger.

Without historical data, you can't tell:
- Is this actually a good deal?
- Will it be cheaper next week during the 9.9 sale?
- Is the seller just marking up and discounting to look competitive?

## What you need

1. **Real-time price data** across Shopee and competing merchants (Lazada, Amazon, etc.)
2. **A way to store and compare** historical prices
3. **Alerts** when a price drops below your target

The BuyWhere MCP server handles step 1 — it normalizes prices across Shopee, Lazada, Amazon, Qoo10, and other merchants in Singapore, Malaysia, and 7 other countries.

## Building a Shopee price tracker

Here's a working implementation using the BuyWhere MCP server:

```python
import subprocess
import json
import sqlite3
from datetime import datetime
from dataclasses import dataclass

@dataclass
class WatchItem:
    query: str
    country: str
    target_price: float
    currency: str = "SGD"

WATCHLIST = [
    WatchItem("iPhone 16 256GB", "SG", 1200.0),
    WatchItem("Sony WH-1000XM5", "SG", 350.0),
    WatchItem("Samsung Galaxy S25", "MY", 2800.0, "MYR"),
]

def get_prices(query: str, country: str) -> list[dict]:
    """Fetch current prices via BuyWhere MCP."""
    result = subprocess.run(
        ["npx", "-y", "@buywhere/mcp-server", "search",
         "--query", query, "--country", country.lower(), "--limit", "10"],
        capture_output=True, text=True, timeout=30
    )
    if result.returncode != 0:
        return []
    try:
        data = json.loads(result.stdout)
        return data.get("products", data.get("data", []))
    except json.JSONDecodeError:
        return []

def init_db():
    conn = sqlite3.connect("shopee_prices.db")
    conn.execute("""
        CREATE TABLE IF NOT EXISTS prices (
            id INTEGER PRIMARY KEY,
            product TEXT,
            merchant TEXT,
            price REAL,
            currency TEXT,
            country TEXT,
            recorded_at TEXT
        )
    """)
    conn.commit()
    return conn

def record_prices(conn, query: str, country: str, products: list[dict]):
    for p in products:
        if p.get("price"):
            conn.execute(
                "INSERT INTO prices (product, merchant, price, currency, country, recorded_at) "
                "VALUES (?, ?, ?, ?, ?, ?)",
                (p.get("name", query), p.get("merchantName", "Unknown"),
                 float(p["price"]), p.get("currency", "SGD"), country,
                 datetime.utcnow().isoformat())
            )
    conn.commit()

def check_deals(conn, watch: WatchItem) -> list[str]:
    products = get_prices(watch.query, watch.country)
    if not products:
        return []
    
    record_prices(conn, watch.query, watch.country, products)
    
    alerts = []
    for p in products:
        if not p.get("price"):
            continue
        price = float(p["price"])
        if price <= watch.target_price:
            alerts.append(
                f"✓ {p.get('name', watch.query)}: "
                f"{price} {watch.currency} at {p.get('merchantName')} "
                f"(target: {watch.target_price})"
            )
    
    # Compare to 7-day average
    cursor = conn.execute(
        "SELECT AVG(price) FROM prices "
        "WHERE product LIKE ? AND country = ? "
        "AND recorded_at > datetime('now', '-7 days')",
        (f"%{watch.query[:20]}%", watch.country)
    )
    avg_price = cursor.fetchone()[0]
    if avg_price:
        for p in products:
            if p.get("price") and float(p["price"]) < avg_price * 0.9:
                alerts.append(
                    f"📉 {p.get('name', watch.query)}: "
                    f"{p['price']} {watch.currency} "
                    f"({((1 - float(p['price'])/avg_price)*100):.0f}% below 7-day avg "
                    f"of {avg_price:.0f})"
                )
    
    return alerts

if __name__ == "__main__":
    conn = init_db()
    for watch in WATCHLIST:
        alerts = check_deals(conn, watch)
        for alert in alerts:
            print(alert)
    conn.close()
```

## What this gives you

- **Daily price snapshots** across Shopee + competing merchants
- **7-day moving average** to detect real discounts vs fake sales
- **Target price alerts** so you never miss a deal
- **Cross-merchant comparison** — Shopee might not always be cheapest

## Extending it

1. **Add Telegram alerts** — replace `print()` with a Telegram bot call
2. **Track voucher stacking** — Shopee vouchers can bring prices below the listed sale price
3. **Multi-country comparison** — same product, different Shopee markets (SG vs MY vs PH)
4. **Historical charts** — visualize price trends over 30/60/90 days

## Get started

```bash
# Install the MCP server
npx -y @buywhere/mcp-server

# Or use the Python client
pip install buywhere-mcp
```

Then add your watchlist, set your targets, and let the agent do the checking.

*This is part of a series on building AI shopping agents with BuyWhere MCP. See also: [Build a price tracking agent that monitors deals for you](/buywhere/build-a-price-tracking-agent-that-monitors-deals-for-you-4kbo).*
