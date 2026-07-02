"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard, Video, Users,
  Flag, BarChart2, Shield, LogOut
} from "lucide-react";
import { useAuth } from "@/features/auth/AuthContext";
import { cn } from "@/lib/utils";

// Admin 5-tab nav: Overview | Moderate | Creators | Reports | Analytics
const ADMIN_NAV = [
  { href: "/admin",            icon: LayoutDashboard, label: "Overview"  },
  { href: "/admin/videos",     icon: Video,           label: "Moderate"  },
  { href: "/admin/creators",   icon: Users,           label: "Creators"  },
  { href: "/admin/reports",    icon: Flag,            label: "Reports"   },
  { href: "/admin/analytics",  icon: BarChart2,       label: "Analytics" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router   = useRouter();
  const pathname = usePathname();
  const { user, loading, logout } = useAuth();

  useEffect(() => {
    if (!loading && (!user || user.role !== "ADMIN")) router.push("/login");
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="h-dvh flex items-center justify-center bg-[#080c18]">
        <div className="w-8 h-8 border-2 border-[#60a5fa] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-[#080c18] flex flex-col">
      {/* Admin top bar */}
      <div className="flex items-center justify-between px-4 pt-12 pb-3 border-b border-[#0f172a] bg-[#08101f] sticky top-0 z-30">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#1e40af] flex items-center justify-center shadow-lg shadow-blue-900/40">
            <Shield className="w-[18px] h-[18px] text-white" />
          </div>
          <div>
            <h1 className="text-sm font-black text-white leading-tight">Admin Console</h1>
            <p className="text-[10px] text-[#334155]">Incredible Karnataka</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-1.5 text-xs font-bold text-[#475569] hover:text-white bg-[#0f172a] border border-[#1e293b] px-3 py-2 rounded-xl transition-all active:opacity-70"
        >
          <LogOut className="w-3.5 h-3.5" />
          Sign out
        </button>
      </div>

      {/* Page content */}
      <div className="flex-1 overflow-y-auto pb-24">{children}</div>

      {/* Admin bottom nav — 5 tabs, blue accent */}
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] z-50">
        <div className="bg-[#08101f]/96 backdrop-blur-xl border-t border-[#0f172a]">
          <div className="flex items-stretch justify-around px-1 pb-[calc(0.5rem+env(safe-area-inset-bottom,0px))]">
            {ADMIN_NAV.map(({ href, icon: Icon, label }) => {
              const isActive = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  className="flex flex-col items-center justify-center gap-1 flex-1 py-2.5"
                >
                  <Icon className={cn("w-5 h-5 transition-all", isActive ? "text-[#60a5fa]" : "text-[#334155]")} />
                  <span className={cn("text-[9px] font-black transition-all", isActive ? "text-[#60a5fa]" : "text-[#334155]")}>
                    {label}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>
    </div>
  );
}
