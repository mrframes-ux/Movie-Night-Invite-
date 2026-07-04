'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';

interface EnvelopeProps {
  theme: 'light' | 'luxury';
  partnerName: string;
  senderName: string;
  isOpen: boolean;
  onOpen: () => void;
  children: React.ReactNode; // The ticket inside
}

export default function Envelope({ 
  theme, 
  partnerName, 
  senderName, 
  isOpen, 
  onOpen, 
  children 
}: EnvelopeProps) {
  const [isPopped, setIsPopped] = useState(false);
  const [isFlapOpen, setIsFlapOpen] = useState(false);
  const [isTicketOut, setIsTicketOut] = useState(false);
  const [isEnvelopeFalling, setIsEnvelopeFalling] = useState(false);
  const [clipBottom, setClipBottom] = useState('120px');

  // Adjust bottom clipping offset dynamically based on envelope size
  useEffect(() => {
    const handleResize = () => {
      setClipBottom(window.innerWidth >= 640 ? '130px' : '120px');
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Color tokens
  const envBg = theme === 'light' ? '#7E1925' : '#62111A'; // Deep red vs luxury red
  const envFlapBg = theme === 'light' ? '#8C202E' : '#731622'; // Slightly lighter for contrast
  const sealColor = theme === 'light' ? '#C5A059' : '#D4AF37'; // Gold accents

  // Sync fall animation variables (Envelope components fall off screen, opacity is preserved at 1)
  const envAnimation = isEnvelopeFalling ? { y: 650 } : { y: 0 };
  const envTransition = { duration: 1.2, ease: [0.32, 0, 0.67, 1] as const };

  // Particle explosion on clicking the wax seal
  const handleSealClick = (e: React.MouseEvent) => {
    if (isPopped) return;
    setIsPopped(true);

    const rect = e.currentTarget.getBoundingClientRect();
    const x = (rect.left + rect.width / 2) / window.innerWidth;
    const y = (rect.top + rect.height / 2) / window.innerHeight;

    confetti({
      particleCount: 80,
      spread: 60,
      origin: { x, y },
      colors: theme === 'light' 
        ? ['#C5A059', '#7E1925', '#F5E6CA', '#FAF8F5'] 
        : ['#D4AF37', '#62111A', '#FFFDF9', '#AA7C11'],
      disableForReducedMotion: true
    });

    // Step-by-step kinetic sequence
    setTimeout(() => {
      setIsFlapOpen(true); // 1. Flap opens upward
      setTimeout(() => {
        setIsTicketOut(true); // 2. Ticket starts sliding out slowly
        setTimeout(() => {
          setIsEnvelopeFalling(true); // 3. Envelope starts falling down while ticket is halfway out
          setTimeout(() => {
            onOpen(); // 4. Handover to standalone flippable ticket stage
          }, 1150);
        }, 600); // starts the fall-away mid-slide
      }, 700);
    }, 400);
  };

  return (
    <div className="relative flex justify-center items-center w-[360px] sm:w-[400px] h-[240px] sm:h-[260px] perspective-[1500px] overflow-visible">
      
      {/* 1. Envelope Back Base (z-5 - absolute back layer) */}
      <motion.div 
        className="absolute inset-0 rounded-lg overflow-hidden shadow-2xl z-5"
        style={{ backgroundColor: envBg }}
        animate={envAnimation}
        transition={envTransition}
      >
        <div className="w-full h-full bg-gradient-to-t from-black/20 to-transparent" />
      </motion.div>

      {/* 2. Sandwiched Ticket Viewport Wrapper with dynamic clip-path synchronized to the envelope fall */}
      <motion.div 
        className="absolute inset-0 z-10 pointer-events-none flex items-center justify-center overflow-visible"
        animate={{
          clipPath: isEnvelopeFalling
            ? `polygon(-300% -300%, 300% -300%, 300% 780px, -300% 780px)`
            : `polygon(-300% -300%, 300% -300%, 300% ${clipBottom}, -300% ${clipBottom})`
        }}
        transition={envTransition}
      >
        {/* Moving Ticket */}
        <motion.div
          className="absolute origin-bottom pointer-events-auto"
          initial={{ y: 120, opacity: 0, scale: 0.6 }}
          animate={
            isEnvelopeFalling 
              ? { y: 0, opacity: 1, scale: 1 } // Centered
              : isTicketOut 
                ? { y: -210, opacity: 1, scale: 0.88 } // Slid out
                : { y: 120, opacity: 0, scale: 0.6 } // Tucked deep inside pocket
          }
          transition={{ 
            duration: isEnvelopeFalling ? 0.95 : 0.85, 
            ease: [0.25, 1, 0.5, 1] 
          }}
        >
          {children}
        </motion.div>
      </motion.div>

      {/* 3. Envelope Side & Bottom Flaps (z-15 - covering the ticket pocket area) */}
      <motion.svg 
        className="absolute inset-0 w-full h-full z-15 pointer-events-none filter drop-shadow-[0_-2px_6px_rgba(0,0,0,0.15)]"
        viewBox="0 0 400 260"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        animate={envAnimation}
        transition={envTransition}
      >
        {/* Left Flap */}
        <polygon points="0,0 200,130 0,260" fill={envBg} />
        <polygon points="0,0 200,130 0,260" fill="black" opacity="0.08" />
        
        {/* Right Flap */}
        <polygon points="400,0 200,130 400,260" fill={envBg} />
        <polygon points="400,0 200,130 400,260" fill="black" opacity="0.08" />
        
        {/* Bottom Flap */}
        <polygon points="0,260 200,120 400,260" fill={envFlapBg} />
        <polygon points="0,260 200,120 400,260" fill="black" opacity="0.05" />
      </motion.svg>

      {/* 4. Envelope Top Flap (z-30 - folds upward, falls with envelope) */}
      <motion.div
        className="absolute inset-x-0 top-0 h-[130px] z-30 transform-gpu"
        style={{ 
          transformOrigin: 'top center',
          transformStyle: 'preserve-3d'
        }}
        initial={{ rotateX: 0 }}
        animate={
          isEnvelopeFalling 
            ? { y: envAnimation.y, rotateX: 180 } 
            : isFlapOpen 
              ? { rotateX: 180 } 
              : { rotateX: 0 }
        }
        transition={{ 
          y: envTransition,
          rotateX: { duration: 0.7, ease: "easeInOut" }
        }}
      >
        <svg 
          className="w-full h-full filter drop-shadow-[0_4px_4px_rgba(0,0,0,0.25)]"
          viewBox="0 0 400 130"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{ backfaceVisibility: 'hidden' }}
        >
          <polygon points="0,0 200,130 400,0" fill={envFlapBg} />
          <polygon points="0,0 200,130 400,0" fill="white" opacity="0.03" />
        </svg>
      </motion.div>

      {/* 5. Personal handwritten address label (z-28 - falls with envelope) */}
      <motion.div 
        className="absolute top-1/2 left-1/2 transform -translate-x-1/2 translate-y-3 z-28 text-center pointer-events-none select-none"
        animate={envAnimation}
        transition={envTransition}
      >
        <p className="font-serif italic text-xs tracking-wider text-white/40 mb-1">To My Love</p>
        <p className="font-serif tracking-widest text-sm text-[#F5E6CA] font-medium uppercase">{partnerName || "My Partner"}</p>
      </motion.div>

      {/* 6. Wax Seal (z-40 - locks top/bottom flaps, falls with envelope if still present) */}
      <AnimatePresence>
        {!isFlapOpen && (
          <motion.button
            className="absolute z-40 w-16 h-16 rounded-full flex items-center justify-center cursor-pointer shadow-lg outline-none focus:scale-105 active:scale-95 transition-transform"
            style={{
              left: 'calc(50% - 32px)',
              top: 'calc(50% - 10px)',
              backgroundColor: sealColor,
              backgroundImage: `radial-gradient(circle at 35% 35%, rgba(255,255,255,0.4) 0%, transparent 60%), radial-gradient(circle at 75% 75%, rgba(0,0,0,0.3) 0%, transparent 60%)`,
              boxShadow: `
                0 6px 12px rgba(0,0,0,0.3), 
                inset 0 2px 4px rgba(255,255,255,0.3), 
                inset 0 -2px 4px rgba(0,0,0,0.4),
                0 0 0 4px ${sealColor}dd
              `
            }}
            onClick={handleSealClick}
            whileHover={{ scale: 1.06 }}
            exit={{ 
              scale: 0,
              opacity: 0,
              transition: { duration: 0.3, ease: "easeIn" }
            }}
          >
            <div 
              className="w-11 h-11 rounded-full border border-black/10 flex items-center justify-center shadow-inner"
              style={{
                boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.2)'
              }}
            >
              <svg 
                width="20" 
                height="20" 
                viewBox="0 0 24 24" 
                className="text-black/30 fill-black/15 filter drop-shadow-[0_1px_1px_rgba(255,255,255,0.15)]"
              >
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
              </svg>
            </div>
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
