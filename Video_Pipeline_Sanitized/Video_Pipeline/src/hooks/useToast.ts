"use client";
import { useState, useCallback } from "react";
import { ToastItem } from "@/components/ui/Toast";

export function useToast() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const addToast = useCallback((message: string, type: ToastItem["type"] = "info") => {
    const id = Math.random().toString(36).slice(2);
    setToasts(p => [...p, { id, message, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3500);
  }, []);

  const removeToast = useCallback((id: string) => setToasts(p => p.filter(t => t.id !== id)), []);

  return {
    toasts,
    removeToast,
    toast: {
      success: (m: string) => addToast(m, "success"),
      error:   (m: string) => addToast(m, "error"),
      info:    (m: string) => addToast(m, "info"),
    },
  };
}
