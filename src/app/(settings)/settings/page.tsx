import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

export const metadata: Metadata = { title: "Account Settings — LTSD" };

function SettingsRow({
  label,
  description,
  rightContent,
  href,
  danger,
}: {
  label: string;
  description: string;
  rightContent?: React.ReactNode;
  href?: string;
  danger?: boolean;
}) {
  const inner = (
    <div className="flex items-start justify-between gap-4 py-5 px-0">
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold ${danger ? "text-error" : "text-navy"}`}>{label}</p>
        <p className="text-xs text-body mt-0.5 leading-relaxed">{description}</p>
      </div>
      {rightContent}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block hover:bg-[#F8F9FA] -mx-6 px-6 transition-colors">
        {inner}
      </Link>
    );
  }
  return <div className="-mx-6 px-6">{inner}</div>;
}

function Section({ label, description, children }: { label: string; description: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-10 py-2">
      {/* Left label */}
      <div className="w-48 shrink-0 hidden md:block">
        <p className="text-sm font-semibold text-navy">{label}</p>
        <p className="text-xs text-body mt-1 leading-relaxed">{description}</p>
      </div>
      {/* Right content */}
      <div className="flex-1 min-w-0 border rounded-xl border-[#E7E8E9] divide-y divide-[#E7E8E9] px-6 bg-white">
        {/* Mobile label */}
        <div className="md:hidden py-3">
          <p className="text-sm font-semibold text-navy">{label}</p>
          <p className="text-xs text-body mt-0.5">{description}</p>
        </div>
        {children}
      </div>
    </div>
  );
}

export default function AccountSettingsPage() {
  return (
    <div className="px-6 md:px-10 py-8 max-w-4xl space-y-0">
      <h1 className="text-2xl font-extrabold text-navy mb-1">Settings</h1>
      <p className="text-sm text-body mb-8">Manage your profile and preferences</p>

      <div className="space-y-8">
        {/* Profile Information */}
        <Section label="Account Settings" description="Manage your profile and preferences">
          <SettingsRow
            label="Profile Information"
            description="Manage your basic account information"
            href="/settings/profile"
            rightContent={
              <div className="flex flex-col items-end gap-1 shrink-0">
                <input
                  defaultValue="Saad Ahmed"
                  readOnly
                  className="text-sm text-navy border border-[#E7E8E9] rounded-lg px-3 py-1.5 w-52 bg-white focus:outline-none focus:border-navy"
                />
                <input
                  defaultValue="saadahmed@gmail.com"
                  readOnly
                  className="text-sm text-body border border-[#E7E8E9] rounded-lg px-3 py-1.5 w-52 bg-white focus:outline-none focus:border-navy"
                />
              </div>
            }
          />
        </Section>

        {/* Security */}
        <Section label="Security" description="Update your password to keep your account secure">
          <SettingsRow
            label="Password"
            description="Last updated 2 months ago"
            rightContent={
              <div className="flex items-center gap-3 shrink-0">
                <div className="flex items-center gap-1">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <span key={i} className="w-2 h-2 rounded-full bg-[#CBCBCB]" />
                  ))}
                </div>
                <Link href="/settings/profile" className="text-xs font-semibold text-navy hover:text-badge-bg transition-colors flex items-center gap-0.5">
                  Change <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            }
          />
        </Section>

        {/* Preferences */}
        <Section label="Preferences" description="Customize your deal preferences and alerts">
          <SettingsRow
            label="Notifications"
            description="Manage how and when you receive alerts"
            href="/settings/notifications"
            rightContent={
              <Link href="/settings/notifications" className="text-xs font-semibold text-navy hover:text-badge-bg transition-colors flex items-center gap-0.5 shrink-0">
                Manage <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            }
          />
          <SettingsRow
            label="Deal Categories"
            description="Choose the types of deals you want to see"
            href="/onboarding/categories"
            rightContent={
              <Link href="/onboarding/categories" className="text-xs font-semibold text-navy hover:text-badge-bg transition-colors flex items-center gap-0.5 shrink-0">
                Edit <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            }
          />
        </Section>

        {/* Account / Delete */}
        <Section label="Account" description="Permanently remove your account and all data">
          <div className="py-5">
            <p className="text-sm font-semibold text-navy mb-0.5">Delete Account</p>
            <p className="text-xs text-body mb-3">Permanently delete your account and all associated data.</p>
            <button
              type="button"
              className="px-4 py-2 rounded-lg bg-error text-white text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              Delete Account
            </button>
          </div>
        </Section>
      </div>
    </div>
  );
}
