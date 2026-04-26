"use client";

import { useRouter } from "next/navigation";
import { useRef } from "react";
import { Search } from "lucide-react";

export function SearchBar() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = inputRef.current?.value.trim();
    if (q) router.push(`/deals?q=${encodeURIComponent(q)}`);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-125 hidden md:flex items-center gap-2 bg-[#F5F6F7] rounded-full px-4 py-2.5 border border-[#E7E8E9] focus-within:border-badge-bg transition-colors"
    >
      <Search className="w-4 h-4 text-[#74777F] shrink-0" aria-hidden />
      <input
        ref={inputRef}
        type="search"
        placeholder="What are you looking for?"
        className="flex-1 bg-transparent text-sm text-carbon placeholder:text-[#74777F] outline-none"
      />
    </form>
  );
}

export function MobileSearchBar() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = inputRef.current?.value.trim();
    if (q) router.push(`/deals?q=${encodeURIComponent(q)}`);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="md:hidden flex items-center gap-2 bg-[#F5F6F7] rounded-full px-4 py-2.5 border border-[#E7E8E9] mx-4 mt-2 mb-1"
    >
      <input
        ref={inputRef}
        type="search"
        placeholder="Search categories..."
        className="flex-1 bg-transparent text-sm text-carbon placeholder:text-[#74777F] outline-none"
      />
      <button type="submit" aria-label="Search">
        <Search className="w-4 h-4 text-[#74777F]" aria-hidden />
      </button>
    </form>
  );
}
