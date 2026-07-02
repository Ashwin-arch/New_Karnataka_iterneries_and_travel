"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Loader2, X, Phone, Star, Shield, AlertTriangle, Hospital } from "lucide-react"
import type { EmergencyService, EmergencyServiceType } from "@/lib/types"

const SERVICE_META: Record<EmergencyServiceType, { label: string; color: string; icon: typeof Shield }> = {
  hospital: { label: "Hospitals", color: "#ef4444", icon: Hospital },
  police: { label: "Police Stations", color: "#3b82f6", icon: Shield },
  fire_station: { label: "Fire Stations", color: "#f97316", icon: AlertTriangle },
}

const GOOGLE_TYPE_MAP: Record<EmergencyServiceType, string> = {
  hospital: "hospital",
  police: "police",
  fire_station: "fire_station",
}

interface EmergencyServicesProps {
  darkMode: boolean
  lat: number
  lng: number
  serviceType: EmergencyServiceType | null
  onClose: () => void
  onServicesFound: (services: EmergencyService[]) => void
}

export default function EmergencyServices({
  darkMode, lat, lng, serviceType, onClose, onServicesFound,
}: EmergencyServicesProps) {
  const [services, setServices] = useState<EmergencyService[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const serviceRef = useRef<google.maps.places.PlacesService | null>(null)

  const searchEmergencyServices = useCallback((type: EmergencyServiceType) => {
    if (!window.google?.maps?.places?.PlacesServiceStatus) {
      setError("Places API not available")
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
          radius: 10000,
          type: GOOGLE_TYPE_MAP[type],
        },
        (results, status) => {
          setLoading(false)
          if (status === google.maps.places.PlacesServiceStatus.OK && results) {
            const mapped: EmergencyService[] = results.slice(0, 10).map((p) => ({
              id: p.place_id || Math.random().toString(36).slice(2, 8),
              name: p.name || "",
              vicinity: p.vicinity || "",
              type,
              lat: p.geometry?.location?.lat() || 0,
              lng: p.geometry?.location?.lng() || 0,
              rating: p.rating,
              phone: p.formatted_phone_number || p.international_phone_number,
            }))
            setServices(mapped)
            onServicesFound(mapped)
          } else if (status === google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
            setServices([])
            onServicesFound([])
          } else if (status === google.maps.places.PlacesServiceStatus.REQUEST_DENIED) {
            setError("Places API not enabled")
            setServices([])
            onServicesFound([])
          } else {
            setError("No emergency services found")
            setServices([])
            onServicesFound([])
          }
        },
      )
    } catch {
      setLoading(false)
      setError("Failed to search emergency services")
      onServicesFound([])
    }
  }, [lat, lng, onServicesFound])

  useEffect(() => {
    if (serviceType) {
      setTimeout(() => searchEmergencyServices(serviceType), 0)
    }
  }, [serviceType, searchEmergencyServices])

  if (!serviceType) return null

  const meta = SERVICE_META[serviceType]
  const Icon = meta.icon

  const cardBg = darkMode ? "bg-slate-800" : "bg-white"
  const textColor = darkMode ? "text-slate-200" : "text-slate-800"
  const subText = darkMode ? "text-slate-400" : "text-slate-500"
  const borderColor = darkMode ? "border-slate-700" : "border-slate-200"
  const hoverBg = darkMode ? "hover:bg-slate-700" : "hover:bg-slate-50"

  return (
    <div className={`absolute top-20 right-4 z-30 max-w-xs w-[90%] shadow-xl rounded-2xl border ${borderColor} ${cardBg} overflow-hidden`}
      style={{ animation: "fadeInUpSmall 0.2s ease-out" }}>
      <div className={`flex items-center justify-between px-4 py-3 border-b ${borderColor}`}>
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg" style={{ background: `${meta.color}20` }}>
            <Icon size={14} style={{ color: meta.color }} />
          </div>
          <span className={`text-sm font-bold ${textColor}`}>{meta.label}</span>
        </div>
        <button onClick={onClose}
          className={`p-1 rounded-lg ${darkMode ? "hover:bg-slate-700 text-slate-500" : "hover:bg-slate-100 text-slate-400"}`}>
          <X size={14} />
        </button>
      </div>

      <div className="max-h-72 overflow-y-auto">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-8 gap-2">
            <Loader2 size={20} className="animate-spin text-sky-500" />
            <span className={`text-xs ${subText}`}>Searching...</span>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center py-6 px-4 gap-2">
            <div className={`p-2 rounded-full ${darkMode ? "bg-amber-900/30" : "bg-amber-50"}`}>
              <AlertTriangle size={16} className="text-amber-500" />
            </div>
            <p className={`text-xs text-center ${subText}`}>{error}</p>
          </div>
        ) : services.length === 0 ? (
          <div className="flex flex-col items-center py-6 px-4 gap-2">
            <p className={`text-xs text-center ${subText}`}>No {meta.label.toLowerCase()} found nearby</p>
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {services.map((svc, i) => (
              <div key={svc.id}
                className={`flex items-start gap-3 p-2.5 rounded-xl ${hoverBg} transition-colors`}
                style={{ animation: `fadeInUp 0.3s ease-out ${i * 50}ms both` }}>
                <div className={`p-2 rounded-full flex-shrink-0`}
                  style={{ background: `${meta.color}20` }}>
                  <Icon size={14} style={{ color: meta.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-xs font-semibold ${textColor} truncate`}>{svc.name}</p>
                  <p className={`text-[10px] ${subText} truncate mt-0.5`}>{svc.vicinity}</p>
                  <div className="flex items-center gap-2 mt-1">
                    {svc.rating && (
                      <span className={`flex items-center gap-0.5 text-[10px] ${subText}`}>
                        <Star size={9} className="text-amber-400 fill-amber-400" />
                        {svc.rating.toFixed(1)}
                      </span>
                    )}
                    {svc.phone && (
                      <a href={`tel:${svc.phone}`}
                        className="flex items-center gap-0.5 text-[10px] text-sky-500 hover:underline">
                        <Phone size={9} /> Call
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
