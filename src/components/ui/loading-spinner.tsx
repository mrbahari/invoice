
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  className?: string;
}

export function LoadingSpinner({ className }: LoadingSpinnerProps) {
  return (
    <div className={cn("relative h-28 w-28", className)}>
        <div className="absolute inset-0 border-4 border-primary/20 rounded-full"></div>
        <div 
            className="absolute inset-0 border-4 border-t-primary rounded-full animate-spin"
            style={{ animationDuration: '1.5s' }}
        ></div>
        <div 
            className="absolute inset-3 border-2 border-primary/40 rounded-full animate-spin-reverse"
            style={{ animationDuration: '2s' }}
        ></div>
         <div 
            className="absolute inset-6 border-2 border-t-primary/80 rounded-full animate-spin"
            style={{ animationDuration: '1s' }}
        ></div>
    </div>
  );
}
