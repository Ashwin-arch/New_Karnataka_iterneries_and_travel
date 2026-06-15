"use client"

import { X } from "lucide-react"
import { CATEGORY_META } from "@/lib/constants"

interface SubmitPlaceForm {
  name: string
  place: string
  lat: string
  lng: string
  category: string
  description: string
}

interface SubmitPlaceModalProps {
  darkMode: boolean
  form: SubmitPlaceForm
  onChange: (form: SubmitPlaceForm) => void
  onClose: () => void
  onSubmit: () => void
}

export default function SubmitPlaceModal({ darkMode, form, onChange, onClose, onSubmit }: SubmitPlaceModalProps) {
  const bg = darkMode ? "bg-slate-800" : "bg-white"
  const textColor = darkMode ? "text-slate-200" : "text-slate-900"
  const inputBg = darkMode ? "bg-slate-700 border-slate-600" : "bg-white border-slate-200"

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className={`${bg} rounded-2xl shadow-2xl w-full max-w-sm mx-4 max-sm:p-4 p-6 max-h-[90vh] overflow-y-auto my-4`} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className={`text-lg font-bold ${textColor}`}>Submit a Place</h3>
          <button onClick={onClose} className={`p-1 rounded-lg ${darkMode ? "hover:bg-slate-700" : "hover:bg-slate-100"}`}>
            <X size={18} className={darkMode ? "text-slate-400" : "text-slate-400"} />
          </button>
        </div>
        <div className="space-y-3">
          <input value={form.name} onChange={(e) => onChange({ ...form, name: e.target.value })} placeholder="Place name"
            className={`w-full px-3 py-2.5 text-sm border rounded-xl outline-none focus:border-sky-400 ${inputBg} ${textColor}`} />
          <input value={form.place} onChange={(e) => onChange({ ...form, place: e.target.value })} placeholder="Location (e.g. Udupi, Karnataka)"
            className={`w-full px-3 py-2.5 text-sm border rounded-xl outline-none focus:border-sky-400 ${inputBg} ${textColor}`} />
          <div className="flex gap-2">
            <input value={form.lat} onChange={(e) => onChange({ ...form, lat: e.target.value })} placeholder="Latitude" type="number" step="any"
              className={`flex-1 px-3 py-2.5 text-sm border rounded-xl outline-none focus:border-sky-400 ${inputBg} ${textColor}`} />
            <input value={form.lng} onChange={(e) => onChange({ ...form, lng: e.target.value })} placeholder="Longitude" type="number" step="any"
              className={`flex-1 px-3 py-2.5 text-sm border rounded-xl outline-none focus:border-sky-400 ${inputBg} ${textColor}`} />
          </div>
          <select value={form.category} onChange={(e) => onChange({ ...form, category: e.target.value })}
            className={`w-full px-3 py-2.5 text-sm border rounded-xl outline-none focus:border-sky-400 ${inputBg} ${textColor}`}>
            {Object.entries(CATEGORY_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
          <textarea value={form.description} onChange={(e) => onChange({ ...form, description: e.target.value })} placeholder="Description" rows={3}
            className={`w-full px-3 py-2.5 text-sm border rounded-xl outline-none focus:border-sky-400 resize-none ${inputBg} ${textColor}`} />
          <button onClick={onSubmit} disabled={!form.name || !form.place}
            className="w-full py-2.5 bg-sky-500 hover:bg-sky-600 disabled:bg-slate-300 disabled:text-slate-400 text-white font-semibold rounded-xl text-sm transition-colors active:scale-[0.98]">
            Submit for Review
          </button>
        </div>
      </div>
    </div>
  )
}
