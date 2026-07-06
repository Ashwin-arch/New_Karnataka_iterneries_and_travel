"use client"

import { useState, useEffect, useRef, useCallback, useMemo } from "react"
import { motion } from "framer-motion"
import { 
  Loader2, MapIcon, X, Heart, Star, Plus, UserPlus, LogIn, Flame, Shield, 
  Share2, Mic, RefreshCw, Crosshair, Sparkles, AlertTriangle, Route,
  UtensilsCrossed, Hotel, Compass, Landmark, Bus, Pill, CreditCard, 
  Menu, Smartphone, Clock, MapPin, Search, ChevronRight, Edit,
  CloudSun, Car, ArrowUpDown, ChevronLeft, Calendar, Eye, Navigation, MessageSquare,
  Home as HomeIcon, Briefcase, IndianRupee, Mountain, LocateFixed
} from "lucide-react"
import { karnatakaLocations } from "@/data/karnataka-locations"
import type { KarnatakaLocation, Review, User, PendingPlace, MapTypeId, SavedRoute, Report, EmergencyService, EmergencyServiceType } from "@/lib/types"
import { MAP_STYLES, MAP_STYLES_DARK, API_KEY, CLUSTER_ZOOM, CATEGORY_COLORS } from "@/lib/constants"
import { createPinSVG, createClusterIcon, genId, LS } from "@/lib/map-utils"
import type { NearbyPlaceResult } from "@/components/nearby-places"
import ImageSlider from "@/components/image-slider"
const TOP_CATEGORIES = [
  { key: "restaurant", label: "Restaurants", icon: UtensilsCrossed, type: "restaurant" },
  { key: "hotel", label: "Hotels", icon: Hotel, type: "lodging" },
  { key: "things_to_do", label: "Things to do", icon: Compass, type: "tourist_attraction" },
  { key: "museum", label: "Museums", icon: Landmark, type: "museum" },
  { key: "transit", label: "Transit", icon: Bus, type: "transit_station" },
  { key: "pharmacy", label: "Pharmacies", icon: Pill, type: "pharmacy" },
  { key: "atm", label: "ATMs", icon: CreditCard, type: "atm" },
]

const RECENT_MAPS_HISTORY = [
  {
    name: "Deepa Complex",
    address: "Papareddipalya, Nagarbhavi, Bengaluru, Karnataka",
    lat: 12.9644,
    lng: 77.5061,
  },
  {
    name: "Manipal Academy of Higher Education",
    address: "Govindapura, BSF Campus, Yelahanka, Bengaluru, Karnataka",
    lat: 13.1009,
    lng: 77.5963,
  },
  {
    name: "NES office",
    address: "NES Office Road, Suggappa Layout, Yelahanka, Bengaluru, Karnataka",
    lat: 13.1009,
    lng: 77.5963,
  }
]

import MapControls from "@/components/map/map-controls"
import SearchBar from "@/components/map/search-bar"
import PlaceBottomSheet from "@/components/map/place-bottom-sheet"
import AuthModal from "@/components/modal/auth-modal"
import AdminPanel from "@/components/modal/admin-panel"
import CollectionsModal from "@/components/modal/collections-modal"
import SubmitPlaceModal from "@/components/modal/submit-place-modal"
import StreetViewModal from "@/components/modal/street-view-modal"
import AITripPlannerModal, { TripPlanResult } from "@/components/modal/ai-trip-planner-modal"
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
  const [anonFavorites, setAnonFavorites] = useState<number[]>(() => LS.get<number[]>("anon_favorites", []))
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
  const [mobilePanelOpen, setMobilePanelOpen] = useState(false)


  // --- Category Nearby Search (Google Maps Pills) ---
  const [activeCategorySearch, setActiveCategorySearch] = useState<string | null>(null)
  const [categorySearchResults, setCategorySearchResults] = useState<any[]>([])
  const [categorySearchLoading, setCategorySearchLoading] = useState(false)

  // Mouse drag scroll state for momentum scrolling
  const pillsContainerRef = useRef<HTMLDivElement>(null)
  const isDownRef = useRef(false)
  const startXRef = useRef(0)
  const scrollLeftRef = useRef(0)
  const lastXRef = useRef(0)
  const lastTimeRef = useRef(0)
  const velocityRef = useRef(0)
  const animationFrameIdRef = useRef<number | null>(null)

  const handlePillsMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!pillsContainerRef.current) return
    isDownRef.current = true
    startXRef.current = e.pageX - pillsContainerRef.current.offsetLeft
    scrollLeftRef.current = pillsContainerRef.current.scrollLeft
    lastXRef.current = e.pageX
    lastTimeRef.current = Date.now()
    velocityRef.current = 0
    if (animationFrameIdRef.current) {
      cancelAnimationFrame(animationFrameIdRef.current)
    }
  }

  const handlePillsMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDownRef.current || !pillsContainerRef.current) return
    e.preventDefault()
    const x = e.pageX - pillsContainerRef.current.offsetLeft
    const walk = (x - startXRef.current) * 1.5
    pillsContainerRef.current.scrollLeft = scrollLeftRef.current - walk

    const now = Date.now()
    const dt = now - lastTimeRef.current
    const dx = e.pageX - lastXRef.current
    if (dt > 0) {
      velocityRef.current = dx / dt
    }
    lastXRef.current = e.pageX
    lastTimeRef.current = now
  }

  const handlePillsMouseUpOrLeave = () => {
    isDownRef.current = false
    if (Math.abs(velocityRef.current) > 0.1) {
      let vel = velocityRef.current * 12
      const container = pillsContainerRef.current
      const step = () => {
        if (!container || isDownRef.current || Math.abs(vel) < 0.15) return
        container.scrollLeft -= vel
        vel *= 0.94
        animationFrameIdRef.current = requestAnimationFrame(step)
      }
      animationFrameIdRef.current = requestAnimationFrame(step)
    }
  }

  const handlePillsWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (!pillsContainerRef.current) return
    // Mouse wheel horizontal scroll support
    if (e.deltaY !== 0) {
      pillsContainerRef.current.scrollLeft += e.deltaY * 0.8
    }
  }


  const searchCategoryNearby = useCallback((categoryType: string, label: string) => {
    if (!mapInstance.current) return
    
    // Clear previous results
    clearNearbyMarkers()
    closeInfoWindow()
    
    const center = mapInstance.current.getCenter()
    if (!center) return

    setCategorySearchLoading(true)
    setActiveCategorySearch(label)
    
    const dummy = document.createElement("div")
    const service = new google.maps.places.PlacesService(dummy)
    
    service.nearbySearch(
      {
        location: center,
        radius: 5000,
        type: categoryType,
      },
      (results, status) => {
        setCategorySearchLoading(false)
        if (status === google.maps.places.PlacesServiceStatus.OK && results) {
          const mapped = results.slice(0, 10).map((p) => ({
            name: p.name || "",
            vicinity: p.vicinity || "",
            rating: p.rating,
            lat: p.geometry?.location?.lat() || 0,
            lng: p.geometry?.location?.lng() || 0,
            placeId: p.place_id || "",
            type: categoryType,
          }))
          setCategorySearchResults(mapped)
          
          // Draw markers
          const info = new google.maps.InfoWindow()
          const color = categoryType === "restaurant" ? "#f97316" : categoryType === "lodging" ? "#8b5cf6" : "#0ea5e9"
          
          results.slice(0, 10).forEach((place, i) => {
            const marker = new google.maps.Marker({
              position: { lat: place.geometry?.location?.lat() || 0, lng: place.geometry?.location?.lng() || 0 },
              map: mapInstance.current,
              title: place.name,
              icon: {
                path: google.maps.SymbolPath.CIRCLE,
                scale: 10,
                fillColor: color,
                fillOpacity: 1,
                strokeColor: "#fff",
                strokeWeight: 2
              },
              label: { text: String(i + 1), color: "#fff", fontSize: "11px", fontWeight: "bold" },
            })
            
            marker.addListener("click", () => {
              info.setContent(`<div style="font-family:system-ui,sans-serif;max-width:220px;padding:4px">
                <strong style="font-size:13px;color:#0f172a">${place.name}</strong>
                <p style="margin:4px 0;font-size:11px;color:#64748b">${place.vicinity}</p>
                ${place.rating ? `<p style="margin:2px 0;font-size:11px;color:#f59e0b">★ ${place.rating.toFixed(1)}</p>` : ""}
              </div>`)
              info.open(mapInstance.current!, marker)
            })
            
            nearbyMarkersRef.current.push(marker)
          })
          
          setSidebarOpen(true)
        } else {
          setCategorySearchResults([])
          setGpsError(`No ${label.toLowerCase()} found nearby.`)
          setTimeout(() => setGpsError(null), 3000)
        }
      }
    )
  }, [])

  const handleClearCategorySearch = useCallback(() => {
    setActiveCategorySearch(null)
    setCategorySearchResults([])
    clearNearbyMarkers()
    closeInfoWindow()
  }, [])

  const handleRecentHistoryClick = useCallback((item: typeof RECENT_MAPS_HISTORY[0]) => {
    if (!mapInstance.current) return
    mapInstance.current.panTo({ lat: item.lat, lng: item.lng })
    mapInstance.current.setZoom(15)
    
    // Add a temp marker
    clearNearbyMarkers()
    const marker = new google.maps.Marker({
      position: { lat: item.lat, lng: item.lng },
      map: mapInstance.current,
      title: item.name,
      animation: google.maps.Animation.DROP,
    })
    nearbyMarkersRef.current.push(marker)
    setSearchQuery(item.name)
  }, [])

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
        animation: google.maps.Animation.DROP,
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
        mapId: "DEMO_MAP_ID",
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
  function handlePlanTrip(plan: TripPlanResult) {
    setShowTripPlanner(false)
    const places = [
      { name: plan.startName, lat: plan.startLat, lng: plan.startLng, category: "Start" },
      ...plan.pois.map((poi) => ({
        name: poi.name,
        lat: poi.lat,
        lng: poi.lng,
        category: poi.type || "Nearby Service",
      })),
      { name: plan.destName, lat: plan.destLat, lng: plan.destLng, category: "Destination" },
    ]
    setPlannedPlaces(places)
    if (places.length > 0) {
      const first = places[0]
      const match = karnatakaLocations.find((l) => l.name === first.name)
      if (match) handlePlaceClick(match)
      else {
        setSearchQuery(first.name)
        geocodeSearch(first.name)
      }
      const names = places.map((p) => p.name).join(" → ")
      setGpsError(`Trip planned! ${places.length} stop${places.length > 1 ? "s" : ""}: ${names}`)
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
    if (!user) {
      const favs = anonFavorites.includes(id) ? anonFavorites.filter((f) => f !== id) : [...anonFavorites, id]
      setAnonFavorites(favs)
      LS.set("anon_favorites", favs)
      return
    }
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

  // --- Mobile drawer: ESC + body scroll lock ---
  useEffect(() => {
    if (mobilePanelOpen) {
      document.body.style.overflow = "hidden"
      const handleKey = (e: KeyboardEvent) => {
        if (e.key === "Escape") setMobilePanelOpen(false)
      }
      window.addEventListener("keydown", handleKey)
      return () => {
        document.body.style.overflow = ""
        window.removeEventListener("keydown", handleKey)
      }
    }
    return () => { document.body.style.overflow = "" }
  }, [mobilePanelOpen])

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

  const sharedSidebarContent = (
    <>
      {/* Search Bar container inside the sidebar */}
      <div className={`p-4 border-b ${darkMode ? "border-slate-800 bg-slate-950" : "border-slate-100 bg-slate-50"} flex-shrink-0`}>
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
          className="w-full relative top-0 left-0 translate-x-0"
        />
      </div>

      {/* Sidebar Body */}
      <div className="flex-1 overflow-y-auto flex flex-col">
        {selectedLocation ? (
          <div className="flex-1 flex flex-col">
            {/* Cover Image & Image Slider */}
            <div className="relative h-48 w-full bg-slate-205 dark:bg-slate-800 overflow-hidden flex-shrink-0">
              {selectedLocation.images && selectedLocation.images.length > 0 ? (
                <ImageSlider images={selectedLocation.images} alt={selectedLocation.name} />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-400">
                  <MapIcon size={40} className="opacity-40" />
                </div>
              )}
            </div>

            {/* Title & Rating */}
            <div className="p-5 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-xl font-bold">{selectedLocation.name}</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
                <MapPin size={14} className="text-sky-500" />
                {selectedLocation.place}
              </p>
              <div className="flex items-center gap-1.5 mt-2">
                <span className="text-sm font-semibold bg-sky-50 dark:bg-sky-950 text-sky-600 dark:text-sky-400 px-2 py-0.5 rounded text-xs capitalize">
                  {selectedLocation.category}
                </span>
                <div className="flex items-center gap-0.5 text-amber-500 text-xs font-medium ml-2">
                  <Star size={14} className="fill-current" />
                  <span>4.8 (120 reviews)</span>
                </div>
              </div>
            </div>

            {/* Quick Actions Grid */}
            <div className="grid grid-cols-4 gap-1 p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
              <button onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${selectedLocation.lat},${selectedLocation.lng}`, "_blank")}
                className="flex flex-col items-center gap-1 p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-sky-600 dark:text-sky-400">
                <Navigation size={18} className="fill-current animate-pulse" />
                <span className="text-[10px] font-semibold text-center">Directions</span>
              </button>
              <button onClick={() => toggleFavorite(selectedLocation.id)}
                className={`flex flex-col items-center gap-1 p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${
                  (user ? user.favorites.includes(selectedLocation.id) : anonFavorites.includes(selectedLocation.id)) ? "text-red-500" : "text-slate-500"
                }`}>
                <Heart size={18} className={(user ? user.favorites.includes(selectedLocation.id) : anonFavorites.includes(selectedLocation.id)) ? "fill-current" : ""} />
                <span className="text-[10px] font-semibold text-center">Save</span>
              </button>
              <button onClick={() => setShowNearby(!showNearby)}
                className="flex flex-col items-center gap-1 p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-500">
                <LocateFixed size={18} />
                <span className="text-[10px] font-semibold text-center">Nearby</span>
              </button>
              <button onClick={handleShareLocation}
                className="flex flex-col items-center gap-1 p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-500">
                <Share2 size={18} />
                <span className="text-[10px] font-semibold text-center">Share</span>
              </button>
            </div>

            {/* Description & Details */}
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 space-y-4">
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">About this place</h4>
                <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">{selectedLocation.description}</p>
              </div>
              {selectedLocation.bestTime && (
                <div className="flex items-start gap-2.5 text-sm text-slate-600 dark:text-slate-300">
                  <Clock size={16} className="text-slate-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-semibold block text-xs text-slate-400 uppercase">Best Time to Visit</span>
                    <span>{selectedLocation.bestTime}</span>
                  </div>
                </div>
              )}
              {selectedLocation.entryFee && (
                <div className="flex items-start gap-2.5 text-sm text-slate-600 dark:text-slate-300">
                  <IndianRupee size={16} className="text-slate-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-semibold block text-xs text-slate-400 uppercase">Entry Fee</span>
                    <span>{selectedLocation.entryFee}</span>
                  </div>
                </div>
              )}
              {selectedLocation.distanceFromManipal && (
                <div className="flex items-start gap-2.5 text-sm text-slate-600 dark:text-slate-300">
                  <Route size={16} className="text-slate-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-semibold block text-xs text-slate-400 uppercase">Distance from Manipal</span>
                    <span>{selectedLocation.distanceFromManipal}</span>
                  </div>
                </div>
              )}
              {elevationData !== null && (
                <div className="flex items-start gap-2.5 text-sm text-slate-600 dark:text-slate-300">
                  <Mountain size={16} className="text-slate-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-semibold block text-xs text-slate-400 uppercase">Elevation</span>
                    <span>{Math.round(elevationData)} meters above sea level</span>
                  </div>
                </div>
              )}
            </div>

            {/* Emergency Services */}
            <div className="p-5 border-b border-slate-100 dark:border-slate-800">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Emergency Services</h4>
              <div className="flex gap-2">
                <button onClick={() => handleShowEmergencyServices("hospital")}
                  className="flex-1 px-3 py-2 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 rounded-xl text-xs font-semibold hover:bg-red-100 transition-colors flex items-center justify-center gap-1.5 border border-red-100 dark:border-red-900/30">
                  <Shield size={14} /> Hospital
                </button>
                <button onClick={() => handleShowEmergencyServices("police")}
                  className="flex-1 px-3 py-2 bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 rounded-xl text-xs font-semibold hover:bg-blue-100 transition-colors flex items-center justify-center gap-1.5 border border-blue-100 dark:border-blue-900/30">
                  <Shield size={14} /> Police
                </button>
              </div>
            </div>

            {/* Reviews section inside sidebar */}
            <div className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-bold">Reviews ({placeReviews.length})</h4>
                <button onClick={() => setShowReviews(!showReviews)}
                  className="text-xs text-sky-600 dark:text-sky-400 font-semibold hover:underline">
                  {showReviews ? "Hide Reviews" : "Write Review"}
                </button>
              </div>

              {showReviews && (
                <div className="mb-4 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl border border-slate-100 dark:border-slate-850">
                  <p className="text-xs font-bold mb-2">Write your review</p>
                  <div className="flex gap-1 mb-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button key={star} onClick={() => setNewReview({ ...newReview, rating: star })}
                        className={`text-base ${newReview.rating >= star ? "text-amber-400" : "text-slate-300"}`}>
                        ★
                      </button>
                    ))}
                  </div>
                  <textarea value={newReview.text} onChange={(e) => setNewReview({ ...newReview, text: e.target.value })}
                    placeholder="Share your experience..." className="w-full text-xs p-2 border border-slate-200 dark:border-slate-700 rounded-xl outline-none bg-transparent" rows={3} />
                  <button onClick={addReview}
                    className="mt-2 w-full py-1.5 bg-sky-600 text-white rounded-lg text-xs font-bold hover:bg-sky-500 transition-colors">
                    Submit Review
                  </button>
                </div>
              )}

              <div className="space-y-3">
                {placeReviews.map((rev) => (
                  <div key={rev.id} className="text-xs border-b border-slate-50 dark:border-slate-855 pb-3 last:border-b-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold">{rev.userName}</span>
                      <span className="text-[10px] text-slate-400">{rev.date}</span>
                    </div>
                    <div className="text-amber-500 mb-1">{"★".repeat(rev.rating)}</div>
                    <p className="text-slate-600 dark:text-slate-300 leading-relaxed">{rev.text}</p>
                  </div>
                ))}
                {placeReviews.length === 0 && (
                  <p className="text-xs text-center text-slate-400 py-4">No reviews yet. Be the first to add one!</p>
                )}
              </div>
            </div>
          </div>
        ) : activeCategorySearch ? (
          /* Case 2: Category Search Results */
          <div className="flex-1 flex flex-col">
            <div className="p-4 bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold">Nearby {activeCategorySearch}</h3>
                <p className="text-xs text-slate-400 mt-0.5">{categorySearchResults.length} results found</p>
              </div>
              <button onClick={handleClearCategorySearch}
                className="px-2.5 py-1 bg-slate-250 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg text-xs font-semibold transition-colors">
                Clear
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {categorySearchResults.map((place, i) => (
                <div key={place.placeId} onClick={() => {
                  if (mapInstance.current) {
                    mapInstance.current.panTo({ lat: place.lat, lng: place.lng })
                    mapInstance.current.setZoom(16)
                  }
                }} className={`p-3.5 rounded-2xl border ${
                  darkMode ? "bg-slate-800/50 border-slate-700 hover:bg-slate-800" : "bg-white border-slate-100 hover:bg-slate-50"
                } shadow-sm cursor-pointer transition-colors flex gap-3`}>
                  <span className="w-6 h-6 rounded-full bg-sky-600 text-white flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-sm font-bold truncate">{place.name}</h4>
                    <p className="text-xs text-slate-500 truncate mt-0.5">{place.vicinity}</p>
                    {place.rating && (
                      <p className="text-[10px] text-amber-500 font-medium mt-1 flex items-center gap-0.5">
                        ★ {place.rating.toFixed(1)}
                      </p>
                    )}
                  </div>
                </div>
              ))}
              {categorySearchLoading && (
                <div className="flex flex-col items-center justify-center py-12 gap-2 text-slate-400">
                  <Loader2 size={24} className="animate-spin text-sky-500" />
                  <span className="text-xs">Searching...</span>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Case 3: Default List (Work, Home, Recents, and Weather/Traffic Card) */
          <div className="flex-1 flex flex-col justify-between">
            <div>
              {/* Work & Home Shortcuts */}
              <div className={`border-b ${darkMode ? "border-slate-800" : "border-slate-100"}`}>
                {/* Work */}
                <div className={`flex items-center justify-between px-5 py-4 border-b ${
                  darkMode ? "border-slate-800/50" : "border-slate-55"
                }`}>
                  <div className="flex items-start gap-3.5 min-w-0">
                    <div className={`p-2 rounded-xl ${darkMode ? "bg-slate-800 text-sky-400" : "bg-sky-50 text-sky-600"}`}>
                      <Briefcase size={16} />
                    </div>
                    <div className="min-w-0">
                      <span className="font-semibold block text-sm">Work</span>
                      <span className="text-xs text-slate-400 truncate block">Anegudde, Karnataka</span>
                    </div>
                  </div>
                  <button className="text-xs font-semibold text-sky-600 dark:text-sky-400 hover:underline">
                    Edit
                  </button>
                </div>
                {/* Home */}
                <div className="flex items-center justify-between px-5 py-4">
                  <div className="flex items-start gap-3.5 min-w-0">
                    <div className={`p-2 rounded-xl ${darkMode ? "bg-slate-800 text-sky-400" : "bg-sky-50 text-sky-600"}`}>
                      <HomeIcon size={16} />
                    </div>
                    <div className="min-w-0">
                      <span className="font-semibold block text-sm">Home</span>
                      <span className="text-xs text-slate-400 truncate block text-sky-500 cursor-pointer hover:underline">
                        Set location
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent History List */}
              <div className="p-5">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Recent history</h4>
                <div className="space-y-4">
                  {RECENT_MAPS_HISTORY.map((item, idx) => (
                    <button key={idx} onClick={() => handleRecentHistoryClick(item)}
                      className="w-full flex items-start gap-3.5 text-left group">
                      <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex-shrink-0 group-hover:bg-sky-50 group-hover:text-sky-600 dark:group-hover:bg-sky-955 transition-colors">
                        <Clock size={16} />
                      </div>
                      <div className="min-w-0 flex-1 border-b border-slate-50 dark:border-slate-800/50 pb-3">
                        <span className="font-semibold text-sm block group-hover:text-sky-600 transition-colors truncate">
                          {item.name}
                        </span>
                        <span className="text-xs text-slate-400 truncate block mt-0.5">
                          {item.address}
                        </span>
                        {idx === 1 && (
                          <span className="text-[10px] text-emerald-500 font-medium block mt-1">Open · Closes 5 pm</span>
                        )}
                        {idx === 2 && (
                          <span className="text-[10px] text-emerald-500 font-medium block mt-1">Open · Closes 9 pm</span>
                        )}
                      </div>
                    </button>
                  ))}
                  <button className="w-full py-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-semibold text-slate-500 dark:text-slate-300 hover:bg-slate-200 transition-colors text-center mt-2">
                    More from recent history
                  </button>
                </div>
              </div>
            </div>

            {/* Weather & Traffic Card at the bottom of the sidebar */}
            <div className="p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex-shrink-0">
              <button onClick={toggleTraffic} className="w-full text-left bg-white dark:bg-slate-850 rounded-2xl p-4 border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow flex items-start justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-sm text-slate-800 dark:text-slate-100">Nagarbhavi</span>
                    <span className="text-sm font-semibold text-slate-500">26°</span>
                    <CloudSun size={16} className="text-yellow-500" />
                  </div>
                  <div className="flex items-center gap-2 text-xs font-medium text-red-500">
                    <Car size={14} className="fill-current animate-bounce" />
                    <span>Heavy traffic in this area</span>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-none">Slower than usual · Click to toggle traffic layer</p>
                </div>
                <ChevronRight size={16} className="text-slate-300 mt-1" />
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  )

  return (
    <div className={`h-screen w-full overflow-hidden font-sans relative flex ${
      darkMode ? "bg-slate-900" : "bg-slate-100"
    }`}>

      {/* Desktop Dual Sidebar Panel (Left Navigation Rail + Main Search/Details Panel) */}
      <div className="hidden md:flex flex-row h-full z-20 flex-shrink-0">
        {/* Left Navigation Rail */}
        <div className={`w-16 h-full flex flex-col items-center justify-between border-r ${
          darkMode ? "bg-slate-950 border-slate-800 text-slate-400" : "bg-slate-100 border-slate-200 text-slate-500"
        } py-4`}>
          <div className="flex flex-col items-center gap-6 w-full">
            <button onClick={() => setSidebarOpen(!sidebarOpen)}
              className={`p-2 rounded-xl transition-colors ${darkMode ? "hover:bg-slate-800 text-slate-200" : "hover:bg-slate-200 text-slate-800"}`}>
              <Menu size={20} />
            </button>
            
            <button onClick={() => setShowTripPlanner(true)}
              className="group relative flex flex-col items-center gap-1 w-full py-1 text-center">
              <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 text-white shadow-md transform transition-transform group-hover:scale-110">
                <Sparkles size={18} />
              </div>
              <span className="text-[9px] font-medium mt-1">Ask Maps</span>
            </button>

            <button onClick={() => {
              if (!user) setShowAuth(true)
              else setShowCollections(true)
            }} className="group flex flex-col items-center gap-1 w-full py-1 text-center hover:text-sky-500 transition-colors">
              <Heart size={18} className={user?.favorites.length ? "fill-red-500 text-red-500" : ""} />
              <span className="text-[9px] font-medium mt-1">Saved</span>
            </button>

            <button onClick={() => setShowSavedRoutes(!showSavedRoutes)}
              className="group flex flex-col items-center gap-1 w-full py-1 text-center hover:text-sky-500 transition-colors">
              <Clock size={18} />
              <span className="text-[9px] font-medium mt-1">Recents</span>
            </button>

            <div className={`w-10 h-px ${darkMode ? "bg-slate-800" : "bg-slate-200"} my-1`} />
            
            <button onClick={() => {
              setSearchQuery("Bengaluru")
              geocodeSearch("Bengaluru")
            }} className="flex flex-col items-center gap-1 w-full py-1 text-center hover:text-sky-500 transition-colors">
              <div className={`w-8 h-8 rounded-lg ${darkMode ? "bg-slate-800" : "bg-slate-200"} flex items-center justify-center text-xs font-bold`}>
                BLR
              </div>
              <span className="text-[9px] font-medium">Bengaluru</span>
            </button>

            <button onClick={() => {
              setSearchQuery("Udupi")
              geocodeSearch("Udupi")
            }} className="flex flex-col items-center gap-1 w-full py-1 text-center hover:text-sky-500 transition-colors">
              <div className={`w-8 h-8 rounded-lg ${darkMode ? "bg-slate-800" : "bg-slate-200"} flex items-center justify-center text-xs font-bold`}>
                UD
              </div>
              <span className="text-[9px] font-medium">Udupi</span>
            </button>
          </div>

          <div className="flex flex-col items-center gap-4 w-full">
            <button onClick={() => setDarkMode(!darkMode)}
              className={`p-2 rounded-xl transition-colors ${darkMode ? "hover:bg-slate-800 text-yellow-400" : "hover:bg-slate-200 text-slate-600"}`}>
              <CloudSun size={20} />
            </button>
            <button className="flex flex-col items-center gap-1 w-full py-1 text-center hover:text-sky-500 transition-colors">
              <Smartphone size={18} />
              <span className="text-[9px] font-medium">Get app</span>
            </button>
          </div>
        </div>

        {/* Desktop Sidebar Panel */}
        {sidebarOpen && (
          <div className={`w-96 h-full flex flex-col border-r ${
            darkMode ? "bg-slate-900 border-slate-800 text-slate-200" : "bg-white border-slate-200 text-slate-800"
          } shadow-xl relative z-10 overflow-hidden`}>
          <div className="w-96 h-full flex flex-col flex-shrink-0">
            {sharedSidebarContent}
          </div>
        </div>
        )}
      </div>

      {/* Mobile drawer: hamburger trigger + slide-in panel */}
      <div className="md:hidden">
        {/* Hamburger trigger — fixed above everything, toggles open/close */}
        <button
          onClick={() => setMobilePanelOpen(prev => !prev)}
          aria-label={mobilePanelOpen ? "Close sidebar" : "Open sidebar"}
          className="fixed top-3 left-3 z-[60] rounded-full bg-white p-2.5 shadow-lg dark:bg-[#1e1e2e]"
        >
          {mobilePanelOpen ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-700 dark:text-gray-300">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-700 dark:text-gray-300">
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          )}
        </button>

        {/* Overlay */}
        {mobilePanelOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
            onClick={() => setMobilePanelOpen(false)}
          />
        )}

        {/* Drawer — exact same layout as desktop */}
        <div
          className={`fixed left-0 top-0 z-50 h-full w-[85vw] bg-white dark:bg-slate-900 shadow-2xl transition-transform duration-[250ms] ease-out ${
            mobilePanelOpen ? 'translate-x-0' : '-translate-x-full'
          } ${mobilePanelOpen ? '' : 'pointer-events-none'}`}
        >
          <div className="h-full flex flex-row">
            {/* Mobile nav rail — identical to desktop */}
            <div className={`w-16 h-full flex flex-col items-center justify-between border-r ${
              darkMode ? "bg-slate-950 border-slate-800 text-slate-400" : "bg-slate-100 border-slate-200 text-slate-500"
            } py-4 flex-shrink-0`}>
              <div className="flex flex-col items-center gap-6 w-full">
                <button onClick={() => setSidebarOpen(!sidebarOpen)}
                  className={`p-2 rounded-xl transition-colors ${darkMode ? "hover:bg-slate-800 text-slate-200" : "hover:bg-slate-200 text-slate-800"}`}>
                  <Menu size={20} />
                </button>
                <button onClick={() => setShowTripPlanner(true)}
                  className="group relative flex flex-col items-center gap-1 w-full py-1 text-center">
                  <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 text-white shadow-md transform transition-transform group-hover:scale-110">
                    <Sparkles size={18} />
                  </div>
                  <span className="text-[9px] font-medium mt-1">Ask Maps</span>
                </button>
                <button onClick={() => { if (!user) setShowAuth(true); else setShowCollections(true) }}
                  className="group flex flex-col items-center gap-1 w-full py-1 text-center hover:text-sky-500 transition-colors">
                  <Heart size={18} className={user?.favorites.length ? "fill-red-500 text-red-500" : ""} />
                  <span className="text-[9px] font-medium mt-1">Saved</span>
                </button>
                <button onClick={() => setShowSavedRoutes(!showSavedRoutes)}
                  className="group flex flex-col items-center gap-1 w-full py-1 text-center hover:text-sky-500 transition-colors">
                  <Clock size={18} />
                  <span className="text-[9px] font-medium mt-1">Recents</span>
                </button>
                <div className={`w-10 h-px ${darkMode ? "bg-slate-800" : "bg-slate-200"} my-1`} />
                <button onClick={() => { setSearchQuery("Bengaluru"); geocodeSearch("Bengaluru") }}
                  className="flex flex-col items-center gap-1 w-full py-1 text-center hover:text-sky-500 transition-colors">
                  <div className={`w-8 h-8 rounded-lg ${darkMode ? "bg-slate-800" : "bg-slate-200"} flex items-center justify-center text-xs font-bold`}>BLR</div>
                  <span className="text-[9px] font-medium">Bengaluru</span>
                </button>
                <button onClick={() => { setSearchQuery("Udupi"); geocodeSearch("Udupi") }}
                  className="flex flex-col items-center gap-1 w-full py-1 text-center hover:text-sky-500 transition-colors">
                  <div className={`w-8 h-8 rounded-lg ${darkMode ? "bg-slate-800" : "bg-slate-200"} flex items-center justify-center text-xs font-bold`}>UD</div>
                  <span className="text-[9px] font-medium">Udupi</span>
                </button>
              </div>
              <div className="flex flex-col items-center gap-4 w-full">
                <button onClick={() => setDarkMode(!darkMode)}
                  className={`p-2 rounded-xl transition-colors ${darkMode ? "hover:bg-slate-800 text-yellow-400" : "hover:bg-slate-200 text-slate-600"}`}>
                  <CloudSun size={20} />
                </button>
                <button className="flex flex-col items-center gap-1 w-full py-1 text-center hover:text-sky-500 transition-colors">
                  <Smartphone size={18} />
                  <span className="text-[9px] font-medium">Get app</span>
                </button>
              </div>
            </div>
            {/* Mobile sidebar panel — responsive width */}
            {sidebarOpen && (
              <div className={`flex-1 min-w-0 h-full flex flex-col border-r ${
                darkMode ? "bg-slate-900 border-slate-800 text-slate-200" : "bg-white border-slate-200 text-slate-800"
              } shadow-xl relative z-10 overflow-hidden`}>
                <div className="h-full flex flex-col flex-shrink-0">
                  {sharedSidebarContent}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Map container */}
      <div className={`flex-1 relative overflow-hidden`}>
        <div ref={mapRef} className="absolute inset-0" />

        {/* Horizontal Category Pills */}
        <div 
          ref={pillsContainerRef}
          onMouseDown={handlePillsMouseDown}
          onMouseMove={handlePillsMouseMove}
          onMouseUp={handlePillsMouseUpOrLeave}
          onMouseLeave={handlePillsMouseUpOrLeave}
          onWheel={handlePillsWheel}
          className="category-pills-container absolute max-md:top-28 top-4 left-4 z-20 flex gap-2 max-w-[calc(100vw-2rem)] md:max-w-[60vw] pb-2 pr-12 select-none"
        >
          {TOP_CATEGORIES.map((cat, index) => {
            const Icon = cat.icon
            const active = activeCategorySearch === cat.label
            return (
              <motion.button
                key={cat.key}
                onClick={() => searchCategoryNearby(cat.type, cat.label)}
                initial={{ opacity: 0 }}
                animate={{ 
                  opacity: 1,
                  backgroundColor: active 
                    ? "#0284c7" 
                    : darkMode ? "#1e293b" : "#ffffff",
                  color: active 
                    ? "#ffffff" 
                    : darkMode ? "#e2e8f0" : "#334155",
                  borderColor: active
                    ? "#0284c7"
                    : darkMode ? "#334155" : "#e2e8f0",
                }}
                transition={{ duration: 0.2, ease: "easeInOut" }}
                whileHover={{ 
                  y: -1, 
                  boxShadow: darkMode 
                    ? "0 4px 12px rgba(0,0,0,0.4)" 
                    : "0 4px 12px rgba(0,0,0,0.1)",
                }}
                whileTap={{ scale: 0.96 }}
                className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold shadow-md border cursor-pointer select-none`}
              >
                <motion.span
                  animate={{ scale: active ? 1.05 : 1 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center justify-center flex-shrink-0"
                >
                  <Icon size={12} className={active ? "text-white" : darkMode ? "text-sky-400" : "text-sky-600"} />
                </motion.span>
                <span>{cat.label}</span>
              </motion.button>
            )
          })}
        </div>

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

        {/* Mobile Search bar */}
        <div className="md:hidden">
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
        </div>

        {/* Map controls */}
        <MapControls
          mapType={mapType}
          onMapTypeChange={setMapType}
          onCurrentLocation={handleCurrentLocation}
          onFitBounds={fitMapBounds}
          onZoomIn={() => {
            if (mapInstance.current) {
              const currentZoom = mapInstance.current.getZoom()
              if (currentZoom !== undefined) {
                mapInstance.current.setZoom(currentZoom + 1)
              }
            }
          }}
          onZoomOut={() => {
            if (mapInstance.current) {
              const currentZoom = mapInstance.current.getZoom()
              if (currentZoom !== undefined) {
                mapInstance.current.setZoom(currentZoom - 1)
              }
            }
          }}
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
          {selectedLocation && (
            <button onClick={() => toggleFavorite(selectedLocation.id)}
              className={`rounded-full shadow-lg border p-2 transition-colors ${
                darkMode
                  ? "bg-slate-800 border-slate-700 hover:bg-slate-700"
                  : "bg-white border-slate-200/80 hover:bg-slate-50"
              } ${(user ? user.favorites.includes(selectedLocation.id) : anonFavorites.includes(selectedLocation.id)) ? "text-red-500" : "text-slate-400"}`}
              title={(user ? user.favorites.includes(selectedLocation.id) : anonFavorites.includes(selectedLocation.id)) ? "Remove from favorites" : "Add to favorites"}>
              <Heart size={16} fill={(user ? user.favorites.includes(selectedLocation.id) : anonFavorites.includes(selectedLocation.id)) ? "currentColor" : "none"} />
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
          <button onClick={() => setShowReportIssue(true)}
            className={`max-sm:hidden rounded-full shadow-lg border p-2 transition-colors ${
              darkMode
                ? "bg-slate-800 border-slate-700 text-amber-400 hover:bg-slate-700"
                : "bg-white border-slate-200/80 text-amber-600 hover:bg-amber-50"
            }`}
            title="Report an issue">
            <AlertTriangle size={16} />
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
            isFavorite={user ? user.favorites.includes(selectedLocation.id) : anonFavorites.includes(selectedLocation.id)}
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
