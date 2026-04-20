"use client";

import { cn } from "@/lib/utils";

interface PriceRangeFormProps {
  minDiscount: number;
  maxPrice: number | null;
  onMinDiscountChange: (val: number) => void;
  onMaxPriceChange: (val: number | null) => void;
}

export function PriceRangeForm({
  minDiscount,
  maxPrice,
  onMinDiscountChange,
  onMaxPriceChange,
}: PriceRangeFormProps) {
  return (
    <div className="space-y-8">
      {/* Min discount */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-semibold text-carbon">
            Minimum discount
          </label>
          <span className="text-xl font-bold text-crimson">{minDiscount}%</span>
        </div>
        <input
          type="range"
          min={0}
          max={90}
          step={5}
          value={minDiscount}
          onChange={(e) => onMinDiscountChange(Number(e.target.value))}
          className="w-full h-1.5 rounded-full appearance-none bg-border accent-crimson cursor-pointer"
          aria-label="Minimum discount percent"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>0%</span>
          <span>90%</span>
        </div>
      </div>

      {/* Max price */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label htmlFor="max-price" className="text-sm font-semibold text-carbon">
            Maximum price
          </label>
          <span className="text-xl font-bold text-navy">
            {maxPrice ? `$${maxPrice}` : "Any"}
          </span>
        </div>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
          <input
            id="max-price"
            type="number"
            min={0}
            step={10}
            value={maxPrice ?? ""}
            onChange={(e) =>
              onMaxPriceChange(e.target.value ? Number(e.target.value) : null)
            }
            placeholder="No limit"
            className={cn(
              "w-full h-11 pl-8 pr-4 rounded-xl border border-border bg-surface",
              "text-sm text-carbon placeholder:text-muted-foreground",
              "focus:outline-none focus:ring-2 focus:ring-crimson focus:border-crimson transition-colors"
            )}
          />
        </div>
        <p className="text-xs text-muted-foreground">
          Leave blank to see deals at any price.
        </p>
      </div>
    </div>
  );
}
