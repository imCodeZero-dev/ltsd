import { NextResponse } from "next/server";
import { KeepaProvider } from "@/lib/deal-api/providers/keepa";
import { requireAdminOrThrow } from "@/lib/auth-guard";

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
  // Protected: admin only
  try { await requireAdminOrThrow(); } catch (e) { return e as Response; }

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

      // Product Finder — discover top brands per category (single or all)
      case "product-finder": {
        const KEEPA_BASE = "https://api.keepa.com";
        const API_KEY = process.env.KEEPA_API_KEY ?? "";

        // Amazon root category IDs
        const ROOT_CATS: Record<string, number> = {
          "Electronics":              172282,
          "Home & Kitchen":           1055398,
          "Sports & Outdoors":        3375251,
          "Health & Personal Care":   3760911,
          "Clothing":                 7141123011,
          "Tools & Home Improvement": 228013011,
          "Automotive":               15684181,
          "Baby":                     165796011,
          "Video Games":              468642,
          "Office Products":          1064954,
          "Grocery":                  16310101,
          "Toys & Games":             165793011,
          "Pet Supplies":             2619533011,
          "Computers":                541966,
        };

        async function fetchBrandsForCategory(catName: string, catId: number) {
          const selection = JSON.stringify({
            rootCategory: catId,
            productType: [0],
            hasReviews: true,
            minRating: 35,
            salesRankRange: [0, 100000],
            perPage: 50,   // need enough results for searchInsights to populate
            page: 0,
          });
          const u = new URL(`${KEEPA_BASE}/query`);
          u.searchParams.set("key", API_KEY);
          u.searchParams.set("domain", "1");
          u.searchParams.set("selection", selection);
          u.searchParams.set("stats", "1");
          const r = await fetch(u.toString(), { cache: "no-store" });
          const data = await r.json() as Record<string, unknown>;
          const insights = data.searchInsights as Record<string, unknown> | undefined;
          const brands = (insights?.topBrandsWithCounts ?? {}) as Record<string, number>;
          return {
            category: catName,
            tokensLeft: data.tokensLeft as number,
            totalResults: data.totalResults as number,
            brands,
          };
        }

        const category = searchParams.get("category") ?? "Electronics";

        // "All" mode — loop all categories sequentially (respect rate limit)
        if (category === "All") {
          const allBrands: Record<string, { count: number; categories: string[] }> = {};
          const perCategory: { category: string; brands: Record<string, number>; totalResults: number }[] = [];
          let lastTokensLeft = 0;

          for (const [catName, catId] of Object.entries(ROOT_CATS)) {
            const result = await fetchBrandsForCategory(catName, catId);
            lastTokensLeft = result.tokensLeft;
            perCategory.push({
              category: catName,
              brands: result.brands,
              totalResults: result.totalResults,
            });

            // Merge brands — skip "generic" as it's not a real brand
            for (const [brand, count] of Object.entries(result.brands)) {
              const key = brand.toLowerCase();
              if (key === "generic" || key === "unbranded" || key === "n/a") continue;
              if (!allBrands[brand]) {
                allBrands[brand] = { count: 0, categories: [] };
              }
              allBrands[brand].count += count;
              allBrands[brand].categories.push(catName);
            }

            // Small delay between calls to respect rate limits
            await new Promise((r) => setTimeout(r, 200));
          }

          // Sort by total count descending
          const sorted = Object.entries(allBrands)
            .sort((a, b) => b[1].count - a[1].count)
            .map(([name, data]) => ({ name, count: data.count, categories: data.categories }));

          return NextResponse.json({
            endpoint: "product-finder",
            mode: "all-categories",
            categoriesQueried: Object.keys(ROOT_CATS).length,
            uniqueBrands: sorted.length,
            tokensLeft: lastTokensLeft,
            brands: sorted,
            perCategory,
          });
        }

        // Single category mode
        const rootCat = ROOT_CATS[category] ?? 172282;
        const result = await fetchBrandsForCategory(category, rootCat);

        return NextResponse.json({
          endpoint: "product-finder",
          category,
          rootCategoryId: rootCat,
          totalResults: result.totalResults,
          tokensLeft: result.tokensLeft,
          brands: result.brands,
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
            "/api/test-keepa?endpoint=product-finder&category=Electronics",
          ],
        });
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
