import { AdminSidebar } from "@/components/layout/admin-sidebar";
import { NotificationsBell } from "@/components/notifications/notifications-bell";
import { ChevronDown, User, Search } from "lucide-react";
import Link from "next/link";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#F8F9FA] flex">
      {/* Sidebar — sticky full height */}
      <aside className="hidden lg:flex w-64 shrink-0 flex-col border-r border-[#E7E8E9] bg-white sticky top-0 h-screen">
        <AdminSidebar />
      </aside>

      {/* Right column */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top bar */}
        <header className="sticky top-0 z-40 bg-white border-b border-[#E7E8E9] flex items-center gap-4 px-6 py-3">
          {/* Search input */}
          <div className="flex items-center gap-2 flex-1 max-w-xs border border-[#E7E8E9] rounded-lg px-3 py-2 bg-white">
            <Search className="w-4 h-4 text-body shrink-0" />
            <input
              type="text"
              placeholder="Select"
              className="text-sm text-body placeholder:text-body outline-none w-full bg-transparent"
            />
          </div>

          <div className="flex-1" />

          {/* Bell + Account */}
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
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
