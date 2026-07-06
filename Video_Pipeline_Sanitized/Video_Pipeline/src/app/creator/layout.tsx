"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard, Upload, Files,
  BarChart2, User
} from "lucide-react";
import { useAuth } from "@/features/auth/AuthContext";
import { cn } from "@/lib/utils";

const CREATOR_NAV = [
  { href: "/creator/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/creator/upload",    icon: Upload,          label: "Upload"    },
  { href: "/creator/content",   icon: Files,           label: "Content"   },
  { href: "/creator/analytics", icon: BarChart2,       label: "Analytics" },
  { href: "/creator/profile",   icon: User,            label: "Profile"   },
];

export default function CreatorLayout({ children }: { children: React.ReactNode }) {
  const router   = useRouter();
  const pathname = usePathname();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && (!user || user.role !== "CREATOR")) {
      router.push(user ? "/" : "/login");
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="h-dvh flex items-center justify-center bg-[#0d0d16]">
        <div className="w-8 h-8 border-2 border-[#7c3aed] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-[#0d0d16] flex flex-col">
      <div className="flex-1 overflow-y-auto pb-24">{children}</div>

      {/* Creator bottom nav — dark with purple accent */}
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] z-50">
        <div className="bg-[#0d0d16]/95 backdrop-blur-md border-t border-[#2a2a3e]">
          <div className="flex items-stretch justify-around px-2 py-2 pb-[calc(0.5rem+env(safe-area-inset-bottom,0px))]">
            {CREATOR_NAV.map(({ href, icon: Icon, label }) => {
              const isActive = pathname === href || pathname.startsWith(href + "/");
              return (
                <Link key={href} href={href} className="flex flex-col items-center justify-center gap-1 flex-1 py-1">
                  <Icon className={cn("w-[22px] h-[22px] transition-all", isActive ? "text-[#a78bfa]" : "text-[#555577]")} />
                  <span className={cn("text-[10px] font-bold transition-all", isActive ? "text-[#a78bfa]" : "text-[#555577]")}>
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
