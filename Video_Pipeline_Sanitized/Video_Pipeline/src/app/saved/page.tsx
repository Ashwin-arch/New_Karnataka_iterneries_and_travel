"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Bookmark, MapPin, ChevronRight, Loader2 } from "lucide-react";
import { BottomNav } from "@/components/layout/BottomNav";

interface SavedItem {
  _id: string;
  videoId: {
    _id: string; title: string; placeName: string;
    district: string; thumbnailUrl?: string; category: string;
  };
}

export default function SavedPage() {
  const router = useRouter();
  const [saved, setSaved] = useState<SavedItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/videos/saved")
      .then(r => r.json())
      .then(d => { if (d.success) setSaved(d.data.saved); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-dvh bg-[#0d0d16] pb-24">
      <div className="px-4 pt-14 pb-4 border-b border-[#1e1e2e]">
        <h1 className="text-xl font-black text-white">Saved</h1>
        <p className="text-xs text-[#555577] mt-1">Places and videos you have bookmarked</p>
      </div>

      <div className="px-4 pt-4">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 text-[#7c3aed] animate-spin" />
          </div>
        ) : saved.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-2xl bg-[#161622] border border-[#2a2a3e] flex items-center justify-center mb-4">
              <Bookmark className="w-7 h-7 text-[#2a2a3e]" />
            </div>
            <h2 className="text-base font-bold text-white mb-2">Nothing saved yet</h2>
            <p className="text-sm text-[#555577] max-w-[220px]">Tap the bookmark icon on any video or place to save it here</p>
          </div>
        ) : (
          <div className="space-y-3">
            {saved.map(item => {
              const v = item.videoId;
              if (!v || typeof v !== "object") return null;
              return (
                <button
                  key={item._id}
                  onClick={() => router.push(`/place/${v._id}`)}
                  className="w-full flex items-center gap-3 bg-[#161622] border border-[#2a2a3e] rounded-2xl p-3 text-left active:opacity-70 transition-all"
                >
                  <div className="w-14 h-14 rounded-xl overflow-hidden bg-[#1e1e2e] flex-shrink-0">
                    {v.thumbnailUrl
                      ? <img src={v.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center text-xl">🎬</div>
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white truncate">{v.title}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3 text-[#555577]" />
                      <span className="text-xs text-[#555577] truncate">{v.placeName}, {v.district}</span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#2a2a3e] flex-shrink-0" />
                </button>
              );
            })}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
