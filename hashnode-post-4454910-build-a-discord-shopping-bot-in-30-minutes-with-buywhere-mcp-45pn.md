---
title: "Build a Discord Shopping Bot in 30 Minutes with BuyWhere MCP"
slug: "build-a-discord-shopping-bot-in-30-minutes-with-buywhere-mcp-45pn"
tags: "mcp, aiagents, ecommerce, developers"
domain: "buywhere.hashnode.dev"
canonical: "https://dev.to/buywhere/build-a-discord-shopping-bot-in-30-minutes-with-buywhere-mcp-45pn"
enableToc: true
subtitle: "Wire up the BuyWhere MCP server to a Discord bot in 30 minutes. Give your community real-time product search, best-price lookup, and price comparisons with no scraping."
seoTitle: "Build a Discord Shopping Bot in 30 Minutes with BuyWhere MCP"
seoDescription: "Wire up the BuyWhere MCP server to a Discord bot in 30 minutes. Give your community real-time product search, best-price lookup, and price comparisons with no scraping."
---
## Body

Imagine your Discord community asking "what's the best price for an RTX 5090 right now?" and getting an answer in under 5 seconds — with live data, not a web search. That's what a BuyWhere-powered Discord bot looks like.

In this tutorial, you'll wire up the BuyWhere MCP server to a Discord bot and give it product search, price comparison, and `find_best_price` capabilities. No scraping, no Selenium, no proxies — just the MCP protocol and about 30 minutes of your time.

## What You'll Need

- Node.js 18+ or Python 3.10+
- A Discord application ([discord.com/developers](https://discord.com/developers))
- A BuyWhere API key (free at [buywhere.ai](https://buywhere.ai))
- Python with `discord.py` or the Node.js Discord.js SDK

## Step 1: Set Up the BuyWhere MCP Connection

The BuyWhere MCP server exposes a standardized tool surface. The key tools for a shopping bot:

```python
import subprocess

def call_mcp_tool(tool_name, arguments):
    """Call a tool on the BuyWhere MCP server via stdio."""
    request = {
        "jsonrpc": "2.0",
        "id": 1,
        "method": "tools/call",
        "params": {
            "name": tool_name,
            "arguments": arguments
        }
    }
    result = subprocess.run(
        ["npx", "-y", "@buywhere/mcp-server"],
        input=json.dumps(request),
        capture_output=True,
        text=True
    )
    return json.loads(result.stdout)

# Example: search for laptops
search_results = call_mcp_tool("search", {
    "query": "RTX 5090 laptop",
    "top_k": 5,
    "country": "US"
})
```

## Step 2: Build the Discord Bot

```python
import discord
import json
import subprocess

intents = discord.Intents.default()
intents.message_content = True
client = discord.Client(intents=intents)

@client.event
async def on_message(message):
    # Ignore bot messages
    if message.author == client.user:
        return

    if message.content.startswith("!price "):
        query = message.content[7:].strip()
        await message.channel.send(f"🔍 Searching for '{query}'...")

        results = call_mcp_tool("search", {
            "query": query,
            "top_k": 5,
            "country": "US"
        })

        if not results.get("data", {}).get("products"):
            await message.channel.send("❌ No results found.")
            return

        embed = discord.Embed(
            title=f"Results for: {query}",
            color=0x00BFFF
        )

        for product in results["data"]["products"][:5]:
            price = product.get("min_price", "N/A")
            merchant = product.get("source", "Multiple")
            url = product.get("url", "#")
            embed.add_field(
                name=product.get("name", "Product")[:60],
                value=f"💰 ${price} ({merchant})\n[Link]({url})",
                inline=False
            )

        await message.channel.send(embed=embed)

    if message.content.startswith("!best "):
        query = message.content[6:].strip()
        await message.channel.send(f"🎯 Finding best price for '{query}'...")

        best = call_mcp_tool("find_best_price", {
            "product_name": query,
            "country": "US"
        })

        if best.get("data"):
            d = best["data"]
            await message.channel.send(
                f"🏆 Best price for **{query}**:\n"
                f"💵 **${d.get('price', 'N/A')}** at *{d.get('source', 'Unknown')}*\n"
                f"📍 Country: {d.get('country', 'US')} | Freshness: {d.get('currency', '')}\n"
                f"🔗 {d.get('url', '#')}"
            )
        else:
            await message.channel.send("❌ Could not find a best price.")

client.run("YOUR_DISCORD_BOT_TOKEN")
```

## Step 3: Add It to Your Server

1. Go to [discord.com/developers](https://discord.com/developers)
2. Create a new application → Bot
3. Enable **Message Content Intent** in the Bot settings
4. Generate an invite URL with permissions: `Send Messages`, `Embed Links`, `Read Message History`
5. Add the bot to your server

## Step 4: Run It

```bash
export BUYWHERE_API_KEY="your_key_here"
python discord_bot.py
```

## What Your Community Gets

| Command | What Happens |
|---------|-------------|
| `!price RTX 5090` | Top 5 live results with prices and merchant names |
| `!best iPhone 16 Pro` | Best current price across all tracked merchants |
| `!search gaming monitor 144hz` | Paginated product search with live data |

Behind the scenes, BuyWhere is keeping product data fresh via continuous ingestion from 890K+ merchant feeds — so your bot answers are grounded in real prices, not cached results from days ago.

## Going Further

- **Slash commands**: Migrate from `!` prefix to Discord slash commands for a cleaner UX
- **Thread auto-creation**: Use `deliver_to` to create a Discord thread per product comparison
- **Price alerts**: Store user queries and poll `find_best_price` periodically — notify when prices drop
- **Multi-country**: Pass `country=SG` or `country=MY` for regional results — useful for Southeast Asian communities

## Code Repository

Full working example: [github.com/buywhere/discord-shopping-bot](https://github.com/buywhere/discord-shopping-bot)

The MCP server handles all the hard parts — price normalization, merchant deduplication, freshness scoring — so your bot code stays thin and maintainable.
