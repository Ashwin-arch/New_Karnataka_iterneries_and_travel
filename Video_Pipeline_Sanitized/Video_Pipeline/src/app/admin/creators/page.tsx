"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Search, X, ShieldCheck, ShieldOff, UserX,
  UserCheck, MoreVertical, Loader2, MapPin,
  Camera, CheckCircle2
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Creator {
  _id: string;
  fullName: string;
  email: string;
  district?: string;
  isVerified: boolean;
  isActive: boolean;
  createdAt: string;
}

type ActionType = "verify" | "unverify" | "suspend" | "unsuspend";

export default function AdminCreatorsPage() {
  const [creators, setCreators]   = useState<Creator[]>([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState("");
  const [actioning, setActioning] = useState<string | null>(null);
  const [openMenu, setOpenMenu]   = useState<string | null>(null);

  const fetchCreators = useCallback(async (q = "") => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ role: "CREATOR" });
      if (q.trim()) params.set("search", q.trim());
      const res  = await fetch(`/api/admin/creators?${params}`);
      const data = await res.json();
      if (data.success) setCreators(data.data.creators);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCreators(); }, [fetchCreators]);

  useEffect(() => {
    const t = setTimeout(() => fetchCreators(search), 400);
    return () => clearTimeout(t);
  }, [search, fetchCreators]);

  const applyAction = async (creatorId: string, action: ActionType) => {
    setActioning(creatorId);
    setOpenMenu(null);
    try {
      const res  = await fetch(`/api/admin/creators/${creatorId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (data.success) {
        setCreators(prev => prev.map(c =>
          c._id === creatorId ? { ...c, ...data.data.user } : c
        ));
      }
    } finally {
      setActioning(null);
    }
  };

  const verified = creators.filter(c => c.isVerified).length;
  const suspended = creators.filter(c => !c.isActive).length;

  return (
    <div className="px-4 pt-5 pb-6">

      {/* Header */}
      <div className="mb-5">
        <h2 className="text-xl font-black text-white">Creators</h2>
        <p className="text-xs text-[#475569] mt-0.5">Manage and verify creators</p>
      </div>

      {/* Summary pills */}
      <div className="flex gap-2 mb-4">
        <div className="flex items-center gap-1.5 bg-[#0f172a] border border-[#1e293b] rounded-xl px-3 py-2">
          <Camera className="w-3.5 h-3.5 text-blue-400" />
          <span className="text-xs font-bold text-white">{creators.length} total</span>
        </div>
        <div className="flex items-center gap-1.5 bg-[#0f172a] border border-[#1e293b] rounded-xl px-3 py-2">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-xs font-bold text-white">{verified} verified</span>
        </div>
        {suspended > 0 && (
          <div className="flex items-center gap-1.5 bg-rose-500/8 border border-rose-500/15 rounded-xl px-3 py-2">
            <UserX className="w-3.5 h-3.5 text-rose-400" />
            <span className="text-xs font-bold text-rose-400">{suspended} suspended</span>
          </div>
        )}
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#475569]" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name or email..."
          className="w-full bg-[#0f172a] border border-[#1e293b] rounded-xl pl-9 pr-9 py-3 text-sm text-white placeholder-[#475569] focus:border-[#60a5fa] transition-all"
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="absolute right-3 top-1/2 -translate-y-1/2"
          >
            <X className="w-4 h-4 text-[#475569]" />
          </button>
        )}
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-20 skeleton rounded-2xl" />
          ))}
        </div>
      ) : creators.length === 0 ? (
        <div className="py-16 text-center">
          <div className="text-4xl mb-3">👤</div>
          <p className="text-sm font-bold text-white">No creators found</p>
        </div>
      ) : (
        <div className="space-y-2" onClick={() => setOpenMenu(null)}>
          {creators.map(creator => (
            <div
              key={creator._id}
              className={cn(
                "bg-[#0f172a] border rounded-2xl p-4 relative",
                !creator.isActive
                  ? "border-rose-500/15 opacity-60"
                  : creator.isVerified
                    ? "border-emerald-500/20"
                    : "border-[#1e293b]"
              )}
            >
              <div className="flex items-center gap-3">
                {/* Avatar */}
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#7c3aed] to-[#4c1d95] flex items-center justify-center text-sm font-black text-white flex-shrink-0">
                  {creator.fullName.charAt(0).toUpperCase()}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-bold text-white truncate">{creator.fullName}</p>
                    {creator.isVerified && (
                      <div className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                        <span className="text-[7px] text-white font-black">✓</span>
                      </div>
                    )}
                    {!creator.isActive && (
                      <span className="text-[9px] bg-rose-500/15 text-rose-400 border border-rose-500/20 rounded-full px-1.5 py-0.5 font-bold">
                        Suspended
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-[#475569] truncate">{creator.email}</p>
                  {creator.district && (
                    <div className="flex items-center gap-1 mt-0.5">
                      <MapPin className="w-2.5 h-2.5 text-[#334155]" />
                      <span className="text-[10px] text-[#334155]">{creator.district}</span>
                    </div>
                  )}
                </div>

                {/* Action menu trigger */}
                <button
                  onClick={e => { e.stopPropagation(); setOpenMenu(openMenu === creator._id ? null : creator._id); }}
                  disabled={actioning === creator._id}
                  className="w-8 h-8 rounded-lg bg-[#1e293b] flex items-center justify-center flex-shrink-0 active:opacity-70"
                >
                  {actioning === creator._id
                    ? <Loader2 className="w-3.5 h-3.5 text-[#64748b] animate-spin" />
                    : <MoreVertical className="w-3.5 h-3.5 text-[#64748b]" />
                  }
                </button>
              </div>

              {/* Dropdown menu */}
              {openMenu === creator._id && (
                <div
                  className="absolute right-4 top-14 bg-[#1e293b] border border-[#334155] rounded-xl overflow-hidden z-20 shadow-xl w-44"
                  onClick={e => e.stopPropagation()}
                >
                  {creator.isVerified ? (
                    <ActionMenuItem
                      icon={ShieldOff}
                      label="Remove verification"
                      color="text-amber-400"
                      onClick={() => applyAction(creator._id, "unverify")}
                    />
                  ) : (
                    <ActionMenuItem
                      icon={ShieldCheck}
                      label="Verify creator"
                      color="text-emerald-400"
                      onClick={() => applyAction(creator._id, "verify")}
                    />
                  )}
                  {creator.isActive ? (
                    <ActionMenuItem
                      icon={UserX}
                      label="Suspend account"
                      color="text-rose-400"
                      onClick={() => applyAction(creator._id, "suspend")}
                    />
                  ) : (
                    <ActionMenuItem
                      icon={UserCheck}
                      label="Unsuspend account"
                      color="text-blue-400"
                      onClick={() => applyAction(creator._id, "unsuspend")}
                    />
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ActionMenuItem({
  icon: Icon, label, color, onClick,
}: {
  icon: React.ElementType; label: string; color: string; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-2.5 px-4 py-3 text-xs font-bold hover:bg-[#334155] transition-all text-left"
    >
      <Icon className={cn("w-3.5 h-3.5", color)} />
      <span className={color}>{label}</span>
    </button>
  );
}
