"use client"

import { useState, useMemo } from "react"
import { X, Sparkles, Clock, MapPin, Check } from "lucide-react"

const PREFERENCES = ["Nature", "Adventure", "Heritage", "Trekking", "Waterfalls", "Beaches", "Temples", "Camping", "Wildlife"]
const DURATIONS = ["2hrs", "4hrs", "6hrs", "Full day"]

interface Location {
  name: string
  place: string
  lat: number
  lng: number
  category: string
  description: string
}

interface AiTripPlannerModalProps {
  darkMode: boolean
  onClose: () => void
  locations: Location[]
  onPlanTrip: (plan: { places: Array<{ name: string; lat: number; lng: number; category: string }> }) => void
}

export default function AiTripPlannerModal({ darkMode, onClose, locations, onPlanTrip }: AiTripPlannerModalProps) {
  const [tripName, setTripName] = useState("")
  const [duration, setDuration] = useState(DURATIONS[0])
  const [selectedPrefs, setSelectedPrefs] = useState<string[]>([])
  const [planned, setPlanned] = useState(false)

  const bg = darkMode ? "bg-slate-800" : "bg-white"
  const textColor = darkMode ? "text-slate-200" : "text-slate-900"
  const inputBg = darkMode ? "bg-slate-700 border-slate-600" : "bg-white border-slate-200"
  const subText = darkMode ? "text-slate-400" : "text-slate-500"
  const chipBg = darkMode ? "bg-slate-700" : "bg-slate-100"
  const chipActive = "bg-sky-500 text-white border-sky-500"
  const cardBg = darkMode ? "bg-slate-700/50" : "bg-slate-50"

  function togglePref(pref: string) {
    setSelectedPrefs((prev) =>
      prev.includes(pref) ? prev.filter((p) => p !== pref) : [...prev, pref]
    )
  }

  const matchedLocations = useMemo(() => {
    if (selectedPrefs.length === 0) return []
    const lowerPrefs = selectedPrefs.map((p) => p.toLowerCase())
    return locations.filter((loc) => {
      const cat = loc.category.toLowerCase()
      return lowerPrefs.some((pref) => cat.includes(pref) || pref.includes(cat))
    })
  }, [selectedPrefs, locations])

  function handleGenerate() {
    setPlanned(true)
  }

  function handleConfirm() {
    onPlanTrip({
      places: matchedLocations.map((loc) => ({
        name: loc.name,
        lat: loc.lat,
        lng: loc.lng,
        category: loc.category,
      })),
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={onClose}>
      <div className={`${bg} rounded-2xl rounded-b-none sm:rounded-2xl shadow-xl w-full max-w-lg mx-4 sm:mb-0 p-6 max-h-[90vh] overflow-y-auto animate-slide-up sm:animate-none`}
        onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Sparkles size={18} className="text-sky-500" />
            <h3 className={`text-lg font-bold ${textColor}`}>AI Trip Planner</h3>
          </div>
          <button onClick={onClose} className={`p-1 rounded-lg ${darkMode ? "hover:bg-slate-700" : "hover:bg-slate-100"}`}>
            <X size={18} className={subText} />
          </button>
        </div>

        <input value={tripName} onChange={(e) => setTripName(e.target.value)} placeholder="Trip name"
          className={`w-full px-3 py-2.5 border rounded-xl text-sm mb-4 outline-none focus:border-sky-400 ${inputBg} ${textColor}`} />

        <label className={`text-xs font-medium ${subText} mb-2 block`}>Duration</label>
        <div className="flex gap-2 mb-4">
          {DURATIONS.map((d) => (
            <button key={d} onClick={() => setDuration(d)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${duration === d
                ? "bg-sky-500 text-white border-sky-500"
                : `${chipBg} ${textColor} border-transparent`
              }`}>
              <Clock size={14} />
              {d}
            </button>
          ))}
        </div>

        <label className={`text-xs font-medium ${subText} mb-2 block`}>Preferences</label>
        <div className="flex flex-wrap gap-2 mb-4">
          {PREFERENCES.map((pref) => {
            const active = selectedPrefs.includes(pref)
            return (
              <button key={pref} onClick={() => togglePref(pref)}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${active ? chipActive : `${chipBg} ${textColor} border-transparent`
                }`}>
                {active && <Check size={12} />}
                {pref}
              </button>
            )
          })}
        </div>

        <button onClick={handleGenerate} disabled={selectedPrefs.length === 0}
          className="w-full py-2.5 bg-sky-500 hover:bg-sky-600 active:bg-sky-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold rounded-xl text-sm transition-colors active:scale-[0.98] mb-4">
          Generate Plan
        </button>

        {planned && (
          <>
            {matchedLocations.length === 0 ? (
              <p className={`text-sm ${subText} text-center py-6`}>
                No locations found for selected preferences. Try different preferences.
              </p>
            ) : (
              <div className="space-y-3 mb-4">
                <h4 className={`text-sm font-semibold ${textColor}`}>
                  Your Route · {matchedLocations.length} stop{matchedLocations.length > 1 ? "s" : ""}
                  {tripName && <span className="text-sky-500"> · {tripName}</span>}
                </h4>
                <div className="relative pl-4 border-l-2 border-sky-400 space-y-3">
                  {matchedLocations.map((loc, i) => (
                    <div key={i} className="relative">
                      <div className="absolute -left-[19px] top-1 w-3 h-3 rounded-full bg-sky-400 border-2 border-white dark:border-slate-800" />
                      <div className={`${cardBg} rounded-xl p-3`}>
                        <div className="flex items-start gap-2">
                          <MapPin size={14} className="text-sky-500 mt-0.5 shrink-0" />
                          <div className="min-w-0">
                            <p className={`text-sm font-semibold ${textColor}`}>{loc.name}</p>
                            <span className={`inline-block text-[10px] uppercase tracking-wider font-medium px-1.5 py-0.5 rounded ${chipBg} ${subText} mt-0.5`}>
                              {loc.category}
                            </span>
                            <p className={`text-xs ${subText} mt-1 line-clamp-2`}>{loc.description}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <button onClick={() => setPlanned(false)}
                className={`flex-1 py-2.5 border rounded-xl text-sm font-medium transition-colors ${darkMode ? "border-slate-600 text-slate-300 hover:bg-slate-700" : "border-slate-200 text-slate-700 hover:bg-slate-50"}`}>
                Regenerate
              </button>
              <button onClick={handleConfirm} disabled={matchedLocations.length === 0}
                className="flex-1 py-2.5 bg-sky-500 hover:bg-sky-600 active:bg-sky-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold rounded-xl text-sm transition-colors active:scale-[0.98]">
                Confirm & Plan Trip
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
