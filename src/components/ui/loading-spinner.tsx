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

  const loadingContainerVariants = {
    start: {
      transition: {
        staggerChildren: 0.1,
      },
    },
    end: {
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const loadingCircleVariants = {
    start: {
      y: "0%",
    },
    end: {
      y: "100%",
    },
  };

  const loadingCircleTransition = {
    duration: 0.4,
    repeat: Infinity,
    repeatType: "reverse" as const,
    ease: "easeInOut",
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
        className="flex justify-around w-20 h-10"
        variants={loadingContainerVariants}
        initial="start"
        animate="end"
      >
        {[...Array(5)].map((_, i) => (
           <motion.span
            key={i}
            className="block w-3 h-full bg-primary rounded-full"
            variants={loadingCircleVariants}
            transition={{ ...loadingCircleTransition, delay: i * 0.1 }}
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
