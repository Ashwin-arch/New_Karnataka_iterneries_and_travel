"use client"

import { useState, useEffect, useMemo, useRef, useCallback } from "react"
import {
  Loader2,
  MapIcon,
  Info,
  X,
  MousePointer2,
  ZoomIn,
  ZoomOut,
  Maximize2,
} from "lucide-react"

interface GeoProperties {
  district?: string
  st_code?: string
  dt_code?: string
  st_nm?: string
  year?: string
  [key: string]: string | undefined
}

interface GeoGeometry {
  type: string
  coordinates: number[][][][] | number[][][]
}

interface GeoFeature {
  type: string
  properties: GeoProperties
  geometry: GeoGeometry
}

interface GeoData {
  type: string
  features: GeoFeature[]
}

interface Bounds {
  minLon: number
  maxLon: number
  minLat: number
  maxLat: number
}

const MIN_ZOOM = 0.5
const MAX_ZOOM = 10
const ZOOM_STEP = 0.4

function project(
  lon: number,
  lat: number,
  width: number,
  height: number,
  bounds: Bounds,
): { x: number; y: number } {
  const { minLon, maxLon, minLat, maxLat } = bounds
  const padding = 40
  const availWidth = width - padding * 2
  const availHeight = height - padding * 2
  const lonRange = maxLon - minLon
  const latRange = maxLat - minLat
  const xScale = availWidth / lonRange
  const yScale = availHeight / latRange
  const scale = Math.min(xScale, yScale)
  const xOffset = (width - lonRange * scale) / 2
  const yOffset = (height - latRange * scale) / 2
  const x = (lon - minLon) * scale + xOffset
  const y = (maxLat - lat) * scale + yOffset
  return { x, y }
}

function processCoord(coord: number[], bounds: Bounds): void {
  const [lon, lat] = coord
  if (lon < bounds.minLon) bounds.minLon = lon
  if (lon > bounds.maxLon) bounds.maxLon = lon
  if (lat < bounds.minLat) bounds.minLat = lat
  if (lat > bounds.maxLat) bounds.maxLat = lat
}

function traverseCoords(coords: unknown[], bounds: Bounds): void {
  if (coords.length === 0) return
  if (typeof coords[0] === "number") {
    processCoord(coords as number[], bounds)
  } else {
    for (const child of coords) {
      traverseCoords(child as unknown[], bounds)
    }
  }
}

function calculateBounds(features: GeoFeature[]): Bounds {
  const bounds: Bounds = {
    minLon: Infinity,
    maxLon: -Infinity,
    minLat: Infinity,
    maxLat: -Infinity,
  }
  for (const feature of features) {
    traverseCoords(feature.geometry.coordinates as unknown[], bounds)
  }
  return bounds
}

function buildPathData(
  geometry: GeoGeometry,
  width: number,
  height: number,
  bounds: Bounds,
): string {
  function drawRing(ring: number[][]) {
    return ring
      .map((pos) => {
        const { x, y } = project(pos[0], pos[1], width, height, bounds)
        return `${x},${y}`
      })
      .join(" ")
  }

  if (geometry.type === "Polygon") {
    return geometry.coordinates
      .map((ring) => "M" + drawRing(ring as number[][]) + "Z")
      .join(" ")
  }
  if (geometry.type === "MultiPolygon") {
    return (geometry.coordinates as number[][][][])
      .map((poly) =>
        poly
          .map((ring) => "M" + drawRing(ring as number[][]) + "Z")
          .join(" "),
      )
      .join(" ")
  }
  return ""
}

const DISTRICT_COLORS: Record<string, string> = {
  default: "#e0f2fe",
  hover: "#7dd3fc",
  selected: "#0ea5e9",
}

export default function KarnatakaMap() {
  const [geoData, setGeoData] = useState<GeoData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedDistrict, setSelectedDistrict] = useState<GeoFeature | null>(
    null,
  )
  const [hoveredDistrict, setHoveredDistrict] = useState<GeoFeature | null>(
    null,
  )
  const [svgSize, setSvgSize] = useState({ width: 800, height: 600 })
  const [scale, setScale] = useState(1)
  const [translate, setTranslate] = useState({ x: 0, y: 0 })
  const containerRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const [isPanning, setIsPanning] = useState(false)
  const panStart = useRef({ x: 0, y: 0 })
  const translateOnPanStart = useRef({ x: 0, y: 0 })

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("/karnataka-GeoJSON.json")
        if (!response.ok)
          throw new Error(`Failed to load data: ${response.statusText}`)
        const data = await response.json()
        setGeoData(data)
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load map data",
        )
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  useEffect(() => {
    function handleResize() {
      if (containerRef.current) {
        setSvgSize({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        })
      }
    }
    window.addEventListener("resize", handleResize)
    handleResize()
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  const mapData = useMemo(() => {
    if (!geoData) return null
    const bounds = calculateBounds(geoData.features)
    return { features: geoData.features, bounds }
  }, [geoData])

  const clampScale = useCallback((s: number) => {
    return Math.min(Math.max(s, MIN_ZOOM), MAX_ZOOM)
  }, [])

  function handleZoomIn() {
    setScale((s) => clampScale(s + ZOOM_STEP))
  }

  function handleZoomOut() {
    setScale((s) => clampScale(s - ZOOM_STEP))
  }

  function handleReset() {
    setScale(1)
    setTranslate({ x: 0, y: 0 })
  }

  function handleWheel(e: React.WheelEvent) {
    e.preventDefault()
    const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP
    const newScale = clampScale(scale + delta)

    const rect = svgRef.current?.getBoundingClientRect()
    if (!rect) return
    const mx = e.clientX - rect.left
    const my = e.clientY - rect.top

    setScale(newScale)
    setTranslate((prev) => ({
      x: mx - (newScale / scale) * (mx - prev.x),
      y: my - (newScale / scale) * (my - prev.y),
    }))
  }

  function handleMouseDown(e: React.MouseEvent) {
    if (e.button !== 0) return
    setIsPanning(true)
    panStart.current = { x: e.clientX, y: e.clientY }
    translateOnPanStart.current = { ...translate }
  }

  function handleMouseMove(e: React.MouseEvent) {
    if (!isPanning) return
    const dx = e.clientX - panStart.current.x
    const dy = e.clientY - panStart.current.y
    setTranslate({
      x: translateOnPanStart.current.x + dx,
      y: translateOnPanStart.current.y + dy,
    })
  }

  function handleMouseUp() {
    setIsPanning(false)
  }

  function renderPaths() {
    if (!mapData) return null
    const { features, bounds } = mapData

    return features.map((feature, index) => {
      const pathData = buildPathData(
        feature.geometry,
        svgSize.width,
        svgSize.height,
        bounds,
      )
      const isSelected = selectedDistrict === feature
      const isHovered = hoveredDistrict === feature
      const fill = isSelected
        ? DISTRICT_COLORS.selected
        : isHovered
          ? DISTRICT_COLORS.hover
          : DISTRICT_COLORS.default
      const strokeColor = isSelected ? "#0c4a6e" : "#0284c7"
      const strokeWidth = isSelected ? 2.5 : isHovered ? 1.5 : 0.8

      return (
        <path
          key={index}
          d={pathData}
          fill={fill}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          className="transition-all duration-200 cursor-pointer ease-in-out"
          onMouseEnter={() => setHoveredDistrict(feature)}
          onMouseLeave={() => setHoveredDistrict(null)}
          onClick={(e) => {
            e.stopPropagation()
            setSelectedDistrict(feature)
          }}
        >
          <title>{feature.properties.district || "Unknown District"}</title>
        </path>
      )
    })
  }

  return (
    <div className="flex flex-col h-screen bg-slate-50 text-slate-800 font-sans overflow-hidden">
      <header className="bg-white/80 backdrop-blur-md shadow-sm px-6 py-4 z-10 flex items-center justify-between border-b border-slate-200/80">
        <div className="flex items-center space-x-3">
          <div className="bg-gradient-to-br from-sky-500 to-sky-700 p-2 rounded-xl text-white shadow-lg shadow-sky-200">
            <MapIcon size={22} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Karnataka Explorer
            </h1>
            <p className="text-sm text-slate-400">Interactive District Map</p>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-1.5 text-xs text-slate-400 bg-slate-100/80 px-3 py-1.5 rounded-full">
          <MousePointer2 size={12} />
          <span>Hover to highlight &middot; Click for details</span>
        </div>
      </header>

      <main className="flex-1 relative flex overflow-hidden">
        <div
          ref={containerRef}
          className="flex-1 relative bg-gradient-to-br from-slate-50 to-sky-50/30"
          onClick={() => selectedDistrict && setSelectedDistrict(null)}
        >
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="animate-spin text-sky-600" size={32} />
                <p className="text-slate-500 font-medium">
                  Loading Map Data...
                </p>
              </div>
            </div>
          )}

          {error && (
            <div className="absolute inset-0 flex items-center justify-center p-6">
              <div className="bg-white p-6 rounded-2xl shadow-xl border border-red-100 text-center max-w-md">
                <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
                  <X className="text-red-600" size={20} />
                </div>
                <h3 className="text-lg font-bold text-slate-800 mb-2">
                  Error Loading Map
                </h3>
                <p className="text-slate-600 mb-4">{error}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-colors"
                >
                  Retry
                </button>
              </div>
            </div>
          )}

          {!loading && !error && mapData && (
            <svg
              ref={svgRef}
              width={svgSize.width}
              height={svgSize.height}
              className="w-full h-full block"
              style={{ cursor: isPanning ? "grabbing" : "grab" }}
              onWheel={handleWheel}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              <defs>
                <filter id="shadow">
                  <feDropShadow
                    dx={1}
                    dy={2}
                    stdDeviation={3}
                    floodOpacity={0.12}
                  />
                </filter>
              </defs>
              <g
                filter="url(#shadow)"
                transform={`translate(${translate.x}, ${translate.y}) scale(${scale})`}
                style={{ transformOrigin: "center center" }}
              >
                {renderPaths()}
              </g>
            </svg>
          )}

          <div className="absolute top-4 right-4 flex flex-col gap-2 z-10">
            <button
              onClick={handleZoomIn}
              disabled={scale >= MAX_ZOOM}
              className="p-2.5 bg-white/90 backdrop-blur rounded-xl shadow-lg border border-slate-200/80 text-slate-600 hover:text-sky-600 hover:border-sky-200 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              title="Zoom in"
            >
              <ZoomIn size={18} />
            </button>
            <button
              onClick={handleZoomOut}
              disabled={scale <= MIN_ZOOM}
              className="p-2.5 bg-white/90 backdrop-blur rounded-xl shadow-lg border border-slate-200/80 text-slate-600 hover:text-sky-600 hover:border-sky-200 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              title="Zoom out"
            >
              <ZoomOut size={18} />
            </button>
            <button
              onClick={handleReset}
              className="p-2.5 bg-white/90 backdrop-blur rounded-xl shadow-lg border border-slate-200/80 text-slate-600 hover:text-sky-600 hover:border-sky-200 transition-all"
              title="Reset view"
            >
              <Maximize2 size={18} />
            </button>
            <div className="text-center text-[10px] text-slate-400 font-medium bg-white/60 backdrop-blur rounded-lg px-2 py-1 shadow">
              {Math.round(scale * 100)}%
            </div>
          </div>

          <div className="absolute bottom-4 left-4 md:hidden pointer-events-none">
            {hoveredDistrict && (
              <div className="bg-slate-900/80 backdrop-blur text-white px-3 py-1.5 rounded-full text-sm">
                {hoveredDistrict.properties.district}
              </div>
            )}
          </div>
        </div>

        <aside
          className={`
            absolute md:relative z-20
            bg-white/95 backdrop-blur-md shadow-xl md:shadow-none border-l border-slate-200/80
            w-full md:w-80 h-full
            transition-all duration-300 ease-in-out
            ${
              selectedDistrict
                ? "translate-x-0"
                : "translate-x-full md:translate-x-0 md:w-0 md:border-l-0 md:overflow-hidden"
            }
          `}
        >
          {selectedDistrict ? (
            <div className="h-full flex flex-col">
              <div className="p-6 border-b border-slate-100 flex justify-between items-start bg-gradient-to-br from-white via-white to-sky-50/50">
                <div>
                  <div className="text-[10px] font-bold text-sky-600 uppercase tracking-widest mb-1">
                    District
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900">
                    {selectedDistrict.properties.district}
                  </h2>
                </div>
                <button
                  onClick={() => setSelectedDistrict(null)}
                  className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors text-slate-400 hover:text-slate-600"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-5">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <div className="text-slate-400 text-[10px] uppercase tracking-wider mb-1">
                      State Code
                    </div>
                    <div className="text-lg font-semibold text-slate-700">
                      {selectedDistrict.properties.st_code}
                    </div>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <div className="text-slate-400 text-[10px] uppercase tracking-wider mb-1">
                      District Code
                    </div>
                    <div className="text-lg font-semibold text-slate-700">
                      {selectedDistrict.properties.dt_code}
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-xs font-bold text-slate-900 mb-3 flex items-center gap-1.5">
                    <Info size={14} className="text-sky-500" />
                    Detailed Information
                  </h3>
                  <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
                    <table className="w-full text-sm text-left">
                      <tbody className="divide-y divide-slate-50">
                        {Object.entries(selectedDistrict.properties).map(
                          ([key, value]) => {
                            if (key === "geometry" || key === "type")
                              return null
                            return (
                              <tr
                                key={key}
                                className="hover:bg-slate-50 transition-colors"
                              >
                                <td className="py-2.5 px-4 text-slate-500 font-medium capitalize border-r border-slate-50 w-1/3">
                                  {key.replace(/_/g, " ")}
                                </td>
                                <td className="py-2.5 px-4 text-slate-800 font-semibold">
                                  {value}
                                </td>
                              </tr>
                            )
                          },
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="p-4 bg-gradient-to-br from-sky-50 to-blue-50 rounded-xl border border-sky-100 text-sky-800 text-sm">
                  <p className="font-medium mb-1">Geographic Context</p>
                  <p className="opacity-80 text-xs leading-relaxed">
                    This district is part of{" "}
                    {selectedDistrict.properties.st_nm} state. Data reflects
                    census year {selectedDistrict.properties.year || "2011"}.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-400">
              <div className="bg-slate-50 p-4 rounded-2xl mb-4">
                <MousePointer2 size={28} className="opacity-50" />
              </div>
              <p className="font-medium text-sm">Select a district</p>
              <p className="text-xs mt-1 text-slate-400">
                Click on the map to view details
              </p>
            </div>
          )}
        </aside>
      </main>
    </div>
  )
}
