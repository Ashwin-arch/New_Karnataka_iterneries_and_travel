"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  MapPin, CheckCircle2, Clock, XCircle,
  Upload, Eye, Bookmark
} from "lucide-react";
import { IVideo } from "@/types";
import { VIDEO_STATUS, CATEGORIES } from "@/constants";
import { formatCount, formatRelativeTime, cn } from "@/lib/utils";

type Tab = "all" | "APPROVED" | "PENDING" | "REJECTED";
const TABS: { key: Tab; label: string }[] = [
  { key: "all",      label: "All"      },
  { key: "APPROVED", label: "Approved" },
  { key: "PENDING",  label: "Pending"  },
  { key: "REJECTED", label: "Rejected" },
];

export default function CreatorContentPage() {
  const router = useRouter();
  const [videos, setVideos]   = useState<IVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab]         = useState<Tab>("all");

  const fetchVideos = useCallback(async (t: Tab) => {
    setLoading(true);
    try {
      const url = t === "all" ? "/api/videos/my-videos" : `/api/videos/my-videos?status=${t}`;
      const res  = await fetch(url);
      const data = await res.json();
      if (data.success) setVideos(data.data.videos);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchVideos(tab); }, [tab, fetchVideos]);

  const counts = {
    all:      videos.length,
    APPROVED: videos.filter(v => v.status === "APPROVED").length,
    PENDING:  videos.filter(v => v.status === "PENDING").length,
    REJECTED: videos.filter(v => v.status === "REJECTED").length,
  };

  return (
    <div className="min-h-dvh bg-[#0d0d16]">
      {/* Header */}
      <div className="bg-[#0d0d16] px-4 pt-14 pb-4 border-b border-[#1e1e2e] sticky top-0 z-10">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-black text-white">My Content</h1>
            <p className="text-xs text-[#555577] mt-0.5">{videos.length} videos total</p>
          </div>
          <button
            onClick={() => router.push("/creator/upload")}
            className="flex items-center gap-1.5 bg-[#7c3aed] text-white text-xs font-black px-3 py-2 rounded-xl shadow-lg shadow-purple-900/30"
          >
            <Upload className="w-3.5 h-3.5" /> Upload
          </button>
        </div>

        {/* Tabs */}
        <div className="flex bg-[#161622] border border-[#2a2a3e] rounded-2xl p-1 gap-1">
          {TABS.map(({ key, label }) => (
            <button key={key} onClick={() => setTab(key)}
              className={cn("flex-1 py-2 rounded-xl text-[11px] font-black transition-all",
                tab === key ? "bg-[#7c3aed] text-white shadow-lg shadow-purple-900/30" : "text-[#555577]"
              )}>
              {label}<span className="ml-0.5 opacity-50">({counts[key]})</span>
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 pt-4 pb-6">
        {loading ? (
          <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-24 skeleton rounded-2xl" />)}</div>
        ) : videos.length === 0 ? (
          <div className="py-20 text-center">
            <div className="text-5xl mb-4">🎬</div>
            <p className="text-sm font-black text-white mb-1">No videos in this tab</p>
            {tab === "all" && (
              <button onClick={() => router.push("/creator/upload")}
                className="mt-4 flex items-center gap-2 bg-[#7c3aed] text-white font-black px-5 py-2.5 rounded-xl mx-auto text-sm">
                <Upload className="w-4 h-4" /> Upload first story
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {videos.map(v => {
              const status = VIDEO_STATUS[v.status];
              const cat    = CATEGORIES.find(c => c.value === v.category);
              const StatusIcon = v.status === "APPROVED" ? CheckCircle2 : v.status === "REJECTED" ? XCircle : Clock;
              return (
                <button key={v._id} onClick={() => router.push(`/place/${v._id}`)}
                  className="w-full flex items-center gap-3 bg-[#161622] border border-[#2a2a3e] rounded-2xl overflow-hidden text-left active:opacity-70 transition-all hover:border-[#7c3aed]/20">
                  {/* Thumbnail */}
                  <div className="w-[70px] h-[88px] bg-[#1e1e2e] flex-shrink-0 relative overflow-hidden">
                    {v.thumbnailUrl
                      ? <img src={v.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center text-2xl">{cat?.emoji || "🎬"}</div>
                    }
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                  </div>
                  {/* Info */}
                  <div className="flex-1 p-3 min-w-0">
                    <p className="text-sm font-black text-white truncate">{v.title}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3 text-[#555577]" />
                      <span className="text-[11px] text-[#555577] truncate">{v.placeName}, {v.district}</span>
                    </div>
                    {cat && <p className="text-[10px] text-[#555577] mt-0.5">{cat.emoji} {cat.label}</p>}
                    <div className="flex items-center gap-2 mt-2">
                      <div className={cn("flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full border", status.bg, status.color)}>
                        <StatusIcon style={{ width:9, height:9 }} />
                        {status.label}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className="flex items-center gap-1 text-[10px] text-[#555577]"><Eye style={{width:10,height:10}} />{formatCount(v.views)}</span>
                      <span className="flex items-center gap-1 text-[10px] text-[#555577]"><Bookmark style={{width:10,height:10}} />{formatCount(v.savesCount)}</span>
                      <span className="text-[10px] text-[#555577]">{formatRelativeTime(v.createdAt)}</span>
                    </div>
                    {v.status === "REJECTED" && v.rejectionReason && (
                      <p className="text-[10px] text-rose-400 mt-1 line-clamp-1 italic">"{v.rejectionReason}"</p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
