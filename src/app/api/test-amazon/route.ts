import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

const ACCESS_KEY    = process.env.AMAZON_PA_ACCESS_KEY    ?? "";
const SECRET_KEY    = process.env.AMAZON_PA_SECRET_KEY    ?? "";
const ASSOCIATE_TAG = process.env.AMAZON_PA_ASSOCIATE_TAG ?? "";
const HOST          = (process.env.AMAZON_PA_HOST ?? "webservices.amazon.com").split("#")[0].trim();
const REGION        = process.env.AMAZON_PA_REGION ?? "us-east-1";
const SERVICE       = "ProductAdvertisingAPI";

function hmac(key: string | Buffer, data: string): Buffer {
  return crypto.createHmac("sha256", key).update(data).digest();
}
function sha256hex(data: string) {
  return crypto.createHash("sha256").update(data).digest("hex");
}
function pad2(n: number) { return String(n).padStart(2, "0"); }

function buildHeaders(path: string, target: string, payload: string) {
  const now       = new Date();
  const dateStamp = `${now.getUTCFullYear()}${pad2(now.getUTCMonth()+1)}${pad2(now.getUTCDate())}`;
  const amzDate   = `${dateStamp}T${pad2(now.getUTCHours())}${pad2(now.getUTCMinutes())}${pad2(now.getUTCSeconds())}Z`;

  const hdrs: Record<string, string> = {
    "content-encoding": "amz-1.0",
    "content-type":     "application/json; charset=utf-8",
    "host":             HOST,
    "x-amz-date":      amzDate,
    "x-amz-target":    target,
  };

  const sortedKeys   = Object.keys(hdrs).sort();
  const canonicalHdr = sortedKeys.map(k => `${k}:${hdrs[k]}\n`).join("");
  const signedHdrs   = sortedKeys.join(";");
  const canonicalReq = ["POST", path, "", canonicalHdr, signedHdrs, sha256hex(payload)].join("\n");
  const credScope    = `${dateStamp}/${REGION}/${SERVICE}/aws4_request`;
  const strToSign    = ["AWS4-HMAC-SHA256", amzDate, credScope, sha256hex(canonicalReq)].join("\n");
  const kSign        = hmac(hmac(hmac(hmac("AWS4"+SECRET_KEY, dateStamp), REGION), SERVICE), "aws4_request");
  const signature    = crypto.createHmac("sha256", kSign).update(strToSign).digest("hex");

  return {
    ...hdrs,
    Authorization:    `AWS4-HMAC-SHA256 Credential=${ACCESS_KEY}/${credScope}, SignedHeaders=${signedHdrs}, Signature=${signature}`,
    "Content-Length": String(Buffer.byteLength(payload)),
  };
}

async function paApi(path: string, target: string, body: object) {
  const payload = JSON.stringify(body);
  const res     = await fetch(`https://${HOST}${path}`, {
    method:  "POST",
    headers: buildHeaders(path, target, payload),
    body:    payload,
    cache:   "no-store",
  });
  return { status: res.status, data: await res.json() };
}

const BASE_RESOURCES = [
  "ItemInfo.Title",
  "ItemInfo.ByLineInfo",
  "ItemInfo.Classifications",
  "Images.Primary.Large",
  "Offers.Listings.Price",
  "Offers.Listings.SavingBasis",
  "Offers.Listings.DeliveryInfo.IsPrimeEligible",
];

export async function GET(req: NextRequest) {
  const endpoint = req.nextUrl.searchParams.get("endpoint") ?? "search";

  try {
    let result;

    if (endpoint === "search") {
      // ── ENDPOINT 1: SearchItems ──────────────────────────────────────────
      result = await paApi(
        "/paapi5/searchitems",
        "com.amazon.paapi5.v1.ProductAdvertisingAPIv1.SearchItems",
        {
          Keywords:    req.nextUrl.searchParams.get("q") ?? "laptop",
          Marketplace: "www.amazon.com",
          PartnerTag:  ASSOCIATE_TAG,
          PartnerType: "Associates",
          SearchIndex: req.nextUrl.searchParams.get("index") ?? "Electronics",
          ItemCount:   5,
          Resources:   BASE_RESOURCES,
        }
      );
    } else if (endpoint === "getitems") {
      // ── ENDPOINT 2: GetItems ─────────────────────────────────────────────
      const asins = (req.nextUrl.searchParams.get("asins") ?? "B0CHWRXH8B").split(",");
      result = await paApi(
        "/paapi5/getitems",
        "com.amazon.paapi5.v1.ProductAdvertisingAPIv1.GetItems",
        {
          ItemIds:     asins,
          Marketplace: "www.amazon.com",
          PartnerTag:  ASSOCIATE_TAG,
          PartnerType: "Associates",
          Resources:   BASE_RESOURCES,
        }
      );
    } else if (endpoint === "browsenodes") {
      // ── ENDPOINT 3: GetBrowseNodes ───────────────────────────────────────
      result = await paApi(
        "/paapi5/getbrowsenodes",
        "com.amazon.paapi5.v1.ProductAdvertisingAPIv1.GetBrowseNodes",
        {
          BrowseNodeIds: ["493964", "172282", "1055398"], // Electronics, Home, Fashion
          Marketplace:   "www.amazon.com",
          PartnerTag:    ASSOCIATE_TAG,
          PartnerType:   "Associates",
          Resources:     ["BrowseNodes.Ancestor", "BrowseNodes.Children"],
          LanguagesOfPreference: ["en_US"],
        }
      );
    } else if (endpoint === "getvariations") {
      // ── ENDPOINT 4: GetVariations ────────────────────────────────────────
      result = await paApi(
        "/paapi5/getvariations",
        "com.amazon.paapi5.v1.ProductAdvertisingAPIv1.GetVariations",
        {
          ASIN:        req.nextUrl.searchParams.get("asin") ?? "B0CHWRXH8B",
          Marketplace: "www.amazon.com",
          PartnerTag:  ASSOCIATE_TAG,
          PartnerType: "Associates",
          Resources:   [
            "ItemInfo.Title",
            "ItemInfo.ByLineInfo",
            "Images.Primary.Large",
            "VariationSummary.VariationDimension",
            "Offers.Listings.Price",
          ],
        }
      );
    } else {
      return NextResponse.json({ error: "Unknown endpoint. Use: search | getitems | browsenodes | getvariations" }, { status: 400 });
    }

    return NextResponse.json({
      endpoint,
      httpStatus: result.status,
      data:       result.data,
    });

  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
