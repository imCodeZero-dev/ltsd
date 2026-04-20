"use client";

// Figma: 6. Onboarding - Category Selection (node 272:10291)
// Step 1 of 3 — 4-col desktop / 3-col mobile card grid

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  ShoppingBag, Car, Baby, GraduationCap, Sparkles, BookOpen,
  Camera, Smartphone, Laptop, Package, Zap, Dumbbell,
  Gamepad2, Home, Trophy, Wrench, Search,
} from "lucide-react";
import { ProgressIndicator } from "@/components/onboarding/progress-indicator";
import { CategoryCard } from "@/components/onboarding/category-card";
import { OnboardingNav } from "@/components/onboarding/onboarding-nav";

const CATEGORIES = [
  { id: "amazon-brands",        label: "Amazon Brands",           Icon: ShoppingBag },
  { id: "automotive",           label: "Automotive",              Icon: Car },
  { id: "baby",                 label: "Baby",                    Icon: Baby },
  { id: "back-to-school",       label: "Back to School",          Icon: GraduationCap },
  { id: "beauty",               label: "Beauty",                  Icon: Sparkles },
  { id: "books",                label: "Books",                   Icon: BookOpen },
  { id: "camera-photo",         label: "Camera & Photo",          Icon: Camera },
  { id: "cell-phones",          label: "Cell Phones",             Icon: Smartphone },
  { id: "computers",            label: "Computers",               Icon: Laptop },
  { id: "everyday-essentials",  label: "Everyday Essentials",     Icon: Package },
  { id: "electronics",          label: "Electronics",             Icon: Zap },
  { id: "fitness",              label: "Fitness",                 Icon: Dumbbell },
  { id: "games",                label: "Games",                   Icon: Gamepad2 },
  { id: "home-garden",          label: "Home & Garden",           Icon: Home },
  { id: "sports",               label: "Sports & Outdoors",       Icon: Trophy },
  { id: "tools",                label: "Tools & Hardware",        Icon: Wrench },
] as const;

type CategoryId = (typeof CATEGORIES)[number]["id"];

// Most popular categories pre-selected when user taps "Select Popular"
const POPULAR_IDS: CategoryId[] = [
  "electronics", "cell-phones", "home-garden", "beauty", "fitness", "games",
];

export default function OnboardingCategoriesPage() {
  const router = useRouter();
  const [selected, setSelected] = useState<CategoryId[]>([]);
  const [query, setQuery]       = useState("");
  const [isPending, setIsPending] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? CATEGORIES.filter((c) => c.label.toLowerCase().includes(q)) : CATEGORIES;
  }, [query]);

  function toggle(id: CategoryId) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id],
    );
  }

  function selectAll() {
    setSelected(CATEGORIES.map((c) => c.id));
  }

  function selectPopular() {
    setSelected(POPULAR_IDS);
  }

  async function handleNext() {
    setIsPending(true);
    router.push("/onboarding/deal-types");
  }

  function handleSkip() {
    router.push("/onboarding/deal-types");
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Progress — Step 1 of 3 */}
      <ProgressIndicator currentStep={1} totalSteps={3} />

      {/* Heading */}
      <div className="flex flex-col gap-1.5 text-center">
        <h1
          className="text-[26px] font-bold leading-tight"
          style={{ fontFamily: "var(--font-lato)", color: "#000A1E" }}
        >
          Choose What You&apos;re Interested In
        </h1>
        <p
          className="text-sm leading-relaxed text-body"
          style={{ fontFamily: "var(--font-lato)" }}
        >
          We&apos;ll personalize deals based on your interests
        </p>
      </div>

      {/* Select Popular Categories */}
      <div className="flex justify-center">
        <button
          type="button"
          onClick={selectPopular}
          className="flex items-center gap-2 px-5 py-2 rounded-full text-white text-sm font-semibold leading-tight"
          style={{ fontFamily: "var(--font-lato)", background: "#FE9800" }}
        >
          <Sparkles className="w-3.5 h-3.5" />
          Select Popular Categories
        </button>
      </div>

      {/* Search + Select All */}
      <div className="flex items-center gap-3">
        <div className="flex-1 flex items-center gap-2 px-4 py-2.5 rounded-[8px] border border-input-border bg-white">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search categories..."
            className="flex-1 text-sm leading-6 outline-none bg-transparent placeholder:text-black/40"
            style={{ fontFamily: "var(--font-inter)", letterSpacing: "-0.01em" }}
          />
          <Search className="w-4 h-4 shrink-0 text-body" />
        </div>
        <button
          type="button"
          onClick={selectAll}
          className="shrink-0 text-sm font-semibold text-navy-btn whitespace-nowrap"
          style={{ fontFamily: "var(--font-lato)" }}
        >
          Select All
        </button>
      </div>

      {/* Category grid — 3 cols mobile, 4 cols sm+ */}
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
        {filtered.map(({ id, label, Icon }) => (
          <CategoryCard
            key={id}
            label={label}
            Icon={Icon}
            selected={selected.includes(id)}
            onToggle={() => toggle(id)}
          />
        ))}
      </div>

      {/* Footer — Continue + Skip */}
      <OnboardingNav
        onNext={handleNext}
        onSkip={handleSkip}
        nextLabel="Continue"
        isPending={isPending}
      />
    </div>
  );
}
