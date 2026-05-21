import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <p className="text-7xl font-extrabold text-badge-bg font-lato">404</p>
        <h1 className="text-2xl font-extrabold text-navy font-lato mt-4">Page Not Found</h1>
        <p className="text-sm text-body mt-2 leading-relaxed font-lato">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link
          href="/"
          className="inline-block mt-6 px-6 py-2.5 rounded-xl bg-navy text-surface text-sm font-bold font-lato hover:bg-navy/90 transition-colors"
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
}
