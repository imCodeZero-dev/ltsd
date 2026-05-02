"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, ExternalLink, Share2 } from "lucide-react";
import { StarRating } from "@/components/common/star-rating";
import { DealCard } from "@/components/deals/deal-card";
import { WatchlistButton } from "@/components/deals/watchlist-button";
import type { DealItem } from "@/lib/deal-api/types";
import { useTick } from "./use-tick";

const RATING_BARS = [
  { stars: 5, pct: 72 },
  { stars: 4, pct: 14 },
  { stars: 3, pct: 7 },
  { stars: 2, pct: 5 },
  { stars: 1, pct: 0 },
];

const MOCK_REVIEWS = [
  {
    name: "Adam Smith",
    date: "13 dec. 2023",
    stars: 4,
    text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua aute nostrud exercitation ullamco...",
  },
  {
    name: "Sarah Johnson",
    date: "28 jan. 2024",
    stars: 5,
    text: "Amazing product! Sound quality is outstanding and the noise cancellation works perfectly even in very loud environments.",
  },
];

const PRICE_POINTS = [400, 300, 440, 200, 250, 220, 300, 900, 700, 320, 800, 380, 400];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];

function formatUSD(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

// ── Image carousel ────────────────────────────────────────────────────────────
function ImageCarousel({
  images,
  activeImg,
  onPrev,
  onNext,
  onDot,
  mobile,
}: {
  images: string[];
  activeImg: number;
  onPrev: () => void;
  onNext: () => void;
  onDot: (i: number) => void;
  mobile?: boolean;
}) {
  return (
    <div>
      <div className={cn(
        "relative w-full aspect-square bg-white overflow-hidden",
        mobile ? "border-b border-[#E7E8E9]" : "rounded-2xl border border-[#E7E8E9]"
      )}>
        <Image
          src={images[activeImg]}
          alt="Product"
          fill
          sizes={mobile ? "100vw" : "480px"}
          className={cn("object-contain", mobile ? "p-8" : "p-10")}
          priority
        />
        {activeImg > 0 && (
          <button type="button" onClick={onPrev}
            className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white border border-[#E7E8E9] shadow flex items-center justify-center z-10">
            <ChevronLeft className="w-4 h-4 text-body" />
          </button>
        )}
        {activeImg < images.length - 1 && (
          <button type="button" onClick={onNext}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white border border-[#E7E8E9] shadow flex items-center justify-center z-10">
            <ChevronRight className="w-4 h-4 text-body" />
          </button>
        )}
        {mobile && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
            {images.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => onDot(i)}
                className={cn(
                  "h-1.5 rounded-full transition-all",
                  activeImg === i ? "w-5 bg-badge-bg" : "w-1.5 bg-border-mid"
                )}
              />
            ))}
          </div>
        )}
      </div>

      {!mobile && (
        <div className="flex gap-2.5 mt-3">
          {images.map((img, i) => (
            <button key={i} type="button" onClick={() => onDot(i)}
              className={cn(
                "w-16 h-16 rounded-xl border-2 bg-white overflow-hidden shrink-0 transition-all",
                activeImg === i ? "border-badge-bg" : "border-[#E7E8E9]"
              )}>
              <Image src={img} alt="" width={64} height={64} className="object-contain p-1.5 w-full h-full" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Price chart (SVG) ────────────────────────────────────────────────────────
function PriceChart() {
  const W = 800; const H = 200;
  const PAD = { t: 10, r: 110, b: 36, l: 44 };
  const cW = W - PAD.l - PAD.r;
  const cH = H - PAD.t - PAD.b;
  const toX = (i: number) => PAD.l + (i / (PRICE_POINTS.length - 1)) * cW;
  const toY = (v: number) => PAD.t + (1 - v / 1000) * cH;
  const pts = PRICE_POINTS.map((v, i) => `${toX(i)},${toY(v)}`).join(" ");
  const TI = 2;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" overflow="visible">
      {[0, 250, 500, 750, 1000].map((v) => (
        <g key={v}>
          <line x1={PAD.l} y1={toY(v)} x2={W - PAD.r} y2={toY(v)} stroke="#E7E8E9" strokeWidth={1} />
          <text x={PAD.l - 6} y={toY(v) + 4} textAnchor="end" fontSize={11} fill="#74777F">{v}</text>
        </g>
      ))}
      {MONTHS.map((m, i) => (
        <text key={m} x={PAD.l + (i / (MONTHS.length - 1)) * cW} y={H - 6} textAnchor="middle" fontSize={11} fill="#74777F">{m}</text>
      ))}
      <line x1={PAD.l} y1={toY(260)} x2={W - PAD.r} y2={toY(260)} stroke="#CBCBCB" strokeWidth={1} strokeDasharray="4 3" />
      <text x={W - PAD.r + 4} y={toY(260) + 4} fontSize={9} fill="#74777F">MARKET AVERAGE ($260)</text>
      <polyline points={pts} fill="none" stroke="#FE9800" strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={toX(TI)} cy={toY(PRICE_POINTS[TI])} r={5} fill="#000A1E" />
      <line x1={toX(TI)} y1={PAD.t} x2={toX(TI)} y2={H - PAD.b} stroke="#CBCBCB" strokeWidth={1} strokeDasharray="4 3" />
      <rect x={toX(TI) + 8} y={toY(PRICE_POINTS[TI]) - 36} width={120} height={52} rx={6} fill="white" stroke="#E7E8E9" strokeWidth={1} />
      <text x={toX(TI) + 68} y={toY(PRICE_POINTS[TI]) - 18} textAnchor="middle" fontSize={10} fill="#44474E">12 March, 2026</text>
      <text x={toX(TI) + 68} y={toY(PRICE_POINTS[TI]) - 4}  textAnchor="middle" fontSize={10} fill="#44474E">Highest: $1000</text>
      <text x={toX(TI) + 68} y={toY(PRICE_POINTS[TI]) + 10} textAnchor="middle" fontSize={10} fill="#FE9800">Lowest: $220</text>
    </svg>
  );
}

// ── Customer Ratings ──────────────────────────────────────────────────────────
function CustomerRatings({ deal }: { deal: DealItem }) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-base font-extrabold text-navy">Customer Ratings (from Amazon)</h2>
        <p className="text-xs text-body mt-0.5">Track rating of deal directly from Amazon</p>
      </div>
      <div className="flex flex-col sm:flex-row gap-6 sm:gap-10">
        <div className="shrink-0">
          <span className="text-6xl font-extrabold text-navy leading-none">{deal.rating.toFixed(1)}</span>
          <span className="text-sm text-body">/5</span>
          <div className="mt-2"><StarRating score={deal.rating} size="md" /></div>
          <p className="text-xs text-body mt-1">({deal.reviewCount.toLocaleString()} Reviews)</p>
        </div>
        <div className="flex-1 space-y-3">
          {RATING_BARS.map(({ stars, pct }) => (
            <div key={stars} className="flex items-center gap-3">
              <span className="text-xs text-body w-10 shrink-0">{stars} star</span>
              <div className="flex-1 h-2.5 rounded-full bg-[#F5F6F7] overflow-hidden">
                <div className="h-full rounded-full bg-badge-bg" style={{ width: `${pct}%` }} />
              </div>
              <span className="text-xs text-body w-8 shrink-0 text-right">{pct}%</span>
            </div>
          ))}
        </div>
      </div>
      <div className="space-y-5 pt-4 border-t border-[#E7E8E9]">
        {MOCK_REVIEWS.map((r, i) => (
          <div key={i}>
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-navy flex items-center justify-center text-xs font-bold text-white shrink-0">{r.name[0]}</div>
                <p className="text-sm font-bold text-navy">{r.name}</p>
              </div>
              <span className="text-xs text-body">{r.date}</span>
            </div>
            <div className="ml-9">
              <StarRating score={r.stars} size="sm" />
              <p className="text-sm text-body leading-relaxed mt-1">{r.text}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Price Intelligence ────────────────────────────────────────────────────────
function PriceIntelligence({ range, onRangeChange }: { range: number; onRangeChange: (r: number) => void }) {
  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-base font-extrabold text-navy">Price Intelligence</h2>
          <p className="text-xs text-body mt-0.5">Real-time market analytics and pricing history trends.</p>
        </div>
        <div className="flex rounded-lg border border-[#E7E8E9] overflow-hidden shrink-0">
          {["30 DAYS", "90 DAYS", "ALL TIME"].map((label, i) => (
            <button key={label} type="button" onClick={() => onRangeChange(i)}
              className={cn(
                "px-2.5 py-1.5 text-[9px] font-bold transition-colors border-r border-[#E7E8E9] last:border-r-0",
                range === i ? "bg-navy text-white" : "bg-white text-body"
              )}>
              {label}
            </button>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-3 flex-wrap">
        <span className="px-3 py-1 rounded-full bg-[#F0FBF5] text-[11px] font-semibold text-[#22A45D]">All-time low: $169</span>
        <span className="px-3 py-1 rounded-full bg-[#F5F6F7] text-[11px] font-semibold text-body">Avg Price: $212</span>
      </div>
      <div className="w-full overflow-x-auto">
        <PriceChart />
      </div>
      <div className="grid grid-cols-3 gap-4 pt-4 border-t border-[#E7E8E9]">
        {[
          { label: "All-time Low",  value: formatUSD(15900) },
          { label: "Average Price", value: formatUSD(22400) },
          { label: "All-time High", value: formatUSD(27900) },
        ].map(({ label, value }) => (
          <div key={label} className="text-center">
            <p className="text-xs text-body">{label}</p>
            <p className="text-base font-extrabold text-navy mt-1">{value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Similar Deals ─────────────────────────────────────────────────────────────
function SimilarDeals({ deals }: { deals: DealItem[] }) {
  return (
    <div>
      <h2 className="text-base font-extrabold text-navy mb-0.5">Similar Deals You Might Like</h2>
      <p className="text-xs text-body mb-4">Real-time market analytics and pricing history trends.</p>
      <div className="relative">
        <button type="button" aria-label="Scroll left"
          className="hidden lg:flex absolute -left-5 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-white border border-[#E7E8E9] shadow items-center justify-center">
          <ChevronLeft className="w-4 h-4 text-body" />
        </button>
        <div className="flex gap-3 overflow-x-auto scrollbar-none pb-1">
          {deals.map((d) => (
            <DealCard key={d.id} deal={d} className="shrink-0 w-56" />
          ))}
        </div>
        <button type="button" aria-label="Scroll right"
          className="hidden lg:flex absolute -right-5 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-white border border-[#E7E8E9] shadow items-center justify-center">
          <ChevronRight className="w-4 h-4 text-body" />
        </button>
      </div>
    </div>
  );
}

// ── Main Content ─────────────────────────────────────────────────────────────
export function DealDetailContent({
  deal,
  similarDeals,
}: {
  deal: DealItem;
  similarDeals: DealItem[];
}) {
  const images = [deal.imageUrl];
  const [activeImg, setActiveImg] = useState(0);
  const [activeTab, setActiveTab] = useState(0);
  const [chartRange, setChartRange] = useState(0);
  const timer = useTick(deal.expiresAt);
  const claimedPct = deal.totalCount > 0
    ? Math.round((deal.claimedCount / deal.totalCount) * 100)
    : 0;

  const dealInfo = (
    <div className="space-y-3.5">
      <StarRating score={deal.rating} reviewCount={deal.reviewCount} size="md" />
      <h1 className="text-xl font-extrabold text-navy leading-tight">{deal.title}</h1>
      {deal.brand && (
        <p className="text-sm text-body leading-relaxed">
          by {deal.brand}
        </p>
      )}

      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-3xl font-extrabold text-navy leading-none">{formatUSD(deal.currentPrice)}</span>
        {deal.originalPrice > deal.currentPrice && (
          <span className="text-base line-through text-body">{formatUSD(deal.originalPrice)}</span>
        )}
        {deal.discountPercent > 0 && (
          <span className="px-2 py-0.5 rounded text-xs font-bold text-white bg-badge-bg">
            {deal.discountPercent}% OFF
          </span>
        )}
      </div>

      {deal.discountPercent >= 20 && (
        <p className="text-xs font-semibold text-[#22A45D]">Best price in last 90 days</p>
      )}

      {timer && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-bold uppercase tracking-widest text-body">Deals end in</p>
            <span className="text-[11px] text-body">{timer.h}:{timer.m}:{timer.s}</span>
          </div>
          <div className="h-2.5 rounded-full bg-[#F5F6F7] overflow-hidden">
            <div className="h-full rounded-full bg-badge-bg" style={{ width: `${claimedPct}%` }} />
          </div>
          <p className="text-xs font-semibold text-[#FF5733]">
            Only {deal.totalCount - deal.claimedCount} deals left — selling fast!
          </p>
        </div>
      )}

      {deal.totalCount > 0 && (
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-bold uppercase tracking-widest text-body">Availability</p>
            <span className="text-[11px] font-semibold text-[#FF4444]">{claimedPct}% claimed</span>
          </div>
          <div className="h-2.5 rounded-full bg-[#F5F6F7] overflow-hidden">
            <div className="h-full rounded-full bg-[#FF4444]" style={{ width: `${claimedPct}%` }} />
          </div>
        </div>
      )}
    </div>
  );

  const ctaBar = (
    <div className="flex items-center gap-2.5">
      <a href={deal.affiliateUrl} target="_blank" rel="noopener noreferrer sponsored"
        className="flex-1 flex items-center justify-center gap-2 h-12 rounded-xl font-bold text-sm text-white bg-navy hover:opacity-90 transition-opacity">
        View Deal on Amazon
        <ExternalLink className="w-4 h-4" />
      </a>
      <WatchlistButton dealId={deal.id} deal={deal} size="lg" />
      <button type="button" aria-label="Share"
        className="w-12 h-12 rounded-xl border border-[#E7E8E9] bg-white flex items-center justify-center text-body shrink-0 hover:text-navy transition-colors">
        <Share2 className="w-5 h-5" />
      </button>
    </div>
  );

  return (
    <>
      {/* ══════════════ MOBILE (< lg) ══════════════════════════════════════ */}
      <div className="lg:hidden">
        <ImageCarousel
          images={images}
          activeImg={activeImg}
          onPrev={() => setActiveImg((p) => p - 1)}
          onNext={() => setActiveImg((p) => p + 1)}
          onDot={setActiveImg}
          mobile
        />

        <div className="px-4 pt-5 pb-32 space-y-5">
          {dealInfo}

          <div className="flex gap-2 overflow-x-auto scrollbar-none">
            {["Description", "Reviews", "Price Intelligence"].map((tab, i) => (
              <button key={tab} type="button" onClick={() => setActiveTab(i)}
                className={cn(
                  "shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all",
                  activeTab === i
                    ? "bg-badge-bg text-white border-badge-bg"
                    : "bg-white text-body border-[#E7E8E9]"
                )}>
                {tab}
              </button>
            ))}
          </div>

          <div className="bg-white rounded-2xl border border-[#E7E8E9] p-4">
            {activeTab === 0 && (
              <p className="text-sm text-body leading-relaxed">
                {deal.title} — {deal.brand ? `by ${deal.brand}. ` : ""}
                Check the latest pricing and deals on Amazon.
              </p>
            )}
            {activeTab === 1 && <CustomerRatings deal={deal} />}
            {activeTab === 2 && <PriceIntelligence range={chartRange} onRangeChange={setChartRange} />}
          </div>

          {similarDeals.length > 0 && <SimilarDeals deals={similarDeals} />}
        </div>

        <div className="fixed bottom-16 left-0 right-0 z-40 px-4 py-3 bg-white border-t border-[#E7E8E9]">
          {ctaBar}
        </div>
      </div>

      {/* ══════════════ DESKTOP (lg+) ══════════════════════════════════════ */}
      <div className="hidden lg:block max-w-350 mx-auto px-6 py-6 pb-16">
        <nav className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-body mb-6">
          <Link href="/deals" className="hover:text-navy transition-colors">{deal.category}</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-navy line-clamp-1">{deal.title}</span>
        </nav>

        <div className="flex gap-10 items-start">
          <div className="w-120 shrink-0">
            <ImageCarousel
              images={images}
              activeImg={activeImg}
              onPrev={() => setActiveImg((p) => p - 1)}
              onNext={() => setActiveImg((p) => p + 1)}
              onDot={setActiveImg}
            />
          </div>
          <div className="flex-1 min-w-0 space-y-4">
            {dealInfo}
            <div className="pt-2 border-t border-[#E7E8E9]">
              <p className="text-sm text-body leading-relaxed">
                {deal.title} — {deal.brand ? `by ${deal.brand}. ` : ""}
                Check the latest pricing and deals on Amazon.
              </p>
            </div>
            {ctaBar}
          </div>
        </div>

        <div className="mt-10 bg-white rounded-2xl border border-[#E7E8E9] p-8">
          <CustomerRatings deal={deal} />
        </div>
        <div className="mt-6 bg-white rounded-2xl border border-[#E7E8E9] p-8">
          <PriceIntelligence range={chartRange} onRangeChange={setChartRange} />
        </div>
        {similarDeals.length > 0 && (
          <div className="mt-8">
            <SimilarDeals deals={similarDeals} />
          </div>
        )}
      </div>
    </>
  );
}
