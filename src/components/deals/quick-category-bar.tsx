import Link from "next/link";

const CATEGORIES = [
  { id: "electronics",   label: "Electronics",   bg: "#FFF3E0", emoji: "📱" },
  { id: "fashion",       label: "Fashion",        bg: "#FCE4EC", emoji: "👗" },
  { id: "home",          label: "Home",           bg: "#E8F5E9", emoji: "🏠" },
  { id: "kitchen",       label: "Kitchen",        bg: "#FFF8E1", emoji: "🍳" },
  { id: "fitness",       label: "Fitness",        bg: "#E3F2FD", emoji: "🏋️" },
  { id: "beauty",        label: "Beauty",         bg: "#F3E5F5", emoji: "💄" },
  { id: "gaming",        label: "Gaming",         bg: "#E8EAF6", emoji: "🎮" },
  { id: "toys",          label: "Toys",           bg: "#FBE9E7", emoji: "🧸" },
];

export function QuickCategoryBar() {
  return (
    <div
      className="flex gap-4 overflow-x-auto pb-1 scrollbar-none"
      role="list"
      aria-label="Browse by category"
    >
      {CATEGORIES.map((cat) => (
        <Link
          key={cat.id}
          href={`/deals?category=${cat.id}`}
          role="listitem"
          className="flex flex-col items-center gap-1.5 shrink-0 group"
        >
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center text-2xl border-2 border-transparent group-hover:border-badge-bg transition-all shadow-sm"
            style={{ background: cat.bg }}
          >
            {cat.emoji}
          </div>
          <span className="text-[10px] font-medium text-body text-center leading-tight whitespace-nowrap">
            {cat.label}
          </span>
        </Link>
      ))}
    </div>
  );
}
