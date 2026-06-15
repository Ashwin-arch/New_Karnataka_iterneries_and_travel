"use client"

import { useState, useEffect, useRef, useCallback, useMemo } from "react"
import { Loader2, MapIcon, X, Heart, Plus, UserPlus, LogIn, Flame, Shield, Share2, Mic, RefreshCw, Crosshair, Sparkles, AlertTriangle, Route } from "lucide-react"
import { karnatakaLocations } from "@/data/karnataka-locations"
import type { KarnatakaLocation, Review, User, PendingPlace, MapTypeId, SavedRoute, Report, EmergencyService, EmergencyServiceType } from "@/lib/types"
import { MAP_STYLES, MAP_STYLES_DARK, API_KEY, CLUSTER_ZOOM, CATEGORY_COLORS } from "@/lib/constants"
import { createPinSVG, createClusterIcon, genId, LS } from "@/lib/utils"
import type { NearbyPlaceResult } from "@/components/nearby-places"

import MapControls from "@/components/map/map-controls"
import SearchBar from "@/components/map/search-bar"
import LocationSidebar from "@/components/map/location-sidebar"
import PlaceBottomSheet from "@/components/map/place-bottom-sheet"
import AuthModal from "@/components/modal/auth-modal"
import AdminPanel from "@/components/modal/admin-panel"
import CollectionsModal from "@/components/modal/collections-modal"
import SubmitPlaceModal from "@/components/modal/submit-place-modal"
import StreetViewModal from "@/components/modal/street-view-modal"
import AITripPlannerModal from "@/components/modal/ai-trip-planner-modal"
import ReportIssueModal from "@/components/modal/report-issue-modal"
import EmergencyServices from "@/components/map/emergency-services"

declare global {
  interface Window {
    __googleMapsCallback?: () => void
  }
}

export default function GoogleKarnatakaMap() {
  // --- Map state ---
  const [mapsLoaded, setMapsLoaded] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [selectedLocation, setSelectedLocation] = useState<KarnatakaLocation | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [mapType, setMapType] = useState<MapTypeId>("roadmap")
  const [nearbyCount, setNearbyCount] = useState(0)
  const [showNearby, setShowNearby] = useState(false)
  const [darkMode, setDarkMode] = useState(false)
  useEffect(() => { setDarkMode(LS.get("darkMode", false)) }, [])

  // --- Emergency Services ---
  const [showEmergencyServices, setShowEmergencyServices] = useState<EmergencyServiceType | null>(null)
  const emergencyMarkersRef = useRef<google.maps.Marker[]>([])

  // Live location tracking
  const [isTracking, setIsTracking] = useState(false)
  const [locationAccuracy, setLocationAccuracy] = useState<number | null>(null)
  const watchIdRef = useRef<number | null>(null)
  const userMarkerRef = useRef<google.maps.Marker | google.maps.marker.AdvancedMarkerElement | null>(null)

  // --- Layers ---
  const [showHeatmap, setShowHeatmap] = useState(false)
  const heatmapRef = useRef<google.maps.visualization.HeatmapLayer | null>(null)
  const [showStreetView, setShowStreetView] = useState(false)
  const [showTraffic, setShowTraffic] = useState(false)
  const trafficRef = useRef<google.maps.TrafficLayer | null>(null)
  const [showTransit, setShowTransit] = useState(false)
  const transitRef = useRef<google.maps.TransitLayer | null>(null)
  const [showBicycling, setShowBicycling] = useState(false)
  const bicyclingRef = useRef<google.maps.BicyclingLayer | null>(null)

  // --- Fullscreen ---
  const [isFullscreen, setIsFullscreen] = useState(false)

  // --- Elevation ---
  const [elevationData, setElevationData] = useState<number | null>(null)
  const [elevationLoading, setElevationLoading] = useState(false)

  // --- Geocoder ---
  const geocoderRef = useRef<google.maps.Geocoder | null>(null)

  // --- User ---
  const [user, setUser] = useState<User | null>(() => LS.get<User | null>("user", null))
  const [showAuth, setShowAuth] = useState(false)
  
  const [reviews, setReviews] = useState<Review[]>(() => LS.get<Review[]>("reviews", []))
  const [showReviews, setShowReviews] = useState(false)
  const [newReview, setNewReview] = useState({ rating: 5, text: "" })

  // --- Admin ---
  const [isAdmin] = useState(false)
  const [showAdmin, setShowAdmin] = useState(false)
  const [pendingPlaces, setPendingPlaces] = useState<PendingPlace[]>(() => LS.get<PendingPlace[]>("pending_places", []))

  // --- Submit place ---
  const [showSubmitPlace, setShowSubmitPlace] = useState(false)
  const [submitForm, setSubmitForm] = useState({ name: "", place: "", lat: "", lng: "", category: "waterfall", description: "" })

  // --- Collections ---
  const [showCollections, setShowCollections] = useState(false)

  // --- Saved routes ---
  const [savedRoutes, setSavedRoutes] = useState<SavedRoute[]>(() => LS.get<SavedRoute[]>("saved_routes", []))
  const [showSavedRoutes, setShowSavedRoutes] = useState(false)

  // --- Reports ---
  const [reports, setReports] = useState<Report[]>(() => LS.get<Report[]>("reports", []))
  const [showReportIssue, setShowReportIssue] = useState(false)

  // --- AI Trip Planner ---
  const [showTripPlanner, setShowTripPlanner] = useState(false)
  const [plannedPlaces, setPlannedPlaces] = useState<Array<{ name: string; lat: number; lng: number; category: string }>>([])

  // --- Recent searches ---
  const [recentSearches, setRecentSearches] = useState<string[]>(() => LS.get<string[]>("recent_searches", []))
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [categoryFilter, setCategoryFilter] = useState("all")

  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<google.maps.Map | null>(null)
  const markersRef = useRef<google.maps.Marker[]>([])
  const clusterMarkersRef = useRef<google.maps.Marker[]>([])
  const nearbyMarkersRef = useRef<google.maps.Marker[]>([])
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null)
  const mapsApiLoaded = useRef(false)
  const [gpsError, setGpsError] = useState<string | null>(null)
  const [permissionState, setPermissionState] = useState<"prompt" | "granted" | "denied" | "unavailable">("prompt")
  const [showPermissionHint, setShowPermissionHint] = useState(false)
  const [mapsTimeout, setMapsTimeout] = useState(false)
  const [mapCenter, setMapCenter] = useState({ lat: 15.3, lng: 75.7 })

  // Persist dark mode
  useEffect(() => { LS.set("darkMode", darkMode) }, [darkMode])

  // --- Permission state check ---
  useEffect(() => {
    if (!navigator.permissions) {
      setPermissionState("unavailable")
      return
    }
    navigator.permissions.query({ name: "geolocation" }).then((status) => {
      setPermissionState(status.state as "prompt" | "granted" | "denied")
      status.onchange = () => {
        setPermissionState(status.state as "prompt" | "granted" | "denied")
        if (status.state === "granted") setShowPermissionHint(false)
      }
    }).catch(() => setPermissionState("unavailable"))
  }, [])

  // --- Markers ---
  const locationToPinMeta = useCallback((loc: KarnatakaLocation) => {
    const meta = CATEGORY_COLORS[loc.category]
    return { color: meta || "#64748b", label: loc.id.toString() }
  }, [])

  function addMarkers(map: google.maps.Map) {
    markersRef.current.forEach((m) => m.setMap(null))
    markersRef.current = []
    karnatakaLocations.forEach((loc) => {
      const { color, label } = locationToPinMeta(loc)
      const marker = new google.maps.Marker({
        position: { lat: loc.lat, lng: loc.lng },
        map,
        title: loc.name,
        animation: google.maps.Animation.DROP,
        draggable: false,
        icon: { url: createPinSVG(color, label), anchor: new google.maps.Point(16, 40) },
      })
      marker.addListener("click", () => {
        setSelectedLocation(loc)
        setShowNearby(false)
        clearNearbyMarkers()
        closeInfoWindow()
      })
      markersRef.current.push(marker)
    })
  }

  function updateClustering() {
    const map = mapInstance.current
    if (!map) return
    const zoom = map.getZoom() ?? 7

    clusterMarkersRef.current.forEach((m) => m.setMap(null))
    clusterMarkersRef.current = []

    if (zoom >= CLUSTER_ZOOM) {
      markersRef.current.forEach((m) => m.setMap(map))
      return
    }

    markersRef.current.forEach((m) => m.setMap(null))

    const gridSize = Math.pow(2, CLUSTER_ZOOM - zoom) * 0.15
    const clusters: { lat: number; lng: number; markers: google.maps.Marker[] }[] = []

    markersRef.current.forEach((m) => {
      const pos = m.getPosition()
      if (!pos) return
      const lat = pos.lat()
      const lng = pos.lng()
      let added = false
      for (const c of clusters) {
        if (Math.abs(c.lat - lat) < gridSize && Math.abs(c.lng - lng) < gridSize) {
          c.markers.push(m)
          c.lat = (c.lat * (c.markers.length - 1) + lat) / c.markers.length
          c.lng = (c.lng * (c.markers.length - 1) + lng) / c.markers.length
          added = true
          break
        }
      }
      if (!added) clusters.push({ lat, lng, markers: [m] })
    })

    clusters.forEach((c) => {
      const clusterMarker = new google.maps.Marker({
        position: { lat: c.lat, lng: c.lng },
        map,
        icon: { url: createClusterIcon(c.markers.length), anchor: new google.maps.Point(20, 20) },
        zIndex: google.maps.Marker.MAX_ZINDEX + 1,
      })
      clusterMarker.addListener("click", () => {
        if (c.markers.length === 1) {
          google.maps.event.trigger(c.markers[0], "click")
        } else {
          const bounds = new google.maps.LatLngBounds()
          c.markers.forEach((m) => { const p = m.getPosition(); if (p) bounds.extend(p) })
          map.fitBounds(bounds, 40)
          setTimeout(() => updateClustering(), 500)
        }
      })
      clusterMarkersRef.current.push(clusterMarker)
    })
  }

  function clearNearbyMarkers() {
    nearbyMarkersRef.current.forEach((m) => m.setMap(null))
    nearbyMarkersRef.current = []
  }

  function closeInfoWindow() { infoWindowRef.current?.close() }

  function fitMapBounds() {
    if (!mapInstance.current) return
    const bounds = new google.maps.LatLngBounds()
    karnatakaLocations.forEach((l) => bounds.extend({ lat: l.lat, lng: l.lng }))
    mapInstance.current.fitBounds(bounds, 60)
  }

  function flyToLocation(loc: KarnatakaLocation) {
    if (!mapInstance.current) return
    mapInstance.current.panTo({ lat: loc.lat, lng: loc.lng })
    mapInstance.current.setZoom(14)
  }

  function handlePlaceClick(loc: KarnatakaLocation) {
    setSelectedLocation(loc)
    setShowNearby(false)
    clearNearbyMarkers()
    closeInfoWindow()
    flyToLocation(loc)
    if (!recentSearches.includes(loc.name)) {
      const updated = [loc.name, ...recentSearches].slice(0, 5)
      setRecentSearches(updated)
      LS.set("recent_searches", updated)
    }
  }

  function handleNearbyPlaces(places: NearbyPlaceResult[]) {
    clearNearbyMarkers()
    setNearbyCount(places.length)
    if (!mapInstance.current || places.length === 0) return
    const info = new google.maps.InfoWindow()
    for (let i = 0; i < places.length; i++) {
      const place = places[i]
      const color = place.type === "restaurant" ? "#f97316" : place.type === "hotel" ? "#8b5cf6" : "#06b6d4"
      const marker = new google.maps.Marker({
        position: { lat: place.lat, lng: place.lng },
        map: mapInstance.current, title: place.name,
        icon: { path: google.maps.SymbolPath.CIRCLE, scale: 10, fillColor: color, fillOpacity: 1, strokeColor: "#fff", strokeWeight: 2 },
        label: { text: String(i + 1), color: "#fff", fontSize: "11px", fontWeight: "bold" },
      })
      marker.addListener("click", () => {
        info.setContent(`<div style="font-family:system-ui,sans-serif;max-width:220px;padding:4px"><strong style="font-size:13px;color:#0f172a">${place.name}</strong><p style="margin:4px 0;font-size:11px;color:#64748b">${place.vicinity}</p>${place.rating ? `<p style="margin:2px 0;font-size:11px;color:#f59e0b">★ ${place.rating.toFixed(1)}</p>` : ""}<p style="margin-top:6px;font-size:10px;color:#94a3b8">Click marker for details</p></div>`)
        info.open(mapInstance.current!, marker)
      })
      nearbyMarkersRef.current.push(marker)
    }
  }





  function clearEmergencyMarkers() {
    emergencyMarkersRef.current.forEach((m) => m.setMap(null))
    emergencyMarkersRef.current = []
  }

  function handleEmergencyServicesFound(services: EmergencyService[]) {
    clearEmergencyMarkers()
    if (!mapInstance.current) return

    const info = new google.maps.InfoWindow()
    const colors: Record<string, string> = { hospital: "#ef4444", police: "#3b82f6", fire_station: "#f97316" }

    services.forEach((svc) => {
      const color = colors[svc.type] || "#ef4444"
      const marker = new google.maps.Marker({
        position: { lat: svc.lat, lng: svc.lng },
        map: mapInstance.current,
        title: svc.name,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: color,
          fillOpacity: 1,
          strokeColor: "#fff",
          strokeWeight: 2,
        },
        zIndex: google.maps.Marker.MAX_ZINDEX - 1,
      })
      marker.addListener("click", () => {
        info.setContent(`<div style="font-family:system-ui,sans-serif;max-width:220px;padding:4px"><strong style="font-size:13px;color:#0f172a">${svc.name}</strong><p style="margin:4px 0;font-size:11px;color:#64748b">${svc.vicinity}</p>${svc.phone ? `<p style="margin:2px 0;font-size:11px;color:#0ea5e9">📞 ${svc.phone}</p>` : ""}<p style="margin-top:6px;font-size:10px;color:#94a3b8">Emergency service</p></div>`)
        info.open(mapInstance.current!, marker)
      })
      emergencyMarkersRef.current.push(marker)
    })
  }

  function handleShowEmergencyServices(type: EmergencyServiceType) {
    setShowEmergencyServices(type)
  }

  function handleEmergencyServicesClose() {
    setShowEmergencyServices(null)
    clearEmergencyMarkers()
  }

  // --- Heatmap ---
  function toggleHeatmap() {
    if (!mapInstance.current) return
    const hl = heatmapRef.current as unknown as { setMap: (m: google.maps.Map | null) => void } | null
    if (hl) {
      hl.setMap(showHeatmap ? null : mapInstance.current)
      setShowHeatmap(!showHeatmap)
      return
    }
    if (!showHeatmap) {
      const points = karnatakaLocations.map((l) => new google.maps.LatLng(l.lat, l.lng))
      const layer = new (google.maps.visualization.HeatmapLayer as unknown as new (opts: { data: google.maps.LatLng[]; map: google.maps.Map; radius: number; opacity: number }) => google.maps.visualization.HeatmapLayer)({
        data: points,
        map: mapInstance.current,
        radius: 30,
        opacity: 0.6,
      })
      heatmapRef.current = layer
      setShowHeatmap(true)
    }
  }

  function removeHeatmap() {
    const hl = heatmapRef.current as unknown as { setMap: (m: null) => void } | null
    hl?.setMap(null)
    heatmapRef.current = null
    setShowHeatmap(false)
  }

  // --- Traffic ---
  function toggleTraffic() {
    if (!mapInstance.current) return
    if (trafficRef.current) {
      trafficRef.current.setMap(showTraffic ? null : mapInstance.current)
      setShowTraffic(!showTraffic)
      return
    }
    const layer = new google.maps.TrafficLayer()
    layer.setMap(mapInstance.current)
    trafficRef.current = layer
    setShowTraffic(true)
  }

  // --- Transit ---
  function toggleTransit() {
    if (!mapInstance.current) return
    if (transitRef.current) {
      transitRef.current.setMap(showTransit ? null : mapInstance.current)
      setShowTransit(!showTransit)
      return
    }
    const layer = new google.maps.TransitLayer()
    layer.setMap(mapInstance.current)
    transitRef.current = layer
    setShowTransit(true)
  }

  // --- Bicycling ---
  function toggleBicycling() {
    if (!mapInstance.current) return
    if (bicyclingRef.current) {
      bicyclingRef.current.setMap(showBicycling ? null : mapInstance.current)
      setShowBicycling(!showBicycling)
      return
    }
    const layer = new google.maps.BicyclingLayer()
    layer.setMap(mapInstance.current)
    bicyclingRef.current = layer
    setShowBicycling(true)
  }

  // --- Fullscreen ---
  function toggleFullscreen() {
    const el = document.documentElement
    if (!document.fullscreenElement) {
      el.requestFullscreen?.()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen?.()
      setIsFullscreen(false)
    }
  }

  // --- Elevation ---
  function fetchElevation(lat: number, lng: number) {
    setElevationLoading(true)
    const elevator = new google.maps.ElevationService()
    elevator.getElevationForLocations({ locations: [{ lat, lng }] })
      .then(({ results }) => {
        if (results[0]) setElevationData(results[0].elevation)
        setElevationLoading(false)
      })
      .catch(() => setElevationLoading(false))
  }

  // --- Geocoding search ---
  function geocodeSearch(query: string) {
    if (!geocoderRef.current || !query.trim()) return
    geocoderRef.current.geocode({ address: query, region: "IN" }, (results, status) => {
      if (status === "OK" && results?.[0]) {
        const loc = results[0].geometry.location
        mapInstance.current?.panTo(loc)
        mapInstance.current?.setZoom(14)
        new google.maps.Marker({
          position: loc,
          map: mapInstance.current,
          title: results[0].formatted_address,
          animation: google.maps.Animation.DROP,
          icon: { path: google.maps.SymbolPath.CIRCLE, scale: 10, fillColor: "#0ea5e9", fillOpacity: 1, strokeColor: "#fff", strokeWeight: 2 },
        })
        if (!recentSearches.includes(query)) {
          const updated = [query, ...recentSearches].slice(0, 5)
          setRecentSearches(updated)
          LS.set("recent_searches", updated)
        }
      }
    })
  }

  // --- Current location with live tracking ---
  function handleCurrentLocation() {
    if (!mapInstance.current || !navigator.geolocation) {
      setGpsError("Geolocation is not available in your browser")
      return
    }
    setGpsError(null)

    if (isTracking && watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current)
      watchIdRef.current = null
      setIsTracking(false)
      setLocationAccuracy(null)
      if (userMarkerRef.current) {
        if ("setMap" in userMarkerRef.current) {
          (userMarkerRef.current as google.maps.Marker).setMap(null)
        } else {
          (userMarkerRef.current as google.maps.marker.AdvancedMarkerElement).map = null
        }
        userMarkerRef.current = null
      }
      return
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude
        const lng = pos.coords.longitude
        mapInstance.current?.panTo({ lat, lng })
        mapInstance.current?.setZoom(15)

        if (userMarkerRef.current) {
          if ("setMap" in userMarkerRef.current) {
            (userMarkerRef.current as google.maps.Marker).setMap(null)
          } else {
            (userMarkerRef.current as google.maps.marker.AdvancedMarkerElement).map = null
          }
        }
        const markerEl = document.createElement("div")
        markerEl.style.cssText = "width:20px;height:20px;border-radius:50%;background:#0ea5e9;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);cursor:grab"
        const marker = new google.maps.marker.AdvancedMarkerElement({
          position: { lat, lng },
          map: mapInstance.current,
          content: markerEl,
          title: "You are here",
          gmpDraggable: true,
        })
        marker.addListener("dragend", (e: google.maps.MapMouseEvent) => {
          const p = e.latLng
          if (p) {
            mapInstance.current?.panTo(p)
            setLocationAccuracy(null)
          }
        })
        userMarkerRef.current = marker as unknown as google.maps.Marker
        setLocationAccuracy(pos.coords.accuracy)
        setShowPermissionHint(false)

        // Start live tracking
        watchIdRef.current = navigator.geolocation.watchPosition(
          (p) => {
            const lat2 = p.coords.latitude
            const lng2 = p.coords.longitude
            setLocationAccuracy(p.coords.accuracy)
            if (userMarkerRef.current) {
              (userMarkerRef.current as unknown as { position: google.maps.LatLngLiteral }).position = { lat: lat2, lng: lng2 }
            }
          },
          (err: GeolocationPositionError) => {
            setIsTracking(false)
            setLocationAccuracy(null)
            if (err.code === err.PERMISSION_DENIED) {
              setPermissionState("denied")
              setShowPermissionHint(true)
              setGpsError("Location tracking denied. Enable location in your browser settings.")
            } else {
              setGpsError("Location tracking interrupted. Check your device GPS.")
            }
          },
          { enableHighAccuracy: true, timeout: 15000, maximumAge: 5000 },
        )
        setIsTracking(true)
      },
      (err: GeolocationPositionError) => {
        if (err.code === err.PERMISSION_DENIED) {
          setPermissionState("denied")
          setShowPermissionHint(true)
          setGpsError("Location access denied. Enable location in your browser settings, then tap 'Try again'.")
        } else if (err.code === err.TIMEOUT) {
          setGpsError("Location request timed out. Try moving to an open area or check your GPS.")
        } else {
          setGpsError("Unable to get your location. Check your device GPS and try again.")
        }
      },
      { enableHighAccuracy: true, timeout: 15000 },
    )
  }

  // --- Map initialization ---
  const initMap = useCallback(() => {
    mapsApiLoaded.current = true
    if (!mapRef.current) return
    // If map already exists, just update styles (don't re-create)
    if (mapInstance.current) {
      mapInstance.current.setOptions({ styles: darkMode ? MAP_STYLES_DARK : MAP_STYLES })
      return
    }
    try {
      const map = new google.maps.Map(mapRef.current, {
        center: { lat: 15.3, lng: 75.7 }, zoom: 7,
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        mapTypeControl: false, streetViewControl: false, fullscreenControl: false, zoomControl: false,
        rotateControl: true,
        gestureHandling: "greedy",
        styles: darkMode ? MAP_STYLES_DARK : MAP_STYLES,
      })
      mapInstance.current = map
      infoWindowRef.current = new google.maps.InfoWindow()
      geocoderRef.current = new google.maps.Geocoder()

      try {
        map.data.loadGeoJson("/karnataka-GeoJSON.json")
      } catch (e) {
        console.warn("GeoJSON load failed, continuing without district overlay", e)
      }
      map.data.setStyle({
        fillColor: darkMode ? "#1e3a5f" : "#dbeafe",
        fillOpacity: 0.1,
        strokeColor: darkMode ? "#3b82f6" : "#0ea5e9",
        strokeWeight: 1.5,
      })
      let geoJsonLoaded = false
      const onGeoJsonLoaded = () => {
        if (geoJsonLoaded) return
        geoJsonLoaded = true
        addMarkers(map)
        updateClustering()
        setMapsLoaded(true)
      }
      google.maps.event.addListenerOnce(map.data, "addfeature", onGeoJsonLoaded)
      // If GeoJSON has no features or fails silently, still show map after a short delay
      setTimeout(() => {
        if (!geoJsonLoaded) onGeoJsonLoaded()
      }, 3000)
      map.data.addListener("mouseover", (e: google.maps.Data.MouseEvent) => {
        if (e.feature) map.data.overrideStyle(e.feature, { fillOpacity: 0.35, strokeWeight: 2.5 })
      })
      map.data.addListener("mouseout", () => { map.data.revertStyle() })
      map.addListener("zoom_changed", () => updateClustering())
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Failed to initialize map")
    }
  }, [darkMode]) // eslint-disable-line react-hooks/exhaustive-deps

  // Ref so the Google Maps callback always calls the latest initMap
  const initMapRef = useRef(initMap)
  initMapRef.current = initMap

  // --- Google Maps API loading ---
  useEffect(() => {
    if (!API_KEY) return
    const existing = document.getElementById("google-maps-script")
    if (existing) {
      if (window.google?.maps) queueMicrotask(() => initMapRef.current())
      return
    }
    const script = document.createElement("script")
    script.id = "google-maps-script"
    script.src = `https://maps.googleapis.com/maps/api/js?key=${API_KEY}&libraries=places,visualization,geometry,marker&callback=__googleMapsCallback&loading=async`
    script.async = true
    window.__googleMapsCallback = () => initMapRef.current()
    script.onerror = () => setLoadError("Failed to load Google Maps API")
    document.head.appendChild(script)
    const timeoutId = setTimeout(() => {
      if (!mapsApiLoaded.current) setMapsTimeout(true)
    }, 20000)
    return () => clearTimeout(timeoutId)
  }, [API_KEY])

  // --- Map type change ---
  useEffect(() => {
    if (!mapsLoaded || !mapInstance.current) return
    mapInstance.current.setMapTypeId(google.maps.MapTypeId[mapType.toUpperCase() as keyof typeof google.maps.MapTypeId])
  }, [mapType, mapsLoaded])

  // --- Apply dark mode styles ---
  useEffect(() => {
    if (!mapsLoaded || !mapInstance.current) return
    mapInstance.current.setOptions({ styles: darkMode ? MAP_STYLES_DARK : MAP_STYLES })
    mapInstance.current.data.setStyle({
      fillColor: darkMode ? "#1e3a5f" : "#dbeafe",
      fillOpacity: 0.1,
      strokeColor: darkMode ? "#3b82f6" : "#0ea5e9",
      strokeWeight: 1.5,
    })
  }, [darkMode, mapsLoaded])



  // --- Fetch elevation on location change ---
  useEffect(() => {
    if (!selectedLocation) { const t = setTimeout(() => setElevationData(null), 0); return () => clearTimeout(t) }
    const t1 = setTimeout(() => {
      if (showStreetView) setShowStreetView(false)
    }, 0)
    const t2 = setTimeout(() => fetchElevation(selectedLocation.lat, selectedLocation.lng), 0)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [selectedLocation]) // eslint-disable-line react-hooks/exhaustive-deps

  // --- GPS error auto-clear ---
  useEffect(() => {
    if (gpsError && !showPermissionHint) {
      const t = setTimeout(() => setGpsError(null), 6000)
      return () => clearTimeout(t)
    }
  }, [gpsError, showPermissionHint])

  // --- Location sharing ---
  function handleShareLocation() {
    if (!selectedLocation) return
    const url = `https://www.google.com/maps/place/${selectedLocation.lat},${selectedLocation.lng}`
    if (navigator.share) {
      navigator.share({
        title: selectedLocation.name,
        text: `Check out ${selectedLocation.name} in ${selectedLocation.place}!`,
        url,
      }).catch(() => {})
    } else {
      navigator.clipboard.writeText(url).then(() => {
        setGpsError("Link copied to clipboard!")
        setTimeout(() => setGpsError(null), 3000)
      }).catch(() => {})
    }
  }

  // --- Saved routes ---
  function handleLoadSavedRoute(route: SavedRoute) {
    const loc = karnatakaLocations.find((l) => l.name === route.destination)
    if (loc) {
      handlePlaceClick(loc)
    }
    setShowSavedRoutes(false)
  }

  function handleDeleteSavedRoute(id: string) {
    const updated = savedRoutes.filter((r) => r.id !== id)
    setSavedRoutes(updated)
    LS.set("saved_routes", updated)
  }

  // --- Reports ---
  function handleSubmitReport(report: { type: string; description: string; lat: number; lng: number }) {
    const newReport: Report = {
      id: genId(),
      userId: user?.id || "anonymous",
      userName: user?.name || "Anonymous",
      type: report.type as Report["type"],
      lat: report.lat,
      lng: report.lng,
      description: report.description,
      date: new Date().toISOString(),
    }
    const updated = [newReport, ...reports]
    setReports(updated)
    LS.set("reports", updated)
    setShowReportIssue(false)
    setGpsError("Report submitted. Thank you!")
    setTimeout(() => setGpsError(null), 3000)
  }

  // --- AI Trip Planner ---
  function handlePlanTrip(plan: { places: { name: string; lat: number; lng: number; category: string }[] }) {
    setShowTripPlanner(false)
    setPlannedPlaces(plan.places)
    if (plan.places.length > 0) {
      const first = plan.places[0]
      const match = karnatakaLocations.find((l) => l.name === first.name)
      if (match) handlePlaceClick(match)
      else {
        setSearchQuery(first.name)
        geocodeSearch(first.name)
      }
      const names = plan.places.map((p) => p.name).join(" → ")
      setGpsError(`Trip planned! ${plan.places.length} stop${plan.places.length > 1 ? "s" : ""}: ${names}`)
      setTimeout(() => setGpsError(null), 5000)
    }
  }

  function handleNextPlanned() {
    if (plannedPlaces.length === 0) return
    const current = selectedLocation
    if (!current) {
      const first = plannedPlaces[0]
      const match = karnatakaLocations.find((l) => l.name === first.name)
      if (match) handlePlaceClick(match)
      return
    }
    const idx = plannedPlaces.findIndex((p) => p.name === current.name)
    const next = plannedPlaces[(idx + 1) % plannedPlaces.length]
    const match = karnatakaLocations.find((l) => l.name === next.name)
    if (match) handlePlaceClick(match)
  }

  function handlePrevPlanned() {
    if (plannedPlaces.length === 0) return
    const current = selectedLocation
    if (!current) return
    const idx = plannedPlaces.findIndex((p) => p.name === current.name)
    const prev = plannedPlaces[(idx - 1 + plannedPlaces.length) % plannedPlaces.length]
    const match = karnatakaLocations.find((l) => l.name === prev.name)
    if (match) handlePlaceClick(match)
  }

  // --- Voice search ---
  const [isListening, setIsListening] = useState(false)
  const recognitionRef = useRef<SpeechRecognition | null>(null)

  function handleVoiceSearch() {
    if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
      setGpsError("Voice search is not supported in your browser")
      return
    }
    if (isListening) {
      recognitionRef.current?.stop()
      setIsListening(false)
      return
    }
    const SpeechRecognitionAPI = (window.SpeechRecognition || window.webkitSpeechRecognition) as new () => SpeechRecognition
    const recognition = new SpeechRecognitionAPI()
    recognition.lang = "en-IN"
    recognition.interimResults = false
    recognition.maxAlternatives = 1
    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = event.results[0][0].transcript
      setSearchQuery(transcript)
      const match = karnatakaLocations.find((l) =>
        l.name.toLowerCase().includes(transcript.toLowerCase()) ||
        l.place.toLowerCase().includes(transcript.toLowerCase())
      )
      if (match) handlePlaceClick(match)
      else geocodeSearch(transcript)
    }
    recognition.onerror = () => {
      setGpsError("Voice search failed. Please try again.")
      setIsListening(false)
    }
    recognition.onend = () => setIsListening(false)
    recognition.start()
    recognitionRef.current = recognition
    setIsListening(true)
  }

  // --- Auth ---
  function handleAuth(name: string, email: string, mode: "login" | "signup") {
    if (mode === "signup") {
      if (!name || !email) return
      const newUser: User = { id: genId(), name, email, favorites: [], collections: [] }
      setUser(newUser)
      LS.set("user", newUser)
    } else {
      if (!email) return
      const existing: User = { id: genId(), name: email.split("@")[0], email, favorites: [], collections: [] }
      setUser(existing)
      LS.set("user", existing)
    }
    setShowAuth(false)
  }

  function handleLogout() { setUser(null); LS.set("user", null) }

  // --- Favorites ---
  function toggleFavorite(id: number) {
    if (!user) { setShowAuth(true); return }
    const favs = user.favorites.includes(id) ? user.favorites.filter((f) => f !== id) : [...user.favorites, id]
    const updated = { ...user, favorites: favs }
    setUser(updated)
    LS.set("user", updated)
  }

  // --- Reviews ---
  function addReview() {
    if (!user || !selectedLocation || !newReview.text.trim()) return
    const review: Review = {
      id: genId(), userId: user.id, userName: user.name,
      placeId: selectedLocation.id, rating: newReview.rating,
      text: newReview.text.trim(), date: new Date().toISOString().split("T")[0],
    }
    const updated = [review, ...reviews]
    setReviews(updated)
    LS.set("reviews", updated)
    setNewReview({ rating: 5, text: "" })
  }

  function deleteReview(id: string) {
    const updated = reviews.filter((r) => r.id !== id)
    setReviews(updated)
    LS.set("reviews", updated)
  }

  const placeReviews = useMemo(() => reviews.filter((r) => r.placeId === selectedLocation?.id), [reviews, selectedLocation?.id])

  // --- Collections ---
  function createCollection(name: string) {
    if (!user) return
    const updated = { ...user, collections: [...user.collections, { name, ids: [] }] }
    setUser(updated)
    LS.set("user", updated)
  }

  function toggleCollectionPlace(colIndex: number, placeId: number) {
    if (!user) return
    const cols = [...user.collections]
    const col = { ...cols[colIndex] }
    col.ids = col.ids.includes(placeId) ? col.ids.filter((id) => id !== placeId) : [...col.ids, placeId]
    cols[colIndex] = col
    const updated = { ...user, collections: cols }
    setUser(updated)
    LS.set("user", updated)
  }

  function deleteCollection(i: number) {
    if (!user) return
    const updated = { ...user, collections: user.collections.filter((_, idx) => idx !== i) }
    setUser(updated)
    LS.set("user", updated)
  }

  // --- Submit place ---
  function handleSubmitPlace() {
    if (!user) return
    const place: PendingPlace = {
      name: submitForm.name, place: submitForm.place,
      lat: parseFloat(submitForm.lat), lng: parseFloat(submitForm.lng),
      category: submitForm.category, description: submitForm.description,
      submittedBy: user.name, date: new Date().toISOString().split("T")[0],
    }
    const updated = [...pendingPlaces, place]
    setPendingPlaces(updated)
    LS.set("pending_places", updated)
    setShowSubmitPlace(false)
    setSubmitForm({ name: "", place: "", lat: "", lng: "", category: "waterfall", description: "" })
  }

  const approvePlace = useCallback((i: number) => {
    const p = pendingPlaces[i]
    const newLoc: KarnatakaLocation = {
      id: karnatakaLocations.length + 1,
      name: p.name, place: p.place, lat: p.lat, lng: p.lng,
      category: p.category as KarnatakaLocation["category"],
      description: p.description,
    }
    if (mapInstance.current) {
      const { color } = locationToPinMeta(newLoc)
      const marker = new google.maps.Marker({
        position: { lat: newLoc.lat, lng: newLoc.lng },
        map: mapInstance.current, title: newLoc.name,
        animation: google.maps.Animation.DROP,
        icon: { url: createPinSVG(color, newLoc.id.toString()), anchor: new google.maps.Point(16, 40) },
      })
      marker.addListener("click", () => setSelectedLocation(newLoc))
      markersRef.current.push(marker)
      updateClustering()
    }
    const updated = pendingPlaces.filter((_, idx) => idx !== i)
    setPendingPlaces(updated)
    LS.set("pending_places", updated)
  }, [locationToPinMeta, pendingPlaces]) // eslint-disable-line react-hooks/exhaustive-deps

  function rejectPlace(i: number) {
    const updated = pendingPlaces.filter((_, idx) => idx !== i)
    setPendingPlaces(updated)
    LS.set("pending_places", updated)
  }

  // --- Analytics ---
  const analytics = useMemo(() => {
    const total = karnatakaLocations.length
    const cats: Record<string, number> = {}
    karnatakaLocations.forEach((l) => { cats[l.category] = (cats[l.category] || 0) + 1 })
    return { total, categories: cats, reviews: reviews.length, users: user ? 1 : 0 }
  }, [reviews, user])

  // --- Bottom sheet navigation ---
  function handlePrevLocation() {
    if (!selectedLocation) return
    const idx = karnatakaLocations.findIndex((l) => l.id === selectedLocation.id)
    const prev = karnatakaLocations[(idx - 1 + karnatakaLocations.length) % karnatakaLocations.length]
    handlePlaceClick(prev)
  }

  function handleNextLocation() {
    if (!selectedLocation) return
    const idx = karnatakaLocations.findIndex((l) => l.id === selectedLocation.id)
    const next = karnatakaLocations[(idx + 1) % karnatakaLocations.length]
    handlePlaceClick(next)
  }

  function handleCloseBottomSheet() {
    setSelectedLocation(null)
    clearNearbyMarkers()
    closeInfoWindow()
    setShowReviews(false)
  }

  // --- Keyboard navigation ---
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (!selectedLocation) return
      if (e.key === "Escape") {
        handleCloseBottomSheet()
        return
      }
      if (e.key === "ArrowLeft") {
        handlePrevLocation()
        return
      }
      if (e.key === "ArrowRight") {
        handleNextLocation()
        return
      }
    }
    window.addEventListener("keydown", handleKey)
    return () => window.removeEventListener("keydown", handleKey)
  }, [selectedLocation]) // eslint-disable-line react-hooks/exhaustive-deps

  const textColor = darkMode ? "text-slate-200" : "text-slate-800"

  // --- Error state ---
  if (!API_KEY) {
    return (
      <div className="flex flex-col h-screen bg-slate-50 items-center justify-center p-6">
        <div className="bg-white p-6 rounded-2xl shadow-xl border border-amber-100 text-center max-w-md">
          <MapIcon className="mx-auto text-amber-600 mb-4" size={32} />
          <h3 className="text-lg font-bold text-slate-800 mb-2">Google Maps API Key Required</h3>
          <p className="text-slate-600 text-sm mb-4">Set <code className="bg-slate-100 px-1.5 py-0.5 rounded text-xs">NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> in .env.local</p>
          <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener noreferrer"
            className="inline-block px-4 py-2 bg-slate-900 text-white rounded-xl hover:bg-slate-800 text-sm">Get API Key</a>
        </div>
      </div>
    )
  }

  return (
    <div className={`h-screen w-full overflow-hidden font-sans relative flex ${
      darkMode ? "bg-slate-900" : "bg-slate-100"
    }`}>
      {/* Sidebar */}
      <LocationSidebar
        darkMode={darkMode}
        sidebarOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        selectedLocation={selectedLocation}
        onPlaceClick={handlePlaceClick}
        categoryFilter={categoryFilter}
        onCategoryFilter={setCategoryFilter}
        locations={karnatakaLocations}
      />

      {/* Map container */}
      <div className={`flex-1 relative overflow-hidden`}>
        <div ref={mapRef} className="absolute inset-0" />

        {/* Loading overlay */}
        {!mapsLoaded && !loadError && (
          <div className={`absolute inset-0 flex items-center justify-center backdrop-blur-sm z-30 ${
            darkMode ? "bg-slate-900/80" : "bg-slate-100/80"
          }`}>
            <div className={`flex flex-col items-center gap-3 p-6 rounded-2xl shadow-xl max-w-xs ${
              darkMode ? "bg-slate-800" : "bg-white/80"
            }`}>
              {mapsTimeout ? (
                <>
                  <div className={`p-3 rounded-full ${darkMode ? "bg-amber-900/50" : "bg-amber-100"}`}>
                    <X className={darkMode ? "text-amber-400" : "text-amber-600"} size={24} />
                  </div>
                  <p className={`font-semibold text-sm ${darkMode ? "text-slate-200" : "text-slate-800"}`}>Taking longer than expected</p>
                  <p className={`text-xs text-center leading-relaxed ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
                    Google Maps may be blocked by your network or ad blocker. Try reloading or check your internet connection.
                  </p>
                  <div className="flex gap-2 mt-1">
                    <button onClick={() => window.location.reload()}
                      className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors ${
                        darkMode ? "bg-sky-600 hover:bg-sky-500 text-white" : "bg-sky-500 hover:bg-sky-600 text-white"
                      }`}>
                      Retry
                    </button>
                    <button onClick={() => { setMapsTimeout(false); setMapsLoaded(true) }}
                      className={`px-4 py-2 text-xs font-medium rounded-lg transition-colors ${
                        darkMode ? "bg-slate-700 hover:bg-slate-600 text-slate-300" : "bg-slate-100 hover:bg-slate-200 text-slate-600"
                      }`}>
                      Continue anyway
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <Loader2 className="animate-spin text-sky-600" size={36} />
                  <p className={`font-medium ${darkMode ? "text-slate-300" : "text-slate-500"}`}>Loading Google Map...</p>
                </>
              )}
            </div>
          </div>
        )}

        {/* Error overlay */}
        {loadError && (
          <div className={`absolute inset-0 flex items-center justify-center backdrop-blur-sm z-30 ${
            darkMode ? "bg-slate-900/80" : "bg-slate-100/80"
          }`}>
            <div className={`p-6 rounded-2xl shadow-xl border border-red-100 text-center max-w-md ${
              darkMode ? "bg-slate-800 border-red-900/30" : "bg-white"
            }`}>
              <X className="mx-auto text-red-600 mb-4" size={24} />
              <h3 className={`text-lg font-bold mb-2 ${textColor}`}>Map Error</h3>
              <p className={`text-sm mb-4 ${darkMode ? "text-slate-300" : "text-slate-600"}`}>{loadError}</p>
              <button onClick={() => window.location.reload()}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl hover:bg-slate-800 text-sm">
                Retry
              </button>
            </div>
          </div>
        )}

        {/* Permission hint banner */}
        {showPermissionHint && permissionState === "denied" && (
          <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-30 max-w-sm w-[90%]"
            style={{ animation: "fadeInUp 0.3s ease-out" }}>
            <div className={`flex items-start gap-3 p-4 rounded-2xl shadow-xl border ${
              darkMode
                ? "bg-slate-800/95 border-slate-700 text-slate-200"
                : "bg-white/95 border-slate-200 text-slate-800"
            }`}>
              <div className={`p-2 rounded-full flex-shrink-0 ${
                darkMode ? "bg-amber-900/50 text-amber-400" : "bg-amber-100 text-amber-600"
              }`}>
                <Crosshair size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold mb-1">Location access needed</p>
                <p className={`text-xs leading-relaxed ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
                  Enable location permissions in your browser settings to use GPS features like directions and live tracking.
                </p>
                <div className="flex items-center gap-2 mt-3">
                  <button onClick={() => {
                    setShowPermissionHint(false)
                    setGpsError(null)
                    const recheck = () => {
                      if (navigator.permissions) {
                        navigator.permissions.query({ name: "geolocation" }).then((s) => {
                          setPermissionState(s.state as "prompt" | "granted" | "denied")
                          if (s.state === "granted") handleCurrentLocation()
                          else setShowPermissionHint(true)
                        }).catch(() => handleCurrentLocation())
                      } else {
                        handleCurrentLocation()
                      }
                    }
                    recheck()
                  }}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                      darkMode
                        ? "bg-sky-600 hover:bg-sky-500 text-white"
                        : "bg-sky-500 hover:bg-sky-600 text-white"
                    }`}>
                    Try again
                  </button>
                  <button onClick={() => setShowPermissionHint(false)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                      darkMode
                        ? "bg-slate-700 hover:bg-slate-600 text-slate-300"
                        : "bg-slate-100 hover:bg-slate-200 text-slate-600"
                    }`}>
                    Dismiss
                  </button>
                </div>
              </div>
              <button onClick={() => setShowPermissionHint(false)}
                className={`p-1 rounded-lg flex-shrink-0 transition-colors ${
                  darkMode ? "hover:bg-slate-700 text-slate-500" : "hover:bg-slate-100 text-slate-400"
                }`}>
                <X size={16} />
              </button>
            </div>
          </div>
        )}

        {/* GPS Error Toast */}
        {gpsError && !showPermissionHint && (
          <div className="absolute top-20 left-1/2 -translate-x-1/2 z-30 max-w-md w-[90%]"
            style={{ animation: "fadeInUpSmall 0.2s ease-out" }}>
            <div className={`flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg border ${
              darkMode
                ? "bg-amber-900/80 border-amber-700 text-amber-200"
                : "bg-amber-50 border-amber-200 text-amber-800"
            }`}>
              <span className="flex-1 text-xs font-medium">{gpsError}</span>
              <button onClick={() => setGpsError(null)}
                className={`p-0.5 rounded-full flex-shrink-0 transition-colors ${
                  darkMode ? "hover:bg-amber-800" : "hover:bg-amber-100"
                }`}>
                <X size={14} />
              </button>
            </div>
          </div>
        )}

        {/* Search bar */}
        <SearchBar
          darkMode={darkMode}
          locations={karnatakaLocations}
          recentSearches={recentSearches}
          onPlaceClick={handlePlaceClick}
          onGeocodeSearch={geocodeSearch}
          searchQuery={searchQuery}
          onSearchQueryChange={setSearchQuery}
          onSearchQueryClear={() => { setSearchQuery("") }}
          onVoiceSearch={handleVoiceSearch}
          isListening={isListening}
        />

        {/* Map controls */}
        <MapControls
          mapInstance={mapInstance.current}
          mapType={mapType}
          onMapTypeChange={setMapType}
          onCurrentLocation={handleCurrentLocation}
          onFitBounds={fitMapBounds}
          showHeatmap={showHeatmap}
          onToggleHeatmap={toggleHeatmap}
          showTraffic={showTraffic}
          onToggleTraffic={toggleTraffic}
          showTransit={showTransit}
          onToggleTransit={toggleTransit}
          showBicycling={showBicycling}
          onToggleBicycling={toggleBicycling}
          isFullscreen={isFullscreen}
          onToggleFullscreen={toggleFullscreen}
          darkMode={darkMode}
          onToggleDarkMode={() => setDarkMode(!darkMode)}
          isTracking={isTracking}
          locationAccuracy={locationAccuracy}
        />

        {/* Top bar (user, admin, submit, heatmap hide) */}
        <div className="absolute top-4 right-4 z-20 flex items-center gap-1.5 sm:gap-2 flex-wrap justify-end max-w-[calc(100vw-3.5rem)]">
          {showHeatmap && (
            <button onClick={removeHeatmap}
              className={`max-sm:hidden rounded-full shadow-lg border px-3 py-1.5 text-xs font-medium flex items-center gap-1 transition-colors ${
                darkMode
                  ? "bg-slate-800 border-slate-700 text-orange-400 hover:bg-slate-700"
                  : "bg-white border-slate-200/80 text-orange-600 hover:bg-orange-50"
              }`}>
              <Flame size={12} /> Hide heatmap
            </button>
          )}
          {user && (
            <button onClick={() => toggleFavorite(selectedLocation?.id || 0)}
              className={`rounded-full shadow-lg border p-2 transition-colors ${
                darkMode
                  ? "bg-slate-800 border-slate-700 hover:bg-slate-700"
                  : "bg-white border-slate-200/80 hover:bg-slate-50"
              } ${selectedLocation && user.favorites.includes(selectedLocation.id) ? "text-red-500" : "text-slate-400"}`}
              title={selectedLocation && user.favorites.includes(selectedLocation.id) ? "Remove from favorites" : "Add to favorites"}>
              <Heart size={16} fill={selectedLocation && user.favorites.includes(selectedLocation.id) ? "currentColor" : "none"} />
            </button>
          )}

          {user && (
            <button onClick={() => setShowSubmitPlace(true)}
              className={`rounded-full shadow-lg border p-2 sm:px-3 sm:py-1.5 text-xs font-medium flex items-center gap-1 transition-colors ${
                darkMode
                  ? "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700"
                  : "bg-white border-slate-200/80 text-slate-600 hover:bg-slate-50"
              }`}
              title="Add place">
              <Plus size={16} /><span className="max-sm:hidden"> Add place</span>
            </button>
          )}
          {permissionState === "denied" && (
            <button onClick={() => setShowPermissionHint((v) => !v)}
              className={`rounded-full shadow-lg border p-2 sm:px-3 sm:py-1.5 text-xs font-medium flex items-center gap-1 transition-colors ${
                darkMode
                  ? "bg-amber-900/50 border-amber-700 text-amber-400 hover:bg-amber-900/70"
                  : "bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100"
              }`} title="Location blocked - tap for help">
              <Crosshair size={16} /><span className="max-sm:hidden"> Location off</span>
            </button>
          )}
          <button onClick={() => user ? handleLogout() : setShowAuth(true)}
            className={`rounded-full shadow-lg border p-2 sm:px-3 sm:py-1.5 text-xs font-medium flex items-center gap-1 transition-colors ${
              darkMode
                ? "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700"
                : "bg-white border-slate-200/80 text-slate-600 hover:bg-slate-50"
            }`}
            title={user ? user.name : "Sign in"}>
            {user ? <LogIn size={16} /> : <UserPlus size={16} />}
            <span className="max-sm:hidden"> {user ? user.name : "Sign in"}</span>
          </button>
          {isAdmin && (
            <button onClick={() => setShowAdmin(true)}
              className={`max-sm:hidden rounded-full shadow-lg border p-2 transition-colors ${
                darkMode
                  ? "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700"
                  : "bg-white border-slate-200/80 text-slate-600 hover:bg-slate-50"
              }`} title="Admin">
              <Shield size={16} />
            </button>
          )}
          <button onClick={() => setShowTripPlanner(true)}
            className={`rounded-full shadow-lg border px-3 py-1.5 text-xs font-medium flex items-center gap-1 transition-colors ${
              darkMode
                ? "bg-gradient-to-r from-purple-900/60 to-sky-900/60 border-purple-700/50 text-purple-300 hover:from-purple-900/80 hover:to-sky-900/80"
                : "bg-gradient-to-r from-purple-50 to-sky-50 border-purple-200/80 text-purple-700 hover:from-purple-100 hover:to-sky-100"
            }`}
            title="AI Trip Planner">
            <Sparkles size={12} /> Plan trip
          </button>
          <button onClick={() => setShowReportIssue(true)}
            className={`max-sm:hidden rounded-full shadow-lg border px-3 py-1.5 text-xs font-medium flex items-center gap-1 transition-colors ${
              darkMode
                ? "bg-slate-800 border-slate-700 text-amber-400 hover:bg-slate-700"
                : "bg-white border-slate-200/80 text-amber-600 hover:bg-amber-50"
            }`}
            title="Report an issue">
            <AlertTriangle size={12} /> Report
          </button>
          {savedRoutes.length > 0 && (
            <button onClick={() => setShowSavedRoutes(!showSavedRoutes)}
              className={`max-sm:hidden rounded-full shadow-lg border px-3 py-1.5 text-xs font-medium flex items-center gap-1 transition-colors ${
                darkMode
                  ? "bg-slate-800 border-slate-700 text-sky-400 hover:bg-slate-700"
                  : "bg-white border-slate-200/80 text-sky-600 hover:bg-sky-50"
              }`}
              title="Saved routes">
              <Route size={12} /> Routes ({savedRoutes.length})
            </button>
          )}
        </div>

        {/* Bottom sheet */}
        {selectedLocation && (
          <PlaceBottomSheet
            darkMode={darkMode}
            selectedLocation={selectedLocation}
            locations={karnatakaLocations}
            reviews={reviews}
            user={user}
            elevationData={elevationData}
            elevationLoading={elevationLoading}
            showNearby={showNearby}
            nearbyCount={nearbyCount}
            onPrevLocation={plannedPlaces.length > 0 ? handlePrevPlanned : handlePrevLocation}
            onNextLocation={plannedPlaces.length > 0 ? handleNextPlanned : handleNextLocation}
            onClose={handleCloseBottomSheet}
            onToggleFavorite={toggleFavorite}
            onShowReviews={() => setShowReviews(!showReviews)}
            showReviews={showReviews}
            onAddReview={addReview}
            onDeleteReview={deleteReview}
            onToggleNearby={() => setShowNearby(!showNearby)}
            onNearbyPlaces={handleNearbyPlaces}
            onShowAuth={() => setShowAuth(true)}
            onShowStreetView={() => setShowStreetView(true)}
            onShowCollections={() => setShowCollections(true)}
            onShareLocation={handleShareLocation}
            newReview={newReview}
            onNewReviewChange={setNewReview}
            placeReviews={placeReviews}
            onShowEmergencyServices={handleShowEmergencyServices}
          />
        )}

        {/* Emergency Services */}
        <EmergencyServices
          darkMode={darkMode}
          lat={selectedLocation?.lat || 15.3}
          lng={selectedLocation?.lng || 75.7}
          serviceType={showEmergencyServices}
          onClose={handleEmergencyServicesClose}
          onServicesFound={handleEmergencyServicesFound}
        />

        {/* Modals */}
        {showAuth && (
          <AuthModal
            darkMode={darkMode}
            onClose={() => setShowAuth(false)}
            onAuth={handleAuth}
          />
        )}

        {showAdmin && (
          <AdminPanel
            darkMode={darkMode}
            analytics={analytics}
            pendingPlaces={pendingPlaces}
            user={user}
            onClose={() => setShowAdmin(false)}
            onApprove={approvePlace}
            onReject={rejectPlace}
          />
        )}

        {showCollections && user && selectedLocation && (
          <CollectionsModal
            darkMode={darkMode}
            user={user}
            selectedPlaceId={selectedLocation.id}
            onClose={() => setShowCollections(false)}
            onCreateCollection={createCollection}
            onTogglePlace={toggleCollectionPlace}
            onDeleteCollection={deleteCollection}
          />
        )}

        {showSubmitPlace && (
          <SubmitPlaceModal
            darkMode={darkMode}
            form={submitForm}
            onChange={setSubmitForm}
            onClose={() => setShowSubmitPlace(false)}
            onSubmit={handleSubmitPlace}
          />
        )}

        {/* Saved Routes dropdown */}
        {showSavedRoutes && savedRoutes.length > 0 && (
          <div className="absolute top-20 right-4 z-30 max-w-xs w-[90%]"
            style={{ animation: "fadeInUpSmall 0.15s ease-out" }}>
            <div className={`rounded-2xl shadow-xl border overflow-hidden ${
              darkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200"
            }`}>
              <div className={`px-4 py-3 flex items-center justify-between border-b ${
                darkMode ? "border-slate-700" : "border-slate-100"
              }`}>
                <span className={`text-sm font-bold ${darkMode ? "text-slate-200" : "text-slate-800"}`}>
                  Saved Routes
                </span>
                <button onClick={() => setShowSavedRoutes(false)}
                  className={`p-1 rounded-lg ${darkMode ? "hover:bg-slate-700 text-slate-500" : "hover:bg-slate-100 text-slate-400"}`}>
                  <X size={14} />
                </button>
              </div>
              <div className="max-h-64 overflow-y-auto">
                {savedRoutes.map((r) => (
                  <div key={r.id}
                    className={`flex items-center gap-3 px-4 py-3 border-b last:border-0 ${
                      darkMode ? "border-slate-700/50 hover:bg-slate-700" : "border-slate-50 hover:bg-slate-50"
                    }`}>
                    <button onClick={() => handleLoadSavedRoute(r)} className="flex-1 text-left min-w-0">
                      <p className={`text-sm font-semibold truncate ${darkMode ? "text-slate-200" : "text-slate-800"}`}>
                        {r.name}
                      </p>
                      <p className={`text-[10px] ${darkMode ? "text-slate-500" : "text-slate-400"}`}>
                        {r.distance} · {r.duration} · {r.travelMode} · {new Date(r.date).toLocaleDateString()}
                      </p>
                    </button>
                    <button onClick={() => handleDeleteSavedRoute(r.id)}
                      className={`p-1 rounded-lg flex-shrink-0 ${
                        darkMode ? "hover:bg-slate-600 text-slate-500" : "hover:bg-slate-100 text-slate-400"
                      }`}>
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {showStreetView && selectedLocation && (
          <StreetViewModal
            darkMode={darkMode}
            lat={selectedLocation.lat}
            lng={selectedLocation.lng}
            placeName={selectedLocation.name}
            onClose={() => setShowStreetView(false)}
          />
        )}

        {showTripPlanner && (
          <AITripPlannerModal
            darkMode={darkMode}
            onClose={() => setShowTripPlanner(false)}
            locations={karnatakaLocations}
            onPlanTrip={handlePlanTrip}
          />
        )}

        {showReportIssue && (
          <ReportIssueModal
            darkMode={darkMode}
            onClose={() => setShowReportIssue(false)}
            onSubmit={handleSubmitReport}
            lat={selectedLocation?.lat || mapInstance.current?.getCenter()?.lat() || 15.3}
            lng={selectedLocation?.lng || mapInstance.current?.getCenter()?.lng() || 75.7}
          />
        )}

        {/* Global keyframes for animations */}
        <style jsx global>{`
          @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
          @keyframes fadeInUpSmall { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
          @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
          @keyframes slideUp { from { opacity: 0; transform: translateY(100%); } to { opacity: 1; transform: translateY(0); } }
        `}</style>
      </div>
    </div>
  )
}
