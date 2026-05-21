"use client";

import { useState, useCallback } from "react";

interface DataPoint {
  label: string;
  users: number;
  watchlists: number;
}

interface Props {
  initialData: DataPoint[];
}

function polyline(data: number[], W: number, H: number) {
  if (!data.length) return "";
  const max = Math.max(...data, 1) * 1.1;
  return data
    .map((v, i) => {
      const x = data.length === 1 ? W / 2 : (i / (data.length - 1)) * W;
      const y = H - (v / max) * H;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
}

export function EngagementChart({ initialData }: Props) {
  const [range, setRange] = useState("monthly");
  const [data, setData] = useState<DataPoint[]>(initialData);
  const [loading, setLoading] = useState(false);

  const changeRange = useCallback(async (newRange: string) => {
    setRange(newRange);
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/stats?section=chart&range=${newRange}`);
      const json = await res.json();
      if (json.data?.chart) setData(json.data.chart);
    } finally {
      setLoading(false);
    }
  }, []);

  const W = 520;
  const H = 140;
  const users = data.map((d) => d.users);
  const watchlists = data.map((d) => d.watchlists);
  const peakIdx = users.indexOf(Math.max(...users, 0));
  const peakVal = users[peakIdx] ?? 0;
  const max = Math.max(...users, ...watchlists, 1) * 1.1;
  const px = data.length <= 1 ? W / 2 : (peakIdx / (data.length - 1)) * W;
  const py = H - (peakVal / max) * H;

  return (
    <div className="bg-white rounded-xl border border-[#E7E8E9] p-5 space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-sm font-bold text-navy">User Engagement Overview</h2>
        <div className="flex items-center gap-5">
          <div className="flex items-center gap-4 text-[11px] text-body">
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-3 h-0.5 bg-best-price rounded" /> Active users
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-3 h-0 border-t-2 border-dashed border-badge-bg" /> Watchlist items
            </span>
          </div>
          <select
            value={range}
            onChange={(e) => changeRange(e.target.value)}
            disabled={loading}
            className="text-xs border border-[#E7E8E9] rounded-lg px-2 py-1 text-navy bg-white focus:border-navy outline-none disabled:opacity-50"
          >
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
        </div>
      </div>

      <div className={`overflow-x-auto transition-opacity ${loading ? "opacity-40" : ""}`}>
        <svg viewBox={`0 0 ${W} ${H + 28}`} className="w-full min-w-72" style={{ height: 170 }}>
          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((t, i) => (
            <line
              key={i}
              x1={0}
              y1={(H * (1 - t)).toFixed(1)}
              x2={W}
              y2={(H * (1 - t)).toFixed(1)}
              stroke="#E7E8E9"
              strokeWidth="1"
            />
          ))}

          {/* User line */}
          <polyline
            points={polyline(users, W, H)}
            fill="none"
            stroke="#22A45D"
            strokeWidth="2.5"
            strokeLinejoin="round"
            strokeLinecap="round"
          />

          {/* Watchlist line */}
          <polyline
            points={polyline(watchlists, W, H)}
            fill="none"
            stroke="#FE9800"
            strokeWidth="2"
            strokeLinejoin="round"
            strokeLinecap="round"
            strokeDasharray="6 3"
          />

          {/* Peak indicator */}
          {peakVal > 0 && (
            <>
              <circle cx={px} cy={py} r={5} fill="#22A45D" />
              <rect x={px - 52} y={py - 36} width={104} height={24} rx={5} fill="#22A45D" />
              <text x={px} y={py - 19} textAnchor="middle" fill="white" fontSize={11} fontWeight="600">
                Active: {peakVal}
              </text>
            </>
          )}

          {/* X-axis labels */}
          {data.map((d, i) => (
            <text
              key={d.label}
              x={(data.length <= 1 ? W / 2 : (i / (data.length - 1)) * W).toFixed(1)}
              y={H + 20}
              textAnchor="middle"
              fill="#9AA0AB"
              fontSize={10}
            >
              {d.label}
            </text>
          ))}
        </svg>
      </div>
    </div>
  );
}
