"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { MapPin, Loader2 } from "lucide-react";
import { IVideo } from "@/types";
import { VideoCard } from "@/features/feed/VideoCard";
import { FeedTabs, FeedTab } from "@/features/explore/FeedTabs";
import { FeedFilterPanel } from "@/features/explore/FeedFilterPanel";
import { BottomNav } from "@/components/layout/BottomNav";

export default function ExplorePage() {
  const [videos, setVideos]           = useState<IVideo[]>([]);
  const [page, setPage]               = useState(1);
  const [hasMore, setHasMore]         = useState(true);
  const [loading, setLoading]         = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const [activeTab, setActiveTab]     = useState<FeedTab>("For you");
  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [filterOpen, setFilterOpen]   = useState(false);
  const [filterCategory, setFilterCategory] = useState("");
  const [radius, setRadius]           = useState(50);
  const containerRef  = useRef<HTMLDivElement>(null);
  const loadingMore   = useRef(false);

  // Get GPS once
  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(
      p => setUserLocation({ lat: p.coords.latitude, lon: p.coords.longitude }),
      () => {}
    );
  }, []);

  const fetchVideos = useCallback(async (p: number, reset = false) => {
    if (loadingMore.current) return;
    loadingMore.current = true;
    try {
      const params = new URLSearchParams({ page: String(p), limit: "5" });
      if (filterCategory) params.set("category", filterCategory);
      if (activeTab === "Nearby" && userLocation) {
        params.set("radius", String(radius));
        params.set("lat", String(userLocation.lat));
        params.set("lon", String(userLocation.lon));
      }
      const res  = await fetch(`/api/videos?${params}`);
      const data = await res.json();
      if (data.success) {
        setVideos(prev => reset || p === 1 ? data.data.videos : [...prev, ...data.data.videos]);
        setHasMore(data.data.hasMore);
      }
    } finally {
      setLoading(false);
      loadingMore.current = false;
    }
  }, [filterCategory, activeTab, userLocation, radius]);

  // Re-fetch on filter / tab change
  useEffect(() => {
    setLoading(true);
    setPage(1);
    setActiveIndex(0);
    fetchVideos(1, true);
  }, [fetchVideos]);

  // IntersectionObserver — autoplay + infinite load
  useEffect(() => {
    const container = containerRef.current;
    if (!container || videos.length === 0) return;

    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const idx = parseInt(entry.target.getAttribute("data-index") || "0");
        setActiveIndex(idx);
        if (idx >= videos.length - 2 && hasMore && !loadingMore.current) {
          const next = page + 1;
          setPage(next);
          fetchVideos(next);
        }
      });
    }, { root: container, threshold: 0.7 });

    container.querySelectorAll("[data-index]").forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, [videos, hasMore, page, fetchVideos]);

  const handleTabChange = (tab: FeedTab) => {
    setActiveTab(tab);
    setActiveIndex(0);
    setPage(1);
    setVideos([]);
    setLoading(true);
    setFilterOpen(false);
  };

  // ── empty / loading states ──
  if (loading && videos.length === 0) {
    return (
      <div className="h-dvh flex flex-col items-center justify-center bg-black">
        <div className="w-14 h-14 rounded-2xl bg-[#7c3aed] flex items-center justify-center mb-4 shadow-xl shadow-purple-900/50">
          <MapPin className="w-7 h-7 text-white" />
        </div>
        <p className="text-sm text-[#9ca3af] mb-3">Loading Karnataka stories...</p>
        <Loader2 className="w-5 h-5 text-[#7c3aed] animate-spin" />
        <BottomNav />
      </div>
    );
  }

  if (!loading && videos.length === 0) {
    return (
      <div className="h-dvh flex flex-col items-center justify-center bg-black px-8 text-center">
        <div className="text-5xl mb-4">🌿</div>
        <h2 className="text-lg font-black text-white mb-2">No stories found</h2>
        <p className="text-sm text-[#9ca3af]">
          {activeTab === "Nearby"
            ? "No videos within your radius. Expand it in filters."
            : "Check back soon for new Karnataka stories."}
        </p>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="relative h-dvh bg-black overflow-hidden">

      {/* ── Scrollable feed ── */}
      <div
        ref={containerRef}
        className="h-dvh overflow-y-scroll"
        style={{ scrollSnapType: "y mandatory" }}
      >
        {videos.map((video, index) => (
          <div
            key={`${video._id}-${index}`}
            data-index={index}
            style={{ scrollSnapAlign: "start", scrollSnapStop: "always", height: "100dvh" }}
          >
            <VideoCard
              video={video}
              isActive={index === activeIndex}
              userLocation={userLocation}
            />
          </div>
        ))}

        {!hasMore && videos.length > 0 && (
          <div
            className="flex items-center justify-center bg-[#0d0d16]"
            style={{ scrollSnapAlign: "start", height: "100dvh" }}
          >
            <div className="text-center px-8">
              <div className="text-5xl mb-4">🎬</div>
              <p className="text-white font-black text-xl">You have roamed it all</p>
              <p className="text-sm text-[#9ca3af] mt-2">New stories drop every day.</p>
            </div>
          </div>
        )}
      </div>

      {/* ── Top overlay: tabs + filter ── */}
      <div className="absolute top-0 left-0 right-0 z-20 bg-gradient-to-b from-black/75 via-black/25 to-transparent pb-10 pointer-events-none">
        <div className="pt-12 px-4 pointer-events-auto">
          <div className="flex items-center justify-between">
            <FeedTabs active={activeTab} onChange={handleTabChange} />
            <div className="relative">
              <FeedFilterPanel
                activeTab={activeTab}
                open={filterOpen}
                onToggle={() => setFilterOpen(o => !o)}
                filterCategory={filterCategory}
                onCategoryChange={setFilterCategory}
                radius={radius}
                onRadiusChange={setRadius}
              />
            </div>
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
