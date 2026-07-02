"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import {
  MapPin, Play, Bookmark, Route, Compass,
  Mountain, Coffee, Landmark, Droplets, Footprints,
  ArrowRight, Star, ChevronDown, Sparkles,
} from "lucide-react";

// ── tiny hook: intersection observer ──────────────────────────────────
function useVisible(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, visible };
}

// ── mock reel data ────────────────────────────────────────────────────
const MOCK_REELS = [
  {
    id: 1,
    title: "Hidden waterfall deep in the Western Ghats",
    place: "Kudremukh, Chikkamagaluru",
    creator: "Rajan Hegde",
    cat: "🏞 Nature",
    bg: "from-[#134e4a] via-[#0d3b35] to-[#061a16]",
    saves: "2.4k",
    distance: "182 km",
    tag: "Hidden Gem",
  },
  {
    id: 2,
    title: "80-year-old filter coffee shop still serving Mysore",
    place: "Devaraja Market, Mysuru",
    creator: "Meera Iyer",
    cat: "🍛 Food",
    bg: "from-[#78350f] via-[#451d04] to-[#1c0a00]",
    saves: "1.9k",
    distance: "148 km",
    tag: "Story",
  },
  {
    id: 3,
    title: "Ancient Hoysala temple nobody talks about",
    place: "Belur, Hassan District",
    creator: "Priya Kumar",
    cat: "🏛 Heritage",
    bg: "from-[#1e1b4b] via-[#11103a] to-[#060520]",
    saves: "1.6k",
    distance: "220 km",
    tag: "Heritage",
  },
];

const FEATURES = [
  {
    icon: Play,
    color: "text-[#a78bfa]",
    bg: "bg-[#7c3aed]/15 border-[#7c3aed]/20",
    title: "ROAM the feed",
    desc: "Vertical video stories of authentic Karnataka places. Swipe, discover, get inspired.",
  },
  {
    icon: MapPin,
    color: "text-emerald-400",
    bg: "bg-emerald-500/12 border-emerald-500/20",
    title: "Radius discovery",
    desc: "Set a radius from 5 to 300 km. The feed updates to show only places within your reach.",
  },
  {
    icon: Route,
    color: "text-[#60a5fa]",
    bg: "bg-blue-500/12 border-blue-500/20",
    title: "Build your trip",
    desc: "Save places, create itineraries, add notes and share your Karnataka journey with friends.",
  },
  {
    icon: Bookmark,
    color: "text-amber-400",
    bg: "bg-amber-500/12 border-amber-500/20",
    title: "Save & revisit",
    desc: "Bookmark any video or place. Your saved collection, always ready when you plan your trip.",
  },
];

const STATS = [
  { value: "500+", label: "Authentic places" },
  { value: "30+", label: "Districts covered" },
  { value: "10k+", label: "Explorers joined" },
  { value: "4.9★", label: "Creator rating" },
];

const CATEGORIES = [
  { icon: Mountain,  label: "Trekking",   emoji: "🥾", color: "#059669" },
  { icon: Droplets,  label: "Waterfalls", emoji: "💧", color: "#0ea5e9" },
  { icon: Landmark,  label: "Heritage",   emoji: "🏛", color: "#a855f7" },
  { icon: Coffee,    label: "Food",       emoji: "🍛", color: "#f59e0b" },
  { icon: Footprints,label: "Hidden gems",emoji: "💎", color: "#10b981" },
  { icon: Compass,   label: "Nature",     emoji: "🌿", color: "#22c55e" },
];

// ── mock phone frame ──────────────────────────────────────────────────
function MockPhone({ reel }: { reel: typeof MOCK_REELS[0] }) {
  return (
    <div className="relative w-[200px] h-[360px] flex-shrink-0">
      {/* Phone shell */}
      <div className="absolute inset-0 rounded-[32px] border-2 border-[#2a2a3e] bg-black shadow-2xl shadow-black/60 overflow-hidden">
        {/* Reel bg gradient */}
        <div className={`absolute inset-0 bg-gradient-to-b ${reel.bg}`} />

        {/* Gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/30" />

        {/* Notch */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-16 h-4 bg-black rounded-b-xl z-10" />

        {/* Category badge */}
        <div className="absolute top-7 left-3 bg-white/15 backdrop-blur-sm border border-white/10 rounded-full px-2 py-0.5">
          <span className="text-[9px] text-white font-bold">{reel.cat}</span>
        </div>

        {/* Mute icon */}
        <div className="absolute top-7 right-3 w-7 h-7 rounded-full bg-black/40 flex items-center justify-center">
          <span className="text-[10px]">🔇</span>
        </div>

        {/* Right actions */}
        <div className="absolute right-2 bottom-24 flex flex-col items-center gap-3">
          {["❤️", "🔖", "↗️", "•••"].map((ic, i) => (
            <div key={i} className="flex flex-col items-center gap-0.5">
              <div className="w-8 h-8 rounded-full bg-black/40 border border-white/10 flex items-center justify-center">
                <span className="text-[11px]">{ic}</span>
              </div>
              {ic === "❤️" && <span className="text-[8px] text-white font-bold">{reel.saves}</span>}
            </div>
          ))}
        </div>

        {/* Bottom info */}
        <div className="absolute bottom-10 left-2 right-10">
          <p className="text-[10px] font-bold text-white mb-1">@{reel.creator.replace(/\s+/g,"").toLowerCase()}</p>
          <p className="text-[11px] font-black text-white leading-snug mb-1.5 line-clamp-2">{reel.title}</p>
          <div className="flex items-center gap-1 mb-2">
            <div className="flex items-center gap-0.5 bg-black/40 rounded-full px-1.5 py-0.5">
              <span className="text-[8px] text-[#a78bfa]">📍</span>
              <span className="text-[8px] text-white truncate max-w-[90px]">{reel.place}</span>
            </div>
          </div>
          {/* Distance + CTA row */}
          <div className="flex items-center gap-1.5 mt-1">
            <div className="flex items-center gap-1 bg-black/50 rounded-full px-2 py-1">
              <span className="text-[8px] text-[#a78bfa] font-bold">🗺 {reel.distance}</span>
            </div>
            <div className="flex-1 bg-[#7c3aed] rounded-full px-2 py-1 text-center">
              <span className="text-[8px] text-white font-black">+ Add to trip</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tag bubble */}
      <div className="absolute -top-2 -right-3 bg-[#7c3aed] rounded-full px-2.5 py-1 shadow-lg shadow-purple-900/50">
        <span className="text-[9px] text-white font-black">{reel.tag}</span>
      </div>
    </div>
  );
}

// ── animated counter ──────────────────────────────────────────────────
function AnimatedStat({ value, label, delay }: { value: string; label: string; delay: number }) {
  const { ref, visible } = useVisible();
  return (
    <div
      ref={ref}
      className="text-center transition-all duration-700"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(20px)",
        transitionDelay: `${delay}ms`,
      }}
    >
      <p className="text-2xl font-black text-white">{value}</p>
      <p className="text-[11px] text-[#555577] mt-0.5">{label}</p>
    </div>
  );
}

// ── main component ────────────────────────────────────────────────────
export default function LandingPage() {
  const [activeReel, setActiveReel] = useState(0);
  const [scrollY, setScrollY] = useState(0);

  // Auto-rotate reels
  useEffect(() => {
    const t = setInterval(() => setActiveReel(r => (r + 1) % MOCK_REELS.length), 3000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const el = document.getElementById("mobile-root");
    if (!el) return;
    const handler = () => setScrollY(el.scrollTop);
    el.addEventListener("scroll", handler);
    return () => el.removeEventListener("scroll", handler);
  }, []);

  // Feature sections visibility
  const featuresVis = useVisible();
  const statsVis    = useVisible();
  const catVis      = useVisible();
  const ctaVis      = useVisible();

  return (
    <div className="min-h-dvh bg-[#0d0d16] overflow-x-hidden">

      {/* ── HERO ── */}
      <div className="relative min-h-dvh flex flex-col overflow-hidden">

        {/* Animated background blobs */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div
            className="absolute top-[-80px] right-[-80px] w-[280px] h-[280px] rounded-full"
            style={{
              background: "radial-gradient(circle, rgba(124,58,237,0.25) 0%, transparent 70%)",
              transform: `translateY(${scrollY * 0.3}px)`,
            }}
          />
          <div
            className="absolute top-[30%] left-[-60px] w-[200px] h-[200px] rounded-full"
            style={{
              background: "radial-gradient(circle, rgba(16,185,129,0.1) 0%, transparent 70%)",
              transform: `translateY(${scrollY * -0.2}px)`,
            }}
          />
          <div
            className="absolute bottom-[10%] right-[-40px] w-[160px] h-[160px] rounded-full"
            style={{
              background: "radial-gradient(circle, rgba(59,130,246,0.1) 0%, transparent 70%)",
            }}
          />
        </div>

        {/* Top bar */}
        <div className="flex items-center justify-between px-5 pt-14 pb-4 relative z-10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#7c3aed] flex items-center justify-center">
              <MapPin className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-black text-white tracking-tight">Incredible Karnataka</span>
          </div>
          <Link
            href="/login"
            className="text-xs font-bold text-[#a78bfa] bg-[#7c3aed]/12 border border-[#7c3aed]/25 rounded-full px-4 py-1.5"
          >
            Sign in
          </Link>
        </div>

        {/* Hero content */}
        <div className="flex-1 flex flex-col items-center justify-center px-5 text-center pb-8 relative z-10">

          {/* Pill badge */}
          <div className="flex items-center gap-1.5 bg-[#7c3aed]/12 border border-[#7c3aed]/25 rounded-full px-4 py-1.5 mb-6">
            <Sparkles className="w-3 h-3 text-[#a78bfa]" />
            <span className="text-[11px] font-black text-[#a78bfa] tracking-wide">
              DISCOVER AUTHENTIC KARNATAKA
            </span>
          </div>

          {/* Headline */}
          <h1 className="text-[36px] font-black text-white leading-[1.1] tracking-tight mb-4">
            Every story
            <br />
            <span className="text-transparent bg-clip-text"
              style={{ backgroundImage: "linear-gradient(135deg, #a78bfa 0%, #7c3aed 50%, #4c1d95 100%)" }}>
              deserves
            </span>
            <br />
            to be found
          </h1>

          <p className="text-sm text-[#9ca3af] leading-relaxed mb-8 max-w-[280px]">
            Hidden waterfalls, 80-year-old tea shops, forgotten temples.
            Discover Karnataka through the eyes of local explorers.
          </p>

          {/* Mock phone carousel */}
          <div className="relative flex items-center justify-center gap-3 mb-8 w-full overflow-hidden px-6">
            {MOCK_REELS.map((reel, i) => {
              const offset = i - activeReel;
              const isActive = i === activeReel;
              return (
                <div
                  key={reel.id}
                  onClick={() => setActiveReel(i)}
                  className="transition-all duration-500 cursor-pointer"
                  style={{
                    transform: `
                      translateX(${offset * 60}px)
                      scale(${isActive ? 1 : 0.78})
                      translateZ(0)
                    `,
                    opacity: isActive ? 1 : 0.45,
                    zIndex: isActive ? 10 : 5 - Math.abs(offset),
                    position: i === 0 ? "relative" : "absolute",
                    left: i === 0 ? "auto" : "50%",
                    marginLeft: i === 0 ? 0 : "-100px",
                  }}
                >
                  <MockPhone reel={reel} />
                </div>
              );
            })}
          </div>

          {/* Dot indicators */}
          <div className="flex gap-1.5 mb-8">
            {MOCK_REELS.map((_, i) => (
              <button
                key={i}
                onClick={() => setActiveReel(i)}
                className={`transition-all duration-300 rounded-full ${
                  i === activeReel
                    ? "w-6 h-2 bg-[#7c3aed]"
                    : "w-2 h-2 bg-[#2a2a3e]"
                }`}
              />
            ))}
          </div>

          {/* Primary CTA */}
          <Link
            href="/signup"
            className="flex items-center justify-center gap-2 w-full bg-[#7c3aed] text-white font-black py-4 rounded-2xl text-base shadow-2xl shadow-purple-900/50 active:scale-[0.97] transition-all mb-3"
          >
            Start exploring free
            <ArrowRight className="w-5 h-5" />
          </Link>
          <Link
            href="/login"
            className="flex items-center justify-center gap-2 w-full bg-[#161622] border border-[#2a2a3e] text-white font-semibold py-4 rounded-2xl text-sm active:scale-[0.97] transition-all"
          >
            Already have an account? Sign in
          </Link>
        </div>

        {/* Scroll hint */}
        <div className="flex flex-col items-center pb-6 relative z-10 animate-bounce">
          <ChevronDown className="w-5 h-5 text-[#555577]" />
        </div>
      </div>

      {/* ── STATS ── */}
      <div ref={statsVis.ref} className="px-5 py-10 border-t border-b border-[#1e1e2e]">
        <div className="grid grid-cols-4 gap-2">
          {STATS.map((s, i) => (
            <AnimatedStat key={s.label} value={s.value} label={s.label} delay={i * 80} />
          ))}
        </div>
      </div>

      {/* ── FEATURES ── */}
      <div ref={featuresVis.ref} className="px-5 py-10">
        <div className="text-center mb-8">
          <p className="text-[10px] font-black text-[#555577] tracking-[0.2em] mb-2">WHAT YOU GET</p>
          <h2 className="text-2xl font-black text-white leading-tight">
            Built for real
            <br />
            <span className="text-transparent bg-clip-text"
              style={{ backgroundImage: "linear-gradient(135deg, #a78bfa, #7c3aed)" }}>
              explorers
            </span>
          </h2>
        </div>

        <div className="space-y-3">
          {FEATURES.map((f, i) => (
            <div
              key={f.title}
              className={`flex items-start gap-4 bg-[#161622] border border-[#2a2a3e] rounded-2xl p-4 transition-all duration-500`}
              style={{
                opacity: featuresVis.visible ? 1 : 0,
                transform: featuresVis.visible ? "translateX(0)" : "translateX(-24px)",
                transitionDelay: `${i * 80}ms`,
              }}
            >
              <div className={`w-11 h-11 rounded-2xl border flex items-center justify-center flex-shrink-0 ${f.bg}`}>
                <f.icon className={`w-5 h-5 ${f.color}`} />
              </div>
              <div>
                <h3 className="text-sm font-black text-white mb-1">{f.title}</h3>
                <p className="text-xs text-[#555577] leading-relaxed">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── CATEGORIES ── */}
      <div ref={catVis.ref} className="px-5 py-10 bg-[#0a0a12]">
        <div className="text-center mb-7">
          <p className="text-[10px] font-black text-[#555577] tracking-[0.2em] mb-2">EXPLORE BY VIBE</p>
          <h2 className="text-2xl font-black text-white">
            What calls you?
          </h2>
        </div>

        <div className="grid grid-cols-3 gap-2.5">
          {CATEGORIES.map((c, i) => (
            <div
              key={c.label}
              className="aspect-square rounded-2xl bg-[#161622] border border-[#2a2a3e] flex flex-col items-center justify-center gap-2 transition-all duration-500 hover:border-[#7c3aed]/40"
              style={{
                opacity: catVis.visible ? 1 : 0,
                transform: catVis.visible ? "scale(1)" : "scale(0.85)",
                transitionDelay: `${i * 60}ms`,
              }}
            >
              <span className="text-3xl">{c.emoji}</span>
              <span className="text-[11px] font-black text-white text-center">{c.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── CREATOR SECTION ── */}
      <div className="px-5 py-10 bg-gradient-to-br from-[#120827] to-[#0d0d16]">
        <div className="bg-[#161622] border border-[#7c3aed]/20 rounded-3xl p-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-[#7c3aed]/10 blur-2xl pointer-events-none" />
          <div className="relative">
            <div className="w-12 h-12 rounded-2xl bg-[#7c3aed]/15 border border-[#7c3aed]/25 flex items-center justify-center mb-4">
              <Star className="w-6 h-6 text-[#a78bfa]" />
            </div>
            <h2 className="text-xl font-black text-white mb-2">Are you a creator?</h2>
            <p className="text-sm text-[#9ca3af] leading-relaxed mb-5">
              Upload your Karnataka stories. Get verified. Reach thousands of explorers looking for authentic experiences.
            </p>
            <div className="space-y-2 mb-5">
              {[
                "Upload documentary-style videos",
                "Get verified creator badge",
                "Track saves, views & trip adds",
                "Be featured in Explorer Spotlight",
              ].map(item => (
                <div key={item} className="flex items-center gap-2.5">
                  <div className="w-4 h-4 rounded-full bg-[#7c3aed] flex items-center justify-center flex-shrink-0">
                    <span className="text-[8px] text-white font-black">✓</span>
                  </div>
                  <span className="text-xs text-[#9ca3af]">{item}</span>
                </div>
              ))}
            </div>
            <Link
              href="/signup"
              className="flex items-center justify-center gap-2 w-full bg-[#7c3aed] text-white font-black py-3.5 rounded-2xl text-sm shadow-lg shadow-purple-900/30 active:scale-[0.97] transition-all"
            >
              Join as creator
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* ── TESTIMONIAL/QUOTE ── */}
      <div className="px-5 py-10 border-t border-[#1e1e2e]">
        <div className="text-center mb-6">
          <p className="text-[10px] font-black text-[#555577] tracking-[0.2em]">FROM OUR EXPLORERS</p>
        </div>
        <div className="space-y-3">
          {[
            { quote: "Found a 200-year-old temple 40 km from Bengaluru. Would never have known without this.", name: "Arjun S.", role: "Explorer", dist: "Bengaluru" },
            { quote: "As a creator, seeing people add my places to their trip itineraries is the best feeling.", name: "Rajan H.", role: "Verified Creator", dist: "Coorg" },
          ].map(t => (
            <div key={t.name} className="bg-[#161622] border border-[#2a2a3e] rounded-2xl p-4">
              <p className="text-sm text-[#9ca3af] leading-relaxed mb-3 italic">"{t.quote}"</p>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#7c3aed] to-[#4c1d95] flex items-center justify-center text-xs font-black text-white">
                  {t.name.charAt(0)}
                </div>
                <div>
                  <p className="text-xs font-black text-white">{t.name}</p>
                  <p className="text-[10px] text-[#555577]">{t.role} · {t.dist}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── FINAL CTA ── */}
      <div ref={ctaVis.ref} className="px-5 py-12 bg-gradient-to-b from-[#0d0d16] to-[#090910] text-center">
        <div
          className="transition-all duration-700"
          style={{ opacity: ctaVis.visible ? 1 : 0, transform: ctaVis.visible ? "translateY(0)" : "translateY(30px)" }}
        >
          <div className="w-16 h-16 rounded-3xl bg-[#7c3aed] flex items-center justify-center mx-auto mb-5 shadow-2xl shadow-purple-900/50">
            <MapPin className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-black text-white mb-2">
            Karnataka is waiting
          </h2>
          <p className="text-sm text-[#555577] mb-7 max-w-[260px] mx-auto leading-relaxed">
            Start your first story today. Free forever for explorers.
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 bg-[#7c3aed] text-white font-black px-8 py-4 rounded-2xl text-base shadow-2xl shadow-purple-900/50 active:scale-[0.97] transition-all mb-4"
          >
            Get started free
            <ArrowRight className="w-5 h-5" />
          </Link>
          <p className="text-xs text-[#555577]">
            Already exploring?{" "}
            <Link href="/login" className="text-[#a78bfa] font-bold">
              Sign in
            </Link>
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="px-5 py-6 border-t border-[#1e1e2e] text-center">
        <div className="flex items-center justify-center gap-2 mb-3">
          <div className="w-6 h-6 rounded-lg bg-[#7c3aed] flex items-center justify-center">
            <MapPin className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-xs font-black text-[#555577]">Incredible Karnataka</span>
        </div>
        <p className="text-[10px] text-[#3a3a5a]">
          Built with love for authentic Karnataka experiences
        </p>
      </div>
    </div>
  );
}
