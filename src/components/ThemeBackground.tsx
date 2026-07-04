'use client';

import React, { useMemo } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

interface ThemeBackgroundProps {
  theme: 'light' | 'luxury';
}

// Hand-drawn heart SVG paths to simulate natural sketches
const HEART_PATHS = {
  filled: "M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z",
  outline: "M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z",
  asymmetric: "M12 21c-0.2 0-0.4-0.1-0.6-0.2C5.8 15.9 2 12.5 2 8.5c0-3.3 2.5-6 5.8-6 1.8 0 3.5 0.9 4.2 2.2 0.7-1.3 2.4-2.2 4.2-2.2 3.3 0 5.8 2.7 5.8 6 0 4-3.8 7.4-9.4 12.3-0.2 0.1-0.4 0.2-0.6 0.2z",
};

interface HeartDoodle {
  id: number;
  x: number; // percentage
  y: number; // percentage
  scale: number;
  rotation: number;
  type: 'filled' | 'outline' | 'asymmetric';
  duration: number;
  delay: number;
}

export default function ThemeBackground({ theme }: ThemeBackgroundProps) {
  const shouldReduceMotion = useReducedMotion();

  // Color tokens
  const bgClass = theme === 'light' ? 'bg-[#F8F0BA]' : 'bg-[#5D0D18]';
  const heartColor = theme === 'light' ? 'text-[#5D0D18]/8' : 'text-[#F8F0BA]/10';

  // Seed coordinates for floating hearts, keeping them scattered with plenty of whitespace
  const heartDoodles = useMemo((): HeartDoodle[] => {
    return [
      { id: 1, x: 10, y: 15, scale: 0.8, rotation: -12, type: 'outline', duration: 18, delay: 0 },
      { id: 2, x: 85, y: 12, scale: 1.1, rotation: 15, type: 'filled', duration: 22, delay: 1 },
      { id: 3, x: 25, y: 75, scale: 0.7, rotation: 8, type: 'asymmetric', duration: 20, delay: 3 },
      { id: 4, x: 75, y: 80, scale: 0.9, rotation: -20, type: 'outline', duration: 25, delay: 2 },
      { id: 5, x: 5, y: 50, scale: 1.0, rotation: 5, type: 'filled', duration: 24, delay: 4 },
      { id: 6, x: 92, y: 45, scale: 0.75, rotation: -8, type: 'asymmetric', duration: 19, delay: 5 },
      { id: 7, x: 45, y: 88, scale: 0.9, rotation: 18, type: 'outline', duration: 26, delay: 1.5 },
      { id: 8, x: 55, y: 10, scale: 0.8, rotation: -5, type: 'filled', duration: 21, delay: 3.5 }
    ];
  }, []);

  return (
    <div className={`fixed inset-0 w-full h-full transition-colors duration-1000 overflow-hidden -z-50 ${bgClass}`}>
      {/* Texture overlay for paper/canvas grain */}
      <div 
        className="absolute inset-0 opacity-[0.015] pointer-events-none mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Floating Doodles */}
      {heartDoodles.map((doodle) => {
        const isOutline = doodle.type === 'outline';
        
        return (
          <motion.div
            key={doodle.id}
            className={`absolute select-none pointer-events-none ${heartColor}`}
            style={{
              left: `${doodle.x}%`,
              top: `${doodle.y}%`,
            }}
            initial={{ opacity: 0, scale: doodle.scale * 0.8 }}
            animate={{ 
              opacity: 1, 
              scale: doodle.scale,
              y: shouldReduceMotion ? 0 : [0, -15, 0],
              rotate: shouldReduceMotion ? doodle.rotation : [doodle.rotation, doodle.rotation + 4, doodle.rotation - 4, doodle.rotation],
            }}
            transition={{
              opacity: { duration: 1.5 },
              scale: { duration: 1.5 },
              y: {
                duration: doodle.duration,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: doodle.delay,
              },
              rotate: {
                duration: doodle.duration * 1.2,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: doodle.delay,
              }
            }}
          >
            <svg
              width="36"
              height="36"
              viewBox="0 0 24 24"
              className="transform origin-center"
            >
              {isOutline ? (
                <path
                  d={HEART_PATHS.outline}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              ) : (
                <path
                  d={HEART_PATHS[doodle.type === 'asymmetric' ? 'asymmetric' : 'filled']}
                  fill="currentColor"
                  stroke="currentColor"
                  strokeWidth="0.5"
                />
              )}
            </svg>
          </motion.div>
        );
      })}
    </div>
  );
}
