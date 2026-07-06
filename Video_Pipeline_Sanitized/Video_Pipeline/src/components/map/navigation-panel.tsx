"use client"

import { useState, useMemo, useCallback, useEffect } from "react"
import {
  ArrowRight, ArrowLeft, ArrowUp, Navigation,
  X, ChevronUp, ChevronDown, Loader2, Shield, AlertTriangle, Car,
  Bike, Footprints, GripHorizontal, RotateCcw, LocateFixed, Sun, Cloud, CloudRain, CloudSnow, CloudLightning, CloudFog,
} from "lucide-react"
import type { NavigationStatus, NavigationStep, EmergencyServiceType } from "@/lib/types"

const MANEUVER_LABELS: Record<string, string> = {
  "turn-left": "Turn left",
  "turn-right": "Turn right",
  "turn-slight-left": "Slight left",
  "turn-slight-right": "Slight right",
  "turn-sharp-left": "Sharp left",
  "turn-sharp-right": "Sharp right",
  straight: "Continue straight",
  "merge-left": "Merge left",
  "merge-right": "Merge right",
  "fork-left": "Keep left",
  "fork-right": "Keep right",
  "ramp-left": "Take ramp left",
  "ramp-right": "Take ramp right",
  "roundabout-left": "Roundabout",
  "roundabout-right": "Roundabout",
  "uturn-left": "Make a U-turn",
  "uturn-right": "Make a U-turn",
  "keep-left": "Keep left",
  "keep-right": "Keep right",
}

function extractRoadName(instruction: string): string {
  const match = instruction.match(/(?:onto|toward|into|on to)\s+<b>([^<]+)<\/b>/i)
  if (match) return match[1]
  const clean = instruction.replace(/<[^>]*>/g, "")
  const ontoMatch = clean.match(/(?:onto|toward|into|on to)\s+(.+?)(?:\.|$)/i)
  if (ontoMatch) return ontoMatch[1].trim()
  return ""
}

function getManeuverLabel(maneuver: string) {
  return MANEUVER_LABELS[maneuver] || "Continue"
}

function formatSpeed(speed: number | null | undefined): string {
  if (speed == null) return "--"
  return `${Math.round(speed)} km/h`
}

function getWeatherIcon(code: number) {
  if (code === 0) return Sun
  if (code <= 3) return Cloud
  if (code <= 48) return CloudFog
  if (code <= 57) return CloudRain
  if (code <= 77) return CloudSnow
  if (code <= 82) return CloudRain
  if (code <= 86) return CloudSnow
  return CloudLightning
}

interface WeatherData {
  temperature: number
  condition: string
  icon: React.ComponentType<{ size?: number; className?: string }>
}

interface NavigationPanelProps {
  darkMode: boolean
  isNavigating: boolean
  navigationStatus: NavigationStatus | null
  rerouting: boolean
  travelMode: "DRIVING" | "WALKING" | "BICYCLING" | "TRANSIT"
  steps: NavigationStep[]
  onEndNavigation: () => void
  onShowEmergencyServices: (type: EmergencyServiceType) => void
  mapType: "roadmap" | "satellite" | "terrain"
  onMapTypeChange: (type: "roadmap" | "satellite" | "terrain") => void
  destinationLat?: number
  destinationLng?: number
}

export default function NavigationPanel({
  darkMode, isNavigating, navigationStatus, rerouting,
  travelMode, steps, onEndNavigation, onShowEmergencyServices,
  mapType, onMapTypeChange, destinationLat, destinationLng,
}: NavigationPanelProps) {
  const [expanded, setExpanded] = useState(false)
  const [showSteps, setShowSteps] = useState(false)
  const [weather, setWeather] = useState<WeatherData | null>(null)

  useEffect(() => {
    if (!destinationLat || !destinationLng) return
    fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${destinationLat}&longitude=${destinationLng}&current=temperature_2m,weathercode&timezone=auto`,
    )
      .then((r) => r.json())
      .then((data) => {
        if (data?.current) {
          const codes: Record<number, string> = {
            0: "Clear", 1: "Mainly clear", 2: "Partly cloudy", 3: "Overcast",
            45: "Foggy", 48: "Depositing rime fog",
            51: "Light drizzle", 53: "Moderate drizzle", 55: "Dense drizzle",
            56: "Light freezing drizzle", 57: "Dense freezing drizzle",
            61: "Slight rain", 63: "Moderate rain", 65: "Heavy rain",
            66: "Light freezing rain", 67: "Heavy freezing rain",
            71: "Slight snow", 73: "Moderate snow", 75: "Heavy snow",
            77: "Snow grains",
            80: "Slight rain showers", 81: "Moderate rain showers", 82: "Violent rain showers",
            85: "Slight snow showers", 86: "Heavy snow showers",
            95: "Thunderstorm", 96: "Thunderstorm with slight hail", 99: "Thunderstorm with heavy hail",
          }
          const Icon = getWeatherIcon(data.current.weathercode)
          setWeather({
            temperature: Math.round(data.current.temperature_2m),
            condition: codes[data.current.weathercode] || "Unknown",
            icon: Icon,
          })
        }
      })
      .catch(() => {})
  }, [destinationLat, destinationLng])

  const bg = darkMode ? "bg-slate-900/95" : "bg-white/95"
  const border = darkMode ? "border-slate-700" : "border-slate-200"
  const textColor = darkMode ? "text-slate-200" : "text-slate-900"
  const subText = darkMode ? "text-slate-400" : "text-slate-500"
  const mutedBg = darkMode ? "bg-slate-800/50" : "bg-slate-50"

  const modeIcon = useMemo(() => {
    switch (travelMode) {
      case "DRIVING": return Car
      case "BICYCLING": return Bike
      case "WALKING": return Footprints
      case "TRANSIT": return Navigation
      default: return Navigation
    }
  }, [travelMode])

  const ModeIcon = modeIcon

  const nextStep = navigationStatus?.nextStep
  const maneuverLabel = nextStep ? getManeuverLabel(nextStep.maneuver) : ""
  const roadName = nextStep ? extractRoadName(nextStep.instruction) : ""

  const cleanInstruction = useCallback((html: string) => {
    return html.replace(/<[^>]*>/g, "")
  }, [])

  const getArrivalTime = useCallback(() => {
    if (!navigationStatus?.remainingDuration) return null
    const match = navigationStatus.remainingDuration.match(/(\d+)\s*(min|mins|hour|hours|h)/)
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
  }, [navigationStatus])

  const today = new Date()
  const dateStr = today.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" })
  const timeStr = today.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  const currentStep = navigationStatus?.currentStepIndex ?? 0
  const totalSteps = steps.length
  const progress = totalSteps > 0 ? ((currentStep + 1) / totalSteps) * 100 : 0

  if (!isNavigating) return null

  return (
    <div className="absolute inset-x-0 bottom-0 z-30 flex flex-col items-center pointer-events-none"
      style={{ animation: "fadeInUp 0.3s ease-out" }}>
      {/* Drag handle */}
      <button onClick={() => setExpanded(!expanded)}
        className="pointer-events-auto mb-[-4px] relative z-10 p-1.5 rounded-full transition-colors"
        aria-label={expanded ? "Collapse navigation" : "Expand navigation"}>
        <GripHorizontal size={20} className={darkMode ? "text-slate-500" : "text-slate-400"} />
      </button>

      {rerouting && (
        <div className={`pointer-events-auto px-4 py-2 rounded-t-xl shadow-lg border border-b-0 flex items-center gap-2 ${darkMode ? "bg-amber-900/90 border-amber-700 text-amber-200" : "bg-amber-50 border-amber-200 text-amber-800"}`}
          style={{ animation: "fadeIn 0.2s ease-out" }}>
          <Loader2 size={14} className="animate-spin" />
          <span className="text-xs font-semibold">Rerouting...</span>
        </div>
      )}

      {/* Main card */}
      <div className={`pointer-events-auto w-full max-w-2xl ${bg} backdrop-blur-md rounded-t-2xl shadow-2xl border-t ${border} overflow-hidden transition-all duration-300 ${
        expanded ? "max-h-[80vh]" : ""
      }`}>
        {/* Top section - always visible */}
        <div className="p-3 sm:p-4">
          {/* Date / Time / Weather row */}
          <div className={`flex items-center justify-between gap-2 mb-2 px-1`}>
            <div className="flex items-center gap-2">
              <p className={`text-[10px] font-bold uppercase tracking-wider ${subText}`}>
                {dateStr}
              </p>
              <span className={`text-[10px] ${subText}`}>·</span>
              <p className={`text-[10px] font-semibold ${textColor}`}>
                {timeStr}
              </p>
            </div>
            {weather && (
              <div className="flex items-center gap-1.5">
                <weather.icon size={14} className={darkMode ? "text-sky-400" : "text-sky-600"} />
                <span className={`text-[10px] font-semibold ${textColor}`}>{weather.temperature}°</span>
                <span className={`text-[9px] ${subText}`}>{weather.condition}</span>
              </div>
            )}
          </div>

          {/* Timeline progress bar */}
          {totalSteps > 0 && (
            <div className="mb-3">
              <div className={`h-1 rounded-full w-full ${darkMode ? "bg-slate-700" : "bg-slate-200"}`}>
                <div className="h-1 rounded-full bg-sky-500 transition-all duration-500"
                  style={{ width: `${Math.min(progress, 100)}%` }} />
              </div>
              <div className="flex items-center justify-between mt-1">
                <p className={`text-[9px] ${subText}`}>Step {currentStep + 1} of {totalSteps}</p>
                <p className={`text-[9px] ${subText}`}>{Math.round(progress)}%</p>
              </div>
            </div>
          )}

          {/* Next turn instruction */}
          {nextStep && (
            <div className={`flex items-center gap-3 p-3 rounded-xl ${mutedBg} mb-3`}
              style={{ animation: "fadeIn 0.3s ease-out" }}>
              <div className={`p-2.5 rounded-full flex-shrink-0 ${
                darkMode ? "bg-sky-900/60 text-sky-400" : "bg-sky-100 text-sky-600"
              }`}>
                {nextStep?.maneuver === "turn-left" ? <ArrowLeft size={22} /> :
                 nextStep?.maneuver === "turn-right" ? <ArrowRight size={22} /> :
                 nextStep?.maneuver === "turn-slight-left" ? <ArrowLeft size={22} /> :
                 nextStep?.maneuver === "turn-slight-right" ? <ArrowRight size={22} /> :
                 nextStep?.maneuver === "turn-sharp-left" ? <ArrowLeft size={22} /> :
                 nextStep?.maneuver === "turn-sharp-right" ? <ArrowRight size={22} /> :
                 nextStep?.maneuver === "roundabout-left" ? <RotateCcw size={22} /> :
                 nextStep?.maneuver === "roundabout-right" ? <ArrowRight size={22} /> :
                 nextStep?.maneuver === "uturn-left" || nextStep?.maneuver === "uturn-right" ? <RotateCcw size={22} /> :
                 nextStep?.maneuver?.startsWith("keep-left") || nextStep?.maneuver?.startsWith("fork-left") || nextStep?.maneuver?.startsWith("ramp-left") || nextStep?.maneuver?.startsWith("merge-left") ? <ArrowLeft size={22} /> :
                 nextStep?.maneuver?.startsWith("keep-right") || nextStep?.maneuver?.startsWith("fork-right") || nextStep?.maneuver?.startsWith("ramp-right") || nextStep?.maneuver?.startsWith("merge-right") ? <ArrowRight size={22} /> :
                 <ArrowUp size={22} />}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-bold ${textColor}`}>
                  {maneuverLabel}
                </p>
                {roadName && (
                  <p className={`text-xs ${subText} truncate`}>
                    onto <span className="font-semibold">{roadName}</span>
                  </p>
                )}
                {nextStep.distance && (
                  <p className={`text-xs font-medium mt-0.5 ${darkMode ? "text-sky-400" : "text-sky-600"}`}>
                    in {nextStep.distance}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Status bar */}
          <div className={`flex items-center justify-between gap-4 ${mutedBg} rounded-xl p-3`}>
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className={`p-2 rounded-full flex-shrink-0 ${
                darkMode ? "bg-slate-700" : "bg-slate-200"
              }`}>
                <ModeIcon size={16} className={darkMode ? "text-slate-300" : "text-slate-600"} />
              </div>
              <div className="min-w-0">
                <p className={`text-lg font-bold leading-tight ${textColor}`}>
                  {navigationStatus?.remainingDistance || "--"}
                </p>
                <p className={`text-xs ${subText} truncate`}>
                  {navigationStatus?.destinationName || "Destination"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 flex-shrink-0">
              <div className="text-right">
                <p className={`text-lg font-bold leading-tight ${textColor}`}>
                  {getArrivalTime() || navigationStatus?.remainingDuration || "--"}
                </p>
                <p className={`text-xs ${subText}`}>
                  {navigationStatus?.remainingDuration || "ETA"}
                </p>
              </div>
              <div className="text-right">
                <p className={`text-lg font-bold leading-tight ${textColor}`}>
                  {formatSpeed(navigationStatus?.speed)}
                </p>
                <p className={`text-xs ${subText}`}>Speed</p>
              </div>
            </div>
          </div>

          {/* Quick actions row */}
          <div className="flex items-center gap-2 mt-3">
            <button onClick={() => setShowSteps(!showSteps)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                darkMode ? "bg-slate-800 text-slate-300 hover:bg-slate-700" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}>
              <Navigation size={12} />
              {showSteps ? "Hide steps" : `${steps.length} steps`}
              {showSteps ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>

            {(["hospital", "police", "fire_station"] as EmergencyServiceType[]).map((type) => {
              const label = type === "hospital" ? "Hospital" : type === "police" ? "Police" : "Fire"
              const Icon = type === "hospital" ? Shield : type === "police" ? Shield : AlertTriangle
              return (
                <button key={type} onClick={() => onShowEmergencyServices(type)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    darkMode ? "bg-slate-800 text-slate-300 hover:bg-slate-700" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}>
                  <Icon size={12} className={type === "hospital" ? "text-red-500" : type === "police" ? "text-blue-500" : "text-orange-500"} />
                  {label}
                </button>
              )
            })}

            <div className="flex-1" />

            {/* Map type quick toggle */}
            <div className={`flex rounded-lg overflow-hidden border ${border} ${darkMode ? "bg-slate-800" : "bg-white"}`}>
              {(["roadmap", "satellite", "terrain"] as const).map((t) => (
                <button key={t} onClick={() => onMapTypeChange(t)}
                  className={`px-2 py-1 text-[9px] font-medium transition-colors ${
                    mapType === t
                      ? darkMode ? "bg-sky-900/50 text-sky-400" : "bg-sky-100 text-sky-700"
                      : darkMode ? "text-slate-500 hover:text-slate-300" : "text-slate-400 hover:text-slate-600"
                  }`}>
                  {t === "roadmap" ? "Map" : t === "satellite" ? "Sat" : "Terrain"}
                </button>
              ))}
            </div>

            <button onClick={onEndNavigation}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                darkMode
                  ? "bg-red-900/50 text-red-400 hover:bg-red-900/70 border border-red-800/50"
                  : "bg-red-50 text-red-600 hover:bg-red-100 border border-red-200"
              }`}>
              <X size={12} /> End
            </button>
          </div>
        </div>

        {/* Steps section */}
        {showSteps && steps.length > 0 && (
          <div className={`border-t ${border} max-h-60 overflow-y-auto ${darkMode ? "scrollbar-dark" : ""}`}
            style={{ animation: "fadeIn 0.2s ease-out" }}>
            <div className="p-3 space-y-1">
              <p className={`text-[10px] font-bold uppercase tracking-wider px-1 mb-2 ${subText}`}>
                Turn-by-turn directions
              </p>
              {steps.map((step, i) => {
                const isActive = navigationStatus?.currentStepIndex === i
                const isPast = (navigationStatus?.currentStepIndex ?? 0) > i
                return (
                  <div key={i} className={`flex items-start gap-2.5 p-2 rounded-lg transition-colors ${
                    isActive
                      ? darkMode ? "bg-sky-900/30" : "bg-sky-50"
                      : isPast
                      ? "opacity-50"
                      : ""
                  }`}>
                    <div className={`p-1.5 rounded-full flex-shrink-0 mt-0.5 ${
                      isActive
                        ? darkMode ? "bg-sky-900/60 text-sky-400" : "bg-sky-100 text-sky-600"
                        : darkMode ? "bg-slate-800 text-slate-500" : "bg-slate-100 text-slate-400"
                    }`}>
                      {step.maneuver === "turn-left" ? <ArrowLeft size={12} /> :
                       step.maneuver === "turn-right" ? <ArrowRight size={12} /> :
                       step.maneuver === "turn-slight-left" || step.maneuver === "turn-sharp-left" ? <ArrowLeft size={12} /> :
                       step.maneuver === "turn-slight-right" || step.maneuver === "turn-sharp-right" ? <ArrowRight size={12} /> :
                       step.maneuver === "roundabout-left" ? <RotateCcw size={12} /> :
                       step.maneuver === "roundabout-right" || step.maneuver === "uturn-right" ? <ArrowRight size={12} /> :
                       step.maneuver === "uturn-left" ? <RotateCcw size={12} /> :
                       step.maneuver?.startsWith("keep-left") || step.maneuver?.startsWith("fork-left") || step.maneuver?.startsWith("ramp-left") || step.maneuver?.startsWith("merge-left") ? <ArrowLeft size={12} /> :
                       step.maneuver?.startsWith("keep-right") || step.maneuver?.startsWith("fork-right") || step.maneuver?.startsWith("ramp-right") || step.maneuver?.startsWith("merge-right") ? <ArrowRight size={12} /> :
                       <ArrowUp size={12} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs leading-snug ${isActive ? textColor : darkMode ? "text-slate-400" : "text-slate-500"}`}>
                        {cleanInstruction(step.instruction)}
                      </p>
                      <p className={`text-[10px] mt-0.5 ${subText}`}>
                        {step.distance} · {step.duration}
                      </p>
                    </div>
                    {isActive && (
                      <span className={`p-1 rounded-full flex-shrink-0 ${darkMode ? "bg-sky-500" : "bg-sky-500"}`}>
                        <LocateFixed size={8} className="text-white" />
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
