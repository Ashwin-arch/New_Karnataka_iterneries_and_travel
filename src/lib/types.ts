import type { KarnatakaLocation } from "@/data/karnataka-locations"
export type { KarnatakaLocation }

export interface Review {
  id: string
  userId: string
  userName: string
  placeId: number
  rating: number
  text: string
  date: string
}

export interface User {
  id: string
  name: string
  email: string
  favorites: number[]
  collections: { name: string; ids: number[] }[]
}

export interface PendingPlace {
  name: string
  place: string
  lat: number
  lng: number
  category: string
  description: string
  submittedBy: string
  date: string
}

export type TravelMode = "DRIVING" | "WALKING" | "BICYCLING" | "TRANSIT"
export type MapTypeId = "roadmap" | "satellite" | "terrain"

export interface RouteOptions {
  avoidTolls: boolean
  avoidHighways: boolean
  avoidFerries: boolean
}

export interface SavedRoute {
  id: string
  name: string
  origin: string
  destination: string
  destinationLat: number
  destinationLng: number
  travelMode: TravelMode
  distance: string
  duration: string
  date: string
}

export interface Report {
  id: string
  userId: string
  userName: string
  type: "traffic" | "road_closure" | "accident" | "issue" | "other"
  lat: number
  lng: number
  description: string
  date: string
}

export interface TripPlan {
  id: string
  name: string
  preferences: string[]
  duration_hours: number
  places: { name: string; lat: number; lng: number; category: string }[]
}

export interface NavigationStep {
  instruction: string
  distance: string
  distanceMeters: number
  duration: string
  durationSeconds: number
  maneuver: string
  roadName: string
  lat: number
  lng: number
  stepIndex: number
}

export interface NavigationStatus {
  remainingDistance: string
  remainingDistanceMeters: number
  remainingDuration: string
  remainingDurationSeconds: number
  currentStepIndex: number
  totalSteps: number
  nextStep: NavigationStep | null
  speed: number | null
  destinationName: string
  destinationLat: number
  destinationLng: number
}

export type EmergencyServiceType = "hospital" | "police" | "fire_station"

export interface EmergencyService {
  id: string
  name: string
  vicinity: string
  type: EmergencyServiceType
  lat: number
  lng: number
  rating?: number
  phone?: string
}
