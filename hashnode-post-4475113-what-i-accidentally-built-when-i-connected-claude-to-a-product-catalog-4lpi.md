---
title: "What I Accidentally Built When I Connected Claude to a Product Catalog"
slug: "what-i-accidentally-built-when-i-connected-claude-to-a-product-catalog-4lpi"
tags: "mcp, ai, automation"
domain: "buywhere.hashnode.dev"
canonical: "https://dev.to/buywhere/what-i-accidentally-built-when-i-connected-claude-to-a-product-catalog-4lpi"
enableToc: true
subtitle: "I wanted to build a simple price comparison tool. What I ended up with made me rethink how AI agents..."
seoTitle: "What I Accidentally Built When I Connected Claude to a Product Catalog"
seoDescription: "I wanted to build a simple price comparison tool. What I ended up with made me rethink how AI agents..."
---
I wanted to build a simple price comparison tool. What I ended up with made me rethink how AI agents interact with the real world.

Every AI assistant I tried had the same blind spot. Ask it "what is the cheapest iPhone 17 in Singapore right now?" and it would hallucinate a price or tell you to check Amazon.

I wanted an AI that could actually look at real prices across real stores and give me a straight answer.

## What is an MCP Server?

Model Context Protocol (MCP) lets AI models call external tools. Think of it as a USB port for AI. Plug in an MCP server, and suddenly your AI can search databases, query APIs, and interact with the real world.

An MCP server exposes tools. Each tool has a name, description, and input schema. The AI reads these schemas and decides which tool to call.

## Here is What I Built

I connected Claude to a product catalog spanning electronics markets across the US and Southeast Asia. The MCP server exposes seven tools: search products, get product details, compare, find the best price, get deals, list categories, and ingest.

I asked: "Find the cheapest AirPods Pro 2 in Singapore." Claude searched, ranked results by price, and presented three options across real storefronts with current prices. Total time: about eight seconds.

## Keep Tool Schemas Tight

Every MCP server you connect adds tokens to your context window. Seven tools add a few thousand tokens. That sounds small until you connect five servers and suddenly burn 20,000+ tokens before your first question. Keep your schemas tight and your tool count lean.

## What I Would Do Differently

1. Start with 3 tools, not 7.
2. Build distribution before content.
3. Measure what matters.
