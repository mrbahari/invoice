'use client';

import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export function LoadingSpinner() {
  
  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm"
      aria-live="polite"
      aria-busy="true"
    >
        <div className="flex items-center gap-4">
             <Loader2 className="h-10 w-10 animate-spin text-primary" />
             <p className="text-lg font-medium text-foreground tracking-wider">
                درحال بارگذاری...
            </p>
        </div>
    </div>
  );
}
