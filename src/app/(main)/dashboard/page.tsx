import type { Metadata } from "next";
import { Suspense } from "react";
import { SectionHeading } from "@/components/common/section-heading";
import { DealGrid } from "@/components/deals/deal-grid";
import { DealGridSkeleton } from "@/components/deals/deal-card-skeleton";
import { DealOfDayBanner } from "@/components/deals/deal-of-day-banner";
import { QuickCategoryBar } from "@/components/deals/quick-category-bar";

export const metadata: Metadata = { title: "Dashboard" };

// Placeholder RSC data fetchers — replaced when Prisma + deal API are wired
async function getPersonalizedDeals() {
  return [];
}
async function getDealOfDay() {
  return null;
}

export default async function DashboardPage() {
  const [dealOfDay, personalizedDeals] = await Promise.all([
    getDealOfDay(),
    getPersonalizedDeals(),
  ]);

  return (
    <div className="px-4 py-4 space-y-6 max-w-7xl mx-auto">
      {/* Deal of the Day */}
      <Suspense fallback={<div className="h-36 rounded-2xl bg-muted animate-pulse" />}>
        <DealOfDayBanner deal={dealOfDay} />
      </Suspense>

      {/* Quick category scroll */}
      <QuickCategoryBar />

      {/* Personalised deals */}
      <section>
        <SectionHeading title="Deals for you" viewAllHref="/deals" />
        <Suspense fallback={<DealGridSkeleton count={6} />}>
          <DealGrid deals={personalizedDeals} />
        </Suspense>
      </section>

      {/* Lightning deals section */}
      <section>
        <SectionHeading title="Lightning deals" viewAllHref="/deals?type=LIGHTNING_DEAL" />
        <Suspense fallback={<DealGridSkeleton count={4} />}>
          <DealGrid deals={[]} />
        </Suspense>
      </section>
    </div>
  );
}
