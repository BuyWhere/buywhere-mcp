---
title: "10 Ready-to-Use MCP Prompts for AI Shopping Agents"
slug: "10-ready-to-use-mcp-prompts-for-ai-shopping-agents-34d1"
tags: "mcp, ai, prompts, productivity"
domain: "buywhere.hashnode.dev"
canonical: "https://dev.to/buywhere/10-ready-to-use-mcp-prompts-for-ai-shopping-agents-34d1"
enableToc: true
subtitle: "When you connect BuyWhere MCP to Claude Desktop, Cursor, or any Claude Code client, a whole world of..."
seoTitle: "10 Ready-to-Use MCP Prompts for AI Shopping Agents"
seoDescription: "When you connect BuyWhere MCP to Claude Desktop, Cursor, or any Claude Code client, a whole world of..."
---
When you connect BuyWhere MCP to Claude Desktop, Cursor, or any Claude Code client, a whole world of shopping automation opens up. Here are 10 prompts that work right now.

## 1. Product Search

> "Find me the cheapest PlayStation 5 disc edition in Singapore. Show price, merchant, and URL."

Returns live prices across FairPrice, Lazada, Shopee, Courts, Challenger, Best Denki, and Harvey Norman.

## 2. Price Comparison

> "Compare prices for iPhone 16 Pro 256GB across all Singapore merchants. Which is cheapest with delivery?"

BuyWhere hits each merchant's API in real time — not cached data.

## 3. Deal Hunting

> "What are the best deals on 4K TVs under SGD 1,000 in Singapore right now?"

Filters by your budget and returns only in-stock items with current promotions.

## 4. Cross-Border Arbitrage

> "Find the price difference for Sony WH-1000XM5 between SG and US merchants. Which is cheaper including estimated shipping?"

BuyWhere covers both Singapore (FairPrice, Lazada, Shopee) and US (Amazon, Walmart, Best Buy) merchants.

## 5. Multi-Product Basket

> "I need: Nintendo Switch OLED + Mario Kart 8 + a 128GB microSD card. Find me the cheapest total basket across all merchants."

The agent finds each item across every merchant and computes the cheapest combined basket.

## 6. Price Alerts

> "Check if PS5 Digital Edition has dropped below SGD 650. If so, alert me."

Run this in a recurring Claude Code loop for automated price monitoring.

## 7. Merchant Comparison

> "Which Singapore merchant has the best overall prices on electronics? Compare 5 random products across Lazada and Shopee."

Useful for deciding where to shop for a whole cart.

## 8. Product Discovery

> "Show me trending products under SGD 50 in Singapore. New arrivals from FairPrice and Cold Storage."

Discovers new products matching your criteria.

## 9. Nutrition/Spec Comparison

> "Compare the specs and prices of MacBook Air M4 and MacBook Pro M4 across all merchants. Build a comparison table."

Your agent returns structured data ready to render as a table.

## 10. Automated Shopping Report

> "Every morning at 9 AM, check if milk, eggs, and bread are cheapest at FairPrice or Cold Storage today. Summarize in a table."

Set this up as a Claude Code scheduled task with BuyWhere MCP.

---

## Get Started

1. `npx @buywhere/mcp-server` in your MCP config
2. Get a free API key at [buywhere.ai/api-keys](https://buywhere.ai/api-keys)
3. Try any prompt above

**npm:** `@buywhere/mcp-server` | **Docs:** [docs.buywhere.ai](https://docs.buywhere.ai) | **GitHub:** [github.com/BuyWhere/buywhere-mcp](https://github.com/BuyWhere/buywhere-mcp)
