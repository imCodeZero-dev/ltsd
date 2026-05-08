import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { mapDeal, type RawDeal } from "@/lib/deal-mapper";
import { DealInstallWall } from "@/components/deals/deal-install-wall";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  try {
    const deal = await db.deal.findUnique({ where: { slug }, select: { title: true } });
    if (deal) return { title: `Unlock: ${deal.title} — LTSD` };
  } catch { /* fallback */ }
  return { title: "Unlock Deal — LTSD" };
}

export default async function UnlockPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  // Already authenticated — send straight to the deal
  const session = await auth();
  if (session) redirect(`/deals/${slug}`);

  const row = await db.deal.findUnique({
    where: { slug },
    include: {
      categories: { include: { category: { select: { name: true } } } },
      priceHistory: { take: 0 }, // not needed here
    },
  });

  if (!row) notFound();

  const deal = mapDeal(row as RawDeal);

  return <DealInstallWall deal={deal} />;
}
