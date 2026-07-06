"use client";

import { Route, Plus } from "lucide-react";

interface Props {
  tab: "trips" | "saved";
  onCreate?: () => void;
}

export function EmptyState({ tab, onCreate }: Props) {
  if (tab === "saved") {
    return (
      <div className="py-16 flex flex-col items-center text-center">
        <div className="text-5xl mb-4">🔖</div>
        <p className="text-sm font-black text-white mb-1">No saved places yet</p>
        <p className="text-xs text-[#555577] max-w-[220px]">
          Bookmark videos from the ROAM feed to save places here
        </p>
      </div>
    );
  }

  return (
    <div className="py-16 flex flex-col items-center text-center">
      <div className="w-20 h-20 rounded-3xl bg-[#161622] border border-[#2a2a3e] flex items-center justify-center mb-5">
        <Route className="w-9 h-9 text-[#2a2a3e]" />
      </div>
      <h2 className="text-base font-black text-white mb-2">No trips yet</h2>
      <p className="text-sm text-[#555577] mb-6 max-w-[220px]">
        Save places from videos and organise them into your own Karnataka journeys
      </p>
      {onCreate && (
        <button
          onClick={onCreate}
          className="flex items-center gap-2 bg-[#7c3aed] text-white font-black px-6 py-3 rounded-2xl shadow-lg shadow-purple-900/30 active:scale-[0.97] transition-all"
        >
          <Plus className="w-4 h-4" />
          Create your first trip
        </button>
      )}
    </div>
  );
}
