import { redirect } from "next/navigation";

// Root "/" redirects to the landing page inside (public) route group.
// Once auth is wired, this will check session and redirect to /dashboard.
export default function RootPage() {
  redirect("/dashboard");
}
