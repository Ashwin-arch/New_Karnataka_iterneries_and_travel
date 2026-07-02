# Incredible Karnataka — V1 MVP

> Hyperlocal short-form video discovery platform for authentic places, hidden gems, food trails and cultural stories across Karnataka.

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Tech Stack](#tech-stack)
3. [Project Structure](#project-structure)
4. [How Everything Works](#how-everything-works)
5. [User Roles & Personas](#user-roles--personas)
6. [Authentication Flow](#authentication-flow)
7. [Video Upload Flow](#video-upload-flow)
8. [API Reference](#api-reference)
9. [Database Schema](#database-schema)
10. [Environment Variables](#environment-variables)
11. [Getting Started](#getting-started)
12. [Creating an Admin Account](#creating-an-admin-account)
13. [Folder-by-Folder Explanation](#folder-by-folder-explanation)
14. [What is UI-only in V1](#what-is-ui-only-in-v1)
15. [V2 Roadmap](#v2-roadmap)

---

## Project Overview

Incredible Karnataka is a **mobile-first** video discovery app where:

- **Explorers** browse a vertical reel feed of approved Karnataka place videos
- **Creators** upload documentary-style videos tied to real places in Karnataka
- **Admins** moderate uploaded content before it goes live in the feed

The entire app renders inside a **430px mobile container** — even on desktop. No sidebars. No desktop layouts. Pure mobile experience.

---

## Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| Framework | Next.js 15+ (App Router) | Full stack React framework |
| Language | TypeScript | Type-safe codebase |
| Styling | Tailwind CSS v4 | Utility-first dark theme |
| Database | MongoDB Atlas + Mongoose | Document store for users and videos |
| Auth | JWT + HTTP-Only Cookie | Stateless auth, secure cookie storage |
| Media Storage | Firebase Storage | Video file hosting and CDN delivery |
| Icons | Lucide React | Icon library |
| UI Primitives | Radix UI | Accessible headless components |
| Deployment | Vercel (frontend) + any Node host | Cloud deploy |

---

## Project Structure

```
video/
├── src/
│   ├── app/                          # Next.js App Router pages + API routes
│   │   ├── layout.tsx                # Root layout — wraps everything in AuthProvider + mobile div
│   │   ├── globals.css               # Dark theme CSS + mobile container + skeleton animation
│   │   ├── page.tsx                  # / → Home feed (infinite scroll reels)
│   │   ├── login/
│   │   │   └── page.tsx              # /login
│   │   ├── signup/
│   │   │   └── page.tsx              # /signup — with role picker (Explorer / Creator)
│   │   ├── upload/
│   │   │   └── page.tsx              # /upload — Creator only, 4-step upload flow
│   │   ├── search/
│   │   │   └── page.tsx              # /search — filter by category + district
│   │   ├── saved/
│   │   │   └── page.tsx              # /saved — V1 placeholder, V2 full implementation
│   │   ├── profile/
│   │   │   └── page.tsx              # /profile — Explorer menu OR Creator video dashboard
│   │   ├── admin/
│   │   │   ├── layout.tsx            # Admin shell — top bar + bottom nav (admin only)
│   │   │   ├── page.tsx              # /admin — stats overview + alert for pending videos
│   │   │   └── videos/
│   │   │       └── page.tsx          # /admin/videos — full moderation queue
│   │   └── api/
│   │       ├── auth/
│   │       │   ├── signup/route.ts   # POST /api/auth/signup
│   │       │   ├── login/route.ts    # POST /api/auth/login
│   │       │   ├── logout/route.ts   # POST /api/auth/logout
│   │       │   └── me/route.ts       # GET  /api/auth/me
│   │       ├── videos/
│   │       │   ├── route.ts          # GET /api/videos (feed) | POST /api/videos (save metadata)
│   │       │   ├── [id]/route.ts     # GET /api/videos/:id | DELETE /api/videos/:id
│   │       │   └── my-videos/route.ts# GET /api/videos/my-videos (creator only)
│   │       └── admin/
│   │           └── videos/
│   │               ├── route.ts          # GET /api/admin/videos?status=PENDING
│   │               └── [id]/
│   │                   ├── route.ts      # DELETE /api/admin/videos/:id
│   │                   ├── approve/route.ts  # PATCH approve
│   │                   └── reject/route.ts   # PATCH reject (requires reason)
│   │
│   ├── components/
│   │   ├── layout/
│   │   │   └── BottomNav.tsx         # 5-tab bottom nav (Upload tab only for Creators)
│   │   └── ui/
│   │       └── Toast.tsx             # In-app toast notifications component
│   │
│   ├── features/
│   │   ├── auth/
│   │   │   └── AuthContext.tsx       # React context — user state, login(), logout(), refresh()
│   │   └── feed/
│   │       └── VideoCard.tsx         # Full-screen video card — autoplay, mute, actions
│   │
│   ├── hooks/
│   │   └── useToast.ts               # useToast() hook — success/error/info toasts
│   │
│   ├── lib/
│   │   ├── auth/
│   │   │   └── jwt.ts                # signToken, verifyToken, getAuthUser, setAuthCookie
│   │   ├── db/
│   │   │   └── connect.ts            # MongoDB connection with global cache (no reconnect on hot reload)
│   │   ├── firebase/
│   │   │   ├── config.ts             # Firebase app initialisation
│   │   │   └── upload.ts             # uploadVideo(), deleteVideo(), generateVideoPath()
│   │   └── utils/
│   │       └── index.ts              # cn(), formatCount(), formatDate(), apiSuccess(), apiError()
│   │
│   ├── models/
│   │   ├── User.ts                   # Mongoose User model — bcrypt pre-save, comparePassword
│   │   └── Video.ts                  # Mongoose Video model — indexes on status, creatorId, district
│   │
│   ├── types/
│   │   └── index.ts                  # IUser, IVideo, AuthUser, ApiResponse, PaginatedResponse
│   │
│   ├── constants/
│   │   └── index.ts                  # CATEGORIES, KARNATAKA_DISTRICTS, VIDEO_STATUS, limits
│   │
│   ├── validations/
│   │   └── index.ts                  # validateSignup(), validateLogin(), validateVideoUpload()
│   │
│   └── middleware.ts                 # Next.js middleware — route guards for creator/admin/auth
│
├── .env.local                        # Environment variables (DO NOT COMMIT)
├── next.config.ts                    # Next.js config — Firebase storage domains, server actions limit
├── tailwind.config (inline)          # Tailwind v4 — configured via CSS variables
├── tsconfig.json                     # TypeScript config
└── package.json                      # Dependencies
```

---

## How Everything Works

### Mobile Container

Every page is wrapped in `<div id="mobile-root">` in `src/app/layout.tsx`.

In `globals.css`:
```css
#mobile-root {
  width: 100%;
  max-width: 430px;
  min-height: 100dvh;
  margin: 0 auto;
  background: var(--bg-app);
}
```

This means no matter what screen size opens the app — phone, tablet, desktop — the experience is always a 430px centered mobile view.

---

### Authentication System

**How login works end-to-end:**

```
User fills login form
      ↓
POST /api/auth/login
      ↓
MongoDB: find user by email
      ↓
bcrypt.compare(password, hash)
      ↓
Sign JWT with user payload (id, name, email, role)
      ↓
Set JWT in HTTP-only cookie (ik_token) — 7 days
      ↓
Return user object to client
      ↓
AuthContext stores user in React state
      ↓
Redirect → / (Explorer/Creator) or /admin (Admin)
```

**How protected routes work:**

`src/middleware.ts` runs on every request before the page loads:

```
Request comes in
      ↓
Read ik_token cookie
      ↓
Verify JWT → get user role
      ↓
/login or /signup → redirect logged-in users to home
/upload            → must be CREATOR role
/admin/*           → must be ADMIN role
Everything else    → public (but feed only shows APPROVED videos)
```

**AuthContext** (`src/features/auth/AuthContext.tsx`) runs `GET /api/auth/me` on app mount to rehydrate user state from the cookie. This means page refreshes don't log users out.

---

### Video Upload Flow

**Step-by-step:**

```
Creator opens /upload
      ↓
STEP 1 — Pick file
  Drag & drop or file picker
  Validate: type (MP4/MOV/WEBM) + size (< 200MB)
      ↓
STEP 2 — Fill details
  Title, Description, Category, Place name,
  District, Latitude, Longitude (optional), Tags
      ↓
STEP 3 — Upload (on submit)
  Firebase Storage upload with progress bar
  generateVideoPath() → videos/{creatorId}/{timestamp}_{filename}
  Upload progress 0→100% shown live
      ↓
  POST /api/videos with:
    videoUrl (Firebase download URL)
    firebasePath (for future deletion)
    all form fields
      ↓
  MongoDB: create Video document { status: "PENDING" }
      ↓
STEP 4 — Done screen
  "Under admin review" message
  Link to /profile to see video status
```

---

### Feed (Infinite Scroll + Autoplay)

`src/app/page.tsx` + `src/features/feed/VideoCard.tsx`

**How the feed works:**

```
Page loads → fetch /api/videos?page=1&limit=5
      ↓
Render 5 VideoCard components stacked vertically
Each card: height = 100dvh, scroll-snap-align: start
      ↓
IntersectionObserver watches each card
When card enters viewport (threshold: 0.6):
  → setActiveIndex(index)
  → if near end (index >= total - 2): fetch next page
      ↓
VideoCard effect: if isActive → video.play(), else video.pause()
All videos start muted (autoplay policy compliance)
      ↓
User taps video → toggle play/pause with icon flash
User taps mute icon → toggle audio
```

---

### Admin Moderation Flow

```
Creator uploads video → status: PENDING
      ↓
Admin logs in → /admin shows pending count alert
      ↓
Admin opens /admin/videos (defaults to PENDING tab)
      ↓
Admin sees video card with:
  - Thumbnail (if available)
  - Title, creator name, place, upload time
  - Expand arrow → shows description, tags, preview link
      ↓
APPROVE:
  PATCH /api/admin/videos/:id/approve
  → status: "APPROVED"
  → Video appears in public feed immediately
      ↓
REJECT:
  Admin clicks Reject → rejection reason textarea appears
  PATCH /api/admin/videos/:id/reject { reason }
  → status: "REJECTED", rejectionReason saved
  → Creator sees reason in their /profile dashboard
      ↓
DELETE:
  DELETE /api/admin/videos/:id
  → Removed from database
  → (Firebase file cleanup — future enhancement)
```

---

### Creator Profile Dashboard

`/profile` page detects `user.role === "CREATOR"` and shows:

- **Stats row** — counts of approved, pending, rejected videos
- **4 tabs** — All / Approved / Pending / Rejected
- Each tab calls `GET /api/videos/my-videos?status=TAB`
- Video cards show thumbnail, title, place, status pill, rejection reason if rejected

For **Explorers** — `/profile` shows a simple menu: Saved places, Saved videos, My trips, Settings, Sign out.

---

## User Roles & Personas

### Explorer
- Can register via /signup (role = EXPLORER)
- Browses the feed, searches, saves (UI only in V1)
- Cannot upload or access admin

### Creator
- Registers via /signup (role = CREATOR)
- Gets an Upload tab in bottom nav
- Can upload videos — goes to PENDING
- Sees their video statuses in /profile
- Cannot approve/reject

### Admin
- **Cannot self-register** — account created manually in MongoDB
- Logs in via /login (same page, role detected from DB)
- Redirected to /admin after login
- Can approve, reject (with reason), delete any video
- Cannot access the consumer feed pages

---

## Authentication Flow

```
/signup → POST /api/auth/signup
  Validates: name, email, password strength, password match, role
  Creates User in MongoDB (password bcrypt hashed)
  Signs JWT → sets HTTP-only cookie
  Returns user object

/login → POST /api/auth/login
  Validates: email format, password required
  Finds user by email
  bcrypt.compare() password
  Signs JWT → sets HTTP-only cookie
  Returns user object

/api/auth/me → GET (called on every app load)
  Reads cookie → verifyToken()
  Returns current user or 401

/api/auth/logout → POST
  Deletes cookie
  Client redirects to /login
```

---

## Video Upload Flow

```
Client:
  1. File selected → validate type + size
  2. Form filled → validate required fields
  3. uploadVideo(file, path, onProgress) → Firebase Storage
     Returns: { downloadURL, firebasePath }
  4. POST /api/videos { ...form, videoUrl, firebasePath }

Server (/api/videos POST):
  1. Verify JWT → must be CREATOR
  2. Validate required fields
  3. Video.create({ ...data, status: "PENDING" })
  4. Return created video
```

---

## API Reference

### Auth

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/api/auth/signup` | Public | Register Explorer or Creator |
| POST | `/api/auth/login` | Public | Login any role |
| POST | `/api/auth/logout` | Any | Clear auth cookie |
| GET | `/api/auth/me` | Cookie | Get current user |

### Videos

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/api/videos` | Public | Approved feed. Query: `page`, `limit`, `category`, `district` |
| POST | `/api/videos` | Creator | Save video metadata after Firebase upload |
| GET | `/api/videos/:id` | Public | Single video + increment view count |
| DELETE | `/api/videos/:id` | Creator/Admin | Delete own video or any video (admin) |
| GET | `/api/videos/my-videos` | Creator | Own videos. Query: `status` |

### Admin

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/api/admin/videos` | Admin | All videos by status. Query: `status` |
| PATCH | `/api/admin/videos/:id/approve` | Admin | Set status → APPROVED |
| PATCH | `/api/admin/videos/:id/reject` | Admin | Set status → REJECTED. Body: `{ reason }` |
| DELETE | `/api/admin/videos/:id` | Admin | Hard delete video |

---

## Database Schema

### Users Collection

| Field | Type | Notes |
|-------|------|-------|
| _id | ObjectId | Auto-generated |
| fullName | String | Required |
| email | String | Unique, lowercased |
| password | String | bcrypt hash (12 rounds) |
| role | Enum | EXPLORER / CREATOR / ADMIN |
| profileImage | String | URL (optional) |
| bio | String | Max 300 chars |
| district | String | Karnataka district |
| isVerified | Boolean | Admin-verified creator flag |
| isActive | Boolean | Account active flag |
| createdAt / updatedAt | Date | Auto timestamps |

### Videos Collection

| Field | Type | Notes |
|-------|------|-------|
| _id | ObjectId | Auto-generated |
| title | String | Max 100 chars |
| description | String | Max 500 chars |
| category | Enum | NATURE / HERITAGE / FOOD / TREKKING / WATERFALL / CULTURE / HIDDEN_GEM / TEMPLE / BEACH / WILDLIFE |
| tags | [String] | Array of tags |
| placeName | String | Required |
| district | String | Karnataka district |
| latitude / longitude | Number | Optional GPS |
| videoUrl | String | Firebase Storage download URL |
| thumbnailUrl | String | Optional |
| firebasePath | String | Firebase path for deletion |
| creatorId | ObjectId | Ref: Users |
| status | Enum | PENDING / APPROVED / REJECTED (default: PENDING) |
| rejectionReason | String | Set by admin on reject |
| views | Number | Auto-incremented on GET |
| likesCount / commentsCount / sharesCount / savesCount | Number | Static in V1 |
| createdAt / updatedAt | Date | Auto timestamps |

**MongoDB Indexes:**
```
{ status: 1, createdAt: -1 }      → feed queries
{ creatorId: 1, status: 1 }       → my-videos queries
{ district: 1, status: 1 }        → search by district
{ category: 1, status: 1 }        → search by category
```

---

## Environment Variables

Create `.env.local` in the project root:

```env
# ── MongoDB ──────────────────────────────────────────────────────
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/incredible-karnataka?retryWrites=true&w=majority

# ── JWT ──────────────────────────────────────────────────────────
JWT_SECRET=your-super-secret-key-minimum-32-characters-long
JWT_EXPIRES_IN=7d

# ── Firebase ─────────────────────────────────────────────────────
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123

# ── App ──────────────────────────────────────────────────────────
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### How to get these values

**MongoDB URI:**
1. Go to [MongoDB Atlas](https://cloud.mongodb.com)
2. Create cluster → Connect → Drivers → Copy connection string
3. Replace `<username>` and `<password>`

**Firebase:**
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create project → Add web app
3. Copy config object values
4. Enable Storage → Rules → Allow authenticated reads/writes

**JWT_SECRET:**
Run in terminal: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

---

## Getting Started

```bash
# 1. Unzip the project
unzip incredible-karnataka-v1.zip
cd video

# 2. Install dependencies
npm install

# 3. Copy and fill environment variables
cp .env.local.example .env.local
# Edit .env.local with your real MongoDB URI + Firebase keys

# 4. Run development server
npm run dev

# 5. Open in browser
open http://localhost:3000
```

The app will render as a centered 430px mobile container.

---

## Creating an Admin Account

Admins **cannot self-register** through the signup form. Create one directly in MongoDB:

### Option A — MongoDB Atlas UI

1. Open your cluster → Browse Collections → `users` collection
2. Insert document:

```json
{
  "fullName": "Admin",
  "email": "admin@incrediblekarnataka.in",
  "password": "$2a$12$REPLACE_WITH_BCRYPT_HASH",
  "role": "ADMIN",
  "isActive": true,
  "isVerified": true,
  "createdAt": { "$date": "2026-06-01T00:00:00Z" },
  "updatedAt": { "$date": "2026-06-01T00:00:00Z" }
}
```

### Option B — Quick seed script

Create `scripts/create-admin.js` in the root:

```js
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
require("dotenv").config({ path: ".env.local" });

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
  const hash = await bcrypt.hash("Admin@123", 12);
  await mongoose.connection.db.collection("users").insertOne({
    fullName: "Admin",
    email: "admin@incrediblekarnataka.in",
    password: hash,
    role: "ADMIN",
    isActive: true,
    isVerified: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  console.log("Admin created: admin@incrediblekarnataka.in / Admin@123");
  process.exit(0);
}
main();
```

```bash
node scripts/create-admin.js
```

Then login at `/login` with those credentials. You will be redirected to `/admin`.

---

## Folder-by-Folder Explanation

### `src/app/` — Pages and API Routes

Next.js App Router. Every `page.tsx` is a route. Every `route.ts` is an API endpoint.

- **`layout.tsx`** — Root wrapper. Adds `AuthProvider` and the `#mobile-root` div to every page.
- **`globals.css`** — CSS variables, mobile container, skeleton animation, scroll snap.
- **`page.tsx`** — The main feed. IntersectionObserver drives autoplay and pagination.
- **`login/` `signup/`** — Auth pages. No layout chrome, no bottom nav. Full-screen forms.
- **`upload/`** — Multi-step upload. State machine: `pick → details → uploading → done`.
- **`search/`** — Client-side filter on API results. Category chips + district dropdown.
- **`saved/`** — V1 placeholder with V2 note.
- **`profile/`** — Role-aware: shows Creator dashboard or Explorer menu based on `user.role`.
- **`admin/layout.tsx`** — Admin-only shell. Redirects non-admins to `/login`.
- **`admin/page.tsx`** — Stats cards + quick action links.
- **`admin/videos/page.tsx`** — Full moderation UI: tabs, expand, approve, reject with reason, delete.

### `src/features/` — Feature Modules

- **`auth/AuthContext.tsx`** — React Context that holds the logged-in user. Calls `/api/auth/me` on mount. Provides `login()`, `logout()`, `refresh()`.
- **`feed/VideoCard.tsx`** — Full-screen video player card. `isActive` prop controls play/pause via `useEffect`. Right-side action buttons with local toggle state.

### `src/lib/` — Shared Libraries

- **`db/connect.ts`** — MongoDB connection with global cache so hot reloads don't create multiple connections.
- **`firebase/config.ts`** — Firebase app init (singleton pattern).
- **`firebase/upload.ts`** — `uploadVideo()` returns a Promise with progress callback. `generateVideoPath()` creates the storage path.
- **`auth/jwt.ts`** — `signToken()`, `verifyToken()`, `getAuthUser()` (reads cookie server-side), `setAuthCookie()`, `clearAuthCookie()`.
- **`utils/index.ts`** — `cn()` for class merging, `formatCount()` (1200 → 1.2K), `apiSuccess()` / `apiError()` for consistent API responses.

### `src/models/` — Mongoose Models

- **`User.ts`** — Pre-save bcrypt hook, `comparePassword()` method, password stripped from `.toJSON()`.
- **`Video.ts`** — Full schema with 4 compound indexes for common query patterns.

### `src/middleware.ts`

Runs before every page request (not API routes). Reads `ik_token` cookie, verifies JWT, enforces:
- `/login`, `/signup` → redirect if already logged in
- `/upload` → Creator only
- `/admin/*` → Admin only

### `src/types/index.ts`

Central TypeScript types. `IVideo.creatorId` is typed as `IUser | string` because MongoDB populate returns an object, but an unpopulated field is just an ObjectId string.

### `src/constants/index.ts`

- `CATEGORIES` — 10 place types with emoji
- `KARNATAKA_DISTRICTS` — all 31 districts
- `VIDEO_STATUS` — label + color for each status
- `MAX_VIDEO_SIZE` — 200MB limit
- `ALLOWED_VIDEO_TYPES` — mp4, mov, webm

### `src/validations/index.ts`

Pure functions — no external library needed. Each returns `string | null` (error message or null if valid). Used in API routes server-side.

---

## What is UI-only in V1

These buttons exist in the UI but have **no backend in V1**. They are marked for V2:

| Feature | Location | V1 Status |
|---------|----------|-----------|
| Like button | VideoCard | UI toggle only — count is static |
| Comment button | VideoCard | UI only — no comments model |
| Share button | VideoCard | UI only — no share API |
| Bookmark / Save | VideoCard | UI only — no saves model |
| View Place | VideoCard | UI only — no places page |
| Saved tab | /saved | Placeholder page |
| Settings | /profile | No settings page yet |

---

## V2 Roadmap

Prepared extension points in the architecture:

| Feature | What's needed |
|---------|--------------|
| Comments | Comments model + `/api/comments` routes |
| Likes | LikedVideos collection or Set on Video |
| Saved places | SavedPlaces collection + `/saved` page |
| Itinerary builder | Itinerary model (already designed in tech doc) |
| Creator verification | Admin action to set `isVerified: true` |
| AI Recommendations | MongoDB Atlas Vector Search + embeddings |
| AI Itinerary | LLM prompt + places DB |
| Place pages | Places collection + `/places/:id` route |
| Weather on places | OpenWeatherMap API cached per place |
| Follow creators | Follows collection |
| Push notifications | Firebase Cloud Messaging |
| Multi-state expansion | District → State field added to Video/Place |

---

## File Count Summary

| Category | Files |
|----------|-------|
| App pages | 9 |
| API routes | 12 |
| Components | 2 |
| Features | 2 |
| Lib utilities | 5 |
| Models | 2 |
| Types + Constants + Validations | 3 |
| Config files | 5 |
| **Total source files** | **40** |

---

## License

Private — Incredible Karnataka V1 MVP. All rights reserved.

---

*Built with Next.js 15, MongoDB Atlas, Firebase Storage, TypeScript, Tailwind CSS v4.*
