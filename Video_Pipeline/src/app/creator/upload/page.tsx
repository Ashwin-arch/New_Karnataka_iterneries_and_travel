"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Upload, X, CheckCircle2, CloudUpload, MapPin, Tag, ChevronDown, ArrowLeft, Loader2 } from "lucide-react";
import { uploadVideo, generateVideoPath } from "@/lib/cloudinary/upload";
import { useAuth } from "@/features/auth/AuthContext";
import { CATEGORIES, KARNATAKA_DISTRICTS, ALLOWED_VIDEO_TYPES, MAX_VIDEO_SIZE } from "@/constants";
import { cn } from "@/lib/utils";


type Step = "pick" | "details" | "uploading" | "done";

const inputCls = "w-full bg-[#0d0d16] border border-[#2a2a3e] rounded-xl px-4 py-3 text-sm text-white placeholder-[#555577] focus:border-[#7c3aed] focus:ring-1 focus:ring-[#7c3aed]/30 transition-all";

export default function UploadPage() {
  const router = useRouter();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<Step>("pick");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [form, setForm] = useState({
    title: "", description: "", category: "",
    placeName: "", district: "", latitude: "", longitude: "", tags: "",
  });

  const handleFile = (f: File) => {
    setError("");
    if (!ALLOWED_VIDEO_TYPES.includes(f.type)) { setError("Only MP4, MOV, or WEBM files allowed"); return; }
    if (f.size > MAX_VIDEO_SIZE) { setError("Video must be under 200MB"); return; }
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setStep("details");
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false);
    const f = e.dataTransfer.files[0]; if (f) handleFile(f);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    console.log("handleSubmit called in Creator Upload");
    e.preventDefault();
    if (!file || !user) return;
    console.log("User:", user);
    setError("");
    const req = ["title","description","category","placeName","district"];
    for (const k of req) {
      if (!form[k as keyof typeof form]?.trim()) { setError(`${k.charAt(0).toUpperCase() + k.slice(1)} is required`); return; }
    }
    setStep("uploading");
    try {
      const path = generateVideoPath(user.id, file.name);
      const { downloadURL, publicId } = await uploadVideo(file, path, setProgress);
      const thumbnail_url = downloadURL.replace(/\.[^/.]+$/, ".jpg");

      const res = await fetch("/api/videos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          tags: form.tags.split(",").map(t => t.trim()).filter(Boolean),
          videoUrl: downloadURL,
          cloudinaryPublicId: publicId,
          thumbnailUrl: thumbnail_url,
          latitude: form.latitude ? parseFloat(form.latitude) : undefined,
          longitude: form.longitude ? parseFloat(form.longitude) : undefined,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setStep("done");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Upload failed. Try again.");
      setStep("details");
    }
  };

  const reset = () => { setStep("pick"); setFile(null); setPreview(null); setProgress(0); setError(""); setForm({ title:"",description:"",category:"",placeName:"",district:"",latitude:"",longitude:"",tags:"" }); };

  if (step === "done") {
    return (
      <div className="min-h-dvh bg-[#0d0d16] flex flex-col items-center justify-center px-8 text-center">
        <div className="w-24 h-24 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-6">
          <CheckCircle2 className="w-12 h-12 text-emerald-400" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Uploaded!</h2>
        <p className="text-sm text-[#9ca3af] mb-1">Your story is under review.</p>
        <p className="text-xs text-[#555577] mb-8">It appears in the feed once approved by our team.</p>
        <div className="flex flex-col gap-3 w-full">
          <button onClick={() => router.push("/creator/content")} className="w-full bg-[#7c3aed] text-white font-bold py-3.5 rounded-2xl">View my videos</button>
          <button onClick={reset} className="w-full bg-[#161622] border border-[#2a2a3e] text-white font-semibold py-3.5 rounded-2xl">Upload another</button>
        </div>
      </div>
    );
  }

  if (step === "uploading") {
    return (
      <div className="min-h-dvh bg-[#0d0d16] flex flex-col items-center justify-center px-8 text-center">
        <div className="w-24 h-24 rounded-3xl bg-[#7c3aed]/10 border border-[#7c3aed]/20 flex items-center justify-center mb-6">
          <Upload className="w-10 h-10 text-[#a78bfa]" />
        </div>
        <h2 className="text-xl font-bold text-white mb-1">Uploading to Cloudinary</h2>
        <p className="text-3xl font-black text-[#7c3aed] my-4">{progress}%</p>
        <div className="w-full bg-[#1e1e2e] rounded-full h-3 mb-4 overflow-hidden">
          <div
            className="bg-gradient-to-r from-[#7c3aed] to-[#a78bfa] h-full rounded-full transition-all duration-200"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-xs text-[#555577]">Don&apos;t close this tab</p>
      </div>
    );
  }

  if (step === "pick") {
    return (
      <div className="min-h-dvh bg-[#0d0d16] flex flex-col">
        <div className="flex items-center gap-3 px-4 pt-14 pb-5">
          <button onClick={() => router.back()} className="w-9 h-9 rounded-xl bg-[#161622] flex items-center justify-center">
            <ArrowLeft className="w-4 h-4 text-white" />
          </button>
          <h1 className="text-lg font-bold text-white">Upload story</h1>
        </div>
        {error && <div className="mx-4 mb-4 bg-rose-500/10 border border-rose-500/30 rounded-xl px-4 py-3 text-sm text-rose-400">{error}</div>}
        <div className="flex-1 flex flex-col items-center justify-center px-6 pb-28">
          <div
            onDrop={handleDrop}
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              "w-full rounded-3xl border-2 border-dashed flex flex-col items-center justify-center gap-5 transition-all cursor-pointer p-10",
              dragOver ? "border-[#7c3aed] bg-[#7c3aed]/8" : "border-[#2a2a3e] bg-[#161622]/50 hover:border-[#7c3aed]/50"
            )}
            style={{ minHeight: "55dvh" }}
          >
            <div className="w-20 h-20 rounded-3xl bg-[#7c3aed]/10 border border-[#7c3aed]/20 flex items-center justify-center">
              <CloudUpload className="w-10 h-10 text-[#a78bfa]" />
            </div>
            <div className="text-center">
              <p className="text-white font-bold text-base mb-1">Tap to upload video</p>
              <p className="text-sm text-[#555577]">MP4, MOV, WEBM · max 200MB</p>
              <p className="text-xs text-[#555577] mt-0.5">Vertical 9:16 works best</p>
            </div>
            <div className="bg-[#7c3aed] rounded-2xl px-6 py-3">
              <span className="text-sm font-bold text-white">Choose file</span>
            </div>
          </div>
          <input ref={fileInputRef} type="file" accept="video/mp4,video/quicktime,video/webm" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
        </div>
        
      </div>
    );
  }

  // Details form
  return (
    <div className="min-h-dvh bg-[#0d0d16] overflow-y-auto">
      <div className="flex items-center gap-3 px-4 pt-14 pb-4 border-b border-[#1e1e2e] sticky top-0 bg-[#0d0d16] z-10">
        <button onClick={() => { setStep("pick"); setFile(null); setPreview(null); }} className="w-9 h-9 rounded-xl bg-[#161622] flex items-center justify-center">
          <ArrowLeft className="w-4 h-4 text-white" />
        </button>
        <h1 className="text-lg font-bold text-white flex-1">Story details</h1>
      </div>

      {/* File preview */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-[#1e1e2e] bg-[#161622]">
        {preview && (
          <div className="w-14 h-20 rounded-xl overflow-hidden flex-shrink-0 relative">
            <video src={preview} className="w-full h-full object-cover" muted />
            <button onClick={() => { setStep("pick"); setFile(null); setPreview(null); }} className="absolute top-1 right-1 w-4 h-4 rounded-full bg-black/60 flex items-center justify-center">
              <X className="w-2.5 h-2.5 text-white" />
            </button>
          </div>
        )}
        <div>
          <p className="text-sm font-semibold text-white truncate max-w-[220px]">{file?.name}</p>
          <p className="text-xs text-[#555577] mt-0.5">{file ? `${(file.size / 1024 / 1024).toFixed(1)} MB` : ""}</p>
        </div>
      </div>

      {error && <div className="mx-4 mt-3 bg-rose-500/10 border border-rose-500/30 rounded-xl px-4 py-3 text-sm text-rose-400">{error}</div>}

      <form onSubmit={handleSubmit} className="px-4 py-4 space-y-4 pb-32">
        <Field label="Title *">
          <input value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="e.g. Hidden waterfall in Coorg" maxLength={100} className={inputCls} />
        </Field>
        <Field label="Description *">
          <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Tell the story behind this place..." rows={3} maxLength={500} className={inputCls + " resize-none"} />
        </Field>
        <Field label="Category *">
          <div className="relative">
            <select value={form.category} onChange={e => setForm({...form, category: e.target.value})} className={inputCls + " appearance-none pr-10"}>
              <option value="">Select category</option>
              {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.emoji} {c.label}</option>)}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#555577] pointer-events-none" />
          </div>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Place name *">
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#555577]" />
              <input value={form.placeName} onChange={e => setForm({...form, placeName: e.target.value})} placeholder="Jog Falls" className={inputCls + " pl-9"} />
            </div>
          </Field>
          <Field label="District *">
            <div className="relative">
              <select value={form.district} onChange={e => setForm({...form, district: e.target.value})} className={inputCls + " appearance-none pr-8"}>
                <option value="">Select</option>
                {KARNATAKA_DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-[#555577] pointer-events-none" />
            </div>
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Latitude (optional)">
            <input type="number" step="any" value={form.latitude} onChange={e => setForm({...form, latitude: e.target.value})} placeholder="12.9716" className={inputCls} />
          </Field>
          <Field label="Longitude (optional)">
            <input type="number" step="any" value={form.longitude} onChange={e => setForm({...form, longitude: e.target.value})} placeholder="77.5946" className={inputCls} />
          </Field>
        </div>
        <Field label="Tags (comma separated)">
          <div className="relative">
            <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#555577]" />
            <input value={form.tags} onChange={e => setForm({...form, tags: e.target.value})} placeholder="monsoon, hidden gem, waterfall" className={inputCls + " pl-9"} />
          </div>
        </Field>
        <div className="bg-amber-500/8 border border-amber-500/15 rounded-xl p-3.5 flex gap-2.5">
          <Loader2 className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-amber-300/90 leading-relaxed">Your video will be reviewed before appearing in the feed. Usually 24–48 hours.</p>
        </div>
        <button type="submit" className="w-full bg-[#7c3aed] hover:bg-[#6d28d9] active:scale-[0.98] text-white font-bold py-4 rounded-2xl transition-all flex items-center justify-center gap-2">
          <Upload className="w-5 h-5" />
          Submit for review
        </button>
      </form>
      
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs font-semibold text-[#555577] mb-1.5 block">{label}</label>
      {children}
    </div>
  );
}
