import Image from "next/image";
import Link from "next/link";
import { Trophy } from "lucide-react";
import type { DealItem } from "@/lib/deal-api/types";
import { PriceDisplay } from "@/components/common/price-display";
import { DiscountBadge } from "./discount-badge";
import { CountdownTimer } from "./countdown-timer";

interface DealOfDayBannerProps {
  deal: DealItem | null;
}

export function DealOfDayBanner({ deal }: DealOfDayBannerProps) {
  if (!deal) {
    return (
      <div className="rounded-2xl bg-gradient-to-r from-navy to-navy-btn p-5 flex items-center gap-4 min-h-[140px]">
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-yellow" />
            <span className="text-xs font-semibold text-yellow uppercase tracking-wide">
              Deal of the Day
            </span>
          </div>
          <p className="text-white/60 text-sm">No featured deal today — check back soon.</p>
        </div>
      </div>
    );
  }

  return (
    <Link
      href={`/deals/${deal.slug ?? deal.id}`}
      className="rounded-2xl bg-gradient-to-r from-navy to-navy-btn p-5 flex items-center gap-4 hover:opacity-95 transition-opacity"
    >
      {/* Product image */}
      <div className="relative w-24 h-24 shrink-0 rounded-xl overflow-hidden bg-white/10">
        <Image
          src={deal.imageUrl}
          alt={deal.title}
          fill
          sizes="96px"
          className="object-contain p-1"
        />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0 space-y-2">
        <div className="flex items-center gap-2">
          <Trophy className="w-4 h-4 text-yellow shrink-0" />
          <span className="text-xs font-semibold text-yellow uppercase tracking-wide">
            Deal of the Day
          </span>
          <DiscountBadge percent={deal.discountPercent} />
        </div>

        <h2 className="text-white text-sm font-semibold line-clamp-2 leading-snug">
          {deal.title}
        </h2>

        <div className="flex items-center gap-3">
          <PriceDisplay
            current={deal.currentPrice}
            original={deal.originalPrice}
            size="sm"
          />
          {deal.expiresAt && (
            <CountdownTimer
              expiresAt={new Date(deal.expiresAt)}
              className="text-white/80"
            />
          )}
        </div>
      </div>
    </Link>
  );
}
