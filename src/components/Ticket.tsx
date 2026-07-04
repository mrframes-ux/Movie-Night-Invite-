'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import QRCode from 'qrcode';
import { Calendar, Clock, MapPin, Film } from 'lucide-react';

interface TicketProps {
  movieTitle: string;
  moviePoster: string;
  movieBackdrop?: string;
  streamingUrl: string;
  partnerName: string;
  senderName: string;
  date: string;
  time: string;
  location: string;
  letterText: string;
  theme: 'light' | 'luxury';
  inviteId?: string;
  isFlipped: boolean;
  onFlip: () => void;
}

// Dynamic font scaling for long movie titles
const getTitleFontSize = (title: string) => {
  const len = title ? title.length : 0;
  if (len <= 10) return 'text-2xl sm:text-3xl tracking-wide';
  if (len <= 16) return 'text-xl sm:text-2xl tracking-wide';
  if (len <= 24) return 'text-lg sm:text-xl leading-tight tracking-normal';
  return 'text-sm sm:text-base leading-tight tracking-tighter';
};

// Autoselect taglines for popular movie choices
const getMovieTagline = (title: string) => {
  const t = title ? title.toLowerCase() : '';
  if (t.includes('interstellar')) return 'A JOURNEY BEYOND TIME';
  if (t.includes('inception')) return 'YOUR MIND IS THE SCENE OF THE CRIME';
  if (t.includes('la la land')) return "HERE'S TO THE FOOLS WHO DREAM";
  if (t.includes('dune')) return 'BEYOND FEAR, DESTINY AWAITS';
  if (t.includes('avatar')) return 'RETURN TO PANDORA';
  if (t.includes('titanic')) return 'NOTHING ON EARTH COULD COME BETWEEN THEM';
  return 'A SPECIAL EVENING TOGETHER';
};

// Helper to determine day of the week
const getDayOfWeek = (dateStr: string) => {
  if (!dateStr) return 'Day of Week';
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  for (const day of days) {
    if (dateStr.toUpperCase().includes(day.toUpperCase())) return day;
  }
  try {
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString('en-US', { weekday: 'long' });
    }
  } catch (e) {}
  return 'Special Day';
};

// Date formatter to convert YYYY-MM-DD to DD MMM, YYYY
const formatDateDisplay = (dateStr: string) => {
  if (!dateStr) return 'SELECT DATE';
  try {
    const d = new Date(dateStr + 'T12:00:00');
    if (!isNaN(d.getTime())) {
      const day = d.getDate();
      const month = d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
      const year = d.getFullYear();
      return `${day} ${month}, ${year}`;
    }
  } catch (e) {}
  return dateStr.toUpperCase();
};

// Time formatter to convert HH:MM to 12-hour AM/PM format
const formatTimeDisplay = (timeStr: string) => {
  if (!timeStr) return 'SELECT TIME';
  try {
    const [hourStr, minStr] = timeStr.split(':');
    const hours = parseInt(hourStr, 10);
    const mins = parseInt(minStr, 10);
    if (!isNaN(hours) && !isNaN(mins)) {
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const displayHours = hours % 12 || 12;
      const displayMins = mins < 10 ? `0${mins}` : mins;
      return `${displayHours}:${displayMins} ${ampm}`;
    }
  } catch (e) {}
  return timeStr;
};

// Mathematically exact path of the die-cut ticket for clipping
const ticketClipPath = 'path("M 16,0 L 164,0 A 16,16 0 0,0 196,0 L 344,0 A 16,16 0 0,1 360,16 L 360,564 A 16,16 0 0,1 344,580 L 196,580 A 16,16 0 0,0 164,580 L 16,580 A 16,16 0 0,1 0,564 L 0,16 A 16,16 0 0,1 16,0 Z")';

export default function Ticket({
  movieTitle,
  moviePoster,
  movieBackdrop,
  streamingUrl,
  partnerName,
  senderName,
  date,
  time,
  location,
  letterText,
  theme,
  inviteId,
  isFlipped,
  onFlip,
}: TicketProps) {
  const shouldReduceMotion = useReducedMotion();
  const cardRef = useRef<HTMLDivElement>(null);
  
  // 3D Tilt coordinates
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');

  // Generate QR Code dynamically pointing to the invite page
  useEffect(() => {
    const generateQRCode = async () => {
      try {
        const link = typeof window !== 'undefined' 
          ? `${window.location.origin}/invite/${inviteId || 'preview'}`
          : `https://movienightinvite.com/invite/${inviteId || 'preview'}`;
        
        const dataUrl = await QRCode.toDataURL(link, {
          margin: 1,
          width: 150,
          color: {
            dark: '#5D0D18',
            light: '#FAF8F5',
          },
        });
        setQrCodeDataUrl(dataUrl);
      } catch (err) {
        console.error('Error generating QR code:', err);
      }
    };

    generateQRCode();
  }, [inviteId]);

  // Handle 3D Tilt on Mouse Move
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isFlipped || shouldReduceMotion) return;
    const card = cardRef.current;
    if (!card) return;

    const rect = card.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    
    const mouseX = (e.clientX - rect.left) / width - 0.5;
    const mouseY = (e.clientY - rect.top) / height - 0.5;

    setRotateX(-mouseY * 4);
    setRotateY(mouseX * 4);
  };

  const handleMouseLeave = () => {
    setRotateX(0);
    setRotateY(0);
  };

  // Color tokens (typography and ticket elements set to #5D0D18 for readability on cream paper)
  const dividerColor = 'bg-[#5D0D18]/15';
  const heartColor = '#5D0D18';

  const handleStartMovie = (e: React.MouseEvent) => {
    e.stopPropagation(); // Avoid triggering card flip back
    if (typeof window !== 'undefined') {
      window.open(streamingUrl || 'https://netflix.com', '_blank', 'noopener,noreferrer');
    }
  };

  const hasMovie = !!movieTitle.trim();
  const landscapeArtwork = movieBackdrop || moviePoster || '';
  const cleanLetterText = letterText || "I've been meaning to say this,\nbut I guess a note feels\nbetter than a text.\n\nThere's something about you\nthat just... stays.\nNo big expectations, no pressure.\n\nLet's see where it goes";

  return (
    <div 
      className="relative w-[360px] h-[580px] scale-[0.88] sm:scale-100 origin-center cursor-pointer perspective-[1500px] select-none"
      onClick={onFlip}
    >
      <motion.div
        ref={cardRef}
        className="w-full h-full relative transition-shadow duration-300 transform-gpu"
        style={{ 
          transformStyle: 'preserve-3d',
        }}
        animate={{
          rotateY: isFlipped ? 180 : rotateY,
          rotateX: isFlipped ? 0 : rotateX,
        }}
        transition={isFlipped 
          ? { type: 'spring', stiffness: 50, damping: 14, mass: 1.6 } 
          : { type: 'tween', ease: 'easeOut', duration: 0.1 }
        }
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        
        {/* FRONT SOFT SHADOW (Unclipped, rotates with card, hidden when flipped) */}
        <svg 
          className="absolute inset-0 w-full h-full -z-20 pointer-events-none" 
          style={{ 
            filter: 'drop-shadow(0 32px 50px rgba(0,0,0,0.18)) drop-shadow(0 12px 22px rgba(0,0,0,0.12))',
            transform: 'translateZ(-1.5px)',
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
          }} 
          viewBox="0 0 360 580" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg" 
          preserveAspectRatio="none"
        >
          <path 
            d="M 16,0 L 164,0 A 16,16 0 0,0 196,0 L 344,0 A 16,16 0 0,1 360,16 L 360,564 A 16,16 0 0,1 344,580 L 196,580 A 16,16 0 0,0 164,580 L 16,580 A 16,16 0 0,1 0,564 L 0,16 A 16,16 0 0,1 16,0 Z" 
            fill="rgba(250,248,245,0.015)" 
          />
        </svg>

        {/* BACK SOFT SHADOW (Unclipped, rotated, rotates with card, hidden when front-facing) */}
        <svg 
          className="absolute inset-0 w-full h-full -z-20 pointer-events-none" 
          style={{ 
            filter: 'drop-shadow(0 32px 50px rgba(0,0,0,0.18)) drop-shadow(0 12px 22px rgba(0,0,0,0.12))',
            transform: 'rotateY(180deg) translateZ(-1.5px)',
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
          }} 
          viewBox="0 0 360 580" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg" 
          preserveAspectRatio="none"
        >
          <path 
            d="M 16,0 L 164,0 A 16,16 0 0,0 196,0 L 344,0 A 16,16 0 0,1 360,16 L 360,564 A 16,16 0 0,1 344,580 L 196,580 A 16,16 0 0,0 164,580 L 16,580 A 16,16 0 0,1 0,564 L 0,16 A 16,16 0 0,1 16,0 Z" 
            fill="rgba(250,248,245,0.015)" 
          />
        </svg>

        {/* TICKET FRONT PANEL */}
        <div 
          className="absolute inset-0 w-full h-full p-6 flex flex-col justify-between backface-hidden overflow-hidden"
          style={{ 
            backfaceVisibility: 'hidden',
            clipPath: ticketClipPath,
            WebkitClipPath: ticketClipPath,
          }}
        >
          {/* Vector SVG Ticket Frame */}
          <svg className="absolute inset-0 w-full h-full -z-10" viewBox="0 0 360 580" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
            {/* Cream Ticket Paper Base */}
            <path 
              d="M 16,0 L 164,0 A 16,16 0 0,0 196,0 L 344,0 A 16,16 0 0,1 360,16 L 360,564 A 16,16 0 0,1 344,580 L 196,580 A 16,16 0 0,0 164,580 L 16,580 A 16,16 0 0,1 0,564 L 0,16 A 16,16 0 0,1 16,0 Z" 
              fill="#FAF8F5" 
            />
            {/* Outer perforation markings */}
            <line x1="2" y1="20" x2="2" y2="560" stroke="#5D0D18" strokeWidth="1.2" strokeDasharray="3,6" opacity="0.12" />
            <line x1="358" y1="20" x2="358" y2="560" stroke="#5D0D18" strokeWidth="1.2" strokeDasharray="3,6" opacity="0.12" />

            {/* 3D Cut Edge Highlights (Simulating paper thickness and light bevel) */}
            <path d="M 164,1 A 16,16 0 0,0 196,1" stroke="#FFFFFF" strokeWidth="1.5" opacity="0.95" />
            <path d="M 164,0 A 16,16 0 0,0 196,0" stroke="#5D0D18" strokeWidth="0.8" opacity="0.15" />
            <path d="M 164,579 A 16,16 0 0,1 196,579" stroke="#FFFFFF" strokeWidth="1.5" opacity="0.95" />
            <path d="M 164,580 A 16,16 0 0,1 196,580" stroke="#5D0D18" strokeWidth="0.8" opacity="0.15" />
          </svg>

          {/* Paper noise filter */}
          <div 
            className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-overlay"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
            }}
          />

          {/* 1. Header (You're Invited) */}
          <div className="flex flex-col items-center mt-2">
            <div className="flex items-center gap-1.5 font-serif italic text-sm text-[#5D0D18] opacity-80">
              You're Invited <span style={{ color: heartColor }}>♥</span>
            </div>
            <div className="text-[9px] uppercase tracking-[0.25em] font-semibold opacity-40 mt-1">
              Movie Night
            </div>
          </div>

          {/* 2. Movie Title */}
          <div className="flex flex-col items-center justify-center my-1.5 px-3">
            <h2 className={`font-serif font-medium text-center uppercase text-[#5D0D18] break-words w-full ${getTitleFontSize(movieTitle)} ${!hasMovie ? 'opacity-30' : ''}`}>
              {movieTitle || 'YOUR MOVIE TITLE'}
            </h2>
          </div>

          {/* 3. Movie Tagline */}
          <div className="flex items-center w-full px-4 mb-2">
            <div className={`h-[1px] flex-1 ${dividerColor}`} />
            <span className="text-[8px] sm:text-[9px] uppercase tracking-[0.18em] text-[#5D0D18] opacity-60 px-3 shrink-0 whitespace-nowrap">
              {hasMovie ? getMovieTagline(movieTitle) : 'A SPECIAL EVENING TOGETHER'}
            </span>
            <div className={`h-[1px] flex-1 ${dividerColor}`} />
          </div>

          {/* 4. Landscape Movie Poster */}
          <div className="w-full px-2">
            <div className="aspect-[16/10] w-full rounded-lg bg-[#FAF8F5]/30 overflow-hidden relative shadow-md border border-[#EBE6DD] flex flex-col items-center justify-center">
              {hasMovie && landscapeArtwork ? (
                <img 
                  src={landscapeArtwork} 
                  alt={movieTitle} 
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="flex flex-col items-center gap-1.5 text-center text-[#5D0D18]/30">
                  <Film className="w-6 h-6 stroke-[1.5]" />
                  <span className="text-[8px] uppercase tracking-wider font-semibold">Select a movie to show artwork</span>
                </div>
              )}
            </div>
          </div>

          {/* 5. Details Section (3 columns) */}
          <div className="grid grid-cols-3 gap-1 px-1 my-3 text-[#5D0D18]">
            {/* Date column */}
            <div className="flex flex-col items-center text-center">
              <Calendar className="w-3.5 h-3.5 opacity-60 mb-1" style={{ color: '#5D0D18' }} />
              <span className="text-[8px] uppercase tracking-wider opacity-45">Date</span>
              <span className={`font-numbers text-[9px] sm:text-[10px] font-bold tracking-wide mt-0.5 truncate w-full ${!date ? 'opacity-30' : ''}`}>
                {date ? formatDateDisplay(date) : 'SELECT DATE'}
              </span>
              <span className={`text-[8px] opacity-45 truncate w-full ${!date ? 'opacity-30' : ''}`}>{getDayOfWeek(date)}</span>
            </div>

            {/* Time column */}
            <div className="flex flex-col items-center text-center border-x border-[#EBE6DD]">
              <Clock className="w-3.5 h-3.5 opacity-60 mb-1" style={{ color: '#5D0D18' }} />
              <span className="text-[8px] uppercase tracking-wider opacity-45">Time</span>
              <span className={`font-numbers text-[9px] sm:text-[10px] font-bold tracking-wide mt-0.5 truncate w-full ${!time ? 'opacity-30' : ''}`}>
                {time ? formatTimeDisplay(time) : 'SELECT TIME'}
              </span>
              <span className="text-[8px] opacity-45">Local Time</span>
            </div>

            {/* Where column */}
            <div className="flex flex-col items-center text-center">
              <MapPin className="w-3.5 h-3.5 opacity-60 mb-1" style={{ color: '#5D0D18' }} />
              <span className="text-[8px] uppercase tracking-wider opacity-45">Where</span>
              <span className={`font-numbers text-[9px] sm:text-[10px] font-bold tracking-wide mt-0.5 truncate w-full uppercase ${!location ? 'opacity-30' : ''}`}>
                {location || 'SELECT LOCATION'}
              </span>
              <span className="text-[8px] opacity-45">At Home</span>
            </div>
          </div>

          {/* 6. Recipient Section (Front Only) */}
          <div className="flex flex-col items-center">
            <div className={`h-[1px] w-16 ${dividerColor} mb-1`} />
            <span className="text-[8px] uppercase tracking-[0.15em] opacity-45">For</span>
            <span 
              className={`text-lg text-[#5D0D18] mt-0.5 ${!partnerName ? 'opacity-30' : ''}`}
              style={{ fontFamily: 'var(--font-handwriting), "Caveat", cursive' }}
            >
              {partnerName || 'SOMEONE SPECIAL'} <span className="font-sans text-xs" style={{ color: heartColor }}>♥</span>
            </span>
          </div>

          {/* 7. Barcode Section */}
          <div className="flex flex-col items-center mb-2">
            <div className="flex justify-center items-end h-7 gap-[1.2px] opacity-85 select-none w-full max-w-[200px]">
              {[2, 1, 3, 1, 2, 4, 1, 2, 1, 3, 2, 1, 4, 1, 2, 1, 3, 1, 2, 4, 1, 2, 1, 3, 2, 1, 4, 1, 2, 1, 3, 1, 2, 4].map((width, idx) => (
                <div 
                  key={idx} 
                  className="h-full" 
                  style={{ width: `${width}px`, backgroundColor: '#5D0D18' }} 
                />
              ))}
            </div>
            <span className="text-[7.5px] uppercase tracking-[0.25em] text-[#5D0D18] opacity-50 mt-1.5 font-mono">
              Be Mine Before Valentine
            </span>
          </div>

        </div>

        {/* TICKET BACK PANEL (HANDWRITTEN NOTE) */}
        <div 
          className="absolute inset-0 w-full h-full p-6 flex flex-col justify-between backface-hidden overflow-hidden"
          style={{ 
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
            clipPath: ticketClipPath,
            WebkitClipPath: ticketClipPath,
          }}
        >
          {/* Vector SVG Ticket Frame */}
          <svg className="absolute inset-0 w-full h-full -z-10" viewBox="0 0 360 580" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
            <path 
              d="M 16,0 L 164,0 A 16,16 0 0,0 196,0 L 344,0 A 16,16 0 0,1 360,16 L 360,564 A 16,16 0 0,1 344,580 L 196,580 A 16,16 0 0,0 164,580 L 16,580 A 16,16 0 0,1 0,564 L 0,16 A 16,16 0 0,1 16,0 Z" 
              fill="#FAF8F5" 
            />
            <line x1="2" y1="20" x2="2" y2="560" stroke="#5D0D18" strokeWidth="1.2" strokeDasharray="3,6" opacity="0.12" />
            <line x1="358" y1="20" x2="358" y2="560" stroke="#5D0D18" strokeWidth="1.2" strokeDasharray="3,6" opacity="0.12" />

            {/* 3D Cut Edge Highlights */}
            <path d="M 164,1 A 16,16 0 0,0 196,1" stroke="#FFFFFF" strokeWidth="1.5" opacity="0.95" />
            <path d="M 164,0 A 16,16 0 0,0 196,0" stroke="#5D0D18" strokeWidth="0.8" opacity="0.15" />
            <path d="M 164,579 A 16,16 0 0,1 196,579" stroke="#FFFFFF" strokeWidth="1.5" opacity="0.95" />
            <path d="M 164,580 A 16,16 0 0,1 196,580" stroke="#5D0D18" strokeWidth="0.8" opacity="0.15" />
          </svg>

          {/* Paper noise and creases */}
          <div 
            className="absolute inset-0 opacity-[0.035] pointer-events-none mix-blend-overlay"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
            }}
          />

          {/* Paper Fold Shadows */}
          <div className="absolute top-[32%] left-4 right-4 h-px bg-black/[0.04] shadow-[0_1px_1px_rgba(255,255,255,0.7)] pointer-events-none" />
          <div className="absolute top-[65%] left-4 right-4 h-px bg-black/[0.04] shadow-[0_1px_1px_rgba(255,255,255,0.7)] pointer-events-none" />

          {/* Back Layout content (Typography set to #5D0D18) */}
          <div className="flex-1 flex flex-col justify-start items-center p-4 pt-16 z-10 text-[#5D0D18] select-text">
            <div 
              className="text-[14px] sm:text-[15px] leading-relaxed whitespace-pre-line text-left max-w-[245px] w-full"
              style={{ 
                fontFamily: 'var(--font-handwriting), "Caveat", cursive',
                fontWeight: 500,
                transform: 'rotate(-0.5deg)'
              }}
            >
              {cleanLetterText} <span style={{ color: heartColor }}>♥</span>
            </div>
          </div>

          {/* Clickable 3D Wax Seal CTA */}
          <button
            onClick={handleStartMovie}
            className="absolute right-5 bottom-6 w-20 h-20 z-30 pointer-events-auto cursor-pointer outline-none transition-transform duration-200 hover:scale-105 active:scale-95"
            title="Start Movie"
          >
            <div 
              className="w-full h-full rounded-full flex items-center justify-center shadow-lg relative transform rotate-12"
              style={{
                backgroundColor: '#5C0A12',
                backgroundImage: 'radial-gradient(circle at 35% 35%, rgba(255,255,255,0.2) 0%, transparent 60%), radial-gradient(circle at 75% 75%, rgba(0,0,0,0.45) 0%, transparent 60%)',
                boxShadow: '0 6px 12px rgba(0,0,0,0.35), inset 0 2px 3px rgba(255,255,255,0.25), inset 0 -2px 3px rgba(0,0,0,0.5)'
              }}
            >
              <div 
                className="w-[88%] h-[88%] rounded-full border border-black/10 flex items-center justify-center relative"
                style={{
                  boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.3)'
                }}
              >
                {/* Circular Text Path */}
                <svg className="absolute inset-0 w-full h-full animate-[spin_16s_linear_infinite]" viewBox="0 0 100 100" fill="none">
                  <path id="textCircle" d="M 50,50 m -34,0 a 34,34 0 1,1 68,0 a 34,34 0 1,1 -68,0" />
                  <text fontSize="7" fontWeight="bold" letterSpacing="1.2">
                    <textPath href="#textCircle" startOffset="50%" textAnchor="middle" fill="#F8F0BA">
                      START MOVIE ✦ START MOVIE ✦
                    </textPath>
                  </text>
                </svg>

                {/* Embossed heart inside seal */}
                <svg 
                  width="18" 
                  height="18" 
                  viewBox="0 0 24 24" 
                  style={{
                    fill: '#F8F0BA',
                    stroke: '#F8F0BA',
                  }}
                  className="opacity-90 filter drop-shadow-[0_1px_1px_rgba(255,255,255,0.15)] relative z-10"
                >
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                </svg>
              </div>
            </div>
          </button>

        </div>

      </motion.div>
    </div>
  );
}
