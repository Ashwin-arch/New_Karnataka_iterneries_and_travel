"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Search, X, Clock, ChevronLeft, MapPin, Loader2, Mic } from "lucide-react"
import type { KarnatakaLocation } from "@/lib/types"
import { CATEGORY_COLORS } from "@/lib/constants"

interface SearchBarProps {
  darkMode: boolean
  locations: KarnatakaLocation[]
  recentSearches: string[]
  onPlaceClick: (loc: KarnatakaLocation) => void
  onGeocodeSearch: (query: string) => void
  onSearchQueryChange: (query: string) => void
  searchQuery: string
  onSearchQueryClear: () => void
  onVoiceSearch: () => void
  isListening: boolean
  className?: string
}

interface AutocompletePrediction {
  description: string
  placeId: string
  mainText: string
  secondaryText: string
}

export default function SearchBar({
  darkMode, locations, recentSearches, onPlaceClick, onGeocodeSearch,
  searchQuery, onSearchQueryChange, onSearchQueryClear,
  onVoiceSearch, isListening,
  className,
}: SearchBarProps) {
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [autocompleteResults, setAutocompleteResults] = useState<AutocompletePrediction[]>([])
  const [autocompleteLoading, setAutocompleteLoading] = useState(false)
  const autocompleteRef = useRef<google.maps.places.AutocompleteService | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined)
  const searchInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (window.google?.maps?.places && !autocompleteRef.current) {
      autocompleteRef.current = new google.maps.places.AutocompleteService()
    }
  }, [])

  const fetchAutocomplete = useCallback((query: string) => {
    if (!autocompleteRef.current || !query.trim()) {
      setAutocompleteResults([])
      return
    }
    setAutocompleteLoading(true)
    autocompleteRef.current.getPlacePredictions(
      { input: query, types: ["(regions)"], componentRestrictions: { country: "IN" } },
      (predictions, status) => {
        setAutocompleteLoading(false)
        if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
          setAutocompleteResults(
            predictions.slice(0, 5).map((p) => ({
              description: p.description,
              placeId: p.place_id,
              mainText: p.structured_formatting?.main_text || p.description,
              secondaryText: p.structured_formatting?.secondary_text || "",
            }))
          )
        } else {
          setAutocompleteResults([])
        }
      }
    )
  }, [])

  const handleQueryChange = (value: string) => {
    onSearchQueryChange(value)
    setShowSuggestions(true)

    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      if (value.trim()) {
        fetchAutocomplete(value)
      } else {
        setAutocompleteResults([])
      }
    }, 300)
  }

  const handleGeocodePlace = (prediction: AutocompletePrediction) => {
    onSearchQueryChange(prediction.description)
    setShowSuggestions(false)
    onGeocodeSearch(prediction.description)
  }

  const textColor = darkMode ? "text-slate-200" : "text-slate-800"
  const placeholderColor = "placeholder:text-slate-400"
  const bgColor = darkMode ? "bg-slate-800" : "bg-white"
  const borderColor = darkMode ? "border-slate-700" : "border-slate-200/80"
  const hoverColor = darkMode ? "hover:bg-slate-700" : "hover:bg-slate-50"
  const dropdownBg = darkMode ? "bg-slate-800" : "bg-white"
  const dropdownBorder = darkMode ? "border-slate-700" : "border-slate-200/80"

  const filteredLocations = locations.filter(
    (l) => l.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.place.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.category.toLowerCase().includes(searchQuery.toLowerCase())
  ).slice(0, 5)

  const isSidebar = className?.includes("relative")
  const animClass = isSidebar ? "search-bar-animated-sidebar" : "search-bar-animated-mobile"

  return (
    <div className={`${className || "absolute max-md:top-16 top-4 left-1/2 -translate-x-1/2 z-20 w-[95%] max-w-xl"} ${animClass}`}>
      <div className="relative">
        <div className={`flex items-center ${bgColor} rounded-full shadow-lg ${borderColor} border overflow-hidden transition-shadow focus-within:shadow-xl`}>
          <Search size={18} className="text-slate-400 ml-4 flex-shrink-0" />
          <input ref={searchInputRef} type="text" value={searchQuery}
            onChange={(e) => handleQueryChange(e.target.value)}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 250)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && searchQuery.trim()) {
                e.preventDefault()
                const match = locations.find((l) =>
                  l.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  l.place.toLowerCase().includes(searchQuery.toLowerCase())
                )
                if (match) { onPlaceClick(match); setShowSuggestions(false); return }
                onGeocodeSearch(searchQuery)
                setShowSuggestions(false)
              }
            }}
            placeholder="Search hidden places or address..." autoComplete="off"
            className={`flex-1 max-md:px-2 max-md:py-2.5 max-md:text-xs px-3 py-3 text-sm ${textColor} bg-transparent outline-none ${placeholderColor}`} />
          <button onClick={onVoiceSearch}
            className={`p-2 mr-1 rounded-full transition-colors ${
              isListening
                ? "text-red-500 bg-red-50 animate-pulse"
                : "text-slate-400 hover:text-slate-600 hover:bg-slate-100/50"
            }`}
            title={isListening ? "Listening..." : "Voice search"}>
            <Mic size={16} />
          </button>
          {searchQuery && (
            <button onClick={() => { onSearchQueryClear(); setAutocompleteResults([]) }}
              className="p-2 mr-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100/50">
              <X size={16} />
            </button>
          )}

        </div>

        {showSuggestions && (
          <div className={`absolute top-full left-0 right-0 mt-2 ${dropdownBg} rounded-2xl shadow-xl ${dropdownBorder} border overflow-hidden max-h-80 overflow-y-auto`}
            style={{ animation: "fadeInUpSmall 0.15s ease-out" }}>
            {/* Static location suggestions */}
            {searchQuery && filteredLocations.length > 0 && (
              <div>
                <div className={`px-4 pt-3 pb-1 text-[10px] font-bold ${darkMode ? "text-slate-500" : "text-slate-400"} uppercase tracking-wider`}>
                  Places
                </div>
                {filteredLocations.map((loc) => (
                  <button key={loc.id} onMouseDown={() => { onPlaceClick(loc); setShowSuggestions(false) }}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left ${hoverColor} transition-colors border-b ${darkMode ? "border-slate-700/50" : "border-slate-50"}`}>
                    <span className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                      style={{ background: CATEGORY_COLORS[loc.category] || "#64748b" }}>{loc.id}</span>
                    <div className="min-w-0 flex-1">
                      <p className={`text-sm font-semibold truncate ${darkMode ? "text-slate-200" : "text-slate-800"}`}>{loc.name}</p>
                      <p className={`text-xs truncate ${darkMode ? "text-slate-400" : "text-slate-400"}`}>{loc.place} · {loc.category}</p>
                    </div>
                    <ChevronLeft size={16} className="text-slate-300 rotate-180 flex-shrink-0" />
                  </button>
                ))}
              </div>
            )}

            {/* Google Places Autocomplete */}
            {searchQuery && autocompleteResults.length > 0 && (
              <div>
                <div className={`px-4 pt-3 pb-1 text-[10px] font-bold ${darkMode ? "text-slate-500" : "text-slate-400"} uppercase tracking-wider`}>
                  Addresses &amp; Regions
                </div>
                {autocompleteResults.map((p) => (
                  <button key={p.placeId} onMouseDown={() => handleGeocodePlace(p)}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left ${hoverColor} transition-colors`}>
                    <MapPin size={16} className="text-slate-400 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className={`text-sm font-medium truncate ${darkMode ? "text-slate-200" : "text-slate-700"}`}>{p.mainText}</p>
                      <p className="text-xs text-slate-400 truncate">{p.secondaryText}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {searchQuery && autocompleteLoading && (
              <div className="flex items-center justify-center py-4">
                <Loader2 size={16} className="animate-spin text-sky-500" />
              </div>
            )}

            {/* Recent searches */}
            {!searchQuery && recentSearches.length > 0 && (
              <div className="p-3">
                <p className={`text-[10px] font-bold ${darkMode ? "text-slate-500" : "text-slate-400"} uppercase tracking-wider mb-2`}>
                  Recent searches
                </p>
                {recentSearches.map((s) => (
                  <button key={s} onMouseDown={() => { onSearchQueryChange(s); setShowSuggestions(true) }}
                    className={`w-full flex items-center gap-2 px-2 py-2 text-left text-sm ${darkMode ? "text-slate-300" : "text-slate-600"} ${hoverColor} rounded-lg transition-colors`}>
                    <Clock size={13} className="text-slate-400" /> {s}
                  </button>
                ))}
              </div>
            )}

            {searchQuery && filteredLocations.length === 0 && autocompleteResults.length === 0 && !autocompleteLoading && (
              <p className={`text-xs text-center py-4 ${darkMode ? "text-slate-500" : "text-slate-400"}`}>
                Press Enter to search &ldquo;{searchQuery}&rdquo;
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
