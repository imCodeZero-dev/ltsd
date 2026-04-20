import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import type { DealItem } from "@/lib/deal-api/types";
import { DiscountBadge } from "./discount-badge";
import { DealTypeBadge } from "./deal-type-badge";
import { ClaimProgress } from "./claim-progress";
import { CountdownTimer } from "./countdown-timer";
import { PriceDisplay } from "@/components/common/price-display";
import { StarRating } from "@/components/common/star-rating";
import { WatchlistButton } from "./watchlist-button";

interface DealCardProps {
  deal: DealItem;
  showProgress?: boolean;
  watchlistItemId?: string;
  className?: string;
}

export function DealCard({
  deal,
  showProgress = true,
  watchlistItemId,
  className,
}: DealCardProps) {
  return (
    <article
      className={cn(
        "relative bg-surface rounded-xl border border-border overflow-hidden",
        "shadow-card hover:shadow-modal transition-shadow",
        className
      )}
    >
      {/* Image */}
      <Link
        href={`/deals/${deal.id}`}
        className="block relative aspect-square bg-bg"
        tabIndex={-1}
        aria-hidden
      >
        <Image
          src={deal.imageUrl}
          alt={deal.title}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className="object-contain p-2"
          loading="lazy"
        />

        {/* Top-left: deal type badge */}
        <div className="absolute top-2 left-2">
          <DealTypeBadge type={deal.dealType} />
        </div>

        {/* Top-right: discount badge */}
        {deal.discountPercent > 0 && (
          <div className="absolute top-2 right-2">
            <DiscountBadge percent={deal.discountPercent} />
          </div>
        )}

        {/* Bottom-left: countdown */}
        {deal.expiresAt && (
          <div className="absolute bottom-2 left-2">
            <CountdownTimer
              expiresAt={new Date(deal.expiresAt)}
              className="bg-surface/90 backdrop-blur-sm px-1.5 py-0.5 rounded"
            />
          </div>
        )}
      </Link>

      {/* Body */}
      <div className="p-3 space-y-2">
        {/* Brand */}
        <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide truncate">
          {deal.brand}
        </p>

        {/* Title */}
        <Link href={`/deals/${deal.id}`}>
          <h3 className="text-sm font-medium text-carbon line-clamp-2 leading-snug hover:text-crimson transition-colors">
            {deal.title}
          </h3>
        </Link>

        {/* Star rating */}
        {deal.rating > 0 && (
          <StarRating score={deal.rating} reviewCount={deal.reviewCount} />
        )}

        {/* Claim progress */}
        {showProgress && deal.totalCount > 0 && (
          <ClaimProgress claimed={deal.claimedCount} total={deal.totalCount} />
        )}

        {/* Price row */}
        <div className="flex items-center justify-between gap-2 pt-1">
          <PriceDisplay
            current={deal.currentPrice}
            original={deal.originalPrice}
            size="md"
          />
          <div className="flex items-center gap-1.5 shrink-0">
            <WatchlistButton
              dealId={deal.id}
              watchlistItemId={watchlistItemId}
            />
            <a
              href={deal.affiliateUrl}
              target="_blank"
              rel="noopener noreferrer sponsored"
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-semibold",
                "bg-crimson text-white",
                "hover:bg-orange transition-colors",
                "whitespace-nowrap"
              )}
            >
              View Deal
            </a>
          </div>
        </div>
      </div>
    </article>
  );
}
