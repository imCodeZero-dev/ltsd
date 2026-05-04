import Link from "next/link";
import { ChevronDown } from "lucide-react";

export function AnnouncementBar() {
  return (
    // hidden on mobile — matches Figma (no bar on small screens)
    // overflow-hidden ensures text can never push past the bar width
    <div
      className="hidden md:flex w-full h-9 px-6 items-center overflow-hidden"
      style={{ background: "#000A1E" }}
    >
      {/* Left spacer — mirrors right side so text stays centered */}
      <div className="flex-1 min-w-0" />

      {/* Centered announcement — truncate prevents any overflow */}
      <p className="text-xs font-medium text-white shrink-0 truncate text-center px-4">
        Summer Sale For All Swim Suits And Free Express Delivery — OFF 50%!{" "}
        <Link
          href="/deals"
          className="font-bold underline underline-offset-2 hover:no-underline whitespace-nowrap"
        >
          Shop Now
        </Link>
      </p>

      {/* Right: language selector */}
      <div className="flex-1 min-w-0 flex justify-end">
        <button
          type="button"
          className="flex items-center gap-1 text-xs font-medium text-white/80 hover:text-white transition-colors shrink-0"
          aria-label="Select language"
        >
          English
          <ChevronDown className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}
