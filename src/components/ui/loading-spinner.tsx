
'use client';

import { cn } from '@/lib/utils';

export function LoadingSpinner() {
  return (
    <div
      className={cn(
        'fixed inset-0 z-50 flex flex-col items-center justify-center bg-background',
        'bg-gradient-to-br from-blue-50/20 via-white to-green-50/20 dark:from-blue-950/10 dark:via-background dark:to-green-950/10'
      )}
      aria-live="polite"
      aria-busy="true"
    >
      <div className="relative flex h-40 w-40 items-center justify-center">
        {/* Outer Ring */}
        <div className="absolute h-full w-full animate-spin rounded-full [animation-duration:3s]">
          <div
            className={cn(
              'absolute -top-1/2 left-1/2 h-full w-full rounded-full',
              'bg-gradient-to-tr from-green-500/50 to-blue-500/50'
            )}
            style={{ clipPath: 'polygon(50% 50%, 0% 0%, 100% 0%)' }}
          ></div>
        </div>
        {/* Inner Pulsing Circle */}
        <div className="absolute h-28 w-28 rounded-full bg-background opacity-75"></div>
        <div className="absolute h-24 w-24 animate-pulse rounded-full bg-primary/10"></div>
        <div className="absolute flex h-20 w-20 items-center justify-center rounded-full bg-background shadow-inner">
          <span className="text-xl font-bold tracking-tight text-primary">
            حسابگر
          </span>
        </div>
      </div>
    </div>
  );
}
