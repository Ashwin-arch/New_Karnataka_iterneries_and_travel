"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft, MapPin, Share2, Bookmark, Play,
  Eye, Heart, MessageCircle, Navigation,
  Footprints, Car, Bike, Bus, Loader2,
  CheckCircle2
} from "lucide-react";
import { IVideo, TRAVEL_MODES } from "@/types";
import { CATEGORIES } from "@/constants";
import { formatCount, formatRelativeTime, cn } from "@/lib/utils";
import { AddToItinerarySheet } from "@/components/shared/AddToItinerarySheet";
import { useToast } from "@/hooks/useToast";
import { ToastContainer } from "@/components/ui/Toast";

const TRAVEL_ICONS: Record<string, React.ElementType> = {
  walk: Footprints, bike: Bike, car: Car, public: Bus,
};

export default function PlacePage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [video, setVideo] = useState<IVideo | null>(null);
  const [loading, setLoading] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [saved, setSaved] = useState(false);
  const [liked, setLiked] = useState(false);
  const [showItinerary, setShowItinerary] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [selectedTravel, setSelectedTravel] = useState(TRAVEL_MODES[2]);
  const { toasts, removeToast, toast } = useToast();

  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(
      pos => setUserLocation({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      () => {}
    );
  }, []);

  useEffect(() => {
    fetch(`/api/videos/${id}`)
      .then(r => r.json())
      .then(d => { if (d.success) setVideo(d.data.video); })
      .catch(() => {})
      .finally(() => setLoading(false));

    fetch(`/api/videos/save?videoId=${id}`)
      .then(r => r.json())
      .then(d => { if (d.success) setSaved(d.data.saved); });
  }, [id]);

  const handleSave = useCallback(async () => {
    try {
      const res = await fetch("/api/videos/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoId: id }),
      });
      const data = await res.json();
      if (data.success) {
        setSaved(data.data.saved);
        toast.success(data.data.saved ? "Saved to your collection!" : "Removed from saved");
      } else if (res.status === 401) {
        toast.error("Sign in to save places");
        router.push("/login");
      }
    } catch { toast.error("Failed"); }
  }, [id, toast, router]);

  const handleShare = useCallback(async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: video?.title, text: `${video?.title} — ${video?.placeName}, ${video?.district}`, url });
      } else {
        await navigator.clipboard.writeText(url);
        toast.success("Link copied to clipboard!");
      }
    } catch { /* cancelled */ }
  }, [video, toast]);

  const openMaps = useCallback(() => {
    if (!video?.latitude || !video?.longitude) {
      toast.info("Location coordinates not available for this place");
      return;
    }
    const url = `https://www.google.com/maps/dir/?api=1&destination=${video.latitude},${video.longitude}`;
    window.open(url, "_blank");
  }, [video, toast]);

  // Distance calculation
  const distanceKm = (() => {
    if (!userLocation || !video?.latitude || !video?.longitude) return null;
    const R = 6371;
    const dLat = ((video.latitude - userLocation.lat) * Math.PI) / 180;
    const dLon = ((video.longitude - userLocation.lon) * Math.PI) / 180;
    const a = Math.sin(dLat/2)**2 + Math.cos(userLocation.lat*Math.PI/180)*Math.cos(video.latitude*Math.PI/180)*Math.sin(dLon/2)**2;
    return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)) * 10) / 10;
  })();

  const travelTime = distanceKm ? Math.round((distanceKm / selectedTravel.speedKmh) * 60) : null;
  const formatTime = (m: number) => m < 60 ? `${m} min` : `${Math.floor(m/60)}h ${m%60 ? `${m%60}m` : ""}`;

  const creator = video ? (typeof video.creatorId === "object" ? video.creatorId as { fullName: string; profileImage?: string; isVerified?: boolean; district?: string; bio?: string } : null) : null;
  const category = video ? CATEGORIES.find(c => c.value === video.category) : null;

  if (loading) {
    return (
      <div className="min-h-dvh bg-[#0d0d16] flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-[#7c3aed] animate-spin" />
      </div>
    );
  }

  if (!video) {
    return (
      <div className="min-h-dvh bg-[#0d0d16] flex flex-col items-center justify-center px-8 text-center">
        <div className="text-5xl mb-4">😕</div>
        <h2 className="text-lg font-bold text-white mb-2">Place not found</h2>
        <button onClick={() => router.back()} className="text-[#a78bfa] text-sm font-medium mt-2">Go back</button>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-[#0d0d16] pb-10">
      {/* Hero video/thumbnail */}
      <div className="relative w-full aspect-[9/16] max-h-[65dvh] bg-black overflow-hidden">
        {playing ? (
          <video
            src={video.videoUrl}
            className="w-full h-full object-cover"
            autoPlay
            controls
            playsInline
          />
        ) : (
          <>
            {video.thumbnailUrl
              ? <img src={video.thumbnailUrl} alt={video.title} className="w-full h-full object-cover" />
              : <div className="w-full h-full bg-gradient-to-b from-[#1e1e2e] to-[#0d0d16] flex items-center justify-center">
                  <Play className="w-12 h-12 text-[#2a2a3e]" />
                </div>
            }
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30" />
            {/* Play button */}
            <button
              onClick={() => setPlaying(true)}
              className="absolute inset-0 flex items-center justify-center"
            >
              <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center">
                <Play className="w-7 h-7 text-white fill-white ml-1" />
              </div>
            </button>
          </>
        )}

        {/* Top nav */}
        <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 pt-12">
          <button
            onClick={() => router.back()}
            className="w-9 h-9 rounded-full glass border border-white/20 flex items-center justify-center"
          >
            <ArrowLeft className="w-4 h-4 text-white" />
          </button>
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              className={cn(
                "w-9 h-9 rounded-full glass border flex items-center justify-center transition-all",
                saved ? "border-[#a78bfa] bg-[#7c3aed]/30" : "border-white/20"
              )}
            >
              <Bookmark className={cn("w-4 h-4 transition-all", saved ? "text-[#a78bfa] fill-[#a78bfa]" : "text-white")} />
            </button>
            <button
              onClick={handleShare}
              className="w-9 h-9 rounded-full glass border border-white/20 flex items-center justify-center"
            >
              <Share2 className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>

        {/* Category badge */}
        {category && (
          <div className="absolute bottom-4 left-4">
            <span className="glass border border-white/15 rounded-full px-3 py-1 text-xs font-semibold text-white">
              {category.emoji} {category.label}
            </span>
          </div>
        )}

        {/* Stats */}
        <div className="absolute bottom-4 right-4 flex items-center gap-3">
          <div className="flex items-center gap-1 glass border border-white/10 rounded-full px-2.5 py-1">
            <Eye className="w-3 h-3 text-white/60" />
            <span className="text-[10px] text-white/80 font-medium">{formatCount(video.views)}</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 pt-5">
        {/* Title + Place */}
        <h1 className="text-xl font-bold text-white leading-snug mb-2">{video.title}</h1>
        <div className="flex items-center gap-2 mb-4">
          <MapPin className="w-4 h-4 text-[#a78bfa] flex-shrink-0" />
          <span className="text-sm text-[#9ca3af]">{video.placeName}, {video.district}</span>
        </div>

        {/* Distance + Travel modes */}
        {distanceKm !== null && (
          <div className="bg-[#161622] border border-[#2a2a3e] rounded-2xl p-4 mb-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Navigation className="w-4 h-4 text-[#a78bfa]" />
                <span className="text-sm font-bold text-white">{distanceKm} km from you</span>
              </div>
              {travelTime && (
                <span className="text-sm font-semibold text-[#a78bfa]">
                  {selectedTravel.icon} {formatTime(travelTime)}
                </span>
              )}
            </div>
            <div className="grid grid-cols-4 gap-2">
              {TRAVEL_MODES.map(mode => {
                const ModeIcon = TRAVEL_ICONS[mode.mode] || Car;
                const mins = Math.round((distanceKm / mode.speedKmh) * 60);
                const isActive = selectedTravel.mode === mode.mode;
                return (
                  <button
                    key={mode.mode}
                    onClick={() => setSelectedTravel(mode)}
                    className={cn(
                      "flex flex-col items-center gap-1.5 py-3 rounded-xl border transition-all",
                      isActive ? "bg-[#7c3aed] border-[#7c3aed]" : "bg-[#0d0d16] border-[#2a2a3e] hover:border-[#7c3aed]/40"
                    )}
                  >
                    <ModeIcon className="w-4 h-4 text-white" />
                    <span className="text-[9px] text-white font-medium">{mode.label}</span>
                    <span className="text-[9px] text-white/50">{formatTime(mins)}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-3 mb-5">
          <button
            onClick={() => setShowItinerary(true)}
            className="flex-1 bg-[#7c3aed] text-white font-bold py-3.5 rounded-2xl flex items-center justify-center gap-2 active:scale-[0.97] transition-all"
          >
            <CheckCircle2 className="w-4 h-4" />
            Add to trip
          </button>
          <button
            onClick={openMaps}
            className="flex-1 bg-[#161622] border border-[#2a2a3e] text-white font-semibold py-3.5 rounded-2xl flex items-center justify-center gap-2 active:scale-[0.97] transition-all hover:border-[#7c3aed]/40"
          >
            <Navigation className="w-4 h-4 text-[#a78bfa]" />
            Get directions
          </button>
        </div>

        {/* Engagement row */}
        <div className="flex gap-3 mb-5">
          <button
            onClick={() => setLiked(l => !l)}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all",
              liked ? "bg-rose-500/10 border-rose-500/30 text-rose-400" : "bg-[#161622] border-[#2a2a3e] text-[#9ca3af]"
            )}
          >
            <Heart className={cn("w-4 h-4", liked && "fill-rose-400")} />
            <span className="text-sm font-semibold">{formatCount(video.likesCount + (liked ? 1 : 0))}</span>
          </button>
          <button
            onClick={handleSave}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all",
              saved ? "bg-[#7c3aed]/10 border-[#7c3aed]/30 text-[#a78bfa]" : "bg-[#161622] border-[#2a2a3e] text-[#9ca3af]"
            )}
          >
            <Bookmark className={cn("w-4 h-4", saved && "fill-[#a78bfa]")} />
            <span className="text-sm font-semibold">{formatCount(video.savesCount + (saved ? 1 : 0))}</span>
          </button>
          <button
            onClick={handleShare}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#161622] border border-[#2a2a3e] text-[#9ca3af] transition-all"
          >
            <Share2 className="w-4 h-4" />
            <span className="text-sm font-semibold">Share</span>
          </button>
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#161622] border border-[#2a2a3e] text-[#9ca3af]">
            <MessageCircle className="w-4 h-4" />
            <span className="text-sm font-semibold">{formatCount(video.commentsCount)}</span>
          </button>
        </div>

        {/* Description */}
        <div className="bg-[#161622] border border-[#2a2a3e] rounded-2xl p-4 mb-4">
          <h2 className="text-sm font-bold text-white mb-2">About this place</h2>
          <p className="text-sm text-[#9ca3af] leading-relaxed">{video.description}</p>
        </div>

        {/* Tags */}
        {video.tags?.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {video.tags.map(tag => (
              <span key={tag} className="text-xs bg-[#161622] border border-[#2a2a3e] text-[#9ca3af] px-3 py-1.5 rounded-full">
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Creator card */}
        {creator && (
          <div className="bg-[#161622] border border-[#2a2a3e] rounded-2xl p-4 mb-4">
            <h2 className="text-xs font-bold text-[#555577] uppercase mb-3">Story by</h2>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#7c3aed] to-[#4c1d95] flex items-center justify-center text-lg font-bold text-white flex-shrink-0">
                {creator.fullName?.[0] || "C"}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-sm font-bold text-white">{creator.fullName}</p>
                  {creator.isVerified && (
                    <div className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center">
                      <span className="text-[7px] text-white font-bold">✓</span>
                    </div>
                  )}
                </div>
                {creator.district && (
                  <p className="text-xs text-[#555577] flex items-center gap-1 mt-0.5">
                    <MapPin className="w-2.5 h-2.5" />{creator.district}
                  </p>
                )}
                {creator.bio && <p className="text-xs text-[#9ca3af] mt-1 line-clamp-2">{creator.bio}</p>}
              </div>
            </div>
          </div>
        )}

        {/* Uploaded time */}
        <p className="text-xs text-[#555577] text-center">{formatRelativeTime(video.createdAt)}</p>
      </div>

      {/* Add to itinerary sheet */}
      {video && (
        <AddToItinerarySheet
          video={video}
          isOpen={showItinerary}
          onClose={() => setShowItinerary(false)}
          onSuccess={msg => toast.success(msg)}
        />
      )}

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
