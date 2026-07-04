'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase, db, Invitation } from '@/lib/supabase';
import ThemeBackground from '@/components/ThemeBackground';
import Ticket from '@/components/Ticket';
import Envelope from '@/components/Envelope';
import { 
  Sparkles, 
  Search, 
  Copy, 
  ExternalLink, 
  Check, 
  RotateCcw,
  Palette,
  Eye,
  Info,
  Calendar,
  Clock,
  MapPin,
  Heart,
  Loader2,
  RefreshCw,
  Film
} from 'lucide-react';

export default function CreatorPage() {
  // Form States
  // Selected Movie Rich Metadata States (shown on dashboard)
  const [movieTitle, setMovieTitle] = useState('');
  const [moviePoster, setMoviePoster] = useState('');
  const [movieBackdrop, setMovieBackdrop] = useState('');
  const [streamingUrl, setStreamingUrl] = useState('');
  const [partnerName, setPartnerName] = useState('');
  const [senderName, setSenderName] = useState('David'); // Maintained internally for schema compatibility
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [location, setLocation] = useState('');
  const [letterText, setLetterText] = useState('');
  const [theme, setTheme] = useState<'light' | 'luxury'>('light');

  // Selected Movie Rich Metadata States (shown on dashboard)
  const [movieYear, setMovieYear] = useState('');
  const [movieRating, setMovieRating] = useState(0);
  const [movieRuntime, setMovieRuntime] = useState(0);
  const [movieGenres, setMovieGenres] = useState<string[]>([]);
  const [movieOverview, setMovieOverview] = useState('');

  // Interactive States
  const [urlInput, setUrlInput] = useState('');
  const [isDetectingUrl, setIsDetectingUrl] = useState(false);
  const [detectionFeedback, setDetectionFeedback] = useState<{ status: 'idle' | 'success' | 'error', message: string }>({ status: 'idle', message: '' });
  
  // TMDB Autocomplete Search States
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Invitation Generation States
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedInviteId, setGeneratedInviteId] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  
  // Live Preview States
  const [previewMode, setPreviewMode] = useState<'ticket' | 'envelope'>('ticket');
  const [previewEnvelopeOpen, setPreviewEnvelopeOpen] = useState(false);
  const [previewTicketFlipped, setPreviewTicketFlipped] = useState(false);

  // Close search dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowSearchDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Client-side search debouncing
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setShowSearchDropdown(false);
      return;
    }

    setIsSearching(true);
    setShowSearchDropdown(true);

    const delayDebounceFn = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search-movie?query=${encodeURIComponent(searchQuery)}`);
        if (res.ok) {
          const data = await res.json();
          const results = data.results || [];
          setSearchResults(results);
          
          // Automatically choose the first exact match if confidence is high (exact query text match)
          if (results.length > 0) {
            const exactMatch = results.find(
              (m: any) => m.title.toLowerCase() === searchQuery.toLowerCase().trim()
            );
            if (exactMatch) {
              handleSelectMovie(exactMatch);
            }
          }
        } else {
          setDetectionFeedback({ status: 'error', message: 'Failed to search movie database. Click search icon to retry.' });
        }
      } catch (err) {
        console.error(err);
        setDetectionFeedback({ status: 'error', message: 'Network error. Please check your connection.' });
      } finally {
        setIsSearching(false);
      }
    }, 350); // 350ms debounce delay

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      setShowSearchDropdown(true);
    }
  };

  // Trigger search manually (retry button)
  const handleManualSearchTrigger = () => {
    if (searchQuery.trim()) {
      setSearchQuery(searchQuery.trim() + ' '); // slight state update to trigger useEffect
    }
  };

  // Helper to determine active step
  const getActiveStep = () => {
    if (generatedInviteId) return 3; // Share
    if (!movieTitle.trim()) return 0; // Choose Movie
    if (!partnerName.trim() || !date.trim() || !time.trim() || !location.trim()) return 1; // Personalize Invitation
    return 2; // Write Your Note
  };

  // 1. Paste Movie URL Auto Detection
  const handleUrlBlurOrPaste = async (inputVal: string) => {
    if (!inputVal.trim() || !inputVal.startsWith('http')) return;
    
    setIsDetectingUrl(true);
    setDetectionFeedback({ status: 'idle', message: 'Analyzing streaming URL...' });

    try {
      const res = await fetch('/api/detect-movie', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: inputVal.trim() })
      });
      const data = await res.json();
      
      if (res.ok && data.success && data.movie) {
        handleSelectMovie(data.movie);
        setStreamingUrl(inputVal.trim());
        setDetectionFeedback({ 
          status: 'success', 
          message: `Autodetected: ${data.movie.title} (${data.movie.release_date ? data.movie.release_date.split('-')[0] : ''})` 
        });
      } else {
        setDetectionFeedback({ 
          status: 'error', 
          message: 'Could not auto-detect movie details. Search manually below.' 
        });
      }
    } catch (err) {
      console.error(err);
      setDetectionFeedback({ status: 'error', message: 'Connection error during auto-detection.' });
    } finally {
      setIsDetectingUrl(false);
    }
  };

  const handleSelectMovie = (movie: any) => {
    setMovieTitle(movie.title);
    if (movie.poster_path) setMoviePoster(movie.poster_path);
    if (movie.backdrop_path) setMovieBackdrop(movie.backdrop_path);
    
    // Set rich metadata
    if (movie.release_date) {
      setMovieYear(movie.release_date.split('-')[0]);
    } else {
      setMovieYear('');
    }
    setMovieRating(movie.vote_average || 0);
    setMovieRuntime(movie.runtime || 120);
    setMovieGenres(movie.genres || []);
    setMovieOverview(movie.overview || '');

    setShowSearchDropdown(false);
    setSearchQuery('');
  };

  // 3. Generate Link Action
  const handleGenerateInvite = async () => {
    setIsGenerating(true);
    
    const inviteData: Invitation = {
      movie_title: movieTitle || 'Movie Night',
      movie_poster: moviePoster,
      movie_backdrop: movieBackdrop,
      streaming_url: streamingUrl || 'https://netflix.com',
      partner_name: partnerName,
      sender_name: senderName,
      date,
      time,
      location: location || 'Living Room',
      letter: letterText,
      theme,
    };

    try {
      const { data, error } = await db.createInvitation(inviteData);
      if (error) {
        alert('Failed to generate invitation: ' + error.message);
      } else if (data && data.id) {
        setGeneratedInviteId(data.id);
      }
    } catch (err) {
      console.error(err);
      alert('An unexpected error occurred.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyLink = () => {
    if (!generatedInviteId) return;
    const shareLink = `${window.location.origin}/invite/${generatedInviteId}`;
    navigator.clipboard.writeText(shareLink);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  // Preview Mode Helper Reset
  const resetEnvelopePreview = () => {
    setPreviewEnvelopeOpen(false);
    setPreviewTicketFlipped(false);
    setPreviewMode('envelope');
  };

  return (
    <div className="min-h-screen flex flex-col relative">
      {/* Background Hearts */}
      <ThemeBackground theme={theme} />

      {/* Heading (Italianno font centered, responsive size, matching theme colors) */}
      <header className="w-full pt-12 pb-4 px-6 flex justify-center items-center z-10">
        <h1 
          className="text-5xl sm:text-6xl md:text-7xl text-center select-none"
          style={{ 
            fontFamily: 'var(--font-italianno), cursive',
            color: theme === 'light' ? '#5D0D18' : '#F8F0BA'
          }}
        >
          Movie Night Invite
        </h1>
      </header>

      {/* Main Split Screen */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col lg:grid lg:grid-cols-12 gap-8 z-10 items-stretch">
        
        {/* LEFT COLUMN: CREATOR FORM */}
        <section className="lg:col-span-6 xl:col-span-5 flex flex-col bg-[#FAF8F5]/90 rounded-2xl border border-[#EBE6DD] shadow-xl p-5 sm:p-7 relative overflow-hidden backdrop-blur-sm">
          <div className="mb-4">
            <h1 className="font-serif text-xl sm:text-2xl font-medium tracking-wide text-[#5D0D18]">
              Create Your Movie Night Invite
            </h1>
            <p className="text-xs text-[#5D0D18]/60 mt-1.5 leading-relaxed">
              Turn any movie into a beautiful invitation in seconds. Paste a streaming link or search by title, personalize your invite, and share it with someone special.
            </p>
          </div>

          {/* Stepper Progress Indicator */}
          <div className="flex items-center justify-between px-1 py-3 border-b border-[#EBE6DD] mb-5 text-[10px] sm:text-xs">
            {[
              { label: 'Choose Movie', step: 0 },
              { label: 'Personalize', step: 1 },
              { label: 'Write Note', step: 2 },
              { label: 'Share', step: 3 }
            ].map((item, idx) => {
              const activeStep = getActiveStep();
              const isCompleted = activeStep > item.step;
              const isActive = activeStep === item.step;
              return (
                <div key={idx} className="flex items-center gap-1 font-medium">
                  {idx > 0 && <div className="h-px w-2 sm:w-4 bg-[#5D0D18]/15 mr-1" />}
                  <span className={`flex items-center justify-center w-4 h-4 rounded-full text-[9px] border ${
                    isCompleted ? 'bg-[#5D0D18] border-[#5D0D18] text-white font-bold' :
                    isActive ? 'border-[#5D0D18] text-[#5D0D18] font-bold ring-2 ring-[#5D0D18]/10' :
                    'border-gray-300 text-gray-400'
                  }`}>
                    {isCompleted ? '✓' : item.step + 1}
                  </span>
                  <span className={isActive ? 'text-[#5D0D18] font-semibold' : isCompleted ? 'text-[#5D0D18]/70 font-normal' : 'text-gray-400 font-normal'}>
                    {item.label}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="flex-1 flex flex-col gap-5 overflow-y-auto px-1.5 pb-2 max-h-[calc(100vh-280px)]">
            {/* Movie Link */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] uppercase tracking-widest font-semibold text-[#5D0D18]/80">
                1. Choose a Movie
              </label>
              <div className="relative">
                <input
                  type="url"
                  placeholder="Paste a Netflix, Prime Video, Disney+, Apple TV, IMDb, or TMDB link..."
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  onBlur={() => handleUrlBlurOrPaste(urlInput)}
                  className="w-full pl-3 pr-10 py-2 rounded-lg border border-[#EBE6DD] bg-white text-xs text-[#5D0D18] placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#5D0D18] focus:border-[#5D0D18] transition-all"
                />
                {isDetectingUrl && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <Loader2 className="w-4 h-4 text-[#5D0D18] animate-spin" />
                  </div>
                )}
              </div>
              {detectionFeedback.message && (
                <div className="flex justify-between items-center mt-1">
                  <span className={`text-[10px] flex items-center gap-1 ${
                    detectionFeedback.status === 'success' ? 'text-green-600' : 
                    detectionFeedback.status === 'error' ? 'text-red-500' : 'text-[#5D0D18]'
                  }`}>
                    <Info className="w-3 h-3 flex-shrink-0" /> {detectionFeedback.message}
                  </span>
                  {detectionFeedback.status === 'error' && (
                    <button 
                      type="button" 
                      onClick={handleManualSearchTrigger} 
                      className="text-[9px] text-[#5D0D18] hover:underline font-semibold flex items-center gap-0.5"
                    >
                      <RefreshCw className="w-2.5 h-2.5" /> Retry
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Manual TMDB Autocomplete Search */}
            <div className="flex flex-col gap-1.5 relative" ref={dropdownRef}>
              <label className="text-[10px] uppercase tracking-widest font-semibold text-[#5D0D18]/80 flex justify-between">
                <span>OR SEARCH BY MOVIE TITLE</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search for a movie..."
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  onFocus={() => searchQuery.trim() && setShowSearchDropdown(true)}
                  className="w-full pl-8 pr-3 py-2 rounded-lg border border-[#EBE6DD] bg-white text-xs text-[#5D0D18] placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#5D0D18] focus:border-[#5D0D18] transition-all"
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              </div>
              <p className="text-[9px] text-[#5D0D18]/50 font-medium">
                We'll automatically fetch the poster and movie details from TMDB.
              </p>

              {/* Autocomplete Dropdown list */}
              <AnimatePresence>
                {showSearchDropdown && (
                  <motion.div 
                    className="absolute z-50 left-0 right-0 top-full mt-1 bg-white border border-[#EBE6DD] rounded-lg shadow-lg overflow-hidden max-h-56 overflow-y-auto"
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                  >
                    {isSearching ? (
                      <div className="p-3 text-center text-xs text-gray-400 flex items-center justify-center gap-2">
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-[#5D0D18]" /> Querying TMDB database...
                      </div>
                    ) : searchResults.length === 0 ? (
                      <div className="p-3 text-center text-xs text-gray-400">Movie not found. Keep typing or customize below.</div>
                    ) : (
                      searchResults.map((movie) => (
                        <button
                          key={movie.id}
                          onClick={() => handleSelectMovie(movie)}
                          type="button"
                          className="w-full px-3 py-2 flex items-center gap-3 border-b border-[#FDFBF7] hover:bg-[#FAF8F5] transition-colors text-left"
                        >
                          {movie.poster_path ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img 
                              src={movie.poster_path} 
                              alt={movie.title} 
                              className="w-8 h-12 object-cover rounded shadow-sm border border-gray-100 flex-shrink-0" 
                            />
                          ) : (
                            <div className="w-8 h-12 bg-gray-200 rounded text-[6px] text-center p-0.5 flex items-center justify-center text-gray-400 flex-shrink-0">No Poster</div>
                          )}
                          <div className="flex flex-col min-w-0">
                            <span className="text-xs font-semibold text-[#5D0D18] truncate">{movie.title}</span>
                            <span className="text-[10px] text-gray-400">{movie.release_date ? movie.release_date.split('-')[0] : 'N/A'}</span>
                          </div>
                        </button>
                      ))
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Movie Result / Empty State Card */}
            {!movieTitle ? (
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 p-4 border border-dashed border-[#EBE6DD] rounded-xl bg-[#FAF8F5]/50 text-center sm:text-left select-none">
                <div className="w-12 h-12 rounded-full bg-[#5D0D18]/5 flex items-center justify-center text-[#5D0D18]/30 border border-[#EBE6DD]/60">
                  <Film className="w-5 h-5 stroke-[1.5]" />
                </div>
                <div className="flex flex-col min-w-0">
                  <h4 className="font-serif font-bold text-xs text-[#5D0D18]/80">No movie selected</h4>
                  <p className="text-[10px] text-gray-500 mt-1 leading-normal max-w-[240px]">
                    Paste a streaming link or search for a movie title to automatically fetch its poster and details.
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex gap-4 p-3 bg-[#5D0D18]/5 border border-[#5D0D18]/10 rounded-xl text-[#5D0D18] relative">
                <div className="absolute right-3 top-3 px-2 py-0.5 rounded bg-green-50 text-green-700 border border-green-200 text-[8px] font-bold tracking-wide flex items-center gap-0.5 shadow-sm">
                  ✓ Movie Found
                </div>
                {moviePoster ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img 
                    src={moviePoster} 
                    alt={movieTitle} 
                    className="w-16 h-24 object-cover rounded-lg shadow-sm border border-gray-200/50 flex-shrink-0"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-16 h-24 bg-gray-200 rounded-lg flex items-center justify-center text-[8px] text-gray-400 flex-shrink-0">No Artwork</div>
                )}
                <div className="flex flex-col justify-center min-w-0 pr-16">
                  <h4 className="font-serif font-bold text-sm truncate">{movieTitle}</h4>
                  <div className="flex items-center gap-2 text-[10px] text-gray-500 font-medium mt-0.5">
                    {movieYear && <span>{movieYear}</span>}
                    {movieRating > 0 && <span className="text-[#C5A059] font-bold font-numbers">★ {movieRating}</span>}
                    {movieRuntime > 0 && <span className="font-numbers">{movieRuntime} min</span>}
                  </div>
                  {movieGenres.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {movieGenres.slice(0, 3).map((g: string) => (
                        <span key={g} className="text-[8px] bg-[#5D0D18]/10 text-[#5D0D18] px-1.5 py-0.5 rounded-full font-medium">{g}</span>
                      ))}
                    </div>
                  )}
                  {movieOverview && (
                    <p className="text-[10px] text-gray-500 mt-2 line-clamp-2 leading-relaxed">{movieOverview}</p>
                  )}
                </div>
              </div>
            )}

            {/* Custom inputs row (Editable details) */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] uppercase tracking-widest font-semibold text-[#5D0D18]/80">Invitation Title</label>
                <input
                  type="text"
                  value={movieTitle}
                  onChange={(e) => setMovieTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[#EBE6DD] bg-white text-xs text-[#5D0D18] focus:outline-none focus:ring-1 focus:ring-[#5D0D18] focus:border-[#5D0D18] transition-all"
                  placeholder="Leave blank to use the movie title automatically."
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] uppercase tracking-widest font-semibold text-[#5D0D18]/80">Who's this for?</label>
                <input
                  type="text"
                  value={partnerName}
                  placeholder="Enter their name"
                  onChange={(e) => setPartnerName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[#EBE6DD] bg-white text-xs text-[#5D0D18] focus:outline-none focus:ring-1 focus:ring-[#5D0D18] focus:border-[#5D0D18] transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] uppercase tracking-widest font-semibold text-[#5D0D18]/80">Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[#EBE6DD] bg-white text-xs text-[#5D0D18] focus:outline-none focus:ring-1 focus:ring-[#5D0D18] focus:border-[#5D0D18]"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] uppercase tracking-widest font-semibold text-[#5D0D18]/80">Time</label>
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[#EBE6DD] bg-white text-xs text-[#5D0D18] focus:outline-none focus:ring-1 focus:ring-[#5D0D18] focus:border-[#5D0D18]"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase tracking-widest font-semibold text-[#5D0D18]/80">Location</label>
              <input
                type="text"
                placeholder="Living Room"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-[#EBE6DD] bg-white text-xs text-[#5D0D18] focus:outline-none focus:ring-1 focus:ring-[#5D0D18] focus:border-[#5D0D18]"
              />
            </div>

            {/* Handwritten Letter text area */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase tracking-widest font-semibold text-[#5D0D18]/80">Write Your Note</label>
              <textarea
                rows={4}
                value={letterText}
                placeholder="Write something personal... This message will appear on the back of the invitation."
                onChange={(e) => setLetterText(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-[#EBE6DD] bg-white text-xs text-[#5D0D18] focus:outline-none focus:ring-1 focus:ring-[#5D0D18] focus:border-[#5D0D18]"
              />
            </div>

            {/* Theme Toggle */}
            <div className="flex items-center justify-between p-3 rounded-lg border border-[#EBE6DD] bg-[#FAF8F5]">
              <span className="text-[10px] uppercase tracking-widest font-semibold text-[#5D0D18]/80 flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-[#5D0D18]" /> Select Invitation Theme
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setTheme('light')}
                  type="button"
                  className={`w-7 h-7 rounded-full border-2 transition-transform duration-200 ${
                    theme === 'light' ? 'border-[#5D0D18] scale-110' : 'border-gray-200'
                  }`}
                  style={{ backgroundColor: '#FAF8F5' }}
                  title="Warm Cream Theme"
                />
                <button
                  onClick={() => setTheme('luxury')}
                  type="button"
                  className={`w-7 h-7 rounded-full border-2 transition-transform duration-200 ${
                    theme === 'luxury' ? 'border-[#C5A059] scale-110' : 'border-gray-200'
                  }`}
                  style={{ backgroundColor: '#5D0D18' }}
                  title="Luxury Burgundy Theme"
                />
              </div>
            </div>
          </div>

          {/* Action Footer */}
          <div className="mt-6 pt-4 border-t border-[#EBE6DD]">
            <button
              onClick={handleGenerateInvite}
              disabled={isGenerating}
              className="w-full py-3 bg-[#5D0D18] hover:bg-[#4E141B] disabled:bg-gray-400 text-white font-serif text-xs tracking-widest uppercase transition-colors duration-200 shadow-md cursor-pointer outline-none flex items-center justify-center gap-2 rounded-lg"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating Invitation...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 fill-current" />
                  Create Invitation
                </>
              )}
            </button>
          </div>
        </section>

        {/* RIGHT COLUMN: LIVE PREVIEW CONTAINER */}
        <section className="lg:col-span-6 xl:col-span-7 flex flex-col justify-between items-center rounded-2xl border border-[#EBE6DD] shadow-xl p-5 sm:p-7 bg-white/20 relative overflow-hidden backdrop-blur-sm">
          {/* Header Controls for Preview */}
          <div className="w-full flex justify-between items-center z-10 border-b border-[#5D0D18]/10 pb-4 mb-4">
            <span 
              className="font-serif italic text-xs tracking-wider flex items-center gap-1.5"
              style={{ color: theme === 'light' ? '#5D0D18' : '#F8F0BA' }}
            >
              <Eye 
                className="w-3.5 h-3.5" 
                style={{ color: theme === 'light' ? '#5D0D18' : '#F8F0BA' }}
              /> Live Preview
            </span>
            
            <div className="flex gap-2">
              <button
                onClick={() => setPreviewMode(previewMode === 'ticket' ? 'envelope' : 'ticket')}
                className="px-3 py-1 bg-[#FAF8F5] border border-[#EBE6DD] rounded-full text-[10px] font-semibold text-[#5D0D18] hover:bg-[#EBE6DD] transition-colors"
              >
                {previewMode === 'ticket' ? 'Preview Envelope' : 'Preview Ticket'}
              </button>
              {previewMode === 'envelope' && (
                <button
                  onClick={resetEnvelopePreview}
                  className="p-1 bg-[#FAF8F5] border border-[#EBE6DD] rounded-full text-[#5D0D18] hover:bg-[#EBE6DD] transition-colors"
                  title="Reset Envelope Animation"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Interactive Screen viewport */}
          <div className="flex-1 w-full flex items-center justify-center relative rounded-lg border border-[#EBE6DD]/60 bg-[#FDFBF7] shadow-inner overflow-hidden min-h-[460px]">
            {/* The same background floats in the preview frame */}
            <div className="absolute inset-0 scale-[0.98] pointer-events-none rounded-lg overflow-hidden">
              <ThemeBackground theme={theme} />
            </div>

            {/* Preview Frame content */}
            <div className="z-10 w-full flex justify-center py-6">
              {previewMode === 'ticket' ? (
                <Ticket
                  movieTitle={movieTitle}
                  moviePoster={moviePoster}
                  movieBackdrop={movieBackdrop}
                  streamingUrl={streamingUrl}
                  partnerName={partnerName}
                  senderName={senderName}
                  date={date}
                  time={time}
                  location={location}
                  letterText={letterText}
                  theme={theme}
                  isFlipped={previewTicketFlipped}
                  onFlip={() => setPreviewTicketFlipped(!previewTicketFlipped)}
                />
              ) : (
                <Envelope
                  theme={theme}
                  partnerName={partnerName}
                  senderName={senderName}
                  isOpen={previewEnvelopeOpen}
                  onOpen={() => {
                    setPreviewEnvelopeOpen(true);
                    setPreviewMode('ticket'); // Transition to showing the ticket
                  }}
                >
                  <Ticket
                    movieTitle={movieTitle}
                    moviePoster={moviePoster}
                    movieBackdrop={movieBackdrop}
                    streamingUrl={streamingUrl}
                    partnerName={partnerName}
                    senderName={senderName}
                    date={date}
                    time={time}
                    location={location}
                    letterText={letterText}
                    theme={theme}
                    isFlipped={previewTicketFlipped}
                    onFlip={() => {}}
                  />
                </Envelope>
              )}
            </div>
          </div>

          <div 
            className="w-full flex items-center gap-1.5 text-[9px] justify-center mt-3 z-10 font-bold"
            style={{ color: theme === 'light' ? 'rgba(93, 13, 24, 0.7)' : 'rgba(248, 240, 186, 0.8)' }}
          >
            Hover to tilt • Click to flip
          </div>
        </section>
      </main>

      {/* SHAREABLE LINK POPUP MODAL */}
      <AnimatePresence>
        {generatedInviteId && (
          <motion.div 
            className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div 
              className="w-full max-w-md bg-[#FAF8F5] border border-[#EBE6DD] rounded-2xl p-6 shadow-2xl relative overflow-hidden text-center"
              initial={{ scale: 0.9, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 30 }}
            >
              <div 
                className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-overlay"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
                }}
              />

              <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-green-200">
                <Check className="w-6 h-6 text-green-600" />
              </div>

              <h2 className="font-serif text-xl font-medium tracking-wide text-[#5D0D18] mb-1">
                Your Invitation is Ready!
              </h2>
              <p className="text-xs text-gray-500 max-w-sm mx-auto mb-6">
                Copy the unique premium invitation link below and share it with your partner.
              </p>

              {/* Copy box */}
              <div className="flex gap-2 p-2 bg-white border border-[#EBE6DD] rounded-lg items-center text-left mb-6">
                <span className="text-xs text-gray-600 truncate flex-1 pl-2 select-all">
                  {typeof window !== 'undefined' 
                    ? `${window.location.origin}/invite/${generatedInviteId}`
                    : `https://movienightinvite.com/invite/${generatedInviteId}`}
                </span>
                <button
                  onClick={handleCopyLink}
                  className="px-3 py-1.5 bg-[#5D0D18] hover:bg-[#4E141B] text-white text-[10px] uppercase font-semibold tracking-wider rounded flex items-center gap-1 transition-colors cursor-pointer"
                >
                  {isCopied ? (
                    <>
                      <Check className="w-3 h-3" /> Copied
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" /> Copy
                    </>
                  )}
                </button>
              </div>

              {/* Action columns */}
              <div className="grid grid-cols-2 gap-3 mt-4">
                <button
                  onClick={() => setGeneratedInviteId(null)}
                  className="w-full py-2.5 rounded-lg border border-[#EBE6DD] text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Close
                </button>
                <a
                  href={`/invite/${generatedInviteId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 bg-[#5D0D18] hover:bg-[#4E141B] text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-sm rounded-lg"
                >
                  View Experience <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
