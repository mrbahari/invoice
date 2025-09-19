"use client"

import { ToastProvider, ToastViewport } from "@/components/ui/toast"

// The Toaster component no longer needs to render any toasts,
// as the useToast hook now handles audio-only feedback.
// It remains in the layout for structural consistency and potential future use.
export function Toaster() {
  return (
    <ToastProvider>
      <ToastViewport />
    </ToastProvider>
  )
}
