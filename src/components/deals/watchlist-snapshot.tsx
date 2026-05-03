import Image from "next/image";
import Link from "next/link";
import { SectionHeading } from "@/components/common/section-heading";
import { PriceDisplay } from "@/components/common/price-display";

export interface WatchlistSnapshotItem {
  id: string;
  dealId: string;
  deal: {
    id: string;
    slug: string | null;
    title: string;
    imageUrl: string | null;
    currentPrice: number;   // dollars
    originalPrice: number | null;
    affiliateUrl: string;
  };
}

interface WatchlistSnapshotProps {
  items: WatchlistSnapshotItem[];
}

export function WatchlistSnapshot({ items }: WatchlistSnapshotProps) {
  if (items.length === 0) return null;

  return (
    <section>
      <SectionHeading title="Your watchlist" viewAllHref="/watchlist" />
      <div className="space-y-2.5">
        {items.map((item) => (
          <article
            key={item.id}
            className="flex items-center gap-3 bg-surface rounded-xl border border-border p-3"
          >
            <Link
              href={`/deals/${item.deal.slug ?? item.deal.id}`}
              className="relative w-14 h-14 shrink-0 rounded-lg overflow-hidden bg-bg"
              tabIndex={-1}
            >
              <Image
                src={item.deal.imageUrl ?? "/placeholder-product.png"}
                alt={item.deal.title}
                fill
                sizes="56px"
                className="object-contain p-1"
              />
            </Link>

            <div className="flex-1 min-w-0">
              <Link href={`/deals/${item.deal.slug ?? item.deal.id}`}>
                <p className="text-sm font-medium text-carbon line-clamp-1 hover:text-crimson transition-colors">
                  {item.deal.title}
                </p>
              </Link>
              <PriceDisplay
                current={Math.round(item.deal.currentPrice * 100)}
                original={Math.round((item.deal.originalPrice ?? item.deal.currentPrice) * 100)}
                size="sm"
              />
            </div>

            <a
              href={item.deal.affiliateUrl}
              target="_blank"
              rel="noopener noreferrer sponsored"
              className="shrink-0 text-xs font-semibold text-crimson hover:text-orange transition-colors"
            >
              View
            </a>
          </article>
        ))}
      </div>
    </section>
  );
}
