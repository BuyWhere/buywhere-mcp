---
title: "Build a CLI tool that finds the best deals across marketplaces in real-time"
slug: "build-a-cli-tool-that-finds-the-best-deals-across-marketplaces-in-real-time-4cii"
tags: "ai, mcp, python, cli"
domain: "buywhere.hashnode.dev"
canonical: "https://dev.to/buywhere/build-a-cli-tool-that-finds-the-best-deals-across-marketplaces-in-real-time-4cii"
enableToc: true
subtitle: "Price comparison shouldn't require opening a dozen browser tabs.  A CLI tool fixes this. One command,..."
seoTitle: "Build a CLI tool that finds the best deals across marketplaces in real-time"
seoDescription: "Price comparison shouldn't require opening a dozen browser tabs.  A CLI tool fixes this. One command,..."
---
Price comparison shouldn't require opening a dozen browser tabs.

A CLI tool fixes this. One command, instant results from all major marketplaces, sorted by price — with affiliate links ready to click.

This post builds that tool in under 80 lines of Python using the BuyWhere MCP server.

## What you need

1. **BuyWhere MCP server** — searches across Shopee, Lazada, Amazon, Qoo10 in one call
2. **Python 3.10+** — the runtime

## The tool code

Create `price_finder.py`:

```python
#!/usr/bin/env python3
"""
price_finder.py — Find the cheapest prices across marketplaces.

Usage:
    python price_finder.py "macbook air m4" --country SG
    python price_finder.py "iphone 16" --limit 3 --currency USD
"""

import argparse
import json
import subprocess
from typing import List, Dict

def search_products(query: str, country: str = "SG", limit: int = 10) -> List[Dict]:
    """Search products via BuyWhere MCP server."""
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
        products = data.get("products", data.get("data", []))
        return products
    except json.JSONDecodeError:
        return []

def format_price(product: Dict) -> str:
    """Extract and format price from product."""
    price_field = product.get("price", {})
    if isinstance(price_field, dict):
        amount = price_field.get("amount")
        currency = price_field.get("currency", "SGD")
    else:
        amount = price_field
        currency = "SGD"
    
    if amount is None:
        return "Price unavailable"
    
    symbols = {"SGD": "S$", "USD": "$", "MYR": "RM", "GBP": "£"}
    symbol = symbols.get(currency, currency)
    return f"{symbol}{amount:,.2f}"

def print_results(products: List[Dict], query: str):
    """Print formatted results to stdout."""
    if not products:
        print(f"❌ No products found for \"{query}\"")
        return
    
    # Sort by price
    priced_products = []
    for p in products:
        price = p.get("price", {})
        if isinstance(price, dict) and price.get("amount"):
            priced_products.append((price["amount"], p))
    
    priced_products.sort(key=lambda x: x[0])
    
    print(f"\n🔍 Results for \"{query}\" ({len(products)} found):\n")
    
    for i, (price, product) in enumerate(priced_products[:10], 1):
        name = product.get("name", product.get("title", "Unknown"))
        merchant = product.get("merchantName", product.get("merchant", "Unknown"))
        url = product.get("url", product.get("productUrl", ""))
        
        # Truncate long names
        if len(name) > 55:
            name = name[:52] + "..."
        
        formatted_price = format_price(product)
        redirect_url = f"https://buywhere.ai/r/direct/{product.get('merchantId', '')}"
        
        print(f"{i}. {name}")
        print(f"   💰 {formatted_price} @ {merchant}")
        print(f"   🔗 {redirect_url}")
        print()

def main():
    parser = argparse.ArgumentParser(
        description="Find the cheapest prices across marketplaces",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python price_finder.py "macbook air m4" --country SG
  python price_finder.py "nintendo switch" --limit 5
  python price_finder.py "sony wh-1000xm5" --country MY
        """
    )
    
    parser.add_argument("query", help="Product to search for")
    parser.add_argument("--country", "-c", default="SG",
                       choices=["SG", "MY", "US", "UK"],
                       help="Country code (default: SG)")
    parser.add_argument("--limit", "-l", type=int, default=10,
                       help="Max results (default: 10)")
    
    args = parser.parse_args()
    
    products = search_products(args.query, args.country, args.limit)
    print_results(products, args.query)

if __name__ == "__main__":
    main()
```

## Make it executable

```bash
chmod +x price_finder.py
```

## Use it

```bash
# Search in Singapore
./price_finder.py "macbook air m4" --country SG

# Get top 3 results
./price_finder.py "iphone 16" --limit 3

# Search in Malaysia
./price_finder.py "ps5 pro" --country MY
```

## Example output

```bash
$ ./price_finder.py "sony wh-1000xm5" --country SG

🔍 Results for "sony wh-1000xm5" (5 found):

1. Sony WH-1000XM5 Wireless Noise Cancelling Headphones
   💰 S$449.00 @ Courts
   🔗 https://buywhere.ai/r/direct/12345

2. Sony WH-1000XM5 Headphones Black
   💰 S$459.00 @ Challenger
   🔗 https://buywhere.ai/r/direct/67890

3. Sony WH-1000XM5 - Silver
   💰 S$479.00 @ Best Denki
   🔗 https://buywhere.ai/r/direct/11111
```

## Add shell completion

Create `price_finder_completion.sh`:

```bash
#!/bin/bash
# Bash completion for price_finder.py

_price_finder_completion() {
    local cur="${COMP_WORDS[COMP_CWORD]}"
    local prev="${COMP_WORDS[COMP_CWORD-1]}"
    
    case "$prev" in
        --country|-c)
            COMPREPLY=($(compgen -W "SG MY US UK" -- "$cur"))
            ;;
        --limit|-l)
            COMPREPLY=($(compgen -W "5 10 20 50" -- "$cur"))
            ;;
        *)
            ;;
    esac
}

complete -F _price_finder_completion ./price_finder.py
```

Source it:

```bash
source price_finder_completion.sh
```

Now `Tab` completes country codes and limits.

## Add a global shortcut

 symlink to your path:

```bash
ln -s $(pwd)/price_finder.py ~/.local/bin/price-finder
```

Use from anywhere:

```bash
price-finder "nintendo switch" --country SG
```

## What makes this useful

- **Fast:** One command, instant results. No browser tabs.
- **Portable:** Works on Linux, macOS, Windows (WSL).
- **Scriptable:** Pipe results to other tools (`jq`, `awk`).
- **Always fresh:** Prices come from live catalog, not cached data.

## Integration ideas

```bash
# Find cheapest option, open directly
price-finder "macbook air m4" | head -5 | grep "https://" | xargs open

# Compare prices across countries
for country in SG MY US; do
    echo "--- $country ---"
    price-finder "ps5 pro" --country $country | head -3
done

# Watch for price drops (cron job)
price-finder "nintendo switch 2" > ~/ps5-prices.log
```

## Get the MCP server

```bash
npx -y @buywhere/mcp-server

# Or the Python package
pip install buywhere-mcp
```

The CLI tool runs the MCP server as a subprocess on each search — no daemon or database needed.

---

*This is part of a series on building AI shopping agents with BuyWhere MCP. Previous posts covered the MCP server basics, connecting Claude to a real product catalog, building a ReAct shopping agent, price tracking with cron jobs, a Telegram bot, and more.*

**Series:**
1. [BuyWhere MCP — give your agent a real product catalog, not just an Amazon buy link](/buywhere/buywhere-mcp-give-your-agent-a-real-product-catalog-not-just-an-amazon-buy-link-300a)
2. [What I accidentally built when I connected Claude to a product catalog](/buywhere/what-i-accidentally-built-when-i-connected-claude-to-a-product-catalog-4lpi)
3. [Build a price-tracking agent in 50 lines with the BuyWhere MCP](/buywhere/build-a-price-tracking-agent-in-50-lines-with-the-buywhere-mcp-4lea)
4. [Build an AI shopping agent that actually buys things with LangGraph and BuyWhere MCP](/buywhere/build-an-ai-shopping-agent-that-actually-buys-things-with-langgraph-and-buywhere-mcp-213g)
5. [Build a Gaming Laptop Price Tracker for Singapore with BuyWhere MCP](/buywhere/build-a-gaming-laptop-price-tracker-for-singapore-with-buywhere-mcp-1gd5)
6. [Build a Telegram bot that compares prices across Shopee, Lazada, and Amazon](/buywhere/build-a-telegram-bot-that-compares-prices-across-shopee-lazada-and-amazon-2pdm)
