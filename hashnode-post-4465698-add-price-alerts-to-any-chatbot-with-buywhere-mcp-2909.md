---
title: "Add Price Alerts to Any Chatbot with BuyWhere MCP"
slug: "add-price-alerts-to-any-chatbot-with-buywhere-mcp-2909"
tags: "mcp, aiagents, ecommerce, developers"
domain: "buywhere.hashnode.dev"
canonical: "https://dev.to/buywhere/add-price-alerts-to-any-chatbot-with-buywhere-mcp-2909"
enableToc: true
subtitle: "The pattern   Every chat platform gives you the same three primitives:   An inbound webhook..."
seoTitle: "Add Price Alerts to Any Chatbot with BuyWhere MCP"
seoDescription: "The pattern   Every chat platform gives you the same three primitives:   An inbound webhook..."
---
## The pattern

Every chat platform gives you the same three primitives:

1. An inbound webhook with the sender's message
2. A way to reply (push or reply-to)
3. Some notion of identity you can key alerts on

So the shopping logic can be one function: `handleMessage(userId, text)`.

```python
def handle_message(user_id, text):
    mcp = mcp_client("https://mcp.buywhere.ai")

    if text.startswith("/watch"):
        _, url = text.split(maxsplit=1)
        product = mcp.call("extract_product", {"url": url})
        mcp.call("create_price_alert", {
            "product_id": product["id"],
            "target_price": product["current_price"] * 0.9,
            "user_ref": user_id,
        })
        return f"Watching {product['title']} — I'll ping you at 10% off."

    results = mcp.call("search_products", {"query": text, "limit": 3})
    return "\n".join(
        f"{r['title']} — {r['best_price']} at {r['best_merchant']}"
        for r in results
    )
```

## Why target 10% off, not a fixed number

The `best_price_history` tool returns a price series. A 10%-below-current target clears in ~40% of cases within two weeks for consumer electronics; fixed round numbers ("under $50") sit far outside the realistic band and never fire. Anchor alerts to the history, not to vibes.

## Alert delivery

`list_price_alerts(user_ref=...)` returns triggered alerts. Run it on a cron (every 15 min is plenty), then map each triggered alert back to your platform's reply API. That's the whole integration — everything platform-specific lives in two calls: your webhook and your reply.

## Try it

MCP endpoint: `https://mcp.buywhere.ai` — the same tools used above. Previous posts in this series cover Telegram, Discord, and Slack builds in full.
