"use client";

import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import { AdminSidebar } from "@/components/layout/admin-sidebar";
import { NotificationsBell } from "@/components/notifications/notifications-bell";
import { AccountDropdown } from "@/components/layout/account-dropdown";
import { usePathname } from "next/navigation";

interface Props {
  name:     string | null;
  email:    string;
  image:    string | null;
  role:     "USER" | "ADMIN";
  children: React.ReactNode; // page content
}

export function AdminLayoutShell({ name, email, image, role, children }: Props) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Close drawer on route change
  useEffect(() => { setOpen(false); }, [pathname]);

  // Lock body scroll when open
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <div className="flex-1 min-w-0 flex flex-col">

      {/* Mobile overlay */}
      {open && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/40"
          onClick={() => setOpen(false)}
          aria-hidden
        />
      )}

      {/* Mobile sidebar drawer */}
      <div className={`
        lg:hidden fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-2xl border-r border-[#E7E8E9]
        transform transition-transform duration-300 ease-in-out
        ${open ? "translate-x-0" : "-translate-x-full"}
      `}>
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Close menu"
          className="absolute top-3 right-3 p-1.5 rounded-lg text-body hover:text-navy hover:bg-bg transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
        <AdminSidebar name={name} email={email} image={image} />
      </div>

      {/* Top bar */}
      <header className="sticky top-0 z-30 bg-white border-b border-[#E7E8E9] flex items-center gap-2 px-3 sm:px-6 py-3">
        {/* Hamburger — mobile only */}
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open menu"
          className="lg:hidden p-2 -ml-1 rounded-lg text-body hover:text-navy hover:bg-bg transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex-1" />

        <NotificationsBell initialUnreadCount={0} />
        <AccountDropdown name={name} email={email} image={image} role={role} />
      </header>

      {/* Page content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
