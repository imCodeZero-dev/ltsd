"use client";

import { useState } from "react";
import { Mail, Bell, Volume2 } from "lucide-react";
import { cn } from "@/lib/utils";

// ── Toggle ────────────────────────────────────────────────────────────────────
function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={() => onChange(!on)}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors",
        on ? "bg-navy" : "bg-[#E7E8E9]",
      )}
    >
      <span
        className={cn(
          "pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform",
          on ? "translate-x-5" : "translate-x-0",
        )}
      />
    </button>
  );
}

// ── Section wrapper ───────────────────────────────────────────────────────────
function Section({ label, description, children }: { label: string; description: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-10 py-2">
      <div className="w-48 shrink-0 hidden md:block">
        <p className="text-sm font-semibold text-navy">{label}</p>
        <p className="text-xs text-body mt-1 leading-relaxed">{description}</p>
      </div>
      <div className="flex-1 min-w-0 border border-[#E7E8E9] rounded-xl bg-white divide-y divide-[#E7E8E9]">
        <div className="md:hidden px-6 py-3">
          <p className="text-sm font-semibold text-navy">{label}</p>
          <p className="text-xs text-body mt-0.5">{description}</p>
        </div>
        {children}
      </div>
    </div>
  );
}

const CATEGORIES = ["Electronics", "Fashion", "Beauty", "Home", "Fitness", "Books", "Gaming", "Automotive"];

export default function NotificationsSettingsPage() {
  const [emailAlerts, setEmailAlerts]             = useState(true);
  const [pushAlerts, setPushAlerts]               = useState(true);
  const [frequency, setFrequency]                 = useState<"instant" | "digest">("instant");
  const [maxPerDay, setMaxPerDay]                 = useState("5");
  const [minDiscount, setMinDiscount]             = useState("20%");
  const [selCategories, setSelCategories]         = useState(["Electronics", "Fashion", "Beauty", "Home", "Fitness"]);
  const [limitToCategories, setLimitToCategories] = useState(true);
  const [quietHours, setQuietHours]               = useState(true);
  const [quietDays, setQuietDays]                 = useState("Weekdays");
  const [quietFrom, setQuietFrom]                 = useState("8:00");
  const [quietTo, setQuietTo]                     = useState("22:00");
  const [showMoreCats, setShowMoreCats]           = useState(false);

  function toggleCategory(cat: string) {
    setSelCategories(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  }

  const visibleCats = showMoreCats ? CATEGORIES : CATEGORIES.slice(0, 5);

  return (
    <div className="px-6 md:px-10 py-8 max-w-4xl space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-extrabold text-navy">Notifications Settings</h1>
          <p className="text-sm text-body mt-1">Manage how and when you receive deal alerts</p>
        </div>
        <button
          type="button"
          className="shrink-0 px-5 py-2.5 rounded-xl bg-navy text-white text-sm font-bold hover:opacity-90 transition-opacity"
        >
          Save Preferences
        </button>
      </div>

      {/* Channels */}
      <Section label="Channels" description="Choose how you want to receive deal alerts">
        <div className="px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#F5F6F7] flex items-center justify-center">
              <Mail className="w-4 h-4 text-navy" />
            </div>
            <div>
              <p className="text-sm font-semibold text-navy">Email Alerts</p>
              <p className="text-xs text-body">Receive personalized deal alerts in your inbox</p>
            </div>
          </div>
          <Toggle on={emailAlerts} onChange={setEmailAlerts} />
        </div>
        <div className="px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#F5F6F7] flex items-center justify-center">
              <Bell className="w-4 h-4 text-navy" />
            </div>
            <div>
              <p className="text-sm font-semibold text-navy">Push Notification</p>
              <p className="text-xs text-body">Receive personalized deal alerts in your inbox</p>
            </div>
          </div>
          <Toggle on={pushAlerts} onChange={setPushAlerts} />
        </div>
      </Section>

      {/* Alert Frequency */}
      <Section label="Alert Frequency" description="Choose how often you want to receive alerts">
        <div className="px-6 py-5 flex gap-6 flex-wrap">
          {(["instant", "digest"] as const).map(opt => (
            <label key={opt} className="flex items-start gap-3 cursor-pointer">
              <button
                type="button"
                onClick={() => setFrequency(opt)}
                className={cn(
                  "mt-0.5 w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors",
                  frequency === opt ? "border-navy" : "border-[#CBCBCB]",
                )}
              >
                {frequency === opt && <div className="w-2 h-2 rounded-full bg-navy" />}
              </button>
              <div>
                <p className="text-sm font-semibold text-navy">
                  {opt === "instant" ? "Instant (recommended)" : "Daily Digest"}
                </p>
                <p className="text-xs text-body">
                  {opt === "instant" ? "Get notified as soon as a deal matches" : "Receive a summary once per day"}
                </p>
              </div>
            </label>
          ))}
        </div>

        <div className="px-6 py-4 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-navy">Max alerts per day</p>
            <p className="text-xs text-body">Limit how many alerts you receive each day</p>
          </div>
          <select
            value={maxPerDay}
            onChange={e => setMaxPerDay(e.target.value)}
            className="text-sm border border-[#E7E8E9] rounded-lg px-3 py-1.5 text-navy bg-white focus:border-navy outline-none"
          >
            {["3","5","10","20","Unlimited"].map(v => <option key={v} value={v}>{v}</option>)}
          </select>
        </div>

        <div className="px-6 py-4 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-navy">Minimum Discount For Alerts</p>
            <p className="text-xs text-body">Only notify for deals above your selected discount</p>
          </div>
          <select
            value={minDiscount}
            onChange={e => setMinDiscount(e.target.value)}
            className="text-sm border border-[#E7E8E9] rounded-lg px-3 py-1.5 text-navy bg-white focus:border-navy outline-none"
          >
            {["5%","10%","15%","20%","25%","30%","40%","50%"].map(v => <option key={v} value={v}>{v}</option>)}
          </select>
        </div>
      </Section>

      {/* Category Alerts */}
      <Section label="Category Alerts" description="Select categories you want to receive alerts for">
        <div className="px-6 py-5 space-y-4">
          <div className="flex flex-wrap gap-2">
            {visibleCats.map(cat => (
              <button
                key={cat}
                type="button"
                onClick={() => toggleCategory(cat)}
                className={cn(
                  "px-4 py-1.5 rounded-lg text-sm font-semibold border transition-colors",
                  selCategories.includes(cat)
                    ? "border-navy bg-white text-navy"
                    : "border-[#E7E8E9] text-body hover:border-navy hover:text-navy bg-white",
                )}
              >
                {cat}
              </button>
            ))}
            {!showMoreCats && (
              <button
                type="button"
                onClick={() => setShowMoreCats(true)}
                className="px-4 py-1.5 rounded-lg text-sm font-semibold border border-[#E7E8E9] text-body hover:border-navy hover:text-navy bg-white transition-colors"
              >
                + Show More
              </button>
            )}
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-[#E7E8E9]">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-body" />
              <p className="text-sm font-medium text-navy">Limit alerts to selected categories only</p>
            </div>
            <Toggle on={limitToCategories} onChange={setLimitToCategories} />
          </div>
        </div>
      </Section>

      {/* Quiet Hours */}
      <Section label="Quiet Hours" description="Pause notifications during your preferred hours">
        <div className="px-6 py-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-body" />
              <div>
                <p className="text-sm font-semibold text-navy">Enable Quiet Hours</p>
                <p className="text-xs text-body">You won&apos;t receive notifications during this time</p>
              </div>
            </div>
            <Toggle on={quietHours} onChange={setQuietHours} />
          </div>

          {quietHours && (
            <div className="flex items-center gap-3 flex-wrap pl-6">
              <select value={quietDays} onChange={e => setQuietDays(e.target.value)}
                className="text-sm border border-[#E7E8E9] rounded-lg px-3 py-1.5 text-navy bg-white focus:border-navy outline-none">
                {["Weekdays","Weekends","Every day"].map(v => <option key={v}>{v}</option>)}
              </select>
              <span className="text-sm text-body">From</span>
              <select value={quietFrom} onChange={e => setQuietFrom(e.target.value)}
                className="text-sm border border-[#E7E8E9] rounded-lg px-3 py-1.5 text-navy bg-white focus:border-navy outline-none">
                {Array.from({ length: 24 }, (_, i) => `${i}:00`).map(v => <option key={v}>{v}</option>)}
              </select>
              <span className="text-sm text-body">to</span>
              <select value={quietTo} onChange={e => setQuietTo(e.target.value)}
                className="text-sm border border-[#E7E8E9] rounded-lg px-3 py-1.5 text-navy bg-white focus:border-navy outline-none">
                {Array.from({ length: 24 }, (_, i) => `${i}:00`).map(v => <option key={v}>{v}</option>)}
              </select>
            </div>
          )}
          {quietHours && (
            <p className="text-xs text-body pl-6">We won&apos;t send notifications during this time</p>
          )}
        </div>
      </Section>
    </div>
  );
}
