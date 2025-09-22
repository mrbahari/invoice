'use client';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  className?: string;
}

export function LoadingSpinner({ className }: LoadingSpinnerProps) {
  return (
    <div className={cn("relative flex flex-col items-center justify-center gap-8", className)}>
      <div className="relative h-24 w-24">
        {/* The faint background track */}
        <div className="absolute inset-0 rounded-full border-4 border-primary/20"></div>
        {/* The moving foreground arc */}
        <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-primary animate-spin"></div>
      </div>
      <div className="text-lg font-semibold text-primary">
        درحال بارگذاری...
      </div>
    </div>
  );
}
