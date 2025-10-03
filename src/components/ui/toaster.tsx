
"use client"

import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"
import { useToast } from "@/hooks/use-toast"
import { CheckCircle, AlertCircle, Info } from 'lucide-react'


const ICONS = {
  default: <Info className="h-5 w-5 text-sky-500" />,
  destructive: <AlertCircle className="h-5 w-5 text-destructive" />,
  success: <CheckCircle className="h-5 w-5 text-green-500" />,
}

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, variant, ...props }) {
        const Icon = variant ? (ICONS[variant] || ICONS.default) : ICONS.default;

        return (
          <Toast key={id} variant={variant} {...props} duration={2500}>
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">
                  {Icon}
              </div>
              <div className="grid gap-1 flex-grow">
                {title && <ToastTitle>{title}</ToastTitle>}
                {description && (
                  <ToastDescription>{description}</ToastDescription>
                )}
              </div>
              {action}
            </div>
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
