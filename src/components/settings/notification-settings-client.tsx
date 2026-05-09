"use client";

import { useState, useTransition } from "react";
import { Mail, Bell, Volume2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { updateNotificationPreferences } from "@/actions/settings";
import { toast } from "sonner";

// ── Primitives ────────────────────────────────────────────────────────────────

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={() => onChange(!on)}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors",
        on ? "bg-badge-bg" : "bg-[#E7E8E9]",
      )}
    >
      <span className={cn(
        "pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform",
        on ? "translate-x-5" : "translate-x-0",
      )} />
    </button>
  );
}

function ChipGroup<T extends string>({
  options, value, onChange,
}: { options: readonly { label: string; value: T }[]; value: T; onChange: (v: T) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map(opt => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={cn(
            "px-4 py-1.5 rounded-lg text-sm font-semibold border transition-colors",
            value === opt.value
              ? "border-navy bg-white text-navy"
              : "border-[#E7E8E9] text-body hover:border-navy hover:text-navy bg-white",
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

// ── Desktop section wrapper ───────────────────────────────────────────────────

function DesktopSection({ label, description, children }: { label: string; description: string; children: React.ReactNode }) {
  return (
    <div className="py-6 border-b border-[#E7E8E9] last:border-b-0">
      <div className="mb-3">
        <p className="text-sm font-semibold text-navy">{label}</p>
        <p className="text-xs text-body mt-0.5">{description}</p>
      </div>
      <div className="border border-[#E7E8E9] rounded-xl bg-white divide-y divide-[#E7E8E9]">
        {children}
      </div>
    </div>
  );
}

function MobileSectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="px-4 pt-6 pb-2 text-[11px] font-bold uppercase tracking-widest text-body">
      {children}
    </p>
  );
}

// ── Constants ────────────────────────────────────────────────────────────────

const MAX_PER_DAY_OPTS = [
  { label: "1",         value: "1" },
  { label: "3",         value: "3" },
  { label: "5",         value: "5" },
  { label: "10",        value: "10" },
  { label: "Unlimited", value: "Unlimited" },
] as const;

const MIN_DISCOUNT_OPTS = [
  { label: "Any",  value: "0" },
  { label: "10%+", value: "10" },
  { label: "20%+", value: "20" },
  { label: "30%+", value: "30" },
] as const;

export interface NotificationPrefs {
  emailAlerts: boolean;
  pushAlerts: boolean;
  weeklyDigest: boolean;
  quietHoursEnabled: boolean;
  quietHoursStart: string | null;
  quietHoursEnd: string | null;
  alertThresholdPercent: number;
}

export function NotificationSettingsClient({ prefs }: { prefs: NotificationPrefs }) {
  const [emailAlerts,   setEmailAlerts]   = useState(prefs.emailAlerts);
  const [pushAlerts,    setPushAlerts]    = useState(prefs.pushAlerts);
  const [frequency,     setFrequency]     = useState<"instant" | "digest">(prefs.weeklyDigest ? "digest" : "instant");
  const [maxPerDay,     setMaxPerDay]     = useState("5");
  const [minDiscount,   setMinDiscount]   = useState(String(prefs.alertThresholdPercent));
  const [quietHours,    setQuietHours]    = useState(prefs.quietHoursEnabled);
  const [quietFrom,     setQuietFrom]     = useState(prefs.quietHoursStart ?? "8:00");
  const [quietTo,       setQuietTo]       = useState(prefs.quietHoursEnd   ?? "22:00");
  const [showMoreCats,  setShowMoreCats]  = useState(false);

  const [isPending, startTransition] = useTransition();

  const CATEGORIES = ["Electronics", "Fashion", "Beauty", "Home", "Fitness", "Books", "Gaming", "Automotive"];
  const [selCategories, setSelCategories] = useState(["Electronics", "Fashion", "Beauty", "Home", "Fitness"]);
  const [limitToCategories, setLimitToCategories] = useState(true);

  const visibleCats = showMoreCats ? CATEGORIES : CATEGORIES.slice(0, 6);

  function toggleCategory(cat: string) {
    setSelCategories(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat],
    );
  }

  function handleSave() {
    startTransition(async () => {
      const result = await updateNotificationPreferences({
        emailAlerts,
        pushAlerts,
        weeklyDigest: frequency === "digest",
        quietHoursEnabled: quietHours,
        quietHoursStart: quietHours ? quietFrom.padStart(5, "0") : undefined,
        quietHoursEnd:   quietHours ? quietTo.padStart(5, "0")   : undefined,
        alertThresholdPercent: parseInt(minDiscount) || 0,
        dealAlerts: true,
        priceDropAlerts: true,
      });
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Preferences saved!");
      }
    });
  }

  return (
    <>
      {/* ════════════════════════════════════════════════════════════════════
          DESKTOP VIEW
      ════════════════════════════════════════════════════════════════════ */}
      <div className="hidden md:block px-10 pt-2 bg-white">
        <div className="flex items-center justify-end pb-4 pt-4">
          <button
            type="button"
            onClick={handleSave}
            disabled={isPending}
            className="px-5 py-2.5 rounded-xl bg-navy text-white text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {isPending ? "Saving…" : "Save Preferences"}
          </button>
        </div>

        {/* Channels */}
        <DesktopSection label="Channels" description="Choose how you want to receive deal alerts">
          <div className="px-6 py-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-surface-hover flex items-center justify-center">
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
              <div className="w-9 h-9 rounded-lg bg-surface-hover flex items-center justify-center">
                <Bell className="w-4 h-4 text-navy" />
              </div>
              <div>
                <p className="text-sm font-semibold text-navy">Push Notification</p>
                <p className="text-xs text-body">Receive deal alerts on your device</p>
              </div>
            </div>
            <Toggle on={pushAlerts} onChange={setPushAlerts} />
          </div>
        </DesktopSection>

        {/* Alert Frequency */}
        <DesktopSection label="Alert Frequency" description="Choose how often you want to receive alerts">
          <div className="px-6 py-5 flex gap-8 flex-wrap">
            {(["instant", "digest"] as const).map(opt => (
              <button
                key={opt}
                type="button"
                onClick={() => setFrequency(opt)}
                className="flex items-start gap-3 cursor-pointer text-left"
              >
                <span className={cn(
                  "mt-0.5 w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors",
                  frequency === opt ? "border-badge-bg" : "border-border-mid",
                )}>
                  {frequency === opt && <span className="w-2 h-2 rounded-full bg-badge-bg" />}
                </span>
                <span>
                  <p className="text-sm font-semibold text-navy">
                    {opt === "instant" ? "Instant (recommended)" : "Daily Digest"}
                  </p>
                  <p className="text-xs text-body">
                    {opt === "instant" ? "Get notified as soon as a deal matches" : "Receive a summary once per day"}
                  </p>
                </span>
              </button>
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
              {["1","3","5","10","Unlimited"].map(v => <option key={v} value={v}>{v}</option>)}
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
              {[{l:"Any",v:"0"},{l:"10%",v:"10"},{l:"20%",v:"20"},{l:"30%",v:"30"},{l:"40%",v:"40"},{l:"50%",v:"50"}].map(({l,v}) =>
                <option key={v} value={v}>{l}</option>
              )}
            </select>
          </div>
        </DesktopSection>

        {/* Category Alerts */}
        <DesktopSection label="Category Alerts" description="Select categories you want to receive alerts for">
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
        </DesktopSection>

        {/* Quiet Hours */}
        <DesktopSection label="Quiet Hours" description="Pause notifications during your preferred hours">
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
          </div>
        </DesktopSection>
      </div>

      {/* ════════════════════════════════════════════════════════════════════
          MOBILE VIEW
      ════════════════════════════════════════════════════════════════════ */}
      <div className="md:hidden pb-8">
        <div className="px-4 pt-4">
          <button
            type="button"
            onClick={handleSave}
            disabled={isPending}
            className="w-full h-12 rounded-xl bg-navy text-white text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {isPending ? "Saving…" : "Save Preferences"}
          </button>
        </div>

        {/* DELIVERY CHANNELS */}
        <MobileSectionLabel>Delivery Channels</MobileSectionLabel>
        <div className="mx-4 rounded-xl overflow-hidden border border-[#E7E8E9] divide-y divide-[#E7E8E9] bg-white">
          {[
            { icon: Mail, label: "Email Alerts", desc: "Receive personalized deal alerts in your inbox", on: emailAlerts, set: setEmailAlerts },
            { icon: Bell, label: "Push Notification", desc: "Receive deal alerts on your device", on: pushAlerts, set: setPushAlerts },
          ].map(({ icon: Icon, label, desc, on, set }) => (
            <div key={label} className="flex items-center gap-3 px-4 py-4">
              <div className="w-9 h-9 rounded-lg bg-surface-hover flex items-center justify-center shrink-0">
                <Icon className="w-4 h-4 text-navy" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-navy">{label}</p>
                <p className="text-xs text-body leading-snug">{desc}</p>
              </div>
              <Toggle on={on} onChange={set} />
            </div>
          ))}
        </div>

        {/* ALERT FREQUENCY */}
        <MobileSectionLabel>Alert Frequency</MobileSectionLabel>
        <div className="mx-4 rounded-xl overflow-hidden border border-[#E7E8E9] bg-white">
          <div className="flex border-b border-[#E7E8E9]">
            {(["instant", "digest"] as const).map((opt, i) => (
              <button
                key={opt}
                type="button"
                onClick={() => setFrequency(opt)}
                className={cn(
                  "flex-1 py-3 text-sm font-semibold transition-colors",
                  i === 0 ? "border-r border-[#E7E8E9]" : "",
                  frequency === opt ? "text-navy bg-white" : "text-body bg-bg",
                )}
              >
                {opt === "instant" ? "Instant" : "Daily Digest"}
              </button>
            ))}
          </div>
          <p className="px-4 py-3 text-xs text-body leading-relaxed">
            {frequency === "instant"
              ? "Recommended: Instant alerts ensure you never miss time-sensitive price drops."
              : "Daily Digest: Get a single summary of all deals each day."}
          </p>
        </div>

        {/* ALERTS SETTINGS */}
        <MobileSectionLabel>Alerts Settings</MobileSectionLabel>
        <div className="mx-4 rounded-xl border border-[#E7E8E9] bg-white px-4 py-4 space-y-4">
          <div className="flex flex-wrap gap-2">
            {visibleCats.map(cat => (
              <button
                key={cat}
                type="button"
                onClick={() => toggleCategory(cat)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-sm font-semibold border transition-colors",
                  selCategories.includes(cat)
                    ? "border-navy text-navy bg-white"
                    : "border-[#E7E8E9] text-body bg-white",
                )}
              >
                {cat}
              </button>
            ))}
            {!showMoreCats && (
              <button
                type="button"
                onClick={() => setShowMoreCats(true)}
                className="px-3 py-1.5 rounded-lg text-sm font-semibold border border-[#E7E8E9] text-body bg-white"
              >
                + Show More
              </button>
            )}
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-[#E7E8E9]">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-body shrink-0" />
              <p className="text-sm font-medium text-navy">Limit alerts to selected categories only</p>
            </div>
            <Toggle on={limitToCategories} onChange={setLimitToCategories} />
          </div>
        </div>

        {/* MAX ALERTS PER DAY */}
        <div className="mx-4 mt-4">
          <p className="text-sm font-semibold text-navy mb-2">Max Alerts Per Day</p>
          <ChipGroup
            options={MAX_PER_DAY_OPTS}
            value={maxPerDay as typeof MAX_PER_DAY_OPTS[number]["value"]}
            onChange={v => setMaxPerDay(v)}
          />
        </div>

        {/* MIN DISCOUNT */}
        <div className="mx-4 mt-5">
          <p className="text-sm font-semibold text-navy mb-2">Minimum Discount For Alerts</p>
          <ChipGroup
            options={MIN_DISCOUNT_OPTS}
            value={minDiscount as typeof MIN_DISCOUNT_OPTS[number]["value"]}
            onChange={v => setMinDiscount(v)}
          />
        </div>

        {/* QUIET HOURS */}
        <MobileSectionLabel>Enable Quiet Hours</MobileSectionLabel>
        <div className="mx-4 rounded-xl border border-[#E7E8E9] bg-white px-4 py-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Volume2 className="w-4 h-4 text-body shrink-0" />
              <div>
                <p className="text-sm font-semibold text-navy">Enable Quiet Hours</p>
                <p className="text-xs text-body">You won&apos;t receive notifications during this time</p>
              </div>
            </div>
            <Toggle on={quietHours} onChange={setQuietHours} />
          </div>
          {quietHours && (
            <div className="pl-7 flex flex-wrap items-center gap-2 pt-2 border-t border-[#E7E8E9]">
              <span className="text-xs text-body">From</span>
              <select value={quietFrom} onChange={e => setQuietFrom(e.target.value)}
                className="text-sm border border-[#E7E8E9] rounded-lg px-3 py-1.5 text-navy bg-white outline-none">
                {Array.from({ length: 24 }, (_, i) => `${i}:00`).map(v => <option key={v}>{v}</option>)}
              </select>
              <span className="text-xs text-body">to</span>
              <select value={quietTo} onChange={e => setQuietTo(e.target.value)}
                className="text-sm border border-[#E7E8E9] rounded-lg px-3 py-1.5 text-navy bg-white outline-none">
                {Array.from({ length: 24 }, (_, i) => `${i}:00`).map(v => <option key={v}>{v}</option>)}
              </select>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
