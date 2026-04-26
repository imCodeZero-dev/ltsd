"use client";

import { useState } from "react";
import { Search, ArrowUpDown, Eye, ChevronLeft, ChevronRight } from "lucide-react";
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

const AVATAR_COLORS = ["#E8F5E9","#E3F2FD","#FFF3E0","#FCE4EC","#EDE7F6","#F3E5F5"];
const AVATAR_TEXT   = ["#1B5E20","#0D47A1","#E65100","#880E4F","#4A148C","#6A1B9A"];

const USERS = [
  { id:"u1", name:"Ali Ahmed",      email:"aliahmed@gmail.com",  reg:"Oct 12, 2023", watchlist:42, alerts:8, active:true },
  { id:"u2", name:"Muhammad Saad",  email:"saad@gmail.com",      reg:"Nov 04, 2023", watchlist:42, alerts:8, active:false },
  { id:"u3", name:"Rehan Amjad",    email:"rehan@gmail.com",     reg:"Oct 12, 2023", watchlist:42, alerts:8, active:true },
  { id:"u4", name:"John Ali",       email:"john@gmail.com",      reg:"Nov 04, 2023", watchlist:42, alerts:8, active:false },
  { id:"u5", name:"Muhammad Saad",  email:"saad@gmail.com",      reg:"Oct 12, 2023", watchlist:42, alerts:8, active:true },
  { id:"u6", name:"Rehan Amjad",    email:"rehan@gmail.com",     reg:"Nov 04, 2023", watchlist:42, alerts:8, active:false },
  { id:"u7", name:"John Ali",       email:"john@gmail.com",      reg:"Oct 12, 2023", watchlist:42, alerts:8, active:true },
];

export default function AdminUsersPage() {
  const [users, setUsers]       = useState(USERS);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [query, setQuery]       = useState("");
  const [allChecked, setAllChecked] = useState(false);

  function toggleAll() {
    if (allChecked) { setSelected(new Set()); setAllChecked(false); }
    else { setSelected(new Set(users.map(u => u.id))); setAllChecked(true); }
  }

  function toggleStatus(id: string, v: boolean) {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, active: v } : u));
  }

  const filtered = query ? users.filter(u =>
    u.name.toLowerCase().includes(query.toLowerCase()) ||
    u.email.toLowerCase().includes(query.toLowerCase())
  ) : users;

  return (
    <div className="px-6 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-navy">User Management</h1>
        <p className="text-sm text-body mt-1">Manage users and control access</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Users"          value={56} sub="+1 this week" />
        <StatCard label="Active Users"         value={6}  sub="10 logged in today" subColor="text-best-price" />
        <StatCard label="Deactivated Users"    value={10} sub="2 deactivated this week" subColor="text-claimed" />
        <StatCard label="Avg Watchlists per User" value={4} sub="+2% from last month" subColor="text-best-price" />
      </div>

      <div className="bg-white rounded-xl border border-[#E7E8E9] overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center gap-3 p-4 border-b border-[#E7E8E9] flex-wrap">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-body" />
            <input type="text" value={query} onChange={e => setQuery(e.target.value)} placeholder="Search email"
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-[#E7E8E9] text-sm text-navy placeholder:text-body outline-none focus:border-navy" />
          </div>
          <button type="button" className="flex items-center gap-1 px-3 py-2 rounded-lg border border-[#E7E8E9] text-xs font-semibold text-navy hover:bg-bg transition-colors ml-auto">
            <ArrowUpDown className="w-3 h-3" /> Sort
          </button>
        </div>

        {/* Table header */}
        <div className="grid items-center gap-4 px-4 py-3 border-b border-[#E7E8E9] bg-[#F8F9FA]"
          style={{ gridTemplateColumns: "2rem 1fr 120px 80px 60px 120px 100px" }}>
          <input type="checkbox" checked={allChecked} onChange={toggleAll}
            className="w-4 h-4 rounded border-border-mid accent-navy cursor-pointer" />
          {["User details","Registration","Watchlist","Alerts","Status","Actions"].map(h => (
            <span key={h} className="text-[11px] font-bold uppercase tracking-wider text-body">{h}</span>
          ))}
        </div>

        {/* Rows */}
        <div className="divide-y divide-[#F0F1F2]">
          {filtered.map((user, idx) => {
            const initials = user.name.split(" ").map(w => w[0]).join("").slice(0,2).toUpperCase();
            const ci = idx % AVATAR_COLORS.length;
            return (
              <div key={user.id} className={cn("grid items-center gap-4 px-4 py-3 hover:bg-bg transition-colors",
                selected.has(user.id) && "bg-[#FFF8EE]")}
                style={{ gridTemplateColumns: "2rem 1fr 120px 80px 60px 120px 100px" }}>

                <input type="checkbox" checked={selected.has(user.id)}
                  onChange={() => setSelected(p => { const n = new Set(p); n.has(user.id) ? n.delete(user.id) : n.add(user.id); return n; })}
                  className="w-4 h-4 rounded border-border-mid accent-navy cursor-pointer" />

                {/* User info */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-sm font-bold"
                    style={{ background: AVATAR_COLORS[ci], color: AVATAR_TEXT[ci] }}>
                    {initials}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-navy truncate">{user.name}</p>
                    <p className="text-[10px] text-body truncate">{user.email}</p>
                  </div>
                </div>

                <span className="text-xs text-body">{user.reg}</span>
                <span className="text-xs font-semibold text-navy text-center">{user.watchlist}</span>
                <span className="text-xs font-semibold text-navy text-center">{user.alerts}</span>

                {/* Status */}
                <span className={cn("inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold w-fit",
                  user.active ? "bg-[#E8F5E9] text-[#1B5E20]" : "bg-[#F5F6F7] text-body")}>
                  {user.active ? "Active" : "Deactivated"}
                </span>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <Toggle on={user.active} onChange={v => toggleStatus(user.id, v)} />
                  <button type="button" className="text-body hover:text-navy transition-colors">
                    <Eye className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-[#E7E8E9]">
          <p className="text-xs text-body">Showing 8 of 25</p>
          <div className="flex items-center gap-1">
            <button type="button" className="p-1.5 rounded hover:bg-[#F5F6F7] text-body"><ChevronLeft className="w-4 h-4" /></button>
            {[1,2,3,4,"...",13,14].map((p,i) => (
              <button key={i} type="button" className={cn("w-7 h-7 rounded text-xs font-semibold", p === 1 ? "bg-navy text-white" : "text-body hover:bg-[#F5F6F7]")}>{p}</button>
            ))}
            <button type="button" className="p-1.5 rounded hover:bg-[#F5F6F7] text-body"><ChevronRight className="w-4 h-4" /></button>
          </div>
          <p className="text-xs text-body">Rows per page 7/12</p>
        </div>
      </div>
    </div>
  );
}
