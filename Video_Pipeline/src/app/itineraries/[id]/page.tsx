"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft, MapPin, Share2, Trash2, Edit3,
  Check, X, Loader2, Plus, Link, Navigation
} from "lucide-react";
import { IItinerary } from "@/types";
import { useToast } from "@/hooks/useToast";
import { ToastContainer } from "@/components/ui/Toast";
import { formatDate, cn } from "@/lib/utils";

export default function ItineraryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id     = params.id as string;

  const [itin, setItin]         = useState<IItinerary | null>(null);
  const [loading, setLoading]   = useState(true);
  const [editing, setEditing]   = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [saving, setSaving]     = useState(false);
  const [removingIdx, setRemovingIdx] = useState<number | null>(null);
  const { toasts, removeToast, toast } = useToast();

  useEffect(() => {
    fetch(`/api/itineraries/${id}`)
      .then(r => r.json())
      .then(d => {
        if (d.success) {
          setItin(d.data.itinerary);
          setEditTitle(d.data.itinerary.title);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  const saveTitle = async () => {
    if (!editTitle.trim() || !itin) return;
    setSaving(true);
    try {
      const res  = await fetch(`/api/itineraries/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: editTitle.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setItin(data.data.itinerary);
        setEditing(false);
        toast.success("Trip renamed!");
      }
    } finally {
      setSaving(false);
    }
  };

  const toggleShare = async () => {
    if (!itin) return;
    const res  = await fetch(`/api/itineraries/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isShared: !itin.isShared }),
    });
    const data = await res.json();
    if (data.success) {
      setItin(data.data.itinerary);
      if (data.data.itinerary.isShared) {
        const url = `${window.location.origin}/itineraries/${id}`;
        if (navigator.share) {
          await navigator.share({ title: itin.title, url });
        } else {
          await navigator.clipboard.writeText(url);
          toast.success("Share link copied!");
        }
      } else {
        toast.info("Trip is now private");
      }
    }
  };

  const removePlace = async (videoId: string, idx: number) => {
    setRemovingIdx(idx);
    try {
      const res  = await fetch(`/api/itineraries/${id}/places`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoId }),
      });
      const data = await res.json();
      if (data.success) {
        setItin(data.data.itinerary);
        toast.success("Place removed from trip");
      }
    } finally {
      setRemovingIdx(null);
    }
  };

  const openMaps = (lat?: number, lon?: number) => {
    if (!lat || !lon) { toast.info("No coordinates for this place"); return; }
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}`, "_blank");
  };

  if (loading) {
    return (
      <div className="min-h-dvh bg-[#0d0d16] flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-[#7c3aed] animate-spin" />
      </div>
    );
  }

  if (!itin) {
    return (
      <div className="min-h-dvh bg-[#0d0d16] flex flex-col items-center justify-center px-8 text-center">
        <div className="text-5xl mb-4">😕</div>
        <p className="text-base font-bold text-white mb-1">Trip not found</p>
        <button onClick={() => router.back()} className="text-[#a78bfa] text-sm font-semibold mt-2">
          ← Go back
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-[#0d0d16] pb-10">

      {/* ── Header ── */}
      <div className="bg-gradient-to-b from-[#120827] to-[#0d0d16] px-4 pt-14 pb-6">
        {/* Back + actions */}
        <div className="flex items-center justify-between mb-5">
          <button
            onClick={() => router.back()}
            className="w-9 h-9 rounded-xl bg-[#161622] border border-[#2a2a3e] flex items-center justify-center"
          >
            <ArrowLeft className="w-4 h-4 text-white" />
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleShare}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-bold transition-all",
                itin.isShared
                  ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-400"
                  : "bg-[#161622] border-[#2a2a3e] text-[#9ca3af]"
              )}
            >
              {itin.isShared
                ? <><Check className="w-3.5 h-3.5" /> Shared</>
                : <><Share2 className="w-3.5 h-3.5" /> Share</>
              }
            </button>
            <button
              onClick={() => setEditing(true)}
              className="w-9 h-9 rounded-xl bg-[#161622] border border-[#2a2a3e] flex items-center justify-center"
            >
              <Edit3 className="w-4 h-4 text-[#9ca3af]" />
            </button>
          </div>
        </div>

        {/* Title */}
        {editing ? (
          <div className="flex items-center gap-2">
            <input
              value={editTitle}
              onChange={e => setEditTitle(e.target.value)}
              onKeyDown={e => e.key === "Enter" && saveTitle()}
              autoFocus
              className="flex-1 bg-[#161622] border border-[#7c3aed] rounded-xl px-4 py-2.5 text-sm font-bold text-white focus:ring-1 focus:ring-[#7c3aed]/30"
            />
            <button
              onClick={saveTitle}
              disabled={saving}
              className="w-9 h-9 rounded-xl bg-[#7c3aed] flex items-center justify-center"
            >
              {saving
                ? <Loader2 className="w-4 h-4 text-white animate-spin" />
                : <Check className="w-4 h-4 text-white" />
              }
            </button>
            <button
              onClick={() => { setEditing(false); setEditTitle(itin.title); }}
              className="w-9 h-9 rounded-xl bg-[#161622] border border-[#2a2a3e] flex items-center justify-center"
            >
              <X className="w-4 h-4 text-[#9ca3af]" />
            </button>
          </div>
        ) : (
          <h1 className="text-2xl font-black text-white leading-tight">{itin.title}</h1>
        )}

        {itin.description && (
          <p className="text-sm text-[#9ca3af] mt-1.5">{itin.description}</p>
        )}

        {/* Meta */}
        <div className="flex items-center gap-3 mt-3">
          <div className="flex items-center gap-1.5 text-xs text-[#555577]">
            <MapPin className="w-3.5 h-3.5" />
            <span>{itin.places?.length || 0} places</span>
          </div>
          <div className="text-xs text-[#555577]">
            Updated {formatDate(itin.updatedAt)}
          </div>
          {itin.isShared && (
            <div className="flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-2.5 py-0.5">
              <Link className="w-2.5 h-2.5 text-emerald-400" />
              <span className="text-[9px] text-emerald-400 font-black">Public link active</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Places list ── */}
      <div className="px-4">
        {(!itin.places || itin.places.length === 0) ? (
          <div className="py-16 text-center">
            <div className="text-5xl mb-4">📍</div>
            <p className="text-sm font-black text-white mb-1">No places yet</p>
            <p className="text-xs text-[#555577] mb-6">
              Add places from the ROAM feed or place pages
            </p>
            <button
              onClick={() => router.push("/explore")}
              className="flex items-center gap-2 bg-[#7c3aed] text-white font-black px-5 py-2.5 rounded-xl mx-auto"
            >
              <Plus className="w-4 h-4" />
              Browse ROAM feed
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {itin.places.map((place, idx) => (
              <div
                key={`${place.videoId}-${idx}`}
                className="bg-[#161622] border border-[#2a2a3e] rounded-2xl overflow-hidden"
              >
                <div className="flex items-center gap-3 p-3">
                  {/* Rank */}
                  <div className="w-8 h-8 rounded-xl bg-[#7c3aed]/15 border border-[#7c3aed]/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-black text-[#a78bfa]">{idx + 1}</span>
                  </div>

                  {/* Thumbnail */}
                  <div className="w-14 h-14 rounded-xl overflow-hidden bg-[#1e1e2e] flex-shrink-0">
                    {place.thumbnailUrl ? (
                      <img src={place.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <MapPin className="w-5 h-5 text-[#2a2a3e]" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div
                    className="flex-1 min-w-0 cursor-pointer"
                    onClick={() => router.push(`/place/${place.videoId}`)}
                  >
                    <p className="text-sm font-bold text-white truncate">{place.placeName}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3 text-[#555577]" />
                      <span className="text-xs text-[#555577]">{place.district}</span>
                    </div>
                    <p className="text-[10px] text-[#555577] mt-0.5">
                      Added {formatDate(place.addedAt)}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-1.5 flex-shrink-0">
                    <button
                      onClick={() => openMaps()}
                      className="w-8 h-8 rounded-lg bg-[#1e1e2e] border border-[#2a2a3e] flex items-center justify-center active:opacity-70"
                    >
                      <Navigation className="w-3.5 h-3.5 text-[#a78bfa]" />
                    </button>
                    <button
                      onClick={() => removePlace(String(place.videoId), idx)}
                      disabled={removingIdx === idx}
                      className="w-8 h-8 rounded-lg bg-[#1e1e2e] border border-[#2a2a3e] flex items-center justify-center active:opacity-70 disabled:opacity-40 hover:border-rose-500/30 transition-all"
                    >
                      {removingIdx === idx
                        ? <Loader2 className="w-3.5 h-3.5 text-[#555577] animate-spin" />
                        : <Trash2 className="w-3.5 h-3.5 text-[#555577]" />
                      }
                    </button>
                  </div>
                </div>

                {/* Notes (if any) */}
                {place.notes && (
                  <div className="px-3 pb-3">
                    <p className="text-[11px] text-[#555577] italic bg-[#0d0d16] rounded-lg px-3 py-2">
                      {place.notes}
                    </p>
                  </div>
                )}
              </div>
            ))}

            {/* Add more CTA */}
            <button
              onClick={() => router.push("/explore")}
              className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-[#7c3aed]/25 rounded-2xl py-4 text-sm font-bold text-[#a78bfa] bg-[#7c3aed]/5 hover:bg-[#7c3aed]/8 transition-all active:scale-[0.98] mt-2"
            >
              <Plus className="w-4 h-4" />
              Add more places from ROAM
            </button>
          </div>
        )}
      </div>

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
