import { MapPin, Sun, Mountain } from "lucide-react"
import type { MapTypeId } from "./types"

export const CATEGORY_META: Record<string, { label: string; color: string }> = {
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
  camping:   { label: "Camping", color: "#059669" },
  adventure: { label: "Adventure", color: "#d97706" },
  heritage:  { label: "Heritage", color: "#7c3aed" },
  nature:    { label: "Nature Trail", color: "#65a30d" },
  trekking:  { label: "Trekking", color: "#0891b2" },
  wildlife:  { label: "Wildlife", color: "#16a34a" },
}

export const CATEGORY_COLORS: Record<string, string> = Object.fromEntries(
  Object.entries(CATEGORY_META).map(([k, v]) => [k, v.color])
)

export const MAP_STYLES: google.maps.MapTypeStyle[] = [
  { featureType: "administrative", elementType: "labels.text.fill", stylers: [{ color: "#444444" }] },
  { featureType: "landscape", elementType: "all", stylers: [{ color: "#f2f2f2" }] },
  { featureType: "poi", elementType: "all", stylers: [{ visibility: "off" }] },
  { featureType: "road", elementType: "all", stylers: [{ saturation: -100 }, { lightness: 45 }] },
  { featureType: "water", elementType: "all", stylers: [{ color: "#dbeafe" }, { visibility: "on" }] },
]

export const MAP_STYLES_DARK: google.maps.MapTypeStyle[] = [
  { featureType: "all", elementType: "geometry", stylers: [{ color: "#242f3e" }] },
  { featureType: "all", elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
  { featureType: "all", elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
  { featureType: "administrative", elementType: "geometry", stylers: [{ color: "#373f4f" }] },
  { featureType: "administrative", elementType: "labels.text.fill", stylers: [{ color: "#8b929a" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#38414e" }] },
  { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#212a37" }] },
  { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#9ca5b3" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#17263c" }] },
  { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#515c6d" }] },
  { featureType: "poi", elementType: "all", stylers: [{ visibility: "off" }],
  },
]

export const MAP_TYPES: { id: MapTypeId; label: string; icon: typeof MapPin }[] = [
  { id: "roadmap", label: "Map", icon: MapPin },
  { id: "satellite", label: "Satellite", icon: Sun },
  { id: "terrain", label: "Terrain", icon: Mountain },
]

export const CLUSTER_ZOOM = 9
export const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
