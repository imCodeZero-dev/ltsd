import Link from "next/link";
import {
  LayoutDashboard,
  Tag,
  Users,
  Bell,
  Trophy,
} from "lucide-react";

const NAV = [
  { label: "Dashboard",   href: "/admin/dashboard", icon: LayoutDashboard },
  { label: "Deals",       href: "/admin/deals",      icon: Tag },
  { label: "Deal of Day", href: "/admin/deals",      icon: Trophy },
  { label: "Users",       href: "/admin/users",      icon: Users },
  { label: "Alert Logs",  href: "/admin/alerts",     icon: Bell },
];

export function AdminSidebar() {
  return (
    <aside className="flex flex-col w-64 min-h-screen bg-sidebar border-r border-sidebar-border">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-sidebar-border">
        <span className="text-white font-bold text-lg tracking-tight">
          LTSD <span className="text-crimson">Admin</span>
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV.map(({ label, href, icon: Icon }) => (
          <Link
            key={label}
            href={href}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors"
          >
            <Icon className="w-4 h-4 shrink-0" />
            {label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
