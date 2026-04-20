import Link from "next/link";

const CATEGORIES = [
  { id: "electronics",  label: "Electronics",   emoji: "📱" },
  { id: "computers",    label: "Computers",      emoji: "💻" },
  { id: "home",         label: "Home",           emoji: "🏠" },
  { id: "kitchen",      label: "Kitchen",        emoji: "🍳" },
  { id: "fashion",      label: "Fashion",        emoji: "👗" },
  { id: "gaming",       label: "Gaming",         emoji: "🎮" },
  { id: "fitness",      label: "Fitness",        emoji: "🏋️" },
  { id: "beauty",       label: "Beauty",         emoji: "💄" },
];

export function QuickCategoryBar() {
  return (
    <div
      className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-none"
      role="list"
      aria-label="Browse by category"
    >
      {CATEGORIES.map((cat) => (
        <Link
          key={cat.id}
          href={`/deals?category=${cat.id}`}
          role="listitem"
          className="flex flex-col items-center gap-1 shrink-0 w-16 py-2 rounded-xl border border-border bg-surface hover:border-crimson hover:bg-crimson/5 transition-colors text-center"
        >
          <span className="text-xl" aria-hidden>{cat.emoji}</span>
          <span className="text-[10px] font-medium text-body leading-tight">{cat.label}</span>
        </Link>
      ))}
    </div>
  );
}
