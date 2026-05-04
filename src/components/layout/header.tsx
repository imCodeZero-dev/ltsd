import Image from "next/image";
import Link from "next/link";
import { ChevronDown, User } from "lucide-react";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { AnnouncementBar } from "./announcement-bar";
import { SearchBar, MobileSearchBar } from "./search-bar";
import { HeaderNav } from "./header-nav";
import { NotificationsBell } from "@/components/notifications/notifications-bell";

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

  return (
    <>
      <AnnouncementBar />

      <header className="sticky top-0 z-40 w-full bg-surface border-b border-border">
        {/* ── Desktop nav row ── */}
        <div className="max-w-350 mx-auto px-6 h-16 hidden md:grid items-center"
          style={{ gridTemplateColumns: "auto 1fr auto", gap: "24px" }}>

          {/* LEFT: logo + nav */}
          <div className="flex items-center gap-7">
            <Link href="/dashboard" aria-label="LTSD Home" className="shrink-0">
              <Image
                src="/images/ltsd-logo.png"
                alt="LTSD"
                width={44}
                height={44}
                className="rounded-full"
                priority
              />
            </Link>
            <HeaderNav />
          </div>

          {/* CENTER: search */}
          <div className="flex items-center justify-center">
            <SearchBar />
          </div>

          {/* RIGHT: bell + account */}
          <div className="flex items-center gap-4 justify-end">
            {/* Bell with notifications dropdown */}
            <NotificationsBell initialUnreadCount={unreadCount} />

            {/* Account */}
            <Link
              href="/settings/profile"
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              <div className="w-8 h-8 rounded-full border border-border flex items-center justify-center text-body shrink-0">
                <User className="w-4 h-4" />
              </div>
              <span className="text-sm font-medium text-navy">
                Account
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-subtle" />
            </Link>
          </div>
        </div>

        {/* ── Mobile row ── */}
        <div className="md:hidden px-4 h-14 flex items-center gap-3">
          <Link href="/dashboard" aria-label="LTSD Home" className="shrink-0">
            <Image
              src="/images/ltsd-logo.png"
              alt="LTSD"
              width={36}
              height={36}
              className="rounded-full"
            />
          </Link>

          <div className="flex-1" />

          <div className="p-1.5">
            <NotificationsBell initialUnreadCount={unreadCount} />
          </div>

          <Link href="/settings/profile" className="p-1.5 text-body">
            <User className="w-5 h-5" />
          </Link>
        </div>

        {/* Mobile search */}
        <MobileSearchBar />
      </header>
    </>
  );
}
