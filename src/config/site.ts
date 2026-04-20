export const siteConfig = {
  name: "LTSD",
  fullName: "Limited Time Super Deals",
  description:
    "Discover personalized Amazon deals before they expire. Lightning deals, limited-time offers, and Prime exclusives.",
  url: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  themeColor: "#C82750",
  ogImage: "/og.png",
} as const;
