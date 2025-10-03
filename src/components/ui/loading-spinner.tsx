'use client';

import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

interface Particle {
  id: number;
  x: string;
  y: string;
  scale: number;
  opacity: number;
  duration: number;
}

const createParticle = (i: number): Particle => ({
  id: i,
  x: `${Math.random() * 100}vw`,
  y: `${Math.random() * 100}vh`,
  scale: Math.random() * 0.5 + 0.5,
  opacity: Math.random() * 0.5,
  duration: Math.random() * 10 + 20,
});


export function LoadingSpinner() {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    // Generate particles only on the client side to prevent hydration mismatch
    const initialParticles = Array.from({ length: 50 }).map((_, i) => createParticle(i));
    setParticles(initialParticles);
  }, []);

  return (
    <div
      className={cn(
        'fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden',
        'bg-gradient-to-br from-gray-900 via-cyan-900 to-gray-900 text-white'
      )}
      aria-live="polite"
      aria-busy="true"
    >
      {/* Particle Background */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        {particles.map((particle) => (
          <motion.div
            key={particle.id}
            className="absolute rounded-full bg-cyan-400/30"
            initial={{ 
              x: particle.x, 
              y: particle.y,
              scale: particle.scale,
              opacity: particle.opacity
            }}
            animate={{
              x: `${Math.random() * 100}vw`,
              y: `${Math.random() * 100}vh`,
            }}
            transition={{
              duration: particle.duration,
              repeat: Infinity,
              repeatType: 'mirror',
              ease: 'easeInOut'
            }}
            style={{
                width: `${Math.random() * 3 + 1}px`,
                height: `${Math.random() * 3 + 1}px`,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center gap-8">
        {/* Main animated element */}
        <div className="relative h-48 w-48" style={{ perspective: '1000px' }}>
          {/* Orbiting Numbers */}
          <motion.div
            className="absolute inset-0"
            animate={{ rotate: 360 }}
            transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
          >
            {Array.from({ length: 10 }).map((_, i) => (
              <motion.span
                key={i}
                className="absolute text-cyan-400/80 font-mono text-lg"
                style={{
                  top: '50%',
                  left: '50%',
                  transform: `translate(-50%, -50%) rotate(${i * 36}deg) translateY(-80px)`,
                }}
              >
                {i}
              </motion.span>
            ))}
          </motion.div>
          
           <motion.div
            className="absolute inset-0"
            animate={{ rotate: -360 }}
            transition={{ duration: 45, repeat: Infinity, ease: 'linear' }}
          >
            {Array.from({ length: 10 }).map((_, i) => (
              <motion.span
                key={i}
                className="absolute text-green-400/60 font-mono text-sm"
                style={{
                  top: '50%',
                  left: '50%',
                  transform: `translate(-50%, -50%) rotate(${i * 36}deg) translateY(-60px)`,
                }}
              >
                {i}
              </motion.span>
            ))}
          </motion.div>


          {/* Central Logo */}
          <motion.div
            className="absolute inset-0 flex items-center justify-center rounded-full"
            style={{ transformStyle: 'preserve-3d' }}
             animate={{ rotateY: 360 }}
             transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
          >
            <div className="flex h-32 w-32 items-center justify-center rounded-full bg-gray-900/50 shadow-[0_0_25px_theme(colors.cyan.500),inset_0_0_15px_theme(colors.green.900)] backdrop-blur-sm">
              <span className="text-3xl font-bold tracking-tight text-cyan-300" style={{ textShadow: '0 0 10px hsl(var(--primary))' }}>
                حسابگر
              </span>
            </div>
          </motion.div>
        </div>

        {/* Text and Progress Bar */}
        <div className="flex flex-col items-center gap-4">
          <p className="text-lg font-medium tracking-wider text-cyan-200/80" style={{ textShadow: '0 0 5px hsl(var(--primary)/0.5)' }}>
            سیستم حسابداری هوشمند
          </p>
          <div className="h-1 w-40 overflow-hidden rounded-full bg-cyan-900/50">
            <motion.div
              className="h-full bg-gradient-to-r from-green-500 to-cyan-400"
              initial={{ x: '-100%' }}
              animate={{ x: '100%' }}
              transition={{
                duration: 2,
                repeat: Infinity,
                repeatType: 'loop',
                ease: 'linear',
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
