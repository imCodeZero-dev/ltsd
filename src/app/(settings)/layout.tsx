import { SettingsSidebar } from "@/components/settings/settings-sidebar";
import { BottomTabNav } from "@/components/layout/bottom-tab-nav";
import { NotificationsBell } from "@/components/notifications/notifications-bell";
import { ChevronDown, User, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white">

      {/* ── Desktop: sidebar + content ── */}
      <div className="hidden md:flex min-h-screen">
        {/* Sidebar */}
        <aside className="w-64 shrink-0 border-r border-[#E7E8E9] flex flex-col sticky top-0 h-screen">
          <SettingsSidebar />
        </aside>

        {/* Content column */}
        <div className="flex-1 min-w-0 flex flex-col bg-[#F8F9FA]">
          {/* Minimal top-right bar */}
          <div className="flex items-center justify-end gap-4 px-8 py-3.5 bg-white border-b border-[#E7E8E9]">
            <NotificationsBell initialUnreadCount={1} />
            <Link
              href="/settings/profile"
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              <div className="w-8 h-8 rounded-full border border-[#E7E8E9] flex items-center justify-center text-body shrink-0">
                <User className="w-4 h-4" />
              </div>
              <span className="text-sm font-medium text-navy">Account</span>
              <ChevronDown className="w-3.5 h-3.5 text-body" />
            </Link>
          </div>

          {/* Page content scrolls here */}
          <div className="flex-1 overflow-auto">
            {children}
          </div>
        </div>
      </div>

      {/* ── Mobile: simple header + content + bottom nav ── */}
      <div className="md:hidden flex flex-col min-h-screen">
        <header className="sticky top-0 z-40 bg-white border-b border-[#E7E8E9] px-4 h-14 flex items-center gap-3">
          <Link href="/dashboard" className="p-1.5 -ml-1.5 text-body">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <span className="text-base font-bold text-navy flex-1">Settings</span>
          <NotificationsBell initialUnreadCount={1} />
        </header>

        <main className="flex-1 pb-20 bg-[#F8F9FA]">
          {children}
        </main>

        <BottomTabNav />
      </div>
    </div>
  );
}
