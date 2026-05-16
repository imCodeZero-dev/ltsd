import { requireAdmin } from "@/lib/auth-guard";
import { AdminSidebar } from "@/components/layout/admin-sidebar";
import { AdminLayoutShell } from "@/components/layout/admin-layout-shell";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAdmin();

  const user = {
    name:  session.user.name  ?? null,
    email: session.user.email ?? "",
    image: session.user.image ?? null,
    role:  session.user.role  as "USER" | "ADMIN",
  };

  return (
    <div className="min-h-screen bg-bg flex">
      {/* Desktop sidebar — sticky full height */}
      <aside className="hidden lg:flex w-64 shrink-0 flex-col border-r border-[#E7E8E9] bg-white sticky top-0 h-screen">
        <AdminSidebar name={user.name} email={user.email} image={user.image} />
      </aside>

      {/* Right column — shell handles header + mobile drawer */}
      <AdminLayoutShell
        name={user.name}
        email={user.email}
        image={user.image}
        role={user.role}
      >
        {children}
      </AdminLayoutShell>
    </div>
  );
}
