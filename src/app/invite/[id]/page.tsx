'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { db, Invitation } from '@/lib/supabase';
import ThemeBackground from '@/components/ThemeBackground';
import Envelope from '@/components/Envelope';
import Ticket from '@/components/Ticket';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, AlertCircle, Home, Loader2 } from 'lucide-react';

export default function InviteViewerPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  // Data states
  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Timeline States
  const [envelopeOpen, setEnvelopeOpen] = useState(false);
  const [ticketFlipped, setTicketFlipped] = useState(false);

  // Fetch Invitation details on mount
  useEffect(() => {
    if (!id) return;

    const fetchInvitation = async () => {
      try {
        setLoading(true);
        const { data, error: dbError } = await db.getInvitation(id);
        
        if (dbError || !data) {
          setError(dbError?.message || 'Invitation not found.');
        } else {
          setInvitation(data);
        }
      } catch (err) {
        console.error('Error fetching invitation:', err);
        setError('An unexpected error occurred while loading the invitation.');
      } finally {
        setLoading(false);
      }
    };

    fetchInvitation();
  }, [id]);

  // Loading Screen
  if (loading) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex flex-col justify-center items-center gap-4 relative overflow-hidden">
        {/* Soft floating background hearts */}
        <ThemeBackground theme="light" />
        <div className="flex flex-col items-center gap-3 z-10">
          <Loader2 className="w-8 h-8 text-[#C5A059] animate-spin" />
          <p className="font-serif italic text-xs tracking-wider text-[#3A0E13]/60">Opening Invitation...</p>
        </div>
      </div>
    );
  }

  // Error Screen
  if (error || !invitation) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex flex-col justify-center items-center p-6 relative overflow-hidden">
        <ThemeBackground theme="light" />
        <motion.div 
          className="w-full max-w-sm bg-white border border-[#EBE6DD] rounded-2xl p-6 shadow-xl text-center z-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-100">
            <AlertCircle className="w-6 h-6 text-red-600" />
          </div>
          <h2 className="font-serif text-lg font-medium tracking-wide text-[#3A0E13] mb-2">
            Invitation Not Found
          </h2>
          <p className="text-xs text-gray-500 mb-6 leading-relaxed">
            This invitation link may have expired or is incorrect. Check the URL and try again, or create your own invitation.
          </p>
          <button
            onClick={() => router.push('/')}
            className="w-full py-2.5 rounded-lg bg-[#3A0E13] hover:bg-[#4E141B] text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <Home className="w-4 h-4" /> Create Invitation
          </button>
        </motion.div>
      </div>
    );
  }

  const {
    movie_title,
    movie_poster,
    movie_backdrop,
    streaming_url,
    partner_name,
    sender_name,
    date,
    time,
    location,
    letter,
    theme
  } = invitation;

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Dynamic Animated background matching the invite's selected theme */}
      <ThemeBackground theme={theme} />

      {/* Main Experience Panel */}
      <main className="w-full flex justify-center items-center py-6 sm:py-12 z-10">
        
        {/* Animated Sequence Wrapper */}
        {!envelopeOpen ? (
          // Scene 1-4: Envelope state
          <Envelope
            theme={theme}
            partnerName={partner_name}
            senderName={sender_name}
            isOpen={envelopeOpen}
            onOpen={() => setEnvelopeOpen(true)}
          >
            {/* The Ticket (visible inside envelope before slide out) */}
            <Ticket
              movieTitle={movie_title}
              moviePoster={movie_poster}
              movieBackdrop={movie_backdrop}
              streamingUrl={streaming_url}
              partnerName={partner_name}
              senderName={sender_name}
              date={date}
              time={time}
              location={location}
              letterText={letter}
              theme={theme}
              isFlipped={ticketFlipped}
              onFlip={() => {}}
            />
          </Envelope>
        ) : (
          // Scene 5-8: Ticket Centered & Flippable state (Static wrapper to prevent remount blink)
          <div className="w-full flex justify-center">
            <Ticket
              movieTitle={movie_title}
              moviePoster={movie_poster}
              movieBackdrop={movie_backdrop}
              streamingUrl={streaming_url}
              partnerName={partner_name}
              senderName={sender_name}
              date={date}
              time={time}
              location={location}
              letterText={letter}
              theme={theme}
              inviteId={id}
              isFlipped={ticketFlipped}
              onFlip={() => setTicketFlipped(!ticketFlipped)}
            />
          </div>
        )}
      </main>

      {/* Subtle brand mark (faded, unobtrusive) */}
      <footer className="absolute bottom-4 left-0 right-0 flex justify-center pointer-events-none select-none z-10">
        <span className="font-serif italic text-[10px] tracking-wider text-black/15 dark:text-white/10 uppercase">
          Movie Night Invite
        </span>
      </footer>
    </div>
  );
}
