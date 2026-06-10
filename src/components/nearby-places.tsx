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

function StarRating({ rating }: { rating?: number }) {
  if (!rating) return null
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          size={10}
          className={i < Math.round(rating) ? "text-amber-400 fill-amber-400" : "text-slate-200"}
        />
      ))}
      <span className="text-[10px] text-slate-400 ml-1">{rating.toFixed(1)}</span>
    </div>
  )
}

export default function NearbyPlaces({ lat, lng, onPlacesChange }: NearbyPlacesProps) {
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

  return (
    <div className="bg-white rounded-xl border border-slate-100 overflow-hidden shadow-sm">
      <div className="flex border-b border-slate-100">
        {PLACE_TYPES.map(({ type, label, icon: Icon }) => (
          <button
            key={type}
            onClick={() => setActiveTab(type)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-all ${
              activeTab === type
                ? "text-slate-900 bg-white border-b-2 border-sky-500"
                : "text-slate-400 hover:text-slate-600 bg-slate-50/50 hover:bg-slate-100/50"
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
            <span className="text-[10px] text-slate-400 animate-pulse">Searching nearby places...</span>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center py-4 gap-2">
            <div className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            </div>
            <p className="text-xs text-slate-400 text-center">{error}</p>
          </div>
        ) : places.length === 0 ? (
          <div className="flex flex-col items-center py-4 gap-2">
            <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            </div>
            <p className="text-xs text-slate-400 text-center">No {activeTab === "restaurant" ? "eateries" : activeTab === "hotel" ? "hotels" : "stays"} found nearby</p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {places.map((place, i) => (
              <div
                key={place.placeId}
                className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-slate-50 transition-all hover:shadow-sm"
                style={{ animation: `fadeInUp 0.3s ease-out ${i * 50}ms both` }}
              >
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-white text-xs font-bold shadow-sm"
                  style={{ background: TYPE_ICONS[place.type] }}
                >
                  {i + 1}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-slate-800 truncate">
                    {place.name}
                  </p>
                  <p className="text-[10px] text-slate-400 truncate mt-0.5">
                    {place.vicinity}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <StarRating rating={place.rating} />
                    {place.openNow !== undefined && (
                      <span className={`flex items-center gap-1 text-[9px] font-medium ${place.openNow ? "text-green-600" : "text-slate-400"}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${place.openNow ? "bg-green-500 animate-[pulse-dot_2s_ease-in-out_infinite]" : "bg-slate-300"}`} />
                        {place.openNow ? "Open" : "Closed"}
                      </span>
                    )}
                  </div>
                </div>
                <a
                  href={`https://www.google.com/maps/place/?q=place_id:${place.placeId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 hover:bg-sky-50 rounded-lg text-slate-300 hover:text-sky-500 transition-colors flex-shrink-0 mt-0.5"
                  title="Open in Google Maps"
                >
                  <ExternalLink size={11} />
                </a>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
