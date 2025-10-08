'use client';

import { useEffect } from 'react';

const useBeforeUnload = (enabled: boolean, message: string) => {
  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (enabled) {
        event.preventDefault();
        // Modern browsers show a generic message, but this is required for older ones.
        event.returnValue = message;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [enabled, message]);
};

export default useBeforeUnload;
