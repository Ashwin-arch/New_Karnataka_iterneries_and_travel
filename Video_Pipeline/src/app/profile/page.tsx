"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  LogOut, Settings, MapPin, Video, Bookmark,
  Clock, CheckCircle2, XCircle, ChevronRight,
  User, Shield, Camera, Edit3, Route, TrendingUp, Loader2
} from "lucide-react";
import { useAuth } from "@/features/auth/AuthContext";
import { IVideo } from "@/types";
import { VIDEO_STATUS, CATEGORIES } from "@/constants";
import { formatRelativeTime, cn } from "@/lib/utils";
import { BottomNav } from "@/components/layout/BottomNav";
import { useToast } from "@/hooks/useToast";
import { ToastContainer } from "@/components/ui/Toast";

type VideoTab = "all" | "PENDING" | "APPROVED" | "REJECTED";

const TAB_LABELS: Record<VideoTab, string> = {
  all: "All", APPROVED: "Live", PENDING: "Pending", REJECTED: "Rejected",
};

export default function ProfilePage() {
  const router = useRouter();
  const { user, logout, loading } = useAuth();
  const [videos, setVideos]       = useState<IVideo[]>([]);
  const [videosLoading, setVideosLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<VideoTab>("all");
  const { toasts, removeToast, toast } = useToast();

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [user, loading, router]);

  useEffect(() => {
    if (user?.role === "CREATOR") fetchMyVideos("all");
  }, [user]);

  const fetchMyVideos = async (tab: VideoTab) => {
    setVideosLoading(true);
    try {
      const url = tab !== "all"
        ? `/api/videos/my-videos?status=${tab}`
        : "/api/videos/my-videos";
      const res  = await fetch(url);
      const data = await res.json();
      if (data.success) setVideos(data.data.videos);
    } finally {
      setVideosLoading(false);
    }
  };

  const handleTabChange = (tab: VideoTab) => {
    setActiveTab(tab);
    fetchMyVideos(tab);
  };

  if (loading || !user) {
    return (
      <div className="h-dvh flex items-center justify-center bg-[#0d0d16]">
        <Loader2 className="w-6 h-6 text-[#7c3aed] animate-spin" />
      </div>
    );
  }

  const counts: Record<VideoTab, number> = {
    all:      videos.length,
    PENDING:  videos.filter(v => v.status === "PENDING").length,
    APPROVED: videos.filter(v => v.status === "APPROVED").length,
    REJECTED: videos.filter(v => v.status === "REJECTED").length,
  };

  return (
    <div className="min-h-dvh bg-[#0d0d16] pb-28">

      {/* ── Hero ── */}
      <div className="relative bg-gradient-to-b from-[#120827] via-[#0f0a1f] to-[#0d0d16] px-4 pt-14 pb-0 overflow-hidden">
        <div className="absolute top-0 right-0 w-56 h-56 rounded-full bg-[#7c3aed]/10 blur-3xl pointer-events-none" />

        {/* Avatar row */}
        <div className="flex items-start justify-between mb-5 relative">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-[68px] h-[68px] rounded-2xl bg-gradient-to-br from-[#7c3aed] to-[#4c1d95] flex items-center justify-center text-2xl font-black text-white border-2 border-[#7c3aed]/30 shadow-xl shadow-purple-900/30">
                {user.fullName.charAt(0).toUpperCase()}
              </div>
              {user.role === "CREATOR" && (
                <div className="absolute -bottom-1.5 -right-1.5 w-6 h-6 rounded-full bg-[#7c3aed] border-2 border-[#0d0d16] flex items-center justify-center">
                  <Camera className="w-3 h-3 text-white" />
                </div>
              )}
            </div>
            <div>
              <h1 className="text-lg font-black text-white leading-tight">{user.fullName}</h1>
              <p className="text-xs text-[#555577] mt-0.5">
                @{user.fullName.replace(/\s+/g, "").toLowerCase()}
              </p>
              <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                <RoleBadge role={user.role} />
                {user.district && (
                  <span className="flex items-center gap-1 text-[10px] text-[#6b7280] bg-[#161622] border border-[#2a2a3e] px-2 py-0.5 rounded-full">
                    <MapPin className="w-2.5 h-2.5" />{user.district}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <button
              onClick={logout}
              className="w-9 h-9 rounded-xl bg-[#161622] border border-[#2a2a3e] flex items-center justify-center"
              title="Sign out"
            >
              <LogOut className="w-4 h-4 text-[#9ca3af]" />
            </button>
            <button
              className="w-9 h-9 rounded-xl bg-[#161622] border border-[#2a2a3e] flex items-center justify-center"
              title="Edit profile"
            >
              <Edit3 className="w-4 h-4 text-[#9ca3af]" />
            </button>
          </div>
        </div>

        {/* Stats bar */}
        {user.role === "CREATOR" && (
          <div className="grid grid-cols-3 gap-2 mb-5">
            <StatCard value={counts.APPROVED} label="Published"
              color="text-emerald-400" bg="bg-emerald-500/8 border-emerald-500/15" />
            <StatCard value={counts.PENDING}  label="Pending"
              color="text-amber-400"   bg="bg-amber-500/8 border-amber-500/15" />
            <StatCard value={counts.REJECTED} label="Rejected"
              color="text-rose-400"    bg="bg-rose-500/8 border-rose-500/15" />
          </div>
        )}

        {user.role === "EXPLORER" && (
          <div className="grid grid-cols-3 gap-2 mb-5">
            <StatCard value={0} label="Saved"    color="text-[#a78bfa]" bg="bg-[#7c3aed]/8 border-[#7c3aed]/15" />
            <StatCard value={0} label="Trips"    color="text-[#a78bfa]" bg="bg-[#7c3aed]/8 border-[#7c3aed]/15" />
            <StatCard value={0} label="Explored" color="text-[#a78bfa]" bg="bg-[#7c3aed]/8 border-[#7c3aed]/15" />
          </div>
        )}
      </div>

      {/* ── CREATOR: video list ── */}
      {user.role === "CREATOR" && (
        <div className="px-4 mt-1">
          {/* Tabs */}
          <div className="flex bg-[#161622] border border-[#2a2a3e] rounded-2xl p-1 gap-1 mb-4">
            {(["all", "APPROVED", "PENDING", "REJECTED"] as VideoTab[]).map(tab => (
              <button
                key={tab}
                onClick={() => handleTabChange(tab)}
                className={cn(
                  "flex-1 py-2 rounded-xl text-[11px] font-black transition-all",
                  activeTab === tab
                    ? "bg-[#7c3aed] text-white shadow-lg shadow-purple-900/30"
                    : "text-[#555577]"
                )}
              >
                {TAB_LABELS[tab]}
                <span className="ml-0.5 opacity-50">({counts[tab]})</span>
              </button>
            ))}
          </div>

          {videosLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-24 skeleton rounded-2xl" />
              ))}
            </div>
          ) : videos.length === 0 ? (
            <EmptyVideos tab={activeTab} onUpload={() => router.push("/upload")} />
          ) : (
            <div className="space-y-3">
              {videos.map(video => (
                <VideoListCard
                  key={video._id}
                  video={video}
                  onClick={() => router.push(`/place/${video._id}`)}
                />
              ))}
            </div>
          )}

          {/* Upload CTA */}
          <button
            onClick={() => router.push("/upload")}
            className="w-full mt-4 flex items-center justify-center gap-2 border-2 border-dashed border-[#7c3aed]/30 rounded-2xl py-4 text-sm font-black text-[#a78bfa] bg-[#7c3aed]/5 hover:bg-[#7c3aed]/10 active:scale-[0.98] transition-all"
          >
            <Camera className="w-4 h-4" />
            Upload new story
          </button>
        </div>
      )}

      {/* ── EXPLORER: menu ── */}
      {user.role === "EXPLORER" && (
        <div className="px-4 mt-2 space-y-5">
          <MenuSection title="MY CONTENT">
            <MenuItem icon={Bookmark} label="Saved places"   sub="Bookmarked videos"       onClick={() => router.push("/saved")} />
            <MenuItem icon={Route}    label="My trips"        sub="Planned itineraries"     onClick={() => router.push("/itineraries")} />
            <MenuItem icon={Video}    label="Saved videos"   sub="Videos you bookmarked"   onClick={() => router.push("/saved")} />
          </MenuSection>

          <MenuSection title="DISCOVER">
            <MenuItem icon={TrendingUp} label="Trending"       sub="Most saved places"       onClick={() => router.push("/")} />
            <MenuItem icon={MapPin}     label="Explore ROAM"   sub="Browse the video feed"   onClick={() => router.push("/explore")} />
          </MenuSection>

          <MenuSection title="ACCOUNT">
            <MenuItem icon={Settings} label="Settings" sub="Preferences & notifications"
              onClick={() => toast.info("Settings coming in V2")} />
            <MenuItem icon={LogOut} label="Sign out" sub="Log out of your account"
              onClick={logout} danger />
          </MenuSection>
        </div>
      )}

      {/* ── CREATOR: account menu ── */}
      {user.role === "CREATOR" && (
        <div className="px-4 mt-4 space-y-5">
          <MenuSection title="ACCOUNT">
            <MenuItem icon={Settings} label="Settings" sub="Preferences & notifications"
              onClick={() => toast.info("Settings coming in V2")} />
            <MenuItem icon={LogOut} label="Sign out" sub="Log out of your account"
              onClick={logout} danger />
          </MenuSection>
        </div>
      )}

      <ToastContainer toasts={toasts} onRemove={removeToast} />
      <BottomNav />
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────

function RoleBadge({ role }: { role: string }) {
  const cfg: Record<string, { icon: React.ElementType; label: string; cls: string }> = {
    EXPLORER: { icon: User,   label: "Explorer", cls: "bg-blue-500/12 text-blue-400 border-blue-500/20" },
    CREATOR:  { icon: Camera, label: "Creator",  cls: "bg-purple-500/12 text-purple-400 border-purple-500/20" },
    ADMIN:    { icon: Shield, label: "Admin",    cls: "bg-rose-500/12 text-rose-400 border-rose-500/20" },
  };
  const c = cfg[role];
  if (!c) return null;
  return (
    <span className={cn("flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full border", c.cls)}>
      <c.icon style={{ width: 10, height: 10 }} />
      {c.label}
    </span>
  );
}

function StatCard({ value, label, color, bg }: { value: number; label: string; color: string; bg: string }) {
  return (
    <div className={cn("rounded-2xl p-3 text-center border", bg)}>
      <div className={cn("text-xl font-black", color)}>{value}</div>
      <div className="text-[10px] text-[#555577] mt-0.5 font-semibold">{label}</div>
    </div>
  );
}

function MenuSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] font-black text-[#555577] tracking-widest mb-2">{title}</p>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function MenuItem({
  icon: Icon, label, sub, onClick, danger = false,
}: {
  icon: React.ElementType; label: string; sub: string;
  onClick: () => void; danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full bg-[#161622] rounded-2xl border px-4 py-3.5 flex items-center gap-3 active:opacity-70 transition-all text-left",
        danger
          ? "border-rose-500/15 hover:border-rose-500/30"
          : "border-[#2a2a3e] hover:border-[#7c3aed]/30"
      )}
    >
      <div className={cn(
        "w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0",
        danger ? "bg-rose-500/10" : "bg-[#1e1e2e]"
      )}>
        <Icon
          style={{ width: 18, height: 18 }}
          className={danger ? "text-rose-400" : "text-[#a78bfa]"}
        />
      </div>
      <div className="flex-1 min-w-0">
        <p className={cn("text-sm font-bold", danger ? "text-rose-400" : "text-white")}>{label}</p>
        <p className="text-[11px] text-[#555577] mt-0.5">{sub}</p>
      </div>
      {!danger && <ChevronRight className="w-4 h-4 text-[#2a2a3e]" />}
    </button>
  );
}

function VideoListCard({ video, onClick }: { video: IVideo; onClick: () => void }) {
  const status = VIDEO_STATUS[video.status];
  const cat    = CATEGORIES.find(c => c.value === video.category);
  const StatusIcon =
    video.status === "APPROVED" ? CheckCircle2 :
    video.status === "REJECTED" ? XCircle : Clock;

  return (
    <button
      onClick={onClick}
      className="w-full bg-[#161622] border border-[#2a2a3e] rounded-2xl overflow-hidden flex text-left active:opacity-70 transition-all hover:border-[#7c3aed]/20"
    >
      <div className="w-[72px] h-[88px] bg-[#1e1e2e] flex-shrink-0 relative overflow-hidden">
        {video.thumbnailUrl ? (
          <img src={video.thumbnailUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-2xl">
            {cat?.emoji || "🎬"}
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
      </div>

      <div className="flex-1 p-3 min-w-0">
        <p className="text-sm font-black text-white truncate leading-tight">{video.title}</p>
        <div className="flex items-center gap-1 mt-1">
          <MapPin className="w-3 h-3 text-[#555577]" />
          <span className="text-[11px] text-[#555577] truncate">
            {video.placeName}, {video.district}
          </span>
        </div>
        {cat && (
          <p className="text-[10px] text-[#555577] mt-0.5">{cat.emoji} {cat.label}</p>
        )}
        <div className="flex items-center justify-between mt-2">
          <div className={cn(
            "flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full border",
            status.bg, status.color
          )}>
            <StatusIcon style={{ width: 10, height: 10 }} />
            {status.label}
          </div>
          <span className="text-[10px] text-[#555577]">
            {formatRelativeTime(video.createdAt)}
          </span>
        </div>
        {video.status === "REJECTED" && video.rejectionReason && (
          <p className="text-[10px] text-rose-400 mt-1 line-clamp-1 italic">
            "{video.rejectionReason}"
          </p>
        )}
      </div>
    </button>
  );
}

function EmptyVideos({ tab, onUpload }: { tab: VideoTab; onUpload: () => void }) {
  const msgs: Record<VideoTab, { emoji: string; title: string; sub: string }> = {
    all:      { emoji: "🎬", title: "No videos yet",       sub: "Upload your first Karnataka story" },
    PENDING:  { emoji: "⏳", title: "Nothing pending",     sub: "All submissions have been reviewed" },
    APPROVED: { emoji: "✅", title: "No published videos", sub: "Keep uploading — great content gets approved!" },
    REJECTED: { emoji: "✨", title: "No rejections",       sub: "Looking good!" },
  };
  const m = msgs[tab];
  return (
    <div className="py-12 flex flex-col items-center text-center">
      <div className="text-5xl mb-4">{m.emoji}</div>
      <p className="text-sm font-black text-white mb-1">{m.title}</p>
      <p className="text-xs text-[#555577] mb-6">{m.sub}</p>
      {tab === "all" && (
        <button
          onClick={onUpload}
          className="flex items-center gap-2 bg-[#7c3aed] text-white font-black px-5 py-2.5 rounded-xl text-sm shadow-lg shadow-purple-900/30"
        >
          <Camera className="w-4 h-4" />
          Upload now
        </button>
      )}
    </div>
  );
}
