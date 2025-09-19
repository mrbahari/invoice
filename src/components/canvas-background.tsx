
'use client';

import React, { useRef, useEffect } from 'react';

const CanvasBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    window.addEventListener('resize', () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    });

    const particles: Particle[] = [];
    const particleCount = 80;
    const connectDistance = 100;

    class Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;

      constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
        this.vx = Math.random() * 2 - 1;
        this.vy = Math.random() * 2 - 1;
        this.radius = Math.random() * 2 + 1;
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;

        if (this.x < 0 || this.x > width) this.vx *= -1;
        if (this.y < 0 || this.y > height) this.vy *= -1;
      }

      draw() {
        ctx!.beginPath();
        ctx!.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx!.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx!.fill();
      }
    }

    function createParticles() {
      for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle(Math.random() * width, Math.random() * height));
      }
    }

    function connectParticles() {
        for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
                const dx = particles[i].x - particles[j].x;
                const dy = particles[i].y - particles[j].y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < connectDistance) {
                    const opacity = 1 - distance / connectDistance;
                    ctx!.beginPath();
                    ctx!.moveTo(particles[i].x, particles[i].y);
                    ctx!.lineTo(particles[j].x, particles[j].y);
                    ctx!.strokeStyle = `rgba(255, 255, 255, ${opacity * 0.5})`;
                    ctx!.lineWidth = 1;
                    ctx!.stroke();
                }
            }
        }
    }
    
    function animate() {
      ctx!.clearRect(0, 0, width, height);

      for (const particle of particles) {
        particle.update();
        particle.draw();
      }
      
      connectParticles();
      requestAnimationFrame(animate);
    }

    createParticles();
    animate();
    
    // Cleanup function
    return () => {
        window.removeEventListener('resize', () => {});
    }

  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute top-0 left-0 w-full h-full"
      style={{ 
          background: 'linear-gradient(to bottom, hsl(var(--background-hsl)), hsl(var(--primary-hsl) / 0.2))',
          filter: 'blur(1px)'
      }}
    />
  );
};

export default CanvasBackground;
