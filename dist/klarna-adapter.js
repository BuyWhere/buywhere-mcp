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
const KLARNA_BASE_URL = (process.env.KLARNA_API_URL ?? "https://api.klarna.com").replace(/\/$/, "");
const KLARNA_TOKEN = process.env.KLARNA_API_TOKEN ?? "";
const KLARNA_USER_AGENT = "buywhere-mcp/klarna-adapter/1.0.0";
// ---------------------------------------------------------------------------
// HTTP helpers
// ---------------------------------------------------------------------------
function klarnaHeaders() {
    return {
        Authorization: `Bearer ${KLARNA_TOKEN}`,
        Accept: "application/json",
        "User-Agent": KLARNA_USER_AGENT,
        "X-Agent-Source": "buywhere-mcp",
    };
}
async function klarnaFetch(path, params) {
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
export async function searchKlarna(query, market = "us", limit = 20) {
    const data = (await klarnaFetch(`/agentic/v2/product/search/${market}`, {
        q: query,
        limit: String(limit),
    }));
    const products = (data.products ?? []).map((p) => {
        const product = p;
        return {
            id: product.id,
            title: (product.title ?? product.name),
            description: product.description,
            url: (product.url ?? product.product_url),
            image: product.image,
            price: product.price,
            merchant: product.merchant,
            availability: product.availability,
            category: product.category,
            brand: product.brand,
            source: "klarna",
        };
    });
    return {
        products,
        total: data.total ?? products.length,
        market,
    };
}
// ---------------------------------------------------------------------------
// Offers (best-offer picker)
// ---------------------------------------------------------------------------
export async function getKlarnaOffers(productId) {
    const data = (await klarnaFetch(`/agentic/v2/product/${productId}/offers`));
    const offers = (data.offers ?? []).map((o) => {
        const offer = o;
        return {
            id: offer.id,
            title: (offer.title ?? offer.name),
            description: offer.description,
            url: (offer.url ?? offer.offer_url),
            image: offer.image,
            price: offer.price,
            merchant: offer.merchant,
            availability: offer.availability,
            category: offer.category,
            brand: offer.brand,
            source: "klarna",
        };
    });
    return offers;
}
// ---------------------------------------------------------------------------
// Best offer picker
// ---------------------------------------------------------------------------
export function pickBestOffer(offers) {
    if (offers.length === 0)
        return null;
    // Filter to in-stock offers
    const inStock = offers.filter((o) => o.availability?.in_stock !== false && o.availability?.status !== "out_of_stock");
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
export function formatKlarnaForBuyWhere(product) {
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
//# sourceMappingURL=klarna-adapter.js.map