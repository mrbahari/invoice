
'use client';

import { useEffect, useRef } from 'react';
import { useUser } from '@/firebase';

export function VisitorTracker() {
  const { user } = useUser();
  const hasTracked = useRef(false);

  useEffect(() => {
    // Only run this on the client and only once per session
    if (typeof window === 'undefined' || hasTracked.current) {
      return;
    }

    const trackVisit = async () => {
      try {
        const screenResolution = `${window.screen.width}x${window.screen.height}`;
        const userAgent = navigator.userAgent;

        await fetch('/api/track', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: user?.uid,
            screenResolution,
            userAgent,
          }),
        });

        hasTracked.current = true;
      } catch (error) {
        console.error('Failed to track visitor:', error);
      }
    };

    // Use a timeout to avoid blocking the main thread during initial render
    const timer = setTimeout(trackVisit, 1000);

    return () => clearTimeout(timer);
  }, [user]);

  // This component does not render anything
  return null;
}
