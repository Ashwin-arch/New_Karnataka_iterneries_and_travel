export function createPinSVG(color: string, label?: string): string {
  const text = label
    ? `<text x="16" y="21" text-anchor="middle" fill="white" font-size="12" font-weight="bold" font-family="system-ui">${label}</text>`
    : ""
  return `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="42" viewBox="0 0 32 42"><path d="M16 2C8.268 2 2 8.268 2 16c0 8.5 12 23 14 25.5C18 39 30 24.5 30 16c0-7.732-6.268-14-14-14z" fill="${color}" stroke="white" stroke-width="1.5"/><circle cx="16" cy="16" r="6" fill="white" opacity="0.25"/>${text}</svg>`
  )}`
}

export function createClusterIcon(count: number): string {
  const size = count > 50 ? 56 : count > 20 ? 48 : 40
  return `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
      <circle cx="${size/2}" cy="${size/2}" r="${size/2 - 2}" fill="#0ea5e9" fill-opacity="0.85" stroke="white" stroke-width="2"/>
      <circle cx="${size/2}" cy="${size/2}" r="${size/2 - 7}" fill="white" fill-opacity="0.2"/>
      <text x="${size/2}" y="${size/2 + 1}" text-anchor="middle" dominant-baseline="middle" fill="white" font-size="${size * 0.38}" font-weight="bold" font-family="system-ui">${count}</text>
    </svg>`
  )}`
}

export function genId() { return Math.random().toString(36).slice(2, 10) }

export const LS = {
  get<T>(k: string, def: T): T { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : def } catch { return def } },
  set(k: string, v: unknown) { try { localStorage.setItem(k, JSON.stringify(v)) } catch {} },
}

export function getDirectionsUrl(lat: number, lng: number, mode?: string): string {
  const travelMode = mode ? `&travelmode=${mode.toLowerCase()}` : ""
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}${travelMode}`
}
