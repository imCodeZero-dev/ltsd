import type { Metadata, Viewport } from "next";
import { Inter, Lato, DM_Sans } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const lato = Lato({
  variable: "--font-lato",
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
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
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${lato.variable} ${dmSans.variable} h-full`}>
      <body className="min-h-full antialiased overflow-x-hidden">
        {/* Skip-to-content link — visible only on keyboard focus */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-9999 focus:px-4 focus:py-2 focus:rounded-lg focus:bg-navy focus:text-surface focus:text-sm focus:font-bold focus:outline-none"
        >
          Skip to main content
        </a>
        {children}
        <Toaster position="top-center" richColors closeButton />
        {/* Register service worker for PWA + push notifications */}
        <script
          dangerouslySetInnerHTML={{
            __html: `if("serviceWorker"in navigator){window.addEventListener("load",function(){navigator.serviceWorker.register("/sw.js")})}`,
          }}
        />
      </body>
    </html>
  );
}
