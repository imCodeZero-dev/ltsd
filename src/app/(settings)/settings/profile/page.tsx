import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { auth } from "@/lib/auth";
import { Avatar } from "@/components/common/avatar";
import { LogoutButton } from "@/components/settings/logout-button";
import { ProfileInfoSection } from "@/components/settings/profile-info-section";
import { AvatarUpload } from "@/components/settings/avatar-upload";
import { ChangePasswordModal } from "@/components/settings/change-password-modal";
import { DeleteAccountButton } from "@/components/settings/delete-account-modal";

export const metadata: Metadata = { title: "Profile — LTSD" };

// ── Desktop: full-width section divider layout ────────────────────────────────

function Section({
  label,
  description,
  children,
}: {
  label: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-10 py-6 border-b border-[#E7E8E9] last:border-b-0">
      {/* Left label */}
      <div className="w-44 shrink-0">
        <p className="text-sm font-semibold text-navy">{label}</p>
        <p className="text-xs text-body mt-1 leading-relaxed">{description}</p>
      </div>
      {/* Right content card */}
      <div className="flex-1 min-w-0 border border-[#E7E8E9] rounded-xl divide-y divide-[#E7E8E9] bg-white">
        {children}
      </div>
    </div>
  );
}

function Row({
  children,
  href,
}: {
  children: React.ReactNode;
  href?: string;
}) {
  if (href) {
    return (
      <Link href={href} className="flex items-center justify-between gap-6 px-6 py-5 hover:bg-bg transition-colors">
        {children}
      </Link>
    );
  }
  return (
    <div className="flex items-center justify-between gap-6 px-6 py-5">
      {children}
    </div>
  );
}

// ── Mobile list row ───────────────────────────────────────────────────────────

function MobileRow({
  label,
  href,
  danger,
  icon,
}: {
  label: string;
  href: string;
  danger?: boolean;
  icon: React.ReactNode;
}) {
  return (
    <Link href={href} className="flex items-center gap-3 px-4 py-3.5 bg-white hover:bg-bg transition-colors">
      <span className={`shrink-0 ${danger ? "text-error" : "text-body"}`}>{icon}</span>
      <span className={`flex-1 text-sm font-medium ${danger ? "text-error" : "text-navy"}`}>{label}</span>
      <ChevronRight className={`w-4 h-4 shrink-0 ${danger ? "text-error" : "text-body"}`} />
    </Link>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default async function ProfilePage() {
  const session = await auth();
  const name  = session?.user?.name  ?? null;
  const email = session?.user?.email ?? "";
  const image = session?.user?.image ?? null;

  return (
    <>
      {/* ════════════════════════════════════════════════
          DESKTOP — Account overview (Figma 16)
      ════════════════════════════════════════════════ */}
      <div className="hidden md:block">

        {/* Sections — full width, divided */}
        <div className="px-10 pt-2 bg-white">

          {/* Account Settings */}
          <Section label="Account Settings" description="Manage your profile and preferences">
            <Row>
              <div className="w-36 shrink-0">
                <p className="text-sm font-semibold text-navy">Photo</p>
                <p className="text-xs text-body mt-0.5">Drag &amp; drop or click to upload</p>
              </div>
              <div className="flex-1 min-w-0">
                <AvatarUpload src={image} name={name ?? ""} email={email} />
              </div>
            </Row>
            <ProfileInfoSection name={name ?? ""} email={email} />
          </Section>

          {/* Security */}
          <Section label="Security" description="Update your password to keep your account secure">
            <Row>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-navy">Password</p>
                  <span className="text-xs text-badge-bg font-medium">Last updated 2 months ago</span>
                </div>
                <div className="flex items-center gap-1.5 mt-2">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <span key={i} className="w-2 h-2 rounded-full bg-border-mid" />
                  ))}
                </div>
              </div>
              <ChangePasswordModal />
            </Row>
          </Section>

          {/* Preferences */}
          <Section label="Preferences" description="Customize your deal preferences and alerts">
            <Row href="/settings">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-navy">Notifications</p>
                <p className="text-xs text-body mt-0.5">Manage how and when you receive alerts</p>
              </div>
              <span className="text-xs font-semibold text-navy flex items-center gap-0.5 shrink-0">
                Manage <ChevronRight className="w-3.5 h-3.5" />
              </span>
            </Row>
            <Row href="/onboarding/categories">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-navy">Deal Categories</p>
                <p className="text-xs text-body mt-0.5">Choose the types of deals you want to see</p>
              </div>
              <span className="text-xs font-semibold text-navy flex items-center gap-0.5 shrink-0">
                Edit <ChevronRight className="w-3.5 h-3.5" />
              </span>
            </Row>
          </Section>

          {/* Account — Delete */}
          <Section label="Account" description="Permanently remove your account and all data">
            <div className="px-6 py-5 bg-red-50/50 rounded-b-xl">
              <p className="text-sm font-semibold text-navy mb-0.5">Delete Account</p>
              <p className="text-xs text-body mb-4">Permanently delete your account and all associated data.</p>
              <DeleteAccountButton />
            </div>
          </Section>

        </div>
      </div>

      {/* ════════════════════════════════════════════════
          MOBILE — My Profile list (Figma 16.1)
      ════════════════════════════════════════════════ */}
      <div className="md:hidden flex flex-col pb-8">

        {/* User card */}
        <div className="bg-white mx-4 mt-4 rounded-2xl border border-[#E7E8E9] px-4 py-4 flex items-center gap-3 shadow-sm">
          <div className="relative shrink-0">
            <Avatar src={image} name={name ?? email} size={52} />
            <Link
              href="/settings/profile/edit"
              aria-label="Change photo"
              className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-badge-bg flex items-center justify-center border-2 border-white"
            >
              <svg viewBox="0 0 24 24" className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" strokeWidth={2.5}>
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                <circle cx="12" cy="13" r="4"/>
              </svg>
            </Link>
          </div>
          <div className="min-w-0">
            <p className="text-base font-bold text-navy truncate">{name ?? email.split("@")[0]}</p>
            <p className="text-xs text-body mt-0.5 truncate">@{email.split("@")[0]}</p>
          </div>
        </div>

        {/* ACCOUNT */}
        <div className="mt-6">
          <p className="px-4 pb-2 text-[11px] font-bold uppercase tracking-widest text-body">Account</p>
          <div className="border-y border-[#E7E8E9] divide-y divide-[#E7E8E9]">
            <MobileRow label="Edit Profile" href="/settings/profile/edit"
              icon={<svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>} />
            <MobileRow label="Notifications" href="/settings"
              icon={<svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2}><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0"/></svg>} />
            <MobileRow label="Change Password" href="/forgot-password"
              icon={<svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2}><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>} />
          </div>
        </div>

        {/* INFORMATION */}
        <div className="mt-6">
          <p className="px-4 pb-2 text-[11px] font-bold uppercase tracking-widest text-body">Information</p>
          <div className="border-y border-[#E7E8E9] divide-y divide-[#E7E8E9]">
            <MobileRow label="Terms of Service" href="/terms"
              icon={<svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>} />
            <MobileRow label="Privacy Policy" href="/privacy"
              icon={<svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>} />
            <MobileRow label="Deactivate Account" href="/settings/deactivate" danger
              icon={<svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2}><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>} />
          </div>
        </div>

        {/* Logout */}
        <div className="px-4 mt-8">
          <LogoutButton />
        </div>
      </div>
    </>
  );
}
