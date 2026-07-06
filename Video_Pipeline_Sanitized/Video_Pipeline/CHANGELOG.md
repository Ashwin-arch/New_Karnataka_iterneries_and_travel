# Changelog

## V1.1 — Full Explorer UI + Cloudinary + Live Features

### New pages
- `/explore` — ROAM feed with For you / Nearby / Following tabs, filter panel, radius slider
- `/place/[id]` — Full place detail: video player, travel mode selector, save, share, directions, add to trip
- `/itineraries` — Full trip management: create, delete, share toggle, saved places tab, place thumbnails
- `/map` — Placeholder (V2 Leaflet map)
- `/saved` — Working saved videos list

### Updated pages
- `/` (Home) — Radius slider (5–300 km), mood filter chips, hidden gems cards, trending (by saves), curated collections, stories, Explorer spotlight
- `/explore` — Full infinite scroll feed with IntersectionObserver autoplay
- `/upload` — Migrated to Cloudinary signed upload with real progress bar
- `/profile` — Creator: video tabs with status, rejection reason, upload CTA. Explorer: full menu
- `/search` — Category grid, district pills, search results with navigation

### New APIs
- `POST /api/videos/save` — toggle save (adds/removes SavedVideo, updates savesCount)
- `GET /api/videos/save` — check if a video is saved
- `GET /api/videos/saved` — list all saved videos for current user
- `GET/POST /api/itineraries` — list and create itineraries
- `GET/PUT/DELETE /api/itineraries/[id]` — get, update (title, share toggle), delete
- `POST/DELETE /api/itineraries/[id]/places` — add/remove places from trip
- `POST /api/upload/sign` — Cloudinary signed upload params

### New models
- `Itinerary` — userId, title, description, places[], isShared, shareToken
- `SavedVideo` — userId, videoId (unique compound index)

### New components
- `AddToItinerarySheet` — bottom sheet: list trips, create new, add place with one tap
- `VideoCard` — distance display, travel mode selector (walk/bike/car/bus), working save/share/add-to-trip
- `BottomNav` — FAB Map button in centre, role-aware (Upload tab for creators only)

### Migration: Firebase → Cloudinary
- `src/lib/cloudinary/upload.ts` — XHR upload with progress, signed via server
- `POST /api/upload/sign` — generates Cloudinary signature server-side
- `.env.local` updated with Cloudinary vars
