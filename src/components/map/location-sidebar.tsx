"use client"

import { useState, useRef } from "react"
import { MapIcon, X, ChevronRight, Layers, Search, Mountain, Droplets, Waves, Castle, Building2, Trees, Landmark, Tent, Compass, TreePine, Footprints, Rabbit, Gem, ArrowUpDown } from "lucide-react"
import type { KarnatakaLocation } from "@/lib/types"
import { CATEGORY_COLORS, CATEGORY_META } from "@/lib/constants"

const CATEGORY_ICONS: Record<string, typeof Mountain> = {
  waterfall: Droplets,
  beach: Waves,
  fort: Castle,
  temple: Landmark,
  backwaters: Droplets,
  park: Trees,
  hill: Mountain,
  town: Building2,
  dargah: Landmark,
  bridge: Compass,
  camping: Tent,
  adventure: Mountain,
  heritage: Gem,
  nature: TreePine,
  trekking: Footprints,
  wildlife: Rabbit,
}

interface LocationSidebarProps {
  darkMode: boolean
  sidebarOpen: boolean
  onToggle: () => void
  selectedLocation: KarnatakaLocation | null
  onPlaceClick: (loc: KarnatakaLocation) => void
  categoryFilter: string
  onCategoryFilter: (cat: string) => void
  locations: KarnatakaLocation[]
}

export default function LocationSidebar({
  darkMode, sidebarOpen, onToggle, selectedLocation, onPlaceClick,
  categoryFilter, onCategoryFilter, locations,
}: LocationSidebarProps) {
  const [showAllCategories, setShowAllCategories] = useState(false)
  const sideSwipeX = useRef(0)
  const sideSwipeY = useRef(0)

  function handleSideTouchStart(e: React.TouchEvent) {
    sideSwipeX.current = e.touches[0].clientX
    sideSwipeY.current = e.touches[0].clientY
  }

  function handleSideTouchEnd(e: React.TouchEvent) {
    const dx = e.changedTouches[0].clientX - sideSwipeX.current
    const dy = e.changedTouches[0].clientY - sideSwipeY.current
    if (dx < -60 && Math.abs(dy) < Math.abs(dx) * 1.5) onToggle()
  }
  const bg = darkMode ? "bg-slate-900/95" : "bg-white/95"
  const border = darkMode ? "border-slate-800" : "border-slate-200/80"
  const textColor = darkMode ? "text-slate-200" : "text-slate-900"
  const subTextColor = darkMode ? "text-slate-400" : "text-slate-400"
  const hoverBg = darkMode ? "hover:bg-slate-800/50" : "hover:bg-sky-50/50"
  const selectedBg = darkMode ? "bg-sky-900/30 border-l-sky-500" : "bg-sky-50 border-l-sky-500"
  const chipBg = darkMode ? "bg-slate-800" : "bg-slate-100"
  const chipText = darkMode ? "text-slate-300" : "text-slate-600"

  const sidebarLocations = categoryFilter === "all"
    ? locations
    : locations.filter((l) => l.category === categoryFilter)

  const categoryEntries = Object.entries(CATEGORY_META)
  const visibleCategories = showAllCategories ? categoryEntries : categoryEntries.slice(0, 6)

  return (
    <>
      {/* Sidebar toggle */}
      <button onClick={onToggle}
        className={`absolute top-3 left-3 z-30 rounded-full shadow-lg border p-2 transition-colors ${
          darkMode
            ? "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700"
            : "bg-white border-slate-200/80 text-slate-600 hover:bg-slate-50"
        }`}
        title={sidebarOpen ? "Hide sidebar" : "Show sidebar"}>
        <Layers size={18} />
      </button>

      {/* Sidebar */}
      <div className={`${sidebarOpen ? "translate-x-0" : "-translate-x-full"} fixed inset-y-0 left-0 z-20 max-md:w-[85vw] w-72 ${bg} backdrop-blur-md border-r ${border} shadow-xl transition-transform duration-300 flex flex-col`}
        onTouchStart={handleSideTouchStart}
        onTouchEnd={handleSideTouchEnd}>
        {/* Header */}
        <div className="max-md:p-3 p-4 border-b border-slate-100 flex-shrink-0">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="bg-gradient-to-br from-sky-500 to-sky-700 p-1.5 rounded-lg text-white shadow-sm">
                <MapIcon size={18} />
              </div>
              <h2 className={`max-md:text-sm text-base font-bold ${textColor}`}>Hidden Karnataka</h2>
            </div>
            <button onClick={onToggle}
              className={`p-1 rounded-lg md:hidden ${darkMode ? "hover:bg-slate-800 text-slate-400" : "hover:bg-slate-100 text-slate-400 hover:text-slate-600"}`}>
              <X size={16} />
            </button>
          </div>

          {/* Search hint */}
          <div className={`flex items-center gap-2 mb-3 px-3 py-2 rounded-xl ${darkMode ? "bg-slate-800 text-slate-400" : "bg-slate-100 text-slate-400"} text-xs`}>
            <Search size={12} />
            <span>Use the search bar above to find places</span>
          </div>

          {/* Category grid */}
          <div className="grid grid-cols-3 sm:grid-cols-3 gap-1.5">
            {/* All button */}
            <button onClick={() => onCategoryFilter("all")}
              className={`flex flex-col items-center gap-1 p-2 rounded-xl text-[10px] font-medium transition-all active:scale-95 ${
                categoryFilter === "all"
                  ? darkMode
                    ? "bg-white/10 text-white ring-1 ring-white/20"
                    : "bg-slate-900 text-white shadow-sm ring-1 ring-slate-900/10"
                  : `${chipBg} ${chipText} ${hoverBg}`
              }`}>
              <div className={`p-1.5 rounded-lg ${categoryFilter === "all" ? (darkMode ? "bg-white/20" : "bg-white/20") : darkMode ? "bg-slate-700" : "bg-white"} shadow-sm`}>
                <MapIcon size={14} className={categoryFilter === "all" ? "text-white" : darkMode ? "text-sky-400" : "text-sky-600"} />
              </div>
              <span className="truncate w-full text-center">All</span>
              <span className={`text-[9px] opacity-60`}>{locations.length}</span>
            </button>

            {visibleCategories.map(([k, v]) => {
              const Icon = CATEGORY_ICONS[k] || Mountain
              const count = locations.filter((l) => l.category === k).length
              const isActive = categoryFilter === k
              return (
                <button key={k} onClick={() => onCategoryFilter(k)}
                  className={`flex flex-col items-center gap-1 p-2 rounded-xl text-[10px] font-medium transition-all active:scale-95 ${
                    isActive
                      ? "text-white shadow-sm ring-1 ring-white/20"
                      : `${chipBg} ${chipText} ${hoverBg}`
                  }`}
                  style={isActive ? { background: v.color } : {}}>
                  <div className={`p-1.5 rounded-lg shadow-sm ${
                    isActive ? "bg-white/20" : darkMode ? "bg-slate-700" : "bg-white"
                  }`}>
                    <Icon size={14} className={isActive ? "text-white" : ""} />
                  </div>
                  <span className="truncate w-full text-center">{v.label}</span>
                  <span className={`text-[9px] opacity-60`}>{count}</span>
                </button>
              )
            })}
          </div>

          {/* Show more/less toggle */}
          {categoryEntries.length > 6 && (
            <button onClick={() => setShowAllCategories(!showAllCategories)}
              className={`w-full mt-2 flex items-center justify-center gap-1 py-1.5 rounded-lg text-[10px] font-medium transition-colors ${
                darkMode ? "text-slate-400 hover:bg-slate-800" : "text-slate-500 hover:bg-slate-100"
              }`}>
              <ArrowUpDown size={11} />
              {showAllCategories ? "Show less" : `Show ${categoryEntries.length - 6} more`}
            </button>
          )}
        </div>

        {/* Location list */}
        <div className="flex-1 overflow-y-auto">
          {sidebarLocations.length === 0 ? (
            <div className={`flex flex-col items-center justify-center py-12 px-4 ${subTextColor}`}>
              <Search size={32} className="mb-3 opacity-30" />
              <p className="text-xs text-center">No places found in this category</p>
              <button onClick={() => onCategoryFilter("all")}
                className={`mt-3 px-4 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                  darkMode ? "bg-slate-800 text-slate-300 hover:bg-slate-700" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}>
                View all places
              </button>
            </div>
          ) : (
            sidebarLocations.map((loc) => {
              const color = CATEGORY_COLORS[loc.category] || "#64748b"
              const isSelected = selectedLocation?.id === loc.id
              return (
                <button key={loc.id} onClick={() => onPlaceClick(loc)}
                  className={`w-full text-left max-md:px-3 max-md:py-2.5 px-4 py-3 flex items-center gap-3 border-b transition-colors ${
                    darkMode ? "border-slate-800/50" : "border-slate-100"
                  } ${hoverBg} ${isSelected ? selectedBg : ""}`}>
                  <span className="max-md:w-6 max-md:h-6 w-7 h-7 rounded-full flex items-center justify-center text-white max-md:text-[9px] text-[10px] font-bold flex-shrink-0 shadow-sm" style={{ background: color }}>{loc.id}</span>
                  <div className="min-w-0 flex-1">
                    <p className={`max-md:text-xs text-sm font-semibold truncate ${darkMode ? "text-slate-200" : "text-slate-800"}`}>{loc.name}</p>
                    <p className={`max-md:text-[10px] text-[11px] ${subTextColor} truncate flex items-center gap-1`}>
                      <span className={`w-1.5 h-1.5 rounded-full inline-block`} style={{ background: color }} />
                      {loc.place}
                    </p>
                  </div>
                  <ChevronRight size={14} className={`flex-shrink-0 ${darkMode ? "text-slate-600" : "text-slate-300"}`} />
                </button>
              )
            })
          )}
        </div>
      </div>
    </>
  )
}
