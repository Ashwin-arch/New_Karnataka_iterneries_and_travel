"use client"

import { useState, useCallback } from "react"
import { Navigation, Plus, X, MapPin, Loader2, Volume2, VolumeX, Clock } from "lucide-react"
import type { KarnatakaLocation, TravelMode } from "@/lib/types"
import { CATEGORY_COLORS } from "@/lib/constants"

interface Waypoint {
  lat: number
  lng: number
  label: string
}

interface DirectionsPanelProps {
  darkMode: boolean
  onGetDirections: (mode: TravelMode) => void
  directionsMode: TravelMode
  showDirections: boolean
  routeInfo: { distance: string; duration: string; mode: string } | null
  allRoutes: google.maps.DirectionsRoute[] | null
  selectedRouteIndex: number
  onSwitchRoute: (index: number) => void
  waypoints: Waypoint[]
  onAddWaypoint: (loc: KarnatakaLocation) => void
  onRemoveWaypoint: (index: number) => void
  locations: KarnatakaLocation[]
  directionsLoading: boolean
  destinationLat: number
  destinationLng: number
  routeOptions: { avoidTolls: boolean; avoidHighways: boolean; avoidFerries: boolean }
  showRouteOptions: boolean
  onToggleRouteOptions: () => void
  onToggleAvoidTolls: () => void
  onToggleAvoidHighways: () => void
  onToggleAvoidFerries: () => void
}

export default function DirectionsPanel({
  darkMode, onGetDirections, directionsMode, showDirections,
  routeInfo, allRoutes, selectedRouteIndex, onSwitchRoute,
  waypoints, onAddWaypoint, onRemoveWaypoint, locations,
  directionsLoading, destinationLat, destinationLng,
  routeOptions, showRouteOptions, onToggleRouteOptions,
  onToggleAvoidTolls, onToggleAvoidHighways, onToggleAvoidFerries,
}: DirectionsPanelProps) {
  const [showWaypointsInput, setShowWaypointsInput] = useState(false)
  const [showSteps, setShowSteps] = useState(false)
  const [waypointInput, setWaypointInput] = useState("")
  const [waypointSuggestions, setWaypointSuggestions] = useState<KarnatakaLocation[]>([])
  const [voiceGuidance, setVoiceGuidance] = useState(false)
  const [speakingIndex, setSpeakingIndex] = useState(-1)

  const speak = useCallback((text: string) => {
    if (!voiceGuidance) return
    window.speechSynthesis?.cancel()
    const utterance = new SpeechSynthesisUtterance(text.replace(/<[^>]*>/g, ""))
    utterance.rate = 0.9
    utterance.pitch = 1
    window.speechSynthesis?.speak(utterance)
  }, [voiceGuidance])

  const handleSpeakSteps = useCallback(() => {
    if (!allRoutes?.[selectedRouteIndex]) return
    const steps = allRoutes[selectedRouteIndex].legs[0].steps
    let fullText = ""
    steps.forEach((step, i) => {
      fullText += `Step ${i + 1}: ${step.instructions.replace(/<[^>]*>/g, "")}. ${step.distance?.text}. `
    })
    speak(fullText)
  }, [allRoutes, selectedRouteIndex, speak])

  const getArrivalTime = () => {
    if (!routeInfo?.duration) return null
    const match = routeInfo.duration.match(/(\d+)\s*(min|mins|hour|hours|h)/)
    if (!match) return null
    const now = new Date()
    let totalMinutes = 0
    if (match[2].startsWith("hour")) {
      totalMinutes = parseInt(match[1]) * 60
    } else {
      totalMinutes = parseInt(match[1])
    }
    const arrival = new Date(now.getTime() + totalMinutes * 60000)
    return arrival.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  const bgMuted = darkMode ? "bg-slate-800" : "bg-slate-100"
  const bgMuted2 = darkMode ? "bg-slate-700/50" : "bg-slate-50"
  const textColor = darkMode ? "text-slate-200" : "text-slate-700"
  const textMuted = darkMode ? "text-slate-400" : "text-slate-500"
  const borderColor = darkMode ? "border-slate-700" : "border-slate-200"
  const inputBg = darkMode ? "bg-slate-700" : "bg-slate-50"

  function handleWaypointSearch(query: string) {
    setWaypointInput(query)
    if (!query.trim()) { setWaypointSuggestions([]); return }
    const q = query.toLowerCase()
    setWaypointSuggestions(
      locations.filter((l) => l.name.toLowerCase().includes(q) || l.place.toLowerCase().includes(q)).slice(0, 5)
    )
  }

  const btnClass = (active: boolean) =>
    `flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-medium transition-all active:scale-[0.97] ${
      active && showDirections
        ? "bg-sky-500 text-white shadow-sm"
        : active
        ? "bg-sky-500 text-white shadow-sm"
        : `${bgMuted} ${textColor} ${darkMode ? "hover:bg-slate-700" : "hover:bg-slate-200"}`
    }`

  return (
    <div>
      {/* Mode buttons */}
      <div className={`flex items-center gap-2 p-1 rounded-xl ${bgMuted}`}>
        {(["DRIVING", "WALKING", "BICYCLING", "TRANSIT"] as TravelMode[]).map((mode) => (
          <button key={mode} onClick={() => onGetDirections(mode)}
            className={btnClass(directionsMode === mode)}>
            <Navigation size={13} />
            {mode === "DRIVING" ? "Car" : mode === "WALKING" ? "Walk" : mode === "BICYCLING" ? "Bike" : "Transit"}
          </button>
        ))}
      </div>

      {/* Loading state */}
      {directionsLoading && (
        <div className={`flex items-center justify-center gap-2 py-3 ${textMuted}`}>
          <Loader2 size={14} className="animate-spin text-sky-500" />
          <span className="text-xs">Getting directions...</span>
        </div>
      )}

      {/* Route options */}
      <div className="mt-2">
        <button onClick={onToggleRouteOptions}
          className={`text-xs font-medium flex items-center gap-1 px-2.5 py-1.5 rounded-lg transition-colors ${
            showRouteOptions
              ? darkMode ? "bg-sky-900/40 text-sky-400" : "bg-sky-100 text-sky-700"
              : `${textMuted} ${darkMode ? "hover:bg-slate-800" : "hover:bg-slate-100"}`
          }`}>
          Route options
        </button>
        {showRouteOptions && (
          <div className={`mt-2 p-2 rounded-xl ${bgMuted2} space-y-1.5`} style={{ animation: "fadeInUpSmall 0.15s ease-out" }}>
            <label className="flex items-center gap-2 text-xs cursor-pointer">
              <input type="checkbox" checked={routeOptions.avoidTolls} onChange={onToggleAvoidTolls}
                className="rounded border-slate-300 text-sky-500 focus:ring-sky-400" />
              <span className={textColor}>Avoid tolls</span>
            </label>
            <label className="flex items-center gap-2 text-xs cursor-pointer">
              <input type="checkbox" checked={routeOptions.avoidHighways} onChange={onToggleAvoidHighways}
                className="rounded border-slate-300 text-sky-500 focus:ring-sky-400" />
              <span className={textColor}>Avoid highways</span>
            </label>
            <label className="flex items-center gap-2 text-xs cursor-pointer">
              <input type="checkbox" checked={routeOptions.avoidFerries} onChange={onToggleAvoidFerries}
                className="rounded border-slate-300 text-sky-500 focus:ring-sky-400" />
              <span className={textColor}>Avoid ferries</span>
            </label>
          </div>
        )}
      </div>

      {/* Route info with ETA */}
      {routeInfo && (
        <div className={`${darkMode ? "bg-sky-900/30" : "bg-sky-50"} rounded-xl p-3 text-sm`}
          style={{ animation: "fadeInUpSmall 0.2s ease-out" }}>
          <div className="flex items-center justify-between">
            <div>
              <span className={`font-semibold ${darkMode ? "text-sky-300" : "text-sky-700"}`}>
                {routeInfo.distance} · {routeInfo.duration}
              </span>
              {getArrivalTime() && (
                <div className={`flex items-center gap-1 mt-1 text-xs ${darkMode ? "text-sky-400" : "text-sky-600"}`}>
                  <Clock size={11} />
                  <span>ETA: {getArrivalTime()}</span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => setVoiceGuidance(!voiceGuidance)}
                className={`p-1.5 rounded-lg transition-colors ${
                  voiceGuidance
                    ? darkMode ? "bg-sky-900/50 text-sky-400" : "bg-sky-100 text-sky-600"
                    : `${textMuted} ${darkMode ? "hover:bg-slate-700" : "hover:bg-slate-100"}`
                }`}
                title={voiceGuidance ? "Mute voice guidance" : "Enable voice guidance"}>
                {voiceGuidance ? <Volume2 size={14} /> : <VolumeX size={14} />}
              </button>
              <button onClick={() => onGetDirections(directionsMode)}
                className={`text-xs font-medium px-2 py-1 rounded-lg transition-colors ${darkMode ? "text-sky-400 hover:bg-slate-700" : "text-sky-500 hover:bg-sky-100"}`}>
                Refresh route
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Waypoints */}
      <div className="mt-2">
        <div className="flex items-center gap-2 mb-1.5">
          <button onClick={() => setShowWaypointsInput(!showWaypointsInput)}
            className={`text-xs font-medium flex items-center gap-1 px-2.5 py-1.5 rounded-lg transition-colors ${
              showWaypointsInput
                ? darkMode ? "bg-sky-900/40 text-sky-400" : "bg-sky-100 text-sky-700"
                : `${textMuted} ${darkMode ? "hover:bg-slate-800" : "hover:bg-slate-100"}`
            }`}>
            <Plus size={11} /> Add stop
          </button>
          {showDirections && (
            <button onClick={() => setShowSteps(!showSteps)}
              className={`text-xs font-medium flex items-center gap-1 px-2.5 py-1.5 rounded-lg transition-colors ${
                showSteps
                  ? darkMode ? "bg-sky-900/40 text-sky-400" : "bg-sky-100 text-sky-700"
                  : `${textMuted} ${darkMode ? "hover:bg-slate-800" : "hover:bg-slate-100"}`
              }`}>
              <Navigation size={11} /> Steps
            </button>
          )}
          {showDirections && allRoutes && voiceGuidance && (
            <button onClick={handleSpeakSteps}
              className={`text-xs font-medium flex items-center gap-1 px-2.5 py-1.5 rounded-lg transition-colors ${
                darkMode ? "bg-sky-900/40 text-sky-400 hover:bg-sky-900/60" : "bg-sky-100 text-sky-700 hover:bg-sky-200"
              }`}>
              <Volume2 size={11} /> Speak
            </button>
          )}
        </div>

        {showWaypointsInput && (
          <div className="relative mb-2" style={{ animation: "fadeInUpSmall 0.15s ease-out" }}>
            <input value={waypointInput} onChange={(e) => handleWaypointSearch(e.target.value)}
              placeholder="Search place to add as stop..." autoComplete="off"
              className={`w-full px-3 py-2 text-xs border rounded-xl outline-none focus:border-sky-400 ${inputBg} ${textColor} ${borderColor}`} />
            {waypointSuggestions.length > 0 && (
              <div className={`absolute top-full left-0 right-0 mt-1 rounded-xl shadow-lg border ${borderColor} overflow-hidden z-10 ${darkMode ? "bg-slate-800" : "bg-white"}`}>
                {waypointSuggestions.map((loc) => (
                  <button key={loc.id} onMouseDown={() => { onAddWaypoint(loc); setWaypointInput(""); setWaypointSuggestions([]); setShowWaypointsInput(false) }}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-xs text-left ${darkMode ? "hover:bg-slate-700 border-slate-700" : "hover:bg-slate-50 border-slate-50"} border-b last:border-0 ${textColor}`}>
                    <span className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[8px] font-bold flex-shrink-0"
                      style={{ background: CATEGORY_COLORS[loc.category] || "#64748b" }}>{loc.id}</span>
                    <span className="font-medium">{loc.name}</span>
                    <span className="text-slate-400 ml-auto">{loc.place}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {waypoints.length > 0 && (
          <div className="space-y-1 mb-2">
            {waypoints.map((wp, i) => (
              <div key={i} className={`flex items-center gap-2 ${bgMuted2} rounded-lg px-2.5 py-1.5 text-xs`}
                style={{ animation: "fadeInUpSmall 0.15s ease-out" }}>
                <MapPin size={11} className="text-sky-500 flex-shrink-0" />
                <span className={`flex-1 truncate ${darkMode ? "text-slate-300" : "text-slate-700"}`}>{wp.label}</span>
                <button onClick={() => onRemoveWaypoint(i)}
                  className="p-0.5 hover:bg-red-50 rounded text-slate-300 hover:text-red-500 flex-shrink-0">
                  <X size={11} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Route alternatives */}
      {allRoutes && allRoutes.length > 1 && (
        <div className="mt-1 mb-2">
          <div className={`text-[10px] ${textMuted} uppercase tracking-wider mb-1.5`}>
            {allRoutes.length} routes found
          </div>
          <div className="flex flex-wrap gap-1">
            {allRoutes.map((route, i) => {
              const leg = route.legs[0]
              const isActive = i === selectedRouteIndex
              return (
                <button key={i} onClick={() => onSwitchRoute(i)}
                  className={`text-[10px] px-2.5 py-1.5 rounded-lg font-medium transition-all active:scale-95 ${
                    isActive
                      ? "bg-sky-500 text-white shadow-sm"
                      : `${bgMuted} ${textColor} ${darkMode ? "hover:bg-slate-700" : "hover:bg-slate-200"}`
                  }`}>
                  Route {i + 1} · {leg.distance?.text} · {leg.duration?.text}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Step-by-step directions */}
      {showSteps && allRoutes && allRoutes[selectedRouteIndex] && (
        <div className={`mt-2 border-t ${borderColor} pt-3`} style={{ animation: "fadeInUpSmall 0.2s ease-out" }}>
          <h4 className={`text-[10px] font-bold uppercase tracking-wider mb-2 flex items-center gap-1 ${darkMode ? "text-slate-300" : "text-slate-900"}`}>
            <Navigation size={11} className="text-sky-500" /> Turn-by-turn directions
          </h4>
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {allRoutes[selectedRouteIndex].legs.map((leg, li) => (
              <div key={li}>
                {leg.steps.map((step, si) => (
                  <div key={si} className="flex items-start gap-2 py-1.5 border-b border-slate-100 last:border-0">
                    <div className="w-1.5 h-1.5 rounded-full bg-sky-300 mt-1.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className={`text-xs leading-snug ${darkMode ? "text-slate-300" : "text-slate-700"}`}
                        dangerouslySetInnerHTML={{ __html: step.instructions }} />
                      <div className={`text-[10px] mt-0.5 ${textMuted}`}>
                        {step.distance?.text} · {step.duration?.text}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
