import Image from "next/image";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { AnnouncementBar } from "./announcement-bar";
import { SearchBar, MobileSearchBar } from "./search-bar";
import { HeaderNav } from "./header-nav";
import { NotificationsBell } from "@/components/notifications/notifications-bell";
import { AccountDropdown } from "./account-dropdown";

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
            <NotificationsBell initialUnreadCount={unreadCount} />
            <AccountDropdown
              name={session?.user?.name ?? null}
              email={session?.user?.email ?? ""}
              image={session?.user?.image ?? null}
              role={session?.user?.role ?? "USER"}
            />
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

          <NotificationsBell initialUnreadCount={unreadCount} />

          <AccountDropdown
            name={session?.user?.name ?? null}
            email={session?.user?.email ?? ""}
            image={session?.user?.image ?? null}
            role={session?.user?.role ?? "USER"}
          />
        </div>

        {/* Mobile search */}
        <MobileSearchBar />
      </header>
    </>
  );
}
