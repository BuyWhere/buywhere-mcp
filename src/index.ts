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

import { fileURLToPath } from "url";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ErrorCode,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  McpError,
  ReadResourceRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const API_KEY = process.env.BUYWHERE_API_KEY;
const BASE_URL = (process.env.BUYWHERE_API_URL ?? "https://api.buywhere.ai").replace(/\/$/, "");
const MCP_SERVER_NAME = "io.github.BuyWhere/buywhere-mcp";
const MCP_SERVER_VERSION = "1.0.3";
const USER_AGENT = `buywhere-mcp/${MCP_SERVER_VERSION}`;
const AGENT_CARD_URL = "https://buywhere.ai/.well-known/agent.json";
const LLMS_TXT_URL = "https://buywhere.ai/llms.txt";

if (!API_KEY) {
  process.stderr.write(
    "Warning: BUYWHERE_API_KEY not set — tool calls will return an auth error.\n" +
      "Get your key at https://buywhere.ai/api-keys\n",
  );
}

// ---------------------------------------------------------------------------
// HTTP helpers
// ---------------------------------------------------------------------------

function buildApiHeaders(toolName: string, method: "GET" | "POST", includeJsonContentType = false): Record<string, string> {
  const headers: Record<string, string> = {
    "X-API-Key": API_KEY!,
    Accept: "application/json",
    "User-Agent": USER_AGENT,
    "X-Agent-Framework": "custom",
    "X-Agent-Protocol": "mcp",
    "X-Agent-Card": AGENT_CARD_URL,
    "X-LLMs-Txt": LLMS_TXT_URL,
    "X-MCP-Server-Name": MCP_SERVER_NAME,
    "X-MCP-Server-Version": MCP_SERVER_VERSION,
    "X-MCP-Transport": "stdio",
    "X-MCP-Tool-Name": toolName,
    "X-MCP-HTTP-Method": method,
  };

  if (includeJsonContentType) {
    headers["Content-Type"] = "application/json";
  }

  return headers;
}

async function apiFetch(
  path: string,
  params?: Record<string, string | number | boolean | undefined>,
  toolName = "unknown",
): Promise<unknown> {
  const url = new URL(`${BASE_URL}${path}`);
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null) {
        url.searchParams.set(k, String(v));
      }
    }
  }

  const res = await fetch(url.toString(), {
    headers: buildApiHeaders(toolName, "GET"),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new McpError(
      ErrorCode.InternalError,
      `BuyWhere API error ${res.status}: ${text.slice(0, 200)}`,
    );
  }

  return res.json();
}

async function apiPost(path: string, body: unknown, toolName = "unknown"): Promise<unknown> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: buildApiHeaders(toolName, "POST", true),
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new McpError(
      ErrorCode.InternalError,
      `BuyWhere API error ${res.status}: ${text.slice(0, 200)}`,
    );
  }

  return res.json();
}

// ---------------------------------------------------------------------------
// Format helpers
// ---------------------------------------------------------------------------

function formatProduct(p: Record<string, unknown>): string {
  const price = p.price as Record<string, unknown> | undefined;
  const merchant = p.merchant as Record<string, unknown> | undefined;
  const avail = p.availability as Record<string, unknown> | undefined;
  const images = (p.images as Array<Record<string, unknown>> | undefined) ?? [];

  const lines: string[] = [
    `**${p.title ?? p.name}**`,
    `ID: ${p.product_id ?? p.id}`,
    `Price: ${price?.currency ?? "SGD"} ${price?.amount ?? price?.total ?? "N/A"}`,
    `Category: ${p.category ?? ""}`,
    `Merchant: ${merchant?.name ?? merchant?.merchant_id ?? ""}` +
      (merchant?.platform ? ` (${merchant.platform})` : ""),
    `In stock: ${avail?.in_stock ? "Yes" : "No"}`,
    `URL: ${p.source_url ?? p.url ?? ""}`,
  ];

  if (images.length > 0) {
    lines.push(`Image: ${images[0].url}`);
  }
  if (p.description_short) {
    lines.push(`Description: ${p.description_short}`);
  }
  if (p.description_full) {
    const desc = p.description_full as string;
    lines.push(`Description: ${desc.length > 300 ? desc.slice(0, 300) + "…" : desc}`);
  }

  return lines.join("\n");
}

// ---------------------------------------------------------------------------
// MCP server
// ---------------------------------------------------------------------------

const server = new Server(
  { name: "buywhere-mcp", version: MCP_SERVER_VERSION },
  {
    capabilities: {
      tools: {},
      resources: {},
    },
  },
);

// ---------------------------------------------------------------------------
// Tools — list
// ---------------------------------------------------------------------------

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "search_products",
      description:
        "Search the BuyWhere product catalog by keyword. Returns products from e-commerce platforms across " +
        "multiple regions (Singapore, US, etc.). Use compact=true for agent-optimized responses with " +
        "structured_specs, comparison_attributes, and normalized_price_usd fields.",
      inputSchema: {
        type: "object",
        properties: {
          q: {
            type: "string",
            description: "Keyword search query",
          },
          domain: {
            type: "string",
            description: "Filter by merchant platform (e.g. lazada, shopee, amazon)",
          },
          region: {
            type: "string",
            description: "Filter by region (sea, us, eu, au)",
          },
          country_code: {
            type: "string",
            enum: ["SG", "US", "VN", "TH", "MY"],
            description:
              "Filter by ISO country code. Also infers default currency for price filters (SG→SGD, US→USD, VN→VND, TH→THB, MY→MYR).",
          },
          country: {
            type: "string",
            description: "Alias for country_code (deprecated, use country_code)",
          },
          min_price: {
            type: "number",
            description: "Minimum price (in currency inferred from country_code, or SGD by default)",
          },
          max_price: {
            type: "number",
            description: "Maximum price (in currency inferred from country_code, or SGD by default)",
          },
          limit: {
            type: "integer",
            description: "Number of results (max 100, default 20)",
            default: 20,
          },
          offset: {
            type: "integer",
            description: "Pagination offset",
            default: 0,
          },
          compact: {
            type: "boolean",
            description:
              "Return agent-optimized compact shape: structured_specs, comparison_attributes, normalized_price_usd. " +
              "Reduces response size ~40%. Recommended for agent tool-use.",
            default: false,
          },
          category: {
            type: "string",
            description:
              'Filter by product category name (e.g. "Laptops", "Smartphones", "Televisions"). ' +
              "Use to exclude accessories and get actual products.",
          },
        },
        required: ["q"],
      },
    },
    {
      name: "get_product",
      description: "Get a specific product by its ID, including full details and current price.",
      inputSchema: {
        type: "object",
        properties: {
          id: {
            type: "string",
            description: "Product UUID",
          },
        },
        required: ["id"],
      },
    },
    {
      name: "compare_products",
      description: "Compare multiple products side-by-side. Returns price, brand, rating, and category for each.",
      inputSchema: {
        type: "object",
        properties: {
          ids: {
            type: "array",
            items: { type: "string" },
            description: "Array of product IDs to compare (2-10)",
            minItems: 2,
            maxItems: 10,
          },
        },
        required: ["ids"],
      },
    },
    {
      name: "get_deals",
      description:
        "Get discounted products sorted by discount percentage. Returns products with original price and discount percentage. " +
        "Supports currency, region (sea, us, eu, au) and country (SG, US, VN, MY, ...) filters.",
      inputSchema: {
        type: "object",
        properties: {
          min_discount: {
            type: "number",
            description: "Minimum discount percentage (default 10)",
            default: 10,
          },
          currency: {
            type: "string",
            description: "Filter by currency code (SGD, USD, MYR, VND, THB). Defaults to SGD.",
            default: "SGD",
          },
          region: {
            type: "string",
            description: "Filter by region (sea, us, eu, au)",
          },
          country_code: {
            type: "string",
            enum: ["SG", "US", "VN", "TH", "MY"],
            description: "Filter by ISO country code. Alias: country.",
          },
          country: {
            type: "string",
            description: "Alias for country_code (deprecated, use country_code)",
          },
          limit: {
            type: "integer",
            description: "Number of results (max 100, default 20)",
            default: 20,
          },
          offset: {
            type: "integer",
            description: "Pagination offset",
            default: 0,
          },
        },
      },
    },
    {
      name: "list_categories",
      description: "List top-level product categories available in the BuyWhere catalog.",
      inputSchema: {
        type: "object",
        properties: {
          country_code: {
            type: "string",
            enum: ["SG", "US", "VN", "TH", "MY"],
            description: "Filter by ISO country code. Defaults to SG.",
          },
          country: {
            type: "string",
            description: "Alias for country_code (deprecated, use country_code)",
          },
        },
      },
    },
    {
      name: "find_best_price",
      description:
        'Use this whenever a user asks about prices, wants to find the cheapest option, or asks "what\'s the best price for X" ' +
        'or "where can I buy X for the lowest price". This finds the best current price across all merchants.',
      inputSchema: {
        type: "object",
        properties: {
          product_name: {
            type: "string",
            description:
              'Product name to find best price for (e.g., "iphone 15 pro 256gb", "samsung galaxy s24")',
          },
          category: {
            type: "string",
            description: 'Category to filter by (e.g., "electronics", "fashion")',
          },
          country_code: {
            type: "string",
            enum: ["SG", "MY", "TH", "PH", "VN", "ID", "US"],
            description: "Country to search in (defaults to SG). Alias: country.",
          },
          country: {
            type: "string",
            description: "Alias for country_code (deprecated, use country_code)",
          },
          region: {
            type: "string",
            enum: ["us", "sea"],
            description: 'Region filter - use "us" for United States or "sea" for Southeast Asia',
          },
        },
        required: ["product_name"],
      },
    },
    {
      name: "ingest_products",
      description:
        "Ingest (upsert) a batch of products into the BuyWhere catalog. Use this to add or update product listings " +
        "from any merchant/source. Requires a valid API key with ingest permissions. " +
        "Accepts up to 1000 products per call with source, SKU, title, price, URL, and optional metadata.",
      inputSchema: {
        type: "object",
        properties: {
          source: {
            type: "string",
            description: 'Data source identifier (e.g. "shopee_sg", "amazon_sg", "lazada_sg")',
          },
          products: {
            type: "array",
            description: "Array of product objects to ingest (max 1000)",
            items: {
              type: "object",
              required: ["sku", "merchant_id", "title", "price", "url"],
              properties: {
                sku: { type: "string", description: "Unique stock keeping unit identifier" },
                merchant_id: { type: "string", description: "Merchant identifier" },
                title: { type: "string", description: "Product title" },
                description: { type: "string", description: "Product description" },
                price: { type: "number", description: "Current price (must be >= 0)" },
                currency: { type: "string", description: "Currency code (default: SGD)", default: "SGD" },
                url: { type: "string", description: "Product URL on the merchant site" },
                image_url: { type: "string", description: "Main product image URL" },
                category: { type: "string", description: "Product category" },
                brand: { type: "string", description: "Brand name" },
                is_active: { type: "boolean", description: "Whether the product is active (default: true)" },
                is_available: { type: "boolean", description: "Whether the product is in stock" },
                country_code: { type: "string", description: 'ISO country code (e.g. "SG", "US")' },
                region: { type: "string", description: 'Region identifier (e.g. "sea", "us")' },
                metadata: { type: "object", description: "Additional product metadata" },
              },
            },
          },
        },
        required: ["source", "products"],
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
    const q = args.q as string | undefined;
    if (!q) {
      throw new McpError(ErrorCode.InvalidParams, "q is required");
    }

    const limit = Math.min(Math.max(1, Number(args.limit ?? 20)), 100);
    const params: Record<string, string | number | boolean | undefined> = { q, limit };
    if (args.offset) params.offset = Number(args.offset);
    if (args.domain) params.domain = args.domain as string;
    if (args.region) params.region = args.region as string;
    if (args.country_code) params.country_code = args.country_code as string;
    if (args.country) params.country = args.country as string;
    if (args.min_price !== undefined) params.min_price = Number(args.min_price);
    if (args.max_price !== undefined) params.max_price = Number(args.max_price);
    if (args.compact) params.compact = true;
    if (args.category) params.category = args.category as string;

    const data = (await apiFetch("/v1/products/search", params, name)) as Record<string, unknown>;
    const results = (data.results as Array<Record<string, unknown>>) ?? [];

    if (results.length === 0) {
      return {
        content: [{ type: "text", text: `No products found for query: "${q}"` }],
      };
    }

    const total = data.total_estimated as number | undefined;
    const header = `Found ${total ?? results.length} product(s) matching "${q}":`;
    const items = results.map((p) => ({ type: "text" as const, text: formatProduct(p) }));

    return { content: [{ type: "text", text: header }, ...items] };
  }

  // ── get_product ──────────────────────────────────────────────────────────
  if (name === "get_product") {
    const id = (args.id ?? args.product_id) as string | undefined;
    if (!id) {
      throw new McpError(ErrorCode.InvalidParams, "id is required");
    }

    const data = (await apiFetch(`/v1/products/${encodeURIComponent(id)}`, undefined, name)) as Record<string, unknown>;

    return { content: [{ type: "text", text: formatProduct(data) }] };
  }

  // ── compare_products ─────────────────────────────────────────────────────
  if (name === "compare_products") {
    const ids = (args.ids ?? args.product_ids) as string[] | undefined;
    if (!ids || ids.length < 2) {
      throw new McpError(ErrorCode.InvalidParams, "ids must be an array of 2–10 product IDs");
    }
    if (ids.length > 10) {
      throw new McpError(ErrorCode.InvalidParams, "compare_products supports at most 10 products at once");
    }

    const data = (await apiFetch("/v1/products/compare", { ids: ids.join(",") }, name)) as Record<string, unknown>;
    const products = (data.products as Array<Record<string, unknown>>) ?? [];
    const comparison = data.comparison as Record<string, unknown> | undefined;

    const lines: string[] = [`**Product comparison (${products.length} items):**\n`];

    for (const p of products) {
      const price = p.price as Record<string, unknown> | undefined;
      lines.push(
        `**${p.title ?? p.name}** (ID: ${p.product_id ?? p.id})`,
        `  Price: ${price?.currency ?? "SGD"} ${price?.amount ?? "N/A"}`,
        `  Category: ${p.category ?? ""}`,
        `  Merchant: ${(p.merchant as Record<string, unknown>)?.name ?? ""}`,
        `  URL: ${p.source_url ?? p.url ?? ""}`,
        "",
      );
    }

    if (comparison) {
      const priceRange = comparison.price_range as Record<string, unknown> | undefined;
      if (priceRange) {
        lines.push(`**Price range:** ${priceRange.currency ?? "SGD"} ${priceRange.min} – ${priceRange.max}`);
      }
      const bestValue = comparison.best_value as Record<string, unknown> | undefined;
      if (bestValue) {
        lines.push(`**Best value:** ${bestValue.title ?? bestValue.product_id} — ${bestValue.rationale ?? ""}`);
      }
      const differentiators = comparison.differentiators as string[] | undefined;
      if (differentiators?.length) {
        lines.push(`\n**Key differences:**`);
        for (const d of differentiators) {
          lines.push(`  • ${d}`);
        }
      }
    }

    return { content: [{ type: "text", text: lines.join("\n") }] };
  }

  // ── get_deals ────────────────────────────────────────────────────────────
  if (name === "get_deals") {
    const limit = Math.min(Math.max(1, Number(args.limit ?? 20)), 100);
    const params: Record<string, string | number | undefined> = { limit };
    if (args.min_discount !== undefined) params.min_discount = Number(args.min_discount);
    if (args.currency) params.currency = args.currency as string;
    if (args.region) params.region = args.region as string;
    if (args.country_code) params.country_code = args.country_code as string;
    if (args.country) params.country = args.country as string;
    if (args.offset) params.offset = Number(args.offset);

    const data = (await apiFetch("/v1/deals", params, name)) as Record<string, unknown>;
    const results = (data.results ?? data.deals ?? data) as Array<Record<string, unknown>>;
    const items = Array.isArray(results) ? results : [];

    if (items.length === 0) {
      return { content: [{ type: "text", text: "No deals found matching the given criteria." }] };
    }

    const lines: string[] = [`**${items.length} deal(s) found:**\n`];
    for (const item of items) {
      const price = item.price as Record<string, unknown> | undefined;
      const originalPrice = item.original_price as Record<string, unknown> | undefined;
      const discount = item.discount_percentage ?? item.discount_pct ?? "";
      lines.push(
        `**${item.title ?? item.name}**`,
        `  Price: ${price?.currency ?? "SGD"} ${price?.amount ?? price?.total ?? "N/A"}` +
          (originalPrice ? ` (was ${originalPrice.currency ?? "SGD"} ${originalPrice.amount})` : ""),
        discount ? `  Discount: ${discount}%` : "",
        `  URL: ${item.source_url ?? item.url ?? ""}`,
        "",
      );
    }

    return { content: [{ type: "text", text: lines.filter(Boolean).join("\n") }] };
  }

  // ── list_categories ──────────────────────────────────────────────────────
  if (name === "list_categories") {
    const params: Record<string, string | undefined> = {};
    if (args.country_code) params.country_code = args.country_code as string;
    if (args.country) params.country = args.country as string;

    const data = await apiFetch("/v1/categories", Object.keys(params).length ? params : undefined, name);
    const categories = Array.isArray(data)
      ? data
      : ((data as Record<string, unknown>).categories as unknown[]) ?? [data];

    const lines: string[] = [
      `**BuyWhere product catalog — top-level categories${params.country_code ? ` (${params.country_code})` : ""}:**`,
      "",
    ];

    for (const cat of categories as Array<Record<string, unknown>>) {
      const catName = cat.name ?? cat.slug ?? cat.id ?? "Unknown";
      const slug = cat.slug ?? cat.id ?? "";
      const count = cat.product_count ?? cat.count ?? "";
      lines.push(`• **${catName}** (slug: \`${slug}\`)${count ? `  — ${count} products` : ""}`);
      const subcats = cat.subcategories as Array<Record<string, unknown>> | undefined;
      if (subcats?.length) {
        for (const sub of subcats) {
          lines.push(`  ↳ ${sub.name ?? sub.slug} (\`${sub.slug ?? sub.id}\`)`);
        }
      }
    }

    return { content: [{ type: "text", text: lines.join("\n") }] };
  }

  // ── find_best_price ──────────────────────────────────────────────────────
  if (name === "find_best_price") {
    const productName = args.product_name as string | undefined;
    if (!productName) {
      throw new McpError(ErrorCode.InvalidParams, "product_name is required");
    }

    const params: Record<string, string | number | undefined> = {
      q: productName,
      limit: 1,
      sort: "price_asc",
    };
    if (args.category) params.category = args.category as string;
    if (args.country_code) params.country_code = args.country_code as string;
    if (args.country) params.country = args.country as string;
    if (args.region) params.region = args.region as string;

    const data = (await apiFetch("/v1/products/search", params, name)) as Record<string, unknown>;
    const results = (data.results as Array<Record<string, unknown>>) ?? [];

    if (results.length === 0) {
      return {
        content: [{ type: "text", text: `No products found for: "${productName}"` }],
      };
    }

    const best = results[0];
    const price = best.price as Record<string, unknown> | undefined;
    const merchant = best.merchant as Record<string, unknown> | undefined;

    const lines: string[] = [
      `**Best price for "${productName}":**`,
      "",
      `**${best.title ?? best.name}**`,
      `Price: ${price?.currency ?? "SGD"} ${price?.amount ?? price?.total ?? "N/A"}`,
      `Merchant: ${merchant?.name ?? merchant?.merchant_id ?? ""} ${merchant?.platform ? `(${merchant.platform})` : ""}`,
      `URL: ${best.source_url ?? best.url ?? ""}`,
      `ID: ${best.product_id ?? best.id}`,
    ];

    return { content: [{ type: "text", text: lines.join("\n") }] };
  }

  // ── ingest_products ──────────────────────────────────────────────────────
  if (name === "ingest_products") {
    const source = args.source as string | undefined;
    if (!source) {
      throw new McpError(ErrorCode.InvalidParams, "source is required");
    }
    const products = args.products as unknown[] | undefined;
    if (!products || !Array.isArray(products) || products.length === 0) {
      throw new McpError(ErrorCode.InvalidParams, "products must be a non-empty array");
    }
    if (products.length > 1000) {
      throw new McpError(ErrorCode.InvalidParams, "products array must not exceed 1000 items per call");
    }

    const data = (await apiPost("/v1/products/ingest", { source, products }, name)) as Record<string, unknown>;

    return {
      content: [
        {
          type: "text",
          text: [
            `**Ingest complete**`,
            `Source: ${source}`,
            `Submitted: ${products.length} product(s)`,
            data.ingested !== undefined ? `Ingested: ${data.ingested}` : "",
            data.skipped !== undefined ? `Skipped: ${data.skipped}` : "",
            data.errors !== undefined ? `Errors: ${data.errors}` : "",
          ]
            .filter(Boolean)
            .join("\n"),
        },
      ],
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
    throw new McpError(
      ErrorCode.InvalidRequest,
      `Unknown resource URI: ${uri}. Expected buywhere://catalog/{country_code}`,
    );
  }

  const country = match[1];
  const data = await apiFetch("/v1/categories", undefined, "resource:catalog");

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
// Smithery sandbox export (for tool scanning without real credentials)
// ---------------------------------------------------------------------------

export function createSandboxServer() {
  return server;
}

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  process.stderr.write("BuyWhere MCP server running (stdio)\n");
}

// Only auto-start when run as the entry point, not when imported for Smithery scanning.
// import.meta.url is undefined when esbuild bundles to CJS (scanner import path),
// so this guard naturally prevents main() from running during tool scanning.
const _entryUrl: string | undefined = import.meta.url;
if (_entryUrl && process.argv[1] === fileURLToPath(_entryUrl)) {
  main().catch((err: unknown) => {
    process.stderr.write(`Fatal: ${err}\n`);
    process.exit(1);
  });
}
