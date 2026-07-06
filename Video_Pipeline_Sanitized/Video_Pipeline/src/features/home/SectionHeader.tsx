"use client";

import { ChevronRight } from "lucide-react";

interface Props {
  title: string;
  sub: string;
  onSeeAll?: () => void;
}

export function SectionHeader({ title, sub, onSeeAll }: Props) {
  return (
    <div className="flex items-start justify-between px-4 mb-3">
      <div>
        <h2 className="text-sm font-black text-white">{title}</h2>
        <p className="text-[11px] text-[#555577] mt-0.5">{sub}</p>
      </div>
      {onSeeAll && (
        <button
          onClick={onSeeAll}
          className="flex items-center gap-0.5 text-xs text-[#a78bfa] font-semibold"
        >
          See all <ChevronRight className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}
