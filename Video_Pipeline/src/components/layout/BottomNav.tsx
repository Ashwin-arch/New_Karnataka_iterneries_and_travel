"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Home, Compass, Map, Route, User, 
  LayoutDashboard, Upload, Files, BarChart2, 
  Video, Users, Flag
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/features/auth/AuthContext";

const EXPLORER_NAV = [
  { href: "/",            icon: Home,    label: "Home"    },
  { href: "/explore",     icon: Compass, label: "ROAM"    },
  { href: "/map",         icon: Map,     label: "Map",    isFab: true },
  { href: "/itineraries", icon: Route,   label: "Trips"   },
  { href: "/profile",     icon: User,    label: "Profile" },
];

const CREATOR_NAV = [
  { href: "/creator/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/creator/upload",    icon: Upload,          label: "Upload"    },
  { href: "/creator/content",   icon: Files,           label: "Content"   },
  { href: "/creator/analytics", icon: BarChart2,       label: "Analytics" },
  { href: "/creator/profile",   icon: User,            label: "Profile"   },
];

const ADMIN_NAV = [
  { href: "/admin",            icon: LayoutDashboard, label: "Overview"  },
  { href: "/admin/videos",     icon: Video,           label: "Moderate"  },
  { href: "/admin/creators",   icon: Users,           label: "Creators"  },
  { href: "/admin/reports",    icon: Flag,            label: "Reports"   },
  { href: "/admin/analytics",  icon: BarChart2,       label: "Analytics" },
];

export function BottomNav() {
  const pathname = usePathname();
  const { user } = useAuth();

  let NAV_ITEMS = EXPLORER_NAV;
  let activeColor = "text-[#a78bfa]";
  let inactiveColor = "text-[#555577]";
  let bgClass = "bg-[#0d0d16]/96 border-[#2a2a3e]";

  if (user?.role === "CREATOR") {
    NAV_ITEMS = CREATOR_NAV;
  } else if (user?.role === "ADMIN") {
    NAV_ITEMS = ADMIN_NAV;
    activeColor = "text-[#60a5fa]";
    inactiveColor = "text-[#334155]";
    bgClass = "bg-[#08101f]/96 border-[#0f172a]";
  }

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] z-50">
      <div className={cn("backdrop-blur-xl border-t", bgClass)}>
        <div className="flex items-end justify-around px-2 pb-[calc(0.5rem+env(safe-area-inset-bottom,0px))]">
          {NAV_ITEMS.map(({ href, icon: Icon, label, isFab }) => {
            const isActive =
              href === "/"
                ? pathname === "/"
                : pathname === href || pathname.startsWith(href + "/");

            if (isFab) {
              return (
                <Link
                  key={href}
                  href={href}
                  className="flex flex-col items-center gap-1 flex-1 -mt-5"
                >
                  <div className={cn(
                    "w-[52px] h-[52px] rounded-[18px] flex items-center justify-center shadow-xl transition-all",
                    isActive
                      ? "bg-[#7c3aed] shadow-[0_6px_24px_rgba(124,58,237,0.55)]"
                      : "bg-[#7c3aed] shadow-[0_4px_18px_rgba(124,58,237,0.35)]"
                  )}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <span className={cn(
                    "text-[10px] font-bold",
                    isActive ? activeColor : inactiveColor
                  )}>
                    {label}
                  </span>
                </Link>
              );
            }

            return (
              <Link
                key={href}
                href={href}
                // add py-2.5 for admin, py-1 for creator, but pt-2 for explorer. we can just do py-2.
                className="flex flex-col items-center justify-center gap-1 flex-1 py-2"
              >
                <Icon className={cn(
                  "w-[22px] h-[22px] transition-all",
                  isActive ? activeColor : inactiveColor
                )} />
                <span className={cn(
                  "text-[10px] font-bold transition-all",
                  isActive ? activeColor : inactiveColor
                )}>
                  {label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
