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
        {children}
        <Toaster position="top-center" richColors closeButton />
      </body>
    </html>
  );
}
