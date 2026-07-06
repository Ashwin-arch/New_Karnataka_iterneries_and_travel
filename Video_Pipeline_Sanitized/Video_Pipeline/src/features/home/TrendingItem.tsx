"use client";

import { MapPin } from "lucide-react";
import { IVideo } from "@/types";
import { CATEGORIES } from "@/constants";
import { formatCount, cn } from "@/lib/utils";

const RANK_COLORS = ["text-amber-400", "text-slate-400", "text-amber-700"];

interface Props {
  video: IVideo;
  rank: number;
  onClick: () => void;
}

export function TrendingItem({ video, rank, onClick }: Props) {
  const category = CATEGORIES.find(c => c.value === video.category);

  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 bg-[#161622] border border-[#2a2a3e] rounded-2xl p-3 active:opacity-70 transition-all hover:border-[#7c3aed]/20"
    >
      <span
        className={cn(
          "text-lg font-black w-6 text-center flex-shrink-0",
          RANK_COLORS[rank - 1] || "text-[#555577]"
        )}
      >
        {rank}
      </span>

      <div className="w-10 h-10 rounded-xl flex-shrink-0 overflow-hidden bg-[#1e1e2e]">
        {video.thumbnailUrl ? (
          <img src={video.thumbnailUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-lg">
            {category?.emoji || "🎬"}
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold text-white truncate">{video.title}</p>
        <div className="flex items-center gap-1 mt-0.5">
          <MapPin className="w-2.5 h-2.5 text-[#555577]" />
          <span className="text-[10px] text-[#555577] truncate">
            {video.placeName}, {video.district}
          </span>
        </div>
      </div>

      <div className="text-right flex-shrink-0">
        <p className="text-xs font-black text-[#a78bfa]">{formatCount(video.savesCount)}</p>
        <p className="text-[9px] text-[#555577]">saves</p>
      </div>
    </button>
  );
}
