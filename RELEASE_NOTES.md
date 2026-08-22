# @buywhere/mcp-server v1.1.0

Released: 2026-06-25

## Changes

- **Klarna Agentic Product Protocol integration** — New `src/klarna-adapter.ts` module merges US product search results from Klarna's agentic commerce API into BuyWhere MCP tools.
  - `search_products` — Klarna US results merge inline when `country=us` and `KLARNA_API_TOKEN` is set
  - `get_product` — Routes `krn:kpdc:product:*` IDs to Klarna API
  - `find_best_price` — Klarna-first short-circuit for US queries
  - All Klarna results tagged with `source: "klarna"` provenance
  - Non-fatal degradation if `KLARNA_API_TOKEN` is absent

- **README** — Added Klarna integration section with configuration docs and badge

## Built on Klarna Agentic Product Protocol

This integration uses the Klarna Agentic Product Protocol API (v2) for US product search.
