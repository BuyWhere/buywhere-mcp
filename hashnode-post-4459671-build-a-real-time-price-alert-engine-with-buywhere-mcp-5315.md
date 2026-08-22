---
title: "Build a Real-Time Price Alert Engine with BuyWhere MCP"
slug: "build-a-real-time-price-alert-engine-with-buywhere-mcp-5315"
tags: "mcp, aiagents, ecommerce, python"
domain: "buywhere.hashnode.dev"
canonical: "https://dev.to/buywhere/build-a-real-time-price-alert-engine-with-buywhere-mcp-5315"
enableToc: true
subtitle: "Build a Real-Time Price Alert Engine with BuyWhere MCP   Price drops happen fast. A product..."
seoTitle: "Build a Real-Time Price Alert Engine with BuyWhere MCP"
seoDescription: "Build a Real-Time Price Alert Engine with BuyWhere MCP   Price drops happen fast. A product..."
---
# Build a Real-Time Price Alert Engine with BuyWhere MCP

Price drops happen fast. A product that's $50 today can be $35 tomorrow — and if your
shopping agent isn't watching, your users miss the window.

In this post we'll build a real-time price alert engine using BuyWhere MCP. It monitors
products you care about, checks prices at a configurable interval, and fires a webhook
(or prints to console) when the price crosses your threshold.

## What we're building

```plaintext
User adds: "Sony WH-1000XM5 headphones"
Alert threshold: -15% from current price
→ Bot checks prices every 6 hours
→ Fires alert when price drops ≥ 15%
```

Full source: ~120 lines of Python. No cron service required — the loop runs in a single script.

## Prerequisites

```bash
pip install buywhere-mcp mcp  # or import from the MCP server directly
```

You'll also need a BuyWhere API key. Free tier at [api.buywhere.ai](https://api.buywhere.ai).

## Step 1 — Search and pick the product

```python
import json
from buywhere import MCPClient

client = MCPClient()

# Search across all markets
results = client.search_products(
    query="Sony WH-1000XM5",
    markets=["SG", "MY", "TH", "US"],
    limit=3
)

# Pick the lowest-priced listing
best = min(results, key=lambda p: p["price"])
print(f"Tracking {best['name']} @ {best['price']} {best['currency']} ({best['market']})")
print(f"  URL: {best['url']}")
print(f"  Last updated: {best['price_updated_at']}")
```

The response includes `price_updated_at` — a timestamp of when the price was last confirmed.
This is critical for alert quality: don't alert on stale prices.

## Step 2 — Set up the monitoring loop

```python
import time
from datetime import datetime, timedelta

class PriceAlertEngine:
    def __init__(self, api_key, check_interval_hours=6, drop_threshold_pct=15.0):
        self.client = MCPClient(api_key=api_key)
        self.interval = check_interval_hours * 3600
        self.threshold = drop_threshold_pct / 100.0
        self.watched = {}  # product_id -> baseline

    def add_product(self, product_id, name):
        """Register a product and capture baseline price."""
        product = self.client.get_product(product_id)
        self.watched[product_id] = {
            "name": name,
            "baseline": product["price"],
            "currency": product["currency"],
            "market": product["market"],
            "url": product["url"],
        }
        print(f"[+] Watching {name}: baseline ${product['price']}")

    def check_all(self):
        """Poll all watched products and fire alerts on threshold breach."""
        for pid, info in self.watched.items():
            current = self.client.get_product(pid)
            baseline = info["baseline"]
            price_now = current["price"]
            pct_change = (price_now - baseline) / baseline

            print(f"  {info['name']}: ${price_now} (was ${baseline}, {pct_change*100:+.1f}%)")

            if pct_change <= -self.threshold:
                self._fire_alert(info, price_now, baseline, pct_change)
                # Update baseline so we don't re-alert on same drop
                self.watched[pid]["baseline"] = price_now

    def _fire_alert(self, product_info, current, baseline, pct):
        print(f"\n🚨 PRICE DROP ALERT: {product_info['name']}")
        print(f"   Was: ${baseline} → Now: ${current} ({pct*100:.1f}%)")
        print(f"   Shop: {product_info['url']}\n")
        # Replace with webhook POST, Slack message, email, etc.

    def run(self):
        """Main loop — runs forever, checks every self.interval seconds."""
        while True:
            print(f"\n[{datetime.utcnow().isoformat()}Z] Running price check...")
            self.check_all()
            print(f"Sleeping {self.interval/3600}h until next check.")
            time.sleep(self.interval)


# --- Usage ---
engine = PriceAlertEngine(
    api_key=os.environ["BUYWHERE_API_KEY"],
    check_interval_hours=6,
    drop_threshold_pct=15.0
)

# Add products by search (or load from a database/CSV)
results = client.search_products("Sony WH-1000XM5 headphones", markets=["SG"], limit=1)
engine.add_product(results[0]["product_id"], results[0]["name"])

engine.run()
```

## Key design decisions

### Stale-price guard
The `price_updated_at` field is your staleness signal. Before alerting, check:

```python
stale_cutoff = datetime.utcnow() - timedelta(hours=24)
price_time = datetime.fromisoformat(product["price_updated_at"].replace("Z", "+00:00"))
if price_time < stale_cutoff:
    print(f"[!] Price data is >24h old — skipping alert for {name}")
    continue
```

An alert on a 3-day-old price is worse than no alert at all.

### Baseline drift
After an alert fires, update the baseline to the new price. Otherwise a 20% drop followed
by a 5% recovery immediately triggers a second alert at the -15% mark. Updating baseline
prevents alert noise.

### Multi-market aggregation
If you're watching the same product across SG, MY, and TH, alert on the *lowest* current
price — your users care about where to buy, not which market's price changed.

```python
cross_market = client.search_products(
    query=product_name,
    markets=["SG", "MY", "TH"],
    limit=5
)
lowest = min(cross_market, key=lambda p: p["price"])
```

## Deployment

This script runs on any VPS, Raspberry Pi, or even a laptop. For production use,
wrap it in a systemd service:

```ini
[Unit]
Description=BuyWhere Price Alert Engine
After=network.target

[Service]
Type=simple
User=alerts
WorkingDirectory=/opt/price-alerts
ExecStart=/usr/bin/python3 /opt/price-alerts/alert_engine.py
Restart=on-failure
Environment=BUYWHERE_API_KEY=<your-key>

[Install]
WantedBy=multi-user.target
```

Or deploy to Railway — the MCP client connects to `api.buywhere.ai` from anywhere.

## What's next

- **Multi-user mode**: store baselines per-user in a Postgres table, expose a simple REST API for adding/removing watches
- **Telegram/Slack integration**: swap `_fire_alert` for `requests.post()` to your bot endpoint
- **Threshold learning**: store the last 30 days of prices per product and alert on *statistical*
  drops (e.g., price below 1 standard deviation) rather than fixed percentages

The full code (with imports, error handling, and environment config) is on GitHub.
Link in the comments.

---

*This is part of the "BuyWhere MCP in practice" series. Previous posts covered
[building a Discord shopping bot](https://dev.to/buywhere/build-a-discord-shopping-bot-in-30-minutes-with-buywhere-mcp-45pn),
[building a Slack deal-alert bot](https://dev.to/buywhere/build-a-slack-deal-alert-bot-with-buywhere-mcp-4ol0),
and [query pattern strategies](https://dev.to/buywhere/natural-language-product-search-that-actually-returns-what-users-meant-4i9o).*
