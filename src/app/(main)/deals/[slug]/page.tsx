import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import Image from "next/image";
import { ArrowLeft, ExternalLink } from "lucide-react";
import Link from "next/link";
import { DealTypeBadge } from "@/components/deals/deal-type-badge";
import { DiscountBadge } from "@/components/deals/discount-badge";
import { ClaimProgress } from "@/components/deals/claim-progress";
import { CountdownTimer } from "@/components/deals/countdown-timer";
import { PriceDisplay } from "@/components/common/price-display";
import { StarRating } from "@/components/common/star-rating";
import { DealGrid } from "@/components/deals/deal-grid";
import { DealGridSkeleton } from "@/components/deals/deal-card-skeleton";
import { WatchlistButton } from "@/components/deals/watchlist-button";
import type { DealItem } from "@/lib/deal-api/types";

export const revalidate = 600;

interface DealDetailPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: DealDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  // TODO: fetch deal title for metadata
  return { title: `Deal ${slug}` };
}

async function getDeal(_slug: string): Promise<DealItem | null> {
  // TODO: fetch via getDealApi()
  return null;
}

async function getSimilarDeals(_dealId: string): Promise<DealItem[]> {
  return [];
}

export default async function DealDetailPage({ params }: DealDetailPageProps) {
  const { slug } = await params;
  const deal = await getDeal(slug);

  if (!deal) {
    // Render a placeholder until real data is wired
    return (
      <div className="px-4 py-4 max-w-2xl mx-auto">
        <Link
          href="/deals"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-crimson transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Deals
        </Link>
        <div className="text-center py-16 text-muted-foreground text-sm">
          Deal not available — data layer not yet connected.
        </div>
      </div>
    );
  }

  const similarDeals = await getSimilarDeals(deal.id);

  return (
    <div className="max-w-2xl mx-auto pb-8">
      {/* Back link */}
      <div className="px-4 pt-4">
        <Link
          href="/deals"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-crimson transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Deals
        </Link>
      </div>

      {/* Hero image */}
      <div className="relative aspect-square bg-bg mx-4 mt-3 rounded-2xl overflow-hidden">
        <Image
          src={deal.imageUrl}
          alt={deal.title}
          fill
          sizes="(max-width: 672px) 100vw, 672px"
          className="object-contain p-6"
          priority
        />
        {/* Top badges */}
        <div className="absolute top-3 left-3 flex items-center gap-2">
          <DealTypeBadge type={deal.dealType} />
          <DiscountBadge percent={deal.discountPercent} />
        </div>
        {/* Countdown */}
        {deal.expiresAt && (
          <div className="absolute bottom-3 left-3">
            <CountdownTimer
              expiresAt={new Date(deal.expiresAt)}
              className="bg-surface/90 backdrop-blur-sm px-2 py-1 rounded-lg"
            />
          </div>
        )}
      </div>

      {/* Info card */}
      <div className="mx-4 mt-4 bg-surface rounded-2xl border border-border p-4 space-y-4">
        {/* Brand */}
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          {deal.brand}
        </p>

        {/* Title */}
        <h1 className="text-base font-bold text-navy leading-snug">{deal.title}</h1>

        {/* Rating */}
        {deal.rating > 0 && (
          <StarRating score={deal.rating} reviewCount={deal.reviewCount} size="md" />
        )}

        {/* Price row */}
        <div className="flex items-center justify-between">
          <PriceDisplay current={deal.currentPrice} original={deal.originalPrice} size="lg" />
          <WatchlistButton dealId={deal.id} />
        </div>

        {/* Claim progress */}
        {deal.totalCount > 0 && (
          <ClaimProgress claimed={deal.claimedCount} total={deal.totalCount} />
        )}

        {/* CTA */}
        <a
          href={deal.affiliateUrl}
          target="_blank"
          rel="noopener noreferrer sponsored"
          className="flex items-center justify-center gap-2 w-full h-12 rounded-xl bg-crimson text-white font-semibold text-sm hover:bg-orange transition-colors"
        >
          View Deal on Amazon
          <ExternalLink className="w-4 h-4" aria-hidden />
        </a>
      </div>

      {/* Price history chart — dynamic import, no SSR */}
      <div className="mx-4 mt-4 bg-surface rounded-2xl border border-border p-4">
        <h2 className="text-sm font-semibold text-navy mb-3">Price History</h2>
        <div className="h-32 flex items-center justify-center text-xs text-muted-foreground bg-bg rounded-xl">
          Chart loads once deal API is connected
        </div>
      </div>

      {/* Similar deals */}
      {similarDeals.length > 0 && (
        <div className="mx-4 mt-6 space-y-3">
          <h2 className="text-sm font-semibold text-navy">Similar Deals</h2>
          <Suspense fallback={<DealGridSkeleton count={4} />}>
            <DealGrid deals={similarDeals} />
          </Suspense>
        </div>
      )}
    </div>
  );
}
