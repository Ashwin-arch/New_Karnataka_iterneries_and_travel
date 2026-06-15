"use client"

import { ZoomIn, ZoomOut, LocateFixed, Layers, Car, Navigation, Maximize2, Moon, Sun as SunIcon } from "lucide-react"
import { MAP_TYPES } from "@/lib/constants"
import type { MapTypeId } from "@/lib/types"

interface MapControlsProps {
  mapInstance: google.maps.Map | null
  mapType: MapTypeId
  onMapTypeChange: (type: MapTypeId) => void
  onCurrentLocation: () => void
  onFitBounds: () => void
  showHeatmap: boolean
  onToggleHeatmap: () => void
  showTraffic: boolean
  onToggleTraffic: () => void
  showTransit: boolean
  onToggleTransit: () => void
  showBicycling: boolean
  onToggleBicycling: () => void
  isFullscreen: boolean
  onToggleFullscreen: () => void
  darkMode: boolean
  onToggleDarkMode: () => void
  isTracking: boolean
  locationAccuracy: number | null
}

export default function MapControls({
  mapInstance, mapType, onMapTypeChange, onCurrentLocation,
  onFitBounds, showTraffic, onToggleTraffic,
  showTransit, onToggleTransit,
  isFullscreen, onToggleFullscreen, darkMode, onToggleDarkMode,
  isTracking, locationAccuracy,
}: MapControlsProps) {
  const btnClass = `flex items-center justify-center max-md:w-10 max-md:h-10 w-11 h-11 rounded-xl shadow-lg border transition-all duration-200 active:scale-95 ${
    darkMode
      ? "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700"
      : "bg-white border-slate-200/80 text-slate-600 hover:bg-slate-50"
  }`

  const activeBtnClass = (active: boolean) =>
    active
      ? darkMode
        ? "bg-sky-900/50 text-sky-400 border-sky-700"
        : "bg-sky-50 text-sky-600 border-sky-200"
      : ""

  return (
    <div className="absolute max-md:right-1 right-3 top-1/2 -translate-y-1/2 z-20 flex flex-col gap-1 max-md:gap-1 max-md:max-h-[70vh] max-md:overflow-y-auto">
      {/* Zoom */}
      <div className={`max-md:w-10 flex flex-col rounded-xl shadow-lg border overflow-hidden ${
        darkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200/80"
      }`}>
        <button onClick={() => mapInstance?.setZoom((mapInstance.getZoom() || 7) + 1)}
          className={`flex items-center justify-center max-md:w-10 max-md:h-10 w-11 h-11 transition-colors border-b ${darkMode ? "border-slate-700 text-slate-300 hover:bg-slate-700" : "border-slate-100 text-slate-600 hover:bg-slate-50"}`}
          title="Zoom in" aria-label="Zoom in"><ZoomIn size={20} /></button>
        <button onClick={() => mapInstance?.setZoom((mapInstance.getZoom() || 7) - 1)}
          className={`flex items-center justify-center max-md:w-10 max-md:h-10 w-11 h-11 transition-colors ${darkMode ? "text-slate-300 hover:bg-slate-700" : "text-slate-600 hover:bg-slate-50"}`}
          title="Zoom out" aria-label="Zoom out"><ZoomOut size={20} /></button>
      </div>

      {/* Current location */}
      <button onClick={onCurrentLocation}
        className={`${btnClass} relative`}
        title={isTracking ? `Tracking (${locationAccuracy?.toFixed(0)}m accuracy)` : "My location"}
        aria-label={isTracking ? "Tracking location" : "My location"}>
        <LocateFixed size={18} className={isTracking ? "text-sky-400" : ""} />
        {isTracking && (
          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-sky-400 rounded-full animate-pulse" />
        )}
      </button>
      {isTracking && locationAccuracy != null && (
        <div className={`px-2 py-1 rounded-lg shadow-lg text-xs font-medium text-center ${
          darkMode ? "bg-slate-800 text-slate-300" : "bg-white text-slate-600"
        }`}>
          ±{Math.round(locationAccuracy)}m
        </div>
      )}

      {/* Map type */}
      <div className={`max-md:w-10 flex flex-col rounded-xl shadow-lg border overflow-hidden ${
        darkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200/80"
      }`}>
        {MAP_TYPES.map((t) => (
          <button key={t.id} onClick={() => onMapTypeChange(t.id)}
            className={`max-md:w-10 max-md:h-10 w-11 h-11 transition-colors text-[10px] font-medium flex flex-col items-center justify-center gap-0.5 ${
              mapType === t.id
                ? darkMode ? "bg-sky-900/50 text-sky-400" : "bg-sky-50 text-sky-600"
                : darkMode ? "text-slate-400 hover:bg-slate-700" : "text-slate-500 hover:bg-slate-50"
            } ${t.id !== "terrain" ? (darkMode ? "border-b border-slate-700" : "border-b border-slate-100") : ""}`}
            title={t.label} aria-label={t.label}>
            <t.icon size={16} /><span className="text-[7px] leading-none">{t.label === "Satellite" ? "Sat" : t.label}</span>
          </button>
        ))}
      </div>

      {/* Fit bounds */}
      <button onClick={onFitBounds}
        className={btnClass} title="Show all places" aria-label="Show all places">
        <Layers size={18} />
      </button>

      {/* Traffic */}
      <button onClick={onToggleTraffic}
        className={`${btnClass} ${showTraffic ? (darkMode ? "!text-green-400" : "!text-green-500") : ""}`}
        title="Traffic" aria-label="Traffic layer">
        <Car size={18} />
      </button>

      {/* Transit */}
      <button onClick={onToggleTransit}
        className={`${btnClass} ${showTransit ? (darkMode ? "!text-purple-400" : "!text-purple-500") : ""}`}
        title="Transit" aria-label="Transit layer">
        <Navigation size={18} />
      </button>

      {/* Dark mode */}
      <button onClick={onToggleDarkMode}
        className={`${btnClass} ${darkMode ? "!text-amber-400" : ""}`}
        title={darkMode ? "Light mode" : "Dark mode"} aria-label="Toggle dark mode">
        {darkMode ? <SunIcon size={18} /> : <Moon size={18} />}
      </button>

      {/* Fullscreen */}
      <button onClick={onToggleFullscreen}
        className={`${btnClass} ${isFullscreen ? (darkMode ? "!text-sky-400" : "!text-sky-500") : ""}`}
        title="Fullscreen" aria-label="Toggle fullscreen">
        <Maximize2 size={18} />
      </button>
    </div>
  )
}
