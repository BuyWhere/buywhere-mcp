---
title: "Build a Telegram bot that compares prices across Shopee, Lazada, and Amazon"
slug: "build-a-telegram-bot-that-compares-prices-across-shopee-lazada-and-amazon-2pdm"
tags: "ai, mcp, python, telegram"
domain: "buywhere.hashnode.dev"
canonical: "https://dev.to/buywhere/build-a-telegram-bot-that-compares-prices-across-shopee-lazada-and-amazon-2pdm"
enableToc: true
subtitle: "Shopping across multiple platforms is tedious. Shopee has good prices on some things, Lazada on..."
seoTitle: "Build a Telegram bot that compares prices across Shopee, Lazada, and Amazon"
seoDescription: "Shopping across multiple platforms is tedious. Shopee has good prices on some things, Lazada on..."
---
Shopping across multiple platforms is tedious. Shopee has good prices on some things, Lazada on others, Amazon wins on electronics. But comparing manually takes time.

A Telegram bot fixes this. Give it a product name, it searches across all three platforms, and returns the cheapest option — with a direct affiliate link so the purchase is tracked.

This post builds that bot in under 100 lines of Python using the BuyWhere MCP server and the Telegram Bot API.

## What you need

1. **BuyWhere MCP server** — searches across Shopee, Lazada, Amazon, Qoo10, and others in one call
2. **Telegram Bot** — created via [@BotFather](https://t.me/BotFather)
3. **Python 3.10+** — the runtime

## Step 1: Create your Telegram bot

1. Open Telegram and message [@BotFather](https://t.me/BotFather)
2. Send `/newbot`
3. Follow the prompts — give it a name and username
4. Copy the API token it gives you

Keep the token private. You'll pass it as an environment variable.

## Step 2: Install dependencies

```bash
pip install python-telegram-bot buywhere-mcp
```

Or if you prefer the MCP server directly:

```bash
npx -y @buywhere/mcp-server
```

For this post we'll use the Python MCP client.

## Step 3: The bot code

```python
import os
import re
import subprocess
import json
from telegram import Update
from telegram.ext import (
    Application, CommandHandler, MessageHandler,
    filters, ContextTypes
)

# Load your bot token from environment
TELEGRAM_TOKEN = os.environ["TELEGRAM_BOT_TOKEN"]

def search_products(query: str, country: str = "SG") -> list[dict]:
    """Search products via BuyWhere MCP server."""
    result = subprocess.run(
        [
            "npx", "-y", "@buywhere/mcp-server",
            "search",
            "--query", query,
            "--country", country.lower(),
            "--limit", "10"
        ],
        capture_output=True, text=True, timeout=30
    )
    if result.returncode != 0:
        return []
    try:
        data = json.loads(result.stdout)
        products = data.get("products", data.get("data", []))
        return products
    except json.JSONDecodeError:
        return []

def format_price(product: dict) -> str:
    """Extract formatted price from product."""
    price_field = product.get("price", {})
    if isinstance(price_field, dict):
        amount = price_field.get("amount")
        currency = price_field.get("currency", "SGD")
    else:
        amount = price_field
        currency = "SGD"

    if amount is None:
        return "Price unavailable"

    symbol = "S$" if currency == "SGD" else ("$" if currency == "USD" else currency)
    return f"{symbol}{amount:,.2f}"

def product_to_message(product: dict, index: int) -> str:
    """Format a product result as a Telegram message."""
    name = product.get("name", product.get("title", "Unknown product"))
    # Truncate long names
    if len(name) > 60:
        name = name[:57] + "..."

    price = format_price(product)
    merchant = product.get("merchantName", product.get("merchant", "Unknown merchant"))
    url = product.get("url", product.get("productUrl", ""))

    # Use /r/ redirect for affiliate tracking
    redirect_url = f"https://buywhere.ai/r/direct/{product.get('merchantId', '')}?pathname=/telegram-search"

    lines = [
        f"{index}. {name}",
        f"   💰 {price} @ {merchant}",
        f"   🔗 {redirect_url}",
    ]
    return "\n".join(lines)

def build_response(query: str, products: list[dict]) -> str:
    """Build the full response message."""
    header = f"🔍 Results for *\"{query}\"*:\n"

    if not products:
        return (
            f"🔍 Results for *\"{query}\"*:\n\n"
            "No products found. Try a different search term."
        )

    lines = [header]
    for i, product in enumerate(products[:5], 1):
        lines.append(product_to_message(product, i))

    footer = (
        f"\n_Showing top 5 of {len(products)} results. "
        "Prices updated in real-time via BuyWhere MCP._"
    )
    lines.append(footer)

    return "\n".join(lines)

async def start_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle /start command."""
    await update.message.reply_text(
        "👋 Welcome to PriceBot!\n\n"
        "Send me any product name and I'll search across "
        "Shopee, Lazada, Amazon, and more — then show you the best deals.\n\n"
        "Try: *iPhone 16*, *Dyson V15*, *Nike shoes*\n\n"
        "_Powered by BuyWhere MCP_",
        parse_mode="Markdown"
    )

async def help_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle /help command."""
    await update.message.reply_text(
        "📖 *How to use PriceBot:*\n\n"
        "Just type any product name to search.\n\n"
        "Examples:\n"
        "• iPhone 16 256GB\n"
        "• Sony WH-1000XM5\n"
        "• Nintendo Switch 2\n\n"
        "I'll return the top 5 cheapest options across major marketplaces."
    )

async def search_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle text search queries."""
    query = update.message.text.strip()

    if len(query) < 3:
        await update.message.reply_text(
            "🔍 Please enter at least 3 characters to search."
        )
        return

    if len(query) > 100:
        await update.message.reply_text(
            "🔍 Search query too long. Try a shorter product name."
        )
        return

    # Let user know we're searching
    search_msg = await update.message.reply_text(
        f"🔍 Searching for \"{query}\"..."
    )

    # Run the search
    products = search_products(query)

    # Send results
    response = build_response(query, products)
    await update.message.reply_text(
        response,
        parse_mode="Markdown",
        disable_web_page_preview=True
    )

    # Delete the "searching" message
    try:
        await search_msg.delete()
    except Exception:
        pass

def main():
    """Run the bot."""
    print("Starting PriceBot...")

    app = Application.builder().token(TELEGRAM_TOKEN).build()

    # Add handlers
    app.add_handler(CommandHandler("start", start_command))
    app.add_handler(CommandHandler("help", help_command))
    app.add_handler(MessageHandler(
        filters.TEXT & ~filters.COMMAND,
        search_handler
    ))

    print("Bot is running. Press Ctrl+C to stop.")
    app.run_polling()

if __name__ == "__main__":
    main()
```

## Step 4: Run it

```bash
export TELEGRAM_BOT_TOKEN="your-token-here"
python price_bot.py
```

Your bot is now live. Message it from Telegram.

## What it looks like

Send: `MacBook Air M4`

Response:

```plaintext
🔍 Results for *"MacBook Air M4"*:

1. Apple MacBook Air 15 M4 24GB 512GB
   💰 S$2,249.00 @ Challengersg
   🔗 https://buywhere.ai/r/direct/12345

2. Apple MacBook Air 15 M4 16GB 256GB
   💰 S$2,049.00 @ BestBuy
   🔗 https://buywhere.ai/r/direct/67890

3. Apple MacBook Air 13 M4 16GB 256GB
   💰 S$1,849.00 @ Courts
   🔗 https://buywhere.ai/r/direct/11111
...
```

## Deployment

For a persistent bot, deploy it to:

- **Railway** — `pip install -r requirements.txt`, set the env var, deploy
- **Fly.io** — `fly launch`, set secrets, `fly deploy`
- **A Raspberry Pi at home** — `systemd` service, always on

The bot needs no database. Each search is stateless.

## Adding country support

The bot defaults to Singapore. Add country selection:

```python
COUNTRY_MAP = {
    "🇸🇬": "SG",
    "🇲🇾": "MY",
    "🇺🇸": "US",
    "🇬🇧": "UK",
}

async def country_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    keyboard = [
        [InlineKeyboardButton(flag, callback_data=code)]
        for flag, code in COUNTRY_MAP.items()
    ]
    reply_markup = InlineKeyboardMarkup(keyboard)
    await update.message.reply_text(
        "🌍 Select your country:",
        reply_markup=reply_markup
    )
```

Users pick their country once, and all subsequent searches use it.

## What BuyWhere adds

Without BuyWhere, the bot would need separate API calls to each platform:

- Shopee API (requires authentication, rate-limited)
- Lazada API (requires platform contract)
- Amazon API (Product Advertising API, requires approval)
- Qoo10 API (different auth format)

The MCP server normalizes all of this into one query and returns structured results. Your bot code stays simple.

## Get the MCP server

```bash
npx -y @buywhere/mcp-server

# Or the Python package
pip install buywhere-mcp
```

The bot runs the MCP server as a subprocess on each search — no long-running daemon needed.

---

*This is part of a series on building AI shopping agents with BuyWhere MCP. Previous posts covered the MCP server basics, connecting Claude to a real product catalog, building a ReAct shopping agent, and price tracking with cron jobs.*

**Series:**
1. [BuyWhere MCP — give your agent a real product catalog, not just an Amazon buy link](/buywhere/buywhere-mcp-give-your-agent-a-real-product-catalog-not-just-an-amazon-buy-link-300a)
2. [What I accidentally built when I connected Claude to a product catalog](/buywhere/what-i-accidentally-built-when-i-connected-claude-to-a-product-catalog-4lpi)
3. [Build a price-tracking agent in 50 lines with the BuyWhere MCP](/buywhere/build-a-price-tracking-agent-in-50-lines-with-the-buywhere-mcp-4lea)
4. [Build an AI shopping agent that actually buys things with LangGraph and BuyWhere MCP](/buywhere/build-an-ai-shopping-agent-that-actually-buys-things-with-langgraph-and-buywhere-mcp-213g)
5. [Build a Gaming Laptop Price Tracker for Singapore with BuyWhere MCP](/buywhere/build-a-gaming-laptop-price-tracker-for-singapore-with-buywhere-mcp-1gd5)
