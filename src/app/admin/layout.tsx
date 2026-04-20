import { AdminSidebar } from "@/components/layout/admin-sidebar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-bg">
      {/* Sidebar — hidden on mobile, visible on lg+ */}
      <div className="hidden lg:flex">
        <AdminSidebar />
      </div>
      <main className="flex-1 p-6 overflow-auto">{children}</main>
    </div>
  );
}
