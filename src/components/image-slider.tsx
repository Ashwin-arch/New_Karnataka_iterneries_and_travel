"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import { ChevronLeft, ChevronRight, Expand, X } from "lucide-react"

interface ImageSliderProps {
  images: string[]
  alt: string
}

export default function ImageSlider({ images, alt }: ImageSliderProps) {
  const [current, setCurrent] = useState(0)
  const [fullscreen, setFullscreen] = useState(false)
  const touchStart = useRef(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const prev = useCallback(() => {
    setCurrent((c) => (c === 0 ? images.length - 1 : c - 1))
  }, [images.length])

  const next = useCallback(() => {
    setCurrent((c) => (c === images.length - 1 ? 0 : c + 1))
  }, [images.length])

  useEffect(() => {
    timerRef.current = setInterval(next, 4000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [next])

  useEffect(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = setInterval(next, 4000) }
  }, [current, next])

  useEffect(() => {
    if (fullscreen) document.body.style.overflow = "hidden"
    else document.body.style.overflow = ""
    return () => { document.body.style.overflow = "" }
  }, [fullscreen])

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setFullscreen(false)
      if (e.key === "ArrowLeft") prev()
      if (e.key === "ArrowRight") next()
    }
    window.addEventListener("keydown", handleKey)
    return () => window.removeEventListener("keydown", handleKey)
  }, [prev, next])

  if (images.length === 0) return null

  const sliderContent = (isFullscreen: boolean) => (
    <div className={`relative ${isFullscreen ? "w-full h-full" : "w-full aspect-[4/3]"} overflow-hidden bg-slate-100`}>
      {images.map((src, i) => (
        <div
          key={src}
          className={`absolute inset-0 transition-all duration-500 ease-out ${
            i === current ? "opacity-100 translate-x-0" : "opacity-0 translate-x-8"
          } ${i < current ? "-translate-x-8" : ""}`}
        >
          <img
            src={src}
            alt={`${alt} ${i + 1}`}
            className={`w-full h-full ${isFullscreen ? "object-contain" : "object-cover"}`}
            loading={i === 0 ? "eager" : "lazy"}
            fetchPriority={i === 0 ? "high" : "auto"}
          />
        </div>
      ))}

      <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/30 to-transparent pointer-events-none" />

      <button onClick={(e) => { e.stopPropagation(); prev() }}
        className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 hover:bg-white shadow-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all pointer-events-auto hover:scale-105"
        aria-label="Previous image">
        <ChevronLeft size={18} className="text-slate-700" />
      </button>
      <button onClick={(e) => { e.stopPropagation(); next() }}
        className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 hover:bg-white shadow-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all pointer-events-auto hover:scale-105"
        aria-label="Next image">
        <ChevronRight size={18} className="text-slate-700" />
      </button>

      <div className="absolute top-3 right-3 flex gap-1.5">
        <span className="px-2.5 py-1 rounded-full bg-black/40 backdrop-blur-sm text-white text-[10px] font-semibold tracking-wide">
          {current + 1} / {images.length}
        </span>
        {!isFullscreen && (
          <button onClick={(e) => { e.stopPropagation(); setFullscreen(true) }}
            className="w-7 h-7 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center hover:bg-black/60 transition-colors"
            aria-label="Fullscreen">
            <Expand size={13} className="text-white" />
          </button>
        )}
      </div>

      <div className="absolute bottom-2 inset-x-0 flex items-center justify-center gap-1.5 pointer-events-none"
        onTouchStart={(e) => { touchStart.current = e.touches[0].clientX }}
        onTouchEnd={(e) => {
          const end = e.changedTouches[0].clientX
          const diff = touchStart.current - end
          if (Math.abs(diff) > 50) { if (diff > 0) next(); else prev() }
        }}>
        {images.map((_, i) => (
          <button key={i} onClick={(e) => { e.stopPropagation(); setCurrent(i) }}
            className={`pointer-events-auto rounded-full transition-all duration-300 ${
              i === current ? "w-5 h-2 bg-white shadow-md" : "w-1.5 h-1.5 bg-white/50 hover:bg-white/80"
            }`}
            aria-label={`Go to image ${i + 1}`} />
        ))}
      </div>
    </div>
  )

  return (
    <>
      <div className="relative group rounded-t-xl overflow-hidden">
        {sliderContent(false)}
      </div>

      {fullscreen && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center group"
          onClick={() => setFullscreen(false)}>
          <button onClick={(e) => { e.stopPropagation(); setFullscreen(false) }}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors z-10">
            <X size={20} className="text-white" />
          </button>
          <div className="w-full h-full max-w-5xl max-h-[90vh] p-4" onClick={(e) => e.stopPropagation()}>
            <div className="relative group w-full h-full rounded-2xl overflow-hidden">
              {sliderContent(true)}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
