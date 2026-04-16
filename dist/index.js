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
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ErrorCode, ListResourcesRequestSchema, ListToolsRequestSchema, McpError, ReadResourceRequestSchema, } from "@modelcontextprotocol/sdk/types.js";
// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------
const API_KEY = process.env.BUYWHERE_API_KEY;
const BASE_URL = (process.env.BUYWHERE_API_URL ?? "https://api.buywhere.ai").replace(/\/$/, "");
if (!API_KEY) {
    process.stderr.write("Error: BUYWHERE_API_KEY environment variable is required.\n" +
        "Get your key at https://buywhere.ai/dashboard\n");
    // process.exit removed for scanning
}
// ---------------------------------------------------------------------------
// HTTP helpers
// ---------------------------------------------------------------------------
async function apiFetch(path, params) {
    const url = new URL(`${BASE_URL}${path}`);
    if (params) {
        for (const [k, v] of Object.entries(params)) {
            if (v !== undefined && v !== null) {
                url.searchParams.set(k, String(v));
            }
        }
    }
    const res = await fetch(url.toString(), {
        headers: {
            "X-API-Key": API_KEY,
            Accept: "application/json",
            "User-Agent": "buywhere-mcp/0.1.0",
        },
    });
    if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new McpError(ErrorCode.InternalError, `BuyWhere API error ${res.status}: ${text.slice(0, 200)}`);
    }
    return res.json();
}
async function apiPost(path, body) {
    const res = await fetch(`${BASE_URL}${path}`, {
        method: "POST",
        headers: {
            "X-API-Key": API_KEY,
            "Content-Type": "application/json",
            Accept: "application/json",
            "User-Agent": "buywhere-mcp/0.1.0",
        },
        body: JSON.stringify(body),
    });
    if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new McpError(ErrorCode.InternalError, `BuyWhere API error ${res.status}: ${text.slice(0, 200)}`);
    }
    return res.json();
}
// ---------------------------------------------------------------------------
// Format helpers
// ---------------------------------------------------------------------------
function formatProduct(p) {
    const price = p.price;
    const merchant = p.merchant;
    const avail = p.availability;
    const images = p.images ?? [];
    const lines = [
        `**${p.title ?? p.name}**`,
        `ID: ${p.product_id ?? p.id}`,
        `Price: ${price?.currency ?? "SGD"} ${price?.amount ?? "N/A"}`,
        `Category: ${p.category ?? ""}`,
        `Merchant: ${merchant?.name ?? merchant?.merchant_id ?? ""}` +
            (merchant?.platform ? ` (${merchant.platform})` : ""),
        `In stock: ${avail?.in_stock ? "Yes" : "No"}`,
        `URL: ${p.source_url ?? ""}`,
    ];
    if (images.length > 0) {
        lines.push(`Image: ${images[0].url}`);
    }
    if (p.description_short) {
        lines.push(`Description: ${p.description_short}`);
    }
    if (p.description_full) {
        const desc = p.description_full;
        lines.push(`Description: ${desc.length > 300 ? desc.slice(0, 300) + "…" : desc}`);
    }
    return lines.join("\n");
}
function formatListing(lst) {
    const price = lst.price;
    const merchant = lst.merchant;
    const avail = lst.availability;
    const parts = [
        `  Merchant: ${merchant?.name ?? merchant?.merchant_id ?? "unknown"} (${merchant?.platform ?? ""})`,
        `  Price: ${price?.currency ?? "SGD"} ${price?.amount ?? price?.total ?? "N/A"}` +
            (price?.shipping_fee !== undefined && price.shipping_fee !== 0
                ? ` + ${price.shipping_fee} shipping`
                : " (free shipping)"),
        `  Total: ${price?.currency ?? "SGD"} ${price?.total ?? "N/A"}`,
        `  In stock: ${avail?.in_stock ? "Yes" : "No"}` +
            (avail?.next_day_available ? " (next-day delivery available)" : ""),
        `  URL: ${lst.source_url ?? ""}`,
    ];
    if (merchant?.rating)
        parts.push(`  Rating: ${merchant.rating}`);
    return parts.join("\n");
}
// ---------------------------------------------------------------------------
// MCP server
// ---------------------------------------------------------------------------
const server = new Server({ name: "buywhere-mcp", version: "0.1.0" }, {
    capabilities: {
        tools: {},
        resources: {},
    },
});
// ---------------------------------------------------------------------------
// Tools — list
// ---------------------------------------------------------------------------
server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [
        {
            name: "search_products",
            description: "Search the BuyWhere product catalog using keywords or natural language. " +
                "Returns matching products with title, price, availability, merchant, and URL.",
            inputSchema: {
                type: "object",
                properties: {
                    query: {
                        type: "string",
                        description: "Keyword or natural-language query (e.g. 'wireless earbuds under $50', 'red dress size M')",
                    },
                    country: {
                        type: "string",
                        description: "Country code to scope results (e.g. 'sg' for Singapore). Defaults to 'sg'.",
                    },
                    category: {
                        type: "string",
                        description: "Category slug filter (e.g. 'electronics/smartphones', 'fashion/dresses')",
                    },
                    limit: {
                        type: "integer",
                        description: "Maximum number of results to return (1–50, default 10)",
                        default: 10,
                    },
                },
                required: ["query"],
            },
        },
        {
            name: "get_product",
            description: "Fetch full details for a single product by its BuyWhere product ID.",
            inputSchema: {
                type: "object",
                properties: {
                    product_id: {
                        type: "string",
                        description: "The BuyWhere product ID (returned by search_products as product_id)",
                    },
                },
                required: ["product_id"],
            },
        },
        {
            name: "get_price",
            description: "Get current prices for a product across all available merchants. " +
                "Returns a ranked list of listings with price, shipping, merchant rating, and stock status. " +
                "Use this to find the cheapest place to buy a specific product.",
            inputSchema: {
                type: "object",
                properties: {
                    product_id: {
                        type: "string",
                        description: "The BuyWhere product ID",
                    },
                },
                required: ["product_id"],
            },
        },
        {
            name: "compare_prices",
            description: "Compare 2–5 products side-by-side. Returns structured differentiators, price range, " +
                "pros/cons, and a best-value recommendation — purpose-built for AI agent decision-making.",
            inputSchema: {
                type: "object",
                properties: {
                    product_ids: {
                        type: "array",
                        items: { type: "string" },
                        description: "Array of 2–5 BuyWhere product IDs to compare",
                        minItems: 2,
                        maxItems: 5,
                    },
                },
                required: ["product_ids"],
            },
        },
        {
            name: "get_affiliate_link",
            description: "Get the click-tracked BuyWhere affiliate link for a product. " +
                "Share this link with users — it logs the referral and redirects to the merchant page. " +
                "Always use this instead of raw product URLs when sharing links.",
            inputSchema: {
                type: "object",
                properties: {
                    product_id: {
                        type: "string",
                        description: "The BuyWhere product ID",
                    },
                },
                required: ["product_id"],
            },
        },
        {
            name: "get_catalog",
            description: "List available product categories in the BuyWhere catalog. " +
                "Use this to discover what categories exist before searching or filtering.",
            inputSchema: {
                type: "object",
                properties: {
                    parent_slug: {
                        type: "string",
                        description: "Parent category slug to list subcategories (optional — omit for top-level categories)",
                    },
                },
            },
        },
    ],
}));
// ---------------------------------------------------------------------------
// Tools — call
// ---------------------------------------------------------------------------
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args = {} } = request.params;
    // ── search_products ──────────────────────────────────────────────────────
    if (name === "search_products") {
        const query = args.query;
        if (!query) {
            throw new McpError(ErrorCode.InvalidParams, "query is required");
        }
        const limit = Math.min(Math.max(1, Number(args.limit ?? 10)), 50);
        const params = {
            q: query,
            limit,
            availability: "in_stock",
            sort: "relevance",
        };
        if (args.category)
            params.category = args.category;
        const data = (await apiFetch("/v1/products/search", params));
        const results = data.results ?? [];
        if (results.length === 0) {
            return {
                content: [
                    { type: "text", text: `No products found for query: "${query}"` },
                ],
            };
        }
        const total = data.total_estimated;
        const header = `Found ${total ?? results.length} product(s) matching "${query}":`;
        const items = results.map((p) => ({ type: "text", text: formatProduct(p) }));
        return {
            content: [{ type: "text", text: header }, ...items],
        };
    }
    // ── get_product ──────────────────────────────────────────────────────────
    if (name === "get_product") {
        const productId = args.product_id;
        if (!productId) {
            throw new McpError(ErrorCode.InvalidParams, "product_id is required");
        }
        const data = (await apiFetch(`/v1/products/${encodeURIComponent(productId)}`));
        return {
            content: [{ type: "text", text: formatProduct(data) }],
        };
    }
    // ── get_price ────────────────────────────────────────────────────────────
    if (name === "get_price") {
        const productId = args.product_id;
        if (!productId) {
            throw new McpError(ErrorCode.InvalidParams, "product_id is required");
        }
        const data = (await apiFetch(`/v1/products/${encodeURIComponent(productId)}/prices`));
        const listings = data.listings ?? [];
        const bestPrice = data.best_price;
        const bestValue = data.best_value;
        const lines = [
            `**Price comparison for: ${data.canonical_title ?? productId}**`,
            `${listings.length} listing(s) found:\n`,
            ...listings.map((lst, i) => `Listing ${i + 1}:\n${formatListing(lst)}`),
        ];
        if (bestPrice) {
            lines.push(`\n**Best price:** ${bestPrice.currency ?? "SGD"} ${bestPrice.total} (listing ${bestPrice.listing_id})`);
        }
        if (bestValue && bestValue.listing_id !== bestPrice?.listing_id) {
            lines.push(`**Best value:** ${bestValue.currency ?? "SGD"} ${bestValue.total} — ${bestValue.rationale ?? ""} (listing ${bestValue.listing_id})`);
        }
        return {
            content: [{ type: "text", text: lines.join("\n") }],
        };
    }
    // ── compare_prices ───────────────────────────────────────────────────────
    if (name === "compare_prices") {
        const productIds = args.product_ids;
        if (!productIds || productIds.length < 2) {
            throw new McpError(ErrorCode.InvalidParams, "product_ids must be an array of 2–5 product IDs");
        }
        if (productIds.length > 5) {
            throw new McpError(ErrorCode.InvalidParams, "compare_prices supports at most 5 products at once");
        }
        const data = (await apiFetch("/v1/products/compare", { ids: productIds.join(",") }));
        const products = data.products ?? [];
        const comparison = data.comparison;
        const lines = [`**Product comparison (${products.length} items):**\n`];
        for (const p of products) {
            const price = p.price;
            lines.push(`**${p.title ?? p.name}** (ID: ${p.product_id ?? p.id})`, `  Price: ${price?.currency ?? "SGD"} ${price?.amount ?? "N/A"}`, `  Category: ${p.category ?? ""}`, `  Merchant: ${p.merchant?.name ?? ""}`, `  URL: ${p.source_url ?? ""}`, "");
        }
        if (comparison) {
            const priceRange = comparison.price_range;
            if (priceRange) {
                lines.push(`**Price range:** ${priceRange.currency ?? "SGD"} ${priceRange.min} – ${priceRange.max}`);
            }
            const bestValue = comparison.best_value;
            if (bestValue) {
                lines.push(`**Best value:** ${bestValue.title ?? bestValue.product_id} — ${bestValue.rationale ?? ""}`);
            }
            const differentiators = comparison.differentiators;
            if (differentiators?.length) {
                lines.push(`\n**Key differences:**`);
                for (const d of differentiators) {
                    lines.push(`  • ${d}`);
                }
            }
        }
        return {
            content: [{ type: "text", text: lines.join("\n") }],
        };
    }
    // ── get_affiliate_link ───────────────────────────────────────────────────
    if (name === "get_affiliate_link") {
        const productId = args.product_id;
        if (!productId) {
            throw new McpError(ErrorCode.InvalidParams, "product_id is required");
        }
        // Fetch product name for context
        let productName = productId;
        try {
            const product = (await apiFetch(`/v1/products/${encodeURIComponent(productId)}`));
            productName = (product.title ?? product.name ?? productId);
        }
        catch {
            // Non-fatal — still return the link
        }
        const affiliateUrl = `${BASE_URL}/r/${encodeURIComponent(productId)}`;
        return {
            content: [
                {
                    type: "text",
                    text: [
                        `**Affiliate link for: ${productName}**`,
                        ``,
                        `URL: ${affiliateUrl}`,
                        ``,
                        `This is a click-tracked BuyWhere link. When a user visits it, BuyWhere logs the referral and redirects to the merchant page.`,
                    ].join("\n"),
                },
            ],
        };
    }
    // ── get_catalog ──────────────────────────────────────────────────────────
    if (name === "get_catalog") {
        const parentSlug = args.parent_slug;
        let data;
        if (parentSlug) {
            data = await apiFetch(`/v1/categories/${encodeURIComponent(parentSlug)}`);
        }
        else {
            data = await apiFetch("/v1/categories");
        }
        const categories = Array.isArray(data)
            ? data
            : data.categories ?? [data];
        const lines = [
            parentSlug
                ? `**Subcategories of "${parentSlug}":**`
                : `**BuyWhere product catalog — top-level categories:**`,
            "",
        ];
        for (const cat of categories) {
            const name = cat.name ?? cat.slug ?? cat.id ?? "Unknown";
            const slug = cat.slug ?? cat.id ?? "";
            const count = cat.product_count ?? cat.count ?? "";
            lines.push(`• **${name}** (slug: \`${slug}\`)${count ? `  — ${count} products` : ""}`);
            const subcats = cat.subcategories;
            if (subcats?.length) {
                for (const sub of subcats) {
                    lines.push(`  ↳ ${sub.name ?? sub.slug} (\`${sub.slug ?? sub.id}\`)`);
                }
            }
        }
        return {
            content: [{ type: "text", text: lines.join("\n") }],
        };
    }
    throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
});
// ---------------------------------------------------------------------------
// Resources — list
// ---------------------------------------------------------------------------
server.setRequestHandler(ListResourcesRequestSchema, async () => ({
    resources: [
        {
            uri: "buywhere://catalog/sg",
            name: "BuyWhere Singapore catalog",
            description: "Available product categories in Singapore",
            mimeType: "application/json",
        },
        {
            uri: "buywhere://catalog/my",
            name: "BuyWhere Malaysia catalog",
            description: "Available product categories in Malaysia",
            mimeType: "application/json",
        },
        {
            uri: "buywhere://catalog/id",
            name: "BuyWhere Indonesia catalog",
            description: "Available product categories in Indonesia",
            mimeType: "application/json",
        },
    ],
}));
// ---------------------------------------------------------------------------
// Resources — read
// ---------------------------------------------------------------------------
server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    const { uri } = request.params;
    const match = uri.match(/^buywhere:\/\/catalog\/([a-z]{2})$/);
    if (!match) {
        throw new McpError(ErrorCode.InvalidRequest, `Unknown resource URI: ${uri}. Expected buywhere://catalog/{country_code}`);
    }
    const country = match[1];
    const data = await apiFetch("/v1/categories");
    return {
        contents: [
            {
                uri,
                mimeType: "application/json",
                text: JSON.stringify({ country, categories: data }, null, 2),
            },
        ],
    };
});
// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    process.stderr.write("BuyWhere MCP server running (stdio)\n");
}
main().catch((err) => {
    process.stderr.write(`Fatal: ${err}\n`);
    process.exit(1);
});
//# sourceMappingURL=index.js.map
