"use client";

import { useCallback } from 'react';

type FeedbackType = 'success' | 'error' | 'page-turn';

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

    if (type === 'page-turn') {
        // A softer page turn sound
        const duration = 0.3;
        const now = context.currentTime;
        
        // White noise source
        const bufferSize = context.sampleRate * duration;
        const buffer = context.createBuffer(1, bufferSize, context.sampleRate);
        const output = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            output[i] = Math.random() * 2 - 1;
        }
        const noise = context.createBufferSource();
        noise.buffer = buffer;

        // Filter to shape the noise into a softer "swoosh"
        const bandpass = context.createBiquadFilter();
        bandpass.type = 'bandpass';
        bandpass.frequency.setValueAtTime(800, now); // Lower frequency for a softer sound
        bandpass.Q.setValueAtTime(0.8, now);

        // Gain for volume envelope
        const gain = context.createGain();
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.1, now + 0.02); // Slower attack, lower volume
        gain.gain.exponentialRampToValueAtTime(0.001, now + duration); // Gentle decay

        noise.connect(bandpass).connect(gain).connect(context.destination);
        noise.start(now);
        noise.stop(now + duration);

    } else {
        // --- Success/Error Tones ---
        const oscillator = context.createOscillator();
        const gainNode = context.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(context.destination);

        if (type === 'success') {
          oscillator.type = 'sine';
          oscillator.frequency.setValueAtTime(880, context.currentTime); // A5 note
          gainNode.gain.setValueAtTime(0.3, context.currentTime);
        } else { // error
          oscillator.type = 'square';
          oscillator.frequency.setValueAtTime(330, context.currentTime); // E4 note
          gainNode.gain.setValueAtTime(0.2, context.currentTime);
        }

        oscillator.start(context.currentTime);
        oscillator.stop(context.currentTime + 0.1);
    }
  }, []);

  return { playSound };
}
