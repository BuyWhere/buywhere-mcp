---
title: "Query BuyWhere MCP from curl — 13 tools, one JSON body"
slug: "query-buywhere-mcp-from-curl-13-tools-one-json-body-2h6n"
tags: "mcp, ai, api, python"
domain: "buywhere.hashnode.dev"
canonical: "https://dev.to/buywhere/query-buywhere-mcp-from-curl-13-tools-one-json-body-2h6n"
enableToc: true
subtitle: "Agents should not need an SDK to price-check a product. BuyWhere MCP is at..."
seoTitle: "Query BuyWhere MCP from curl — 13 tools, one JSON body"
seoDescription: "Agents should not need an SDK to price-check a product. BuyWhere MCP is at..."
---
Agents should not need an SDK to price-check a product. BuyWhere MCP is at `https://api.buywhere.ai/mcp` and answers JSON-RPC.

## One call

```bash
curl -s https://api.buywhere.ai/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"search_products","arguments":{"query":"macbook air m4","country":"SG"}}}'
```

Prices come back nested: `price.amount` + `price.currency`. Filter `currency == SGD` for Singapore. Flat price fields are a common client bug.

Live listings: Smithery (`smithery.ai/servers/BuyWhere/buywhere-mcp`) and Glama (`glama.ai/mcp/servers/BuyWhere/buywhere-mcp`).

Start with `search_products` then `get_product`. Do not scrape merchant HTML.
