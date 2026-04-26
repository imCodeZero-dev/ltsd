"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

// Four Amazon CDN images used as slide backgrounds
const IMG_HEADPHONES = "https://m.media-amazon.com/images/I/61SUj2aKoEL._AC_SL1500_.jpg";
const IMG_LAPTOP     = "https://m.media-amazon.com/images/I/71f5Eu5lJSL._AC_SL1500_.jpg";
const IMG_SERUM      = "https://m.media-amazon.com/images/I/51aXvjzcukL._AC_SL1500_.jpg";

interface Slide {
  image: string;
  badge: string;
  cardBrand: string;
  cardTitle: string;
  rating: number;
  reviews: string;
  currentPrice: number;
  originalPrice: number;
  claimed: number;
}

const SLIDES: Slide[] = [
  {
    image: IMG_HEADPHONES,
    badge: "15%",
    cardBrand: "SONY",
    cardTitle: "Gaming Ultra Promax\nHeadphones",
    rating: 4.9,
    reviews: "2,104",
    currentPrice: 298,
    originalPrice: 399,
    claimed: 88,
  },
  {
    image: IMG_LAPTOP,
    badge: "18%",
    cardBrand: "DELL",
    cardTitle: "XPS 15 Ultra\nLaptop 2024",
    rating: 4.8,
    reviews: "1,421",
    currentPrice: 1299,
    originalPrice: 1599,
    claimed: 62,
  },
  {
    image: IMG_SERUM,
    badge: "25%",
    cardBrand: "NEUTROGENA",
    cardTitle: "Hydro Boost\nFace Serum",
    rating: 4.7,
    reviews: "3,824",
    currentPrice: 16,
    originalPrice: 22,
    claimed: 45,
  },
];

export function HeroCarousel() {
  const [active, setActive] = useState(0);
  const slide = SLIDES[active];

  return (
    <div className="relative">
      {/*
       * The section is overflow-hidden — everything inside is clipped here.
       * The image is a FLEX ITEM (not absolute) so it always shows on
       * all screen sizes and is properly bounded by the section.
       */}
      <section
        className="relative overflow-hidden rounded-2xl"
        style={{ background: "linear-gradient(135deg, #FFD580 0%, #FFA940 50%, #FF7A1A 100%)" }}
      >
        <div className="flex min-h-47.5 md:min-h-75">

          {/* ── Carousel dots — desktop, far left ── */}
          <div className="hidden md:flex flex-col items-center justify-center gap-2.5 pl-4 pr-2 shrink-0">
            {SLIDES.map((_, i) => (
              <button
                key={i}
                onClick={() => setActive(i)}
                aria-label={`Go to slide ${i + 1}`}
                className={`rounded-full transition-all duration-300 ${
                  i === active ? "w-2.5 h-2.5 bg-white" : "w-2 h-2 bg-white/40"
                }`}
              />
            ))}
          </div>

          {/* ── Text content ── */}
          <div className="flex flex-col justify-center gap-2 md:gap-4 py-6 px-5 md:py-10 md:pl-4 md:pr-10 flex-1 md:flex-none md:w-96 shrink-0">
            <h1
              className="text-xl md:text-[40px] font-extrabold leading-tight md:leading-[1.1] text-white"
              style={{ letterSpacing: "-0.02em", fontFamily: "var(--font-dm-sans)" }}
            >
              Top Deals<br />for you today
            </h1>
            <p className="text-xs md:text-sm text-white/90 leading-relaxed">
              Handpicked deals based on your<br className="hidden md:block" />
              interests and recent activity.
            </p>
            <div>
              <Link
                href="/deals"
                className="inline-flex items-center justify-center px-4 py-1.5 md:px-6 md:py-2.5 rounded-lg text-xs md:text-sm font-semibold bg-navy text-white hover:bg-navy/90 transition-colors"
              >
                View Deals
              </Link>
            </div>
          </div>

          {/*
           * ── Product image ──
           * This is a FLEX ITEM with position:relative + overflow:hidden.
           * Image fill anchors to this div, clipped by overflow-hidden.
           * Visible on ALL screen sizes (no hidden class).
           */}
          <div className="relative flex-1 overflow-hidden min-w-24">
            <Image
              src={slide.image}
              alt="Featured product"
              fill
              sizes="(min-width: 768px) 55vw, 45vw"
              className="object-contain object-right md:object-center"
              priority
            />
          </div>
        </div>

        {/* ── Discount badge — top-right, always visible ── */}
        <div
          className="absolute top-3 right-4 md:top-5 md:right-10 z-10 w-9 h-9 md:w-12 md:h-12 rounded-full flex items-center justify-center text-white text-[10px] md:text-xs font-bold shadow"
          style={{ background: "rgba(0,0,0,0.25)" }}
        >
          {slide.badge}
        </div>

        {/* ── Floating deal card — desktop only ── */}
        <div
          className="hidden md:block absolute bottom-5 z-10 bg-white rounded-xl shadow-lg p-3 w-44"
          style={{ left: "42%" }}
        >
          <p className="text-[9px] font-semibold uppercase tracking-wide text-body mb-0.5">
            {slide.cardBrand}
          </p>
          <p className="text-[10px] font-bold text-navy uppercase leading-snug mb-1.5 whitespace-pre-line">
            {slide.cardTitle}
          </p>

          {/* Stars + rating */}
          <div className="flex items-center gap-0.5 mb-1.5">
            {[1, 2, 3, 4, 5].map((s) => (
              <svg key={s} viewBox="0 0 24 24" className="w-2.5 h-2.5 fill-badge-bg">
                <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
              </svg>
            ))}
            <span className="text-[8px] font-semibold text-navy ml-0.5">{slide.rating}</span>
            <span className="text-[8px] text-body ml-0.5">({slide.reviews} reviews)</span>
          </div>

          {/* Price */}
          <div className="flex items-baseline gap-1.5 mb-1.5">
            <span className="text-sm font-extrabold text-navy">${slide.currentPrice}</span>
            <span className="text-[10px] line-through text-body">${slide.originalPrice}</span>
          </div>

          {/* Claim progress */}
          <div className="h-1.5 rounded-full bg-[#E7E8E9] mb-0.5">
            <div
              className="h-full rounded-full"
              style={{
                width: `${slide.claimed}%`,
                background: "linear-gradient(to right, #FE9800, #EF4444)",
              }}
            />
          </div>
          <p className="text-[9px] text-right font-medium text-error">
            {slide.claimed}% claimed
          </p>
        </div>
      </section>

      {/* ── Next slide arrow — outside card, desktop only ── */}
      <button
        onClick={() => setActive((p) => (p + 1) % SLIDES.length)}
        className="absolute -right-5 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white border border-[#E7E8E9] shadow-md hidden md:flex items-center justify-center hover:shadow-lg transition-shadow z-10"
        aria-label="Next slide"
      >
        <ChevronRight className="w-4 h-4 text-navy" />
      </button>

      {/* ── Mobile pagination dots — below the card ── */}
      <div className="md:hidden flex justify-center gap-2 pt-3">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            onClick={() => setActive(i)}
            aria-label={`Go to slide ${i + 1}`}
            className={`rounded-full transition-all duration-300 ${
              i === active ? "w-4 h-2 bg-badge-bg" : "w-2 h-2 bg-border-mid"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
