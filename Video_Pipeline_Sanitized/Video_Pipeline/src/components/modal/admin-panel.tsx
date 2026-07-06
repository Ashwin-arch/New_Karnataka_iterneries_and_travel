"use client"

import { X, Shield, BarChart3, Edit3, Ban, Check, Users } from "lucide-react"
import type { User, PendingPlace } from "@/lib/types"

interface AdminPanelProps {
  darkMode: boolean
  analytics: { total: number; categories: Record<string, number>; reviews: number; users: number }
  pendingPlaces: PendingPlace[]
  user: User | null
  onClose: () => void
  onApprove: (index: number) => void
  onReject: (index: number) => void
}

export default function AdminPanel({ darkMode, analytics, pendingPlaces, user, onClose, onApprove, onReject }: AdminPanelProps) {
  const bg = darkMode ? "bg-slate-800" : "bg-white"
  const textColor = darkMode ? "text-slate-200" : "text-slate-900"
  const subText = darkMode ? "text-slate-400" : "text-slate-400"
  const itemBg = darkMode ? "bg-slate-700/50" : "bg-slate-50"

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className={`${bg} rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[80vh] overflow-y-auto`} onClick={(e) => e.stopPropagation()}>
        <div className={`sticky top-0 ${bg} border-b ${darkMode ? "border-slate-700" : "border-slate-100"} px-6 py-4 flex items-center justify-between`}>
          <h3 className={`text-lg font-bold ${textColor} flex items-center gap-2`}>
            <Shield size={20} className="text-sky-500" /> Admin Dashboard
          </h3>
          <button onClick={onClose} className={`p-1 rounded-lg ${darkMode ? "hover:bg-slate-700" : "hover:bg-slate-100"}`}>
            <X size={18} className={subText} />
          </button>
        </div>
        <div className="p-6 space-y-6">
          {/* Analytics */}
          <div>
            <h4 className={`text-xs font-bold ${textColor} uppercase tracking-wider mb-3 flex items-center gap-1`}>
              <BarChart3 size={14} /> Analytics
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-sky-50 rounded-xl p-3 text-center">
                <div className="text-2xl font-bold text-sky-700">{analytics.total}</div>
                <div className="text-[10px] text-sky-500">Places</div>
              </div>
              <div className="bg-purple-50 rounded-xl p-3 text-center">
                <div className="text-2xl font-bold text-purple-700">{analytics.reviews}</div>
                <div className="text-[10px] text-purple-500">Reviews</div>
              </div>
              <div className="bg-green-50 rounded-xl p-3 text-center">
                <div className="text-2xl font-bold text-green-700">{Object.keys(analytics.categories).length}</div>
                <div className="text-[10px] text-green-500">Categories</div>
              </div>
              <div className="bg-amber-50 rounded-xl p-3 text-center">
                <div className="text-2xl font-bold text-amber-700">{analytics.users}</div>
                <div className="text-[10px] text-amber-500">Users</div>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {Object.entries(analytics.categories).map(([k, v]) => (
                <span key={k} className={`text-[10px] ${itemBg} px-2 py-0.5 rounded-full ${subText}`}>{k}: {v}</span>
              ))}
            </div>
          </div>

          {/* Pending places */}
          <div>
            <h4 className={`text-xs font-bold ${textColor} uppercase tracking-wider mb-3 flex items-center gap-1`}>
              <Edit3 size={14} /> Pending Submissions ({pendingPlaces.length})
            </h4>
            {pendingPlaces.length === 0 ? (
              <p className={`text-xs ${subText} text-center py-4`}>No pending submissions</p>
            ) : (
              <div className="space-y-2">
                {pendingPlaces.map((p, i) => (
                  <div key={i} className={`${itemBg} rounded-xl p-3`}>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className={`text-sm font-semibold ${textColor}`}>{p.name}</p>
                        <p className="text-[10px] text-slate-400">{p.place} · {p.category} · by {p.submittedBy}</p>
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        <button onClick={() => onApprove(i)}
                          className="p-1.5 bg-green-100 hover:bg-green-200 rounded-lg text-green-700">
                          <Check size={14} />
                        </button>
                        <button onClick={() => onReject(i)}
                          className="p-1.5 bg-red-100 hover:bg-red-200 rounded-lg text-red-700">
                          <Ban size={14} />
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">{p.description}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Users */}
          <div>
            <h4 className={`text-xs font-bold ${textColor} uppercase tracking-wider mb-3 flex items-center gap-1`}>
              <Users size={14} /> Users
            </h4>
            {user ? (
              <div className={`${itemBg} rounded-xl p-3 flex items-center gap-3`}>
                <div className="w-8 h-8 rounded-full bg-sky-100 flex items-center justify-center text-sky-700 font-bold text-sm">
                  {user.name[0]}
                </div>
                <div>
                  <p className={`text-sm font-semibold ${textColor}`}>{user.name}</p>
                  <p className="text-xs text-slate-400">{user.email}</p>
                </div>
              </div>
            ) : (
              <p className={`text-xs ${subText} text-center py-4`}>No users registered</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
