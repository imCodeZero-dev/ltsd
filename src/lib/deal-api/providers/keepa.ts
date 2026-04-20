import type { DealApiProvider, DealItem, PriceResult } from "../types";

export class KeepaProvider implements DealApiProvider {
  async getDealsByCategory(_category: string, _limit = 20): Promise<DealItem[]> {
    // TODO: implement Keepa API deal fetch
    return [];
  }

  async getItemPrices(_asins: string[]): Promise<PriceResult[]> {
    // TODO: implement Keepa API price history
    return [];
  }

  async getItemMetadata(_asin: string): Promise<Partial<DealItem>> {
    // TODO: implement Keepa metadata fetch
    return {};
  }

  async searchItems(_query: string, _limit = 20): Promise<DealItem[]> {
    // TODO: implement Keepa search
    return [];
  }
}
