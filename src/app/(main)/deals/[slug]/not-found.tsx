import Link from "next/link";
import { PackageX } from "lucide-react";

export default function DealNotFound() {
  return (
    <div className="max-w-350 mx-auto px-4 md:px-6 py-20 text-center">
      <div className="w-12 h-12 rounded-xl bg-bg flex items-center justify-center mx-auto mb-4">
        <PackageX className="w-6 h-6 text-body" />
      </div>
      <h1 className="text-xl font-extrabold text-navy font-lato">Deal Not Found</h1>
      <p className="text-sm text-body mt-2 font-lato">
        This deal may have expired or been removed.
      </p>
      <Link
        href="/deals"
        className="inline-block mt-6 px-6 py-2.5 rounded-xl bg-navy text-surface text-sm font-bold font-lato hover:bg-navy/90 transition-colors"
      >
        Browse Deals
      </Link>
    </div>
  );
}
