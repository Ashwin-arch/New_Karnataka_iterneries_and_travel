"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Plus, MapPin, ChevronRight, Loader2 } from "lucide-react";
import { IItinerary } from "@/types";
import { useAuth } from "@/features/auth/AuthContext";
import { BottomNav } from "@/components/layout/BottomNav";
import { ItineraryCard } from "@/features/itineraries/ItineraryCard";
import { CreateItineraryModal } from "@/features/itineraries/CreateItineraryModal";
import { EmptyState } from "@/features/itineraries/EmptyState";
import { useToast } from "@/hooks/useToast";
import { ToastContainer } from "@/components/ui/Toast";
import { cn } from "@/lib/utils";

type Tab = "trips" | "saved";

interface SavedItem {
  _id: string;
  videoId: {
    _id: string; title: string; placeName: string;
    district: string; thumbnailUrl?: string;
  };
}

export default function ItinerariesPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [itineraries, setItineraries] = useState<IItinerary[]>([]);
  const [loading, setLoading]         = useState(true);
  const [activeTab, setActiveTab]     = useState<Tab>("trips");
  const [showCreate, setShowCreate]   = useState(false);
  const [deletingId, setDeletingId]   = useState<string | null>(null);
  const { toasts, removeToast, toast } = useToast();

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [user, authLoading, router]);

  const fetchItineraries = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch("/api/itineraries");
      const data = await res.json();
      if (data.success) setItineraries(data.data.itineraries);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) fetchItineraries();
  }, [user, fetchItineraries]);

  // ── Handlers ──────────────────────────────────────────────────────
  const handleCreate = async (title: string, description: string) => {
    const res  = await fetch("/api/itineraries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, description }),
    });
    const data = await res.json();
    if (data.success) {
      setItineraries(prev => [data.data.itinerary, ...prev]);
      setShowCreate(false);
      toast.success("Trip created!");
    } else {
      toast.error(data.error || "Failed to create");
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Delete "${title}"?`)) return;
    setDeletingId(id);
    try {
      await fetch(`/api/itineraries/${id}`, { method: "DELETE" });
      setItineraries(prev => prev.filter(i => i._id !== id));
      toast.success("Trip deleted");
    } finally {
      setDeletingId(null);
    }
  };

  const handleShare = async (itin: IItinerary) => {
    try {
      const res  = await fetch(`/api/itineraries/${itin._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isShared: !itin.isShared }),
      });
      const data = await res.json();
      if (data.success) {
        setItineraries(prev => prev.map(i => i._id === itin._id ? data.data.itinerary : i));
        if (data.data.itinerary.isShared) {
          const url = `${window.location.origin}/itineraries/${itin._id}`;
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
    } catch {
      toast.error("Failed to share");
    }
  };

  // ── Auth guard ─────────────────────────────────────────────────────
  if (authLoading) {
    return (
      <div className="h-dvh flex items-center justify-center bg-[#0d0d16]">
        <Loader2 className="w-6 h-6 text-[#7c3aed] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-[#0d0d16] pb-28">

      {/* ── Header ── */}
      <div className="bg-gradient-to-b from-[#0f0a1f] to-[#0d0d16] px-4 pt-14 pb-5">
        <div className="flex items-center justify-between mb-1">
          <div>
            <h1 className="text-2xl font-black text-white">My Trips</h1>
            <p className="text-xs text-[#555577] mt-0.5">Plan your Karnataka journey</p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="w-11 h-11 rounded-2xl bg-[#7c3aed] flex items-center justify-center shadow-lg shadow-purple-900/40 active:scale-[0.95] transition-all"
          >
            <Plus className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex bg-[#161622] border border-[#2a2a3e] rounded-2xl p-1 gap-1 mt-4">
          {(["trips", "saved"] as Tab[]).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "flex-1 py-2.5 rounded-xl text-xs font-black transition-all",
                activeTab === tab
                  ? "bg-[#7c3aed] text-white shadow-lg shadow-purple-900/30"
                  : "text-[#555577]"
              )}
            >
              {tab === "trips"
                ? `Trips (${itineraries.length})`
                : "Saved places"}
            </button>
          ))}
        </div>
      </div>

      {/* ── Body ── */}
      <div className="px-4 pt-2">

        {/* Trips tab */}
        {activeTab === "trips" && (
          <>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-28 skeleton rounded-2xl" />
                ))}
              </div>
            ) : itineraries.length === 0 ? (
              <EmptyState tab="trips" onCreate={() => setShowCreate(true)} />
            ) : (
              <div className="space-y-3">
                {itineraries.map(itin => (
                  <ItineraryCard
                    key={itin._id}
                    itin={itin}
                    onOpen={() => router.push(`/itineraries/${itin._id}`)}
                    onShare={() => handleShare(itin)}
                    onDelete={() => handleDelete(itin._id, itin.title)}
                    deleting={deletingId === itin._id}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {/* Saved tab */}
        {activeTab === "saved" && <SavedPlacesTab />}
      </div>

      {/* Create modal */}
      {showCreate && (
        <CreateItineraryModal
          onClose={() => setShowCreate(false)}
          onCreate={handleCreate}
        />
      )}

      <ToastContainer toasts={toasts} onRemove={removeToast} />
      <BottomNav />
    </div>
  );
}

// ── Saved Places sub-tab ──────────────────────────────────────────────
function SavedPlacesTab() {
  const router = useRouter();
  const [saved, setSaved]   = useState<SavedItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/videos/saved")
      .then(r => r.json())
      .then(d => { if (d.success) setSaved(d.data.saved); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-20 skeleton rounded-2xl" />
        ))}
      </div>
    );
  }

  if (saved.length === 0) {
    return <EmptyState tab="saved" />;
  }

  return (
    <div className="space-y-3">
      {saved.map(item => {
        const v = item.videoId;
        if (!v || typeof v !== "object") return null;
        return (
          <button
            key={item._id}
            onClick={() => router.push(`/place/${v._id}`)}
            className="w-full flex items-center gap-3 bg-[#161622] border border-[#2a2a3e] rounded-2xl p-3 text-left active:opacity-70 transition-all hover:border-[#7c3aed]/20"
          >
            <div className="w-14 h-14 rounded-xl overflow-hidden bg-[#1e1e2e] flex-shrink-0">
              {v.thumbnailUrl ? (
                <img src={v.thumbnailUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xl">🎬</div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white truncate">{v.title}</p>
              <div className="flex items-center gap-1 mt-0.5">
                <MapPin className="w-3 h-3 text-[#555577]" />
                <span className="text-xs text-[#555577] truncate">
                  {v.placeName}, {v.district}
                </span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-[#2a2a3e] flex-shrink-0" />
          </button>
        );
      })}
    </div>
  );
}
