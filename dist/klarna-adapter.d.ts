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
export declare function searchKlarna(query: string, market?: string, limit?: number): Promise<KlarnaSearchResult>;
export declare function getKlarnaOffers(productId: string): Promise<KlarnaProduct[]>;
export declare function pickBestOffer(offers: KlarnaProduct[]): KlarnaProduct | null;
export declare function formatKlarnaForBuyWhere(product: KlarnaProduct): Record<string, unknown>;
//# sourceMappingURL=klarna-adapter.d.ts.map