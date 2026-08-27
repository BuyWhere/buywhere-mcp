---
title: "Build a price-tracking agent in 50 lines with the BuyWhere MCP"
slug: "build-a-price-tracking-agent-in-50-lines-with-the-buywhere-mcp-4lea"
tags: "mcp, python, tutorial, automation"
domain: "buywhere.hashnode.dev"
canonical: "https://dev.to/buywhere/build-a-price-tracking-agent-in-50-lines-with-the-buywhere-mcp-4lea"
enableToc: true
subtitle: "Build a price-tracking agent in 50 lines with the BuyWhere MCP   Last month I was hunting..."
seoTitle: "Build a price-tracking agent in 50 lines with the BuyWhere MCP"
seoDescription: "Build a price-tracking agent in 50 lines with the BuyWhere MCP   Last month I was hunting..."
---
# Build a price-tracking agent in 50 lines with the BuyWhere MCP

Last month I was hunting for an OLED monitor. I checked Amazon, Best Buy, and B&H Photo every day for two weeks. I missed three price drops because they happened between my checks.

I fixed that by spending 20 minutes building a price-tracking agent. Now it emails me when anything on my watchlist drops below my target price. Here's exactly how to build it.

## What you're building

A daily cron that:
1. Pulls your watchlist from a simple JSON file
2. Checks current prices via the BuyWhere MCP `search_prices` tool
3. Emails you if any item is below its target price

The whole thing is ~50 lines of Python. No infrastructure, no scraping, no rate-limit headaches.

## Prerequisites

- [BuyWhere API key](https://buywhere.ai/api-keys) (free tier: 1,000 calls/month)
- Claude Desktop or Cursor with [BuyWhere MCP installed](https://buywhere.ai/developers)
- Python 3.10+
- `pip install sendgrid` (or any email lib)

## Step 1 — Set up your watchlist

```json
// watchlist.json
[
  { "item": "LG C4 65 inch OLED", "country": "US", "target": 1200 },
  { "item": "Sony WH-1000XM5", "country": "SG", "target": 280 },
  { "item": "MacBook Air M3 13", "country": "US", "target": 900 }
]
```

Target prices are in the country's local currency (USD for US, SGD for SG).

## Step 2 — The tracking script

```python
import json, smtplib
from email.mime.text import MIMEText
from buywhere import BuyWhereClient  # MCP client or REST wrapper

client = BuyWhereClient()  # reads BUYWHERE_API_KEY from env

with open("watchlist.json") as f:
    watchlist = json.load(f)

alerts = []
for entry in watchlist:
    results = client.search_prices(
        query=entry["item"],
        country=entry["country"],
        limit=3
    )
    cheapest = results[0]
    if cheapest["price"] <= entry["target"]:
        alerts.append(
            f"✅ {entry['item']} is now "
            f"${cheapest['price']} ({cheapest['currency']}) at "
            f"{cheapest['retailer']} — below your target of "
            f"${entry['target']}\n{cheapest['url']}"
        )
    else:
        alerts.append(
            f"⏳ {entry['item']}: cheapest is "
            f"${cheapest['price']} at {cheapest['retailer']} "
            f"(target: ${entry['target']})"
        )

if alerts:
    msg = MIMEText("\n\n".join(alerts))
    msg["Subject"] = f"Price watch — {len(alerts)} items"
    with smtplib.SMTP("smtp://smtp.sendgrid.net", 587) as s:
        s.login("apikey", os.environ["SENDGRID_API_KEY"])
        s.sendmail("watcher@yourdomain.com", "you@example.com", msg.as_string())
```

## Step 3 — Wire it to a daily cron

```bash
# Run every day at 8am
0 8 * * * cd /path/to/price-watcher && python track.py >> /var/log/price-watch.log 2>&1
```

That's it. Deploy it on a $5 VPS, a Render worker, or run it locally if you're okay with occasional sleep-in.

## How the MCP tools make this work

The BuyWhere MCP gives you three tools for this:

| Tool | Use case |
|------|----------|
| `search_prices` | Free-text query → ranked results with prices + URLs |
| `compare_product` | Exact product → canonical SKU → prices across ALL retailers |
| `list_cheapest` | Category-level → top N cheapest in a country |

For a watchlist, `search_prices` with the product name gets you the cheapest option fast. If you need retailer-by-retailer breakdowns (e.g. "is Amazon cheaper than Best Buy?"), use `compare_product` instead.

## The `/r/` affiliate path for commerce agents

If you're building a commerce-facing agent — a deal hunter, a shopping assistant, a price comparison bot — every product link from BuyWhere includes an `/r/` affiliate redirect:

```plaintext
https://buywhere.ai/r/direct/{product_id}?source=agent&k={tracking_key}
```

This is how BuyWhere funds itself: when your agent's users click through and buy, BuyWhere earns a commission. The `/r/` path is already wired for affiliate tracking; you just pass it through from the search result.

## What you get with the free tier

| | Free | Pro |
|-|------|-----|
| API calls/month | 1,000 | 10,000 |
| Countries | 4 | 9 |
| `search_prices` | ✅ | ✅ |
| `compare_product` | ✅ | ✅ |
| `list_cheapest` | ✅ | ✅ |
| Affiliate tracking | ✅ | ✅ |

For a personal price watcher on a handful of items, the free tier is plenty. You'd burn ~3 calls per watchlist item per check. With a daily cron on 10 items, that's 30 calls/day, or ~900/month.

## What to add next

Once the basics work, the obvious upgrades:

- **Slack/Discord webhook** instead of email — easier to act on a notification that lands in a channel
- **Price history** — store each check in SQLite, plot 30-day trends with matplotlib
- **Retailer filtering** — some retailers are more reliable for certain categories (B&H for cameras, Best Buy for TVs)
- **Multi-country arbitrage** — same product, SG vs US vs MY price, useful for electronics where regional pricing varies wildly

The code above is the starting point. Everything else is obvious incremental additions.

---

*Get started: [buywhere.ai/api-keys](https://buywhere.ai/api-keys) | Docs: [buywhere.ai/developers](https://buywhere.ai/developers) | npm: `npm i @buywhere/mcp-server`*
