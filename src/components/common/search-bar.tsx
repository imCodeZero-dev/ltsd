"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDebounce } from "@/hooks/use-debounce";

interface SearchBarProps {
  placeholder?: string;
  className?: string;
}

export function SearchBar({ placeholder = "Search deals…", className }: SearchBarProps) {
  const router = useRouter();
  const [value, setValue] = useState("");
  const debounced = useDebounce(value, 400);

  // Navigate to deals page with search query when debounced value changes
  // (real implementation will be wired when API is ready)
  void debounced; // suppress unused warning until API is wired

  function handleClear() {
    setValue("");
    router.push("/deals");
  }

  return (
    <div
      className={cn(
        "relative flex items-center",
        className
      )}
    >
      <Search
        className="absolute left-3.5 w-4 h-4 text-muted-foreground pointer-events-none"
        aria-hidden
      />
      <input
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        className={cn(
          "w-full h-11 pl-10 pr-10 rounded-xl border border-border bg-surface",
          "text-sm text-carbon placeholder:text-muted-foreground",
          "focus:outline-none focus:ring-2 focus:ring-crimson focus:border-crimson",
          "transition-colors"
        )}
      />
      {value && (
        <button
          type="button"
          onClick={handleClear}
          aria-label="Clear search"
          className="absolute right-3.5 text-muted-foreground hover:text-carbon transition-colors"
        >
          <X className="w-4 h-4" aria-hidden />
        </button>
      )}
    </div>
  );
}
