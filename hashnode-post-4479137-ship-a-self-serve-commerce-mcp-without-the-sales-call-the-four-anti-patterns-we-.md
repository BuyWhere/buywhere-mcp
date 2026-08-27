---
title: "Ship a self-serve commerce MCP without the sales call: the four anti-patterns we removed"
slug: "ship-a-self-serve-commerce-mcp-without-the-sales-call-the-four-anti-patterns-we-removed-3ejp"
tags: "mcp, ai, opensource, claude"
domain: "buywhere.hashnode.dev"
canonical: "https://dev.to/buywhere/ship-a-self-serve-commerce-mcp-without-the-sales-call-the-four-anti-patterns-we-removed-3ejp"
enableToc: true
subtitle: "Agent-first self-serve for an MCP commerce API: 60-second key, three tools, 1,000 req/day free. What we removed and why."
seoTitle: "Ship a self-serve commerce MCP without the sales call: the four anti-patterns we removed"
seoDescription: "Agent-first self-serve for an MCP commerce API: 60-second key, three tools, 1,000 req/day free. What we removed and why."
---
A small write-up on what changed when we deleted every gate between an AI agent and a working commerce API.

If you wire Claude Desktop, Cursor, or any MCP-compatible runtime today, you can have BuyWhere returning real merchant data in under a minute:

```http
POST https://api.buywhere.ai/v1/auth/register
→ {"api_key": "bw_live_..."}

GET https://api.buywhere.ai/mcp
→ 3 tools, auto-discovered, free
```

Three tools: `search_catalog`, `lookup_merchant`, `normalize_product`. ~386M products and ~895K merchants across SG / MY / PH / AU, normalized across marketplaces. First 1,000 requests/day are free; above that, transparent per-tier pricing — no opaque 401s.

The four anti-patterns we deliberately don't ship:

1. **Sales-gated onboarding.** The agent waits for a human to approve an enterprise contract before the first `curl` returns data. We register programmatically; the key is live in the response.
2. **Unlisted endpoints.** REST exists but only MCP is documented (or vice versa, or both with stale examples). We document both surfaces in lockstep.
3. **Broken tier maps.** "Free: 10/day" on a docs page, "ERROR: quota exceeded" on the response. Our free tier is real: 1,000/day, no follow-up email required to verify.
4. **Opaque 401s.** Generic auth failure with no recipe. We return a registration recipe in the 401 body when no key is present.

For Claude Desktop specifically, drop this into `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "buywhere": {
      "command": "npx",
      "args": ["-y", "@buywhere/mcp"],
      "env": { "BUYWHERE_API_KEY": "<register from /v1/auth/register>" }
    }
  }
}
```

The full write-up of what changed, the trade-offs, and what we got wrong on the first three iterations is on our blog:
https://buywhere.ai/blog/true-zero-human-self-serve-mcp-2026?utm_source=devto&utm_medium=post&utm_campaign=zero-human-mcp-launch&from=dev-community

If you wire it and hit a real bug, I'd genuinely like to hear about it in the comments. Honest trade-offs are also on the post: 1,000/day is generous but not infinite, and enterprise scale (millions of calls/day, custom catalogs, contract-grade SLAs) still requires talking to us.

---

**Update (Aug 2026):** BuyWhere MCP is now live at [api.buywhere.ai/mcp](https://api.buywhere.ai/mcp) — self-serve, no sales call required. See the [full launch post](https://dev.to/buywhere/mcp-catalog-post) for details.

#mcp #ai #opensource #webdev
