import { SectionHeading } from "@/components/common/section-heading";
import { WeeklyDealsSlider } from "@/components/dashboard/weekly-deals-slider";
import type { DealItem } from "@/lib/deal-api/types";

interface Props {
  deals:        DealItem[];
  watchlistMap?: Map<string, string>;
}

export function DealOfWeekSection({ deals, watchlistMap }: Props) {
  if (!deals.length) return null;

  return (
    <section className="rounded-2xl animate-deals-glow pt-5 pb-5 px-6 md:pt-6 md:pb-6 md:px-8">
      <SectionHeading
        title="Deals of the Week"
        subtitle="Handpicked by our team — updated every Monday"
        viewAllHref="/deals"
      />
      <WeeklyDealsSlider deals={deals} watchlistMap={watchlistMap} />
    </section>
  );
}
