"use client";

import {
  AlertTriangle, MapPin, Flag, CheckCircle2,
  TrendingUp, Shield, Users, Video
} from "lucide-react";
import { cn } from "@/lib/utils";

// In V1 reports are surfaced from a static trust overview.
// Real report submission is a V2 feature (user taps "Report" on a video).

const MOCK_REPORTS = [
  {
    id: "1",
    type: "Location",
    title: "Incorrect location coordinates",
    detail: "Jog Falls listing — coordinates point to wrong district",
    severity: "high" as const,
    count: 4,
    icon: MapPin,
  },
  {
    id: "2",
    type: "Spam",
    title: "Repetitive spam uploads",
    detail: "Creator @xyz_travel submitted 8 identical videos",
    severity: "high" as const,
    count: 2,
    icon: Flag,
  },
  {
    id: "3",
    type: "Content",
    title: "Misleading description",
    detail: "Mysore palace video — description claims restricted areas",
    severity: "medium" as const,
    count: 1,
    icon: AlertTriangle,
  },
  {
    id: "4",
    type: "Duplicate",
    title: "Duplicate place listing",
    detail: "Hampi Bazaar appears twice under different names",
    severity: "medium" as const,
    count: 1,
    icon: Video,
  },
];

const TRUST_METRICS = [
  { label: "Content quality score",  value: 97.2, color: "#10b981" },
  { label: "Location accuracy",      value: 99.1, color: "#3b82f6" },
  { label: "Creator trust rating",   value: 94.8, color: "#7c3aed" },
];

export default function AdminReportsPage() {
  return (
    <div className="px-4 pt-5 pb-6">

      {/* Header */}
      <div className="mb-5">
        <h2 className="text-xl font-black text-white">Reports & Trust</h2>
        <p className="text-xs text-[#475569] mt-0.5">Platform integrity centre</p>
      </div>

      {/* Trust metrics */}
      <div className="bg-[#0f172a] border border-[#1e293b] rounded-2xl p-4 mb-5">
        <div className="flex items-center gap-2 mb-4">
          <Shield className="w-4 h-4 text-[#60a5fa]" />
          <p className="text-sm font-black text-white">Trust scorecard</p>
        </div>
        <div className="space-y-4">
          {TRUST_METRICS.map(m => (
            <div key={m.label}>
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-xs text-[#64748b]">{m.label}</span>
                <span className="text-sm font-black" style={{ color: m.color }}>{m.value}%</span>
              </div>
              <div className="h-2 bg-[#1e293b] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${m.value}%`, background: m.color }}
                />
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 flex items-center gap-2 bg-emerald-500/8 border border-emerald-500/15 rounded-xl px-3 py-2">
          <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-xs text-emerald-400 font-semibold">
            Platform trust improved 2.3% this month
          </span>
        </div>
      </div>

      {/* Open reports */}
      <p className="text-[10px] font-black text-[#334155] tracking-widest mb-3">
        OPEN REPORTS ({MOCK_REPORTS.length})
      </p>
      <div className="space-y-2 mb-6">
        {MOCK_REPORTS.map(r => (
          <div
            key={r.id}
            className={cn(
              "bg-[#0f172a] border rounded-2xl p-4",
              r.severity === "high"
                ? "border-rose-500/20"
                : "border-amber-500/15"
            )}
          >
            <div className="flex items-start gap-3">
              <div className={cn(
                "w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0",
                r.severity === "high"
                  ? "bg-rose-500/10"
                  : "bg-amber-500/8"
              )}>
                <r.icon
                  className={cn("w-4 h-4", r.severity === "high" ? "text-rose-400" : "text-amber-400")}
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm font-bold text-white">{r.title}</p>
                  <span className={cn(
                    "text-[9px] font-black px-2 py-0.5 rounded-full border flex-shrink-0",
                    r.severity === "high"
                      ? "bg-rose-500/10 border-rose-500/20 text-rose-400"
                      : "bg-amber-500/8 border-amber-500/15 text-amber-400"
                  )}>
                    {r.severity.toUpperCase()}
                  </span>
                </div>
                <p className="text-xs text-[#475569]">{r.detail}</p>
                <p className="text-[10px] text-[#334155] mt-1.5">
                  Reported by {r.count} user{r.count !== 1 ? "s" : ""}
                </p>
              </div>
            </div>
            {/* Action buttons */}
            <div className="flex gap-2 mt-3 pt-3 border-t border-[#1e293b]">
              <button className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-emerald-500/8 border border-emerald-500/15 text-xs font-bold text-emerald-400 active:opacity-70">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Resolve
              </button>
              <button className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-[#1e293b] border border-[#334155] text-xs font-bold text-[#64748b] active:opacity-70">
                Review content
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* V2 note */}
      <div className="bg-blue-500/8 border border-blue-500/15 rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-2">
          <Users className="w-4 h-4 text-blue-400" />
          <p className="text-sm font-bold text-white">User reporting — V2</p>
        </div>
        <p className="text-xs text-[#475569] leading-relaxed">
          In V2, users can tap "Report" on any video directly from the feed. Reports will auto-populate here with severity scoring and creator strike tracking.
        </p>
      </div>
    </div>
  );
}
