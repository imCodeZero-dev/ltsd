import Link from "next/link";
import { Search, Bell } from "lucide-react";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { mainNav } from "@/config/nav";

async function getUnreadCount(userId: string): Promise<number> {
  try {
    return await db.notification.count({
      where: { userId, isRead: false },
    });
  } catch {
    return 0;
  }
}

export async function Header() {
  const session = await auth();
  const unreadCount = session?.user?.id
    ? await getUnreadCount(session.user.id)
    : 0;

  // Initials for avatar fallback
  const initials = session?.user?.name
    ? session.user.name
        .split(" ")
        .map((w) => w[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "U";

  return (
    <header className="hidden lg:flex sticky top-0 z-40 w-full bg-surface border-b border-border h-16 items-center px-6 gap-6">
      {/* Logo */}
      <Link href="/dashboard" className="flex items-center gap-2 shrink-0">
        <span className="text-crimson font-bold text-xl tracking-tight">LTSD</span>
      </Link>

      {/* Desktop nav — skip Home and Profile (handled by avatar) */}
      <nav className="flex items-center gap-1 ml-4">
        {mainNav
          .filter((item) => item.href !== "/settings/profile")
          .map((item) => (
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
          aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
          className="relative p-2 rounded-md text-body hover:text-crimson hover:bg-bg transition-colors"
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 min-w-4 h-4 px-1 rounded-full bg-crimson text-white text-[10px] font-bold leading-4 text-center tabular-nums">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </Link>

        <Link
          href="/settings/profile"
          className="w-8 h-8 rounded-full bg-crimson text-white flex items-center justify-center text-sm font-semibold"
          aria-label="Profile"
        >
          {initials}
        </Link>
      </div>
    </header>
  );
}
