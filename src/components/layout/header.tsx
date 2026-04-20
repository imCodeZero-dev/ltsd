import Link from "next/link";
import { Search, Bell } from "lucide-react";
import { mainNav } from "@/config/nav";

export function Header() {
  return (
    <header className="hidden lg:flex sticky top-0 z-40 w-full bg-surface border-b border-border h-16 items-center px-6 gap-6">
      {/* Logo */}
      <Link href="/dashboard" className="flex items-center gap-2 shrink-0">
        <span className="text-crimson font-bold text-xl tracking-tight">LTSD</span>
      </Link>

      {/* Desktop nav */}
      <nav className="flex items-center gap-1 ml-4">
        {mainNav.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="px-3 py-2 rounded-md text-sm font-medium text-body hover:text-crimson hover:bg-bg transition-colors"
          >
            {item.label}
          </Link>
        ))}
      </nav>

      {/* Right actions */}
      <div className="ml-auto flex items-center gap-2">
        <button
          aria-label="Search"
          className="p-2 rounded-md text-body hover:text-crimson hover:bg-bg transition-colors"
        >
          <Search className="w-5 h-5" />
        </button>
        <Link
          href="/notifications"
          aria-label="Notifications"
          className="relative p-2 rounded-md text-body hover:text-crimson hover:bg-bg transition-colors"
        >
          <Bell className="w-5 h-5" />
        </Link>
        <Link
          href="/settings/profile"
          className="w-8 h-8 rounded-full bg-crimson text-white flex items-center justify-center text-sm font-semibold"
        >
          U
        </Link>
      </div>
    </header>
  );
}
