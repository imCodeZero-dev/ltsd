"use client";

import { useState } from "react";
import { Search, ArrowUpDown, Pencil, RefreshCw, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

function StatCard({ label, value, sub, subColor }: { label: string; value: string | number; sub: string; subColor?: string }) {
  return (
    <div className="bg-white rounded-xl border border-[#E7E8E9] px-5 py-4 flex flex-col gap-1">
      <p className="text-xs text-body">{label}</p>
      <p className="text-2xl font-extrabold text-navy">{value}</p>
      <p className={cn("text-xs font-semibold", subColor ?? "text-body")}>{sub}</p>
    </div>
  );
}

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button type="button" role="switch" aria-checked={on} onClick={() => onChange(!on)}
      className={cn("relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors", on ? "bg-navy" : "bg-[#E7E8E9]")}>
      <span className={cn("pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform", on ? "translate-x-4" : "translate-x-0")} />
    </button>
  );
}

const DEALS = Array.from({ length: 8 }, (_, i) => ({
  id: `d${i+1}`,
  image: "https://m.media-amazon.com/images/I/61SUj2aKoEL._AC_SL1500_.jpg",
  title: "Apple AirPods Pro (2nd Gen)",
  sku: "AAP-PRO-2 • Electronics",
  price: "$189.99",
  original: "$249.00",
  discount: i % 2 === 0 ? "15% Off" : "20% Off",
  status: i % 2 === 0 ? "Active" : "Expired",
  dealType: i % 2 === 0 ? "Lightening" : "Limited",
  featured: i % 2 === 0,
}));

const DEAL_TYPE_COLORS: Record<string, string> = {
  Lightening: "bg-[#FFF3E0] text-[#E65100]",
  Limited:    "bg-[#E8F5E9] text-[#1B5E20]",
};

export default function AdminDealsPage() {
  const [deals, setDeals]       = useState(DEALS);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [query, setQuery]       = useState("");
  const [allChecked, setAllChecked] = useState(false);

  function toggleAll() {
    if (allChecked) { setSelected(new Set()); setAllChecked(false); }
    else { setSelected(new Set(deals.map(d => d.id))); setAllChecked(true); }
  }

  function toggleRow(id: string) {
    setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }

  function toggleFeatured(id: string, v: boolean) {
    setDeals(prev => prev.map(d => d.id === id ? { ...d, featured: v } : d));
  }

  const filtered = query ? deals.filter(d => d.title.toLowerCase().includes(query.toLowerCase())) : deals;

  return (
    <div className="px-6 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-extrabold text-navy">Deals Management</h1>
          <p className="text-sm text-body mt-1">Manage and audit the real-time deal feed across all platforms.</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[11px] text-body">LAST SYNCED<br /><span className="font-semibold text-navy">2 minutes ago</span></span>
          <button type="button" className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-navy text-white text-sm font-bold hover:opacity-90 transition-opacity">
            <RefreshCw className="w-3.5 h-3.5" /> Fetch New Deals
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Deals"    value="$ 1200" sub="3 currently in progress" />
        <StatCard label="Active Deals"   value={6}      sub="3 currently in progress" subColor="text-best-price" />
        <StatCard label="Expired Deals"  value={10}     sub="6 expiring within 30 days" subColor="text-claimed" />
        <StatCard label="Featured Deals" value={4}      sub="+2% from last month" subColor="text-best-price" />
      </div>

      {/* Toolbar */}
      <div className="bg-white rounded-xl border border-[#E7E8E9] overflow-hidden">
        <div className="flex items-center gap-3 p-4 border-b border-[#E7E8E9] flex-wrap">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-body" />
            <input type="text" value={query} onChange={e => setQuery(e.target.value)} placeholder="Search Deals"
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-[#E7E8E9] text-sm text-navy placeholder:text-body outline-none focus:border-navy" />
          </div>
          <div className="flex items-center gap-2 ml-auto flex-wrap">
            {["Category","Deal Type","Status"].map(f => (
              <button key={f} type="button" className="flex items-center gap-1 px-3 py-2 rounded-lg border border-[#E7E8E9] text-xs font-semibold text-navy hover:bg-[#F8F9FA] transition-colors">
                {f} <ChevronRight className="w-3 h-3 rotate-90" />
              </button>
            ))}
            <button type="button" className="flex items-center gap-1 px-3 py-2 rounded-lg border border-[#E7E8E9] text-xs font-semibold text-navy hover:bg-[#F8F9FA] transition-colors">
              <ArrowUpDown className="w-3 h-3" /> Sort
            </button>
          </div>
        </div>

        {/* Export row */}
        <div className="flex items-center px-4 py-2 border-b border-[#E7E8E9]">
          <button type="button" className="text-xs font-semibold text-navy border border-[#E7E8E9] rounded px-3 py-1 hover:bg-[#F8F9FA] transition-colors">
            Export
          </button>
        </div>

        {/* Table header */}
        <div className="grid items-center gap-4 px-4 py-3 border-b border-[#E7E8E9] bg-[#F8F9FA]"
          style={{ gridTemplateColumns: "2rem 1fr 120px 80px 80px 100px 80px 60px" }}>
          <input type="checkbox" checked={allChecked} onChange={toggleAll}
            className="w-4 h-4 rounded border-[#CBCBCB] accent-navy cursor-pointer" />
          <span className="text-[11px] font-bold uppercase tracking-wider text-body">Product Information</span>
          <span className="text-[11px] font-bold uppercase tracking-wider text-body">Pricing</span>
          <span className="text-[11px] font-bold uppercase tracking-wider text-body">Discount</span>
          <span className="text-[11px] font-bold uppercase tracking-wider text-body">Status</span>
          <span className="text-[11px] font-bold uppercase tracking-wider text-body">Deal Type</span>
          <span className="text-[11px] font-bold uppercase tracking-wider text-body">Featured</span>
          <span className="text-[11px] font-bold uppercase tracking-wider text-body">Actions</span>
        </div>

        {/* Rows */}
        <div className="divide-y divide-[#F0F1F2]">
          {filtered.map(deal => (
            <div key={deal.id} className={cn("grid items-center gap-4 px-4 py-3 transition-colors hover:bg-[#F8F9FA]",
              selected.has(deal.id) && "bg-[#FFF8EE]")}
              style={{ gridTemplateColumns: "2rem 1fr 120px 80px 80px 100px 80px 60px" }}>

              <input type="checkbox" checked={selected.has(deal.id)} onChange={() => toggleRow(deal.id)}
                className="w-4 h-4 rounded border-[#CBCBCB] accent-navy cursor-pointer" />

              {/* Product */}
              <div className="flex items-center gap-3 min-w-0">
                <img src={deal.image} alt={deal.title} className="w-10 h-10 rounded-lg object-contain bg-[#F8F9FA] border border-[#E7E8E9] shrink-0 p-0.5" />
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-navy truncate">{deal.title}</p>
                  <p className="text-[10px] text-body">SKU: {deal.sku}</p>
                </div>
              </div>

              {/* Pricing */}
              <div>
                <p className="text-sm font-bold text-navy">{deal.price}</p>
                <p className="text-[10px] text-body line-through">{deal.original}</p>
              </div>

              {/* Discount */}
              <span className="text-xs font-semibold text-body">{deal.discount}</span>

              {/* Status */}
              <span className={cn("inline-block px-2 py-0.5 rounded-full text-[10px] font-bold w-fit",
                deal.status === "Active" ? "bg-[#E8F5E9] text-[#1B5E20]" : "bg-[#FFF3E0] text-[#E65100]")}>
                {deal.status}
              </span>

              {/* Deal type */}
              <span className={cn("inline-block px-2 py-0.5 rounded text-[10px] font-bold w-fit", DEAL_TYPE_COLORS[deal.dealType])}>
                {deal.dealType}
              </span>

              {/* Featured toggle */}
              <Toggle on={deal.featured} onChange={v => toggleFeatured(deal.id, v)} />

              {/* Edit */}
              <button type="button" className="text-body hover:text-navy transition-colors">
                <Pencil className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-[#E7E8E9]">
          <p className="text-xs text-body">Showing 8 of 25</p>
          <div className="flex items-center gap-1">
            <button type="button" className="p-1.5 rounded hover:bg-[#F5F6F7] transition-colors text-body"><ChevronLeft className="w-4 h-4" /></button>
            {[1,2,3,4,"...",13,14].map((p,i) => (
              <button key={i} type="button" className={cn("w-7 h-7 rounded text-xs font-semibold transition-colors",
                p === 1 ? "bg-navy text-white" : "text-body hover:bg-[#F5F6F7]")}>
                {p}
              </button>
            ))}
            <button type="button" className="p-1.5 rounded hover:bg-[#F5F6F7] transition-colors text-body"><ChevronRight className="w-4 h-4" /></button>
          </div>
          <p className="text-xs text-body">Rows per page 7/12</p>
        </div>
      </div>
    </div>
  );
}
