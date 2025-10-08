'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

// Define the interface for the SpeechRecognition API
interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: SpeechRecognitionErrorEvent) => void;
  onend: () => void;
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

// Extend the Window interface
declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognition;
    webkitSpeechRecognition?: new () => SpeechRecognition;
  }
}

interface UseSpeechRecognitionProps {
  onResult: (transcript: string) => void;
  onError?: (error: string) => void;
}

export function useSpeechRecognition({ onResult, onError }: UseSpeechRecognitionProps) {
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognitionAPI) {
      onError?.('مرورگر شما از قابلیت تشخیص گفتار پشتیبانی نمی‌کند.');
      return;
    }

    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'fa-IR';

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        }
      }
      if (finalTranscript) {
        onResult(finalTranscript.trim());
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      let errorMessage = event.error;
      if (event.error === 'network') {
        errorMessage = 'مشکل در شبکه. لطفاً اتصال اینترنت خود را بررسی کنید.';
      } else if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        errorMessage = 'اجازه دسترسی به میکروفون داده نشد.';
      }
      onError?.(errorMessage);
      setIsListening(false);
    };

    recognition.onend = () => {
      if (isListening) {
        // If it ends unexpectedly while still supposed to be listening, restart it.
        // This handles cases where the service times out.
        try {
            recognition.start();
        } catch (e) {
             // Already started
        }
      }
    };

    recognitionRef.current = recognition;

    // Cleanup
    return () => {
      recognition.stop();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startListening = useCallback(() => {
    if (recognitionRef.current && !isListening) {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (e) {
        console.error("Speech recognition could not be started: ", e);
        onError?.("امکان شروع تشخیص گفتار وجود نداشت.");
      }
    }
  }, [isListening, onError]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  }, [isListening]);

  return {
    isListening,
    startListening,
    stopListening,
    transcript: '', // Transcript is now passed via onResult callback
  };
}
