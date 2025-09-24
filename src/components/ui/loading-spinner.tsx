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
        ease: 'easeInOut',
      },
    },
    exit: {
      opacity: 0,
      transition: {
        duration: 0.5,
        ease: 'easeInOut',
      },
    },
  };
  
  const textVariants = {
    initial: { opacity: 0 },
    animate: { 
        opacity: 1,
        transition: {
            duration: 0.8,
            delay: 0.5,
        }
    },
  };

  const barContainerVariants = {
    initial: {},
    animate: {
      transition: {
        staggerChildren: 0.1,
        staggerDirection: 1,
      },
    },
  };

  const barVariants = {
    initial: { y: '100%' },
    animate: {
      y: ['100%', '0%', '100%'],
      transition: {
        duration: 1.5,
        ease: 'easeInOut',
        repeat: Infinity,
      },
    },
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background"
      variants={containerVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      <motion.div 
        className="flex items-end h-12 w-24 gap-1"
        variants={barContainerVariants}
      >
        {[...Array(5)].map((_, i) => (
           <div key={i} className="w-3 h-full overflow-hidden bg-background">
                <motion.div
                    className="w-full h-full bg-primary"
                    variants={barVariants}
                    transition={{ ...barVariants.transition, delay: i * 0.15 }}
                />
           </div>
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
