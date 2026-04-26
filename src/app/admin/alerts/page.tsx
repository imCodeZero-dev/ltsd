"use client";

import { useState } from "react";
import { Search, ArrowUpDown, Mail, Smartphone, ChevronLeft, ChevronRight, Download } from "lucide-react";
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

const AVATAR_COLORS = ["#E8F5E9","#E3F2FD","#FFF3E0","#FCE4EC","#EDE7F6","#F3E5F5"];
const AVATAR_TEXT   = ["#1B5E20","#0D47A1","#E65100","#880E4F","#4A148C","#6A1B9A"];

const TRIGGER_COLORS: Record<string, string> = {
  "Price Drop":    "bg-[#E3F2FD] text-[#0D47A1]",
  "Custom Alert":  "bg-[#EDE7F6] text-[#4A148C]",
  "Back in stock": "bg-[#E8F5E9] text-[#1B5E20]",
};

const ALERTS = [
  { id:"a1", name:"Ali Ahmed",     email:"aliahmed@gmail.com",  product:"Sony WH-1000XM5 Hea…", from:"$759", to:"$699", trigger:"Price Drop",    channel:"Email", ts:"2 Apr, 10:32 AM" },
  { id:"a2", name:"Muhammad Saad", email:"saad@gmail.com",      product:"Sony WH-1000XM5 Hea…", from:"$759", to:"$699", trigger:"Custom Alert",  channel:"Push",  ts:"2 Apr, 10:32 AM" },
  { id:"a3", name:"Rehan Amjad",   email:"rehan@gmail.com",     product:"Sony WH-1000XM5 Hea…", from:"$759", to:"$699", trigger:"Back in stock", channel:"Email", ts:"2 Apr, 10:32 AM" },
  { id:"a4", name:"John Ali",      email:"john@gmail.com",      product:"Sony WH-1000XM5 Hea…", from:"$759", to:"$699", trigger:"Price Drop",    channel:"Push",  ts:"2 Apr, 10:32 AM" },
  { id:"a5", name:"Muhammad Saad", email:"saad@gmail.com",      product:"Sony WH-1000XM5 Hea…", from:"$759", to:"$699", trigger:"Price Drop",    channel:"Email", ts:"2 Apr, 10:32 AM" },
  { id:"a6", name:"Rehan Amjad",   email:"rehan@gmail.com",     product:"Sony WH-1000XM5 Hea…", from:"$759", to:"$699", trigger:"Custom Alert",  channel:"Push",  ts:"2 Apr, 10:32 AM" },
  { id:"a7", name:"John Ali",      email:"john@gmail.com",      product:"Sony WH-1000XM5 Hea…", from:"$759", to:"$699", trigger:"Back in stock", channel:"Email", ts:"2 Apr, 10:32 AM" },
];

export default function AdminAlertsPage() {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [query, setQuery]       = useState("");
  const [allChecked, setAllChecked] = useState(false);

  function toggleAll() {
    if (allChecked) { setSelected(new Set()); setAllChecked(false); }
    else { setSelected(new Set(ALERTS.map(a => a.id))); setAllChecked(true); }
  }

  const filtered = query
    ? ALERTS.filter(a => a.name.toLowerCase().includes(query.toLowerCase()) || a.email.toLowerCase().includes(query.toLowerCase()))
    : ALERTS;

  return (
    <div className="px-6 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-extrabold text-navy">Alert Logs</h1>
          <p className="text-sm text-body mt-1">Track triggered alerts across users and channels</p>
        </div>
        <button type="button" className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-navy text-white text-sm font-bold hover:opacity-90 transition-opacity">
          <Download className="w-3.5 h-3.5" /> Export CSV
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Alerts Triggered" value={56} sub="+1 this week" />
        <StatCard label="Email Alerts"           value={6}  sub="10 logged in today"      subColor="text-best-price" />
        <StatCard label="Push Alerts"            value={10} sub="2 deactivated this week"  subColor="text-claimed" />
        <StatCard label="Avg Price Drop %"       value={4}  sub="+2% from last month"      subColor="text-best-price" />
      </div>

      <div className="bg-white rounded-xl border border-[#E7E8E9] overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center gap-3 p-4 border-b border-[#E7E8E9] flex-wrap">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-body" />
            <input type="text" value={query} onChange={e => setQuery(e.target.value)} placeholder="Search by user/email"
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-[#E7E8E9] text-sm text-navy placeholder:text-body outline-none focus:border-navy" />
          </div>
          <div className="flex items-center gap-2 ml-auto flex-wrap">
            {["Date Range","Channel","Trigger"].map(f => (
              <button key={f} type="button" className="flex items-center gap-1 px-3 py-2 rounded-lg border border-[#E7E8E9] text-xs font-semibold text-navy hover:bg-bg transition-colors">
                {f} <ChevronRight className="w-3 h-3 rotate-90" />
              </button>
            ))}
            <button type="button" className="flex items-center gap-1 px-3 py-2 rounded-lg border border-[#E7E8E9] text-xs font-semibold text-navy hover:bg-bg transition-colors">
              <ArrowUpDown className="w-3 h-3" /> Sort
            </button>
          </div>
        </div>

        {/* Table header */}
        <div className="grid items-center gap-4 px-4 py-3 border-b border-[#E7E8E9] bg-bg"
          style={{ gridTemplateColumns: "2rem 1fr 1fr 120px 120px 80px 140px" }}>
          <input type="checkbox" checked={allChecked} onChange={toggleAll}
            className="w-4 h-4 rounded border-border-mid accent-navy cursor-pointer" />
          {["User","Linked Product","Price Change","Trigger Type","Channel","Timestamp"].map(h => (
            <span key={h} className="text-[11px] font-bold uppercase tracking-wider text-body">{h}</span>
          ))}
        </div>

        {/* Rows */}
        <div className="divide-y divide-[#F0F1F2]">
          {filtered.map((alert, idx) => {
            const initials = alert.name.split(" ").map(w => w[0]).join("").slice(0,2).toUpperCase();
            const ci = idx % AVATAR_COLORS.length;
            return (
              <div key={alert.id}
                className={cn("grid items-center gap-4 px-4 py-3 hover:bg-bg transition-colors", selected.has(alert.id) && "bg-[#FFF8EE]")}
                style={{ gridTemplateColumns: "2rem 1fr 1fr 120px 120px 80px 140px" }}>

                <input type="checkbox" checked={selected.has(alert.id)}
                  onChange={() => setSelected(p => { const n = new Set(p); n.has(alert.id) ? n.delete(alert.id) : n.add(alert.id); return n; })}
                  className="w-4 h-4 rounded border-border-mid accent-navy cursor-pointer" />

                {/* User */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-sm font-bold"
                    style={{ background: AVATAR_COLORS[ci], color: AVATAR_TEXT[ci] }}>
                    {initials}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-navy truncate">{alert.name}</p>
                    <p className="text-[10px] text-body truncate">{alert.email}</p>
                  </div>
                </div>

                {/* Product */}
                <span className="text-xs text-navy truncate">{alert.product}</span>

                {/* Price change */}
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-body line-through">{alert.from}</span>
                  <span className="text-body">→</span>
                  <span className="text-sm font-bold text-navy">{alert.to}</span>
                </div>

                {/* Trigger */}
                <span className={cn("inline-block px-2 py-0.5 rounded text-[10px] font-bold w-fit whitespace-nowrap", TRIGGER_COLORS[alert.trigger] ?? "bg-[#F5F6F7] text-body")}>
                  {alert.trigger}
                </span>

                {/* Channel */}
                <div className="flex items-center gap-1.5">
                  {alert.channel === "Email"
                    ? <Mail className="w-3.5 h-3.5 text-body shrink-0" />
                    : <Smartphone className="w-3.5 h-3.5 text-body shrink-0" />
                  }
                  <span className="text-xs text-body">{alert.channel}</span>
                </div>

                {/* Timestamp */}
                <span className="text-xs text-body whitespace-nowrap">{alert.ts}</span>
              </div>
            );
          })}
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-[#E7E8E9]">
          <p className="text-xs text-body">Showing 8 of 25</p>
          <div className="flex items-center gap-1">
            <button type="button" className="p-1.5 rounded hover:bg-bg text-body"><ChevronLeft className="w-4 h-4" /></button>
            {[1,2,3,4,"...",13,14].map((p,i) => (
              <button key={i} type="button" className={cn("w-7 h-7 rounded text-xs font-semibold", p === 1 ? "bg-navy text-white" : "text-body hover:bg-bg")}>{p}</button>
            ))}
            <button type="button" className="p-1.5 rounded hover:bg-bg text-body"><ChevronRight className="w-4 h-4" /></button>
          </div>
          <p className="text-xs text-body">Rows per page 7/12</p>
        </div>
      </div>
    </div>
  );
}
