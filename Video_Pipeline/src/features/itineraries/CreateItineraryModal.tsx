"use client";

import { useState } from "react";
import { X, Plus, Loader2 } from "lucide-react";

interface Props {
  onClose: () => void;
  onCreate: (title: string, description: string) => Promise<void>;
}

export function CreateItineraryModal({ onClose, onCreate }: Props) {
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!title.trim()) return;
    setLoading(true);
    try {
      await onCreate(title.trim(), desc.trim());
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
        onClick={onClose}
      />
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] z-[101] slide-up">
        <div className="bg-[#161622] rounded-t-3xl border-t border-[#2a2a3e] p-5">
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-base font-black text-white">Create new trip</h3>
              <p className="text-xs text-[#555577] mt-0.5">Give it a name you'll remember</p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-[#1e1e2e] border border-[#2a2a3e] flex items-center justify-center"
            >
              <X className="w-4 h-4 text-[#9ca3af]" />
            </button>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-xs font-bold text-[#555577] mb-1.5 block tracking-wide">
                TRIP NAME *
              </label>
              <input
                value={title}
                onChange={e => setTitle(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleCreate()}
                placeholder="e.g. Mysore Weekend, Coorg Coffee Trail"
                maxLength={80}
                autoFocus
                className="w-full bg-[#0d0d16] border border-[#2a2a3e] rounded-xl px-4 py-3 text-sm text-white placeholder-[#555577] focus:border-[#7c3aed] focus:ring-1 focus:ring-[#7c3aed]/20 transition-all"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-[#555577] mb-1.5 block tracking-wide">
                DESCRIPTION <span className="text-[#3a3a5a]">optional</span>
              </label>
              <textarea
                value={desc}
                onChange={e => setDesc(e.target.value)}
                placeholder="What's this trip about?"
                rows={2}
                maxLength={300}
                className="w-full bg-[#0d0d16] border border-[#2a2a3e] rounded-xl px-4 py-3 text-sm text-white placeholder-[#555577] focus:border-[#7c3aed] focus:ring-1 focus:ring-[#7c3aed]/20 transition-all resize-none"
              />
            </div>
          </div>

          <button
            onClick={handleCreate}
            disabled={!title.trim() || loading}
            className="w-full mt-4 bg-[#7c3aed] disabled:opacity-40 text-white font-black py-3.5 rounded-2xl flex items-center justify-center gap-2 active:scale-[0.98] transition-all shadow-lg shadow-purple-900/30"
          >
            {loading
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating...</>
              : <><Plus className="w-4 h-4" /> Create trip</>
            }
          </button>

          {/* safe area */}
          <div className="h-4" />
        </div>
      </div>
    </>
  );
}
