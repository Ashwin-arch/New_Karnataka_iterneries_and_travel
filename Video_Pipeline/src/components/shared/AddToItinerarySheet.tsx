"use client";

import { useEffect, useState } from "react";
import { X, Plus, Check, Route, Loader2, ChevronRight } from "lucide-react";
import { IItinerary, IVideo } from "@/types";
import { cn, formatDate } from "@/lib/utils";

interface Props {
  video: IVideo;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (msg: string) => void;
}

export function AddToItinerarySheet({ video, isOpen, onClose, onSuccess }: Props) {
  const [itineraries, setItineraries] = useState<IItinerary[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [addingTo, setAddingTo] = useState<string | null>(null);
  const [added, setAdded] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    fetch("/api/itineraries")
      .then(r => r.json())
      .then(d => { if (d.success) setItineraries(d.data.itineraries); })
      .finally(() => setLoading(false));
  }, [isOpen]);

  const addToItinerary = async (itinId: string) => {
    setAddingTo(itinId);
    try {
      const res = await fetch(`/api/itineraries/${itinId}/places`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          videoId: video._id,
          placeName: video.placeName,
          district: video.district,
          thumbnailUrl: video.thumbnailUrl,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setAdded(prev => new Set([...prev, itinId]));
        onSuccess(`Added to "${itineraries.find(i => i._id === itinId)?.title}"`);
      }
    } finally {
      setAddingTo(null);
    }
  };

  const createAndAdd = async () => {
    if (!newTitle.trim()) return;
    setCreating(true);
    try {
      const res = await fetch("/api/itineraries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTitle.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        const itin = data.data.itinerary;
        setItineraries(prev => [itin, ...prev]);
        setNewTitle("");
        await addToItinerary(itin._id);
      }
    } finally {
      setCreating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]" onClick={onClose} />
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] z-[101] slide-up">
        <div className="bg-[#161622] rounded-t-3xl border-t border-[#2a2a3e] max-h-[75dvh] flex flex-col">
          {/* Handle */}
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 rounded-full bg-[#2a2a3e]" />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-[#1e1e2e]">
            <div>
              <h3 className="text-base font-bold text-white">Add to trip</h3>
              <p className="text-xs text-[#555577] mt-0.5 truncate max-w-[240px]">{video.placeName}, {video.district}</p>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-[#1e1e2e] flex items-center justify-center">
              <X className="w-4 h-4 text-[#9ca3af]" />
            </button>
          </div>

          {/* Create new input */}
          <div className="px-5 py-4 border-b border-[#1e1e2e]">
            <div className="flex gap-2">
              <input
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                onKeyDown={e => e.key === "Enter" && createAndAdd()}
                placeholder="Create new trip..."
                className="flex-1 bg-[#0d0d16] border border-[#2a2a3e] rounded-xl px-4 py-2.5 text-sm text-white placeholder-[#555577] focus:border-[#7c3aed] transition-all"
              />
              <button
                onClick={createAndAdd}
                disabled={!newTitle.trim() || creating}
                className="w-10 h-10 rounded-xl bg-[#7c3aed] disabled:opacity-40 flex items-center justify-center flex-shrink-0"
              >
                {creating ? <Loader2 className="w-4 h-4 text-white animate-spin" /> : <Plus className="w-4 h-4 text-white" />}
              </button>
            </div>
          </div>

          {/* Existing itineraries */}
          <div className="flex-1 overflow-y-auto px-5 py-3 space-y-2">
            {loading ? (
              <> {[1,2,3].map(i => <div key={i} className="h-16 skeleton" />)} </>
            ) : itineraries.length === 0 ? (
              <div className="py-8 text-center">
                <Route className="w-8 h-8 text-[#2a2a3e] mx-auto mb-2" />
                <p className="text-sm text-[#555577]">No trips yet — create your first one above</p>
              </div>
            ) : (
              itineraries.map(itin => {
                const isAdded = added.has(itin._id);
                const isAdding = addingTo === itin._id;
                return (
                  <button
                    key={itin._id}
                    onClick={() => !isAdded && addToItinerary(itin._id)}
                    className={cn(
                      "w-full flex items-center gap-3 p-3 rounded-2xl border transition-all text-left",
                      isAdded
                        ? "bg-[#7c3aed]/10 border-[#7c3aed]/40"
                        : "bg-[#0d0d16] border-[#2a2a3e] hover:border-[#7c3aed]/40 active:opacity-70"
                    )}
                  >
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
                      isAdded ? "bg-[#7c3aed]" : "bg-[#1e1e2e]"
                    )}>
                      {isAdding
                        ? <Loader2 className="w-4 h-4 text-white animate-spin" />
                        : isAdded
                          ? <Check className="w-4 h-4 text-white" />
                          : <Route className="w-4 h-4 text-[#555577]" />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn("text-sm font-semibold truncate", isAdded ? "text-[#a78bfa]" : "text-white")}>{itin.title}</p>
                      <p className="text-[11px] text-[#555577] mt-0.5">{itin.places?.length || 0} places · {formatDate(itin.updatedAt)}</p>
                    </div>
                    {!isAdded && <ChevronRight className="w-4 h-4 text-[#2a2a3e]" />}
                    {isAdded && <span className="text-[10px] text-[#a78bfa] font-medium">Added</span>}
                  </button>
                );
              })
            )}
          </div>
          <div className="h-6" />
        </div>
      </div>
    </>
  );
}
