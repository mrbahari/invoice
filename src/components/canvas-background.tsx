
'use client';

import React from 'react';
import { cn } from '@/lib/utils';

const CanvasBackground: React.FC = () => {
  return (
    <div
      className={cn(
        'fixed inset-0 -z-10 overflow-hidden',
        'bg-gradient-to-br from-background via-rose-50/20 to-teal-50/20 dark:via-rose-950/20 dark:to-teal-950/20',
        'animate-gradient-bg'
      )}
      style={{
        backgroundSize: '200% 200%',
      }}
    />
  );
};

export default CanvasBackground;
