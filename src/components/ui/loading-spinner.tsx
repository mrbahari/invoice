
'use client';

import { motion } from 'framer-motion';

export function LoadingSpinner() {
  const loadingText = 'درحال بارگذاری...';

  const containerVariants = {
    initial: { opacity: 0 },
    animate: {
      opacity: 1,
      transition: {
        duration: 0.5,
      },
    },
  };

  const textVariants = {
    initial: { opacity: 0, y: 10 },
    animate: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        delay: 0.2,
      },
    },
  };

  const barContainerVariants = {
    animate: {
      transition: {
        staggerChildren: 0.1,
      },
    },
  };
  
  const barVariants = {
    animate: (i: number) => ({
      scaleY: [1, 1.5, 1],
      transition: {
        duration: 1,
        repeat: Infinity,
        ease: 'easeInOut',
        delay: i * 0.1,
      },
    }),
  };


  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background"
      variants={containerVariants}
      initial="initial"
      animate="animate"
      exit="initial"
    >
      <motion.div 
        className="flex items-end h-12 gap-1.5"
        variants={barContainerVariants}
        initial="initial"
        animate="animate"
      >
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            className="w-3 bg-primary rounded-full"
            style={{ height: `${(i === 2 ? 32 : (i === 1 || i === 3) ? 24 : 16)}px` }}
            variants={barVariants}
            custom={i}
          />
        ))}
      </motion.div>
      <motion.p
        className="mt-6 text-lg font-medium text-foreground tracking-wider"
        variants={textVariants}
      >
        {loadingText}
      </motion.p>
    </motion.div>
  );
}
