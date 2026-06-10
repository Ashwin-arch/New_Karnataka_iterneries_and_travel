"use client"

import { useState, useEffect, useRef, useCallback, useMemo } from "react"
import {
  Loader2, MapIcon, X, Search, LocateFixed, ZoomIn, ZoomOut,
  Sun, Navigation, Star, ChevronLeft, ChevronRight, MapPin,
  Clock, IndianRupee, Info, ExternalLink,
  Mountain, UtensilsCrossed, Heart, LogIn,
  UserPlus, MessageSquare, Plus, Flame, Layers, Trash2, Check,
  Shield, BarChart3, Edit3, Ban, Users,
  Eye, Car, Maximize2,
} from "lucide-react"
import { karnatakaLocations, type KarnatakaLocation } from "@/data/karnataka-locations"
import ImageSlider from "@/components/image-slider"
import NearbyPlaces, { type NearbyPlaceResult } from "@/components/nearby-places"

const CATEGORY_META: Record<string, { label: string; color: string }> = {
  waterfall: { label: "Waterfall", color: "#0ea5e9" },
  beach:     { label: "Beach", color: "#f59e0b" },
  fort:      { label: "Fort", color: "#ef4444" },
  temple:    { label: "Temple", color: "#8b5cf6" },
  backwaters:{ label: "Backwaters", color: "#06b6d4" },
  park:      { label: "Park", color: "#22c55e" },
  hill:      { label: "Hill", color: "#78716c" },
  town:      { label: "Town", color: "#f97316" },
  dargah:    { label: "Dargah", color: "#ec4899" },
  bridge:    { label: "Bridge", color: "#64748b" },
}

const CATEGORY_COLORS: Record<string, string> = Object.fromEntries(
  Object.entries(CATEGORY_META).map(([k, v]) => [k, v.color])
)

const MAP_STYLES: google.maps.MapTypeStyle[] = [
  { featureType: "administrative", elementType: "labels.text.fill", stylers: [{ color: "#444444" }] },
  { featureType: "landscape", elementType: "all", stylers: [{ color: "#f2f2f2" }] },
  { featureType: "poi", elementType: "all", stylers: [{ visibility: "off" }] },
  { featureType: "road", elementType: "all", stylers: [{ saturation: -100 }, { lightness: 45 }] },
  { featureType: "water", elementType: "all", stylers: [{ color: "#dbeafe" }, { visibility: "on" }] },
]

const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

declare global {
  interface Window {
    __googleMapsCallback?: () => void
  }
}

const MAP_TYPES = [
  { id: "roadmap" as const, label: "Map", icon: MapPin },
  { id: "satellite" as const, label: "Satellite", icon: Sun },
  { id: "terrain" as const, label: "Terrain", icon: Mountain },
]

// --- SVG Pin ---
function createPinSVG(color: string, label?: string): string {
  const text = label
    ? `<text x="16" y="21" text-anchor="middle" fill="white" font-size="12" font-weight="bold" font-family="system-ui">${label}</text>`
    : ""
  return `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="42" viewBox="0 0 32 42"><path d="M16 2C8.268 2 2 8.268 2 16c0 8.5 12 23 14 25.5C18 39 30 24.5 30 16c0-7.732-6.268-14-14-14z" fill="${color}" stroke="white" stroke-width="1.5"/><circle cx="16" cy="16" r="6" fill="white" opacity="0.25"/>${text}</svg>`
  )}`
}

// --- Types ---
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
interface PendingPlace {
  name: string
  place: string
  lat: number
  lng: number
  category: string
  description: string
  submittedBy: string
  date: string
}

// --- Helpers ---
function genId() { return Math.random().toString(36).slice(2, 10) }
const LS = {
  get<T>(k: string, def: T): T { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : def } catch { return def } },
  set(k: string, v: unknown) { try { localStorage.setItem(k, JSON.stringify(v)) } catch {} },
}

export default function GoogleKarnatakaMap() {
  // Map state
  const [mapsLoaded, setMapsLoaded] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [selectedLocation, setSelectedLocation] = useState<KarnatakaLocation | null>(null)
  const [showLocations] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [mapType, setMapType] = useState<"roadmap" | "satellite" | "terrain">("roadmap")
  const [nearbyCount, setNearbyCount] = useState(0)
  const [showNearby, setShowNearby] = useState(false)

  // Directions
  const [showDirections, setShowDirections] = useState(false)
  const [routeInfo, setRouteInfo] = useState<{ distance: string; duration: string; mode: string } | null>(null)
  const [directionsMode, setDirectionsMode] = useState<"DRIVING" | "WALKING" | "BICYCLING">("DRIVING")
  const directionsRef = useRef<google.maps.DirectionsRenderer | null>(null)
  const directionsServiceRef = useRef<google.maps.DirectionsService | null>(null)

  // Enhanced directions
  const [waypoints, setWaypoints] = useState<{ lat: number; lng: number; label: string }[]>([])
  const [waypointInput, setWaypointInput] = useState("")
  const [showWaypointsInput, setShowWaypointsInput] = useState(false)
  const [selectedRouteIndex, setSelectedRouteIndex] = useState(0)
  const [allRoutes, setAllRoutes] = useState<google.maps.DirectionsRoute[] | null>(null)
  const [showSteps, setShowSteps] = useState(false)
  const [waypointSuggestions, setWaypointSuggestions] = useState<KarnatakaLocation[]>([])

  // Heatmap
  const [showHeatmap, setShowHeatmap] = useState(false)
  const heatmapRef = useRef<google.maps.visualization.HeatmapLayer | null>(null)

  // Street View
  const [showStreetView, setShowStreetView] = useState(false)
  const streetViewRef = useRef<google.maps.StreetViewPanorama | null>(null)
  const streetViewContainerRef = useRef<HTMLDivElement | null>(null)

  // Traffic
  const [showTraffic, setShowTraffic] = useState(false)
  const trafficRef = useRef<google.maps.TrafficLayer | null>(null)

  // Transit layer
  const [showTransit, setShowTransit] = useState(false)
  const transitRef = useRef<google.maps.TransitLayer | null>(null)

  // Bicycling layer
  const [showBicycling, setShowBicycling] = useState(false)
  const bicyclingRef = useRef<google.maps.BicyclingLayer | null>(null)

  // Fullscreen
  const [isFullscreen, setIsFullscreen] = useState(false)

  // Elevation
  const [elevationData, setElevationData] = useState<number | null>(null)
  const [elevationLoading, setElevationLoading] = useState(false)

  // Geocoder
  const geocoderRef = useRef<google.maps.Geocoder | null>(null)

  // User
  const [user, setUser] = useState<User | null>(() => LS.get<User | null>("user", null))
  const [showAuth, setShowAuth] = useState(false)
  const [authMode, setAuthMode] = useState<"login" | "signup">("login")
  const [authName, setAuthName] = useState("")
  const [authEmail, setAuthEmail] = useState("")
  const [reviews, setReviews] = useState<Review[]>(() => LS.get<Review[]>("reviews", []))
  const [showReviews, setShowReviews] = useState(false)
  const [newReview, setNewReview] = useState({ rating: 5, text: "" })
  const [showFavorites] = useState(false)
  const [showCollections, setShowCollections] = useState(false)
  const [newCollection, setNewCollection] = useState("")

  // Admin
  const [isAdmin] = useState(false)
  const [showAdmin, setShowAdmin] = useState(false)
  const [pendingPlaces, setPendingPlaces] = useState<PendingPlace[]>(() => LS.get<PendingPlace[]>("pending_places", []))
  const [showSubmitPlace, setShowSubmitPlace] = useState(false)
  const [submitForm, setSubmitForm] = useState({ name: "", place: "", lat: "", lng: "", category: "waterfall", description: "" })

  // Recent searches
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

  const CLUSTER_ZOOM = 9
  const searchInputRef = useRef<HTMLInputElement>(null)

  // (persisted state loaded via lazy initializers above)


  // Search
  const filteredLocations = useMemo(() => {
    if (!searchQuery.trim()) return karnatakaLocations
    const q = searchQuery.toLowerCase()
    return karnatakaLocations.filter(
      (l) => l.name.toLowerCase().includes(q) || l.place.toLowerCase().includes(q) ||
        l.category.toLowerCase().includes(q) || l.description.toLowerCase().includes(q)
    )
  }, [searchQuery])

  const sidebarLocations = useMemo(() => {
    if (categoryFilter === "all") return karnatakaLocations
    return karnatakaLocations.filter((l) => l.category === categoryFilter)
  }, [categoryFilter])

  const suggestions = useMemo(() => {
    if (!searchQuery.trim()) return []
    return filteredLocations.slice(0, 5)
  }, [filteredLocations, searchQuery])

  // Markers
  const locationToPinMeta = useCallback((loc: KarnatakaLocation) => {
    const meta = CATEGORY_META[loc.category]
    return { color: meta?.color || "#64748b", label: loc.id.toString() }
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
        icon: { url: createPinSVG(color, label), anchor: new google.maps.Point(16, 40) },
      })
      marker.addListener("click", () => {
        setSelectedLocation(loc)
        setShowNearby(false)
        setShowDirections(false)
        setRouteInfo(null)
        clearNearbyMarkers()
        closeInfoWindow()
      })
      markersRef.current.push(marker)
    })
  }

  function createClusterIcon(count: number): string {
    const size = count > 50 ? 56 : count > 20 ? 48 : 40
    return `data:image/svg+xml,${encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
        <circle cx="${size/2}" cy="${size/2}" r="${size/2 - 2}" fill="#0ea5e9" fill-opacity="0.85" stroke="white" stroke-width="2"/>
        <circle cx="${size/2}" cy="${size/2}" r="${size/2 - 7}" fill="white" fill-opacity="0.2"/>
        <text x="${size/2}" y="${size/2 + 1}" text-anchor="middle" dominant-baseline="middle" fill="white" font-size="${size * 0.38}" font-weight="bold" font-family="system-ui">${count}</text>
      </svg>`
    )}`
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
    setShowDirections(false)
    setRouteInfo(null)
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
        info.setContent(`<div style="font-family:system-ui,sans-serif;max-width:220px;padding:4px"><strong style="font-size:13px;color:#0f172a">${place.name}</strong><p style="margin:4px 0;font-size:11px;color:#64748b">${place.vicinity}</p>${place.rating ? `<p style="margin:2px 0;font-size:11px;color:#f59e0b">★ ${place.rating.toFixed(1)}</p>` : ""}<a href="https://www.google.com/maps/place/?q=place_id:${place.placeId}" target="_blank" style="display:inline-block;margin-top:6px;font-size:11px;color:#0ea5e9">View on Google Maps →</a></div>`)
        info.open(mapInstance.current!, marker)
      })
      nearbyMarkersRef.current.push(marker)
    }
  }

  // Directions
  function handleGetDirections(mode: "DRIVING" | "WALKING" | "BICYCLING") {
    if (!mapInstance.current || !selectedLocation || !navigator.geolocation) return
    setDirectionsMode(mode)
    setShowDirections(true)
    setSelectedRouteIndex(0)
    setAllRoutes(null)
    setShowSteps(false)

    const wp = waypoints.map((w) => ({
      location: new google.maps.LatLng(w.lat, w.lng),
      stopover: true,
    }))

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const origin = { lat: pos.coords.latitude, lng: pos.coords.longitude }
        const dest = { lat: selectedLocation.lat, lng: selectedLocation.lng }

        directionsRef.current?.setMap(null)
        const renderer = new google.maps.DirectionsRenderer({
          map: mapInstance.current!,
          suppressMarkers: true,
          polylineOptions: { strokeColor: "#0ea5e9", strokeWeight: 4 },
          draggable: true,
        })
        directionsRef.current = renderer

        google.maps.event.addListener(renderer, "directions_changed", () => {
          const result = renderer.getDirections()
          if (result) {
            const leg = result.routes[0].legs[0]
            setRouteInfo({ distance: leg.distance?.text || "", duration: leg.duration?.text || "", mode })
            setAllRoutes(result.routes)
          }
        })

        const svc = new google.maps.DirectionsService()
        directionsServiceRef.current = svc
        svc.route(
          {
            origin,
            destination: dest,
            waypoints: wp.length > 0 ? wp : undefined,
            optimizeWaypoints: wp.length > 1,
            provideRouteAlternatives: true,
            travelMode: google.maps.TravelMode[mode as keyof typeof google.maps.TravelMode],
          },
          (result, status) => {
            if (status === "OK" && result) {
              renderer.setDirections(result)
              const leg = result.routes[0].legs[0]
              setRouteInfo({ distance: leg.distance?.text || "", duration: leg.duration?.text || "", mode })
              setAllRoutes(result.routes)
            }
          },
        )
      },
      () => { /* geo failed */ },
      { enableHighAccuracy: true, timeout: 5000 },
    )
  }

  function switchRoute(index: number) {
    if (!directionsRef.current || !allRoutes || !allRoutes[index]) return
    setSelectedRouteIndex(index)
    const result = directionsRef.current.getDirections()
    if (!result) return
    const newResult = {
      ...result,
      routes: [allRoutes[index]],
    }
    directionsRef.current.setDirections(newResult as google.maps.DirectionsResult)
    const leg = allRoutes[index].legs[0]
    setRouteInfo({ distance: leg.distance?.text || "", duration: leg.duration?.text || "", mode: directionsMode })
  }

  function addWaypoint(loc: KarnatakaLocation) {
    setWaypoints((prev) => [...prev, { lat: loc.lat, lng: loc.lng, label: loc.name }])
    setWaypointInput("")
    setWaypointSuggestions([])
    setShowWaypointsInput(false)
  }

  function removeWaypoint(index: number) {
    setWaypoints((prev) => prev.filter((_, i) => i !== index))
  }

  function handleWaypointSearch(query: string) {
    setWaypointInput(query)
    if (!query.trim()) { setWaypointSuggestions([]); return }
    const q = query.toLowerCase()
    const results = karnatakaLocations.filter(
      (l) => l.name.toLowerCase().includes(q) || l.place.toLowerCase().includes(q)
    ).slice(0, 5)
    setWaypointSuggestions(results)
  }

  // Heatmap
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

  // Street View
  function toggleStreetView() {
    if (!selectedLocation || !mapInstance.current) return
    if (showStreetView) {
      setShowStreetView(false)
      return
    }
    setShowStreetView(true)
    requestAnimationFrame(() => {
      if (!streetViewContainerRef.current) return
      const sv = new google.maps.StreetViewPanorama(
        streetViewContainerRef.current,
        {
          position: { lat: selectedLocation.lat, lng: selectedLocation.lng },
          pov: { heading: 0, pitch: 0 },
          zoom: 1,
          addressControl: false,
          motionTracking: false,
          motionTrackingControl: false,
          linksControl: false,
        }
      )
      streetViewRef.current = sv
    })
  }

  function closeStreetView() {
    setShowStreetView(false)
    if (streetViewRef.current) {
      streetViewRef.current.setVisible(false)
      streetViewRef.current = null
    }
  }

  // Traffic
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

  // Transit
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

  // Bicycling
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

  // Fullscreen
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

  // Elevation
  function fetchElevation(lat: number, lng: number) {
    setElevationLoading(true)
    const elevator = new google.maps.ElevationService()
    elevator
      .getElevationForLocations({ locations: [{ lat, lng }] })
      .then(({ results }) => {
        if (results[0]) setElevationData(results[0].elevation)
        setElevationLoading(false)
      })
      .catch(() => setElevationLoading(false))
  }

  // Geocoding search
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
      }
    })
  }

  // Initialize map
  const initMap = useCallback(() => {
    mapsApiLoaded.current = true
    if (!mapRef.current) return
    try {
      const map = new google.maps.Map(mapRef.current, {
        center: { lat: 15.3, lng: 75.7 }, zoom: 7,
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        mapTypeControl: false, streetViewControl: false, fullscreenControl: false, zoomControl: false,
        styles: MAP_STYLES,
      })
      mapInstance.current = map
      infoWindowRef.current = new google.maps.InfoWindow()
      geocoderRef.current = new google.maps.Geocoder()

      map.data.loadGeoJson("/karnataka-GeoJSON.json")
      map.data.setStyle({
        fillColor: "#dbeafe",
        fillOpacity: 0.1,
        strokeColor: "#0ea5e9",
        strokeWeight: 1.5,
      })
      google.maps.event.addListenerOnce(map.data, "addfeature", () => {
        addMarkers(map)
        updateClustering()
        setMapsLoaded(true)
      })
      map.data.addListener("mouseover", (e: google.maps.Data.MouseEvent) => {
        if (e.feature) map.data.overrideStyle(e.feature, { fillOpacity: 0.35, strokeWeight: 2.5 })
      })
      map.data.addListener("mouseout", () => { map.data.revertStyle() })
      map.addListener("zoom_changed", () => updateClustering())
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Failed to initialize map")
    }
  }, [])

  useEffect(() => {
    if (!API_KEY) return
    const existing = document.getElementById("google-maps-script")
    if (existing) { if (window.google?.maps) queueMicrotask(initMap); return }
    const script = document.createElement("script")
    script.id = "google-maps-script"
    script.src = `https://maps.googleapis.com/maps/api/js?key=${API_KEY}&libraries=places,visualization,geometry&callback=__googleMapsCallback`
    script.async = true; script.defer = true
    window.__googleMapsCallback = () => initMap()
    script.onerror = () => setLoadError("Failed to load Google Maps API")
    document.head.appendChild(script)
    return () => { delete window.__googleMapsCallback }
  }, [initMap])

  useEffect(() => {
    if (!mapsLoaded || !mapInstance.current) return
    mapInstance.current.setMapTypeId(google.maps.MapTypeId[mapType.toUpperCase() as keyof typeof google.maps.MapTypeId])
  }, [mapType, mapsLoaded])

  useEffect(() => {
    if (!mapsLoaded) return
    markersRef.current.forEach((m) => m.setMap(showLocations ? mapInstance.current : null))
    clusterMarkersRef.current.forEach((m) => m.setMap(showLocations ? mapInstance.current : null))
  }, [showLocations, mapsLoaded])

  // Clear directions on location change
  useEffect(() => {
    directionsRef.current?.setMap(null)
    directionsRef.current = null
    directionsServiceRef.current = null
    const t1 = setTimeout(() => { setRouteInfo(null); setAllRoutes(null); setShowSteps(false); setSelectedRouteIndex(0) }, 0)
    const t2 = setTimeout(() => setShowDirections(false), 0)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [selectedLocation])

  // Fetch elevation on location change
  useEffect(() => {
    if (!selectedLocation) { const t = setTimeout(() => setElevationData(null), 0); return () => clearTimeout(t) }
    const t1 = setTimeout(() => closeStreetView(), 0)
    const t2 = setTimeout(() => fetchElevation(selectedLocation.lat, selectedLocation.lng), 0)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [selectedLocation])

  // --- Auth ---
  function handleAuth() {
    if (authMode === "signup") {
      if (!authName || !authEmail) return
      const newUser: User = { id: genId(), name: authName, email: authEmail, favorites: [], collections: [] }
      setUser(newUser)
      LS.set("user", newUser)
    } else {
      if (!authEmail) return
      const existing: User = { id: genId(), name: authEmail.split("@")[0], email: authEmail, favorites: [], collections: [] }
      setUser(existing)
      LS.set("user", existing)
    }
    setShowAuth(false)
    setAuthName(""); setAuthEmail("")
  }

  function handleLogout() { setUser(null); LS.set("user", null) }

  // --- Favorites ---
  function toggleFavorite(id: number) {
    if (!user) return
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
  function createCollection() {
    if (!user || !newCollection.trim()) return
    const updated = { ...user, collections: [...user.collections, { name: newCollection.trim(), ids: [] }] }
    setUser(updated)
    LS.set("user", updated)
    setNewCollection("")
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

  // --- Submit Place ---
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
    // Since we can't modify the static data, we add to markers at runtime
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
  }, [locationToPinMeta, pendingPlaces])

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

  // --- Auth Modal ---
  const AuthModal = () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setShowAuth(false)}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-slate-900">{authMode === "login" ? "Sign In" : "Create Account"}</h3>
          <button onClick={() => setShowAuth(false)} className="p-1 hover:bg-slate-100 rounded-lg"><X size={18} /></button>
        </div>
        {authMode === "signup" && (
          <input value={authName} onChange={(e) => setAuthName(e.target.value)} placeholder="Name"
            className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm mb-3 outline-none focus:border-sky-400" />
        )}
        <input value={authEmail} onChange={(e) => setAuthEmail(e.target.value)} placeholder="Email" type="email"
          className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm mb-4 outline-none focus:border-sky-400" />
        <button onClick={handleAuth}
          className="w-full py-2.5 bg-sky-500 hover:bg-sky-600 text-white font-semibold rounded-xl text-sm transition-colors">
          {authMode === "login" ? "Sign In" : "Create Account"}
        </button>
        <p className="text-xs text-slate-500 text-center mt-3">
          {authMode === "login" ? "Don't have an account? " : "Already have an account? "}
          <button onClick={() => setAuthMode(authMode === "login" ? "signup" : "login")} className="text-sky-600 font-medium hover:underline">
            {authMode === "login" ? "Sign up" : "Sign in"}
          </button>
        </p>
      </div>
    </div>
  )

  // --- Admin Panel ---
  const AdminPanel = () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setShowAdmin(false)}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2"><Shield size={20} className="text-sky-500" /> Admin Dashboard</h3>
          <button onClick={() => setShowAdmin(false)} className="p-1 hover:bg-slate-100 rounded-lg"><X size={18} /></button>
        </div>
        <div className="p-6 space-y-6">
          {/* Analytics */}
          <div>
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-1"><BarChart3 size={14} /> Analytics</h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-sky-50 rounded-xl p-3 text-center"><div className="text-2xl font-bold text-sky-700">{analytics.total}</div><div className="text-[10px] text-sky-500">Places</div></div>
              <div className="bg-purple-50 rounded-xl p-3 text-center"><div className="text-2xl font-bold text-purple-700">{analytics.reviews}</div><div className="text-[10px] text-purple-500">Reviews</div></div>
              <div className="bg-green-50 rounded-xl p-3 text-center"><div className="text-2xl font-bold text-green-700">{Object.keys(analytics.categories).length}</div><div className="text-[10px] text-green-500">Categories</div></div>
              <div className="bg-amber-50 rounded-xl p-3 text-center"><div className="text-2xl font-bold text-amber-700">{analytics.users}</div><div className="text-[10px] text-amber-500">Users</div></div>
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {Object.entries(analytics.categories).map(([k, v]) => (
                <span key={k} className="text-[10px] bg-slate-100 px-2 py-0.5 rounded-full text-slate-600">{k}: {v}</span>
              ))}
            </div>
          </div>

          {/* Pending places */}
          <div>
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-1"><Edit3 size={14} /> Pendent Submissions ({pendingPlaces.length})</h4>
            {pendingPlaces.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-4">No pending submissions</p>
            ) : (
              <div className="space-y-2">
                {pendingPlaces.map((p, i) => (
                  <div key={i} className="bg-slate-50 rounded-xl p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-slate-800">{p.name}</p>
                        <p className="text-[10px] text-slate-400">{p.place} · {p.category} · by {p.submittedBy}</p>
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        <button onClick={() => approvePlace(i)} className="p-1.5 bg-green-100 hover:bg-green-200 rounded-lg text-green-700"><Check size={14} /></button>
                        <button onClick={() => rejectPlace(i)} className="p-1.5 bg-red-100 hover:bg-red-200 rounded-lg text-red-700"><Ban size={14} /></button>
                      </div>
                    </div>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">{p.description}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Users (placeholder) */}
          <div>
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-1"><Users size={14} /> Users</h4>
            {user ? (
              <div className="bg-slate-50 rounded-xl p-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-sky-100 flex items-center justify-center text-sky-700 font-bold text-sm">{user.name[0]}</div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">{user.name}</p>
                  <p className="text-xs text-slate-400">{user.email}</p>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-400 text-center py-4">No users registered</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )

  function handleCurrentLocation() {
    if (!mapInstance.current || !navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      (pos) => mapInstance.current?.panTo({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {},
      { enableHighAccuracy: true, timeout: 5000 },
    )
  }

  function getDirectionsUrl(loc: KarnatakaLocation) {
    return `https://www.google.com/maps/dir/?api=1&destination=${loc.lat},${loc.lng}`
  }

  // --- Render ---
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
    <div className="h-screen w-full overflow-hidden bg-slate-100 font-sans relative flex">
      {/* Sidebar toggle */}
      <button onClick={() => setSidebarOpen(!sidebarOpen)}
        className="absolute top-3 left-3 z-30 bg-white rounded-full shadow-lg border border-slate-200/80 p-2 hover:bg-slate-50 transition-colors text-slate-600 md:hidden"
        title={sidebarOpen ? "Hide sidebar" : "Show sidebar"}>
        <Layers size={18} />
      </button>

      {/* Sidebar */}
      <div className={`${sidebarOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0 fixed md:relative inset-y-0 left-0 z-20 max-md:w-[85vw] w-72 bg-white/95 backdrop-blur-md border-r border-slate-200/80 shadow-xl md:shadow-none transition-transform duration-300 flex flex-col`}>
        {/* Sidebar header */}
        <div className="max-md:p-3 p-4 border-b border-slate-100 flex-shrink-0">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="bg-gradient-to-br from-sky-500 to-sky-700 p-1.5 rounded-lg text-white shadow-sm">
                <MapIcon size={18} />
              </div>
              <h2 className="max-md:text-sm text-base font-bold text-slate-900">Hidden Karnataka</h2>
            </div>
            <button onClick={() => setSidebarOpen(false)} className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 md:hidden"><X size={16} /></button>
          </div>
          <div className="flex gap-1.5 flex-wrap">
            <button onClick={() => setCategoryFilter("all")}
              className={`text-[10px] px-2.5 py-1 rounded-full font-medium transition-colors ${categoryFilter === "all" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
              All ({karnatakaLocations.length})
            </button>
            {Object.entries(CATEGORY_META).map(([k, v]) => (
              <button key={k} onClick={() => setCategoryFilter(k)}
                className={`text-[10px] px-2.5 py-1 rounded-full font-medium transition-colors ${categoryFilter === k ? "text-white" : "text-slate-600 bg-slate-100 hover:bg-slate-200"}`}
                style={categoryFilter === k ? { background: v.color } : {}}>
                {v.label} ({karnatakaLocations.filter((l) => l.category === k).length})
              </button>
            ))}
          </div>
        </div>

        {/* Location list */}
        <div className="flex-1 overflow-y-auto">
          {sidebarLocations.map((loc) => {
            const color = CATEGORY_COLORS[loc.category] || "#64748b"
            const isSelected = selectedLocation?.id === loc.id
            return (
              <button key={loc.id} onClick={() => handlePlaceClick(loc)}
                className={`w-full text-left max-md:px-3 max-md:py-2.5 px-4 py-3 flex items-center gap-3 border-b border-slate-50 transition-colors hover:bg-sky-50/50 ${isSelected ? "bg-sky-50 border-l-2 border-l-sky-500" : ""}`}>
                <span className="max-md:w-6 max-md:h-6 w-7 h-7 rounded-full flex items-center justify-center text-white max-md:text-[9px] text-[10px] font-bold flex-shrink-0" style={{ background: color }}>{loc.id}</span>
                <div className="min-w-0 flex-1">
                  <p className="max-md:text-xs text-sm font-semibold text-slate-800 truncate">{loc.name}</p>
                  <p className="max-md:text-[10px] text-[11px] text-slate-400 truncate">{loc.place}</p>
                </div>
                <ChevronRight size={14} className="text-slate-300 flex-shrink-0" />
              </button>
            )
          })}
          {sidebarLocations.length === 0 && (
            <p className="text-xs text-slate-400 text-center py-8">No places found</p>
          )}
        </div>
      </div>

      {/* Map */}
      <div className={`flex-1 relative overflow-hidden transition-all duration-300 ${sidebarOpen ? "md:ml-0" : ""}`}>
        <div ref={mapRef} className="absolute inset-0" />

      {/* Loading */}
      {!mapsLoaded && !loadError && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-100/80 backdrop-blur-sm z-30">
          <div className="flex flex-col items-center gap-3 bg-white/80 p-6 rounded-2xl shadow-xl">
            <Loader2 className="animate-spin text-sky-600" size={36} />
            <p className="text-slate-500 font-medium">Loading Google Map...</p>
          </div>
        </div>
      )}

      {loadError && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-100/80 backdrop-blur-sm z-30">
          <div className="bg-white p-6 rounded-2xl shadow-xl border border-red-100 text-center max-w-md">
            <X className="mx-auto text-red-600 mb-4" size={24} />
            <h3 className="text-lg font-bold text-slate-800 mb-2">Map Error</h3>
            <p className="text-slate-600 text-sm mb-4">{loadError}</p>
            <button onClick={() => window.location.reload()} className="px-4 py-2 bg-slate-900 text-white rounded-xl hover:bg-slate-800 text-sm">Retry</button>
          </div>
        </div>
      )}

      {/* === Search Bar === */}
      <div className="absolute max-md:top-16 top-4 left-3 right-3 z-20 max-w-xl mx-auto">
        <div className="relative">
          <div className="flex items-center bg-white rounded-full shadow-lg border border-slate-200/80 overflow-hidden transition-shadow focus-within:shadow-xl">
            <Search size={18} className="text-slate-400 ml-3 flex-shrink-0" />
            <input ref={searchInputRef} type="text" value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setShowSuggestions(true) }}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && searchQuery.trim()) {
                  e.preventDefault()
                  const match = karnatakaLocations.find((l) =>
                    l.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    l.place.toLowerCase().includes(searchQuery.toLowerCase())
                  )
                  if (match) { handlePlaceClick(match); return }
                  geocodeSearch(searchQuery)
                }
              }}
              placeholder="Search hidden places or address..." autoComplete="off"
              className="flex-1 max-md:px-2 max-md:py-2.5 max-md:text-xs px-3 py-3 text-sm text-slate-800 bg-transparent outline-none placeholder:text-slate-400" />
            {searchQuery && (
              <button onClick={() => { setSearchQuery(""); setShowSuggestions(false) }} className="p-2 mr-1 text-slate-400 hover:text-slate-600"><X size={16} /></button>
            )}
          </div>

          {/* Suggestions */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1.5 bg-white rounded-2xl shadow-xl border border-slate-200/80 overflow-hidden" style={{ animation: "fadeInUpSmall 0.15s ease-out" }}>
              {suggestions.map((loc) => {
                const color = CATEGORY_COLORS[loc.category] || "#64748b"
                return (
                  <button key={loc.id} onMouseDown={() => handlePlaceClick(loc)}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0">
                    <span className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ background: color }}>{loc.id}</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-slate-800 truncate">{loc.name}</p>
                      <p className="text-xs text-slate-400 truncate">{loc.place} · {loc.category}</p>
                    </div>
                    <ChevronLeft size={16} className="text-slate-300 rotate-180 flex-shrink-0" />
                  </button>
                )
              })}
            </div>
          )}

          {/* Recent searches */}
          {showSuggestions && !searchQuery && recentSearches.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1.5 bg-white rounded-2xl shadow-xl border border-slate-200/80 overflow-hidden p-3" style={{ animation: "fadeInUpSmall 0.15s ease-out" }}>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Recent searches</p>
              {recentSearches.map((s) => (
                <button key={s} onMouseDown={() => { setSearchQuery(s); setShowSuggestions(true) }}
                  className="w-full flex items-center gap-2 px-2 py-1.5 text-left text-sm text-slate-600 hover:bg-slate-50 rounded-lg transition-colors">
                  <Clock size={13} className="text-slate-300" /> {s}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* === Right Controls === */}
      <div className="absolute max-md:right-2 max-md:gap-1 right-3 top-1/2 -translate-y-1/2 z-20 flex flex-col gap-1.5">
        <div className="bg-white rounded-xl shadow-lg border border-slate-200/80 overflow-hidden flex flex-col">
          <button onClick={() => mapInstance.current?.setZoom((mapInstance.current.getZoom() || 7) + 1)}
            className="max-md:p-2 p-2.5 hover:bg-slate-50 transition-colors text-slate-600 border-b border-slate-100" title="Zoom in"><ZoomIn size={20} /></button>
          <button onClick={() => mapInstance.current?.setZoom((mapInstance.current.getZoom() || 7) - 1)}
            className="max-md:p-2 p-2.5 hover:bg-slate-50 transition-colors text-slate-600" title="Zoom out"><ZoomOut size={20} /></button>
        </div>

        <button onClick={handleCurrentLocation}
          className="bg-white rounded-xl shadow-lg border border-slate-200/80 max-md:p-2 p-2.5 hover:bg-slate-50 transition-colors text-slate-600" title="Current location">
          <LocateFixed size={18} />
        </button>

        <div className="bg-white rounded-xl shadow-lg border border-slate-200/80 overflow-hidden flex flex-col">
          {MAP_TYPES.map((t) => (
            <button key={t.id} onClick={() => setMapType(t.id)}
              className={`max-md:p-1.5 p-2 transition-colors text-xs font-medium flex flex-col items-center gap-0.5 ${mapType === t.id ? "bg-sky-50 text-sky-600" : "text-slate-500 hover:bg-slate-50"} ${t.id !== "terrain" ? "border-b border-slate-100" : ""}`} title={t.label}>
              <t.icon size={16} /><span className="text-[7px] leading-none">{t.label === "Satellite" ? "Sat" : t.label}</span>
            </button>
          ))}
        </div>

        <button onClick={fitMapBounds}
          className="bg-white rounded-xl shadow-lg border border-slate-200/80 max-md:p-2 p-2.5 hover:bg-slate-50 transition-colors text-slate-600" title="Fit all places">
          <Layers size={18} />
        </button>

        <button onClick={toggleHeatmap}
          className={`bg-white rounded-xl shadow-lg border border-slate-200/80 max-md:p-2 p-2.5 hover:bg-slate-50 transition-colors ${showHeatmap ? "text-orange-500" : "text-slate-600"}`} title="Heatmap">
          <Flame size={18} />
        </button>

        <button onClick={toggleTraffic}
          className={`bg-white rounded-xl shadow-lg border border-slate-200/80 max-md:p-2 p-2.5 hover:bg-slate-50 transition-colors ${showTraffic ? "text-green-500" : "text-slate-600"}`} title="Traffic">
          <Car size={18} />
        </button>

        <button onClick={toggleTransit}
          className={`bg-white rounded-xl shadow-lg border border-slate-200/80 max-md:p-2 p-2.5 hover:bg-slate-50 transition-colors ${showTransit ? "text-purple-500" : "text-slate-600"}`} title="Transit">
          <Navigation size={18} />
        </button>

        <button onClick={toggleBicycling}
          className={`bg-white rounded-xl shadow-lg border border-slate-200/80 max-md:p-2 p-2.5 hover:bg-slate-50 transition-colors ${showBicycling ? "text-emerald-500" : "text-slate-600"}`} title="Bicycling">
          <Mountain size={18} />
        </button>

        <button onClick={toggleFullscreen}
          className={`bg-white rounded-xl shadow-lg border border-slate-200/80 max-md:p-2 p-2.5 hover:bg-slate-50 transition-colors ${isFullscreen ? "text-sky-500" : "text-slate-600"}`} title="Fullscreen">
          <Maximize2 size={18} />
        </button>
      </div>

      {/* === Top bar (user, admin, submit) === */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
        {showHeatmap && (
          <button onClick={removeHeatmap}
            className="bg-white rounded-full shadow-lg border border-slate-200/80 px-3 py-1.5 text-xs font-medium text-orange-600 hover:bg-orange-50 transition-colors flex items-center gap-1">
            <Flame size={12} /> Hide heatmap
          </button>
        )}
        {user && (
          <button onClick={() => toggleFavorite(selectedLocation?.id || 0)}
            className={`bg-white rounded-full shadow-lg border border-slate-200/80 p-2 hover:bg-slate-50 transition-colors ${selectedLocation && user.favorites.includes(selectedLocation.id) ? "text-red-500" : "text-slate-400"}`}
            title={selectedLocation && user.favorites.includes(selectedLocation.id) ? "Remove from favorites" : "Add to favorites"}>
            <Heart size={16} fill={selectedLocation && user.favorites.includes(selectedLocation.id) ? "currentColor" : "none"} />
          </button>
        )}
        {user && (
          <button onClick={() => setShowSubmitPlace(true)}
            className="bg-white rounded-full shadow-lg border border-slate-200/80 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors flex items-center gap-1">
            <Plus size={12} /> Add place
          </button>
        )}
        <button onClick={() => user ? handleLogout() : setShowAuth(true)}
          className="bg-white rounded-full shadow-lg border border-slate-200/80 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors flex items-center gap-1">
          {user ? <LogIn size={12} /> : <UserPlus size={12} />}
          {user ? user.name : "Sign in"}
        </button>
        {isAdmin && (
          <button onClick={() => setShowAdmin(true)}
            className="bg-white rounded-full shadow-lg border border-slate-200/80 p-2 hover:bg-slate-50 transition-colors text-slate-600" title="Admin">
            <Shield size={16} />
          </button>
        )}
      </div>

      {/* === Bottom Sheet === */}
      {selectedLocation && (
        <div className="absolute inset-x-0 bottom-0 z-20 flex flex-col items-center pointer-events-none" style={{ animation: "fadeInUp 0.3s ease-out" }}>
          <div className="pointer-events-auto mb-[-8px] relative z-10">
            <div className="w-10 h-1 rounded-full bg-white/70 shadow-sm" />
          </div>

          <div className="pointer-events-auto w-full max-w-lg bg-white rounded-t-2xl shadow-2xl border-t border-slate-200/80 overflow-hidden transition-all duration-300"
            style={{ maxHeight: "85vh" }}>

            {/* Photos */}
            {selectedLocation.images && selectedLocation.images.length > 0 && (
              <div className="relative flex-shrink-0">
                <ImageSlider images={selectedLocation.images} alt={selectedLocation.name} />
              </div>
            )}

            {/* Content */}
            <div className="overflow-y-auto max-md:p-3 max-md:space-y-3 p-5 space-y-4" style={{ maxHeight: "calc(85vh - 200px)" }}>
              {/* Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <span className="inline-block text-[10px] font-bold text-white px-2 py-0.5 rounded-full uppercase tracking-wider mb-1"
                    style={{ background: CATEGORY_COLORS[selectedLocation.category] || "#64748b" }}>
                    {selectedLocation.category}
                  </span>
                  <h2 className="max-md:text-lg text-xl font-bold text-slate-900 leading-tight">{selectedLocation.name}</h2>
                  <p className="max-md:text-xs text-sm text-slate-500 mt-0.5 flex items-center gap-1"><MapPin size={12} />{selectedLocation.place}</p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button onClick={() => { const idx = karnatakaLocations.findIndex((l) => l.id === selectedLocation.id); const next = karnatakaLocations[(idx + 1) % karnatakaLocations.length]; handlePlaceClick(next) }}
                    className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-400" title="Next">
                    <ChevronRight size={20} />
                  </button>
                  <button onClick={() => { setSelectedLocation(null); clearNearbyMarkers(); closeInfoWindow(); setShowReviews(false); }}
                    className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-400">
                    <X size={20} />
                  </button>
                </div>
              </div>

              {/* Info chips */}
              <div className="flex flex-wrap gap-2">
                {selectedLocation.distanceFromManipal && (
                  <span className="inline-flex items-center gap-1 text-xs text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full"><MapPin size={11} /> {selectedLocation.distanceFromManipal}</span>
                )}
                {selectedLocation.bestTime && (
                  <span className="inline-flex items-center gap-1 text-xs text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full"><Clock size={11} /> {selectedLocation.bestTime}</span>
                )}
                {selectedLocation.entryFee && (
                  <span className="inline-flex items-center gap-1 text-xs text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full"><IndianRupee size={11} /> {selectedLocation.entryFee}</span>
                )}
                {selectedLocation.tips && (
                  <span className="inline-flex items-center gap-1 text-xs text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full"><Info size={11} /> Tips available</span>
                )}
              </div>

              {/* Description */}
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-1.5 flex items-center gap-1"><Info size={13} className="text-sky-500" /> About</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{selectedLocation.description}</p>
              </div>

              {/* Rating */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} size={14} className={s <= 4 ? "text-amber-400 fill-amber-400" : "text-slate-200"} />
                  ))}
                </div>
                <span className="text-xs text-slate-400">4.0 (12 reviews)</span>
              </div>

              {/* Directions */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <button onClick={() => handleGetDirections("DRIVING")}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-medium transition-all ${directionsMode === "DRIVING" && showDirections ? "bg-sky-500 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
                    <Navigation size={13} /> Car
                  </button>
                  <button onClick={() => handleGetDirections("WALKING")}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-medium transition-all ${directionsMode === "WALKING" && showDirections ? "bg-sky-500 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
                    <Navigation size={13} /> Walk
                  </button>
                  <button onClick={() => handleGetDirections("BICYCLING")}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-medium transition-all ${directionsMode === "BICYCLING" && showDirections ? "bg-sky-500 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
                    <Navigation size={13} /> Bike
                  </button>
                </div>

                {routeInfo && (
                  <div className="bg-sky-50 rounded-xl p-3 flex items-center justify-between text-sm" style={{ animation: "fadeInUpSmall 0.2s ease-out" }}>
                    <span className="text-sky-700 font-semibold">{routeInfo.distance} · {routeInfo.duration}</span>
                    <a href={`https://www.google.com/maps/dir/?api=1&destination=${selectedLocation.lat},${selectedLocation.lng}&travelmode=${directionsMode.toLowerCase()}`}
                      target="_blank" rel="noopener noreferrer" className="text-sky-500 hover:text-sky-600 text-xs font-medium">Open in Maps →</a>
                  </div>
                )}

                {/* Waypoints */}
                <div className="mt-2">
                  <div className="flex items-center gap-2 mb-1.5">
                    <button onClick={() => setShowWaypointsInput(!showWaypointsInput)}
                      className={`text-xs font-medium flex items-center gap-1 px-2 py-1 rounded-lg transition-colors ${showWaypointsInput ? "bg-sky-100 text-sky-700" : "text-slate-500 hover:bg-slate-100"}`}>
                      <Plus size={11} /> Add stop
                    </button>
                    {showDirections && (
                      <button onClick={() => setShowSteps(!showSteps)}
                        className={`text-xs font-medium flex items-center gap-1 px-2 py-1 rounded-lg transition-colors ${showSteps ? "bg-sky-100 text-sky-700" : "text-slate-500 hover:bg-slate-100"}`}>
                        <Navigation size={11} /> Steps
                      </button>
                    )}
                  </div>

                  {showWaypointsInput && (
                    <div className="relative mb-2" style={{ animation: "fadeInUpSmall 0.15s ease-out" }}>
                      <input value={waypointInput} onChange={(e) => handleWaypointSearch(e.target.value)}
                        placeholder="Search place to add as stop..." autoComplete="off"
                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl outline-none focus:border-sky-400 bg-slate-50" />
                      {waypointSuggestions.length > 0 && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-lg border border-slate-200/80 overflow-hidden z-10">
                          {waypointSuggestions.map((loc) => (
                            <button key={loc.id} onMouseDown={() => addWaypoint(loc)}
                              className="w-full flex items-center gap-2 px-3 py-2 text-xs text-left hover:bg-slate-50 border-b border-slate-50 last:border-0">
                              <span className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[8px] font-bold flex-shrink-0"
                                style={{ background: CATEGORY_COLORS[loc.category] || "#64748b" }}>{loc.id}</span>
                              <span className="font-medium text-slate-700">{loc.name}</span>
                              <span className="text-slate-400 ml-auto">{loc.place}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {waypoints.length > 0 && (
                    <div className="space-y-1 mb-2">
                      {waypoints.map((wp, i) => (
                        <div key={i} className="flex items-center gap-2 bg-slate-50 rounded-lg px-2.5 py-1.5 text-xs" style={{ animation: "fadeInUpSmall 0.15s ease-out" }}>
                          <MapPin size={11} className="text-sky-500 flex-shrink-0" />
                          <span className="flex-1 text-slate-700 truncate">{wp.label}</span>
                          <button onClick={() => removeWaypoint(i)} className="p-0.5 hover:bg-red-50 rounded text-slate-300 hover:text-red-500 flex-shrink-0"><X size={11} /></button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Route alternatives */}
                {allRoutes && allRoutes.length > 1 && (
                  <div className="mt-1 mb-2">
                    <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-1.5">{allRoutes.length} routes found</div>
                    <div className="flex flex-wrap gap-1">
                      {allRoutes.map((route, i) => {
                        const leg = route.legs[0]
                        const isActive = i === selectedRouteIndex
                        return (
                          <button key={i} onClick={() => switchRoute(i)}
                            className={`text-[10px] px-2 py-1 rounded-lg font-medium transition-colors ${isActive ? "bg-sky-500 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
                            Route {i + 1} · {leg.distance?.text} · {leg.duration?.text}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Step-by-step directions */}
                {showSteps && allRoutes && allRoutes[selectedRouteIndex] && (
                  <div className="mt-2 border-t border-slate-100 pt-2" style={{ animation: "fadeInUpSmall 0.2s ease-out" }}>
                    <h4 className="text-[10px] font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-1">
                      <Navigation size={11} className="text-sky-500" /> Turn-by-turn directions
                    </h4>
                    <div className="space-y-1 max-h-48 overflow-y-auto">
                      {allRoutes[selectedRouteIndex].legs.map((leg, li) => (
                        <div key={li}>
                          {leg.steps.map((step, si) => (
                            <div key={si} className="flex items-start gap-2 py-1.5 border-b border-slate-50 last:border-0">
                              <div className="w-1.5 h-1.5 rounded-full bg-sky-300 mt-1.5 flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <div className="text-xs text-slate-700 leading-snug" dangerouslySetInnerHTML={{ __html: step.instructions }} />
                                <div className="text-[10px] text-slate-400 mt-0.5">
                                  {step.distance?.text} · {step.duration?.text}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Coordinates */}
              <div className="bg-slate-50 rounded-xl p-3 flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-slate-400 uppercase tracking-wider">Coordinates</div>
                  <p className="text-xs font-mono text-slate-700">{selectedLocation.lat.toFixed(5)}, {selectedLocation.lng.toFixed(5)}</p>
                </div>
                <a href={getDirectionsUrl(selectedLocation)} target="_blank" rel="noopener noreferrer"
                  className="text-sky-500 hover:text-sky-600 text-xs font-medium flex items-center gap-1">
                  <ExternalLink size={12} /> Google Maps
                </a>
              </div>

              {/* Elevation */}
              <div className="bg-slate-50 rounded-xl p-3 flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-slate-400 uppercase tracking-wider">Elevation</div>
                  <p className="text-xs font-mono text-slate-700">
                    {elevationLoading ? <span className="text-slate-400">Loading...</span> : elevationData !== null ? `${elevationData.toFixed(0)} m` : "N/A"}
                  </p>
                </div>
                <button onClick={toggleStreetView}
                  className="text-sky-500 hover:text-sky-600 text-xs font-medium flex items-center gap-1">
                  <Eye size={12} /> Street View
                </button>
              </div>

              {selectedLocation.source && <div className="text-[10px] text-slate-400 italic">{selectedLocation.source}</div>}

              {/* Actions */}
              <div className="flex gap-2 pt-1">
                <a href={getDirectionsUrl(selectedLocation)} target="_blank" rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-sky-500 hover:bg-sky-600 text-white font-semibold rounded-xl text-sm transition-colors active:scale-[0.98]">
                  <Navigation size={16} /> Directions
                </a>
                <button onClick={() => setShowReviews(!showReviews)}
                  className="flex items-center justify-center gap-2 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl text-sm transition-colors">
                  <MessageSquare size={16} /> {placeReviews.length}
                </button>
                {(user?.favorites.includes(selectedLocation.id)) ? (
                  <button onClick={() => toggleFavorite(selectedLocation.id)}
                    className="flex items-center justify-center gap-2 py-2.5 px-4 bg-red-50 hover:bg-red-100 text-red-500 font-medium rounded-xl text-sm transition-colors">
                    <Heart size={16} fill="currentColor" />
                  </button>
                ) : (
                  <button onClick={() => toggleFavorite(selectedLocation.id)}
                    className="flex items-center justify-center gap-2 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-500 font-medium rounded-xl text-sm transition-colors">
                    <Heart size={16} />
                  </button>
                )}
              </div>

              {/* Reviews */}
              {showReviews && (
                <div className="space-y-3 border-t border-slate-100 pt-3" style={{ animation: "fadeInUpSmall 0.2s ease-out" }}>
                  <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1">
                    <MessageSquare size={13} className="text-sky-500" /> Reviews ({placeReviews.length})
                  </h3>
                  {user ? (
                    <div className="bg-slate-50 rounded-xl p-3 space-y-2">
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <button key={s} onClick={() => setNewReview({ ...newReview, rating: s })}>
                            <Star size={16} className={s <= newReview.rating ? "text-amber-400 fill-amber-400" : "text-slate-300"} />
                          </button>
                        ))}
                      </div>
                      <textarea value={newReview.text} onChange={(e) => setNewReview({ ...newReview, text: e.target.value })}
                        placeholder="Write a review..." rows={2}
                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl outline-none focus:border-sky-400 resize-none" />
                      <button onClick={addReview} disabled={!newReview.text.trim()}
                        className="px-4 py-1.5 bg-sky-500 hover:bg-sky-600 disabled:bg-slate-200 disabled:text-slate-400 text-white text-xs font-semibold rounded-xl transition-colors">
                        Post
                      </button>
                    </div>
                  ) : (
                    <button onClick={() => setShowAuth(true)} className="text-xs text-sky-500 hover:underline">Sign in to leave a review</button>
                  )}
                  {placeReviews.map((r) => (
                    <div key={r.id} className="bg-slate-50 rounded-xl p-3">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-slate-800">{r.userName}</span>
                          <div className="flex items-center gap-0.5">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <Star key={s} size={10} className={s <= r.rating ? "text-amber-400 fill-amber-400" : "text-slate-200"} />
                            ))}
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] text-slate-400">{r.date}</span>
                          {user?.id === r.userId && (
                            <button onClick={() => deleteReview(r.id)} className="p-0.5 hover:bg-red-50 rounded text-slate-300 hover:text-red-500"><Trash2 size={11} /></button>
                          )}
                        </div>
                      </div>
                      <p className="text-xs text-slate-600">{r.text}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Nearby places */}
              <div className="border-t border-slate-100 pt-3">
                <div className="flex items-center gap-2 mb-3">
                  <button onClick={() => setShowNearby(!showNearby)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${showNearby ? "bg-sky-100 text-sky-700" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
                    <UtensilsCrossed size={12} /> Nearby {nearbyCount > 0 && <span className="opacity-70">({nearbyCount})</span>}
                  </button>
                </div>
                {showNearby && (
                  <NearbyPlaces lat={selectedLocation.lat} lng={selectedLocation.lng} onPlacesChange={handleNearbyPlaces} />
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Collections overlay */}
      {showCollections && user && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setShowCollections(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-900">Collections</h3>
              <button onClick={() => setShowCollections(false)} className="p-1 hover:bg-slate-100 rounded-lg"><X size={18} /></button>
            </div>
            <div className="flex gap-2 mb-3">
              <input value={newCollection} onChange={(e) => setNewCollection(e.target.value)} placeholder="New collection name"
                className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-xl outline-none focus:border-sky-400" />
              <button onClick={createCollection} disabled={!newCollection.trim()}
                className="px-3 py-2 bg-sky-500 hover:bg-sky-600 disabled:bg-slate-200 text-white rounded-xl transition-colors"><Plus size={16} /></button>
            </div>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {user.collections.length === 0 && <p className="text-xs text-slate-400 text-center py-4">No collections yet</p>}
              {user.collections.map((col, i) => (
                <div key={i} className="bg-slate-50 rounded-xl p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-semibold text-slate-800">{col.name}</span>
                    <button onClick={() => deleteCollection(i)} className="p-0.5 hover:bg-red-50 rounded text-slate-300 hover:text-red-500"><Trash2 size={12} /></button>
                  </div>
                  <p className="text-[10px] text-slate-400">{col.ids.length} places</p>
                  {selectedLocation && (
                    <button onClick={() => toggleCollectionPlace(i, selectedLocation.id)}
                      className={`mt-1 text-xs font-medium ${col.ids.includes(selectedLocation.id) ? "text-sky-600" : "text-slate-500 hover:text-sky-600"}`}>
                      {col.ids.includes(selectedLocation.id) ? "✓ Added" : "+ Add current place"}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Submit place */}
      {showSubmitPlace && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setShowSubmitPlace(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-900">Submit a Place</h3>
              <button onClick={() => setShowSubmitPlace(false)} className="p-1 hover:bg-slate-100 rounded-lg"><X size={18} /></button>
            </div>
            <div className="space-y-3">
              <input value={submitForm.name} onChange={(e) => setSubmitForm({ ...submitForm, name: e.target.value })} placeholder="Place name"
                className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl outline-none focus:border-sky-400" />
              <input value={submitForm.place} onChange={(e) => setSubmitForm({ ...submitForm, place: e.target.value })} placeholder="Location (e.g. Udupi, Karnataka)"
                className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl outline-none focus:border-sky-400" />
              <div className="flex gap-2">
                <input value={submitForm.lat} onChange={(e) => setSubmitForm({ ...submitForm, lat: e.target.value })} placeholder="Latitude" type="number" step="any"
                  className="flex-1 px-3 py-2.5 text-sm border border-slate-200 rounded-xl outline-none focus:border-sky-400" />
                <input value={submitForm.lng} onChange={(e) => setSubmitForm({ ...submitForm, lng: e.target.value })} placeholder="Longitude" type="number" step="any"
                  className="flex-1 px-3 py-2.5 text-sm border border-slate-200 rounded-xl outline-none focus:border-sky-400" />
              </div>
              <select value={submitForm.category} onChange={(e) => setSubmitForm({ ...submitForm, category: e.target.value })}
                className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl outline-none focus:border-sky-400 bg-white">
                {Object.entries(CATEGORY_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
              <textarea value={submitForm.description} onChange={(e) => setSubmitForm({ ...submitForm, description: e.target.value })} placeholder="Description" rows={3}
                className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl outline-none focus:border-sky-400 resize-none" />
              <button onClick={handleSubmitPlace} disabled={!submitForm.name || !submitForm.place}
                className="w-full py-2.5 bg-sky-500 hover:bg-sky-600 disabled:bg-slate-200 disabled:text-slate-400 text-white font-semibold rounded-xl text-sm transition-colors">
                Submit for Review
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Auth Modal */}
      {showAuth && AuthModal()}

      {/* Admin Panel */}
      {showAdmin && AdminPanel()}

      {/* Collections button in bottom sheet */}
      {user && selectedLocation && (
        <button onClick={() => setShowCollections(true)}
          className="absolute bottom-4 left-4 z-10 bg-white rounded-full shadow-lg border border-slate-200/80 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors flex items-center gap-1">
          <Layers size={12} /> Collections
        </button>
      )}

      {/* Street View Modal */}
      {showStreetView && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" style={{ animation: "fadeIn 0.2s ease-out" }}>
          <div className="bg-white rounded-2xl overflow-hidden shadow-2xl w-full max-w-3xl max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-3 border-b border-slate-100">
              <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                <Eye size={16} className="text-sky-500" />
                Street View — {selectedLocation?.name}
              </h3>
              <button onClick={closeStreetView}
                className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors text-slate-400 hover:text-slate-600">
                <X size={16} />
              </button>
            </div>
            <div ref={streetViewContainerRef} className="flex-1 min-h-[400px] w-full" />
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeInUpSmall { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      `}</style>
    </div>
    </div>
  )
}
