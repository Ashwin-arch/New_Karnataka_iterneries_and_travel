"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Loader2, UtensilsCrossed, Hotel, Building2, Star, ExternalLink } from "lucide-react"

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

const PLACE_TYPES: { type: PlaceType; label: string; icon: typeof UtensilsCrossed }[] = [
  { type: "restaurant", label: "Eateries", icon: UtensilsCrossed },
  { type: "hotel", label: "Hotels", icon: Hotel },
  { type: "lodging", label: "Stays", icon: Building2 },
]

const TYPE_ICONS: Record<PlaceType, string> = {
  restaurant: "#f97316",
  hotel: "#8b5cf6",
  lodging: "#06b6d4",
}

function StarRating({ rating, darkMode }: { rating?: number; darkMode?: boolean }) {
  if (!rating) return null
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          size={10}
          className={i < Math.round(rating) ? "text-amber-400 fill-amber-400" : darkMode ? "text-slate-600" : "text-slate-200"}
        />
      ))}
      <span className={`text-[10px] ${darkMode ? "text-slate-500" : "text-slate-400"} ml-1`}>{rating.toFixed(1)}</span>
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

  const cardBg = darkMode ? "bg-slate-700/50" : "bg-white"
  const borderClr = darkMode ? "border-slate-600" : "border-slate-100"
  const textColor = darkMode ? "text-slate-200" : "text-slate-800"
  const subText = darkMode ? "text-slate-400" : "text-slate-400"
  const hoverBg = darkMode ? "hover:bg-slate-700" : "hover:bg-slate-50"

  return (
    <div className={`${cardBg} rounded-xl border ${borderClr} overflow-hidden shadow-sm`}>
      <div className={`flex border-b ${borderClr}`}>
        {PLACE_TYPES.map(({ type, label, icon: Icon }) => (
          <button
            key={type}
            onClick={() => setActiveTab(type)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-all ${
              activeTab === type
                ? darkMode
                  ? "text-slate-100 bg-slate-700 border-b-2 border-sky-500"
                  : "text-slate-900 bg-white border-b-2 border-sky-500"
                : darkMode
                  ? "text-slate-500 bg-slate-800/50 hover:text-slate-300 hover:bg-slate-700"
                  : "text-slate-400 bg-slate-50/50 hover:text-slate-600 hover:bg-slate-100/50"
            }`}
          >
            <Icon size={13} />
            {label}
          </button>
        ))}
      </div>

      <div className="p-3">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-6 gap-2">
            <Loader2 size={20} className="animate-spin text-sky-500" />
            <span className={`text-[10px] animate-pulse ${darkMode ? "text-slate-500" : "text-slate-400"}`}>Searching nearby places...</span>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center py-4 gap-2">
            <div className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            </div>
            <p className={`text-xs text-center ${darkMode ? "text-slate-400" : "text-slate-400"}`}>{error}</p>
          </div>
        ) : places.length === 0 ? (
          <div className="flex flex-col items-center py-4 gap-2">
            <div className={`w-8 h-8 rounded-full ${darkMode ? "bg-slate-700" : "bg-slate-50"} flex items-center justify-center`}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            </div>
            <p className={`text-xs text-center ${darkMode ? "text-slate-400" : "text-slate-400"}`}>No {activeTab === "restaurant" ? "eateries" : activeTab === "hotel" ? "hotels" : "stays"} found nearby</p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {places.map((place, i) => (
              <div
                key={place.placeId}
                className={`flex items-start gap-2.5 p-2 rounded-lg ${hoverBg} transition-all`}
                style={{ animation: `fadeInUp 0.3s ease-out ${i * 50}ms both` }}
              >
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-white text-xs font-bold shadow-sm"
                  style={{ background: TYPE_ICONS[place.type] }}
                >
                  {i + 1}
                </div>
                <div className="min-w-0 flex-1">
                  <p className={`text-xs font-semibold ${darkMode ? "text-slate-200" : "text-slate-800"} truncate`}>
                    {place.name}
                  </p>
                  <p className={`text-[10px] ${darkMode ? "text-slate-500" : "text-slate-400"} truncate mt-0.5`}>
                    {place.vicinity}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <StarRating rating={place.rating} darkMode={darkMode} />
                    {place.openNow !== undefined && (
                      <span className={`flex items-center gap-1 text-[9px] font-medium ${place.openNow ? "text-green-600" : darkMode ? "text-slate-500" : "text-slate-400"}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${place.openNow ? "bg-green-500" : darkMode ? "bg-slate-600" : "bg-slate-300"}`} />
                        {place.openNow ? "Open" : "Closed"}
                      </span>
                    )}
                  </div>
                </div>
                <span
                  className={`p-1.5 rounded-lg flex-shrink-0 mt-0.5 ${
                    darkMode ? "text-slate-600" : "text-slate-300"
                  }`}
                  title="Place info from Google Maps"
                >
                  <ExternalLink size={11} />
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
