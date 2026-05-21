import type { MetadataRoute } from "next";
import { db } from "@/lib/db";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://ltsd.deals";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: new Date(), changeFrequency: "daily", priority: 1.0 },
    { url: `${BASE_URL}/deals`, lastModified: new Date(), changeFrequency: "daily", priority: 0.8 },
    { url: `${BASE_URL}/login`, changeFrequency: "monthly", priority: 0.3 },
    { url: `${BASE_URL}/signup`, changeFrequency: "monthly", priority: 0.4 },
  ];

  try {
    const deals = await db.deal.findMany({
      where:  { isActive: true },
      select: { slug: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
      take: 5000,
    });

    const dealPages: MetadataRoute.Sitemap = deals.map((d) => ({
      url: `${BASE_URL}/deals/${d.slug}`,
      lastModified: d.updatedAt,
      changeFrequency: "daily" as const,
      priority: 0.6,
    }));

    return [...staticPages, ...dealPages];
  } catch {
    return staticPages;
  }
}
