"use client";

import { cn } from "@/lib/utils";

const TABS = ["For you", "Nearby", "Following"] as const;
export type FeedTab = typeof TABS[number];

interface Props {
  active: FeedTab;
  onChange: (tab: FeedTab) => void;
}

export function FeedTabs({ active, onChange }: Props) {
  return (
    <div className="flex gap-6">
      {TABS.map(tab => (
        <button
          key={tab}
          onClick={() => onChange(tab)}
          className={cn(
            "text-sm font-black pb-1 border-b-2 transition-all",
            active === tab
              ? "text-white border-white"
              : "text-white/40 border-transparent"
          )}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}
