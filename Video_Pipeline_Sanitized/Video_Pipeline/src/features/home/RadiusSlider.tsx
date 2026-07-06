"use client";

import { useRef, useEffect } from "react";
import { SlidersHorizontal, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  radius: number;
  onChange: (r: number) => void;
  hasLocation: boolean;
  open: boolean;
  onToggle: () => void;
}

const QUICK_VALUES = [50, 100, 150, 200, 300];

export function RadiusSlider({ radius, onChange, hasLocation, open, onToggle }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onToggle();
    };
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open, onToggle]);

  return (
    <div ref={ref}>
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between bg-[#161622] border border-[#2a2a3e] rounded-2xl px-4 py-2.5 hover:border-[#7c3aed]/40 transition-all"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-[#7c3aed]/15 flex items-center justify-center">
            <SlidersHorizontal className="w-3.5 h-3.5 text-[#a78bfa]" />
          </div>
          <div className="text-left">
            <p className="text-xs font-semibold text-white">Explore radius</p>
            <p className="text-[10px] text-[#555577]">
              {radius < 300
                ? `Showing places within ${radius} km`
                : "Showing all Karnataka"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-[#a78bfa]">
            {radius < 300 ? `${radius} km` : "All"}
          </span>
          <ChevronRight
            className={cn(
              "w-4 h-4 text-[#555577] transition-transform",
              open && "rotate-90"
            )}
          />
        </div>
      </button>

      {open && (
        <div className="mt-2 bg-[#161622] border border-[#2a2a3e] rounded-2xl px-5 py-5 fade-up">
          <div className="flex justify-between items-center mb-4">
            <span className="text-xs text-[#555577]">5 km</span>
            <div className="text-center">
              <p className="text-2xl font-bold text-white">
                {radius < 300 ? `${radius}` : "All"}
              </p>
              <p className="text-[10px] text-[#555577]">
                {radius < 300 ? "kilometres" : "Karnataka"}
              </p>
            </div>
            <span className="text-xs text-[#555577]">300 km</span>
          </div>

          <input
            type="range"
            min={5}
            max={300}
            step={5}
            value={radius}
            onChange={e => onChange(parseInt(e.target.value))}
            className="w-full"
            style={{ accentColor: "#7c3aed" }}
          />

          {/* Quick pick buttons */}
          <div className="flex justify-between mt-2">
            {QUICK_VALUES.map(v => (
              <button
                key={v}
                onClick={() => onChange(v)}
                className={cn(
                  "text-[9px] px-1.5 py-0.5 rounded-md transition-all font-semibold",
                  radius === v
                    ? "bg-[#7c3aed] text-white"
                    : "text-[#555577] hover:text-white"
                )}
              >
                {v === 300 ? "All" : `${v}`}
              </button>
            ))}
          </div>

          <p className="text-[10px] text-[#555577] text-center mt-3">
            {!hasLocation
              ? "⚠️ Enable location permission for radius filtering"
              : radius < 300
                ? `ROAM will show videos from within ${radius} km of you`
                : "ROAM will show videos from all of Karnataka"}
          </p>
        </div>
      )}
    </div>
  );
}
