'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import CanvasBackground from '../canvas-background';

export function LoadingSpinner() {
  const loadingText = 'درحال بارگذاری...';

  const containerVariants = {
    initial: { opacity: 0 },
    animate: {
      opacity: 1,
      transition: {
        duration: 0.5,
        ease: 'easeInOut',
      },
    },
    exit: {
        opacity: 0,
        transition: {
          duration: 0.5,
          ease: 'easeInOut',
        },
    }
  };

  const textContainerVariants = {
    initial: {},
    animate: {
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.3,
      },
    },
  };

  const letterVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { 
      opacity: 1, 
      y: 0,
      transition: {
        ease: "circOut",
        duration: 0.5
      }
    },
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm"
      variants={containerVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      <CanvasBackground />
      <motion.p
        className="mt-8 text-lg font-medium text-foreground tracking-widest"
        variants={textContainerVariants}
        aria-label={loadingText}
      >
        {loadingText.split('').map((char, index) => (
          <motion.span
            key={index}
            variants={letterVariants}
            className="inline-block"
          >
            {char}
          </motion.span>
        ))}
      </motion.p>
    </motion.div>
  );
}
