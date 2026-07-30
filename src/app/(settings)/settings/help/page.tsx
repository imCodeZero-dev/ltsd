import type { Metadata } from "next";
import { Mail } from "lucide-react";

export const metadata: Metadata = { title: "Help & Support" };

const SUPPORT_EMAIL = "support@limitedtimesuperdeals.com";

const FAQS = [
  {
    q: "How do deal preferences work?",
    a: "Choose categories and deal types (Lightning Deals, Price Drops, Limited Time) in Deal Preferences. Your My Deals feed and alerts are filtered to match.",
  },
  {
    q: "How does the watchlist work?",
    a: "Add a product to your watchlist to track its price. You'll be notified when it drops. Watchlists are limited to 3 items on the free plan.",
  },
  {
    q: "Why didn't I get a notification for a deal?",
    a: "Check Notifications settings — alerts only fire for deals matching your minimum discount, categories, and quiet hours preferences.",
  },
  {
    q: "How do I change my email or password?",
    a: "Go to Settings → Profile to update your name, avatar, and password.",
  },
  {
    q: "How do I delete my account?",
    a: "Go to Settings → Profile and scroll to the Account section for the delete option. This permanently removes your data.",
  },
];

function Section({
  label,
  description,
  children,
}: {
  label: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col md:flex-row md:gap-10 py-5 md:py-6 border-b border-[#E7E8E9] last:border-b-0">
      <div className="md:w-44 md:shrink-0 mb-3 md:mb-0">
        <p className="text-sm font-semibold text-navy">{label}</p>
        <p className="text-xs text-body mt-0.5 md:mt-1 md:leading-relaxed">{description}</p>
      </div>
      <div className="flex-1 min-w-0 border border-[#E7E8E9] rounded-xl divide-y divide-[#E7E8E9] bg-white">
        {children}
      </div>
    </div>
  );
}

export default function HelpPage() {
  return (
    <div className="px-4 md:px-10 pt-4 md:pt-2 pb-10 bg-white min-h-full">
      <Section label="FAQs" description="Answers to common questions">
        {FAQS.map(({ q, a }) => (
          <div key={q} className="px-4 md:px-6 py-4 md:py-5">
            <p className="text-sm font-semibold text-navy">{q}</p>
            <p className="text-xs text-body mt-1 leading-relaxed">{a}</p>
          </div>
        ))}
      </Section>

      <Section label="Contact Support" description="Can't find what you're looking for?">
        <a
          href={`mailto:${SUPPORT_EMAIL}`}
          className="flex items-center gap-3 px-4 md:px-6 py-4 md:py-5 hover:bg-bg transition-colors"
        >
          <div className="w-9 h-9 rounded-lg bg-surface-hover flex items-center justify-center shrink-0">
            <Mail className="w-4 h-4 text-navy" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-navy">Email us</p>
            <p className="text-xs text-body mt-0.5">{SUPPORT_EMAIL}</p>
          </div>
        </a>
      </Section>
    </div>
  );
}
