/**
 * Amazon PA API — Response Inspector
 * Shows the raw API response so we can plan integration carefully.
 * Run: node scripts/inspect-amazon-response.mjs
 */

import crypto from "crypto";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envLines  = fs.readFileSync(path.join(__dirname, "../.env"), "utf8").split("\n");

function getEnv(key) {
  for (const line of envLines) {
    const trimmed = line.split("#")[0].trim();
    if (trimmed.startsWith(key + "=")) return trimmed.slice(key.length + 1).trim();
  }
  return "";
}

const ACCESS_KEY    = getEnv("AMAZON_PA_ACCESS_KEY");
const SECRET_KEY    = getEnv("AMAZON_PA_SECRET_KEY");
const ASSOCIATE_TAG = getEnv("AMAZON_PA_ASSOCIATE_TAG");
const HOST          = getEnv("AMAZON_PA_HOST") || "webservices.amazon.com";
const REGION        = getEnv("AMAZON_PA_REGION") || "us-east-1";

function hmac(key, data) { return crypto.createHmac("sha256", key).update(data).digest(); }
function sha256(data)    { return crypto.createHash("sha256").update(data).digest("hex"); }
function pad2(n)         { return String(n).padStart(2, "0"); }

function sign(path, target, payload) {
  const now       = new Date();
  const dateStamp = `${now.getUTCFullYear()}${pad2(now.getUTCMonth()+1)}${pad2(now.getUTCDate())}`;
  const amzDate   = `${dateStamp}T${pad2(now.getUTCHours())}${pad2(now.getUTCMinutes())}${pad2(now.getUTCSeconds())}Z`;

  const hdrs = {
    "content-encoding": "amz-1.0",
    "content-type":     "application/json; charset=utf-8",
    "host":             HOST,
    "x-amz-date":      amzDate,
    "x-amz-target":    target,
  };
  const sortedKeys   = Object.keys(hdrs).sort();
  const canonicalHdr = sortedKeys.map(k => `${k}:${hdrs[k]}\n`).join("");
  const signedHdrs   = sortedKeys.join(";");
  const canonicalReq = ["POST", path, "", canonicalHdr, signedHdrs, sha256(payload)].join("\n");
  const credScope    = `${dateStamp}/${REGION}/ProductAdvertisingAPI/aws4_request`;
  const strToSign    = ["AWS4-HMAC-SHA256", amzDate, credScope, sha256(canonicalReq)].join("\n");
  const kSigning     = hmac(hmac(hmac(hmac("AWS4"+SECRET_KEY, dateStamp), REGION), "ProductAdvertisingAPI"), "aws4_request");
  const signature    = crypto.createHmac("sha256", kSigning).update(strToSign).digest("hex");

  return {
    ...hdrs,
    Authorization:    `AWS4-HMAC-SHA256 Credential=${ACCESS_KEY}/${credScope}, SignedHeaders=${signedHdrs}, Signature=${signature}`,
    "Content-Length": String(Buffer.byteLength(payload)),
  };
}

async function paApi(apiPath, target, body) {
  const payload = JSON.stringify(body);
  const headers = sign(apiPath, target, payload);
  const res     = await fetch(`https://${HOST}${apiPath}`, { method:"POST", headers, body: payload });
  return { status: res.status, data: await res.json() };
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function dollars(amount) { return amount != null ? `$${amount.toFixed(2)}` : "N/A"; }
function truncate(str, n) { return str?.length > n ? str.slice(0, n) + "…" : str; }

function printItem(item, i) {
  const listing  = item.Offers?.Listings?.[0];
  const current  = listing?.Price?.Amount;
  const original = listing?.SavingBasis?.Amount;
  const discount = current && original ? Math.round(((original - current) / original) * 100) : 0;

  console.log(`\n  [${i + 1}] ${truncate(item.ItemInfo?.Title?.DisplayValue, 70)}`);
  console.log(`       ASIN     : ${item.ASIN}`);
  console.log(`       Brand    : ${item.ItemInfo?.ByLineInfo?.Brand?.DisplayValue ?? "—"}`);
  console.log(`       Category : ${item.ItemInfo?.Classifications?.ProductGroup?.DisplayValue ?? "—"}`);
  console.log(`       Price    : ${dollars(current)}  (was ${dollars(original)})  ${discount > 0 ? `→ ${discount}% OFF` : ""}`);
  console.log(`       Rating   : ${item.CustomerReviews?.StarRating?.Value ?? "—"} ★  (${item.CustomerReviews?.Count ?? 0} reviews)`);
  console.log(`       Image    : ${item.Images?.Primary?.Large?.URL ? "✅ present" : "❌ missing"}`);
  console.log(`       Affiliate: https://www.amazon.com/dp/${item.ASIN}?tag=${ASSOCIATE_TAG}`);
}

// ── MAIN ──────────────────────────────────────────────────────────────────────
console.log("\n━━━ Amazon PA API — Response Inspector ━━━\n");
console.log("NOTE: Each section below = 1 API call. We have ~1 req/sec rate limit.\n");

// ── 1. SearchItems — Electronics ──────────────────────────────────────────────
console.log("━━ [CALL 1/2] SearchItems — Electronics (limit 5) ━━━━━━━━━━━━━━━━━━━━━━━");
const searchRes = await paApi(
  "/paapi5/searchitems",
  "com.amazon.paapi5.v1.ProductAdvertisingAPIv1.SearchItems",
  {
    Keywords:    "deals",
    Marketplace: "www.amazon.com",
    PartnerTag:  ASSOCIATE_TAG,
    PartnerType: "Associates",
    SearchIndex: "Electronics",
    SortBy:      "Featured",
    ItemCount:   5,
    Resources: [
      "ItemInfo.Title",
      "ItemInfo.ByLineInfo",
      "ItemInfo.Classifications",
      "Images.Primary.Large",
      "Offers.Listings.Price",
      "Offers.Listings.SavingBasis",
      "Offers.Listings.DeliveryInfo.IsPrimeEligible",
    ],
  }
);

if (searchRes.status === 200) {
  const items = searchRes.data.SearchResult?.Items ?? [];
  console.log(`\nTotal results available: ${searchRes.data.SearchResult?.TotalResultCount ?? "?"}`);
  console.log(`Returned: ${items.length} items`);
  items.forEach(printItem);

  console.log("\n\n  ── Full raw response (ALL fields) ──");
  console.log(JSON.stringify(searchRes.data, null, 2));
} else {
  console.log("❌ Error:", JSON.stringify(searchRes.data, null, 2));
}

// Wait 1 second to respect rate limit
await new Promise(r => setTimeout(r, 1100));

// ── 2. GetItems — fetch specific ASIN ─────────────────────────────────────────
console.log("\n\n━━ [CALL 2/2] GetItems — specific ASIN (B0CHWRXH8B = AirPods Pro) ━━━━━━━━━");
const getRes = await paApi(
  "/paapi5/getitems",
  "com.amazon.paapi5.v1.ProductAdvertisingAPIv1.GetItems",
  {
    ItemIds:     ["B0CHWRXH8B"],
    Marketplace: "www.amazon.com",
    PartnerTag:  ASSOCIATE_TAG,
    PartnerType: "Associates",
    Resources: [
      "ItemInfo.Title",
      "ItemInfo.ByLineInfo",
      "ItemInfo.Classifications",
      "Images.Primary.Large",
      "Offers.Listings.Price",
      "Offers.Listings.SavingBasis",
      "Offers.Listings.DeliveryInfo.IsPrimeEligible",
    ],
  }
);

if (getRes.status === 200) {
  const items = getRes.data.ItemsResult?.Items ?? [];
  items.forEach(printItem);
  console.log("\n  ── Full raw response (ALL fields) ──");
  console.log(JSON.stringify(getRes.data, null, 2));
} else {
  console.log("❌ Error:", JSON.stringify(getRes.data, null, 2));
}

console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
RATE LIMIT SUMMARY:
  PA API allows: ~1 request/second, max ~8,640 req/day
  Each page load that hits the API = 1 req
  Plan:
    ✅ Cache results in DB/Redis (revalidate every 5 min)
    ✅ Use revalidate = 300 in Next.js pages (already set)
    ✅ Only call API on cache miss, not every page load
    ✅ Dashboard: 1 API call cached for all users
    ✅ Deal detail: 1 API call per unique ASIN, cached
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);
