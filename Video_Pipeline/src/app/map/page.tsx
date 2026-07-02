"use client";

import { MapPin } from "lucide-react";
import { BottomNav } from "@/components/layout/BottomNav";

export default function MapPage() {
  return (
    <div className="min-h-dvh bg-[#0d0d16] flex flex-col items-center justify-center pb-24">
      <div className="w-16 h-16 rounded-2xl bg-[#7c3aed] flex items-center justify-center mb-4 shadow-xl shadow-purple-900/40">
        <MapPin className="w-8 h-8 text-white" />
      </div>
      <h2 className="text-lg font-bold text-white mb-2">Map Explorer</h2>
      <p className="text-sm text-[#555577] text-center px-10">
        Interactive map with place pins, clusters, and nearby discovery is coming in V2.
      </p>
      <div className="mt-6 bg-[#161622] border border-[#2a2a3e] rounded-2xl px-5 py-3 mx-6">
        <p className="text-xs text-[#a78bfa] text-center">💡 Use the Nearby tab in ROAM to explore by distance right now</p>
      </div>
      <BottomNav />
    </div>
  );
}
