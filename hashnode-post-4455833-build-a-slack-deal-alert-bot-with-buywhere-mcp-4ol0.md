---
title: "Build a Slack Deal-Alert Bot with BuyWhere MCP"
slug: "build-a-slack-deal-alert-bot-with-buywhere-mcp-4ol0"
tags: "mcp, aiagents, ecommerce, developers"
domain: "buywhere.hashnode.dev"
canonical: "https://dev.to/buywhere/build-a-slack-deal-alert-bot-with-buywhere-mcp-4ol0"
enableToc: true
subtitle: "A Slack channel that pings you when \"RTX 5090\" drops below $1,800 — wired up in under 30 minutes. No..."
seoTitle: "Build a Slack Deal-Alert Bot with BuyWhere MCP"
seoDescription: "A Slack channel that pings you when \"RTX 5090\" drops below $1,800 — wired up in under 30 minutes. No..."
---
A Slack channel that pings you when "RTX 5090" drops below $1,800 — wired up in under 30 minutes. No scraping, no proxies, no Selenium. Just the BuyWhere MCP server, a Slack incoming webhook, and a short Python script.

In this tutorial, you'll build a deal-alert bot that polls the BuyWhere `find_best_price` tool on a schedule, compares the current price to a threshold, and posts a Slack message the moment a deal crosses your line. Same MCP primitives as the Discord tutorial, but the Slack angle is alerting rather than conversational — which is what most shopping communities actually want.

## What You'll Need

- Python 3.10+ (or Node.js 18+)
- A Slack workspace with permission to add an incoming webhook ([api.slack.com/messaging/webhooks](https://api.slack.com/messaging/webhooks))
- A BuyWhere API key (free at [buywhere.ai](https://buywhere.ai))
- A list of products + thresholds you care about

## Step 1: Set Up the BuyWhere MCP Connection

The BuyWhere MCP server exposes a normalized price tool. For deal alerts, `find_best_price` is the workhorse:

```python
import subprocess, json

def call_mcp_tool(tool_name, arguments):
    """Call a tool on the BuyWhere MCP server via stdio."""
    request = {
        "jsonrpc": "2.0",
        "id": 1,
        "method": "tools/call",
        "params": {"name": tool_name, "arguments": arguments},
    }
    result = subprocess.run(
        ["npx", "-y", "@buywhere/mcp-server"],
        input=json.dumps(request),
        capture_output=True,
        text=True,
    )
    return json.loads(result.stdout)

# Example: best current price for an RTX 5090
best = call_mcp_tool("find_best_price", {
    "product_name": "RTX 5090",
    "country": "US",
})
print(best)
# => {"data": {"price": 1849.00, "source": "BestBuy", "currency": "USD", "url": "..."}}
```

## Step 2: Wire Up the Slack Webhook

Create an incoming webhook in your Slack workspace. Slack will give you a URL like `https://hooks.slack.com/services/T000/B000/XXXXX`. Store it as an env var:

```bash
export SLACK_WEBHOOK_URL="https://hooks.slack.com/services/T000/B000/XXXXX"
export BUYWHERE_API_KEY="your_key_here"
```

Then a one-call poster:

```python
import os, urllib.request, json

def post_to_slack(text):
    payload = {"text": text}
    req = urllib.request.Request(
        os.environ["SLACK_WEBHOOK_URL"],
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"},
    )
    with urllib.request.urlopen(req) as resp:
        return resp.status
```

## Step 3: Build the Alert Loop

```python
import time

WATCHLIST = [
    {"name": "RTX 5090",         "threshold": 1800.0, "country": "US"},
    {"name": "iPhone 16 Pro",    "threshold":  900.0, "country": "US"},
    {"name": "Sony WH-1000XM5",  "threshold":  280.0, "country": "US"},
    {"name": "LG C4 65\" OLED",  "threshold": 1700.0, "country": "US"},
]

POLL_INTERVAL_SECONDS = 60 * 30  # every 30 minutes

def check_and_alert():
    for item in WATCHLIST:
        result = call_mcp_tool("find_best_price", {
            "product_name": item["name"],
            "country": item["country"],
        }).get("data", {})
        price = result.get("price")
        source = result.get("source", "unknown")
        url = result.get("url", "")
        if price is not None and price <= item["threshold"]:
            msg = (
                f"🔥 *Deal alert*: `{item['name']}` is *${price}* at _{source}_\n"
                f"(threshold: ${item['threshold']}) → {url}"
            )
            post_to_slack(msg)
            print(f"alerted: {item['name']} @ ${price}")

if __name__ == "__main__":
    while True:
        try:
            check_and_alert()
        except Exception as e:
            print(f"loop error: {e}")
        time.sleep(POLL_INTERVAL_SECONDS)
```

## Step 4: Run It

```bash
export SLACK_WEBHOOK_URL="https://hooks.slack.com/services/..."
export BUYWHERE_API_KEY="..."
python slack_deal_alert.py
```

Drop this on any always-on host (a $5 VPS, a Raspberry Pi, or a Railway cron worker). The script is ~50 lines and only hits Slack when a deal actually fires, so it stays well under both the BuyWhere rate limit and Slack's webhook throttling.

## What You Get

| Channel behavior | Outcome |
|---|---|
| Every 30 min, polls `find_best_price` for each watchlist item | Fresh price data, no caching |
| Posts to Slack only when price ≤ threshold | Zero noise — only fires on real deals |
| Includes merchant + link | One-click to buy |
| Runs in the background forever | Set-and-forget |

## Going Further

- **Per-channel watchlists**: Read thresholds from a YAML file so each Slack channel can subscribe to different products
- **Daily digest mode**: When no deal fires, post a single "lowest price today" summary at 9am instead
- **Country segmentation**: Use `country=SG` / `country=MY` / `country=US` and route alerts to region-specific Slack channels
- **Block-style rich messages**: Slack Block Kit gives you a thumbnail + price history chart per alert
- **Discount %**: Compare `find_best_price` to a 30-day reference price to surface percentage drops, not just absolute thresholds

## Why This Works on Top of BuyWhere MCP

The MCP server handles all the hard parts — price normalization across 890K+ merchant feeds, currency conversion, freshness scoring, deduplication. Your bot code stays thin and maintainable. No scraping infra. No proxy rotation. No stale-cache debates. The price you alert on is the price a real merchant is charging right now.

## Code Repository

Full working example: [github.com/buywhere/slack-deal-alert-bot](https://github.com/buywhere/slack-deal-alert-bot)

The Discord bot tutorial is here if you want the conversational variant; the Slack alerting pattern above is what most shopping communities actually deploy first.
