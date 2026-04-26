"use client";

import { useState } from "react";
import { RefreshCw, Plus, Zap, Database, AlertTriangle, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

function StatCard({ label, value, sub, subColor }: { label: string; value: string | number; sub: string; subColor?: string }) {
  return (
    <div className="bg-white rounded-xl border border-[#E7E8E9] px-5 py-4 flex flex-col gap-1">
      <p className="text-xs text-body">{label}</p>
      <p className="text-2xl font-extrabold text-navy">{typeof value === "number" ? value.toLocaleString() : value}</p>
      <p className={cn("text-xs font-semibold", subColor ?? "text-best-price")}>{sub}</p>
    </div>
  );
}

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const ACTIVE   = [320,380,290,450,410,520,480,560,430,510,590,640];
const WATCHLIST = [180,220,170,280,260,340,300,390,270,350,420,460];

function polyline(data: number[], minY: number, maxY: number, W: number, H: number) {
  return data.map((v,i) => {
    const x = (i / (data.length - 1)) * W;
    const y = H - ((v - minY) / (maxY - minY)) * H;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");
}

function EngagementChart() {
  const W = 520; const H = 140;
  const all = [...ACTIVE, ...WATCHLIST];
  const minY = Math.min(...all) * 0.85;
  const maxY = Math.max(...all) * 1.05;
  const peakIdx = 11;
  const px = (peakIdx / (ACTIVE.length - 1)) * W;
  const py = H - ((ACTIVE[peakIdx] - minY) / (maxY - minY)) * H;

  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H + 28}`} className="w-full min-w-72" style={{ height: 170 }}>
        {[0,0.25,0.5,0.75,1].map((t,i) => (
          <line key={i} x1={0} y1={(H*(1-t)).toFixed(1)} x2={W} y2={(H*(1-t)).toFixed(1)} stroke="#E7E8E9" strokeWidth="1" />
        ))}
        <polyline points={polyline(ACTIVE, minY, maxY, W, H)} fill="none" stroke="#22A45D" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
        <polyline points={polyline(WATCHLIST, minY, maxY, W, H)} fill="none" stroke="#FE9800" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" strokeDasharray="6 3" />
        <circle cx={px} cy={py} r={5} fill="#22A45D" />
        <rect x={px - 52} y={py - 36} width={104} height={24} rx={5} fill="#22A45D" />
        <text x={px} y={py - 19} textAnchor="middle" fill="white" fontSize={11} fontWeight="600">Active: {ACTIVE[peakIdx]}</text>
        {MONTHS.map((m,i) => (
          <text key={m} x={((i/(MONTHS.length-1))*W).toFixed(1)} y={H+20} textAnchor="middle" fill="#9AA0AB" fontSize={10}>{m}</text>
        ))}
      </svg>
    </div>
  );
}

const ACTIVITY = [
  { icon: AlertTriangle, color: "#FE9800", text: "High alert volume detected — 320 alerts sent in the last hour.", time: "2 min ago" },
  { icon: RefreshCw,     color: "#22A45D", text: "120 new deals were fetched from Amazon (97% success rate).",    time: "12 min ago" },
  { icon: Zap,           color: "#22A45D", text: '45 users were notified for "AirPods Pro" after it dropped below target price.', time: "18 min ago" },
  { icon: Database,      color: "#22A45D", text: "A new match was found for Sony WH-1000XM5 at the lowest price on Best Buy.", time: "20 min ago" },
  { icon: AlertTriangle, color: "#FF4444", text: "Failed to fetch deals from eBay API. [Retry] [View Log]", time: "22 min ago" },
];

const QUICK_ACTIONS = [
  { icon: RefreshCw, label: "Fetch New Deals" },
  { icon: Plus,      label: "Clear Cache" },
  { icon: Zap,       label: "Run Alert Engine" },
  { icon: Database,  label: "Sync Data Sources" },
];

export default function AdminDashboardPage() {
  const [range, setRange] = useState("Monthly");

  return (
    <div className="px-6 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-navy">Admin Dashboard</h1>
        <p className="text-sm text-body mt-1">Manage and audit the real-time deal feed across all platforms.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Users"       value={1248}  sub="+12 today" />
        <StatCard label="Active Watchlists" value={342}   sub="+8 today" />
        <StatCard label="Deals in Database" value={5672}  sub="+20 added" />
        <StatCard label="Alerts Sent Today" value={1982}  sub="% high activity" subColor="text-hot" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl border border-[#E7E8E9] p-5 space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <h2 className="text-sm font-bold text-navy">User Engagement Overview</h2>
            <div className="flex items-center gap-5">
              <div className="flex items-center gap-4 text-[11px] text-body">
                <span className="flex items-center gap-1.5"><span className="inline-block w-3 h-0.5 bg-best-price rounded" /> Active users</span>
                <span className="flex items-center gap-1.5"><span className="inline-block w-3 h-0 border-t-2 border-dashed border-badge-bg" /> Watchlist items</span>
              </div>
              <select value={range} onChange={e => setRange(e.target.value)}
                className="text-xs border border-[#E7E8E9] rounded-lg px-2 py-1 text-navy bg-white focus:border-navy outline-none">
                {["Weekly","Monthly","Yearly"].map(v => <option key={v}>{v}</option>)}
              </select>
            </div>
          </div>
          <EngagementChart />
        </div>

        <div className="bg-white rounded-xl border border-[#E7E8E9] p-5 space-y-2">
          <h2 className="text-sm font-bold text-navy mb-3">Quick Actions</h2>
          {QUICK_ACTIONS.map(({ icon: Icon, label }) => (
            <button key={label} type="button"
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border border-[#E7E8E9] text-sm font-medium text-navy hover:bg-[#F8F9FA] hover:border-navy transition-colors text-left">
              <Icon className="w-4 h-4 text-body shrink-0" /> {label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl border border-[#E7E8E9] p-5 space-y-3">
          <h2 className="text-sm font-bold text-navy">Activity Feed</h2>
          {ACTIVITY.map(({ icon: Icon, color, text, time }, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${color}18` }}>
                <Icon className="w-4 h-4" style={{ color }} />
              </div>
              <p className="flex-1 text-xs text-navy leading-snug">{text}</p>
              <span className="text-[10px] text-body whitespace-nowrap shrink-0">{time}</span>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-xl border border-[#E7E8E9] p-5 space-y-3">
          <h2 className="text-sm font-bold text-navy">System Insights</h2>
          {["63% active users in last 7 days","5,832 products being tracked","5,982 alerts sent today"].map((t,i) => (
            <div key={i} className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-badge-bg shrink-0" />
              <span className="text-xs text-body">{t}</span>
            </div>
          ))}
          <div className="pt-3 border-t border-[#E7E8E9] space-y-2">
            <p className="text-xs font-semibold text-navy">Optimize your system performance</p>
            <p className="text-[11px] text-body leading-relaxed">Run deal fetch or re-trigger alerts to ensure users get the latest updates.</p>
            <button type="button" className="flex items-center gap-2 px-4 py-2 rounded-lg bg-navy text-white text-xs font-bold hover:opacity-90 transition-opacity">
              <RotateCcw className="w-3.5 h-3.5" /> Run System Check
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
