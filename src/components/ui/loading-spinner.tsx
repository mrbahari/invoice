
'use client';

import { motion } from 'framer-motion';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.5,
      ease: 'easeInOut',
    },
  },
};

const textContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const letterVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
  },
};

export function LoadingSpinner() {
  const loadingText = 'درحال بارگذاری...';

  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gray-900"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      exit="hidden"
    >
      <div className="relative h-24 w-24">
        <motion.div
          className="absolute inset-0 rounded-full border-4 border-t-transparent border-l-transparent"
          style={{
            borderRightColor: '#3b82f6', // blue-500
            borderBottomColor: '#a855f7', // purple-500
          }}
          animate={{ rotate: 360 }}
          transition={{
            loop: Infinity,
            duration: 1.2,
            ease: 'linear',
          }}
        />
        <motion.div
          className="absolute inset-2 rounded-full border-4 border-b-transparent border-r-transparent"
          style={{
            borderLeftColor: '#ec4899', // pink-500
            borderTopColor: '#8b5cf6', // violet-500
          }}
          animate={{ rotate: -360 }}
          transition={{
            loop: Infinity,
            duration: 0.8,
            ease: 'linear',
          }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-16 w-16 rounded-full bg-gradient-to-tr from-blue-500/10 via-purple-500/10 to-pink-500/10 blur-lg"></div>
        </div>
      </div>
      <motion.div
        className="mt-6 flex overflow-hidden text-lg font-medium text-gray-300"
        variants={textContainerVariants}
        initial="hidden"
        animate="visible"
      >
        {loadingText.split('').map((char, index) => (
          <motion.span key={index} variants={letterVariants} className={char === ' ' ? 'w-2' : ''}>
            {char}
          </motion.span>
        ))}
      </motion.div>
    </motion.div>
  );
}
