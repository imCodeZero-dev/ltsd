"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { X, PlusCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DealItem } from "@/lib/deal-api/types";

interface WatchlistModalProps {
  deal: Pick<DealItem, "id" | "title" | "imageUrl" | "currentPrice">;
  open: boolean;
  onClose: () => void;
  onConfirm: (payload: {
    dealId: string;
    targetPrice: number;
    minDiscount: number;
    priceAlert: boolean;
    discountAlert: boolean;
  }) => void;
}

function formatUSD(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

const DISCOUNT_OPTIONS = [
  { label: "None", value: 0 },
  { label: "10%",  value: 10 },
  { label: "20%",  value: 20 },
  { label: "30%+", value: 30 },
];

export function WatchlistModal({ deal, open, onClose, onConfirm }: WatchlistModalProps) {
  const currentDollars = deal.currentPrice / 100;
  const [targetInput, setTargetInput] = useState(String(Math.floor(currentDollars * 0.85)));
  const [minDiscount, setMinDiscount] = useState(20);
  const [priceAlert, setPriceAlert] = useState(true);
  const [discountAlert, setDiscountAlert] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when modal opens
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 80);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  // Lock body scroll when open
  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  if (!open) return null;

  const targetCents = Math.round(parseFloat(targetInput || "0") * 100);
  const dropPct = targetCents > 0 && targetCents < deal.currentPrice
    ? Math.round(((deal.currentPrice - targetCents) / deal.currentPrice) * 100)
    : null;

  function handleConfirm() {
    onConfirm({
      dealId:        deal.id,
      targetPrice:   targetCents,
      minDiscount,
      priceAlert,
      discountAlert,
    });
    onClose();
  }

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.45)" }}
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Modal panel */}
      <div className="relative w-full max-w-sm bg-surface rounded-2xl shadow-2xl overflow-hidden font-inter">
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 w-7 h-7 flex items-center justify-center rounded-full text-body hover:text-navy hover:bg-surface-hover transition-colors z-10"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="px-6 pt-6 pb-7 space-y-5">

          {/* Heading */}
          <div>
            <h2 className="text-lg font-extrabold text-navy font-lato">
              Add to Watchlist
            </h2>
            <p className="text-xs text-body mt-0.5">
              We'll monitor the price and notify you of any drops.
            </p>
          </div>

          {/* Product row */}
          <div className="flex items-center gap-3 bg-surface-hover rounded-xl px-3 py-2.5">
            <div className="w-10 h-10 shrink-0 relative rounded-lg overflow-hidden bg-surface border border-border">
              <Image src={deal.imageUrl} alt={deal.title} fill sizes="40px" className="object-contain p-1" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-navy line-clamp-1 font-lato">
                {deal.title}
              </p>
              <p className="text-2xs font-bold uppercase tracking-widest text-body mt-0.5">
                {formatUSD(deal.currentPrice)}
                <span className="ml-1.5 text-border-mid">CURRENT PRICE</span>
              </p>
            </div>
          </div>

          {/* Target price input */}
          <div className="space-y-1.5">
            <label className="text-2xs font-bold uppercase tracking-widest text-body">
              Target Price (USD)
            </label>
            <div className="flex items-center border-2 rounded-xl px-3 py-2.5 transition-colors focus-within:border-badge-bg border-border">
              <span className="text-sm font-semibold text-body mr-2">$</span>
              <input
                ref={inputRef}
                type="number"
                min={1}
                max={currentDollars}
                value={targetInput}
                onChange={(e) => setTargetInput(e.target.value)}
                className="flex-1 text-sm font-bold text-navy bg-transparent outline-none w-full"
                placeholder="0"
              />
            </div>
            {dropPct !== null && (
              <p className="text-xs font-semibold text-hot">
                🔥 You're aiming for a {dropPct}% drop
              </p>
            )}
            {targetCents >= deal.currentPrice && targetInput !== "" && (
              <p className="text-xs font-semibold text-body">
                Target must be below current price
              </p>
            )}
          </div>

          {/* Minimum discount */}
          <div className="space-y-2">
            <p className="text-2xs font-bold uppercase tracking-widest text-body">
              Minimum Discount
            </p>
            <div className="flex gap-2">
              {DISCOUNT_OPTIONS.map((opt) => {
                const active = minDiscount === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setMinDiscount(opt.value)}
                    className={cn(
                      "flex-1 py-2 rounded-lg border-2 text-xs font-bold font-lato transition-all bg-surface",
                      active
                        ? "border-badge-bg text-badge-bg"
                        : "border-border text-body"
                    )}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Toggles */}
          <div className="space-y-4">
            <Toggle
              checked={priceAlert}
              onChange={setPriceAlert}
              label="Price alert"
              sub="Notify me when price drops below my target"
            />
            <Toggle
              checked={discountAlert}
              onChange={setDiscountAlert}
              label="Discount alert"
              sub="Notify me when selected discount is available"
            />
          </div>

          {/* CTA */}
          <button
            type="button"
            onClick={handleConfirm}
            className="w-full flex items-center justify-center gap-2 h-12 rounded-xl font-bold text-sm text-surface bg-navy font-lato transition-opacity hover:opacity-90"
          >
            <PlusCircle className="w-4 h-4" />
            Add to Watchlist
          </button>

          <p className="text-center text-2xs text-body -mt-2">
            You'll receive push and email notifications.
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Toggle switch ─────────────────────────────────────────────────────────────
function Toggle({
  checked,
  onChange,
  label,
  sub,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  sub: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-sm font-semibold text-navy font-lato">{label}</p>
        <p className="text-xs text-body mt-0.5">{sub}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className="shrink-0 w-11 h-6 rounded-full relative transition-colors"
        style={{ background: checked ? "var(--color-badge-bg)" : "var(--color-border-mid)" }}
      >
        <span
          className="absolute top-0.5 w-5 h-5 rounded-full bg-surface shadow transition-all"
          style={{ left: checked ? "calc(100% - 22px)" : "2px" }}
        />
      </button>
    </div>
  );
}
