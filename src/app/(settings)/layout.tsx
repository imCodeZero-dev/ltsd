import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { SettingsSidebar } from "@/components/settings/settings-sidebar";
import { BottomTabNav } from "@/components/layout/bottom-tab-nav";
import { NotificationsBell } from "@/components/notifications/notifications-bell";
import { AccountDropdown } from "@/components/layout/account-dropdown";
import { MobileHeader } from "@/components/settings/mobile-header";

export default async function SettingsLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect("/login");

  const user = {
    name: session.user?.name ?? null,
    email: session.user?.email ?? "",
    image: session.user?.image ?? null,
    role: (session.user?.role ?? "USER") as "USER" | "ADMIN",
  };

  return (
    <div className="min-h-screen bg-white">

      {/* ── Desktop: sidebar + content ── */}
      <div className="hidden md:flex min-h-screen">
        <aside className="w-64 shrink-0 border-r border-[#E7E8E9] flex flex-col sticky top-0 h-screen">
          <SettingsSidebar
            name={user.name}
            email={user.email}
            image={user.image}
            role={user.role}
          />
        </aside>

        <div className="flex-1 min-w-0 flex flex-col bg-[#F8F9FA]">
          {/* Top bar */}
          <div className="flex items-center gap-4 px-8 py-3.5 bg-white border-b border-[#E7E8E9]">
            <h1 className="text-xl font-extrabold text-navy flex-1">Settings</h1>
            <NotificationsBell initialUnreadCount={0} />
            <AccountDropdown
              name={user.name}
              email={user.email}
              image={user.image}
              role={user.role}
            />
          </div>

          <div className="flex-1 overflow-auto">
            {children}
          </div>
        </div>
      </div>

      {/* ── Mobile: header + content + bottom nav ── */}
      <div className="md:hidden flex flex-col min-h-screen">
        <MobileHeader notifCount={0} />

        <main className="flex-1 pb-20 bg-[#F8F9FA]">
          {children}
        </main>

        <BottomTabNav />
      </div>
    </div>
  );
}
