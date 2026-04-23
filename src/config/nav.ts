import { Home, Tag, Bookmark, Bell, User } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

export const mainNav: NavItem[] = [
  { label: "Home",      href: "/dashboard",        icon: Home },
  { label: "Deals",     href: "/deals",             icon: Tag },
  { label: "Watchlist", href: "/watchlist",         icon: Bookmark },
  { label: "Alerts",    href: "/notifications",     icon: Bell },
  { label: "Profile",   href: "/settings/profile",  icon: User },
];
