"use client"

import { useState } from "react"
import { AlertTriangle, X, MapPin } from "lucide-react"

interface ReportIssueModalProps {
  darkMode: boolean
  onClose: () => void
  onSubmit: (report: { type: string; description: string; lat: number; lng: number }) => void
  lat: number
  lng: number
}

const REPORT_TYPES = [
  { value: "traffic", label: "Traffic" },
  { value: "road_closure", label: "Road Closure" },
  { value: "accident", label: "Accident" },
  { value: "issue", label: "Issue" },
  { value: "other", label: "Other" },
]

export default function ReportIssueModal({ darkMode, onClose, onSubmit, lat, lng }: ReportIssueModalProps) {
  const [type, setType] = useState("traffic")
  const [description, setDescription] = useState("")

  const bg = darkMode ? "bg-slate-800" : "bg-white"
  const textColor = darkMode ? "text-slate-200" : "text-slate-900"
  const inputBg = darkMode ? "bg-slate-700 border-slate-600" : "bg-white border-slate-200"
  const subText = darkMode ? "text-slate-400" : "text-slate-500"

  function handleSubmit() {
    onSubmit({ type, description, lat, lng })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={onClose}>
      <div className={`${bg} rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-sm mx-4 p-6`}
        onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <AlertTriangle size={18} className={darkMode ? "text-amber-400" : "text-amber-500"} />
            <h3 className={`text-lg font-bold ${textColor}`}>Report Issue</h3>
          </div>
          <button onClick={onClose}
            className={`p-1 rounded-lg ${darkMode ? "hover:bg-slate-700" : "hover:bg-slate-100"}`}>
            <X size={18} className={subText} />
          </button>
        </div>

        <select value={type} onChange={(e) => setType(e.target.value)}
          className={`w-full px-3 py-2.5 border rounded-xl text-sm mb-3 outline-none focus:border-sky-400 ${inputBg} ${textColor}`}>
          {REPORT_TYPES.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>

        <textarea value={description} onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe the issue..."
          rows={4}
          className={`w-full px-3 py-2.5 border rounded-xl text-sm mb-3 outline-none focus:border-sky-400 resize-none ${inputBg} ${textColor}`} />

        <div className={`flex items-center gap-1.5 text-xs ${subText} mb-4`}>
          <MapPin size={14} />
          <span>{lat.toFixed(6)}, {lng.toFixed(6)}</span>
        </div>

        <div className="flex gap-3">
          <button onClick={handleSubmit}
            className="flex-1 py-2.5 bg-sky-500 hover:bg-sky-600 active:bg-sky-700 text-white font-semibold rounded-xl text-sm transition-colors active:scale-[0.98]">
            Submit
          </button>
          <button onClick={onClose}
            className={`flex-1 py-2.5 border rounded-xl text-sm font-semibold transition-colors active:scale-[0.98] ${darkMode ? "border-slate-600 text-slate-300 hover:bg-slate-700" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
