"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Admin-specific error boundary.
 * When the session expires or logout fires while on an admin page,
 * requireAdmin() throws — this catches it and redirects to /login
 * instead of showing the generic "Something went wrong" page.
 */
export default function AdminError({
  error,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    // Log for debugging, then redirect to login
    console.error("[Admin] Error boundary caught:", error.message);
    router.replace("/login");
  }, [error, router]);

  // Brief loading state while redirect happens
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="flex items-center gap-3 text-body text-sm">
        <span className="w-4 h-4 border-2 border-body/30 border-t-body rounded-full animate-spin" />
        Redirecting…
      </div>
    </div>
  );
}
