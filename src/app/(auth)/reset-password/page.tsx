import type { Metadata } from "next";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export const metadata: Metadata = { title: "Reset Password" };

interface Props {
  searchParams: Promise<{ token?: string }>;
}

export default async function ResetPasswordPage({ searchParams }: Props) {
  const { token } = await searchParams;

  if (!token) {
    return (
      <div className="text-center text-sm text-body" style={{ fontFamily: "var(--font-lato)" }}>
        Invalid or missing reset link. Please{" "}
        <a href="/forgot-password" className="text-link underline">request a new one</a>.
      </div>
    );
  }

  return <ResetPasswordForm token={token} />;
}
