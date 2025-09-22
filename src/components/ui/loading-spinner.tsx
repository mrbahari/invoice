'use client';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  className?: string;
}

export function LoadingSpinner({ className }: LoadingSpinnerProps) {
  return (
    <div className={cn("relative flex flex-col items-center justify-center gap-8", className)}>
      <div className="flex items-center justify-center space-x-2">
        <div className="h-10 w-2 animate-wave rounded-full bg-primary" style={{ animationDelay: '0s' }}></div>
        <div className="h-10 w-2 animate-wave rounded-full bg-primary" style={{ animationDelay: '0.1s' }}></div>
        <div className="h-10 w-2 animate-wave rounded-full bg-primary" style={{ animationDelay: '0.2s' }}></div>
        <div className="h-10 w-2 animate-wave rounded-full bg-primary" style={{ animationDelay: '0.3s' }}></div>
        <div className="h-10 w-2 animate-wave rounded-full bg-primary" style={{ animationDelay: '0.4s' }}></div>
      </div>
      <div className="text-lg font-semibold text-primary">
        درحال بارگذاری...
      </div>
    </div>
  );
}
