import type { DealApiProvider } from "./types";

// Active provider is determined at runtime via env var.
// Swap this import to switch providers without touching call sites.
async function loadProvider(): Promise<DealApiProvider> {
  const provider = process.env.DEAL_API_PROVIDER ?? "amazon";
  if (provider === "keepa") {
    const { KeepaProvider } = await import("./providers/keepa");
    return new KeepaProvider();
  }
  const { AmazonProvider } = await import("./providers/amazon");
  return new AmazonProvider();
}

let _provider: DealApiProvider | null = null;

export async function getDealApi(): Promise<DealApiProvider> {
  if (!_provider) _provider = await loadProvider();
  return _provider;
}
