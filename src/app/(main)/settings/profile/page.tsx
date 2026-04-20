import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { ProfileForm } from "@/components/auth/profile-form";

export const metadata: Metadata = { title: "Profile" };

export default function ProfilePage() {
  // TODO: fetch session user from auth()
  const user = { name: "Jane Smith", email: "jane@example.com", image: null as string | null };

  return (
    <div className="px-4 py-4 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/settings"
          className="p-2 rounded-xl border border-border text-muted-foreground hover:text-crimson hover:border-crimson transition-colors"
          aria-label="Back to settings"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <h1 className="text-subheading font-bold text-navy">Profile</h1>
      </div>

      <ProfileForm name={user.name} email={user.email} image={user.image} />
    </div>
  );
}
