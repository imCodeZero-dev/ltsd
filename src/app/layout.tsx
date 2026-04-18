import type { Metadata, Viewport } from "next";
import { Inter, Geist } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    template: "%s | LTSD — Limited Time Super Deals",
    default: "LTSD — Limited Time Super Deals",
  },
  description:
    "Discover personalized Amazon deals before they expire. Lightning deals, limited-time offers, and Prime exclusives — tailored to your interests.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "LTSD",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#C82750",
  viewportFit: "cover", // handles iPhone notch / Dynamic Island
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn("h-full", inter.variable, "font-sans", geist.variable)}>
      <body className="min-h-full antialiased">{children}</body>
    </html>
  );
}
