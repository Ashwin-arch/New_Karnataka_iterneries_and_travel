"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Bookmark, Share2, MapPin, Volume2, VolumeX,
  Play, UserCircle2, Plus, Navigation,
  Footprints, Car, Bike, Bus, CloudRain, Sun
} from "lucide-react";
import { IVideo, TRAVEL_MODES } from "@/types";
import { formatCount, formatRelativeTime, cn } from "@/lib/utils";
import { CATEGORIES } from "@/constants";
import { AddToItinerarySheet } from "@/components/shared/AddToItinerarySheet";
import { ToastContainer } from "@/components/ui/Toast";
import { useToast } from "@/hooks/useToast";

const TRAVEL_ICONS: Record<string, React.ElementType> = {
  walk: Footprints, bike: Bike, car: Car, public: Bus,
};

interface Props {
  video: IVideo;
  isActive: boolean;
  userLocation?: { lat: number; lon: number } | null;
  scrollIndex?: number;
  totalCount?: number;
}

export function VideoCard({ video, isActive, userLocation, scrollIndex = 0, totalCount = 1 }: Props) {
  const router   = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);

  const [muted,        setMuted]        = useState(true);
  const [paused,       setPaused]       = useState(false);
  const [flashPlay,    setFlashPlay]    = useState(false);
  const [saved,        setSaved]        = useState(false);
  const [saveCount,    setSaveCount]    = useState(video.savesCount);
  const [liked,        setLiked]        = useState(false);
  const [likeCount,    setLikeCount]    = useState(video.likesCount);
  const [showItinerary,setShowItinerary]= useState(false);
  const [travelMode,   setTravelMode]   = useState(TRAVEL_MODES[2]); // car default
  const [showTravel,   setShowTravel]   = useState(false);
  const { toasts, removeToast, toast }  = useToast();

  const creator = typeof video.creatorId === "object"
    ? video.creatorId as { fullName: string; profileImage?: string; isVerified?: boolean }
    : null;
  const category = CATEGORIES.find(c => c.value === video.category);

  // Distance
  const distKm = video.distanceKm ?? (() => {
    if (!userLocation || !video.latitude || !video.longitude) return null;
    const R = 6371;
    const dLat = ((video.latitude  - userLocation.lat) * Math.PI) / 180;
    const dLon = ((video.longitude - userLocation.lon) * Math.PI) / 180;
    const a = Math.sin(dLat/2)**2
      + Math.cos(userLocation.lat*Math.PI/180)
      * Math.cos(video.latitude*Math.PI/180)
      * Math.sin(dLon/2)**2;
    return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)) * 10) / 10;
  })();

  const travelMins = distKm ? Math.round((distKm / travelMode.speedKmh) * 60) : null;
  const fmtTime    = (m: number) => m < 60 ? `${m}m` : `${Math.floor(m/60)}h${m%60 ? ` ${m%60}m` : ""}`;

  // Autoplay
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (isActive) { v.currentTime = 0; v.play().catch(()=>{}); setPaused(false); }
    else v.pause();
  }, [isActive]);

  // Check saved
  useEffect(() => {
    if (!video._id) return;
    fetch(`/api/videos/save?videoId=${video._id}`)
      .then(r => r.json())
      .then(d => { if (d.success) setSaved(d.data.saved); })
      .catch(()=>{});
  }, [video._id]);

  const togglePlay = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) { v.play(); setPaused(false); }
    else { v.pause(); setPaused(true); }
    setFlashPlay(true);
    setTimeout(() => setFlashPlay(false), 600);
  }, []);

  const handleSave = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res  = await fetch("/api/videos/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoId: video._id }),
      });
      const data = await res.json();
      if (data.success) {
        setSaved(data.data.saved);
        setSaveCount(c => data.data.saved ? c+1 : c-1);
        toast.success(data.data.saved ? "Saved!" : "Removed");
      } else if (res.status === 401) {
        toast.error("Sign in to save"); router.push("/login");
      }
    } catch { toast.error("Failed"); }
  }, [video._id, toast, router]);

  const handleShare = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `${window.location.origin}/place/${video._id}`;
    try {
      if (navigator.share) await navigator.share({ title: video.title, url });
      else { await navigator.clipboard.writeText(url); toast.success("Link copied!"); }
    } catch {}
  }, [video, toast]);

  return (
    <>
      {/* Full-screen reel card */}
      <div className="relative w-full h-dvh bg-black overflow-hidden select-none">

        {/* ── Video ── */}
        <video
          ref={videoRef}
          src={video.videoUrl}
          poster={video.thumbnailUrl}
          className="absolute inset-0 w-full h-full object-cover"
          loop muted={muted} playsInline
          onClick={togglePlay}
        />

        {/* ── Gradient overlays ── */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/5 to-black/35" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-transparent" />
        </div>

        {/* ── Play flash ── */}
        {flashPlay && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
            <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
              {paused
                ? <Play className="w-9 h-9 text-white fill-white" />
                : <Play className="w-9 h-9 text-white/0 fill-white/0" />
              }
            </div>
          </div>
        )}

        {/* ── TOP BAR: category badge + mute ── */}
        <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 pt-12 z-10 pointer-events-none">
          {category && (
            <span className="glass border border-white/10 rounded-full px-3 py-1 text-xs font-bold text-white pointer-events-auto">
              {category.emoji} {category.label}
            </span>
          )}
          <div className="flex items-center gap-2 pointer-events-auto">
            <button
              onClick={e => { e.stopPropagation(); if (videoRef.current) { videoRef.current.muted = !muted; setMuted(m=>!m); }}}
              className="w-9 h-9 rounded-full glass border border-white/10 flex items-center justify-center"
            >
              {muted ? <VolumeX className="w-4 h-4 text-white" /> : <Volume2 className="w-4 h-4 text-white" />}
            </button>
          </div>
        </div>

        {/* ── RIGHT SIDE ACTION RAIL ── */}
        <div className="absolute right-3 bottom-36 flex flex-col items-center gap-4 z-10">

          {/* Creator avatar */}
          <div className="flex flex-col items-center mb-1">
            <div className="w-12 h-12 rounded-2xl overflow-hidden border-2 border-white/70 bg-gradient-to-br from-purple-500 to-pink-500">
              {creator?.profileImage
                ? <img src={creator.profileImage} alt="" className="w-full h-full object-cover" />
                : creator?.fullName
                  ? <div className="w-full h-full flex items-center justify-center text-white font-black text-lg">{creator.fullName[0]}</div>
                  : <UserCircle2 className="w-full h-full text-white p-1" />
              }
            </div>
            {creator?.isVerified && (
              <div className="w-5 h-5 rounded-full bg-[#7c3aed] border-2 border-black flex items-center justify-center -mt-2.5">
                <span className="text-[8px] text-white font-black">✓</span>
              </div>
            )}
          </div>

          {/* Save */}
          <RailBtn
            onClick={handleSave}
            count={saveCount}
            label="Save"
            active={saved}
          >
            <Bookmark className={cn("w-[22px] h-[22px]", saved ? "text-[#a78bfa] fill-[#a78bfa]" : "text-white")} />
          </RailBtn>

          {/* Add to trip */}
          <RailBtn
            onClick={e => { e.stopPropagation(); setShowItinerary(true); }}
            label="Trip"
          >
            <Plus className="w-[22px] h-[22px] text-white" />
          </RailBtn>

          {/* View place */}
          <RailBtn
            onClick={e => { e.stopPropagation(); router.push(`/place/${video._id}`); }}
            label="Place"
          >
            <MapPin className="w-[22px] h-[22px] text-white" />
          </RailBtn>

          {/* Share */}
          <RailBtn onClick={handleShare} label="Share">
            <Share2 className="w-[22px] h-[22px] text-white" />
          </RailBtn>
        </div>

        {/* ── SCROLL DOTS ── */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex flex-col gap-1.5 z-10">
          {Array.from({ length: Math.min(totalCount, 5) }).map((_, i) => (
            <div key={i} className={cn(
              "rounded-full transition-all",
              i === scrollIndex % 5
                ? "w-[3px] h-3 bg-white rounded-full"
                : "w-[3px] h-[3px] bg-white/30 rounded-full"
            )} />
          ))}
        </div>

        {/* ── BOTTOM INFO ── */}
        <div className="absolute bottom-0 left-0 right-14 px-4 pb-24 z-10">

          {/* Creator row */}
          <div className="flex items-center gap-2 mb-2">
            <span className="text-white font-black text-sm">
              @{creator?.fullName?.replace(/\s+/g,"").toLowerCase() || "creator"}
            </span>
            {creator?.isVerified && (
              <div className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center">
                <span className="text-[7px] text-white font-black">✓</span>
              </div>
            )}
            <button className="ml-auto border border-white/35 rounded-full px-3 py-1 text-[11px] font-bold text-white glass">
              + Follow
            </button>
          </div>

          {/* Title */}
          <h2 className="text-white font-black text-[18px] leading-snug mb-2.5 line-clamp-2">
            {video.title}
          </h2>

          {/* Place pill */}
          <button
            onClick={e => { e.stopPropagation(); router.push(`/place/${video._id}`); }}
            className="flex items-center gap-1.5 glass border border-white/15 rounded-full px-3 py-1.5 mb-2 active:opacity-70"
          >
            <MapPin className="w-3 h-3 text-[#a78bfa]" />
            <span className="text-xs text-white font-medium">{video.placeName}, {video.district}</span>
          </button>

          {/* Weather + distance badge row */}
          <div className="flex items-center gap-2 mb-3">
            {distKm !== null && (
              <button
                onClick={e => { e.stopPropagation(); setShowTravel(t=>!t); }}
                className="flex items-center gap-1.5 glass border border-white/10 rounded-full px-3 py-1.5 text-xs"
              >
                <Navigation className="w-3 h-3 text-[#a78bfa]" />
                <span className="text-white font-bold">{distKm} km away</span>
                {travelMins && (
                  <>
                    <span className="text-white/40">·</span>
                    <span className="text-white/70">{travelMode.icon} {fmtTime(travelMins)}</span>
                  </>
                )}
              </button>
            )}
            {/* Fake weather badge for UI */}
            <div className="flex items-center gap-1 glass border border-amber-400/20 rounded-full px-2.5 py-1.5 text-[10px]">
              <Sun className="w-3 h-3 text-amber-300" />
              <span className="text-amber-200 font-bold">28°C</span>
            </div>
          </div>

          {/* Travel mode picker */}
          {showTravel && distKm !== null && (
            <div className="glass border border-white/10 rounded-2xl p-2.5 grid grid-cols-4 gap-1.5 mb-3">
              {TRAVEL_MODES.map(mode => {
                const ModeIcon = TRAVEL_ICONS[mode.mode] || Car;
                const mins     = Math.round((distKm / mode.speedKmh) * 60);
                const isOn     = travelMode.mode === mode.mode;
                return (
                  <button
                    key={mode.mode}
                    onClick={e => { e.stopPropagation(); setTravelMode(mode); setShowTravel(false); }}
                    className={cn(
                      "flex flex-col items-center gap-1 py-2 rounded-xl transition-all",
                      isOn ? "bg-[#7c3aed]" : "bg-white/8 hover:bg-white/12"
                    )}
                  >
                    <ModeIcon className="w-4 h-4 text-white" />
                    <span className="text-[8px] text-white font-bold">{mode.label}</span>
                    <span className="text-[8px] text-white/55">{fmtTime(mins)}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* CTA row */}
          <div className="flex gap-2.5">
            <button
              onClick={e => { e.stopPropagation(); setShowItinerary(true); }}
              className="flex-1 bg-[#7c3aed] text-white text-xs font-black py-2.5 rounded-xl flex items-center justify-center gap-1.5 active:scale-[0.97] transition-all shadow-lg shadow-purple-900/30"
            >
              <Plus className="w-3.5 h-3.5" />
              Add to trip
            </button>
            <button
              onClick={e => { e.stopPropagation(); router.push(`/place/${video._id}`); }}
              className="flex-1 glass border border-white/15 text-white text-xs font-bold py-2.5 rounded-xl flex items-center justify-center gap-1.5 active:scale-[0.97] transition-all"
            >
              <MapPin className="w-3.5 h-3.5" />
              View place
            </button>
          </div>

          <p className="text-[10px] text-white/30 mt-2">{formatRelativeTime(video.createdAt)}</p>
        </div>
      </div>

      {/* Add to itinerary bottom sheet */}
      <AddToItinerarySheet
        video={video}
        isOpen={showItinerary}
        onClose={() => setShowItinerary(false)}
        onSuccess={msg => toast.success(msg)}
      />

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </>
  );
}

function RailBtn({
  children, count, label, onClick, active = false,
}: {
  children: React.ReactNode;
  count?: number;
  label: string;
  onClick: (e: React.MouseEvent) => void;
  active?: boolean;
}) {
  return (
    <button onClick={onClick} className="flex flex-col items-center gap-1">
      <div className={cn(
        "w-11 h-11 rounded-full border flex items-center justify-center transition-all",
        active ? "bg-[#7c3aed]/30 border-[#7c3aed]/50" : "glass border-white/10"
      )}>
        {children}
      </div>
      {count !== undefined && (
        <span className="text-white text-xs font-bold">{formatCount(count)}</span>
      )}
      <span className="text-white/55 text-[10px] font-medium">{label}</span>
    </button>
  );
}
