"use client";

import { MapPin, Calendar, Share2, Trash2, ChevronRight, Link, Check, Loader2 } from "lucide-react";
import { IItinerary } from "@/types";
import { formatRelativeTime, cn } from "@/lib/utils";

const BG_GRADIENTS = [
  "from-[#0369a1] to-[#0284c7]",
  "from-[#065f46] to-[#059669]",
  "from-[#7c3aed] to-[#4c1d95]",
  "from-[#92400e] to-[#b45309]",
  "from-[#1e1b4b] to-[#3730a3]",
  "from-[#134e4a] to-[#0f766e]",
];

interface Props {
  itin: IItinerary;
  onOpen: () => void;
  onShare: () => void;
  onDelete: () => void;
  deleting: boolean;
}

export function ItineraryCard({ itin, onOpen, onShare, onDelete, deleting }: Props) {
  const grad = BG_GRADIENTS[itin._id.charCodeAt(0) % BG_GRADIENTS.length];

  return (
    <div className="bg-[#161622] border border-[#2a2a3e] rounded-2xl overflow-hidden">
      {/* Gradient header strip */}
      <div
        className={`bg-gradient-to-r ${grad} px-4 py-4 flex items-center justify-between cursor-pointer active:opacity-90`}
        onClick={onOpen}
      >
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-black text-white truncate">{itin.title}</h3>
          {itin.description && (
            <p className="text-xs text-white/55 mt-0.5 truncate">{itin.description}</p>
          )}
        </div>
        <ChevronRight className="w-4 h-4 text-white/60 flex-shrink-0 ml-2" />
      </div>

      {/* Meta row */}
      <div className="px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-[#555577]">
            <MapPin className="w-3.5 h-3.5" />
            <span className="text-xs font-medium">{itin.places?.length || 0} places</span>
          </div>
          <div className="flex items-center gap-1.5 text-[#555577]">
            <Calendar className="w-3.5 h-3.5" />
            <span className="text-xs">{formatRelativeTime(itin.updatedAt)}</span>
          </div>
          {itin.isShared && (
            <div className="flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-2 py-0.5">
              <Link className="w-2.5 h-2.5 text-emerald-400" />
              <span className="text-[9px] text-emerald-400 font-bold">Shared</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={onShare}
            className="w-8 h-8 rounded-xl bg-[#1e1e2e] border border-[#2a2a3e] flex items-center justify-center active:opacity-70 transition-all hover:border-[#7c3aed]/30"
          >
            {itin.isShared
              ? <Check className="w-3.5 h-3.5 text-emerald-400" />
              : <Share2 className="w-3.5 h-3.5 text-[#555577]" />
            }
          </button>
          <button
            onClick={onDelete}
            disabled={deleting}
            className="w-8 h-8 rounded-xl bg-[#1e1e2e] border border-[#2a2a3e] flex items-center justify-center active:opacity-70 transition-all hover:border-rose-500/30 disabled:opacity-40"
          >
            {deleting
              ? <Loader2 className="w-3.5 h-3.5 text-[#555577] animate-spin" />
              : <Trash2 className="w-3.5 h-3.5 text-[#555577]" />
            }
          </button>
        </div>
      </div>

      {/* Thumbnail strip of added places */}
      {itin.places?.length > 0 && (
        <div className="flex gap-1.5 px-4 pb-3 overflow-x-auto">
          {itin.places.slice(0, 6).map((place, i) => (
            <div
              key={i}
              className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-[#1e1e2e] border border-[#2a2a3e]"
            >
              {place.thumbnailUrl ? (
                <img src={place.thumbnailUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <MapPin className="w-3 h-3 text-[#2a2a3e]" />
                </div>
              )}
            </div>
          ))}
          {itin.places.length > 6 && (
            <div className="w-10 h-10 rounded-lg bg-[#1e1e2e] border border-[#2a2a3e] flex items-center justify-center flex-shrink-0">
              <span className="text-[10px] text-[#555577] font-black">+{itin.places.length - 6}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
