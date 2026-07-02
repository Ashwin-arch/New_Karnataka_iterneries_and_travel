"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import {
  Loader2, UtensilsCrossed, Hotel, Building2, Star, Navigation, MapPin, ChevronRight,
} from "lucide-react"

type PlaceType = "restaurant" | "hotel" | "lodging"

export interface NearbyPlaceResult {
  name: string
  address: string
  rating?: number
  type: PlaceType
  placeId: string
  vicinity: string
  openNow?: boolean
  lat: number
  lng: number
}

interface NearbyPlacesProps {
  lat: number
  lng: number
  onPlacesChange?: (places: NearbyPlaceResult[]) => void
  darkMode?: boolean
}

const PLACE_TYPES: { type: PlaceType; label: string; icon: typeof UtensilsCrossed; plural: string }[] = [
  { type: "restaurant", label: "Eateries", icon: UtensilsCrossed, plural: "eateries" },
  { type: "hotel", label: "Hotels", icon: Hotel, plural: "hotels" },
  { type: "lodging", label: "Stays", icon: Building2, plural: "stays" },
]

const TYPE_STYLES: Record<PlaceType, {
  bg: string; gradient: string; text: string; ring: string;
  dot: string; glow: string; iconBg: string;
}> = {
  restaurant: {
    bg: "#f97316", text: "text-orange-600",
    gradient: "from-orange-500 to-amber-500",
    ring: "ring-orange-200", dot: "bg-orange-500",
    glow: "0 0 12px rgba(249,115,22,0.25)",
    iconBg: "bg-orange-50",
  },
  hotel: {
    bg: "#8b5cf6", text: "text-purple-600",
    gradient: "from-purple-500 to-violet-500",
    ring: "ring-purple-200", dot: "bg-purple-500",
    glow: "0 0 12px rgba(139,92,246,0.25)",
    iconBg: "bg-purple-50",
  },
  lodging: {
    bg: "#06b6d4", text: "text-cyan-600",
    gradient: "from-cyan-500 to-teal-400",
    ring: "ring-cyan-200", dot: "bg-cyan-500",
    glow: "0 0 12px rgba(6,182,212,0.25)",
    iconBg: "bg-cyan-50",
  },
}

function StarRating({ rating, darkMode }: { rating?: number; darkMode?: boolean }) {
  if (!rating) return null
  const full = Math.floor(rating)
  const hasHalf = rating - full >= 0.25 && rating - full < 0.75
  const empty = 5 - full - (hasHalf ? 1 : 0)
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: full }).map((_, i) => (
        <Star key={`f${i}`} size={10} className="text-amber-400 fill-amber-400" />
      ))}
      {hasHalf && (
        <span className="relative">
          <Star size={10} className="text-slate-200" />
          <span className="absolute inset-0 overflow-hidden" style={{ width: "50%" }}>
            <Star size={10} className="text-amber-400 fill-amber-400" />
          </span>
        </span>
      )}
      {Array.from({ length: empty }).map((_, i) => (
        <Star key={`e${i}`} size={10} className={darkMode ? "text-slate-600" : "text-slate-200"} />
      ))}
      <span className={`text-[10px] font-semibold ml-1 ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
        {rating.toFixed(1)}
      </span>
    </div>
  )
}

function PlaceCard({ place, index, darkMode = false, onDirections }: {
  place: NearbyPlaceResult; index: number; darkMode?: boolean;
  onDirections: (lat: number, lng: number) => void;
}) {
  const ts = TYPE_STYLES[place.type]
  const bg = darkMode ? "bg-slate-800/60" : "bg-white"
  const border = darkMode ? "border-slate-700/50" : "border-slate-100"
  const textColor = darkMode ? "text-slate-200" : "text-slate-800"
  const subText = darkMode ? "text-slate-400" : "text-slate-500"

  return (
    <div
      className={`group relative rounded-2xl border ${border} ${bg} overflow-hidden transition-all duration-300 hover:shadow-xl active:scale-[0.98]`}
      style={{
        animation: `cardSlideUp 0.4s ease-out ${index * 60}ms both`,
        borderLeftWidth: 3,
        borderLeftColor: ts.bg,
      }}
    >
      <div className="p-3.5 sm:p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1 flex items-start gap-3">
            <span
              className={`relative flex-shrink-0 w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-white text-xs sm:text-sm font-extrabold shadow-lg transition-transform duration-300 group-hover:scale-110`}
              style={{ background: `linear-gradient(135deg, ${ts.bg}, ${ts.bg}dd)`, boxShadow: ts.glow }}
            >
              {index + 1}
            </span>
            <div className="min-w-0 flex-1 pt-0.5">
              <h4 className={`text-sm sm:text-base font-bold ${textColor} leading-tight truncate`}>
                {place.name}
              </h4>
              <p className={`text-[11px] sm:text-xs ${subText} truncate mt-0.5 flex items-center gap-1`}>
                <MapPin size={10} className="flex-shrink-0 opacity-60" />
                {place.vicinity}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            {place.openNow !== undefined && (
              <span className={`flex items-center gap-1 text-[10px] sm:text-[11px] font-semibold px-2 sm:px-2.5 py-1 rounded-full transition-all ${
                place.openNow
                  ? darkMode
                    ? "bg-emerald-900/30 text-emerald-400 ring-1 ring-emerald-800/30"
                    : "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/50"
                  : darkMode
                    ? "bg-slate-700/50 text-slate-400 ring-1 ring-slate-600/30"
                    : "bg-slate-100 text-slate-500 ring-1 ring-slate-200/50"
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${
                  place.openNow ? "bg-emerald-500 animate-pulse" : darkMode ? "bg-slate-500" : "bg-slate-300"
                }`} />
                {place.openNow ? "Open" : "Closed"}
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3 mt-2.5 sm:mt-3 pl-0 sm:pl-[44px]">
          <StarRating rating={place.rating} darkMode={darkMode} />
          <button
            onClick={() => onDirections(place.lat, place.lng)}
            className={`flex items-center justify-center gap-1.5 text-[11px] sm:text-xs font-semibold px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl transition-all duration-200 ${
              darkMode
                ? "bg-sky-900/30 text-sky-400 hover:bg-sky-900/50 hover:text-sky-300 active:bg-sky-900/60"
                : "bg-gradient-to-r from-sky-50 to-blue-50 text-sky-600 hover:from-sky-100 hover:to-blue-100 active:from-sky-200 active:to-blue-200"
            }`}
          >
            <Navigation size={12} className="flex-shrink-0" />
            <span>Directions</span>
            <ChevronRight size={10} className="opacity-50 -ml-0.5" />
          </button>
        </div>
      </div>

      <div
        className="absolute inset-x-0 bottom-0 h-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{ background: `linear-gradient(90deg, ${ts.bg}, transparent)` }}
      />
    </div>
  )
}

export default function NearbyPlaces({ lat, lng, onPlacesChange, darkMode }: NearbyPlacesProps) {
  const [activeTab, setActiveTab] = useState<PlaceType>("restaurant")
  const [places, setPlaces] = useState<NearbyPlaceResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const serviceRef = useRef<google.maps.places.PlacesService | null>(null)

  const searchPlaces = useCallback((type: PlaceType) => {
    if (!window.google?.maps?.places?.PlacesServiceStatus) {
      setError("Places API library not loaded")
      onPlacesChange?.([])
      return
    }

    if (!serviceRef.current) {
      const dummy = document.createElement("div")
      serviceRef.current = new google.maps.places.PlacesService(dummy)
    }

    setLoading(true)
    setError(null)

    try {
      serviceRef.current.nearbySearch(
        {
          location: { lat, lng },
          radius: 5000,
          type,
        },
        (results, status) => {
          setLoading(false)
          if (status === google.maps.places.PlacesServiceStatus.OK && results) {
            const mapped: NearbyPlaceResult[] = results.slice(0, 8).map((p) => ({
              name: p.name || "",
              address: p.vicinity || "",
              rating: p.rating,
              type,
              placeId: p.place_id || "",
              vicinity: p.vicinity || "",
              openNow: p.opening_hours?.isOpen?.() ?? p.opening_hours?.isOpen as boolean | undefined,
              lat: p.geometry?.location?.lat() || 0,
              lng: p.geometry?.location?.lng() || 0,
            }))
            setPlaces(mapped)
            onPlacesChange?.(mapped)
          } else if (status === google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
            setPlaces([])
            onPlacesChange?.([])
          } else if (status === google.maps.places.PlacesServiceStatus.REQUEST_DENIED) {
            setError("Places API not enabled. Enable it in Google Cloud Console.")
            setPlaces([])
            onPlacesChange?.([])
          } else {
            setError("Could not find nearby places")
            setPlaces([])
            onPlacesChange?.([])
          }
        },
      )
    } catch {
      setLoading(false)
      setError("Places API error")
      onPlacesChange?.([])
    }
  }, [lat, lng, onPlacesChange])

  useEffect(() => {
    queueMicrotask(() => searchPlaces(activeTab))
  }, [activeTab, searchPlaces])

  const ts = TYPE_STYLES[activeTab]
  const cardBg = darkMode ? "bg-slate-800/80" : "bg-white"
  const borderClr = darkMode ? "border-slate-700" : "border-slate-200"

  function openDirections(destLat: number, destLng: number) {
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${destLat},${destLng}`, "_blank")
  }

  return (
    <div className={`${cardBg} rounded-2xl border ${borderClr} overflow-hidden shadow-sm`}>
      <div className={`flex border-b ${borderClr} p-1.5 gap-1`}>
        {PLACE_TYPES.map(({ type, label, icon: Icon }) => {
          const active = activeTab === type
          const t = TYPE_STYLES[type]
          return (
            <button
              key={type}
              onClick={() => setActiveTab(type)}
              className={`relative flex-1 flex items-center justify-center gap-1.5 py-2 sm:py-2.5 rounded-2xl text-xs sm:text-sm font-semibold transition-all duration-200 ${
                active
                  ? "text-white shadow-lg"
                  : darkMode
                    ? "text-slate-500 hover:text-slate-300 hover:bg-slate-700/50"
                    : "text-slate-400 hover:text-slate-600 hover:bg-slate-100/50"
              }`}
              style={active ? { background: `linear-gradient(135deg, ${t.bg}, ${t.bg}dd)`, boxShadow: `0 2px 12px ${t.bg}44` } : {}}
            >
              <Icon size={active ? 14 : 12} />
              <span className="hidden sm:inline">{label}</span>
              <span className="sm:hidden">{label.slice(0, 4)}</span>
            </button>
          )
        })}
      </div>

      <div className="p-2 sm:p-3">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-8 sm:py-10 gap-3">
            <div className="relative">
              <Loader2 size={28} className="animate-spin" style={{ color: ts.bg }} />
              <span className="absolute inset-0 animate-ping rounded-full opacity-20" style={{ backgroundColor: ts.bg }} />
            </div>
            <span className={`text-xs animate-pulse font-medium ${darkMode ? "text-slate-500" : "text-slate-400"}`}>
              Finding nearby places...
            </span>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center py-6 sm:py-8 gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center ring-1 ring-amber-200/50">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            </div>
            <p className={`text-xs sm:text-sm text-center font-medium ${darkMode ? "text-slate-400" : "text-slate-500"}`}>{error}</p>
          </div>
        ) : places.length === 0 ? (
          <div className="flex flex-col items-center py-6 sm:py-8 gap-3">
            <div className={`w-12 h-12 rounded-2xl ${darkMode ? "bg-slate-700/50" : "bg-slate-50"} flex items-center justify-center ring-1 ${darkMode ? "ring-slate-600/30" : "ring-slate-200/50"}`}>
              <MapPin size={20} className="text-slate-300" />
            </div>
            <p className={`text-xs sm:text-sm text-center font-medium ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
              No {PLACE_TYPES.find((p) => p.type === activeTab)?.plural || "places"} found nearby
            </p>
            <p className={`text-[10px] sm:text-xs text-center ${darkMode ? "text-slate-600" : "text-slate-400"}`}>
              Try expanding your search or check another category
            </p>
          </div>
        ) : (
          <div className="space-y-2 sm:space-y-2.5">
            {places.map((place, i) => (
              <PlaceCard
                key={place.placeId}
                place={place}
                index={i}
                darkMode={darkMode}
                onDirections={openDirections}
              />
            ))}
          </div>
        )}
      </div>

      <style jsx global>{`
        @keyframes cardSlideUp {
          from { opacity: 0; transform: translateY(16px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  )
}
