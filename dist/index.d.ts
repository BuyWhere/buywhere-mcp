#!/usr/bin/env node
/**
 * BuyWhere MCP Server
 *
 * Exposes the BuyWhere product catalog as MCP tools so AI agents using
 * Claude Desktop, Cursor, Windsurf, or any MCP-compatible runtime can search
 * and retrieve products without writing HTTP glue code.
 *
 * Tools:
 *   search_products   — keyword / natural-language product search
 *   get_product       — fetch a single product by ID
 *   get_price         — compare prices for a product across all merchants
 *   compare_prices    — side-by-side comparison of 2–5 products
 *   get_affiliate_link — get the click-tracked affiliate URL for a product
 *   get_catalog       — list available product categories
 *
 * Resources:
 *   buywhere://catalog/{country}  — list available categories for a country
 *
 * Configuration (environment variables):
 *   BUYWHERE_API_KEY  (required) — your BuyWhere API key
 *   BUYWHERE_API_URL  (optional) — override base URL (default: https://api.buywhere.ai)
 */
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
export declare function createSandboxServer(): Server<{
    method: string;
    params?: {
        [x: string]: unknown;
        _meta?: {
            [x: string]: unknown;
            progressToken?: string | number | undefined;
        } | undefined;
    } | undefined;
}, {
    method: string;
    params?: {
        [x: string]: unknown;
        _meta?: {
            [x: string]: unknown;
        } | undefined;
    } | undefined;
}, {
    [x: string]: unknown;
    _meta?: {
        [x: string]: unknown;
    } | undefined;
}>;
//# sourceMappingURL=index.d.ts.map