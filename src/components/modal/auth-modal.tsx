"use client"

import { useState } from "react"
import { X } from "lucide-react"

interface AuthModalProps {
  darkMode: boolean
  onClose: () => void
  onAuth: (name: string, email: string, mode: "login" | "signup") => void
}

export default function AuthModal({ darkMode, onClose, onAuth }: AuthModalProps) {
  const [mode, setMode] = useState<"login" | "signup">("login")
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")

  const bg = darkMode ? "bg-slate-800" : "bg-white"
  const textColor = darkMode ? "text-slate-200" : "text-slate-900"
  const inputBg = darkMode ? "bg-slate-700 border-slate-600" : "bg-white border-slate-200"
  const subText = darkMode ? "text-slate-400" : "text-slate-500"

  function handleSubmit() {
    onAuth(name, email, mode)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={onClose}>
      <div className={`${bg} rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6`} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className={`text-lg font-bold ${textColor}`}>
            {mode === "login" ? "Sign In" : "Create Account"}
          </h3>
          <button onClick={onClose} className={`p-1 rounded-lg ${darkMode ? "hover:bg-slate-700" : "hover:bg-slate-100"}`}>
            <X size={18} className={darkMode ? "text-slate-400" : "text-slate-400"} />
          </button>
        </div>
        {mode === "signup" && (
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name"
            className={`w-full px-3 py-2.5 border rounded-xl text-sm mb-3 outline-none focus:border-sky-400 ${inputBg} ${textColor}`} />
        )}
        <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" type="email"
          className={`w-full px-3 py-2.5 border rounded-xl text-sm mb-4 outline-none focus:border-sky-400 ${inputBg} ${textColor}`} />
        <button onClick={handleSubmit}
          className="w-full py-2.5 bg-sky-500 hover:bg-sky-600 active:bg-sky-700 text-white font-semibold rounded-xl text-sm transition-colors active:scale-[0.98]">
          {mode === "login" ? "Sign In" : "Create Account"}
        </button>
        <p className={`text-xs ${subText} text-center mt-3`}>
          {mode === "login" ? "Don't have an account? " : "Already have an account? "}
          <button onClick={() => setMode(mode === "login" ? "signup" : "login")}
            className="text-sky-600 font-medium hover:underline">
            {mode === "login" ? "Sign up" : "Sign in"}
          </button>
        </p>
      </div>
    </div>
  )
}
