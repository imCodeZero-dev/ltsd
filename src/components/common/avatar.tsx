import Image from "next/image";
import { cn } from "@/lib/utils";

interface AvatarProps {
  src?: string | null;
  name?: string | null;
  size?: number;
  className?: string;
}

function getInitials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

export function Avatar({ src, name, size = 36, className }: AvatarProps) {
  const initials = name ? getInitials(name) : "?";

  return (
    <div
      className={cn(
        "relative rounded-full bg-crimson text-white flex items-center justify-center overflow-hidden shrink-0 font-semibold",
        className
      )}
      style={{ width: size, height: size, fontSize: size * 0.38 }}
    >
      {src ? (
        <Image
          src={src}
          alt={name ?? "avatar"}
          fill
          sizes={`${size}px`}
          className="object-cover"
        />
      ) : (
        <span>{initials}</span>
      )}
    </div>
  );
}
