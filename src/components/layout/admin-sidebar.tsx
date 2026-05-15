"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, Tag, Bell, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { LogoutModal } from "@/components/common/logout-modal";
import { Avatar } from "@/components/common/avatar";

const NAV = [
  { label: "Dashboard",  href: "/admin/dashboard", icon: LayoutDashboard },
  { label: "Users",      href: "/admin/users",     icon: Users },
  { label: "Deals",      href: "/admin/deals",     icon: Tag },
  { label: "Alert Logs", href: "/admin/alerts",    icon: Bell },
];

interface AdminSidebarProps {
  name: string | null;
  email: string;
  image: string | null;
}

export function AdminSidebar({ name, email, image }: AdminSidebarProps) {
  const pathname = usePathname();
  const [showLogout, setShowLogout] = useState(false);

  return (
    <div className="flex flex-col h-full w-full">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-[#E7E8E9]">
        <Image src="/images/ltsd-logo.png" alt="LTSD" width={40} height={40} className="rounded-full" />
        <div className="min-w-0">
          <span className="text-base font-extrabold text-navy tracking-tight">LTSD</span>
          <span className="ml-2 text-2xs font-bold uppercase tracking-wider text-badge-bg bg-badge-bg/10 px-1.5 py-0.5 rounded">Admin</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {NAV.map(({ label, href, icon: Icon }) => {
          const active =
            href === "/settings"
              ? pathname.startsWith("/settings")
              : pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
                active
                  ? "bg-[#F0F2F5] text-navy font-semibold"
                  : "text-body hover:bg-bg hover:text-navy",
              )}
            >
              <Icon className={cn("w-4 h-4 shrink-0", active ? "text-navy" : "text-body")} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* User footer */}
      <div className="px-4 pb-5 border-t border-[#E7E8E9] pt-4 flex items-center gap-3">
        <Avatar src={image} name={name ?? email} size={36} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-navy leading-none truncate">
            {name ?? email.split("@")[0]}
          </p>
          <p className="text-[11px] text-badge-bg font-semibold mt-0.5">Admin</p>
        </div>
        <button
          type="button"
          onClick={() => setShowLogout(true)}
          className="text-body hover:text-error transition-colors shrink-0"
          aria-label="Sign out"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>

      <LogoutModal open={showLogout} onClose={() => setShowLogout(false)} />
    </div>
  );
}
