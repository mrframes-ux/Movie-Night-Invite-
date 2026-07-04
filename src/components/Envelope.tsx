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
  children: React.ReactNode;
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
  const [isFlapBehind, setIsFlapBehind] = useState(false);
  const [isEnvelopeFalling, setIsEnvelopeFalling] = useState(false);

  // Color tokens
  const envBg = theme === 'light' ? '#7E1925' : '#62111A';
  const envFlapBg = theme === 'light' ? '#8C202E' : '#731622';
  const sealColor = theme === 'light' ? '#C5A059' : '#D4AF37';

  // Envelope fall animation
  const envFallY = isEnvelopeFalling ? 650 : 0;
  const envTransition = { duration: 1.2, ease: [0.32, 0, 0.67, 1] as const };

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

    // Animation sequence matching the reference:
    // Step 1: Initial (sealed) — already rendered
    // Step 2-3: Flap lifts up and opens fully (hinge at bottom edge, swings upward)
    // Step 4-5: Ticket pops up from inside the envelope
    // Step 6-7: Flap moves behind ticket (z-index change)
    // Step 8: Final state → transition to standalone ticket
    setTimeout(() => {
      // Steps 2-3: Flap opens upward
      setIsFlapOpen(true);

      setTimeout(() => {
        // Steps 4-5: Ticket pops up from inside
        setIsTicketOut(true);

        setTimeout(() => {
          // Steps 6-7: Flap tucks behind ticket
          setIsFlapBehind(true);

          setTimeout(() => {
            // Step 8: Envelope falls away, transition to standalone ticket
            setIsEnvelopeFalling(true);
            setTimeout(() => {
              onOpen();
            }, 1100);
          }, 400);
        }, 500);
      }, 700);
    }, 400);
  };

  // Determine flap z-index:
  // Closed: z-20 (in front of ticket, sealing it)
  // Open but before tuck: z-20 (still in front so you can see it open)  
  // After tuck: z-2 (behind ticket so ticket is clean in front)
  const flapZIndex = isFlapBehind ? 2 : 20;

  return (
    <div className="relative flex justify-center items-center w-[360px] sm:w-[400px] h-[240px] sm:h-[260px] overflow-visible">
      
      {/* ── Layer 1: Envelope Back Base ── */}
      <motion.div 
        className="absolute inset-0 rounded-lg overflow-hidden shadow-2xl"
        style={{ backgroundColor: envBg, zIndex: 1 }}
        animate={{ y: envFallY }}
        transition={envTransition}
      >
        <div className="w-full h-full bg-gradient-to-t from-black/20 to-transparent" />
      </motion.div>

      {/* ── Layer 2: Top Flap ──
           Hinge at TOP edge (where flap meets the envelope top fold).
           rotateX: 180 swings the tip UPWARD and BACKWARD like a real envelope.
           Two SVG faces: front (visible closed) + back (visible when open). */}
      <motion.div
        className="absolute inset-x-0 top-0 h-[130px] transform-gpu"
        style={{ 
          transformOrigin: 'top center',
          transformStyle: 'preserve-3d',
          zIndex: flapZIndex,
        }}
        initial={{ rotateX: 0 }}
        animate={{
          rotateX: isFlapOpen ? 180 : 0,
          y: isEnvelopeFalling ? envFallY : 0,
        }}
        transition={{ 
          rotateX: { duration: 0.8, ease: [0.4, 0, 0.2, 1] },
          y: envTransition,
        }}
      >
        {/* Front face — visible when envelope is sealed (rotateX: 0) */}
        <div 
          className="absolute inset-0 w-full h-full"
          style={{ backfaceVisibility: 'hidden' }}
        >
          <svg 
            className="w-full h-full filter drop-shadow-[0_4px_6px_rgba(0,0,0,0.3)]"
            viewBox="0 0 400 130"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <polygon points="0,0 200,130 400,0" fill={envFlapBg} />
            <polygon points="0,0 200,130 400,0" fill="white" opacity="0.04" />
          </svg>
        </div>

        {/* Back face — visible when flap is open (rotateX: 180).
            Pre-rotated 180° around Y-axis so it faces the viewer and points UP when open. */}
        <div 
          className="absolute inset-0 w-full h-full"
          style={{ 
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
          }}
        >
          <svg 
            className="w-full h-full"
            viewBox="0 0 400 130"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <polygon points="0,0 200,130 400,0" fill={envBg} />
            <polygon points="0,0 200,130 400,0" fill="black" opacity="0.18" />
          </svg>
        </div>
      </motion.div>

      {/* ── Layer 3: Ticket ──
           Starts hidden inside the envelope. Pops up with scale + fade.
           z-index 10: always between the back base (1) and the side flaps (15). 
           After flap tucks behind (z:2), ticket is cleanly in front of it. */}
      <motion.div 
        className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-visible"
        style={{ zIndex: 10 }}
      >
        <motion.div
          className="absolute origin-bottom pointer-events-auto"
          initial={{ y: 80, opacity: 0, scale: 0.65 }}
          animate={
            isEnvelopeFalling 
              ? { y: 0, opacity: 1, scale: 1 }
              : isTicketOut 
                ? { y: -220, opacity: 1, scale: 0.9 }
                : { y: 80, opacity: 0, scale: 0.65 }
          }
          transition={{ 
            duration: isEnvelopeFalling ? 0.9 : 0.7, 
            ease: [0.22, 1, 0.36, 1],
          }}
        >
          {children}
        </motion.div>
      </motion.div>

      {/* ── Layer 4: Side & Bottom Flaps (envelope pocket walls) ── */}
      <motion.svg 
        className="absolute inset-0 w-full h-full pointer-events-none filter drop-shadow-[0_-2px_6px_rgba(0,0,0,0.15)]"
        style={{ zIndex: 15 }}
        viewBox="0 0 400 260"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        animate={{ y: envFallY }}
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

      {/* ── Layer 5: Address Label ── */}
      <motion.div 
        className="absolute top-1/2 left-1/2 transform -translate-x-1/2 translate-y-3 text-center pointer-events-none select-none"
        style={{ zIndex: 18 }}
        animate={{ y: envFallY }}
        transition={envTransition}
      >
        <p className="font-serif italic text-xs tracking-wider text-white/40 mb-1">To My Love</p>
        <p className="font-serif tracking-widest text-sm text-[#F5E6CA] font-medium uppercase">
          {partnerName || "My Partner"}
        </p>
      </motion.div>

      {/* ── Layer 6: Wax Seal ── */}
      <AnimatePresence>
        {!isFlapOpen && (
          <motion.button
            className="absolute w-16 h-16 rounded-full flex items-center justify-center cursor-pointer shadow-lg outline-none focus:scale-105 active:scale-95 transition-transform"
            style={{
              zIndex: 40,
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
              style={{ boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.2)' }}
            >
              <svg 
                width="20" height="20" viewBox="0 0 24 24" 
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
