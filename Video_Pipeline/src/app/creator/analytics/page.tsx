"use client";

import { useEffect, useState } from "react";
import { Eye, Bookmark, Share2, Route, TrendingUp, MapPin } from "lucide-react";
import { IVideo } from "@/types";
import { formatCount, cn } from "@/lib/utils";
import { CATEGORIES } from "@/constants";

type Period = "all" | "month" | "week";

const MONTHLY_DATA = [3200, 4500, 3900, 6100, 7400, 9200];
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun"];

function BarChart({ data, labels }: { data: number[]; labels: string[] }) {
  const max = Math.max(...data, 1);
  return (
    <div className="flex items-end gap-2 h-[90px]">
      {data.map((v, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
          <div
            className="w-full rounded-t-lg transition-all duration-700"
            style={{
              height: `${Math.max((v / max) * 75, 4)}px`,
              background: i === data.length - 1 ? "#7c3aed"
                : i >= data.length - 2 ? "#8b5cf6"
                : i >= data.length - 3 ? "#a78bfa"
                : "#c4b5fd",
            }}
          />
          <span className="text-[9px] text-[#555577]">{labels[i]}</span>
        </div>
      ))}
    </div>
  );
}

export default function CreatorAnalyticsPage() {
  const [period, setPeriod] = useState<Period>("all");
  const [videos, setVideos] = useState<IVideo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/videos/my-videos?status=APPROVED")
      .then(r => r.json())
      .then(d => { if (d.success) setVideos(d.data.videos); })
      .finally(() => setLoading(false));
  }, []);

  const totalViews  = videos.reduce((s, v) => s + (v.views || 0), 0);
  const totalSaves  = videos.reduce((s, v) => s + (v.savesCount || 0), 0);
  const totalShares = videos.reduce((s, v) => s + (v.sharesCount || 0), 0);
  const totalItins  = videos.reduce((s, v) => s + (v.savesCount || 0), 0); // proxy for V1

  const sortedVideos = [...videos].sort((a, b) => (b.views || 0) - (a.views || 0));

  return (
    <div className="min-h-dvh bg-[#0d0d16]">
      {/* Header */}
      <div className="bg-[#0d0d16] px-4 pt-14 pb-4 border-b border-[#1e1e2e]">
        <h1 className="text-xl font-black text-white mb-1">Analytics</h1>
        <p className="text-xs text-[#555577]">All time performance overview</p>
        {/* Period tabs */}
        <div className="flex gap-2 mt-3">
          {(["all","month","week"] as Period[]).map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              className={cn("px-4 py-1.5 rounded-full text-xs font-bold border transition-all capitalize",
                period === p
                  ? "bg-[#7c3aed]/15 border-[#7c3aed]/40 text-[#a78bfa]"
                  : "border-[#2a2a3e] text-[#555577]"
              )}>
              {p === "all" ? "All time" : p === "month" ? "This month" : "This week"}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 pt-5 space-y-5 pb-6">

        {/* 4-metric cards */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { icon: Eye,      label: "Total views",     value: formatCount(totalViews),  color: "text-[#a78bfa]", bg: "bg-[#7c3aed]/8 border-[#7c3aed]/15" },
            { icon: Bookmark, label: "Total saves",     value: formatCount(totalSaves),  color: "text-emerald-400", bg: "bg-emerald-500/8 border-emerald-500/15" },
            { icon: Share2,   label: "Shares",          value: formatCount(totalShares), color: "text-blue-400",  bg: "bg-blue-500/8 border-blue-500/15" },
            { icon: Route,    label: "Itinerary adds",  value: formatCount(totalItins),  color: "text-amber-400", bg: "bg-amber-500/8 border-amber-500/15" },
          ].map(m => (
            <div key={m.label} className={cn("rounded-2xl p-4 border", m.bg)}>
              <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center mb-3", m.bg)}>
                <m.icon className={cn("w-[18px] h-[18px]", m.color)} />
              </div>
              {loading
                ? <div className="h-7 w-14 skeleton rounded mb-1" />
                : <p className={cn("text-2xl font-black", m.color)}>{m.value}</p>
              }
              <p className="text-[10px] text-[#555577] mt-0.5 font-semibold">{m.label}</p>
            </div>
          ))}
        </div>

        {/* Monthly chart */}
        <div className="bg-[#161622] border border-[#2a2a3e] rounded-2xl p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-black text-white">Monthly views</p>
              <p className="text-[10px] text-[#555577] mt-0.5">Last 6 months</p>
            </div>
            <div className="flex items-center gap-1 text-xs font-bold text-[#a78bfa]">
              <TrendingUp className="w-3.5 h-3.5" />
              +24%
            </div>
          </div>
          <BarChart data={MONTHLY_DATA} labels={MONTHS} />
        </div>

        {/* Top content */}
        <div>
          <p className="text-sm font-black text-white mb-3">Top performing content</p>
          {loading ? (
            <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-16 skeleton rounded-2xl" />)}</div>
          ) : sortedVideos.length === 0 ? (
            <div className="py-10 text-center">
              <p className="text-sm text-[#555577]">No approved videos yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {sortedVideos.slice(0, 5).map((v, i) => {
                const cat = CATEGORIES.find(c => c.value === v.category);
                const rankColors = ["text-amber-400","text-slate-400","text-amber-700"];
                return (
                  <div key={v._id} className="flex items-center gap-3 bg-[#161622] border border-[#2a2a3e] rounded-2xl p-3">
                    <span className={cn("text-base font-black w-5 text-center flex-shrink-0", rankColors[i] || "text-[#555577]")}>
                      {i + 1}
                    </span>
                    <div className="w-10 h-10 rounded-xl overflow-hidden bg-[#1e1e2e] flex-shrink-0">
                      {v.thumbnailUrl
                        ? <img src={v.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center text-lg">{cat?.emoji || "🎬"}</div>
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-white truncate">{v.title}</p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-[#555577]" />
                        <span className="text-[10px] text-[#555577] truncate">{v.placeName}</span>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs font-black text-[#a78bfa]">{formatCount(v.views)}</p>
                      <p className="text-[9px] text-[#555577]">views</p>
                      <p className="text-[9px] text-emerald-400 font-bold">{formatCount(v.savesCount)} saves</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Saves vs likes note */}
        <div className="bg-[#7c3aed]/8 border border-[#7c3aed]/15 rounded-2xl p-4">
          <p className="text-xs font-black text-[#a78bfa] mb-1">💡 Why we track saves, not likes</p>
          <p className="text-xs text-[#555577] leading-relaxed">
            Saves are a stronger signal of intent. When someone saves your story, they're planning to revisit it — that's a real action, not a scroll-by reaction.
          </p>
        </div>
      </div>
    </div>
  );
}
