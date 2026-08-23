---
title: "Build a Telegram Price-Comparison Bot with BuyWhere MCP"
slug: "build-a-telegram-price-comparison-bot-with-buywhere-mcp-43hc"
tags: "mcp, aiagents, ecommerce, python"
domain: "buywhere.hashnode.dev"
canonical: "https://dev.to/buywhere/build-a-telegram-price-comparison-bot-with-buywhere-mcp-43hc"
enableToc: true
subtitle: "Build a Telegram bot that compares product prices across SG, MY, TH, and US markets using BuyWhere MCP."
seoTitle: "Build a Telegram Price-Comparison Bot with BuyWhere MCP"
seoDescription: "Build a Telegram bot that compares product prices across SG, MY, TH, and US markets using BuyWhere MCP."
---
You built a Discord bot. You built a Slack bot. But your users live in Telegram — especially in Southeast Asia, where Telegram is a primary messaging surface.

This post closes the series: a Telegram bot that takes any product query and replies with the best cross-market price, live.

## What we're building

```plaintext
User: /best iPhone 17 Pro 256GB
Bot:  🏆 Best: S$1,549 (SG, Lazada) — verified seller
      📊 Cross-market: MY S$1,520 · TH S$1,598 · US S$1,499 +S$35 ship
      🔗 https://...
```

~100 lines of Python. Runs on any VPS or Railway service.

## Prerequisites

```bash
pip install buywhere-mcp python-telegram-bot
```

- BuyWhere API key: [api.buywhere.ai](https://api.buywhere.ai) (free tier)
- Telegram bot token: message [@BotFather](https://t.me/BotFather)

## Step 1 — The handler

```python
import os
from telegram import Update
from telegram.ext import ApplicationBuilder, CommandHandler, ContextTypes
from buywhere import MCPClient

client = MCPClient()  # BUYWHERE_API_KEY env var

async def best(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    query = " ".join(ctx.args)
    if not query:
        await update.message.reply_text("Usage: /best <product query>")
        return

    results = client.search_products(
        query=query, markets=["SG", "MY", "TH", "US"], limit=3
    )
    if not results:
        await update.message.reply_text(f"No listings found for '{query}'.")
        return

    ranked = sorted(results, key=lambda r: r["price"] / r.get("fx", 1))
    top = ranked[0]
    await update.message.reply_text(
        f"🏆 Best: {top['price']} {top['currency']} ({top['market']})\n"
        f"🔗 {top['url']}"
    )

app = ApplicationBuilder().token(os.environ["TELEGRAM_BOT_TOKEN"]).build()
app.add_handler(CommandHandler("best", best))
app.run_polling()
```

## Step 2 — Cross-market table command

```python
async def compare(update, ctx):
    query = " ".join(ctx.args)
    results = client.search_products(query=query, markets=["SG", "MY", "TH", "US"], limit=12)

    lines = []
    for market in ["SG", "MY", "TH", "US"]:
        mr = [r for r in results if r["market"] == market]
        if mr:
            low = min(mr, key=lambda r: r["price"])
            lines.append(f"{market}: {low['price']} {low['currency']}")

    await update.message.reply_text("\n".join(lines) or "No listings found.")

app.add_handler(CommandHandler("compare", compare))
```

## Step 3 — Guard against stale prices

Every BuyWhere result carries `price_updated_at`. Skip listings older than 24h so your bot never quotes yesterday's price:

```python
from datetime import datetime, timedelta, timezone

def fresh(r, max_hours=24):
    ts = datetime.fromisoformat(r["price_updated_at"].replace("Z", "+00:00"))
    return (datetime.now(timezone.utc) - ts) <= timedelta(hours=max_hours)

results = [r for r in results if fresh(r)]
```

## Deployment

Same pattern as the Slack bot: wrap in a systemd service or deploy to Railway, set `BUYWHERE_API_KEY` and `TELEGRAM_BOT_TOKEN`, and you're live. `run_polling()` needs no inbound webhook, so no domain or TLS setup required.

## What's next

- Inline query mode (type `@yourbot iphone` in any chat)
- Price-watch subscriptions with the alert-engine pattern from the previous post
- Group mode: anyone in a group chat can invoke `/best`

The full code is on GitHub. Link in comments.

---

*This is part of the "BuyWhere MCP in practice" series. Previous posts covered
[Discord shopping bots](https://dev.to/buywhere/build-a-discord-shopping-bot-in-30-minutes-with-buywhere-mcp-45pn),
[Slack deal-alert bots](https://dev.to/buywhere/build-a-slack-deal-alert-bot-with-buywhere-mcp-4ol0),
[cross-border comparison](https://dev.to/buywhere/cross-border-price-comparison-with-buywhere-mcp-a-singapore-asia-perspective-4o8b),
and [real-time price alerts](https://dev.to/buywhere/build-a-real-time-price-alert-engine-with-buywhere-mcp-5315).*
