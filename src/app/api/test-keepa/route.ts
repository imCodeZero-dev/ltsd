import { NextResponse } from "next/server";
import { KeepaProvider } from "@/lib/deal-api/providers/keepa";

const keepa = new KeepaProvider();

/**
 * Test endpoints for Keepa API
 *
 * GET /api/test-keepa?endpoint=search&q=headphones
 * GET /api/test-keepa?endpoint=metadata&asin=B0CHWRXH8B
 * GET /api/test-keepa?endpoint=prices&asins=B0CHWRXH8B,B09JQMJHXY
 * GET /api/test-keepa?endpoint=deals&category=Electronics
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const endpoint = searchParams.get("endpoint");

  try {
    switch (endpoint) {
      case "search": {
        const q = searchParams.get("q") ?? "headphones";
        const results = await keepa.searchItems(q, 5);
        console.log("results", results);
        return NextResponse.json({
          endpoint,
          query: q,
          count: results.length,
          results,
        });
      }

      case "raw-search": {
        const q = searchParams.get("q") ?? "headphones";
        const url = new URL("https://api.keepa.com/search");
        url.searchParams.set("key", process.env.KEEPA_API_KEY ?? "");
        url.searchParams.set("domain", "1");
        url.searchParams.set("type", "product");
        url.searchParams.set("term", q);
        const res = await fetch(url.toString());
        const raw = await res.json();
        console.log("raw", raw);

        return NextResponse.json({ status: res.status, raw });
      }

      case "raw-product": {
        const asin = searchParams.get("asin") ?? "B0CHWRXH8B";
        const url = new URL("https://api.keepa.com/product");
        url.searchParams.set("key", process.env.KEEPA_API_KEY ?? "");
        url.searchParams.set("domain", "1");
        url.searchParams.set("asin", asin);
        url.searchParams.set("stats", "1");
        url.searchParams.set("history", "0");
        const res = await fetch(url.toString());
        const raw = await res.json();
        // Only return safe fields to avoid huge response
        const products = (raw.products ?? []).map(
          (p: Record<string, unknown>) => ({
            asin: p.asin,
            title: p.title,
            brand: p.brand,
            imagesCSV: p.imagesCSV,
            categoryTree: p.categoryTree,
            stats: p.stats,
            csv_lengths: Array.isArray(p.csv)
              ? (p.csv as unknown[]).map((c) =>
                  Array.isArray(c) ? c.length : null,
                )
              : null,
            csv_0_last5:
              Array.isArray(p.csv) && Array.isArray((p.csv as number[][])[0])
                ? (p.csv as number[][])[0].slice(-5)
                : null,
            csv_1_last5:
              Array.isArray(p.csv) && Array.isArray((p.csv as number[][])[1])
                ? (p.csv as number[][])[1].slice(-5)
                : null,
          }),
        );
        return NextResponse.json({
          status: res.status,
          tokensLeft: raw.tokensLeft,
          products,
        });
      }

      case "metadata": {
        const asin = searchParams.get("asin") ?? "B0CHWRXH8B";
        const result = await keepa.getItemMetadata(asin);
        return NextResponse.json({ endpoint, asin, result });
      }

      case "prices": {
        const asins = (searchParams.get("asins") ?? "B0CHWRXH8B").split(",");
        const results = await keepa.getItemPrices(asins);
        return NextResponse.json({ endpoint, asins, results });
      }

      case "deals": {
        const category = searchParams.get("category") ?? "Electronics";
        const results = await keepa.getDealsByCategory(category, 5);
        console.log("results", results);

        return NextResponse.json({
          endpoint,
          category,
          count: results.length,
          results,
        });
      }

      // Debug: shows raw deal response + raw product stats.current for those ASINs
      case "debug-prices": {
        const category = searchParams.get("category") ?? "Electronics";
        const KEEPA_BASE = "https://api.keepa.com";
        const API_KEY = process.env.KEEPA_API_KEY ?? "";

        // Step 1: raw deal endpoint
        const dealUrl = new URL(`${KEEPA_BASE}/deal`);
        dealUrl.searchParams.set("key", API_KEY);
        const catMap: Record<string, string> = {
          Electronics: "493964",
          "Home & Kitchen": "172282",
          "Sports & Outdoors": "3760901",
        };
        const catId = catMap[category] ?? "493964";
        dealUrl.searchParams.set(
          "selection",
          JSON.stringify({
            categories: [Number(catId)],
            range: 1,
            page: 0,
            domainId: 1,
            priceTypes: [0],
            deltaPercentRange: [10, 100],
          }),
        );
        const dealRes = await fetch(dealUrl.toString(), { cache: "no-store" });
        const dealRaw = (await dealRes.json()) as {
          deals?: {
            dr?: {
              asin: string;
              title?: string;
              dealPrice?: number;
              buyBoxPrice?: number;
              currentPrice?: number;
            }[];
          };
        };
        const dealItems = dealRaw.deals?.dr?.slice(0, 5) ?? [];
        const asins = dealItems.map((d) => d.asin).filter(Boolean);

        // Step 2: raw product endpoint for those ASINs
        let productStats: Record<string, unknown>[] = [];
        if (asins.length) {
          const prodUrl = new URL(`${KEEPA_BASE}/product`);
          prodUrl.searchParams.set("key", API_KEY);
          prodUrl.searchParams.set("domain", "1");
          prodUrl.searchParams.set("asin", asins.join(","));
          prodUrl.searchParams.set("stats", "1");
          prodUrl.searchParams.set("history", "0");
          const prodRes = await fetch(prodUrl.toString(), {
            cache: "no-store",
          });
          const prodRaw = (await prodRes.json()) as {
            products?: Record<string, unknown>[];
          };
          productStats = (prodRaw.products ?? []).map((p) => ({
            asin: p.asin,
            title: (p.title as string)?.slice(0, 60),
            stats_current: (
              p.stats as { current?: number[] } | undefined
            )?.current?.slice(0, 10),
            // index 0=Amazon, 1=New, 2=Used, 4=ListPrice, 7=NewFBA
          }));
        }

        return NextResponse.json({
          endpoint: "debug-prices",
          category,
          dealCount: dealItems.length,
          deals: dealItems.map((d) => ({
            asin: d.asin,
            title: d.title?.slice(0, 60),
            dealPrice: d.dealPrice,
            buyBoxPrice: d.buyBoxPrice,
            currentPrice: d.currentPrice,
          })),
          productStats,
        });
      }

      default:
        return NextResponse.json({
          usage: [
            "/api/test-keepa?endpoint=search&q=headphones",
            "/api/test-keepa?endpoint=metadata&asin=B0CHWRXH8B",
            "/api/test-keepa?endpoint=prices&asins=B0CHWRXH8B,B09JQMJHXY",
            "/api/test-keepa?endpoint=deals&category=Electronics",
            "/api/test-keepa?endpoint=debug-prices&category=Electronics",
          ],
        });
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
