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
 *   compare_products  — side-by-side comparison of 2–10 products
 *   get_deals         — discounted products sorted by discount %
 *   list_categories   — list available product categories
 *   find_best_price   — find cheapest option across all merchants
 *   ingest_products   — batch-upsert products into the catalog (API key required)
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
            "io.modelcontextprotocol/related-task"?: {
                taskId: string;
            } | undefined;
        } | undefined;
    } | undefined;
}, {
    method: string;
    params?: {
        [x: string]: unknown;
        _meta?: {
            [x: string]: unknown;
            progressToken?: string | number | undefined;
            "io.modelcontextprotocol/related-task"?: {
                taskId: string;
            } | undefined;
        } | undefined;
    } | undefined;
}, {
    [x: string]: unknown;
    _meta?: {
        [x: string]: unknown;
        progressToken?: string | number | undefined;
        "io.modelcontextprotocol/related-task"?: {
            taskId: string;
        } | undefined;
    } | undefined;
}>;
//# sourceMappingURL=index.d.ts.map