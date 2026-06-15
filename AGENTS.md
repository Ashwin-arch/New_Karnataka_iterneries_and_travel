<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Build
```bash
npm run build
```

## Deploy

Set this environment variable in **Netlify Dashboard → Site Settings → Environment Variables**:

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Your Google Maps API key |

Then deploy:

```bash
npm run build && netlify deploy --prod --dir=out
```

## 2026-06-11 — Card scrolling & navigation fixes

### Problem
Card bottom sheet had no keyboard shortcuts (Escape to close, arrow keys to switch locations), image slider's global keydown handler stole ArrowLeft/Right/Escape events even when not in fullscreen, only a "Next" button existed (no "Previous"), and the nav buttons scrolled away with content.

### Changes
- **`src/components/image-slider.tsx`** — Keyboard handler (ArrowLeft/Right/Escape) only registers when `fullscreen` is active; no longer intercepts keys globally during normal card view
- **`src/components/google-karnataka-map.tsx`** — Added `handlePrevLocation()` (actual previous), `handleNextLocation()`, and a global `keydown` effect: Escape closes card, ArrowLeft/Right switch locations
- **`src/components/map/place-bottom-sheet.tsx`** — Header is now `sticky top-0` with matching background so nav/close buttons stay visible while scrolling content; added Previous (ChevronLeft) button alongside Next and Close; both `onPrevLocation` and `onNextLocation` props accepted and rendered conditionally