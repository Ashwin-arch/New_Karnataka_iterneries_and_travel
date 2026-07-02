"use client";

import { SlidersHorizontal, ChevronDown } from "lucide-react";
import { CATEGORIES } from "@/constants";
import { cn } from "@/lib/utils";

interface Props {
  activeTab: string;
  open: boolean;
  onToggle: () => void;
  filterCategory: string;
  onCategoryChange: (cat: string) => void;
  radius: number;
  onRadiusChange: (r: number) => void;
}

export function FeedFilterPanel({
  activeTab, open, onToggle,
  filterCategory, onCategoryChange,
  radius, onRadiusChange,
}: Props) {
  return (
    <>
      <button
        onClick={onToggle}
        className={cn(
          "flex items-center gap-1.5 glass border rounded-full px-3 py-1.5 text-xs font-bold transition-all",
          open || filterCategory
            ? "border-[#7c3aed] text-[#a78bfa]"
            : "border-white/20 text-white/80"
        )}
      >
        <SlidersHorizontal className="w-3 h-3" />
        Filter
        <ChevronDown className={cn("w-3 h-3 transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="mx-0 mt-2 glass-dark border border-white/10 rounded-2xl p-3 fade-up">
          <p className="text-[10px] font-black text-white/40 tracking-wider mb-2">CATEGORY</p>
          <div className="flex flex-wrap gap-1.5 mb-3">
            <button
              onClick={() => onCategoryChange("")}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-bold border transition-all",
                !filterCategory
                  ? "bg-[#7c3aed] border-[#7c3aed] text-white"
                  : "border-white/20 text-white/60"
              )}
            >
              ✨ All
            </button>
            {CATEGORIES.map(c => (
              <button
                key={c.value}
                onClick={() => onCategoryChange(filterCategory === c.value ? "" : c.value)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-xs font-bold border transition-all",
                  filterCategory === c.value
                    ? "bg-[#7c3aed] border-[#7c3aed] text-white"
                    : "border-white/20 text-white/60"
                )}
              >
                {c.emoji} {c.label}
              </button>
            ))}
          </div>

          {activeTab === "Nearby" && (
            <>
              <p className="text-[10px] font-black text-white/40 tracking-wider mb-1.5">
                RADIUS: {radius} km
              </p>
              <input
                type="range" min={5} max={300} step={5}
                value={radius}
                onChange={e => onRadiusChange(parseInt(e.target.value))}
                className="w-full"
                style={{ accentColor: "#7c3aed" }}
              />
              <div className="flex justify-between text-[9px] text-white/30 mt-1">
                <span>5 km</span><span>300 km</span>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
