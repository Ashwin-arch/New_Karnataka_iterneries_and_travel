"use client"

import { useEffect, useRef, useState } from "react"
import { X, Eye, AlertCircle, Loader2, Map, Maximize2, Minimize2, ExternalLink, Navigation } from "lucide-react"

interface StreetViewModalProps {
  darkMode: boolean
  lat: number
  lng: number
  placeName: string
  onClose: () => void
}

export default function StreetViewModal({ darkMode, lat, lng, placeName, onClose }: StreetViewModalProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const panoramaRef = useRef<google.maps.StreetViewPanorama | null>(null)
  const [status, setStatus] = useState<"checking" | "available" | "unavailable" | "error">("checking")
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [errorMsg, setErrorMsg] = useState("")

  useEffect(() => {
    let cancelled = false
    const sv = new google.maps.StreetViewService()

    sv.getPanorama({ location: { lat, lng }, radius: 200, preference: google.maps.StreetViewPreference.NEAREST },
      (data, statusCode) => {
        if (cancelled) return
        if (statusCode === google.maps.StreetViewStatus.OK && data?.location?.latLng) {
          setStatus("available")
          if (containerRef.current) {
            queueMicrotask(() => {
              if (!containerRef.current) return
              const pano = new google.maps.StreetViewPanorama(containerRef.current, {
                position: data.location!.latLng,
                pov: { heading: 0, pitch: 0 },
                zoom: 1,
                addressControl: false,
                motionTracking: true,
                motionTrackingControl: true,
                linksControl: true,
                clickToGo: true,
                showRoadLabels: false,
                fullscreenControl: false,
                zoomControl: true,
                panControl: true,
                enableCloseButton: false,
              })
              pano.addListener("error", () => {
                if (!cancelled) setStatus("unavailable")
              })
              panoramaRef.current = pano
            })
          }
        } else {
          if (!cancelled) setStatus("unavailable")
        }
      },
    )

    return () => {
      cancelled = true
      if (panoramaRef.current) {
        try {
          google.maps.event.clearInstanceListeners(panoramaRef.current)
          panoramaRef.current.setVisible(false)
        } catch { /* ignore */ }
        panoramaRef.current = null
      }
    }
  }, [lat, lng])

  function toggleFullscreen() {
    if (!isFullscreen) {
      document.documentElement.requestFullscreen?.()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen?.()
      setIsFullscreen(false)
    }
  }

  function openGoogleMaps() {
    window.open(`https://www.google.com/maps?q=${lat},${lng}`, "_blank")
  }

  function openStreetView() {
    window.open(`https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${lat},${lng}`, "_blank")
  }

  const textColor = darkMode ? "text-slate-200" : "text-slate-800"
  const subText = darkMode ? "text-slate-400" : "text-slate-500"

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-2 sm:p-4"
      style={{ animation: "fadeIn 0.2s ease-out" }}>
      <div className={`rounded-2xl overflow-hidden shadow-2xl w-full flex flex-col ${
        isFullscreen ? "max-w-none max-h-none h-full w-full rounded-none" : "max-w-4xl max-h-[90vh] sm:max-h-[85vh]"
      } ${darkMode ? "bg-slate-800" : "bg-white"}`}>
        <div className={`flex items-center justify-between p-3 border-b flex-shrink-0 ${darkMode ? "border-slate-700" : "border-slate-100"}`}>
          <h3 className={`text-sm font-semibold flex items-center gap-2 ${textColor}`}>
            <Eye size={16} className="text-sky-500" />
            Street View — {placeName}
          </h3>
          <div className="flex items-center gap-1">
            <button onClick={toggleFullscreen}
              className={`p-1.5 rounded-lg transition-colors ${darkMode ? "hover:bg-slate-700 text-slate-400" : "hover:bg-slate-100 text-slate-400"}`}
              title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}>
              {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>
            <button onClick={onClose}
              className={`p-1.5 rounded-lg transition-colors ${darkMode ? "hover:bg-slate-700 text-slate-400" : "hover:bg-slate-100 text-slate-400 hover:text-slate-600"}`}>
              <X size={16} />
            </button>
          </div>
        </div>

        {status === "checking" && (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Loader2 size={24} className="animate-spin text-sky-500" />
            <p className={`text-xs ${subText}`}>
              Checking Street View availability...
            </p>
          </div>
        )}

        {status === "available" && (
          <div className="relative flex-1">
            <div ref={containerRef} className="w-full min-h-[50vh] sm:min-h-[60vh]" />
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 flex gap-2">
              <button onClick={openStreetView}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white/90 hover:bg-white text-slate-700 text-xs font-medium rounded-full shadow-lg transition-colors backdrop-blur-sm">
                <ExternalLink size={12} /> Open in Google Maps
              </button>
            </div>
          </div>
        )}

        {status === "unavailable" && (
          <div className="flex flex-col items-center justify-center py-12 px-6 gap-3">
            <div className="w-14 h-14 rounded-full bg-amber-50 flex items-center justify-center">
              <Map size={24} className="text-amber-400" />
            </div>
            <p className={`text-sm font-semibold ${textColor}`}>
              No Street View imagery at this location
            </p>
            <p className={`text-xs text-center max-w-xs ${subText}`}>
              Street View isn't available for {placeName}. Try exploring nearby on Google Maps.
            </p>
            <div className="flex gap-2 mt-1">
              <button onClick={openGoogleMaps}
                className="flex items-center gap-1.5 px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white text-xs font-semibold rounded-xl transition-colors">
                <Map size={14} /> View on Google Maps
              </button>
              <button onClick={openStreetView}
                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold rounded-xl transition-colors">
                <Navigation size={14} /> Try Street View
              </button>
            </div>
            <button onClick={onClose}
              className={`px-4 py-1.5 text-xs font-medium rounded-lg transition-colors ${darkMode ? "text-slate-400 hover:text-slate-300" : "text-slate-500 hover:text-slate-700"}`}>
              Close
            </button>
          </div>
        )}

        {status === "error" && (
          <div className="flex flex-col items-center justify-center py-12 px-6 gap-3">
            <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center">
              <AlertCircle size={24} className="text-red-400" />
            </div>
            <p className={`text-sm font-semibold ${textColor}`}>
              Something went wrong
            </p>
            <p className={`text-xs text-center max-w-xs ${subText}`}>
              {errorMsg || "Could not load Street View. Please try again."}
            </p>
            <button onClick={openGoogleMaps}
              className="flex items-center gap-1.5 px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white text-xs font-semibold rounded-xl transition-colors">
              <Map size={14} /> View on Google Maps
            </button>
            <button onClick={onClose}
              className={`px-4 py-1.5 text-xs font-medium rounded-lg transition-colors ${darkMode ? "text-slate-400 hover:text-slate-300" : "text-slate-500 hover:text-slate-700"}`}>
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
