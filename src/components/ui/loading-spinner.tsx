
'use client';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  className?: string;
}

export function LoadingSpinner({ className }: LoadingSpinnerProps) {
  return (
    <div className={cn("relative flex h-32 w-32 items-center justify-center", className)}>
      <div className="absolute h-full w-full animate-spin-slow rounded-full border-4 border-dashed border-primary/50"></div>
      <div className="absolute h-28 w-28 animate-spin-slow rounded-full border-4 border-dashed border-primary/50 [animation-direction:reverse]"></div>
      
      {[...Array(6)].map((_, i) => {
        const angle = (i * 60) * (Math.PI / 180);
        const radius = 48; // half of parent width/height minus circle radius
        const x = radius * Math.cos(angle);
        const y = radius * Math.sin(angle);
        return (
          <div
            key={i}
            className="absolute h-4 w-4 rounded-full bg-primary/80 animate-fade-in-out"
            style={{
              transform: `translate(${x}px, ${y}px)`,
              animationDelay: `${i * 0.2}s`,
            }}
          ></div>
        );
      })}

      <div className="absolute text-sm font-semibold text-primary">
        درحال بارگذاری...
      </div>
    </div>
  );
}
