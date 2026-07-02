"use client";

import { useEffect, useState } from "react";
import {
  Clock, CheckCircle2, XCircle, Video,
  AlertTriangle, TrendingUp, Users, ArrowRight
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface Stats {
  pending:  number;
  approved: number;
  rejected: number;
  total:    number;
  creators: number;
}

const DISTRICT_DATA = [
  { name: "Kodagu",         views: 9200,  color: "#7c3aed" },
  { name: "Chikkamagaluru", views: 7400,  color: "#3b82f6" },
  { name: "Mysuru",         views: 6800,  color: "#10b981" },
  { name: "Hassan",         views: 5100,  color: "#f59e0b" },
  { name: "Uttara Kannada", views: 4300,  color: "#f43f5e" },
];
const MAX_VIEWS = 9200;

export default function AdminOverviewPage() {
  const [stats, setStats]   = useState<Stats>({ pending: 0, approved: 0, rejected: 0, total: 0, creators: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [pRes, aRes, rRes, cRes] = await Promise.all([
          fetch("/api/admin/videos?status=PENDING"),
          fetch("/api/admin/videos?status=APPROVED"),
          fetch("/api/admin/videos?status=REJECTED"),
          fetch("/api/admin/creators"),
        ]);
        const [p, a, r, c] = await Promise.all([pRes.json(), aRes.json(), rRes.json(), cRes.json()]);
        const pending  = p.data?.videos?.length  || 0;
        const approved = a.data?.videos?.length  || 0;
        const rejected = r.data?.videos?.length  || 0;
        const creators = c.data?.creators?.length || 0;
        setStats({ pending, approved, rejected, total: pending + approved + rejected, creators });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="px-4 pt-5 pb-6">

      {/* ── Page title ── */}
      <div className="mb-5">
        <h2 className="text-xl font-black text-white">Overview</h2>
        <p className="text-xs text-[#475569] mt-0.5">Platform health at a glance</p>
      </div>

      {/* ── Pending alert ── */}
      {!loading && stats.pending > 0 && (
        <Link href="/admin/videos">
          <div className="flex items-center gap-3 bg-amber-500/8 border border-amber-500/20 rounded-2xl p-4 mb-5 active:opacity-80 transition-all">
            <div className="w-10 h-10 rounded-xl bg-amber-500/12 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-black text-amber-300">
                {stats.pending} video{stats.pending !== 1 ? "s" : ""} awaiting review
              </p>
              <p className="text-xs text-amber-400/60 mt-0.5">Tap to review now</p>
            </div>
            <ArrowRight className="w-4 h-4 text-amber-400/60" />
          </div>
        </Link>
      )}

      {/* ── Stats grid ── */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <StatCard icon={Clock}       label="Pending"       value={stats.pending}  color="text-amber-400"   bg="bg-amber-500/8 border-amber-500/15"   loading={loading} />
        <StatCard icon={CheckCircle2} label="Published"    value={stats.approved} color="text-emerald-400" bg="bg-emerald-500/8 border-emerald-500/15" loading={loading} />
        <StatCard icon={XCircle}     label="Rejected"      value={stats.rejected} color="text-rose-400"    bg="bg-rose-500/8 border-rose-500/15"      loading={loading} />
        <StatCard icon={Users}       label="Creators"      value={stats.creators} color="text-blue-400"    bg="bg-blue-500/8 border-blue-500/15"      loading={loading} />
      </div>

      {/* ── Quick actions ── */}
      <p className="text-[10px] font-black text-[#334155] tracking-widest mb-3">QUICK ACTIONS</p>
      <div className="space-y-2 mb-6">
        <QuickAction
          href="/admin/videos?status=PENDING"
          icon={Clock}
          label="Review pending videos"
          sub={`${stats.pending} waiting for approval`}
          badge={stats.pending}
          badgeColor="bg-amber-500"
        />
        <QuickAction
          href="/admin/creators"
          icon={Users}
          label="Manage creators"
          sub={`${stats.creators} registered creators`}
          badge={0}
          badgeColor="bg-blue-500"
        />
        <QuickAction
          href="/admin/reports"
          icon={AlertTriangle}
          label="Trust & reports"
          sub="Review flagged content"
          badge={0}
          badgeColor="bg-rose-500"
        />
      </div>

      {/* ── Trending districts ── */}
      <p className="text-[10px] font-black text-[#334155] tracking-widest mb-3">TRENDING DISTRICTS</p>
      <div className="bg-[#0f172a] border border-[#1e293b] rounded-2xl p-4 space-y-3">
        {DISTRICT_DATA.map((d) => (
          <div key={d.name} className="flex items-center gap-3">
            <span className="text-xs text-[#64748b] w-[120px] truncate flex-shrink-0">{d.name}</span>
            <div className="flex-1 h-2 bg-[#1e293b] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${(d.views / MAX_VIEWS) * 100}%`,
                  background: d.color,
                }}
              />
            </div>
            <span className="text-xs text-[#64748b] w-12 text-right flex-shrink-0">
              {(d.views / 1000).toFixed(1)}k
            </span>
          </div>
        ))}
      </div>

      {/* ── Content overview ── */}
      <div className="mt-5 bg-[#0f172a] border border-[#1e293b] rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-4">
          <Video className="w-4 h-4 text-[#60a5fa]" />
          <p className="text-sm font-black text-white">Content overview</p>
        </div>
        <div className="space-y-3">
          {[
            { label: "Published",  value: stats.approved, color: "#10b981", total: stats.total },
            { label: "Pending",    value: stats.pending,  color: "#f59e0b", total: stats.total },
            { label: "Rejected",   value: stats.rejected, color: "#f43f5e", total: stats.total },
          ].map(item => (
            <div key={item.label}>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-[#64748b]">{item.label}</span>
                <span className="font-bold" style={{ color: item.color }}>{item.value}</span>
              </div>
              <div className="h-1.5 bg-[#1e293b] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: item.total > 0 ? `${(item.value / item.total) * 100}%` : "0%",
                    background: item.color,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
        {!loading && (
          <p className="text-[10px] text-[#334155] mt-3 text-center">
            {stats.total} total videos · {stats.total > 0 ? Math.round((stats.approved / stats.total) * 100) : 0}% approval rate
          </p>
        )}
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon, label, value, color, bg, loading,
}: {
  icon: React.ElementType; label: string; value: number;
  color: string; bg: string; loading: boolean;
}) {
  return (
    <div className={cn("rounded-2xl p-4 border", bg)}>
      <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center mb-3", bg)}>
        <Icon className={cn("w-4.5 h-4.5", color)} style={{ width: 18, height: 18 }} />
      </div>
      {loading
        ? <div className="h-7 w-10 skeleton rounded mb-1" />
        : <div className={cn("text-2xl font-black", color)}>{value}</div>
      }
      <div className="text-[10px] text-[#475569] mt-0.5 font-semibold">{label}</div>
    </div>
  );
}

function QuickAction({
  href, icon: Icon, label, sub, badge, badgeColor,
}: {
  href: string; icon: React.ElementType; label: string;
  sub: string; badge: number; badgeColor: string;
}) {
  return (
    <Link href={href}>
      <div className="bg-[#0f172a] border border-[#1e293b] rounded-2xl p-4 flex items-center gap-3 active:opacity-70 transition-all hover:border-[#334155]">
        <div className="w-10 h-10 rounded-xl bg-[#1e293b] flex items-center justify-center flex-shrink-0">
          <Icon className="w-5 h-5 text-[#60a5fa]" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-white">{label}</p>
          <p className="text-xs text-[#475569] mt-0.5">{sub}</p>
        </div>
        {badge > 0 && (
          <div className={cn("w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0", badgeColor)}>
            <span className="text-[10px] font-black text-white">{badge}</span>
          </div>
        )}
        <ArrowRight className="w-4 h-4 text-[#334155] flex-shrink-0" />
      </div>
    </Link>
  );
}
