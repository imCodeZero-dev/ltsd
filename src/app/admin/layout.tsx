import { requireAdmin } from "@/lib/auth-guard";
import { AdminSidebar } from "@/components/layout/admin-sidebar";
import { NotificationsBell } from "@/components/notifications/notifications-bell";
import { AccountDropdown } from "@/components/layout/account-dropdown";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Blocks anyone who is not ADMIN — redirects guests to /login, users to /dashboard
  const session = await requireAdmin();

  const user = {
    name:  session.user.name  ?? null,
    email: session.user.email ?? "",
    image: session.user.image ?? null,
    role:  session.user.role  as "USER" | "ADMIN",
  };

  return (
    <div className="min-h-screen bg-bg flex">
      {/* Sidebar — sticky full height */}
      <aside className="hidden lg:flex w-64 shrink-0 flex-col border-r border-[#E7E8E9] bg-white sticky top-0 h-screen">
        <AdminSidebar name={user.name} email={user.email} image={user.image} />
      </aside>

      {/* Right column */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top bar */}
        <header className="sticky top-0 z-40 bg-white border-b border-[#E7E8E9] flex items-center gap-4 px-3 sm:px-6 py-3">
          <div className="flex-1" />
          <NotificationsBell initialUnreadCount={0} />
          <AccountDropdown
            name={user.name}
            email={user.email}
            image={user.image}
            role={user.role}
          />
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
