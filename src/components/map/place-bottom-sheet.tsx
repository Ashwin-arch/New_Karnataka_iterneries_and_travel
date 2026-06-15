"use client"

import { useState, useEffect } from "react"
import {
  MapPin, Clock, IndianRupee, Info, Star, Navigation, MessageSquare, Heart,
  ChevronLeft, ChevronRight, X, Eye, UtensilsCrossed, Layers, Share2, LocateFixed,
  Shield, AlertTriangle, Sun, Cloud, CloudRain, CloudSnow, CloudLightning, CloudFog,
} from "lucide-react"
import type { KarnatakaLocation, EmergencyServiceType } from "@/lib/types"
import { CATEGORY_COLORS } from "@/lib/constants"
import ImageSlider from "@/components/image-slider"
import NearbyPlaces from "@/components/nearby-places"
import type { NearbyPlaceResult } from "@/components/nearby-places"

interface Review {
  id: string
  userId: string
  userName: string
  placeId: number
  rating: number
  text: string
  date: string
}

interface User {
  id: string
  name: string
  email: string
  favorites: number[]
  collections: { name: string; ids: number[] }[]
}

interface WeatherData {
  temperature: number
  condition: string
  icon: React.ComponentType<{ size?: number; className?: string }>
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

interface PlaceBottomSheetProps {
  darkMode: boolean
  selectedLocation: KarnatakaLocation
  locations: KarnatakaLocation[]
  reviews: Review[]
  user: User | null
  elevationData: number | null
  elevationLoading: boolean
  showNearby: boolean
  nearbyCount: number
  onPrevLocation?: () => void
  onNextLocation?: () => void
  onClose: () => void
  onToggleFavorite: (id: number) => void
  onShowReviews: () => void
  showReviews: boolean
  onAddReview: () => void
  onDeleteReview: (id: string) => void
  onToggleNearby: () => void
  onNearbyPlaces: (places: NearbyPlaceResult[]) => void
  onShowAuth: () => void
  onShowStreetView: () => void
  onShowCollections: () => void
  onShareLocation: () => void
  newReview: { rating: number; text: string }
  onNewReviewChange: (review: { rating: number; text: string }) => void
  placeReviews: Review[]
  onShowEmergencyServices: (type: EmergencyServiceType) => void
}

export default function PlaceBottomSheet({
  darkMode, selectedLocation, locations, user,
  elevationData, elevationLoading, showNearby, nearbyCount,
  onPrevLocation, onNextLocation, onClose, onToggleFavorite, onShowReviews, showReviews,
  onAddReview, onDeleteReview, onToggleNearby, onNearbyPlaces, onShowAuth,
  onShowStreetView, onShowCollections, onShareLocation,
  newReview, onNewReviewChange, placeReviews,
  onShowEmergencyServices,
}: PlaceBottomSheetProps) {
  const [weather, setWeather] = useState<WeatherData | null>(null)

  useEffect(() => {
    fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${selectedLocation.lat}&longitude=${selectedLocation.lng}&current=temperature_2m,weathercode&timezone=auto`,
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
  }, [selectedLocation.lat, selectedLocation.lng])

  const bg = darkMode ? "bg-slate-800" : "bg-white"
  const textColor = darkMode ? "text-slate-200" : "text-slate-900"
  const subText = darkMode ? "text-slate-400" : "text-slate-500"
  const mutedBg = darkMode ? "bg-slate-700/50" : "bg-slate-50"
  const borderColor = darkMode ? "border-slate-700" : "border-slate-100"
  const chipBg = darkMode ? "bg-slate-700" : "bg-slate-100"

  const today = new Date()
  const dateStr = today.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" })
  const timeStr = today.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })

  function openGoogleMaps() {
    window.open(
      `https://www.google.com/maps/dir/?api=1&destination=${selectedLocation.lat},${selectedLocation.lng}`,
      "_blank",
    )
  }

  return (
    <div className="absolute inset-x-0 bottom-0 z-20 flex flex-col items-center pointer-events-none"
      style={{ animation: "fadeInUp 0.3s ease-out" }}>
      {/* Drag handle */}
      <div className="pointer-events-auto mb-[-8px] relative z-10">
        <div className="w-10 h-1 rounded-full bg-white/70 shadow-sm" />
      </div>

      <div className={`pointer-events-auto w-full max-w-lg ${bg} rounded-t-2xl shadow-2xl border-t ${borderColor} overflow-hidden transition-all duration-300 flex flex-col`}
        style={{ maxHeight: "90vh" }}>

        {/* Photos */}
        {selectedLocation.images && selectedLocation.images.length > 0 && (
          <div className="relative flex-shrink-0 max-h-[40vh]">
            <ImageSlider images={selectedLocation.images} alt={selectedLocation.name} />
          </div>
        )}

        {/* Content */}
        <div className={`overflow-y-auto max-md:p-3 max-md:space-y-3 p-5 space-y-4 flex-1 min-h-0 ${darkMode ? "scrollbar-dark" : ""}`}>

          {/* Date / Time / Weather row */}
          <div className={`flex items-center justify-between gap-2 px-1`}>
            <div className="flex items-center gap-2">
              <p className={`text-[10px] font-bold uppercase tracking-wider ${subText}`}>{dateStr}</p>
              <span className={`text-[10px] ${subText}`}>·</span>
              <p className={`text-[10px] font-semibold ${textColor}`}>{timeStr}</p>
            </div>
            {weather && (
              <div className="flex items-center gap-1.5">
                <weather.icon size={14} className={darkMode ? "text-sky-400" : "text-sky-600"} />
                <span className={`text-[10px] font-semibold ${textColor}`}>{weather.temperature}°</span>
                <span className={`text-[9px] ${subText}`}>{weather.condition}</span>
              </div>
            )}
          </div>

          {/* Header */}
          <div className="sticky top-0 z-10 flex items-start justify-between gap-3 pb-2"
            style={{ background: darkMode ? "#1e293b" : "white" }}>
            <div className="min-w-0 flex-1">
              <span className="inline-block text-[10px] font-bold text-white px-2 py-0.5 rounded-full uppercase tracking-wider mb-1"
                style={{ background: CATEGORY_COLORS[selectedLocation.category] || "#64748b" }}>
                {selectedLocation.category}
              </span>
              <h2 className={`max-md:text-lg text-xl font-bold leading-tight ${textColor}`}>
                {selectedLocation.name}
              </h2>
              <p className={`max-md:text-xs text-sm mt-0.5 flex items-center gap-1 ${subText}`}>
                <MapPin size={12} />{selectedLocation.place}
              </p>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              {onPrevLocation && (
                <button onClick={onPrevLocation}
                  className={`p-2 rounded-xl transition-colors ${darkMode ? "hover:bg-slate-700 text-slate-400" : "hover:bg-slate-100 text-slate-400"}`}
                  title="Previous location">
                  <ChevronLeft size={20} />
                </button>
              )}
              {onNextLocation && (
                <button onClick={onNextLocation}
                  className={`p-2 rounded-xl transition-colors ${darkMode ? "hover:bg-slate-700 text-slate-400" : "hover:bg-slate-100 text-slate-400"}`}
                  title="Next location">
                  <ChevronRight size={20} />
                </button>
              )}
              <button onClick={onClose}
                className={`p-2 rounded-xl transition-colors ${darkMode ? "hover:bg-slate-700 text-slate-400" : "hover:bg-slate-100 text-slate-400"}`}>
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Info chips */}
          <div className="flex flex-wrap gap-2">
            {selectedLocation.distanceFromManipal && (
              <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full ${chipBg} ${subText}`}>
                <MapPin size={11} /> {selectedLocation.distanceFromManipal}
              </span>
            )}
            {selectedLocation.bestTime && (
              <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full ${chipBg} ${subText}`}>
                <Clock size={11} /> {selectedLocation.bestTime}
              </span>
            )}
            {selectedLocation.entryFee && (
              <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full ${chipBg} ${subText}`}>
                <IndianRupee size={11} /> {selectedLocation.entryFee}
              </span>
            )}
            {selectedLocation.tips && (
              <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full ${chipBg} ${subText}`}>
                <Info size={11} /> Tips available
              </span>
            )}
          </div>

          {/* Description */}
          <div>
            <h3 className={`text-xs font-bold uppercase tracking-wider mb-1.5 flex items-center gap-1 ${textColor}`}>
              <Info size={13} className="text-sky-500" /> About
            </h3>
            <p className={`text-sm leading-relaxed ${darkMode ? "text-slate-300" : "text-slate-600"}`}>
              {selectedLocation.description}
            </p>
          </div>

          {/* Rating */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-0.5">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star key={s} size={14} className={s <= 4 ? "text-amber-400 fill-amber-400" : "text-slate-200"} />
              ))}
            </div>
            <span className={`text-xs ${subText}`}>4.0 (12 reviews)</span>
          </div>

          {/* Coordinates */}
          <div className={`${mutedBg} rounded-xl p-3 flex items-center justify-between`}>
            <div>
              <div className={`text-[10px] uppercase tracking-wider ${subText}`}>Coordinates</div>
              <p className={`text-xs font-mono ${textColor}`}>
                {selectedLocation.lat.toFixed(5)}, {selectedLocation.lng.toFixed(5)}
              </p>
            </div>
            <button onClick={openGoogleMaps}
              className="text-sky-500 hover:text-sky-600 text-xs font-medium flex items-center gap-1">
              <Navigation size={12} /> Open in Google Maps
            </button>
          </div>

          {/* Elevation */}
          <div className={`${mutedBg} rounded-xl p-3 flex items-center justify-between`}>
            <div>
              <div className={`text-[10px] uppercase tracking-wider ${subText}`}>Elevation</div>
              <p className={`text-xs font-mono ${textColor}`}>
                {elevationLoading
                  ? <span className="text-slate-400">Loading...</span>
                  : elevationData !== null
                    ? `${elevationData.toFixed(0)} m`
                    : "N/A"}
              </p>
            </div>
            <button onClick={onShowStreetView}
              className="text-sky-500 hover:text-sky-600 text-xs font-medium flex items-center gap-1">
              <Eye size={12} /> Street View
            </button>
          </div>

          {selectedLocation.source && (
            <div className={`text-[10px] italic ${subText}`}>{selectedLocation.source}</div>
          )}

          {/* Action buttons */}
          <div className="flex gap-2 pt-1">
            <button onClick={openGoogleMaps}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white font-semibold rounded-xl text-sm transition-all active:scale-[0.98] shadow-md">
              <LocateFixed size={16} /> Navigate
            </button>
            <button onClick={onShareLocation}
              className={`flex items-center justify-center gap-2 py-2.5 px-4 font-medium rounded-xl text-sm transition-colors ${
                darkMode
                  ? "bg-slate-700 hover:bg-slate-600 text-slate-300"
                  : "bg-slate-100 hover:bg-slate-200 text-slate-700"
              }`}>
              <Share2 size={16} />
            </button>
            <button onClick={onShowReviews}
              className={`flex items-center justify-center gap-2 py-2.5 px-4 font-medium rounded-xl text-sm transition-colors ${
                darkMode
                  ? "bg-slate-700 hover:bg-slate-600 text-slate-300"
                  : "bg-slate-100 hover:bg-slate-200 text-slate-700"
              }`}>
              <MessageSquare size={16} /> {placeReviews.length}
            </button>
            {user?.favorites.includes(selectedLocation.id) ? (
              <button onClick={() => onToggleFavorite(selectedLocation.id)}
                className="flex items-center justify-center gap-2 py-2.5 px-4 bg-red-50 hover:bg-red-100 text-red-500 font-medium rounded-xl text-sm transition-colors">
                <Heart size={16} fill="currentColor" />
              </button>
            ) : (
              <button onClick={() => user ? onToggleFavorite(selectedLocation.id) : onShowAuth()}
                className={`flex items-center justify-center gap-2 py-2.5 px-4 font-medium rounded-xl text-sm transition-colors ${
                  darkMode
                    ? "bg-slate-700 hover:bg-slate-600 text-slate-400"
                    : "bg-slate-100 hover:bg-slate-200 text-slate-500"
                }`}>
                <Heart size={16} />
              </button>
            )}
          </div>

          {/* Emergency Services */}
          <div>
            <h3 className={`text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-1 ${textColor}`}>
              <Shield size={13} className="text-red-500" /> Emergency Services
            </h3>
            <div className="flex gap-2">
              {(["hospital", "police", "fire_station"] as EmergencyServiceType[]).map((type) => {
                const label = type === "hospital" ? "Hospital" : type === "police" ? "Police" : "Fire"
                return (
                  <button key={type} onClick={() => onShowEmergencyServices(type)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors flex-1 justify-center ${
                      darkMode
                        ? "bg-slate-700 text-slate-300 hover:bg-slate-600"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}>
                    <Shield size={14} className={type === "hospital" ? "text-red-500" : type === "police" ? "text-blue-500" : "text-orange-500"} />
                    {label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Reviews */}
          {showReviews && (
            <div className={`space-y-3 border-t ${borderColor} pt-3`} style={{ animation: "fadeInUpSmall 0.2s ease-out" }}>
              <h3 className={`text-xs font-bold flex items-center gap-1 ${textColor}`}>
                <MessageSquare size={13} className="text-sky-500" /> Reviews ({placeReviews.length})
              </h3>
              {user ? (
                <div className={`${mutedBg} rounded-xl p-3 space-y-2`}>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <button key={s} onClick={() => onNewReviewChange({ ...newReview, rating: s })}>
                        <Star size={16} className={s <= newReview.rating ? "text-amber-400 fill-amber-400" : "text-slate-300"} />
                      </button>
                    ))}
                  </div>
                  <textarea value={newReview.text} onChange={(e) => onNewReviewChange({ ...newReview, text: e.target.value })}
                    placeholder="Write a review..." rows={2}
                    className={`w-full px-3 py-2 text-xs border rounded-xl outline-none focus:border-sky-400 resize-none ${
                      darkMode ? "bg-slate-700 border-slate-600 text-slate-200" : "bg-white border-slate-200 text-slate-800"
                    }`} />
                  <button onClick={onAddReview} disabled={!newReview.text.trim()}
                    className="px-4 py-1.5 bg-sky-500 hover:bg-sky-600 disabled:bg-slate-300 disabled:text-slate-400 text-white text-xs font-semibold rounded-xl transition-colors">
                    Post
                  </button>
                </div>
              ) : (
                <button onClick={onShowAuth} className="text-xs text-sky-500 hover:underline">
                  Sign in to leave a review
                </button>
              )}
              {placeReviews.map((r) => (
                <div key={r.id} className={`${mutedBg} rounded-xl p-3`}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-semibold ${textColor}`}>{r.userName}</span>
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star key={s} size={10} className={s <= r.rating ? "text-amber-400 fill-amber-400" : "text-slate-200"} />
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className={`text-[10px] ${subText}`}>{r.date}</span>
                      {user?.id === r.userId && (
                        <button onClick={() => onDeleteReview(r.id)}
                          className={`p-0.5 rounded ${darkMode ? "hover:bg-red-900/30 hover:text-red-400" : "hover:bg-red-50 hover:text-red-500"} text-slate-300`}>
                          <X size={11} />
                        </button>
                      )}
                    </div>
                  </div>
                  <p className={`text-xs ${darkMode ? "text-slate-300" : "text-slate-600"}`}>{r.text}</p>
                </div>
              ))}
            </div>
          )}

          {/* Nearby places */}
          <div className={`border-t ${borderColor} pt-3`}>
            <div className="flex items-center gap-2 mb-3">
              <button onClick={onToggleNearby}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  showNearby
                    ? darkMode ? "bg-sky-900/40 text-sky-400" : "bg-sky-100 text-sky-700"
                    : `${darkMode ? "bg-slate-700 text-slate-300 hover:bg-slate-600" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`
                }`}>
                <UtensilsCrossed size={12} /> Nearby {nearbyCount > 0 && <span className="opacity-70">({nearbyCount})</span>}
              </button>
              {user && (
                <button onClick={onShowCollections}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    darkMode
                      ? "bg-slate-700 text-slate-300 hover:bg-slate-600"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}>
                  <Layers size={12} /> Collections
                </button>
              )}
            </div>
            {showNearby && (
              <NearbyPlaces lat={selectedLocation.lat} lng={selectedLocation.lng} onPlacesChange={onNearbyPlaces} darkMode={darkMode} />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
