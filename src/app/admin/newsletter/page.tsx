import { db } from "@/lib/db";
import { NewsletterClient } from "@/components/admin/newsletter-client";

const PAGE_SIZE = 20;

export default async function AdminNewsletterPage() {
  const [subscribers, total, totalCount] = await Promise.all([
    db.newsletterSubscriber.findMany({
      orderBy: { createdAt: "desc" },
      take:    PAGE_SIZE,
    }),
    db.newsletterSubscriber.count(),
    db.newsletterSubscriber.count(),
  ]);

  return (
    <div className="px-3 sm:px-6 py-5 sm:py-8 space-y-5 sm:space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-navy">Newsletter Subscribers</h1>
        <p className="text-sm text-body mt-1">Manage people who opted in from the landing page</p>
      </div>

      <NewsletterClient
        initialSubscribers={subscribers.map(s => ({
          id:        s.id,
          email:     s.email,
          createdAt: s.createdAt.toISOString(),
        }))}
        initialMeta={{
          page:       1,
          pageSize:   PAGE_SIZE,
          total,
          totalPages: Math.ceil(total / PAGE_SIZE),
          stats:      { total: totalCount },
        }}
      />
    </div>
  );
}
