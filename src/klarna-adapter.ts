/**
 * Klarna Agentic Product Protocol adapter
 *
 * Thin wrapper around the Klarna agentic commerce API for US product search,
 * offer retrieval, and best-offer selection. Designed to be merged into
 * BuyWhere MCP search results as a parallel US source.
 *
 * Built on Klarna Agentic Product Protocol.
 * @see https://docs.klarna.com/agentic-product-protocol
 */

const KLARNA_BASE_URL =
  (process.env.KLARNA_API_URL ?? "https://api.klarna.com").replace(/\/$/, "");
const KLARNA_TOKEN = process.env.KLARNA_API_TOKEN ?? "";
const KLARNA_USER_AGENT = "buywhere-mcp/klarna-adapter/1.0.0";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface KlarnaProduct {
  id: string;
  title: string;
  description?: string;
  url?: string;
  image?: string;
  price?: {
    amount?: number;
    currency?: string;
    formatted?: string;
  };
  merchant?: {
    name?: string;
    id?: string;
  };
  availability?: {
    status?: string;
    in_stock?: boolean;
  };
  category?: string;
  brand?: string;
  source: "klarna";
}

export interface KlarnaSearchResult {
  products: KlarnaProduct[];
  total: number;
  market: string;
}

// ---------------------------------------------------------------------------
// HTTP helpers
// ---------------------------------------------------------------------------

function klarnaHeaders(): Record<string, string> {
  return {
    Authorization: `Bearer ${KLARNA_TOKEN}`,
    Accept: "application/json",
    "User-Agent": KLARNA_USER_AGENT,
    "X-Agent-Source": "buywhere-mcp",
  };
}

async function klarnaFetch(path: string, params?: Record<string, string>): Promise<unknown> {
  const url = new URL(`${KLARNA_BASE_URL}${path}`);
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null) {
        url.searchParams.set(k, v);
      }
    }
  }

  const res = await fetch(url.toString(), { headers: klarnaHeaders() });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Klarna API error ${res.status}: ${text.slice(0, 200)}`);
  }

  return res.json();
}

// ---------------------------------------------------------------------------
// Search
// ---------------------------------------------------------------------------

export async function searchKlarna(
  query: string,
  market = "us",
  limit = 20,
): Promise<KlarnaSearchResult> {
  const data = (await klarnaFetch(`/agentic/v2/product/search/${market}`, {
    q: query,
    limit: String(limit),
  })) as Record<string, unknown>;

  const products = ((data.products as unknown[]) ?? []).map((p) => {
    const product = p as Record<string, unknown>;
    return {
      id: product.id as string,
      title: (product.title ?? product.name) as string,
      description: product.description as string | undefined,
      url: (product.url ?? product.product_url) as string | undefined,
      image: product.image as string | undefined,
      price: product.price as KlarnaProduct["price"],
      merchant: product.merchant as KlarnaProduct["merchant"],
      availability: product.availability as KlarnaProduct["availability"],
      category: product.category as string | undefined,
      brand: product.brand as string | undefined,
      source: "klarna" as const,
    };
  });

  return {
    products,
    total: (data.total as number) ?? products.length,
    market,
  };
}

// ---------------------------------------------------------------------------
// Offers (best-offer picker)
// ---------------------------------------------------------------------------

export async function getKlarnaOffers(productId: string): Promise<KlarnaProduct[]> {
  const data = (await klarnaFetch(`/agentic/v2/product/${productId}/offers`)) as Record<string, unknown>;

  const offers = ((data.offers as unknown[]) ?? []).map((o) => {
    const offer = o as Record<string, unknown>;
    return {
      id: offer.id as string,
      title: (offer.title ?? offer.name) as string,
      description: offer.description as string | undefined,
      url: (offer.url ?? offer.offer_url) as string | undefined,
      image: offer.image as string | undefined,
      price: offer.price as KlarnaProduct["price"],
      merchant: offer.merchant as KlarnaProduct["merchant"],
      availability: offer.availability as KlarnaProduct["availability"],
      category: offer.category as string | undefined,
      brand: offer.brand as string | undefined,
      source: "klarna" as const,
    };
  });

  return offers;
}

// ---------------------------------------------------------------------------
// Best offer picker
// ---------------------------------------------------------------------------

export function pickBestOffer(offers: KlarnaProduct[]): KlarnaProduct | null {
  if (offers.length === 0) return null;

  // Filter to in-stock offers
  const inStock = offers.filter(
    (o) => o.availability?.in_stock !== false && o.availability?.status !== "out_of_stock"
  );

  const candidates = inStock.length > 0 ? inStock : offers;

  // Sort by price (lowest first)
  return candidates.sort((a, b) => {
    const priceA = a.price?.amount ?? Number.MAX_SAFE_INTEGER;
    const priceB = b.price?.amount ?? Number.MAX_SAFE_INTEGER;
    return priceA - priceB;
  })[0];
}

// ---------------------------------------------------------------------------
// Format for BuyWhere integration
// ---------------------------------------------------------------------------

export function formatKlarnaForBuyWhere(product: KlarnaProduct): Record<string, unknown> {
  return {
    product_id: `krn:kpdc:product:${product.id}`,
    title: product.title,
    description: product.description,
    source_url: product.url,
    images: product.image ? [{ url: product.image }] : [],
    price: {
      amount: product.price?.amount,
      currency: product.price?.currency ?? "USD",
      total: product.price?.amount,
    },
    merchant: {
      name: product.merchant?.name,
      merchant_id: product.merchant?.id,
      platform: "klarna",
    },
    availability: {
      status: product.availability?.status ?? "unknown",
      in_stock: product.availability?.in_stock ?? false,
    },
    category: product.category,
    brand: product.brand,
    source: "klarna",
    market: "us",
  };
}
