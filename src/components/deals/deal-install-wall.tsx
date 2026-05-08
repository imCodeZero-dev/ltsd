import Image from "next/image";
import Link from "next/link";
import type { DealItem } from "@/lib/deal-api/types";
import { StarRating } from "@/components/common/star-rating";

interface DealInstallWallProps {
  deal: Pick<DealItem, "id" | "slug" | "title" | "brand" | "imageUrl" | "discountPercent" | "rating" | "reviewCount">;
}

export function DealInstallWall({ deal }: DealInstallWallProps) {
  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center bg-bg overflow-hidden px-4 py-12">
      {/* Blurred orange gradient blob — matches auth layout */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-268.5 left-27.75 w-304.25 h-304.25 rounded-full opacity-[0.08]"
        style={{
          background: "linear-gradient(180deg, rgba(152,91,0,0) 0%, rgba(254,152,0,1) 100%)",
          filter: "blur(80px)",
        }}
      />

      <div className="relative z-10 w-full max-w-[440px] flex flex-col items-center gap-5">

        {/* LTSD Logo */}
        <Image
          src="/images/ltsd-logo.png"
          alt="LTSD Super Deals"
          width={72}
          height={72}
          priority
          style={{ width: 72, height: 72 }}
        />

        {/* Card */}
        <div className="w-full bg-surface rounded-2xl shadow-lg border border-border overflow-hidden">

          {/* ── Deal preview ── */}
          <div className="px-5 pt-5 pb-4">
            <div className="flex items-start gap-3">
              {/* Product image */}
              <div className="relative w-[72px] h-[72px] rounded-xl bg-bg border border-border overflow-hidden shrink-0">
                <Image
                  src={deal.imageUrl}
                  alt={deal.title}
                  fill
                  sizes="72px"
                  className="object-contain p-1.5"
                />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                {/* Badge + rating row */}
                <div className="flex items-center justify-between gap-2 mb-1">
                  {deal.discountPercent > 0 && (
                    <span className="text-[11px] font-bold font-inter px-1.5 py-0.5 rounded leading-none text-surface bg-badge-bg shrink-0">
                      {deal.discountPercent}% OFF
                    </span>
                  )}
                  {deal.rating > 0 && (
                    <div className="ml-auto shrink-0">
                      <StarRating score={deal.rating} hideScore />
                    </div>
                  )}
                </div>

                {/* Title */}
                <p className="text-sm font-semibold font-lato text-navy leading-snug line-clamp-2">
                  {deal.title}
                </p>
              </div>
            </div>

            {/* Locked price row */}
            <div className="mt-3 flex items-center gap-2">
              {/* Blurred price placeholder bars */}
              <div className="flex items-center gap-1.5">
                <div className="h-5 w-14 rounded bg-border blur-[3px]" />
                <div className="h-3.5 w-10 rounded bg-border/60 blur-[3px]" />
              </div>
              {/* Lock badge */}
              <span className="ml-auto flex items-center gap-1 text-[11px] font-semibold text-subtle font-inter">
                <svg viewBox="0 0 24 24" className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2.5}>
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
                LOCKED
              </span>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-border mx-5" />

          {/* ── Unlock section ── */}
          <div className="px-5 pt-5 pb-5 flex flex-col items-center text-center gap-4">
            <div>
              <h1 className="text-[22px] font-extrabold font-lato text-navy leading-tight">
                Unlock this deal 🔓
              </h1>
              <p className="mt-1.5 text-sm text-subtle font-inter leading-relaxed">
                Sign up to view the final price and secure this limited-time offer.
              </p>
            </div>

            {/* CTAs */}
            <div className="w-full flex flex-col gap-2.5">
              <Link
                href={`/signup?next=/deals/${deal.slug ?? deal.id}`}
                className="w-full h-12 rounded-xl bg-navy text-surface text-sm font-semibold font-lato flex items-center justify-center gap-2 hover:bg-navy/90 transition-colors"
              >
                Sign up free to view deal
                <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5}>
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </Link>

              <Link
                href={`/login?next=/deals/${deal.slug ?? deal.id}`}
                className="w-full h-12 rounded-xl border border-border bg-surface text-carbon text-sm font-medium flex items-center justify-center gap-2.5 hover:bg-bg transition-colors"
              >
                {/* Google icon */}
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                  <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
                  <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
                  <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
                  <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
                </svg>
                Continue with Google
              </Link>
            </div>

            {/* Trust row */}
            <div className="flex flex-col items-center gap-2 pt-1">
              {/* Avatar cluster */}
              <div className="flex -space-x-2">
                {["#FF9500", "#7C3AED", "#EC4899"].map((color, i) => (
                  <div
                    key={i}
                    className="w-7 h-7 rounded-full border-2 border-surface flex items-center justify-center text-[10px] font-bold text-surface"
                    style={{ background: color }}
                  >
                    {["A", "B", "C"][i]}
                  </div>
                ))}
              </div>
              <p className="text-xs text-subtle font-inter">
                Trusted by <span className="font-semibold text-navy">50,000+</span> deal hunters
              </p>
            </div>
          </div>
        </div>

        {/* Login link */}
        <p className="text-sm text-subtle font-inter">
          Already have an account?{" "}
          <Link
            href={`/login?next=/deals/${deal.slug ?? deal.id}`}
            className="text-navy font-semibold hover:underline"
          >
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
