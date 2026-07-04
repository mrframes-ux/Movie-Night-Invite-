'use client';

import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';

interface LetterProps {
  partnerName: string;
  senderName: string;
  letterText: string;
  theme: 'light' | 'luxury';
  isUnfolded: boolean;
  streamingUrl: string;
}

export default function Letter({ 
  partnerName, 
  senderName, 
  letterText, 
  theme, 
  isUnfolded,
  streamingUrl
}: LetterProps) {
  const shouldReduceMotion = useReducedMotion();

  // Clean the text to handle linebreaks properly
  const formattedText = letterText || "Hey you,\nLet's watch a movie together and have a cozy night.\nNo expectations, just us.";

  // Dynamic CSS variables for the themes
  const paperBg = '#FAF8F5'; // Warm cream paper
  const textColor = '#3A0E13'; // Deep burgundy typography
  const btnBg = theme === 'light' ? '#7E1925' : '#62111A';
  const btnHoverBg = theme === 'light' ? '#8C202E' : '#731622';
  const accentColor = theme === 'light' ? '#C5A059' : '#D4AF37';

  // Fold animation variants
  const panelVariants = {
    folded: {
      rotateX: -90,
      opacity: 0.3,
      transition: { duration: 0.5 }
    },
    unfolded: {
      rotateX: 0,
      opacity: 1,
      transition: { 
        type: 'spring' as const, 
        stiffness: 70, 
        damping: 15,
        duration: 0.8 
      }
    }
  };

  const handleStartMovie = () => {
    if (typeof window !== 'undefined') {
      window.open(streamingUrl || 'https://netflix.com', '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="w-full flex flex-col items-center select-none" style={{ perspective: '1200px' }}>
      {/* Container with shadow underneath the letter */}
      <motion.div 
        className="w-full max-w-[340px] sm:max-w-[360px] rounded-lg shadow-2xl relative overflow-hidden"
        style={{ 
          backgroundColor: paperBg,
          color: textColor,
          boxShadow: '0 15px 35px rgba(0,0,0,0.15)'
        }}
        initial={{ height: 180 }}
        animate={isUnfolded ? { height: 'auto' } : { height: 180 }}
        transition={{ duration: 0.8, ease: [0.25, 1, 0.5, 1] }}
      >
        {/* Paper texture overlay */}
        <div 
          className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-overlay"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          }}
        />

        {/* Outer border */}
        <div className="p-6 h-full flex flex-col justify-between border border-[#EBE6DD] rounded-lg">
          
          {/* Header Panel */}
          <div className="mb-4">
            <p className="font-serif italic text-xs tracking-wider opacity-60 mb-2">Dear,</p>
            <h3 className="font-serif text-lg tracking-widest uppercase font-medium" style={{ color: accentColor }}>
              {partnerName || "My Love"}
            </h3>
          </div>

          {/* Letter Content & Folds */}
          <div className="relative">
            {/* The folded letter effect */}
            <motion.div
              className="origin-top"
              initial={shouldReduceMotion ? { opacity: 0 } : "folded"}
              animate={isUnfolded ? "unfolded" : shouldReduceMotion ? { opacity: 0 } : "folded"}
              variants={panelVariants}
            >
              {/* Paper Fold Lines (subtle gradient lines crossing the letter horizontally) */}
              <div className="absolute top-1/3 left-0 right-0 h-px bg-black/[0.04] shadow-[0_1px_1px_rgba(255,255,255,0.8)] pointer-events-none" />
              <div className="absolute top-2/3 left-0 right-0 h-px bg-black/[0.04] shadow-[0_1px_1px_rgba(255,255,255,0.8)] pointer-events-none" />

              {/* Text message */}
              <div 
                className="py-2 text-base leading-relaxed whitespace-pre-line min-h-[120px]"
                style={{ 
                  fontFamily: 'var(--font-handwriting), "Caveat", "Playpen Sans", cursive',
                  fontWeight: 500,
                  transform: 'rotate(-0.5deg)'
                }}
              >
                {formattedText}
              </div>

              {/* Sender Sign-off */}
              <div className="mt-6 flex flex-col items-end">
                <span className="font-serif italic text-xs opacity-60 mb-1">With Love,</span>
                <span 
                  className="text-lg"
                  style={{ 
                    fontFamily: 'var(--font-handwriting), "Caveat", "Playpen Sans", cursive',
                    fontWeight: 600,
                    color: accentColor,
                    transform: 'rotate(1deg)'
                  }}
                >
                  {senderName || "Your Valentine"}
                </span>
              </div>
            </motion.div>
          </div>

          {/* 3. Action Section (Start Movie button fades in at the very bottom) */}
          <motion.div 
            className="mt-6 pt-4 border-t border-[#EBE6DD] flex justify-center"
            initial={{ opacity: 0, y: 10 }}
            animate={isUnfolded ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
            transition={{ delay: 0.6, duration: 0.5 }}
          >
            <button
              onClick={handleStartMovie}
              className="px-6 py-2.5 rounded-full text-white font-serif text-xs tracking-widest uppercase transition-all duration-300 shadow-md hover:shadow-lg active:scale-95 cursor-pointer outline-none flex items-center gap-2"
              style={{ 
                backgroundColor: btnBg,
                letterSpacing: '0.15em'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = btnHoverBg}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = btnBg}
            >
              <svg 
                className="w-3.5 h-3.5 fill-current" 
                viewBox="0 0 24 24" 
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M8 5v14l11-7z"/>
              </svg>
              Start Movie
            </button>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
