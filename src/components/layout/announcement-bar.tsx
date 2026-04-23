import Link from "next/link";
import { X } from "lucide-react";

export function AnnouncementBar() {
  return (
    <div
      className="w-full py-2 px-4 text-center text-xs font-medium text-white relative flex items-center justify-center gap-2"
      style={{ background: "#000A1E" }}
    >
      <span>
        Summer Sale: Get All Items, Sofa and Free Express Delivery — Off 53%
      </span>
      <Link
        href="/deals"
        className="font-bold underline underline-offset-2 hover:no-underline shrink-0"
      >
        Shop Now
      </Link>
    </div>
  );
}
