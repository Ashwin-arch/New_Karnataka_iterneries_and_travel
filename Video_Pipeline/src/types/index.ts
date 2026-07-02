export type Role = "EXPLORER" | "CREATOR" | "ADMIN";
export type VideoStatus = "PENDING" | "APPROVED" | "REJECTED";
export type Category =
  | "NATURE" | "HERITAGE" | "FOOD" | "TREKKING" | "WATERFALL"
  | "CULTURE" | "HIDDEN_GEM" | "TEMPLE" | "BEACH" | "WILDLIFE";

export interface IUser {
  _id: string;
  fullName: string;
  email: string;
  role: Role;
  profileImage?: string;
  bio?: string;
  district?: string;
  isVerified: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface IVideo {
  _id: string;
  title: string;
  description: string;
  category: Category;
  tags: string[];
  placeName: string;
  district: string;
  latitude?: number;
  longitude?: number;
  videoUrl: string;
  thumbnailUrl?: string;
  cloudinaryPublicId: string;
  creatorId: IUser | string;
  status: VideoStatus;
  rejectionReason?: string;
  views: number;
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  savesCount: number;
  distanceKm?: number; // injected client-side
  createdAt: string;
  updatedAt: string;
}

export interface IItinerary {
  _id: string;
  userId: string;
  title: string;
  description?: string;
  places: IItineraryPlace[];
  isShared: boolean;
  shareToken?: string;
  createdAt: string;
  updatedAt: string;
}

export interface IItineraryPlace {
  videoId: string;
  placeName: string;
  district: string;
  thumbnailUrl?: string;
  addedAt: string;
  notes?: string;
}

export interface ISavedVideo {
  _id: string;
  userId: string;
  videoId: IVideo | string;
  createdAt: string;
}

export interface AuthUser {
  id: string;
  fullName: string;
  email: string;
  role: Role;
  profileImage?: string;
  district?: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface TravelMode {
  mode: "walk" | "bike" | "car" | "public";
  label: string;
  icon: string;
  speedKmh: number;
}

export const TRAVEL_MODES: TravelMode[] = [
  { mode: "walk", label: "Walk", icon: "🚶", speedKmh: 5 },
  { mode: "bike", label: "Bike", icon: "🏍", speedKmh: 30 },
  { mode: "car", label: "Drive", icon: "🚗", speedKmh: 60 },
  { mode: "public", label: "Bus", icon: "🚌", speedKmh: 25 },
];
