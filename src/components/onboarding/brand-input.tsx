"use client";

import { useState, useRef, KeyboardEvent } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface BrandInputProps {
  brands: string[];
  onChange: (brands: string[]) => void;
  maxBrands?: number;
}

export function BrandInput({ brands, onChange, maxBrands = 10 }: BrandInputProps) {
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  function addBrand(value: string) {
    const trimmed = value.trim();
    if (!trimmed || brands.includes(trimmed) || brands.length >= maxBrands) return;
    onChange([...brands, trimmed]);
    setInput("");
  }

  function removeBrand(brand: string) {
    onChange(brands.filter((b) => b !== brand));
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addBrand(input);
    }
    if (e.key === "Backspace" && !input && brands.length > 0) {
      onChange(brands.slice(0, -1));
    }
  }

  return (
    <div className="space-y-3">
      <div
        className={cn(
          "flex flex-wrap gap-2 min-h-[44px] p-2 rounded-xl border border-border bg-surface",
          "focus-within:ring-2 focus-within:ring-crimson focus-within:border-crimson cursor-text"
        )}
        onClick={() => inputRef.current?.focus()}
      >
        {brands.map((brand) => (
          <span
            key={brand}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-bg border border-border text-sm font-medium text-carbon"
          >
            {brand}
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); removeBrand(brand); }}
              aria-label={`Remove ${brand}`}
              className="text-muted-foreground hover:text-error transition-colors"
            >
              <X className="w-3.5 h-3.5" aria-hidden />
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => addBrand(input)}
          placeholder={brands.length === 0 ? "Apple, Sony, Nike…" : ""}
          className="flex-1 min-w-[120px] text-sm bg-transparent outline-none text-carbon placeholder:text-muted-foreground"
          disabled={brands.length >= maxBrands}
        />
      </div>
      <p className="text-xs text-muted-foreground">
        Press Enter or comma to add. {brands.length}/{maxBrands} brands.
      </p>
    </div>
  );
}
