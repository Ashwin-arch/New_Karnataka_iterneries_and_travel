"use client";

import { MapPin, Play } from "lucide-react";
import { IVideo } from "@/types";
import { CATEGORIES } from "@/constants";

const BG_COLORS = [
  "#134e4a","#3b0764","#78350f","#0c4a6e","#1e1b4b","#14532d","#1c1917","#0f172a",
];

interface Props {
  video: IVideo;
  onClick: () => void;
}

export function GemCard({ video, onClick }: Props) {
  const category = CATEGORIES.find(c => c.value === video.category);
  const bg = BG_COLORS[
    Math.abs((video._id.charCodeAt(0) || 0) + (video._id.charCodeAt(1) || 0)) % BG_COLORS.length
  ];

  return (
    <button
      onClick={onClick}
      className="flex-shrink-0 w-36 h-52 rounded-2xl overflow-hidden relative active:scale-[0.97] transition-all"
      style={{ background: bg }}
    >
      {video.thumbnailUrl && (
        <img
          src={video.thumbnailUrl}
          alt={video.title}
          className="absolute inset-0 w-full h-full object-cover opacity-60"
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent" />

      <div className="absolute inset-0 flex flex-col justify-between p-3">
        {/* Top row */}
        <div className="flex items-start justify-between">
          {category && (
            <span className="text-[9px] glass border border-white/10 rounded-full px-2 py-0.5 text-white font-medium">
              {category.emoji} {category.label}
            </span>
          )}
          <div className="w-6 h-6 rounded-full bg-white/15 flex items-center justify-center flex-shrink-0">
            <Play className="w-3 h-3 text-white fill-white" />
          </div>
        </div>

        {/* Bottom info */}
        <div>
          <p className="text-[11px] font-bold text-white leading-tight line-clamp-2">
            {video.title}
          </p>
          <div className="flex items-center gap-1 mt-1.5">
            <MapPin className="w-2.5 h-2.5 text-[#a78bfa]" />
            <span className="text-[10px] text-white/60 truncate">{video.district}</span>
          </div>
          {video.distanceKm != null && (
            <p className="text-[9px] text-emerald-400 mt-0.5 font-semibold">
              📍 {video.distanceKm} km away
            </p>
          )}
        </div>
      </div>
    </button>
  );
}
