import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { ProfileForm } from "@/components/auth/profile-form";

export const metadata: Metadata = { title: "Edit Profile — LTSD" };

export default async function EditProfilePage() {
  const session = await auth();
  const user = {
    name:  session?.user?.name  ?? "",
    email: session?.user?.email ?? "",
    image: session?.user?.image ?? null,
  };

  return (
    <div className="px-4 md:px-10 py-6 max-w-lg mx-auto md:mx-0">
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/settings/profile"
          className="p-2 rounded-xl border border-border text-body hover:text-navy hover:border-navy transition-colors"
          aria-label="Back"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <h1 className="text-lg font-bold text-navy">Edit Profile</h1>
      </div>

      <ProfileForm name={user.name} email={user.email} image={user.image} />
    </div>
  );
}
