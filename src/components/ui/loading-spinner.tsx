'use client';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';

interface LoadingSpinnerProps {
  className?: string;
}

interface Position {
  x: number;
  y: number;
}

export function LoadingSpinner({ className }: LoadingSpinnerProps) {
  const [positions, setPositions] = useState<Position[]>([]);

  useEffect(() => {
    const newPositions: Position[] = [];
    const numCircles = 6;
    const radius = 48; // half of parent width/height minus circle radius

    for (let i = 0; i < numCircles; i++) {
      const angle = (i * 60) * (Math.PI / 180);
      const x = radius * Math.cos(angle);
      const y = radius * Math.sin(angle);
      newPositions.push({ x, y });
    }
    setPositions(newPositions);
  }, []);

  return (
    <div className={cn("relative flex h-32 w-32 items-center justify-center", className)}>
      <div className="absolute h-full w-full animate-spin-slow rounded-full border-4 border-dashed border-primary/50"></div>
      <div className="absolute h-28 w-28 animate-spin-slow rounded-full border-4 border-dashed border-primary/50 [animation-direction:reverse]"></div>
      
      {positions.map((pos, i) => (
        <div
          key={i}
          className="absolute h-4 w-4 rounded-full bg-primary/80 animate-fade-in-out"
          style={{
            transform: `translate(${pos.x}px, ${pos.y}px)`,
            animationDelay: `${i * 0.2}s`,
          }}
        ></div>
      ))}

      <div className="absolute text-sm font-semibold text-primary">
        درحال بارگذاری...
      </div>
    </div>
  );
}
