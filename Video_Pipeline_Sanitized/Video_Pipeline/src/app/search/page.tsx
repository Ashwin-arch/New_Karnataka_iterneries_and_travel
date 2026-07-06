"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, X, MapPin, Filter, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { IVideo } from "@/types";
import { CATEGORIES, KARNATAKA_DISTRICTS } from "@/constants";
import { cn, formatRelativeTime } from "@/lib/utils";
import { BottomNav } from "@/components/layout/BottomNav";

export default function SearchPage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [district, setDistrict] = useState("");
  const [videos, setVideos] = useState<IVideo[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const doSearch = useCallback(async () => {
    setLoading(true);
    setSearched(true);
    try {
      const params = new URLSearchParams({ limit: "30" });
      if (category) params.set("category", category);
      if (district) params.set("district", district);
      const res = await fetch(`/api/videos?${params}`);
      const data = await res.json();
      if (data.success) {
        let results: IVideo[] = data.data.videos;
        if (query.trim()) {
          const q = query.toLowerCase();
          results = results.filter(v =>
            v.title.toLowerCase().includes(q) ||
            v.placeName.toLowerCase().includes(q) ||
            v.description.toLowerCase().includes(q) ||
            v.tags?.some(t => t.toLowerCase().includes(q))
          );
        }
        setVideos(results);
      }
    } finally {
      setLoading(false);
    }
  }, [query, category, district]);

  useEffect(() => {
    if (category || district) doSearch();
  }, [category, district, doSearch]);

  const clearAll = () => { setQuery(""); setCategory(""); setDistrict(""); setVideos([]); setSearched(false); };

  return (
    <div className="min-h-dvh bg-[#0d0d16] pb-24">
      {/* Header */}
      <div className="px-4 pt-14 pb-3 bg-[#0d0d16] sticky top-0 z-10 border-b border-[#1e1e2e]">
        <h1 className="text-xl font-black text-white mb-3">Search</h1>
        <form onSubmit={e => { e.preventDefault(); doSearch(); }} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#555577]" />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Places, stories, food..."
              className="w-full bg-[#161622] border border-[#2a2a3e] rounded-xl pl-9 pr-4 py-3 text-sm text-white placeholder-[#555577] focus:border-[#7c3aed] transition-all"
            />
            {query && (
              <button type="button" onClick={() => setQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2">
                <X className="w-4 h-4 text-[#555577]" />
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={() => setShowFilters(s => !s)}
            className={cn(
              "w-12 h-12 rounded-xl border flex items-center justify-center transition-all",
              showFilters || category || district
                ? "bg-[#7c3aed]/15 border-[#7c3aed] text-[#a78bfa]"
                : "bg-[#161622] border-[#2a2a3e] text-[#555577]"
            )}
          >
            <Filter className="w-4 h-4" />
          </button>
        </form>

        {showFilters && (
          <div className="mt-3 space-y-3 fade-up">
            <div>
              <p className="text-[10px] font-black text-[#555577] tracking-wider mb-2">CATEGORY</p>
              <div className="flex gap-2 overflow-x-auto pb-1">
                <button
                  onClick={() => setCategory("")}
                  className={cn("flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all",
                    !category ? "bg-[#7c3aed] text-white border-[#7c3aed]" : "bg-[#161622] text-[#9ca3af] border-[#2a2a3e]"
                  )}
                >✨ All</button>
                {CATEGORIES.map(c => (
                  <button key={c.value}
                    onClick={() => setCategory(category === c.value ? "" : c.value)}
                    className={cn("flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all",
                      category === c.value ? "bg-[#7c3aed] text-white border-[#7c3aed]" : "bg-[#161622] text-[#9ca3af] border-[#2a2a3e]"
                    )}
                  >{c.emoji} {c.label}</button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-[10px] font-black text-[#555577] tracking-wider mb-2">DISTRICT</p>
              <select
                value={district}
                onChange={e => setDistrict(e.target.value)}
                className="w-full bg-[#161622] border border-[#2a2a3e] rounded-xl px-4 py-2.5 text-sm text-white focus:border-[#7c3aed] transition-all"
              >
                <option value="">All districts</option>
                {KARNATAKA_DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            {(category || district || query) && (
              <button onClick={clearAll} className="text-xs text-[#a78bfa] font-semibold">Clear all filters</button>
            )}
          </div>
        )}
      </div>

      {/* Body */}
      <div className="px-4 pt-4">
        {!searched && !loading && (
          <div>
            <p className="text-xs font-black text-[#555577] tracking-wider mb-3">BROWSE BY CATEGORY</p>
            <div className="grid grid-cols-2 gap-2.5 mb-6">
              {CATEGORIES.map(c => (
                <button
                  key={c.value}
                  onClick={() => { setCategory(c.value); doSearch(); }}
                  className="bg-[#161622] border border-[#2a2a3e] rounded-2xl p-4 text-left hover:border-[#7c3aed]/40 active:scale-[0.97] transition-all"
                >
                  <span className="text-2xl">{c.emoji}</span>
                  <p className="text-xs font-bold text-white mt-2">{c.label}</p>
                  <p className="text-[10px] text-[#555577] mt-0.5">Explore →</p>
                </button>
              ))}
            </div>
            <p className="text-xs font-black text-[#555577] tracking-wider mb-3">POPULAR DISTRICTS</p>
            <div className="flex flex-wrap gap-2">
              {["Kodagu","Chikkamagaluru","Mysuru","Hassan","Uttara Kannada","Dakshina Kannada","Shivamogga"].map(d => (
                <button
                  key={d}
                  onClick={() => { setDistrict(d); doSearch(); }}
                  className="flex items-center gap-1.5 bg-[#161622] border border-[#2a2a3e] rounded-full px-3 py-1.5 text-xs text-[#9ca3af] hover:border-[#7c3aed]/40 transition-all"
                >
                  <MapPin className="w-3 h-3" />{d}
                </button>
              ))}
            </div>
          </div>
        )}

        {loading && (
          <div className="space-y-3">
            {[1,2,3,4].map(i => <div key={i} className="h-20 skeleton rounded-2xl" />)}
          </div>
        )}

        {searched && !loading && videos.length === 0 && (
          <div className="py-16 text-center">
            <div className="text-4xl mb-3">🔍</div>
            <p className="text-sm font-bold text-white">No results found</p>
            <p className="text-xs text-[#555577] mt-1">Try different keywords or filters</p>
          </div>
        )}

        {videos.length > 0 && (
          <>
            <p className="text-xs text-[#555577] font-semibold mb-3">{videos.length} result{videos.length !== 1 ? "s" : ""}</p>
            <div className="space-y-3">
              {videos.map(video => <SearchCard key={video._id} video={video} onClick={() => router.push(`/place/${video._id}`)} />)}
            </div>
          </>
        )}
      </div>

      <BottomNav />
    </div>
  );
}

function SearchCard({ video, onClick }: { video: IVideo; onClick: () => void }) {
  const cat = CATEGORIES.find(c => c.value === video.category);
  const creator = typeof video.creatorId === "object" ? video.creatorId as { fullName: string } : null;

  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 bg-[#161622] border border-[#2a2a3e] rounded-2xl p-3 text-left active:opacity-70 transition-all hover:border-[#2a2a3e]/80"
    >
      <div className="w-16 h-16 rounded-xl overflow-hidden bg-[#1e1e2e] flex-shrink-0">
        {video.thumbnailUrl
          ? <img src={video.thumbnailUrl} alt="" className="w-full h-full object-cover" />
          : <div className="w-full h-full flex items-center justify-center text-2xl">{cat?.emoji || "🎬"}</div>
        }
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-white truncate">{video.title}</p>
        <div className="flex items-center gap-1 mt-0.5">
          <MapPin className="w-3 h-3 text-[#555577]" />
          <span className="text-[11px] text-[#555577] truncate">{video.placeName}, {video.district}</span>
        </div>
        <div className="flex items-center justify-between mt-1.5">
          <span className="text-[10px] text-[#555577]">{creator?.fullName}</span>
          <span className="text-[10px] text-[#555577]">{formatRelativeTime(video.createdAt)}</span>
        </div>
      </div>
      <ChevronRight className="w-4 h-4 text-[#2a2a3e] flex-shrink-0" />
    </button>
  );
}
