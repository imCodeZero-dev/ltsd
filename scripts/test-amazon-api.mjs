/**
 * Amazon PA API 5.0 — credential test script
 * No extra packages needed — uses Node.js built-in crypto + https
 *
 * Run:  node scripts/test-amazon-api.mjs
 */

import crypto from "crypto";
import https from "https";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// ── Load .env manually (no dotenv needed) ─────────────────────────────────────
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, "../.env");
const envLines = fs.readFileSync(envPath, "utf8").split("\n");

function getEnv(key) {
  for (const line of envLines) {
    const trimmed = line.split("#")[0].trim(); // strip inline comments
    if (trimmed.startsWith(key + "=")) {
      return trimmed.slice(key.length + 1).trim();
    }
  }
  return "";
}

const ACCESS_KEY    = getEnv("AMAZON_PA_ACCESS_KEY");
const SECRET_KEY    = getEnv("AMAZON_PA_SECRET_KEY");
const ASSOCIATE_TAG = getEnv("AMAZON_PA_ASSOCIATE_TAG");
const HOST          = getEnv("AMAZON_PA_HOST") || "webservices.amazon.com";
const REGION        = getEnv("AMAZON_PA_REGION") || "us-east-1";

// ── Validate env vars present ─────────────────────────────────────────────────
console.log("\n━━━ Amazon PA API Credential Test ━━━\n");
console.log("ACCESS_KEY    :", ACCESS_KEY   ? `${ACCESS_KEY.slice(0, 20)}...` : "❌ MISSING");
console.log("SECRET_KEY    :", SECRET_KEY   ? `${SECRET_KEY.slice(0, 10)}...` : "❌ MISSING");
console.log("ASSOCIATE_TAG :", ASSOCIATE_TAG || "❌ MISSING");
console.log("HOST          :", HOST);
console.log("REGION        :", REGION);
console.log("");

if (!ACCESS_KEY || !SECRET_KEY || !ASSOCIATE_TAG) {
  console.error("❌ Missing required env vars. Check your .env file.");
  process.exit(1);
}

// ── AWS Signature V4 helpers ──────────────────────────────────────────────────
function hmac(key, data) {
  return crypto.createHmac("sha256", key).update(data).digest();
}

function sha256(data) {
  return crypto.createHash("sha256").update(data).digest("hex");
}

function getSigningKey(secretKey, dateStamp, region, service) {
  const kDate    = hmac("AWS4" + secretKey, dateStamp);
  const kRegion  = hmac(kDate, region);
  const kService = hmac(kRegion, service);
  const kSigning = hmac(kService, "aws4_request");
  return kSigning;
}

function pad2(n) { return String(n).padStart(2, "0"); }

function getTimestamps() {
  const now = new Date();
  const dateStamp = `${now.getUTCFullYear()}${pad2(now.getUTCMonth() + 1)}${pad2(now.getUTCDate())}`;
  const amzDate   = `${dateStamp}T${pad2(now.getUTCHours())}${pad2(now.getUTCMinutes())}${pad2(now.getUTCSeconds())}Z`;
  return { dateStamp, amzDate };
}

// ── Build & sign request ──────────────────────────────────────────────────────
const SERVICE = "ProductAdvertisingAPI";
const METHOD  = "POST";
const URI     = "/paapi5/searchitems";

const payload = JSON.stringify({
  Keywords:    "laptop",
  Marketplace: "www.amazon.com",
  PartnerTag:  ASSOCIATE_TAG,
  PartnerType: "Associates",
  SearchIndex: "Electronics",
  Resources:   ["ItemInfo.Title", "Offers.Listings.Price"],
  ItemCount:   1,
});

const { dateStamp, amzDate } = getTimestamps();
const payloadHash = sha256(payload);

const headers = {
  "content-encoding": "amz-1.0",
  "content-type":     "application/json; charset=utf-8",
  "host":             HOST,
  "x-amz-date":      amzDate,
  "x-amz-target":    "com.amazon.paapi5.v1.ProductAdvertisingAPIv1.SearchItems",
};

// Canonical headers (sorted)
const sortedHeaderKeys = Object.keys(headers).sort();
const canonicalHeaders = sortedHeaderKeys.map((k) => `${k}:${headers[k]}\n`).join("");
const signedHeaders    = sortedHeaderKeys.join(";");

const canonicalRequest = [
  METHOD,
  URI,
  "",  // no query string
  canonicalHeaders,
  signedHeaders,
  payloadHash,
].join("\n");

const credentialScope = `${dateStamp}/${REGION}/${SERVICE}/aws4_request`;
const stringToSign = [
  "AWS4-HMAC-SHA256",
  amzDate,
  credentialScope,
  sha256(canonicalRequest),
].join("\n");

const signingKey = getSigningKey(SECRET_KEY, dateStamp, REGION, SERVICE);
const signature  = crypto.createHmac("sha256", signingKey).update(stringToSign).digest("hex");

const authorization =
  `AWS4-HMAC-SHA256 Credential=${ACCESS_KEY}/${credentialScope}, ` +
  `SignedHeaders=${signedHeaders}, Signature=${signature}`;

const requestHeaders = {
  ...headers,
  Authorization: authorization,
  "Content-Length": Buffer.byteLength(payload),
};

// ── Fire the request ──────────────────────────────────────────────────────────
console.log("⏳ Sending SearchItems request to PA API 5.0...\n");

const req = https.request(
  {
    hostname: HOST,
    path:     URI,
    method:   METHOD,
    headers:  requestHeaders,
  },
  (res) => {
    let body = "";
    res.on("data", (chunk) => (body += chunk));
    res.on("end", () => {
      console.log(`HTTP Status : ${res.statusCode} ${res.statusMessage}`);
      console.log("");

      let parsed;
      try {
        parsed = JSON.parse(body);
      } catch {
        console.log("Raw response:\n", body);
        return;
      }

      if (res.statusCode === 200) {
        console.log("✅ SUCCESS — credentials are working!\n");
        const items = parsed.SearchResult?.Items ?? [];
        if (items.length > 0) {
          console.log(`First result: "${items[0].ItemInfo?.Title?.DisplayValue}"`);
          const price = items[0].Offers?.Listings?.[0]?.Price?.DisplayAmount;
          if (price) console.log(`Price       : ${price}`);
        }
      } else {
        console.log("❌ API returned an error:\n");

        // Friendly error explanations
        const errCode = parsed.__type || parsed.Errors?.[0]?.Code || "";
        const errMsg  = parsed.message || parsed.Errors?.[0]?.Message || JSON.stringify(parsed, null, 2);

        console.log(`Code    : ${errCode}`);
        console.log(`Message : ${errMsg}\n`);

        if (errCode.includes("InvalidSignature") || errCode.includes("SignatureDoesNotMatch")) {
          console.log("💡 Hint: The Access Key / Secret Key are wrong or in the wrong format.");
          console.log("   PA API keys look like: AKIAIOSFODNN7EXAMPLE (20 chars)");
          console.log("   Your key starts with 'amzn1...' which is an OAuth key, not a PA API key.");
          console.log("   Ask the client for the PA API keys from: https://affiliate-program.amazon.com → Tools → Product Advertising API");
        } else if (errCode.includes("InvalidPartnerTag") || errMsg.includes("PartnerTag")) {
          console.log("💡 Hint: The ASSOCIATE_TAG is invalid or not approved yet.");
        } else if (errCode.includes("TooManyRequests") || res.statusCode === 429) {
          console.log("💡 Hint: Rate limited. Wait a moment and try again.");
        } else if (res.statusCode === 401 || res.statusCode === 403) {
          console.log("💡 Hint: Auth failed. Credentials may be correct format but inactive/expired.");
        }

        console.log("\nFull response:\n", JSON.stringify(parsed, null, 2));
      }
    });
  }
);

req.on("error", (err) => {
  console.error("❌ Network error:", err.message);
});

req.write(payload);
req.end();
