import { Package2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  className?: string;
}

export function LoadingSpinner({ className }: LoadingSpinnerProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-4", className)}>
      <div className="relative h-24 w-24 animate-fade-in-scale">
        <Package2 className="h-full w-full text-primary animate-pulse-slow" />
      </div>
      <p className="text-lg text-muted-foreground animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
        در حال بارگذاری...
      </p>
    </div>
  );
}
