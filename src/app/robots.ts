import type { MetadataRoute } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://ltsd.deals";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/admin/",
        "/settings/",
        "/onboarding/",
        "/api/",
        "/dashboard",
        "/watchlist",
        "/notifications",
      ],
    },
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
