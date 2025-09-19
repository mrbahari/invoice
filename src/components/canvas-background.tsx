
'use client';

import React from 'react';
import { cn } from '@/lib/utils';

const CanvasBackground: React.FC = () => {
  return (
    <div className="fixed inset-0 -z-10 h-full w-full bg-background">
      <div className="relative h-full w-full">
        <div
          className={cn(
            'absolute -top-40 -right-40 h-[300px] w-[300px] md:h-[500px] md:w-[500px] rounded-full bg-rose-500/10 dark:bg-rose-500/5',
            'mix-blend-multiply filter blur-3xl opacity-70 animate-blob'
          )}
        ></div>
        <div
          className={cn(
            'absolute -bottom-40 -left-20 h-[300px] w-[300px] md:h-[500px] md:w-[500px] rounded-full bg-purple-500/10 dark:bg-purple-500/5',
            'mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000'
          )}
          style={{ animationDelay: '2s' }}
        ></div>
        <div
          className={cn(
            'absolute -bottom-40 -right-20 h-[300px] w-[300px] md:h-[400px] md:w-[400px] rounded-full bg-teal-500/10 dark:bg-teal-500/5',
            'mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-4000'
          )}
           style={{ animationDelay: '4s' }}
        ></div>
      </div>
    </div>
  );
};

export default CanvasBackground;
