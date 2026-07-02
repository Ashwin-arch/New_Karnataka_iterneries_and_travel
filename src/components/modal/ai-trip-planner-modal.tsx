"use client"

import { useState, useMemo, useEffect, useCallback } from "react"
import { X, Sparkles, MapPin, Navigation, LocateFixed, Loader2, Fuel, Hospital, UtensilsCrossed, Bed, Landmark, Sun, Cloud, Thermometer, Check } from "lucide-react"
import type { KarnatakaLocation } from "@/lib/types"
import { CATEGORY_COLORS, API_KEY } from "@/lib/constants"

const POI_TYPES = [
  { key: "gas_station", label: "Petrol", icon: Fuel, color: "text-green-500" },
  { key: "hospital", label: "Hospitals", icon: Hospital, color: "text-red-500" },
  { key: "restaurant", label: "Restaurants", icon: UtensilsCrossed, color: "text-orange-500" },
  { key: "lodging", label: "Stays", icon: Bed, color: "text-purple-500" },
  { key: "tourist_attraction", label: "Attractions", icon: Landmark, color: "text-sky-500" },
]

export interface TripPlanResult {
  startName: string
  startLat: number
  startLng: number
  destName: string
  destLat: number
  destLng: number
  route: google.maps.DirectionsResult | null
  pois: Array<{ name: string; lat: number; lng: number; type: string; vicinity: string; rating?: number }>
  weather: { temp: number; condition: string; icon: string } | null
  distance: string
  duration: string
}

interface AiTripPlannerModalProps {
  darkMode: boolean
  onClose: () => void
  locations: KarnatakaLocation[]
  onPlanTrip: (plan: TripPlanResult) => void
  onSaveTrip?: (name: string, plan: TripPlanResult) => void
}

export default function AiTripPlannerModal({ darkMode, onClose, locations, onPlanTrip, onSaveTrip }: AiTripPlannerModalProps) {
  const [startInput, setStartInput] = useState("")
  const [startCoords, setStartCoords] = useState<{ lat: number; lng: number; name: string } | null>(null)
  const [destInput, setDestInput] = useState("")
  const [destCoords, setDestCoords] = useState<{ lat: number; lng: number; name: string } | null>(null)
  const [showDestDropdown, setShowDestDropdown] = useState(false)
  const [selectedPois, setSelectedPois] = useState<string[]>(["gas_station", "restaurant", "lodging", "hospital", "tourist_attraction"])
  const [gpsLoading, setGpsLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [plan, setPlan] = useState<TripPlanResult | null>(null)
  const [error, setError] = useState("")
  const [locating, setLocating] = useState(false)
  const [tripName, setTripName] = useState("")
  const [saved, setSaved] = useState(false)

  const bg = darkMode ? "bg-slate-800" : "bg-white"
  const textColor = darkMode ? "text-slate-200" : "text-slate-900"
  const inputBg = darkMode ? "bg-slate-700 border-slate-600" : "bg-white border-slate-200"
  const subText = darkMode ? "text-slate-400" : "text-slate-500"
  const chipBg = darkMode ? "bg-slate-700" : "bg-slate-100"
  const chipActive = "bg-sky-500 text-white border-sky-500"
  const cardBg = darkMode ? "bg-slate-700/50" : "bg-slate-50"

  const destResults = useMemo(() => {
    if (!destInput.trim()) return []
    const q = destInput.toLowerCase()
    return locations.filter((l) => l.name.toLowerCase().includes(q) || l.place.toLowerCase().includes(q)).slice(0, 8)
  }, [destInput, locations])

  async function fetchGPS() {
    if (!API_KEY) {
      setError("Google API key not configured")
      setTimeout(() => setError(""), 3000)
      return
    }
    setLocating(true)
    setError("")

    try {
      const res = await fetch(
        `https://www.googleapis.com/geolocation/v1/geolocate?key=${API_KEY}`,
        { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" },
      )
      if (!res.ok) {
        setLocating(false)
        setError(`Geolocation API error (${res.status})`)
        setTimeout(() => setError(""), 4000)
        return
      }
      const data = await res.json()
      const lat = data.location.lat
      const lng = data.location.lng
      const geocoder = new google.maps.Geocoder()
      geocoder.geocode({ location: { lat, lng } }, (results, status) => {
        setLocating(false)
        if (status === "OK" && results?.[0]) {
          const name = results[0].formatted_address
          setStartInput(name)
          setStartCoords({ lat, lng, name })
        } else {
          setStartInput(`${lat.toFixed(4)}, ${lng.toFixed(4)}`)
          setStartCoords({ lat, lng, name: `${lat.toFixed(4)}, ${lng.toFixed(4)}` })
        }
      })
    } catch {
      setLocating(false)
      setError("Could not get GPS location. Check your network.")
      setTimeout(() => setError(""), 4000)
    }
  }

  function togglePoi(key: string) {
    setSelectedPois((p) => p.includes(key) ? p.filter((k) => k !== key) : [...p, key])
  }

  const generatePlan = useCallback(async () => {
    if (!startCoords || !destCoords) return
    setGenerating(true)
    setError("")

    try {
      const directionsService = new google.maps.DirectionsService()
      const route = await new Promise<google.maps.DirectionsResult>((resolve, reject) => {
        directionsService.route(
          {
            origin: { lat: startCoords.lat, lng: startCoords.lng },
            destination: { lat: destCoords.lat, lng: destCoords.lng },
            travelMode: google.maps.TravelMode.DRIVING,
          },
          (result, status) => {
            if (status === "OK" && result) resolve(result)
            else reject(new Error("Directions failed: " + status))
          },
        )
      })

      const leg = route.routes[0].legs[0]
      const distance = leg?.distance?.text || ""
      const duration = leg?.duration?.text || ""

      const path = route.routes[0].overview_path || []
      const stepCount = Math.min(path.length, 6)
      const step = Math.max(1, Math.floor(path.length / (stepCount + 1)))
      const searchPoints: google.maps.LatLng[] = []
      for (let i = 1; i <= stepCount; i++) {
        searchPoints.push(path[i * step])
      }

      const placesService = new google.maps.places.PlacesService(document.createElement("div"))
      const allPois: Array<{ name: string; lat: number; lng: number; type: string; vicinity: string; rating?: number }> = []
      const seen = new Set<string>()

      for (const point of searchPoints) {
        for (const type of selectedPois) {
          await new Promise<void>((resolve) => {
            placesService.nearbySearch(
              { location: point, radius: 15000, type },
              (results, status) => {
                if (status === "OK" && results) {
                  results.forEach((r) => {
                    if (r.place_id && !seen.has(r.place_id)) {
                      seen.add(r.place_id)
                      allPois.push({
                        name: r.name || "",
                        lat: r.geometry?.location?.lat() || 0,
                        lng: r.geometry?.location?.lng() || 0,
                        type,
                        vicinity: r.vicinity || "",
                        rating: r.rating,
                      })
                    }
                  })
                }
                resolve()
              },
            )
          })
        }
      }

      let weather: TripPlanResult["weather"] = null
      try {
        const res = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${destCoords.lat}&longitude=${destCoords.lng}&current_weather=true`,
        )
        const w = await res.json()
        if (w.current_weather) {
          const code = w.current_weather.weathercode
          weather = {
            temp: Math.round(w.current_weather.temperature),
            condition: code < 3 ? "Clear" : code < 50 ? "Cloudy" : code < 60 ? "Rain" : "Storm",
            icon: code < 3 ? "sun" : code < 50 ? "cloud" : "rain",
          }
        }
      } catch { /* weather silently fails */ }

      setPlan({ startName: startCoords.name, startLat: startCoords.lat, startLng: startCoords.lng, destName: destCoords.name, destLat: destCoords.lat, destLng: destCoords.lng, route, pois: allPois, weather, distance, duration })
    } catch (e: any) {
      setError(e?.message || "Failed to generate plan")
      setTimeout(() => setError(""), 4000)
    }
    setGenerating(false)
  }, [startCoords, destCoords, selectedPois])



  const isReady = startCoords && destCoords && selectedPois.length > 0

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={onClose}>
      <div className={`${bg} rounded-2xl rounded-b-none sm:rounded-2xl shadow-xl w-full max-w-lg mx-auto sm:mb-0 max-h-[90vh] flex flex-col`
      }
        onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 pb-3 border-b shrink-0">
          <div className="flex items-center gap-2">
            <Sparkles size={18} className="text-sky-500" />
            <h3 className={`text-lg font-bold ${textColor}`}>Trip Planner</h3>
          </div>
          <button onClick={onClose} className={`p-1.5 rounded-lg ${darkMode ? "hover:bg-slate-700" : "hover:bg-slate-100"}`}>
            <X size={18} className={subText} />
          </button>
        </div>

        <div className="overflow-y-auto p-5 space-y-4 flex-1">
          {/* Start Location */}
          <div>
            <label className={`text-xs font-semibold ${subText} mb-1.5 flex items-center gap-1.5`}>
              <Navigation size={12} /> Start Location
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input value={startInput} onChange={(e) => { setStartInput(e.target.value); setStartCoords(null); setPlan(null) }}
                  placeholder="Enter start location..."
                  className={`w-full pl-9 pr-3 py-2.5 border rounded-xl text-sm outline-none focus:border-sky-400 ${inputBg} ${textColor}`} />
              </div>
              <button onClick={fetchGPS} disabled={locating}
                className={`px-3 py-2.5 rounded-xl border text-xs font-medium transition-colors shrink-0 ${locating ? "bg-sky-100 text-sky-600 border-sky-200" : darkMode ? "border-slate-600 text-slate-300 hover:bg-slate-700" : "border-slate-200 text-slate-600 hover:bg-sky-50"}`}
                title="Use current location">
                {locating ? <Loader2 size={16} className="animate-spin" /> : <LocateFixed size={16} />}
              </button>
            </div>
            {startCoords && (
              <p className={`text-[10px] mt-1 ${subText} truncate`}>
                <MapPin size={10} className="inline mr-0.5" />
                {startCoords.lat.toFixed(4)}, {startCoords.lng.toFixed(4)}
              </p>
            )}
          </div>

          {/* Destination */}
          <div>
            <label className={`text-xs font-semibold ${subText} mb-1.5 flex items-center gap-1.5`}>
              <MapPin size={12} /> Destination
            </label>
            <div className="relative">
              <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-sky-500" />
              <input value={destInput} onChange={(e) => { setDestInput(e.target.value); setDestCoords(null); setPlan(null); setShowDestDropdown(true) }}
                onFocus={() => setShowDestDropdown(true)}
                placeholder="Search hidden gems or type destination..."
                className={`w-full pl-9 pr-3 py-2.5 border rounded-xl text-sm outline-none focus:border-sky-400 ${inputBg} ${textColor}`} />
              {showDestDropdown && destResults.length > 0 && (
                <div className={`absolute top-full left-0 right-0 mt-1 z-10 rounded-xl shadow-xl border overflow-hidden ${darkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200"}`}>
                  {destResults.map((loc) => (
                    <button key={loc.id} onClick={() => { setDestInput(loc.name); setDestCoords({ lat: loc.lat, lng: loc.lng, name: loc.name }); setPlan(null); setShowDestDropdown(false) }}
                      className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-left text-sm transition-colors ${darkMode ? "hover:bg-slate-700" : "hover:bg-sky-50"} ${destCoords?.name === loc.name ? (darkMode ? "bg-slate-700" : "bg-sky-50") : ""}`}>
                      <span className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[9px] font-bold shrink-0"
                        style={{ background: CATEGORY_COLORS[loc.category] || "#64748b" }}>{loc.id}</span>
                      <div className="min-w-0 flex-1">
                        <p className={`text-sm font-semibold ${textColor} truncate`}>{loc.name}</p>
                        <p className={`text-[10px] ${subText} truncate`}>{loc.place}</p>
                      </div>
                      {destCoords?.name === loc.name && <Check size={14} className="text-sky-500 shrink-0" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {destCoords && !destResults.some((l) => l.name === destCoords.name) && (
              <p className={`text-[10px] mt-1 ${subText} truncate`}>
                <MapPin size={10} className="inline mr-0.5" />
                {destCoords.lat.toFixed(4)}, {destCoords.lng.toFixed(4)}
              </p>
            )}
          </div>

          {/* Interests */}
          <div>
            <label className={`text-xs font-semibold ${subText} mb-1.5 block`}>Find along the route</label>
            <div className="flex flex-wrap gap-1.5">
              {POI_TYPES.map((pt) => {
                const active = selectedPois.includes(pt.key)
                return (
                  <button key={pt.key} onClick={() => togglePoi(pt.key)}
                    className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium border transition-colors ${active ? chipActive : `${chipBg} ${textColor} border-transparent`}`}>
                    <pt.icon size={12} className={active ? "text-white" : pt.color} />
                    {pt.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-3 py-2 text-xs text-red-600 dark:text-red-400">
              {error}
            </div>
          )}

          {/* Plan Results */}
          {plan && (
            <div className="space-y-3 animate-fadeIn">
              {/* Trip name */}
              {!saved && (
                <input value={tripName} onChange={(e) => setTripName(e.target.value)} placeholder="Name this trip..."
                  className={`w-full px-3 py-2 border rounded-xl text-sm outline-none focus:border-sky-400 ${inputBg} ${textColor}`} />
              )}

              {/* Route Summary */}
              <div className={`${cardBg} rounded-xl p-3`}>
                <div className="flex items-center gap-2 mb-1">
                  <Navigation size={14} className="text-sky-500" />
                  <span className={`text-sm font-bold ${textColor}`}>{plan.distance} · {plan.duration}</span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px]">
                  <span className={`${subText} truncate`}>{plan.startName}</span>
                  <span className="text-sky-400">→</span>
                  <span className={`${subText} truncate`}>{plan.destName}</span>
                </div>
              </div>

              {/* Weather */}
              {plan.weather && (
                <div className={`${cardBg} rounded-xl p-3 flex items-center justify-between`}>
                  <div className="flex items-center gap-2">
                    {plan.weather.icon === "sun" ? <Sun size={16} className="text-yellow-500" /> : plan.weather.icon === "cloud" ? <Cloud size={16} className="text-slate-400" /> : <Cloud size={16} className="text-blue-500" />}
                    <div>
                      <p className={`text-xs font-semibold ${textColor}`}>{plan.weather.condition} at destination</p>
                      <p className={`text-[10px] ${subText}`}>{plan.destName}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Thermometer size={14} className="text-orange-500" />
                    <span className="text-sm font-bold">{plan.weather.temp}°C</span>
                  </div>
                </div>
              )}

              {/* POI Summary */}
              {plan.pois.length > 0 && (
                <div>
                  <p className={`text-xs font-semibold ${subText} mb-2`}>
                    {plan.pois.length} point{plan.pois.length > 1 ? "s" : ""} of interest along route
                  </p>
                  <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                    {plan.pois.map((poi, i) => {
                      const pt = POI_TYPES.find((p) => p.key === poi.type)
                      return (
                        <div key={i} className={`flex items-start gap-2.5 px-2.5 py-2 rounded-lg ${cardBg}`}>
                          {pt ? <pt.icon size={13} className={`mt-0.5 shrink-0 ${pt.color}`} /> : <MapPin size={13} className="mt-0.5 text-slate-400 shrink-0" />}
                          <div className="min-w-0 flex-1">
                            <p className={`text-xs font-semibold ${textColor} truncate`}>{poi.name}</p>
                            <p className={`text-[10px] ${subText} truncate`}>{poi.vicinity}{poi.rating ? ` · ★ ${poi.rating.toFixed(1)}` : ""}</p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 pt-3 border-t shrink-0">
          {plan ? (
            <div className="flex flex-col gap-2">
              {onSaveTrip && (
                <button onClick={() => { onSaveTrip(tripName || `${plan.startName} → ${plan.destName}`, plan); setSaved(true) }}
                  disabled={saved}
                  className={`w-full py-2 rounded-xl text-sm font-semibold transition-all active:scale-[0.98] flex items-center justify-center gap-1.5 ${
                    saved
                      ? "bg-green-100 text-green-700 border border-green-200"
                      : "bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm"
                  }`}>
                  {saved ? <><Check size={14} /> Saved!</> : <><Sparkles size={14} /> Save Trip</>}
                </button>
              )}
              <div className="flex gap-2">
                <button onClick={() => { setPlan(null); setGenerating(false); setSaved(false) }}
                  className={`flex-1 py-2.5 border rounded-xl text-sm font-medium transition-colors ${darkMode ? "border-slate-600 text-slate-300 hover:bg-slate-700" : "border-slate-200 text-slate-700 hover:bg-slate-50"}`}>
                  Regenerate
                </button>
                <button onClick={() => onPlanTrip(plan)}
                  className="flex-1 py-2.5 bg-sky-500 hover:bg-sky-600 active:bg-sky-700 text-white font-semibold rounded-xl text-sm transition-all active:scale-[0.98] flex items-center justify-center gap-1.5">
                  <Check size={15} /> Show on Map
                </button>
              </div>
            </div>
          ) : (
            <button onClick={generatePlan} disabled={!isReady || generating}
              className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-[0.98] flex items-center justify-center gap-2 ${
                generating
                  ? "bg-sky-200 text-sky-700 cursor-wait"
                  : isReady
                    ? "bg-sky-500 hover:bg-sky-600 text-white shadow-md shadow-sky-500/20"
                    : "bg-slate-200 dark:bg-slate-700 text-slate-400 cursor-not-allowed"
              }`}>
              {generating ? (
                <><Loader2 size={16} className="animate-spin" /> Generating plan...</>
              ) : (
                <><Sparkles size={16} /> Generate Plan</>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
