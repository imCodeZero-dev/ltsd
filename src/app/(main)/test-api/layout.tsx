import { requireAdmin } from "@/lib/auth-guard";

export default async function TestApiLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin(); // redirects non-admins to /dashboard
  return <>{children}</>;
}
