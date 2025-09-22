'use client';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  className?: string;
}

export function LoadingSpinner({ className }: LoadingSpinnerProps) {
  return (
    <div className={cn("relative flex flex-col items-center justify-center gap-8", className)}>
      <div className="relative h-28 w-28">
        <div className="absolute inset-0 bg-primary/80 rounded-full animate-morph" />
      </div>
      <div className="text-lg font-semibold text-primary">
        درحال بارگذاری...
      </div>
    </div>
  );
}
