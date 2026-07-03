import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AppFooter } from "@/components/layout/app-footer";

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-surface">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-surface border-b border-border">
        <div className="max-w-350 mx-auto px-4 sm:px-6 h-14 flex items-center gap-4">
          <Link href="/" className="shrink-0 flex items-center gap-2">
            <Image
              src="/images/ltsd-logo.webp"
              alt="LTSD"
              width={36}
              height={36}
              className="rounded-full"
            />
            <span className="text-lg font-extrabold text-navy font-lato">LTSD</span>
          </Link>
          <Link
            href="/"
            className="ml-auto inline-flex items-center gap-1.5 text-sm font-semibold text-body hover:text-navy transition-colors font-lato"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to home
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1">
        <div className="max-w-3xl mx-auto px-5 sm:px-6 py-10 sm:py-14">{children}</div>
      </main>

      <AppFooter />
    </div>
  );
}
