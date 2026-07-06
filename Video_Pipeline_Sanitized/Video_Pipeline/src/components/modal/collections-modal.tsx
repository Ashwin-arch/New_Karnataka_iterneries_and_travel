"use client"

import { useState } from "react"
import { X, Plus, Trash2 } from "lucide-react"
import type { User } from "@/lib/types"

interface CollectionsModalProps {
  darkMode: boolean
  user: User
  selectedPlaceId: number | null
  onClose: () => void
  onCreateCollection: (name: string) => void
  onTogglePlace: (colIndex: number, placeId: number) => void
  onDeleteCollection: (index: number) => void
}

export default function CollectionsModal({
  darkMode, user, selectedPlaceId, onClose, onCreateCollection, onTogglePlace, onDeleteCollection,
}: CollectionsModalProps) {
  const [newCollection, setNewCollection] = useState("")

  const bg = darkMode ? "bg-slate-800" : "bg-white"
  const textColor = darkMode ? "text-slate-200" : "text-slate-900"
  const inputBg = darkMode ? "bg-slate-700 border-slate-600" : "bg-white border-slate-200"
  const itemBg = darkMode ? "bg-slate-700/50" : "bg-slate-50"
  const subText = darkMode ? "text-slate-400" : "text-slate-400"

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className={`${bg} rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6`} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className={`text-lg font-bold ${textColor}`}>Collections</h3>
          <button onClick={onClose} className={`p-1 rounded-lg ${darkMode ? "hover:bg-slate-700" : "hover:bg-slate-100"}`}>
            <X size={18} className={darkMode ? "text-slate-400" : "text-slate-400"} />
          </button>
        </div>
        <div className="flex gap-2 mb-3">
          <input value={newCollection} onChange={(e) => setNewCollection(e.target.value)} placeholder="New collection name"
            className={`flex-1 px-3 py-2 text-sm border rounded-xl outline-none focus:border-sky-400 ${inputBg} ${textColor}`} />
          <button onClick={() => { if (newCollection.trim()) { onCreateCollection(newCollection.trim()); setNewCollection("") } }}
            disabled={!newCollection.trim()}
            className="px-3 py-2 bg-sky-500 hover:bg-sky-600 disabled:bg-slate-300 disabled:text-slate-400 text-white rounded-xl transition-colors">
            <Plus size={16} />
          </button>
        </div>
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {user.collections.length === 0 && (
            <p className={`text-xs text-center py-4 ${subText}`}>No collections yet</p>
          )}
          {user.collections.map((col, i) => (
            <div key={i} className={`${itemBg} rounded-xl p-3`}>
              <div className="flex items-center justify-between mb-1">
                <span className={`text-sm font-semibold ${textColor}`}>{col.name}</span>
                <button onClick={() => onDeleteCollection(i)}
                  className="p-0.5 hover:bg-red-50 rounded text-slate-300 hover:text-red-500">
                  <Trash2 size={12} />
                </button>
              </div>
              <p className={`text-[10px] ${subText}`}>{col.ids.length} places</p>
              {selectedPlaceId && (
                <button onClick={() => onTogglePlace(i, selectedPlaceId)}
                  className={`mt-1 text-xs font-medium ${col.ids.includes(selectedPlaceId) ? "text-sky-600" : "text-slate-500 hover:text-sky-600"}`}>
                  {col.ids.includes(selectedPlaceId) ? "✓ Added" : "+ Add current place"}
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
