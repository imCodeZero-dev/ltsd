import type { Metadata } from "next";
import Link from "next/link";
import {
  User,
  Bell,
  Shield,
  ChevronRight,
  LogOut,
  Tag,
} from "lucide-react";

export const metadata: Metadata = { title: "Settings" };

interface SettingsRow {
  icon: React.ElementType;
  label: string;
  description: string;
  href: string;
  danger?: boolean;
}

const rows: SettingsRow[] = [
  {
    icon: User,
    label: "Profile",
    description: "Name, email, avatar",
    href: "/settings/profile",
  },
  {
    icon: Tag,
    label: "Deal Preferences",
    description: "Categories, brands, price range",
    href: "/onboarding/categories",
  },
  {
    icon: Bell,
    label: "Notifications",
    description: "Alerts, push preferences",
    href: "/settings/notifications",
  },
  {
    icon: Shield,
    label: "Privacy & Security",
    description: "Password, data, account",
    href: "/settings/profile",
  },
];

export default function SettingsPage() {
  return (
    <div className="px-4 py-4 max-w-2xl mx-auto space-y-4">
      <h1 className="text-subheading font-bold text-navy">Settings</h1>

      {/* Settings rows */}
      <div className="bg-surface rounded-2xl border border-border divide-y divide-border overflow-hidden">
        {rows.map((row) => {
          const Icon = row.icon;
          return (
            <Link
              key={row.href + row.label}
              href={row.href}
              className="flex items-center gap-4 px-4 py-3.5 hover:bg-bg transition-colors group"
            >
              <div className="w-9 h-9 rounded-xl bg-bg flex items-center justify-center shrink-0 group-hover:bg-crimson/10 transition-colors">
                <Icon className="w-4.5 h-4.5 text-body group-hover:text-crimson transition-colors" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-navy">{row.label}</p>
                <p className="text-xs text-muted-foreground">{row.description}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-crimson transition-colors shrink-0" />
            </Link>
          );
        })}
      </div>

      {/* Sign out */}
      <button
        type="button"
        className="w-full flex items-center gap-4 px-4 py-3.5 bg-surface rounded-2xl border border-border hover:bg-error-bg hover:border-error transition-colors group"
      >
        <div className="w-9 h-9 rounded-xl bg-error-bg flex items-center justify-center shrink-0">
          <LogOut className="w-4.5 h-4.5 text-error" />
        </div>
        <span className="text-sm font-semibold text-error">Sign out</span>
      </button>

      <p className="text-center text-xs text-muted-foreground">LTSD v0.1.0</p>
    </div>
  );
}
