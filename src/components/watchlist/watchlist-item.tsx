import Image from "next/image";
import Link from "next/link";
import { TrendingDown, TrendingUp, Minus } from "lucide-react";
import type { WatchlistItem as WatchlistItemType } from "@/types/watchlist";
import { PriceDisplay } from "@/components/common/price-display";
import { WatchlistButton } from "@/components/deals/watchlist-button";
import { cn } from "@/lib/utils";

interface WatchlistItemProps {
  item: WatchlistItemType;
}

export function WatchlistItem({ item }: WatchlistItemProps) {
  const { deal } = item;
  const targetHit =
    item.targetPrice !== null && deal.currentPrice <= item.targetPrice;

  return (
    <article className="flex gap-3 bg-surface rounded-xl border border-border p-3">
      {/* Image */}
      <Link href={`/deals/${deal.slug ?? deal.id}`} className="relative w-20 h-20 shrink-0 rounded-lg overflow-hidden bg-bg" tabIndex={-1}>
        <Image
          src={deal.imageUrl}
          alt={deal.title}
          fill
          sizes="80px"
          className="object-contain p-1"
        />
      </Link>

      {/* Info */}
      <div className="flex-1 min-w-0 space-y-1.5">
        <Link href={`/deals/${deal.slug ?? deal.id}`}>
          <h3 className="text-sm font-medium text-carbon line-clamp-2 leading-snug hover:text-crimson transition-colors">
            {deal.title}
          </h3>
        </Link>

        <PriceDisplay current={deal.currentPrice} original={deal.originalPrice} size="sm" />

        {item.targetPrice !== null && (
          <div className={cn(
            "inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full",
            targetHit
              ? "bg-success-bg text-success"
              : "bg-bg text-muted-foreground"
          )}>
            {targetHit ? (
              <TrendingDown className="w-3 h-3" aria-hidden />
            ) : deal.currentPrice < deal.originalPrice ? (
              <TrendingDown className="w-3 h-3" aria-hidden />
            ) : (
              <Minus className="w-3 h-3" aria-hidden />
            )}
            Target: ${(item.targetPrice / 100).toFixed(0)}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="shrink-0 flex flex-col items-end justify-between">
        <WatchlistButton dealId={deal.id} watchlistItemId={item.id} />
        <a
          href={deal.affiliateUrl}
          target="_blank"
          rel="noopener noreferrer sponsored"
          className="text-xs font-semibold text-crimson hover:text-orange transition-colors"
        >
          View
        </a>
      </div>
    </article>
  );
}
