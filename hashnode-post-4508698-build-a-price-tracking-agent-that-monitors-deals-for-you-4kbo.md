---
title: "Build a price tracking agent that monitors deals for you"
slug: "build-a-price-tracking-agent-that-monitors-deals-for-you-4kbo"
tags: "ai, mcp, python, ecommerce"
domain: "buywhere.hashnode.dev"
canonical: "https://dev.to/buywhere/build-a-price-tracking-agent-that-monitors-deals-for-you-4kbo"
enableToc: true
subtitle: "How to build an AI agent that watches product prices across marketplaces and alerts you when the timing is right to buy"
seoTitle: "Build a price tracking agent that monitors deals for you"
seoDescription: "How to build an AI agent that watches product prices across marketplaces and alerts you when the timing is right to buy"
---
Most people check a price once, forget about it, and buy at the wrong time.

The gap between "I saw this was expensive" and "I'll wait for a sale" rarely closes — because nobody has a script running at 2am checking if the price dropped.

AI agents can close this loop. Give an agent a product, a price target, and a notification channel, and it will watch the market for you — checking prices daily, comparing across merchants, and alerting you when conditions are met.

This post shows how to build that with a cron job, the BuyWhere MCP server, and a simple decision engine.

## What you need

1. **BuyWhere MCP server** — real-time prices across 9 countries and multiple merchants per product
2. **A scheduling mechanism** — `cron` + a Python script, or any task queue
3. **A notification channel** — email, Slack, or Telegram (this post uses email)

The MCP server gives you the data. The rest is orchestration.

## The core loop

```plaintext
Every day at 8am:
  1. Load your watchlist (product + target price)
  2. For each product, fetch current prices across all merchants
  3. If any merchant is at or below target price → send alert
  4. Log the result for future analysis
```

This is not complicated. The complexity is in making it reliable and actionable.

## Implementation

```python
import subprocess
import json
import smtplib
from email.message import EmailMessage
from datetime import datetime
from dataclasses import dataclass

@dataclass
class ProductWatch:
    query: str
    country: str
    target_price: float
    currency: str = "SGD"

# Your watchlist — extend this however you like
WATCHLIST = [
    ProductWatch("Sony WH-1000XM5", "SG", 350.0),
    ProductWatch("Dyson V15 vacuum", "SG", 600.0),
    ProductWatch("Nintendo Switch 2", "SG", 480.0),
]

def search_products(query: str, country: str, limit: int = 10) -> list[dict]:
    """Call BuyWhere MCP server to get product results."""
    result = subprocess.run(
        [
            "npx", "-y", "@buywhere/mcp-server",
            "search",
            "--query", query,
            "--country", country.lower(),
            "--limit", str(limit)
        ],
        capture_output=True, text=True, timeout=30
    )
    if result.returncode != 0:
        return []
    try:
        data = json.loads(result.stdout)
        return data.get("products", data.get("data", []))
    except json.JSONDecodeError:
        return []

def check_watchlist() -> list[str]:
    """Check each product in the watchlist. Returns alert messages."""
    alerts = []
    for watch in WATCHLIST:
        products = search_products(watch.query, watch.country)
        if not products:
            continue

        # Find the cheapest option
        cheapest = min(
            [p for p in products if p.get("price")],
            key=lambda p: float(p["price"]),
            default=None
        )

        if not cheapest:
            continue

        price = float(cheapest["price"])
        merchant = cheapest.get("merchantName", "Unknown")
        name = cheapest.get("name", watch.query)
        url = cheapest.get("url", "")

        # Check if any option meets the target
        at_target = [p for p in products if p.get("price") and float(p["price"]) <= watch.target_price]

        if at_target:
            best = min(at_target, key=lambda p: float(p["price"]))
            alerts.append(
                f"✓ {name} is at or below target!\n"
                f"  Best price: {best['price']} {watch.currency} at {best.get('merchantName')}\n"
                f"  Target was: {watch.target_price} {watch.currency}\n"
                f"  URL: {best.get('url', url)}"
            )
        else:
            # No deal yet — log current best for reference
            print(
                f"[{datetime.now().isoformat()}] {name}: "
                f"{price} {watch.currency} at {merchant} "
                f"(target: {watch.target_price})"
            )

    return alerts

def send_email_alerts(alerts: list[str]):
    """Send email with deal alerts."""
    if not alerts:
        return

    msg = EmailMessage()
    msg["Subject"] = f"Price alerts — {datetime.now().strftime('%Y-%m-%d')}"
    msg["From"] = "price-agent@yourdomain.com"
    msg["To"] = "you@yourdomain.com"

    body = "Your watchlist results:\n\n" + "\n\n".join(alerts)
    body += "\n\n---\nPowered by BuyWhere MCP"

    msg.set_content(body)

    with smtplib.SMTP("smtp.yourprovider.com", 587) as server:
        server.starttls()
        server.login("price-agent@yourdomain.com", "your-password")
        server.send_message(msg)

# Run it
if __name__ == "__main__":
    alerts = check_watchlist()
    if alerts:
        send_email_alerts(alerts)
```

## Scheduling with cron

Save as `price_tracker.py`, then add to cron:

```bash
# Run every day at 8am
0 8 * * * /usr/bin/python3 /opt/price_tracker.py >> /var/log/price_tracker.log 2>&1
```

Or run it on a schedule with any task queue (Celery, Airflow, GitHub Actions cron, etc.).

## Making it smarter

The basic loop works. Here are the improvements that turn it from "occasionally useful" to "actually saves money":

### 1. Track price history

Add a SQLite table:

```python
import sqlite3

def log_price(product_name: str, merchant: str, price: float, currency: str):
    conn = sqlite3.connect("price_history.db")
    conn.execute(
        "INSERT INTO prices (product, merchant, price, currency, checked_at) "
        "VALUES (?, ?, ?, ?, ?)",
        (product_name, merchant, price, currency, datetime.now().isoformat())
    )
    conn.commit()
    conn.close()
```

Then query it before alerting: if the price dropped 20% in the last week, that's more useful than just "below your target."

### 2. Account for shipping

Some merchants offer a lower price but charge shipping. Factor it in:

```python
def effective_price(product: dict) -> float:
    price = float(product.get("price", 0))
    shipping = float(product.get("shipping", 0))
    return price + shipping
```

### 3. Notify on significant drops, not just reaching the target

```python
# Alert if price dropped 15%+ since last check
last_price = get_last_price(product_name, merchant)
if last_price and price < last_price * 0.85:
    alerts.append(f"📉 {name} dropped {last_price - price:.2f} {currency} at {merchant}")
```

### 4. Multi-country comparison

Use the same MCP server for cross-border arbitrage:

```python
sg_price = search_products("iPhone 16 256GB", "SG")
my_price = search_products("iPhone 16 256GB", "MY")
```

Compare across countries to find the best deal including shipping.

## What BuyWhere adds

The MCP server handles the hard parts:
- Normalizing merchant names across Shopee, Lazada, Amazon, Qoo10, and others
- Currency conversion across SGD, MYR, USD, etc.
- Deduplication — same product, different merchant listings, collapsed into one result
- Fallback when one merchant is out of stock

Without this, you'd spend most of your code handling data normalization instead of building the agent logic.

## Extending to a full shopping agent

Price tracking is one loop. Combine it with the ReAct pattern from the [previous post in this series](/blog/ai-shopping-agent-mcp-react), and you have:

1. **Monitor** — cron job watches your watchlist, alerts on targets
2. **Decide** — ReAct agent evaluates whether to buy now or wait
3. **Execute** — agent places the order (with your confirmation step for safety)

The MCP server gives the agent real prices. The cron job gives it memory. The agent gives it judgment.

## Get started

```bash
# Install the BuyWhere MCP server
npx -y @buywhere/mcp-server

# Or use the Python client directly
pip install buywhere-mcp
```

Then copy the script above, add your products, set your targets, and let it run.

*This is part of a series on building AI shopping agents with BuyWhere MCP. Previous posts covered the MCP server basics and connecting Claude to a real product catalog.*

---

**Series:**
1. [BuyWhere MCP — give your agent a real product catalog, not just an Amazon buy link](/buywhere/buywhere-mcp-give-your-agent-a-real-product-catalog-not-just-an-amazon-buy-link-300a)
2. [What I accidentally built when I connected Claude to a product catalog](/buywhere/what-i-accidentally-built-when-i-connected-claude-to-a-product-catalog-4lpi)
3. [Ship a self-serve commerce MCP without the sales call](/buywhere/ship-a-self-serve-commerce-mcp-without-the-sales-call-the-four-anti-patterns-we-removed-3ejp)
