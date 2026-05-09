"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { usePathname } from "next/navigation";

function getMobileTitle(pathname: string): string {
  if (pathname === "/settings/profile/edit") return "Edit Profile";
  if (pathname.startsWith("/settings/profile")) return "My Profile";
  if (pathname.startsWith("/settings")) return "Notification Settings";
  return "Settings";
}

function getBackHref(pathname: string): string {
  if (pathname === "/settings/profile/edit") return "/settings/profile";
  return "/dashboard";
}

export function MobileHeader({ notifCount }: { notifCount: number }) {
  const pathname = usePathname();
  const title = getMobileTitle(pathname);
  const backHref = getBackHref(pathname);

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-[#E7E8E9] px-4 h-14 flex items-center gap-3">
      <Link href={backHref} className="p-1.5 -ml-1.5 text-body">
        <ArrowLeft className="w-5 h-5" />
      </Link>
      <span className="text-base font-bold text-navy flex-1">{title}</span>
      {notifCount > 0 && (
        <span className="w-5 h-5 rounded-full bg-error text-white text-[10px] font-bold flex items-center justify-center">
          {notifCount}
        </span>
      )}
    </header>
  );
}
