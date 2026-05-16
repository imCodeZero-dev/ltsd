import Link from "next/link";

export function AnnouncementBar() {
  return (
    <div
      className="hidden md:flex w-full h-9 px-6 items-center justify-center overflow-hidden"
      style={{ background: "#000A1E" }}
    >
      <p className="text-xs font-medium text-white truncate text-center">
        Summer Sale For All Swim Suits And Free Express Delivery — OFF 50%!{" "}
        <Link
          href="/deals"
          className="font-bold underline underline-offset-2 hover:no-underline whitespace-nowrap"
        >
          Shop Now
        </Link>
      </p>
    </div>
  );
}
