"use client";

import { useRouter } from "next/navigation";
import { LogOut, Settings, MapPin, Camera, Shield } from "lucide-react";
import { useAuth } from "@/features/auth/AuthContext";
import { useToast } from "@/hooks/useToast";
import { ToastContainer } from "@/components/ui/Toast";
import { cn } from "@/lib/utils";

export default function CreatorProfilePage() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { toasts, removeToast, toast } = useToast();

  if (!user) return null;

  return (
    <div className="min-h-dvh bg-[#0d0d16]">
      {/* Hero */}
      <div className="bg-gradient-to-b from-[#120827] to-[#0d0d16] px-4 pt-14 pb-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-[#7c3aed]/10 blur-3xl pointer-events-none" />

        <div className="relative flex flex-col items-center text-center">
          {/* Avatar */}
          <div className="relative mb-4">
            <div className="w-[80px] h-[80px] rounded-3xl bg-gradient-to-br from-[#a78bfa] to-[#7c3aed] flex items-center justify-center text-3xl font-black text-white border-2 border-[#7c3aed]/30 shadow-xl shadow-purple-900/40">
              {user.fullName.charAt(0).toUpperCase()}
            </div>
            <div className="absolute -bottom-2 -right-2 w-7 h-7 rounded-full bg-[#7c3aed] border-2 border-[#0d0d16] flex items-center justify-center">
              <Camera className="w-3.5 h-3.5 text-white" />
            </div>
          </div>

          <h1 className="text-xl font-black text-white">{user.fullName}</h1>
          <p className="text-xs text-[#555577] mt-0.5">@{user.fullName.replace(/\s+/g,"").toLowerCase()}</p>

          {/* Badges */}
          <div className="flex items-center gap-2 mt-3 flex-wrap justify-center">
            <span className="flex items-center gap-1 text-[10px] font-black px-2.5 py-1 rounded-full bg-blue-500/12 border border-blue-500/20 text-blue-400">
              <div className="w-3 h-3 rounded-full bg-blue-500 flex items-center justify-center">
                <span className="text-[6px] text-white font-black">✓</span>
              </div>
              Verified Creator
            </span>
            {user.district && (
              <span className="flex items-center gap-1 text-[10px] text-[#6b7280] bg-[#161622] border border-[#2a2a3e] px-2.5 py-1 rounded-full">
                <MapPin className="w-2.5 h-2.5" />{user.district}
              </span>
            )}
          </div>

          {/* Creator badge */}
          <div className="mt-4 bg-gradient-to-r from-[#7c3aed]/15 to-[#4c1d95]/15 border border-[#7c3aed]/25 rounded-2xl px-5 py-3 w-full">
            <div className="flex items-center justify-center gap-2">
              <Shield className="w-4 h-4 text-[#a78bfa]" />
              <p className="text-sm font-black text-[#a78bfa]">Verified Creator · Level 2</p>
            </div>
            <p className="text-[10px] text-[#555577] mt-1 text-center">
              Priority recommendations · Explorer Spotlight eligible
            </p>
          </div>
        </div>
      </div>

      {/* Menu */}
      <div className="px-4 pb-6 space-y-4">

        <MenuSection title="CREATOR TOOLS">
          <MenuItem
            emoji="📊" label="Dashboard" sub="Overview of your activity"
            onClick={() => router.push("/creator/dashboard")}
          />
          <MenuItem
            emoji="📤" label="Upload story" sub="Share a new Karnataka experience"
            onClick={() => router.push("/creator/upload")}
          />
          <MenuItem
            emoji="🎬" label="My content" sub="Manage your uploaded videos"
            onClick={() => router.push("/creator/content")}
          />
          <MenuItem
            emoji="📈" label="Analytics" sub="Views, saves and performance"
            onClick={() => router.push("/creator/analytics")}
          />
        </MenuSection>

        <MenuSection title="ACCOUNT">
          <MenuItem
            emoji="⚙️" label="Settings" sub="Preferences & notifications"
            onClick={() => toast.info("Settings coming in V2")}
          />
          <MenuItem
            emoji="🚪" label="Sign out" sub="Log out of your account"
            onClick={logout} danger
          />
        </MenuSection>

        <div className="bg-[#161622] border border-[#2a2a3e] rounded-2xl p-4 text-center">
          <p className="text-xs text-[#555577]">
            Want to switch to Explorer mode?{" "}
            <button onClick={() => router.push("/")} className="text-[#a78bfa] font-bold">
              Go to feed →
            </button>
          </p>
        </div>

      </div>

      <ToastContainer toasts={toasts} onRemove={removeToast} />
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
  emoji, label, sub, onClick, danger = false,
}: {
  emoji: string; label: string; sub: string; onClick: () => void; danger?: boolean;
}) {
  return (
    <button onClick={onClick}
      className={cn(
        "w-full bg-[#161622] rounded-2xl border px-4 py-3.5 flex items-center gap-3 active:opacity-70 transition-all text-left",
        danger ? "border-rose-500/15 hover:border-rose-500/30" : "border-[#2a2a3e] hover:border-[#7c3aed]/30"
      )}>
      <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center text-base flex-shrink-0",
        danger ? "bg-rose-500/10" : "bg-[#1e1e2e]"
      )}>
        {emoji}
      </div>
      <div className="flex-1 min-w-0">
        <p className={cn("text-sm font-bold", danger ? "text-rose-400" : "text-white")}>{label}</p>
        <p className="text-[11px] text-[#555577] mt-0.5">{sub}</p>
      </div>
      {!danger && <span className="text-[#2a2a3e] text-base">›</span>}
    </button>
  );
}
