'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export function LoadingSpinner() {
  const loadingText = 'درحال بارگذاری...';
  const colors = [
    'hsl(var(--primary))',
    'hsl(var(--accent))',
    'hsl(var(--secondary))',
    'hsl(var(--muted-foreground))',
  ];

  const containerVariants = {
    initial: { opacity: 0 },
    animate: {
      opacity: 1,
      transition: {
        duration: 0.3,
        ease: 'easeInOut',
      },
    },
    exit: {
        opacity: 0,
        transition: {
          duration: 0.3,
          ease: 'easeInOut',
        },
    }
  };

  const textVariants = {
    initial: { opacity: 0 },
    animate: { opacity: 1, transition: { duration: 0.5, delay: 0.5 } },
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/90 backdrop-blur-sm"
      variants={containerVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      <div className="relative h-28 w-28">
        {[...Array(4)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute inset-0 flex items-center justify-center"
            animate={{
              rotate: 360,
              scale: [1, 1.1, 1],
            }}
            transition={{
              loop: Infinity,
              duration: 8 + i * 2,
              ease: 'linear',
              delay: i * 0.2,
            }}
          >
            <div
              className={cn(
                'aspect-square rounded-lg border-2',
                'absolute'
              )}
              style={{
                width: `${75 - i * 18}%`,
                height: `${75 - i * 18}%`,
                borderColor: colors[i],
                transform: `rotate(${i * 20}deg)`,
                boxShadow: `0 0 10px ${colors[i]}, inset 0 0 10px ${colors[i]}`,
                opacity: 0.8
              }}
            />
          </motion.div>
        ))}
         <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-12 w-12 rounded-full bg-gradient-to-tr from-primary/10 via-accent/10 to-secondary/10 blur-xl"></div>
        </div>
      </div>
      <motion.p
        className="mt-8 text-lg font-medium text-foreground tracking-widest"
        variants={textVariants}
      >
        {loadingText}
      </motion.p>
    </motion.div>
  );
}
