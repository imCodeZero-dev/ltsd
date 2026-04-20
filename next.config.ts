import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Amazon product images (CDN)
      {
        protocol: "https",
        hostname: "images-na.ssl-images-amazon.com",
      },
      {
        protocol: "https",
        hostname: "m.media-amazon.com",
      },
      {
        protocol: "https",
        hostname: "images-eu.ssl-images-amazon.com",
      },
      // Keepa image proxy (if Keepa is chosen as provider)
      {
        protocol: "https",
        hostname: "*.keepa.com",
      },
    ],
  },

  reactStrictMode: true,
};

export default nextConfig;
