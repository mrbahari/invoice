"use client"

import { useAudioFeedback } from './use-audio-feedback';
import type { ToastProps } from "@/components/ui/toast";

type Toast = Omit<ToastProps, "id"> & {
  title?: React.ReactNode
  description?: React.ReactNode
  action?: React.ReactElement<any, string | React.JSXElementConstructor<any>>
}

function toast(props: Toast) {
  const { playSound } = useAudioFeedback();
  
  // Immediately play the sound based on the variant
  // This is a "headless" toast system now, only providing audio feedback.
  if (props.variant === 'destructive') {
    playSound('error');
  } else {
    playSound('success');
  }

  // We still return a dismiss function for API compatibility, though it does nothing.
  return {
    id: `toast-${Date.now()}`,
    dismiss: () => {},
    update: () => {},
  }
}

// The useToast hook now simply provides the toast function.
// It no longer manages a state of visible toasts.
function useToast() {
  const { playSound } = useAudioFeedback();

  const toastFn = (props: Toast) => {
    if (props.variant === 'destructive') {
        playSound('error');
    } else {
        playSound('success');
    }
  };

  return {
    toasts: [], // Return an empty array as there are no visual toasts
    toast: toastFn,
    dismiss: () => {}, // No-op dismiss function
  }
}


export { useToast, toast }
