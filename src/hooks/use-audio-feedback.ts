"use client";

import { useCallback } from 'react';

type FeedbackType = 'success' | 'error';

// Singleton AudioContext to avoid creating multiple instances
let audioContext: AudioContext | null = null;

const getAudioContext = (): AudioContext | null => {
  if (typeof window === 'undefined') return null;
  if (!audioContext) {
    try {
      audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch (e) {
      console.error("Web Audio API is not supported in this browser.");
      return null;
    }
  }
  return audioContext;
};

/**
 * A hook to provide simple audio feedback using the Web Audio API.
 * This avoids the need for external audio files.
 */
export function useAudioFeedback() {
  const playSound = useCallback((type: FeedbackType) => {
    const context = getAudioContext();
    if (!context) return;

    // Ensure context is running (required by some browsers after user interaction)
    if (context.state === 'suspended') {
        context.resume();
    }

    const oscillator = context.createOscillator();
    const gainNode = context.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(context.destination);

    // Configure sound properties based on type
    if (type === 'success') {
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(880, context.currentTime); // A5 note
      gainNode.gain.setValueAtTime(0.3, context.currentTime);
    } else { // error
      oscillator.type = 'square';
      oscillator.frequency.setValueAtTime(330, context.currentTime); // E4 note
      gainNode.gain.setValueAtTime(0.2, context.currentTime);
    }

    // Play a very short tone
    oscillator.start(context.currentTime);
    oscillator.stop(context.currentTime + 0.1);

  }, []);

  return { playSound };
}
