import type { DealApiProvider, DealItem, PriceResult } from "../types";

export class AmazonProvider implements DealApiProvider {
  async getDealsByCategory(_category: string, _limit = 20): Promise<DealItem[]> {
    // TODO: implement Amazon PA-API GetItems / SearchItems
    return [];
  }

  async getItemPrices(_asins: string[]): Promise<PriceResult[]> {
    // TODO: implement Amazon PA-API GetItems for price data
    return [];
  }

  async getItemMetadata(_asin: string): Promise<Partial<DealItem>> {
    // TODO: implement metadata fetch
    return {};
  }

  async searchItems(_query: string, _limit = 20): Promise<DealItem[]> {
    // TODO: implement SearchItems
    return [];
  }
}
