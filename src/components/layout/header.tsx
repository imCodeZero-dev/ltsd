import Link from "next/link";
import { Bell, Menu, ShoppingBag, ChevronDown } from "lucide-react";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { AnnouncementBar } from "./announcement-bar";
import { SearchBar, MobileSearchBar } from "./search-bar";
import { AppSubNav } from "./app-sub-nav";

async function getUnreadCount(userId: string): Promise<number> {
  try {
    return await db.notification.count({ where: { userId, isRead: false } });
  } catch {
    return 0;
  }
}

export async function Header() {
  const session = await auth();
  const unreadCount = session?.user?.id
    ? await getUnreadCount(session.user.id)
    : 0;

  const initials = session?.user?.name
    ? session.user.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()
    : "U";

  return (
    <>
      {/* Announcement bar */}
      <AnnouncementBar />

      {/* Main header */}
      <header className="sticky top-0 z-40 w-full bg-white border-b border-[#E7E8E9]">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 h-14 flex items-center gap-4">

          {/* Mobile: hamburger */}
          <button
            className="md:hidden p-1.5 text-[#44474E] hover:text-[#000A1E]"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Logo */}
          <Link
            href="/dashboard"
            className="font-extrabold text-xl tracking-tight shrink-0"
            style={{ color: "#C82750" }}
          >
            LTSD
          </Link>

          {/* Desktop search */}
          <SearchBar />

          {/* Right actions */}
          <div className="ml-auto flex items-center gap-3">
            {/* Notification bell */}
            <Link
              href="/notifications"
              className="relative p-1.5 text-[#44474E] hover:text-[#000A1E] transition-colors"
              aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-1 rounded-full text-[9px] font-bold leading-4 text-center text-white tabular-nums"
                  style={{ background: "#C82750" }}>
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </Link>

            {/* Account */}
            <Link
              href="/settings/profile"
              className="hidden md:flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                style={{ background: "#000A1E" }}
              >
                {initials}
              </div>
              <span className="text-sm font-medium text-[#2D2D2D] hidden lg:block">
                Account
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-[#74777F] hidden lg:block" />
            </Link>

            {/* Mobile: bag icon */}
            <button className="md:hidden p-1.5 text-[#44474E]" aria-label="Cart">
              <ShoppingBag className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Mobile search bar */}
        <MobileSearchBar />

        {/* Desktop sub-nav */}
        <AppSubNav />
      </header>
    </>
  );
}
