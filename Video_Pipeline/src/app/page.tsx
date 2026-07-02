"use client";
{/*
import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  MapPin, Search, Bell, ChevronRight, Play,
  SlidersHorizontal
} from "lucide-react";
import { IVideo } from "@/types";
import { CATEGORIES } from "@/constants";
import { useAuth } from "@/features/auth/AuthContext";
import { BottomNav } from "@/components/layout/BottomNav";
import { RadiusSlider } from "@/features/home/RadiusSlider";
import { GemCard } from "@/features/home/GemCard";
import { TrendingItem } from "@/features/home/TrendingItem";
import { StoryCard } from "@/features/home/StoryCard";
import { SectionHeader } from "@/features/home/SectionHeader";
import LandingPage from "@/features/auth/LandingPage";
import { formatCount, cn } from "@/lib/utils";

const MOOD_FILTERS = [
  { label: "All",        value: "",           emoji: "✨" },
  { label: "Nature",     value: "NATURE",     emoji: "🌿" },
  { label: "Heritage",   value: "HERITAGE",   emoji: "🏛"  },
  { label: "Food",       value: "FOOD",       emoji: "🍛"  },
  { label: "Trekking",   value: "TREKKING",   emoji: "🥾"  },
  { label: "Waterfall",  value: "WATERFALL",  emoji: "💧"  },
  { label: "Hidden Gem", value: "HIDDEN_GEM", emoji: "💎"  },
];

const GREETINGS = ["Good morning", "Good afternoon", "Good evening"];
const getGreeting = () => {
  const h = new Date().getHours();
  return h < 12 ? GREETINGS[0] : h < 17 ? GREETINGS[1] : GREETINGS[2];
};

const COLLECTIONS = [
  { emoji: "🌧", name: "Monsoon Escapes",   cat: "NATURE",    bg: "#0f172a" },
  { emoji: "🏞", name: "Hidden Waterfalls", cat: "WATERFALL", bg: "#052e16" },
  { emoji: "🍛", name: "Food Trails",       cat: "FOOD",      bg: "#1c1917" },
  { emoji: "🏛", name: "Heritage Walks",    cat: "HERITAGE",  bg: "#1e1b4b" },
];

export default function RootPage() {
  const { user, loading } = useAuth();

  // Show landing for unauthenticated users
  if (!loading && !user) return <LandingPage />;

  // Show nothing while auth is loading
  if (loading) {
    return (
      <div className="h-dvh flex items-center justify-center bg-[#0d0d16]">
        <div className="w-8 h-8 border-2 border-[#7c3aed] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return <HomePage />;
}

// ── Authenticated Home ────────────────────────────────────────────────
function HomePage() {
  const router = useRouter();
  const { user } = useAuth();
  const [videos, setVideos] = useState<IVideo[]>([]);
  const [trending, setTrending] = useState<IVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("");
  const [radius, setRadius] = useState(50);
  const [sliderOpen, setSliderOpen] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [locationLabel, setLocationLabel] = useState("Karnataka");

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      pos => {
        setUserLocation({ lat: pos.coords.latitude, lon: pos.coords.longitude });
        setLocationLabel("Near you");
      },
      () => setLocationLabel("Karnataka"),
      { timeout: 6000 }
    );
  }, []);

  const fetchVideos = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: "1", limit: "12" });
      if (category) params.set("category", category);
      if (userLocation && radius < 300) {
        params.set("radius", String(radius));
        params.set("lat", String(userLocation.lat));
        params.set("lon", String(userLocation.lon));
      }
      const res = await fetch(`/api/videos?${params}`);
      const data = await res.json();
      if (data.success) setVideos(data.data.videos);
    } finally {
      setLoading(false);
    }
  }, [category, radius, userLocation]);

  useEffect(() => {
    // Trending: separate fetch, sort by saves
    fetch("/api/videos?page=1&limit=10")
      .then(r => r.json())
      .then(d => {
        if (d.success) {
          const sorted = [...d.data.videos].sort(
            (a: IVideo, b: IVideo) => b.savesCount - a.savesCount
          );
          setTrending(sorted.slice(0, 3));
        }
      });
  }, []);

  useEffect(() => { fetchVideos(); }, [fetchVideos]);

  const firstName = user?.fullName.split(" ")[0] || "Explorer";

  return (
    <div className="min-h-dvh bg-[#0d0d16] pb-28">

      {/* ── HERO HEADER ── *
      <div className="relative bg-gradient-to-b from-[#120827] via-[#0e0820] to-[#0d0d16] px-4 pt-14 pb-5 overflow-hidden">
        {/* bg glows *
        <div className="absolute top-0 right-0 w-52 h-52 rounded-full bg-[#7c3aed]/12 blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-36 h-36 rounded-full bg-emerald-500/6 blur-3xl pointer-events-none" />

        {/* Top row *
        <div className="flex items-start justify-between mb-5 relative">
          <div>
            <p className="text-xs text-[#555577] mb-0.5">{getGreeting()} 👋</p>
            <h1 className="text-xl font-black text-white leading-tight">{firstName}</h1>
            <div className="flex items-center gap-1.5 mt-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 pulse-dot" />
              <span className="text-xs text-[#9ca3af]">
                {locationLabel}
                {radius < 300 ? ` · ${radius} km radius` : " · All Karnataka"}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="relative w-9 h-9 rounded-xl bg-[#161622] border border-[#2a2a3e] flex items-center justify-center">
              <Bell className="w-4 h-4 text-[#9ca3af]" />
              <div className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#7c3aed]" />
            </button>
            <button
              onClick={() => router.push("/search")}
              className="w-9 h-9 rounded-xl bg-[#161622] border border-[#2a2a3e] flex items-center justify-center"
            >
              <Search className="w-4 h-4 text-[#9ca3af]" />
            </button>
          </div>
        </div>

        {/* Search bar *
        <button
          onClick={() => router.push("/search")}
          className="w-full flex items-center gap-3 bg-[#161622] border border-[#2a2a3e] rounded-2xl px-4 py-3.5 mb-4 hover:border-[#7c3aed]/40 active:opacity-80 transition-all"
        >
          <Search className="w-4 h-4 text-[#555577]" />
          <span className="text-sm text-[#555577]">Places, food, trails, stories...</span>
          <div className="ml-auto flex items-center gap-1 bg-[#7c3aed]/12 border border-[#7c3aed]/20 rounded-xl px-2.5 py-1">
            <MapPin className="w-3 h-3 text-[#a78bfa]" />
            <span className="text-[10px] text-[#a78bfa] font-bold">Karnataka</span>
          </div>
        </button>

        {/* Radius slider *
        <div className="mb-4">
          <RadiusSlider
            radius={radius}
            onChange={setRadius}
            hasLocation={!!userLocation}
            open={sliderOpen}
            onToggle={() => setSliderOpen(o => !o)}
          />
        </div>

        {/* Mood filter chips *
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
          {MOOD_FILTERS.map(f => (
            <button
              key={f.value}
              onClick={() => setCategory(f.value === category ? "" : f.value)}
              className={cn(
                "flex-shrink-0 flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-bold border transition-all",
                category === f.value
                  ? "bg-[#7c3aed] border-[#7c3aed] text-white"
                  : "bg-[#161622] border-[#2a2a3e] text-[#9ca3af] hover:border-[#7c3aed]/40"
              )}
            >
              <span>{f.emoji}</span>
              <span>{f.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── HIDDEN GEMS ── *
      <section className="mt-2 mb-6">
        <SectionHeader
          title={radius < 300 ? "Hidden gems near you" : "Hidden gems"}
          sub={radius < 300 ? `Within ${radius} km` : "Across Karnataka"}
          onSeeAll={() => router.push("/explore")}
        />
        <div className="flex gap-3 px-4 overflow-x-auto pb-1">
          {loading
            ? [1,2,3,4].map(i => <div key={i} className="flex-shrink-0 w-36 h-52 skeleton" />)
            : videos.slice(0, 8).map(v => (
                <GemCard key={v._id} video={v} onClick={() => router.push(`/place/${v._id}`)} />
              ))
          }
        </div>
      </section>

      {/* ── TRENDING ── *
      <section className="mb-6">
        <SectionHeader
          title="Trending this week"
          sub="Sorted by saves · not likes"
          onSeeAll={() => router.push("/explore")}
        />
        <div className="px-4 space-y-2">
          {trending.length === 0
            ? [1,2,3].map(i => <div key={i} className="h-16 skeleton rounded-2xl" />)
            : trending.map((v, i) => (
                <TrendingItem key={v._id} video={v} rank={i + 1} onClick={() => router.push(`/place/${v._id}`)} />
              ))
          }
        </div>
      </section>

      {/* ── COLLECTIONS ── *
      <section className="mb-6">
        <SectionHeader
          title="Curated collections"
          sub="Handpicked journeys"
          onSeeAll={() => router.push("/explore")}
        />
        <div className="grid grid-cols-2 gap-3 px-4">
          {COLLECTIONS.map(c => (
            <button
              key={c.cat}
              onClick={() => {
                setCategory(c.cat);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className="rounded-2xl overflow-hidden active:scale-[0.97] transition-all"
              style={{ background: c.bg }}
            >
              <div className="p-4 min-h-[90px] flex flex-col justify-between">
                <span className="text-3xl">{c.emoji}</span>
                <div>
                  <p className="text-xs font-black text-white">{c.name}</p>
                  <p className="text-[10px] text-white/40 mt-0.5">Explore →</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* ── STORIES ── *
      <section className="mb-6">
        <SectionHeader
          title="Stories from Karnataka"
          sub="Documentary-style"
          onSeeAll={() => router.push("/explore")}
        />
        <div className="flex gap-3 px-4 overflow-x-auto pb-1">
          {loading
            ? [1,2,3].map(i => <div key={i} className="flex-shrink-0 w-52 h-28 skeleton rounded-2xl" />)
            : videos.slice(0, 5).map(v => (
                <StoryCard key={v._id} video={v} onClick={() => router.push(`/place/${v._id}`)} />
              ))
          }
        </div>
      </section>

      {/* ── EXPLORER SPOTLIGHT ── *
      <section className="mb-6 px-4">
        <SectionHeader title="Explorer Spotlight" sub="Top creator this week" />
        <div className="bg-gradient-to-br from-[#120827] to-[#1e1b4b] rounded-2xl border border-[#7c3aed]/20 p-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-28 h-28 rounded-full bg-[#7c3aed]/15 blur-2xl pointer-events-none" />
          <div className="relative">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#7c3aed] to-[#4c1d95] flex items-center justify-center text-lg font-black text-white">
                R
              </div>
              <div className="flex-1">
                <p className="text-sm font-black text-white">Rajan Hegde</p>
                <p className="text-xs text-[#a78bfa]">Local Expert · Western Ghats</p>
              </div>
              <div className="bg-[#7c3aed]/15 border border-[#7c3aed]/25 rounded-full px-2.5 py-1">
                <span className="text-[10px] text-[#a78bfa] font-black">⭐ Spotlight</span>
              </div>
            </div>
            <p className="text-xs text-[#9ca3af] leading-relaxed">
              "Unknown temple hidden deep in the Western Ghats" — saved 340 times this week.
            </p>
            <button
              onClick={() => router.push("/explore")}
              className="mt-3 flex items-center gap-1 text-xs text-[#a78bfa] font-bold"
            >
              Watch stories <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </section>

      <BottomNav />
    </div>
  );
}
*/}



import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  MapPin, Search, Bell, ChevronRight, Play,
  SlidersHorizontal
} from "lucide-react";
import { IVideo } from "@/types";
import { CATEGORIES } from "@/constants";
import { useAuth } from "@/features/auth/AuthContext";
import { BottomNav } from "@/components/layout/BottomNav";
import { RadiusSlider } from "@/features/home/RadiusSlider";
import { GemCard } from "@/features/home/GemCard";
import { TrendingItem } from "@/features/home/TrendingItem";
import { StoryCard } from "@/features/home/StoryCard";
import { SectionHeader } from "@/features/home/SectionHeader";
import LandingPage from "@/features/auth/LandingPage";
import { formatCount, cn } from "@/lib/utils";

const MOOD_FILTERS = [
  { label: "All",        value: "",           emoji: "✨" },
  { label: "Nature",     value: "NATURE",     emoji: "🌿" },
  { label: "Heritage",   value: "HERITAGE",   emoji: "🏛"  },
  { label: "Food",       value: "FOOD",       emoji: "🍛"  },
  { label: "Trekking",   value: "TREKKING",   emoji: "🥾"  },
  { label: "Waterfall",  value: "WATERFALL",  emoji: "💧"  },
  { label: "Hidden Gem", value: "HIDDEN_GEM", emoji: "💎"  },
];

const GREETINGS = ["Good morning", "Good afternoon", "Good evening"];
const getGreeting = () => {
  const h = new Date().getHours();
  return h < 12 ? GREETINGS[0] : h < 17 ? GREETINGS[1] : GREETINGS[2];
};

const COLLECTIONS = [
  { emoji: "🌧", name: "Monsoon Escapes",   cat: "NATURE",    bg: "#0f172a" },
  { emoji: "🏞", name: "Hidden Waterfalls", cat: "WATERFALL", bg: "#064e3b" },
  { emoji: "🍛", name: "Food Trails",       cat: "FOOD",      bg: "#1f2937" },
  { emoji: "🏛", name: "Heritage Walks",    cat: "HERITAGE",  bg: "#1e3a8a" },
];

export default function RootPage() {
  const { user, loading } = useAuth();

  // Show landing for unauthenticated users
  if (!loading && !user) return <LandingPage />;

  // Show nothing while auth is loading
  if (loading) {
    return (
      <div className="h-dvh flex items-center justify-center bg-[#111827]">
        <div className="w-8 h-8 border-2 border-[#14b8a6] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return <HomePage />;
}

// ── Authenticated Home ────────────────────────────────────────────────
function HomePage() {
  const router = useRouter();
  const { user } = useAuth();
  const [videos, setVideos] = useState<IVideo[]>([]);
  const [trending, setTrending] = useState<IVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("");
  const [radius, setRadius] = useState(50);
  const [sliderOpen, setSliderOpen] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [locationLabel, setLocationLabel] = useState("Karnataka");

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      pos => {
        setUserLocation({ lat: pos.coords.latitude, lon: pos.coords.longitude });
        setLocationLabel("Near you");
      },
      () => setLocationLabel("Karnataka"),
      { timeout: 6000 }
    );
  }, []);

  const fetchVideos = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: "1", limit: "12" });
      if (category) params.set("category", category);
      if (userLocation && radius < 300) {
        params.set("radius", String(radius));
        params.set("lat", String(userLocation.lat));
        params.set("lon", String(userLocation.lon));
      }
      const res = await fetch(`/api/videos?${params}`);
      const data = await res.json();
      if (data.success) setVideos(data.data.videos);
    } finally {
      setLoading(false);
    }
  }, [category, radius, userLocation]);

  useEffect(() => {
    // Trending: separate fetch, sort by saves
    fetch("/api/videos?page=1&limit=10")
      .then(r => r.json())
      .then(d => {
        if (d.success) {
          const sorted = [...d.data.videos].sort(
            (a: IVideo, b: IVideo) => b.savesCount - a.savesCount
          );
          setTrending(sorted.slice(0, 3));
        }
      });
  }, []);

  useEffect(() => { fetchVideos(); }, [fetchVideos]);

  const firstName = user?.fullName.split(" ")[0] || "Explorer";

  return (
    <div className="min-h-dvh bg-[#111827] pb-28">

      {/* ── HERO HEADER ── */}
      <div className="relative bg-gradient-to-b from-[#1f2937] via-[#111827] to-[#111827] px-4 pt-14 pb-5 overflow-hidden">
        {/* bg glows */}
        <div className="absolute top-0 right-0 w-52 h-52 rounded-full bg-[#14b8a6]/10 blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-36 h-36 rounded-full bg-[#10b981]/5 blur-3xl pointer-events-none" />

        {/* Top row */}
        <div className="flex items-start justify-between mb-5 relative">
          <div>
            <p className="text-xs text-[#9ca3af] mb-0.5">{getGreeting()} 👋</p>
            <h1 className="text-xl font-black text-white leading-tight">{firstName}</h1>
            <div className="flex items-center gap-1.5 mt-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-[#10b981] pulse-dot" />
              <span className="text-xs text-[#9ca3af]">
                {locationLabel}
                {radius < 300 ? ` · ${radius} km radius` : " · All Karnataka"}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="relative w-9 h-9 rounded-xl bg-[#1f2937] border border-[#374151] flex items-center justify-center">
              <Bell className="w-4 h-4 text-[#9ca3af]" />
              <div className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#14b8a6]" />
            </button>
            <button
              onClick={() => router.push("/search")}
              className="w-9 h-9 rounded-xl bg-[#1f2937] border border-[#374151] flex items-center justify-center"
            >
              <Search className="w-4 h-4 text-[#9ca3af]" />
            </button>
          </div>
        </div>

        {/* Search bar */}
        <button
          onClick={() => router.push("/search")}
          className="w-full flex items-center gap-3 bg-[#1f2937] border border-[#374151] rounded-2xl px-4 py-3.5 mb-4 hover:border-[#14b8a6]/40 active:opacity-80 transition-all"
        >
          <Search className="w-4 h-4 text-[#6b7280]" />
          <span className="text-sm text-[#6b7280]">Places, food, trails, stories...</span>
          <div className="ml-auto flex items-center gap-1 bg-[#14b8a6]/10 border border-[#14b8a6]/20 rounded-xl px-2.5 py-1">
            <MapPin className="w-3 h-3 text-[#2dd4bf]" />
            <span className="text-[10px] text-[#2dd4bf] font-bold">Karnataka</span>
          </div>
        </button>

        {/* Radius slider */}
        <div className="mb-4">
          <RadiusSlider
            radius={radius}
            onChange={setRadius}
            hasLocation={!!userLocation}
            open={sliderOpen}
            onToggle={() => setSliderOpen(o => !o)}
          />
        </div>

        {/* Mood filter chips */}
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
          {MOOD_FILTERS.map(f => (
            <button
              key={f.value}
              onClick={() => setCategory(f.value === category ? "" : f.value)}
              className={cn(
                "flex-shrink-0 flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-bold border transition-all",
                category === f.value
                  ? "bg-[#14b8a6] border-[#14b8a6] text-white"
                  : "bg-[#1f2937] border-[#374151] text-[#9ca3af] hover:border-[#14b8a6]/40"
              )}
            >
              <span>{f.emoji}</span>
              <span>{f.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── HIDDEN GEMS ── */}
      <section className="mt-2 mb-6">
        <SectionHeader
          title={radius < 300 ? "Hidden gems near you" : "Hidden gems"}
          sub={radius < 300 ? `Within ${radius} km` : "Across Karnataka"}
          onSeeAll={() => router.push("/explore")}
        />
        <div className="flex gap-3 px-4 overflow-x-auto pb-1">
          {loading
            ? [1,2,3,4].map(i => <div key={i} className="flex-shrink-0 w-36 h-52 skeleton" />)
            : videos.slice(0, 8).map(v => (
                <GemCard key={v._id} video={v} onClick={() => router.push(`/place/${v._id}`)} />
              ))
          }
        </div>
      </section>

      {/* ── TRENDING ── */}
      <section className="mb-6">
        <SectionHeader
          title="Trending this week"
          sub="Sorted by saves · not likes"
          onSeeAll={() => router.push("/explore")}
        />
        <div className="px-4 space-y-2">
          {trending.length === 0
            ? [1,2,3].map(i => <div key={i} className="h-16 skeleton rounded-2xl" />)
            : trending.map((v, i) => (
                <TrendingItem key={v._id} video={v} rank={i + 1} onClick={() => router.push(`/place/${v._id}`)} />
              ))
          }
        </div>
      </section>

      {/* ── COLLECTIONS ── */}
      <section className="mb-6">
        <SectionHeader
          title="Curated collections"
          sub="Handpicked journeys"
          onSeeAll={() => router.push("/explore")}
        />
        <div className="grid grid-cols-2 gap-3 px-4">
          {COLLECTIONS.map(c => (
            <button
              key={c.cat}
              onClick={() => {
                setCategory(c.cat);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className="rounded-2xl overflow-hidden active:scale-[0.97] transition-all"
              style={{ background: c.bg }}
            >
              <div className="p-4 min-h-[90px] flex flex-col justify-between">
                <span className="text-3xl">{c.emoji}</span>
                <div>
                  <p className="text-xs font-black text-white">{c.name}</p>
                  <p className="text-[10px] text-white/40 mt-0.5">Explore →</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* ── STORIES ── */}
      <section className="mb-6">
        <SectionHeader
          title="Stories from Karnataka"
          sub="Documentary-style"
          onSeeAll={() => router.push("/explore")}
        />
        <div className="flex gap-3 px-4 overflow-x-auto pb-1">
          {loading
            ? [1,2,3].map(i => <div key={i} className="flex-shrink-0 w-52 h-28 skeleton rounded-2xl" />)
            : videos.slice(0, 5).map(v => (
                <StoryCard key={v._id} video={v} onClick={() => router.push(`/place/${v._id}`)} />
              ))
          }
        </div>
      </section>

      {/* ── EXPLORER SPOTLIGHT ── */}
      <section className="mb-6 px-4">
        <SectionHeader title="Explorer Spotlight" sub="Top creator this week" />
        <div className="bg-gradient-to-br from-[#1f2937] to-[#111827] rounded-2xl border border-[#374151] p-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-28 h-28 rounded-full bg-[#14b8a6]/10 blur-2xl pointer-events-none" />
          <div className="relative">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#14b8a6] to-[#0f766e] flex items-center justify-center text-lg font-black text-white">
                R
              </div>
              <div className="flex-1">
                <p className="text-sm font-black text-white">Rajan Hegde</p>
                <p className="text-xs text-[#2dd4bf]">Local Expert · Western Ghats</p>
              </div>
              <div className="bg-[#14b8a6]/10 border border-[#14b8a6]/25 rounded-full px-2.5 py-1">
                <span className="text-[10px] text-[#2dd4bf] font-black">⭐ Spotlight</span>
              </div>
            </div>
            <p className="text-xs text-[#9ca3af] leading-relaxed">
              "Unknown temple hidden deep in the Western Ghats" — saved 340 times this week.
            </p>
            <button
              onClick={() => router.push("/explore")}
              className="mt-3 flex items-center gap-1 text-xs text-[#2dd4bf] font-bold hover:text-[#14b8a6] transition-colors"
            >
              Watch stories <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </section>

      <BottomNav />
    </div>
  );
}