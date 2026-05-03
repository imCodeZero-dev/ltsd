"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, ExternalLink, Share2, TrendingDown } from "lucide-react";
import { StarRating } from "@/components/common/star-rating";
import { DealCard } from "@/components/deals/deal-card";
import { WatchlistButton } from "@/components/deals/watchlist-button";
import type { DealItem, PriceStats } from "@/lib/deal-api/types";
import { useTick } from "./use-tick";

// ── Static fallback data ──────────────────────────────────────────────────────

function ratingBarsFromScore(score: number): { stars: number; pct: number }[] {
  const t = (Math.max(1, Math.min(5, score)) - 1) / 4; // 0..1
  const raw = [
    Math.round(10 + t * 75), // 5★
    Math.round(5  + t * 12), // 4★
    Math.round(8  - t * 6),  // 3★
    Math.round(8  - t * 6),  // 2★
    Math.round(10 - t * 8),  // 1★
  ];
  const total = raw.reduce((a, b) => a + b, 0);
  const pcts = raw.map((v) => Math.max(1, Math.round((v / total) * 100)));
  pcts[4] = Math.max(1, 100 - pcts.slice(0, 4).reduce((a, b) => a + b, 0));
  return [5, 4, 3, 2, 1].map((stars, i) => ({ stars, pct: pcts[i] }));
}


const FALLBACK_PRICE_POINTS = [400, 300, 440, 200, 250, 220, 300, 900, 700, 320, 800, 380, 400];
const FALLBACK_MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];

// ── Chart data builder ────────────────────────────────────────────────────────

interface ChartData {
  points: number[];   // dollar prices
  months: string[];   // month labels (same length as points or fewer)
  yMax: number;       // rounded max for Y axis
  allTimeLow: number;
  avgPrice: number;
  allTimeHigh: number;
}

function buildChartData(
  history: { price: number; recordedAt: string }[],
  priceStats: PriceStats | null
): ChartData {
  // Default fallback
  const fallback: ChartData = {
    points: FALLBACK_PRICE_POINTS,
    months: FALLBACK_MONTHS,
    yMax: 1000,
    allTimeLow: 109,
    avgPrice: 212,
    allTimeHigh: 279,
  };

  if (!history.length) {
    if (priceStats) {
      return { ...fallback, allTimeLow: priceStats.allTimeLow, avgPrice: priceStats.avgPrice, allTimeHigh: priceStats.allTimeHigh };
    }
    return fallback;
  }

  // Group prices by month key "YYYY-MM"
  const byMonth = new Map<string, number[]>();
  for (const h of history) {
    const d = new Date(h.recordedAt);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (!byMonth.has(key)) byMonth.set(key, []);
    byMonth.get(key)!.push(h.price);
  }

  // Take last 6 months sorted
  const sortedKeys = [...byMonth.keys()].sort().slice(-6);
  if (sortedKeys.length < 2) return fallback;

  const points = sortedKeys.map((k) => {
    const prices = byMonth.get(k)!;
    return Math.round(prices.reduce((a, b) => a + b, 0) / prices.length);
  });

  const months = sortedKeys.map((k) => {
    const [y, m] = k.split("-");
    return new Date(Number(y), Number(m) - 1).toLocaleString("en-US", { month: "short" });
  });

  const allPrices = history.map((h) => h.price);
  const minPrice  = Math.min(...allPrices);
  const maxPrice  = Math.max(...allPrices);
  const avgCalc   = Math.round(allPrices.reduce((a, b) => a + b, 0) / allPrices.length);
  const yMax      = Math.ceil(maxPrice / 100) * 100 + 100;

  return {
    points,
    months,
    yMax,
    allTimeLow:  priceStats?.allTimeLow  ?? minPrice,
    avgPrice:    priceStats?.avgPrice    ?? avgCalc,
    allTimeHigh: priceStats?.allTimeHigh ?? maxPrice,
  };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

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
  stretch,
}: {
  images: string[];
  activeImg: number;
  onPrev: () => void;
  onNext: () => void;
  onDot: (i: number) => void;
  mobile?: boolean;
  stretch?: boolean;
}) {
  return (
    // stretch: flex col so main image grows to fill remaining height
    <div className={cn(stretch && "flex flex-col flex-1")}>
      {/* Main image */}
      <div className={cn(
        "relative w-full bg-white overflow-hidden",
        mobile
          ? "aspect-square border-b border-[#E7E8E9]"
          : stretch
            ? "flex-1 min-h-0 rounded-2xl border border-[#E7E8E9]"
            : "aspect-[4/3] rounded-2xl border border-[#E7E8E9]"
      )}>
        <Image
          src={images[activeImg]}
          alt="Product"
          fill
          sizes={mobile ? "100vw" : "600px"}
          className="object-contain p-8"
          priority
        />

        {/* Nav arrows */}
        {images.length > 1 && activeImg > 0 && (
          <button type="button" onClick={onPrev}
            className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white border border-[#E7E8E9] shadow-md flex items-center justify-center z-10 hover:border-badge-bg transition-colors">
            <ChevronLeft className="w-4 h-4 text-body" />
          </button>
        )}
        {images.length > 1 && activeImg < images.length - 1 && (
          <button type="button" onClick={onNext}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white border border-[#E7E8E9] shadow-md flex items-center justify-center z-10 hover:border-badge-bg transition-colors">
            <ChevronRight className="w-4 h-4 text-body" />
          </button>
        )}

        {/* Mobile dot indicators */}
        {mobile && images.length > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
            {images.map((_, i) => (
              <button key={i} type="button" onClick={() => onDot(i)}
                className={cn(
                  "h-1.5 rounded-full transition-all",
                  activeImg === i ? "w-5 bg-badge-bg" : "w-1.5 bg-[#C4C6CE]"
                )} />
            ))}
          </div>
        )}
      </div>

      {/* Desktop thumbnails */}
      {!mobile && (
        <div className="flex gap-2.5 mt-3">
          {images.map((img, i) => (
            <button key={i} type="button" onClick={() => onDot(i)}
              className={cn(
                "w-[72px] h-[72px] rounded-xl border-2 bg-white overflow-hidden shrink-0 transition-all",
                activeImg === i ? "border-badge-bg" : "border-[#E7E8E9] hover:border-[#C4C6CE]"
              )}>
              <Image src={img} alt="" width={72} height={72} className="object-contain p-2 w-full h-full" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Timer boxes ───────────────────────────────────────────────────────────────
function TimerBoxes({ timer }: { timer: { d: string; h: string; m: string; s: string } }) {
  const boxes = [
    { value: timer.d, label: "DAYS" },
    { value: timer.h, label: "HOURS" },
    { value: timer.m, label: "MINS" },
    { value: timer.s, label: "SEC" },
  ];
  return (
    <div className="flex items-center gap-2">
      {boxes.map(({ value, label }) => (
        <div key={label}
          className="w-12 h-12 rounded-xl border border-[#E7E8E9] bg-white flex flex-col items-center justify-center shadow-sm">
          <span className="text-base font-extrabold text-navy leading-none tabular-nums" style={{ fontFamily: "var(--font-lato)" }}>
            {value}
          </span>
          <span className="text-[9px] font-bold text-body leading-none mt-0.5 uppercase tracking-wide">{label}</span>
        </div>
      ))}
    </div>
  );
}

// ── Price history chart (SVG) ─────────────────────────────────────────────────
function PriceChart({ data }: { data: ChartData }) {
  const { points, months, yMax } = data;
  const W = 800; const H = 240;
  const PAD = { t: 60, r: 8, b: 44, l: 60 };
  const cW = W - PAD.l - PAD.r;
  const cH = H - PAD.t - PAD.b;

  const toX = (i: number) => PAD.l + (i / Math.max(points.length - 1, 1)) * cW;
  const toY = (v: number) => PAD.t + (1 - v / yMax) * cH;

  const pts = points.map((v, i) => `${toX(i)},${toY(v)}`).join(" ");
  const areaPath =
    `M${toX(0)},${toY(points[0])} ` +
    points.slice(1).map((v, i) => `L${toX(i + 1)},${toY(v)}`).join(" ") +
    ` L${toX(points.length - 1)},${toY(0)} L${toX(0)},${toY(0)} Z`;

  // Tooltip on the lowest price point
  const TI = points.indexOf(Math.min(...points));
  const dotX = toX(TI);
  const dotY = toY(points[TI]);
  const TW = 150; const TH = 56;
  const TX = Math.min(dotX + 10, PAD.l + cW - TW);
  const TY = Math.max(PAD.t, Math.min(dotY - TH / 2, PAD.t + cH - TH));

  // Y axis grid: 5 evenly spaced values from 0 to yMax
  const gridValues = Array.from({ length: 5 }, (_, i) => Math.round((yMax / 4) * i));
  // Market average line
  const avgY = toY(data.avgPrice);

  // Month labels: evenly distribute across chart width
  const monthStep = months.length > 1 ? cW / (months.length - 1) : cW;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full">

      {/* Horizontal dashed grid lines */}
      {gridValues.map((v) => (
        <g key={v}>
          <line x1={PAD.l} y1={toY(v)} x2={PAD.l + cW} y2={toY(v)}
            stroke="#E7E8E9" strokeWidth={1} strokeDasharray="5 5" />
          <text x={PAD.l - 8} y={toY(v) + 4} textAnchor="end" fontSize={12} fill="#9AA0AB">{v}</text>
        </g>
      ))}

      {/* Month labels */}
      {months.map((m, i) => (
        <text key={`${m}-${i}`}
          x={months.length === 1 ? PAD.l + cW / 2 : PAD.l + i * monthStep}
          y={H - 8}
          textAnchor="middle" fontSize={12} fill="#9AA0AB">{m}
        </text>
      ))}

      {/* Area fill */}
      <path d={areaPath} fill="#FE9800" fillOpacity={0.07} />

      {/* Price line */}
      <polyline points={pts} fill="none" stroke="#FE9800" strokeWidth={2.5}
        strokeLinejoin="round" strokeLinecap="round" />

      {/* Market average dashed line + label */}
      <line x1={PAD.l} y1={avgY} x2={PAD.l + cW} y2={avgY}
        stroke="#CBCBCB" strokeWidth={1} strokeDasharray="5 4" />
      <text x={PAD.l + cW} y={avgY - 5} textAnchor="end" fontSize={9} fill="#AAAAAA" letterSpacing={0.5}>
        MARKET AVERAGE (${Math.round(data.avgPrice)})
      </text>

      {/* Vertical dashed line through dot */}
      <line x1={dotX} y1={PAD.t} x2={dotX} y2={PAD.t + cH}
        stroke="#CBCBCB" strokeWidth={1} strokeDasharray="5 4" />

      {/* Tooltip */}
      <rect x={TX} y={TY} width={TW} height={TH} rx={8}
        fill="white" stroke="#E7E8E9" strokeWidth={1}
        filter="drop-shadow(0 2px 8px rgba(0,0,0,0.08))" />
      <text x={TX + 12} y={TY + 16} fontSize={10} fill="#74777F">
        {months[TI] ?? ""} lowest price
      </text>
      <line x1={TX + 10} y1={TY + 22} x2={TX + TW - 10} y2={TY + 22}
        stroke="#F0F0F0" strokeWidth={0.8} />
      <text x={TX + 12} y={TY + 37} fontSize={11} fontWeight="600" fill="#000A1E">
        High: ${Math.round(data.allTimeHigh)}
      </text>
      <text x={TX + 12} y={TY + 51} fontSize={11} fontWeight="600" fill="#FE9800">
        Low: ${Math.round(data.allTimeLow)}
      </text>

      {/* Dot */}
      <circle cx={dotX} cy={dotY} r={5} fill="#000A1E" />
    </svg>
  );
}


// ── Customer Ratings ──────────────────────────────────────────────────────────
function CustomerRatings({ deal }: { deal: DealItem }) {
  const rating  = deal.rating > 0 ? deal.rating : 4.5;
  const reviews = deal.reviewCount > 0 ? deal.reviewCount : 50;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="pb-5 border-b border-[#E7E8E9]">
        <h2 className="text-xl font-extrabold text-navy" style={{ fontFamily: "var(--font-lato)" }}>
          Customer Ratings (from Amazon)
        </h2>
        <p className="text-sm text-body mt-1">Track rating of deal directly from Amazon</p>
      </div>

      {/* Body row */}
      <div className="flex flex-col lg:flex-row gap-8 lg:gap-10">

        {/* ── Left: big score + bars ─────────────────────────────────────── */}
        <div className="flex gap-8 shrink-0 items-start">
          {/* Score */}
          <div className="shrink-0">
            <div className="flex items-end gap-1 leading-none">
              <span className="text-[96px] font-extrabold text-navy leading-none" style={{ fontFamily: "var(--font-lato)" }}>
                {rating.toFixed(1)}
              </span>
              <span className="text-2xl text-body mb-4">/5</span>
            </div>
            <div className="mt-2">
              <StarRating score={rating} size="md" hideScore />
            </div>
            <p className="text-xs text-body mt-2">({reviews.toLocaleString()} New Review)</p>
          </div>

          {/* Bars */}
          <div className="space-y-2.5 w-56 pt-3">
            {ratingBarsFromScore(rating).map(({ stars, pct }) => (
              <div key={stars} className="flex items-center gap-3">
                <span className="text-xs text-body w-10 shrink-0">{stars} star</span>
                <div className="flex-1 h-2.5 rounded-full bg-[#EBEBEB] overflow-hidden">
                  <div className="h-full rounded-full bg-badge-bg transition-all" style={{ width: `${pct}%` }} />
                </div>
                <span className="text-xs text-body w-8 text-right shrink-0">{pct}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right: link to Amazon reviews */}
        <div className="hidden lg:flex flex-1 flex-col justify-center items-center gap-3 pl-10 border-l border-[#E7E8E9]">
          <p className="text-sm text-body text-center">
            This product has <span className="font-semibold text-navy">{reviews.toLocaleString()}+ verified reviews</span> on Amazon.
          </p>
          <a
            href={deal.affiliateUrl}
            target="_blank"
            rel="noopener noreferrer sponsored"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-navy text-white text-xs font-bold hover:opacity-90 transition-opacity"
          >
            View all reviews on Amazon
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </div>
  );
}

// ── Price Intelligence ────────────────────────────────────────────────────────
function PriceIntelligence({
  range,
  onRangeChange,
  chartData,
}: {
  range: number;
  onRangeChange: (r: number) => void;
  chartData: ChartData;
}) {
  return (
    <div className="space-y-4">

      {/* Title + segmented tabs — sit on page background, no white card */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-xl font-extrabold text-navy" style={{ fontFamily: "var(--font-lato)" }}>Price Intelligence</h2>
          <p className="text-sm text-body mt-1">Real-time market analytics and pricing history trends.</p>
        </div>
        <div className="flex items-center bg-[#F0F1F3] rounded-full p-1 shrink-0">
          {["30 DAYS", "90 DAYS", "ALL TIME"].map((label, i) => (
            <button key={label} type="button" onClick={() => onRangeChange(i)}
              className={cn(
                "px-4 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wide transition-all",
                range === i ? "bg-white text-navy shadow-sm" : "text-body hover:text-navy"
              )}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* White card — pills + chart + stats */}
      <div className="bg-white rounded-2xl border border-[#E7E8E9] px-6 pt-5 pb-6">
        {/* Pills */}
        <div className="flex items-center gap-2 flex-wrap mb-4">
          <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-[#F0FBF5] border border-[#B8EDD4] text-[11px] font-semibold text-[#22A45D]">
            <TrendingDown className="w-3 h-3" />
            All-time low: ${Math.round(chartData.allTimeLow)}
          </span>
          <span className="px-3 py-1 rounded-full bg-[#F5F6F7] border border-[#E7E8E9] text-[11px] font-semibold text-body">
            Avg Price: ${Math.round(chartData.avgPrice)}
          </span>
        </div>

        <div className="w-full overflow-visible">
          <PriceChart data={chartData} />
        </div>

        <div className="grid grid-cols-3 gap-4 pt-5 border-t border-[#E7E8E9] mt-2">
          {[
            { label: "All-time Low",  value: `$${Math.round(chartData.allTimeLow)}` },
            { label: "Average Price", value: `$${Math.round(chartData.avgPrice)}` },
            { label: "All-time High", value: `$${Math.round(chartData.allTimeHigh)}` },
          ].map(({ label, value }) => (
            <div key={label} className="text-center">
              <p className="text-xs text-body">{label}</p>
              <p className="text-2xl font-extrabold text-navy mt-1" style={{ fontFamily: "var(--font-lato)" }}>{value}</p>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}

// ── Similar Deals ─────────────────────────────────────────────────────────────
function SimilarDeals({ deals }: { deals: DealItem[] }) {
  return (
    <div>
      <h2 className="text-xl font-extrabold text-navy mb-1" style={{ fontFamily: "var(--font-lato)" }}>
        Similar Deals You Might Like
      </h2>
      <p className="text-sm text-body mb-5">Deals related to your current selection.</p>
      <div className="relative">
        <button type="button" aria-label="Scroll left"
          className="hidden lg:flex absolute -left-5 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-white border border-[#E7E8E9] shadow items-center justify-center hover:border-badge-bg transition-colors">
          <ChevronLeft className="w-4 h-4 text-body" />
        </button>
        {/* 2 cols on mobile, 4 cols on lg+ */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {deals.slice(0, 4).map((d) => (
            <DealCard key={d.id} deal={d} />
          ))}
        </div>
        <button type="button" aria-label="Scroll right"
          className="hidden lg:flex absolute -right-5 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-white border border-[#E7E8E9] shadow items-center justify-center hover:border-badge-bg transition-colors">
          <ChevronRight className="w-4 h-4 text-body" />
        </button>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export function DealDetailContent({
  deal,
  similarDeals,
  priceHistory = [],
  priceStats = null,
}: {
  deal: DealItem;
  similarDeals: DealItem[];
  priceHistory?: { price: number; recordedAt: string }[];
  priceStats?: PriceStats | null;
}) {
  const chartData = buildChartData(priceHistory, priceStats);
  const images = deal.images?.length ? deal.images : [deal.imageUrl];

  const [activeImg, setActiveImg]   = useState(0);
  const [activeTab, setActiveTab]   = useState(0);
  const [chartRange, setChartRange] = useState(0);
  const timer = useTick(deal.expiresAt);

  const claimedPct = deal.totalCount > 0
    ? Math.round((deal.claimedCount / deal.totalCount) * 100)
    : 88;
  const dealsLeft = deal.totalCount > 0 ? deal.totalCount - deal.claimedCount : 12;

  // Breadcrumb: Category > Brand > first 3 words of title
  const shortTitle = deal.title.split(" ").slice(0, 4).join(" ").toUpperCase();
  const breadcrumbMid = deal.brand && deal.brand !== "Unknown" ? deal.brand.toUpperCase() : null;

  const rating    = deal.rating > 0 ? deal.rating : 4.8;
  const reviews   = deal.reviewCount > 0 ? deal.reviewCount : 710000;

  // ── Product info panel ────────────────────────────────────────────────────
  const productInfo = (
    <div className="space-y-4">

      {/* Stars + review count */}
      <StarRating score={rating} reviewCount={reviews} size="md" showPlus />

      <h1 className="text-3xl font-extrabold text-navy leading-tight" style={{ fontFamily: "var(--font-lato)" }}>
        {deal.title}
      </h1>

      {/* Subtitle — real description if available, else brand · category */}
      <p className="text-sm text-body leading-relaxed -mt-1">
        {deal.description
          ? deal.description
          : deal.brand && deal.brand !== "Unknown"
            ? `${deal.brand} · ${deal.category}`
            : deal.category}
      </p>

      {/* CURRENT PRICE label */}
      <p className="text-[10px] font-bold uppercase tracking-widest text-body pt-1">
        Current Price
      </p>

      {/* Price row: price + strikethrough + badge on left, share on right */}
      <div className="flex items-center justify-between gap-3 -mt-2">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-4xl font-extrabold text-navy leading-none" style={{ fontFamily: "var(--font-lato)" }}>
            {formatUSD(deal.currentPrice)}
          </span>
          {deal.originalPrice > deal.currentPrice && (
            <span className="text-lg line-through text-body font-medium">
              {formatUSD(deal.originalPrice)}
            </span>
          )}
          {deal.discountPercent > 0 && (
            <span className="px-3 py-1 rounded-full text-xs font-bold" style={{ background: "#FFECEC", color: "#C82750" }}>
              {deal.discountPercent}% OFF
            </span>
          )}
        </div>
        <button type="button" aria-label="Share"
          className="shrink-0 w-8 h-8 rounded-full border border-[#E7E8E9] flex items-center justify-center text-body hover:text-navy hover:border-navy transition-colors">
          <Share2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Best price indicator */}
      {deal.discountPercent >= 20 && (
        <div className="flex items-center gap-1.5 -mt-1">
          <span className="text-sm">🔥</span>
          <p className="text-xs font-semibold text-[#22A45D]">Best price in last 60 days</p>
        </div>
      )}

      {/* DEALS END IN + AVAILABILITY — white card */}
      <div className="bg-white rounded-2xl border border-[#E7E8E9] p-4 space-y-4">
        {timer && (
          <div className="space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-widest text-body">Deals End In</p>
            <TimerBoxes timer={timer} />
          </div>
        )}

        <div className="space-y-1.5">
          {deal.totalCount > 0 ? (
            <>
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold uppercase tracking-widest text-body">Availability</p>
                <span className="text-xs font-bold text-badge-bg">{claimedPct}% claimed</span>
              </div>
              <div className="h-2 rounded-full bg-[#F0F1F3] overflow-hidden">
                <div className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${claimedPct}%`, background: "linear-gradient(to right, #FE9800, #E53935)" }} />
              </div>
              <p className="text-xs font-semibold text-[#FF5733]">
                ▲ Only {dealsLeft} deals left — selling fast
              </p>
            </>
          ) : (
            <p className="text-xs font-semibold text-[#FF5733]">⚡ Limited-time deal — while stocks last</p>
          )}
        </div>
      </div>

      {/* CTA: full-width button + heart watchlist */}
      <div className="flex items-center gap-2.5 pt-1">
        <a
          href={deal.affiliateUrl}
          target="_blank"
          rel="noopener noreferrer sponsored"
          className="flex-1 flex items-center justify-center gap-2 h-13 rounded-xl font-bold text-sm text-white bg-navy hover:opacity-90 transition-opacity"
          style={{ fontFamily: "var(--font-lato)" }}
        >
          View Deal on Amazon
          <ExternalLink className="w-4 h-4" />
        </a>
        <WatchlistButton dealId={deal.id} deal={deal} size="lg" />
      </div>
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
          {productInfo}

          {/* Tabs */}
          <div className="flex gap-2 overflow-x-auto scrollbar-none -mx-4 px-4">
            {["Description", "Reviews", "Price Intelligence"].map((tab, i) => (
              <button key={tab} type="button" onClick={() => setActiveTab(i)}
                className={cn(
                  "shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold border transition-all whitespace-nowrap",
                  activeTab === i
                    ? "bg-badge-bg text-white border-badge-bg"
                    : "bg-white text-body border-[#E7E8E9]"
                )}>
                {tab}
              </button>
            ))}
          </div>

          <div className="bg-white rounded-2xl border border-[#E7E8E9] p-5">
            {activeTab === 0 && (
              <p className="text-sm text-body leading-relaxed">
                {deal.brand && deal.brand !== "Unknown" ? `By ${deal.brand}. ` : ""}
                {deal.title}. Check the latest pricing and deals on Amazon.
              </p>
            )}
            {activeTab === 1 && <CustomerRatings deal={deal} />}
            {activeTab === 2 && <PriceIntelligence range={chartRange} onRangeChange={setChartRange} chartData={chartData} />}
          </div>

          {similarDeals.length > 0 && <SimilarDeals deals={similarDeals} />}
        </div>

        {/* Sticky CTA (mobile) */}
        <div className="fixed bottom-16 left-0 right-0 z-40 px-4 py-3 bg-white border-t border-[#E7E8E9]">
          <div className="flex items-center gap-2.5">
            <a
              href={deal.affiliateUrl}
              target="_blank"
              rel="noopener noreferrer sponsored"
              className="flex-1 flex items-center justify-center gap-2 h-12 rounded-xl font-bold text-sm text-white bg-navy hover:opacity-90 transition-opacity"
            >
              View Deal on Amazon <ExternalLink className="w-4 h-4" />
            </a>
            <WatchlistButton dealId={deal.id} deal={deal} size="lg" />
          </div>
        </div>
      </div>

      {/* ══════════════ DESKTOP (lg+) ══════════════════════════════════════ */}
      <div className="hidden lg:block max-w-350 mx-auto px-6 py-6 pb-16">

        {/* Breadcrumb: CATEGORY > BRAND > SHORT TITLE */}
        <nav className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-body mb-6">
          <Link href="/deals" className="hover:text-navy transition-colors">{deal.category}</Link>
          {breadcrumbMid && (
            <>
              <span className="text-[#C4C6CE]">›</span>
              <Link href={`/deals?q=${encodeURIComponent(deal.brand ?? "")}`} className="hover:text-navy transition-colors">
                {breadcrumbMid}
              </Link>
            </>
          )}
          <span className="text-[#C4C6CE]">›</span>
          <span className="text-navy">{shortTitle}</span>
        </nav>

        {/* Two-column layout — grid stretches both columns to equal height */}
        <div className="grid grid-cols-[420px_1fr] gap-10">

          {/* Left: image carousel — flex col so image fills remaining height after thumbnails */}
          <div className="flex flex-col h-full">
            <ImageCarousel
              images={images}
              activeImg={activeImg}
              onPrev={() => setActiveImg((p) => p - 1)}
              onNext={() => setActiveImg((p) => p + 1)}
              onDot={setActiveImg}
              stretch
            />
          </div>

          {/* Right: product info */}
          <div className="max-w-lg">
            {productInfo}
          </div>
        </div>

        {/* Customer Ratings */}
        <div className="mt-10">
          <CustomerRatings deal={deal} />
        </div>

        {/* Price Intelligence */}
        <div className="mt-8">
          <PriceIntelligence range={chartRange} onRangeChange={setChartRange} chartData={chartData} />
        </div>

        {/* Similar Deals */}
        {similarDeals.length > 0 && (
          <div className="mt-8">
            <SimilarDeals deals={similarDeals} />
          </div>
        )}
      </div>
    </>
  );
}
