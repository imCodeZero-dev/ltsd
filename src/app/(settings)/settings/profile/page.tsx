import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, Bell, FileText, Shield } from "lucide-react";
import { auth } from "@/lib/auth";
import { LogoutButton } from "@/components/settings/logout-button";
import { ProfileInfoSection } from "@/components/settings/profile-info-section";
import { AvatarUpload } from "@/components/settings/avatar-upload";
import { ChangePasswordModal } from "@/components/settings/change-password-modal";
import { DeleteAccountButton } from "@/components/settings/delete-account-modal";

export const metadata: Metadata = { title: "Profile — LTSD" };

// ── Responsive Section ───────────────────────────────────────────────────────
// Mobile: stacked (label top, card below)
// Desktop: side-by-side (label left, card right)

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
    <div className="flex flex-col md:flex-row md:gap-10 py-5 md:py-6 border-b border-[#E7E8E9] last:border-b-0">
      <div className="md:w-44 md:shrink-0 mb-3 md:mb-0">
        <p className="text-sm font-semibold text-navy">{label}</p>
        <p className="text-xs text-body mt-0.5 md:mt-1 md:leading-relaxed">{description}</p>
      </div>
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
      <Link href={href} className="flex items-center justify-between gap-4 px-4 md:px-6 py-4 md:py-5 hover:bg-bg transition-colors">
        {children}
      </Link>
    );
  }
  return (
    <div className="flex items-center justify-between gap-4 px-4 md:px-6 py-4 md:py-5">
      {children}
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default async function ProfilePage() {
  const session = await auth();
  const name  = session?.user?.name  ?? null;
  const email = session?.user?.email ?? "";
  const image = session?.user?.image ?? null;

  return (
    <div className="px-4 md:px-10 pt-4 md:pt-2 pb-10 bg-white min-h-full">

      {/* Account Settings */}
      <Section label="Account Settings" description="Manage your profile and preferences">
        <div className="px-4 md:px-6 py-4">
          <AvatarUpload src={image} name={name ?? ""} email={email} />
        </div>
        <ProfileInfoSection name={name ?? ""} email={email} />
      </Section>

      {/* Security */}
      <Section label="Security" description="Update your password to keep your account secure">
        <Row>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
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
        <div className="px-4 md:px-6 py-4 md:py-5 bg-red-50/50 rounded-b-xl">
          <p className="text-sm font-semibold text-navy mb-0.5">Delete Account</p>
          <p className="text-xs text-body mb-4">Permanently delete your account and all associated data.</p>
          <DeleteAccountButton />
        </div>
      </Section>

      {/* ── Mobile-only: quick links + logout ── */}
      <div className="md:hidden mt-6 space-y-4">
        <div>
          <p className="pb-2 text-[11px] font-bold uppercase tracking-widest text-body">Information</p>
          <div className="border border-[#E7E8E9] rounded-xl divide-y divide-[#E7E8E9] bg-white overflow-hidden">
            <Link href="/settings" className="flex items-center gap-3 px-4 py-3.5 hover:bg-bg transition-colors">
              <Bell className="w-4 h-4 text-body shrink-0" />
              <span className="flex-1 text-sm font-medium text-navy">Notification Settings</span>
              <ChevronRight className="w-4 h-4 text-body" />
            </Link>
            <Link href="/terms" className="flex items-center gap-3 px-4 py-3.5 hover:bg-bg transition-colors">
              <FileText className="w-4 h-4 text-body shrink-0" />
              <span className="flex-1 text-sm font-medium text-navy">Terms of Service</span>
              <ChevronRight className="w-4 h-4 text-body" />
            </Link>
            <Link href="/privacy" className="flex items-center gap-3 px-4 py-3.5 hover:bg-bg transition-colors">
              <Shield className="w-4 h-4 text-body shrink-0" />
              <span className="flex-1 text-sm font-medium text-navy">Privacy Policy</span>
              <ChevronRight className="w-4 h-4 text-body" />
            </Link>
          </div>
        </div>

        <LogoutButton />
      </div>

    </div>
  );
}
