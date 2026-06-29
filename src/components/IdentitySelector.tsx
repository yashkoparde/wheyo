import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import { supabase } from '../lib/supabase';
import type { Session } from '@supabase/supabase-js';

interface IdentitySelectorProps {
  session: Session | null;
  onSelect: (segment: string) => void;
  onCancel?: () => void;
  showCancelButton?: boolean;
}

// Hand-crafted premium custom SVGs in the Wheyo brand colors
const StudentIcon = () => (
  <svg className="w-10 h-10 sm:w-16 sm:h-16 md:w-20 md:h-20 transition-transform duration-300 group-hover:scale-115" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Clean geometric Graduation cap in Wheyo Volt-lime and white */}
    <path d="M50 15L12 33L50 51L88 33L50 15Z" stroke="#D4FF00" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M24 41.5V67C24 73 35 78 50 78C65 78 76 73 76 67V41.5" stroke="#FFFFFF" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M88 33V58" stroke="#D4FF00" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
    {/* Energetic High-Calorie Bolt */}
    <path d="M50 36L42 52H52L46 68L58 48H48L54 36" fill="#D4FF00" stroke="#000000" strokeWidth="2.5" strokeLinejoin="round" />
  </svg>
);

const ProfessionalIcon = () => (
  <svg className="w-10 h-10 sm:w-16 sm:h-16 md:w-20 md:h-20 transition-transform duration-300 group-hover:scale-115" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Focus Coffee / Biohacking Clean Energy Mug */}
    <path d="M30 35H66V64C66 71.5 60 77.5 52.5 77.5H43.5C36 77.5 30 71.5 30 64V35Z" stroke="#FFFFFF" strokeWidth="5" strokeLinejoin="round" />
    <path d="M66 42H76C80 42 83 45 83 49V53C83 57 80 60 76 60H66" stroke="#D4FF00" strokeWidth="5" strokeLinecap="round" />
    {/* Focus targets */}
    <circle cx="48" cy="56" r="8" stroke="#D4FF00" strokeWidth="4.5" />
    {/* Razor-sharp energy waves */}
    <path d="M38 23C38 18 42 18 42 14" stroke="#D4FF00" strokeWidth="4" strokeLinecap="round" />
    <path d="M48 23C48 18 52 18 52 14" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" />
    <path d="M58 23C58 18 62 18 62 14" stroke="#D4FF00" strokeWidth="4" strokeLinecap="round" />
  </svg>
);

const AthleteIcon = () => (
  <svg className="w-10 h-10 sm:w-16 sm:h-16 md:w-20 md:h-20 transition-transform duration-300 group-hover:scale-115" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Heavy Athletic barbell / Gold macro density */}
    <path d="M18 45C18 62 30 76 50 78C70 76 82 62 82 45" stroke="#FFFFFF" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M22 45H78" stroke="#D4FF00" strokeWidth="7" strokeLinecap="round" />
    <rect x="25" y="32" width="10" height="26" rx="4" fill="#D4FF00" stroke="#000000" strokeWidth="3" />
    <rect x="15" y="36" width="7" height="18" rx="2" fill="#FFFFFF" stroke="#000000" strokeWidth="2.5" />
    <rect x="65" y="32" width="10" height="26" rx="4" fill="#D4FF00" stroke="#000000" strokeWidth="3" />
    <rect x="78" y="36" width="7" height="18" rx="2" fill="#FFFFFF" stroke="#000000" strokeWidth="2.5" />
    {/* Champion peak star */}
    <path d="M50 16L53 23H60L54 28L56 35L50 31L44 35L46 28L40 23H47L50 16Z" fill="#D4FF00" />
  </svg>
);

export function IdentitySelector({ session, onSelect, onCancel, showCancelButton = false }: IdentitySelectorProps) {
  const [isSaving, setIsSaving] = useState<string | null>(null);

  const profiles = [
    {
      id: 'student',
      title: 'Student / Hosteler',
      subtext: 'Mass Calories • Budget Fuel',
      desc: 'Budget-friendly, high-yield mass calories, recovery fuel, and fast campus tiffins.',
      icon: StudentIcon,
      accentColor: '#D4FF00',
      glowClass: 'group-hover:ring-[#D4FF00]/60 hover:shadow-[0_0_25px_rgba(212,255,0,0.25)]',
    },
    {
      id: 'professional',
      title: 'Working Professional',
      subtext: 'Premium Clean • Focus Energy',
      desc: 'High convenience, premium focus-enhancing clean meals, energy and lean muscle maintenance.',
      icon: ProfessionalIcon,
      accentColor: '#FFFFFF',
      glowClass: 'group-hover:ring-white/60 hover:shadow-[0_0_25px_rgba(255,255,255,0.15)]',
    },
    {
      id: 'elite',
      title: 'Elite Athlete',
      subtext: 'Peak Macros • Max Protein',
      desc: 'Gold-standard macros, absolute maximum lean protein density, and champion physical recovery.',
      icon: AthleteIcon,
      accentColor: '#D4FF00',
      glowClass: 'group-hover:ring-[#D4FF00]/60 hover:shadow-[0_0_25px_rgba(212,255,0,0.25)]',
    }
  ];

  const handleSelect = async (segmentId: string) => {
    setIsSaving(segmentId);
    try {
      localStorage.setItem('user_segment', segmentId);

      if (supabase && session?.user?.id) {
        // Update user_segment in profiles table in database
        const { error } = await supabase
          .from('profiles')
          .update({ user_segment: segmentId })
          .eq('id', session.user.id);

        if (error) {
          console.warn('Could not update segment in Supabase database profile, using localStorage fallback:', error.message);
        }
      }

      onSelect(segmentId);
    } catch (err) {
      console.error('Error in identity selection:', err);
      onSelect(segmentId); // Fallback to local redirection
    } finally {
      setIsSaving(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-[#000000] z-[150] flex flex-col items-center justify-center p-4 sm:p-6 md:p-8 select-none overflow-y-auto selection:bg-[#D4FF00] selection:text-black">
      {/* Cinematic Film Grain Overlay */}
      <div className="pointer-events-none fixed inset-0 z-50 h-full w-full opacity-[0.03] mix-blend-overlay" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }} />

      {/* Cinematic Spotlight Backdrop */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[250px] sm:w-[500px] h-[250px] sm:h-[500px] bg-[#D4FF00]/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-4xl mx-auto flex flex-col items-center relative z-10 py-4 sm:py-8">
        {/* Main Title Section - Optimized height and font size */}
        <motion.div
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mb-6 sm:mb-12 px-2"
        >
          <span className="text-red-600 font-mono text-[8px] sm:text-xs font-black uppercase tracking-[0.3em] mb-1 sm:mb-2 block">
            WHEYO PROTIEN CLOUD KITCHEN
          </span>
          <h1 className="text-2xl sm:text-4xl md:text-5xl font-display font-black uppercase text-white tracking-wider leading-none">
            Who is fueling today?
          </h1>
          <p className="text-zinc-500 font-mono text-[9px] sm:text-xs mt-2 max-w-lg mx-auto leading-relaxed">
            Select your profile to automatically load customized menu selections, athletic pricing, and performance macros.
          </p>
        </motion.div>

        {/* Netflix-Style Circle Profiles Grid (Fully Optimized for 3-Across Mobile Viewports with ZERO Vertical Scroll) */}
        <div className="grid grid-cols-3 gap-3 sm:gap-8 md:gap-12 w-full max-w-3xl px-1 sm:px-4 justify-items-center">
          {profiles.map((profile, index) => {
            const IconComponent = profile.icon;
            const isProfileSaving = isSaving === profile.id;

            return (
              <motion.div
                key={profile.id}
                initial={{ opacity: 0, scale: 0.9, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.08, ease: [0.16, 1, 0.3, 1] }}
                className="flex flex-col items-center group cursor-pointer w-full text-center"
                onClick={() => !isSaving && handleSelect(profile.id)}
              >
                {/* Netflix Circle Avatar Container - Super mobile friendly sizing */}
                <div className={`relative w-20 h-20 sm:w-32 sm:h-32 md:w-38 md:h-38 rounded-full border border-zinc-800 bg-zinc-950/80 flex flex-col items-center justify-center overflow-hidden mb-2 sm:mb-4 transition-all duration-300 ring-0 ring-offset-0 ring-offset-transparent group-hover:ring-2 sm:group-hover:ring-4 group-hover:ring-offset-2 sm:group-hover:ring-offset-4 group-hover:ring-offset-black ${profile.glowClass} active:scale-95 touch-manipulation`}>
                  
                  {/* Subtle color overlay on hover */}
                  <div className="absolute inset-0 bg-[#D4FF00]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                  {/* Icon or Loader */}
                  {isProfileSaving ? (
                    <Loader2 className="w-6 h-6 sm:w-10 sm:h-10 text-[#D4FF00] animate-spin" />
                  ) : (
                    <IconComponent />
                  )}
                </div>

                {/* Profile Name - Fits perfectly on mobile screens */}
                <span className="text-zinc-400 text-[10px] sm:text-xs md:text-sm font-mono font-bold uppercase tracking-wider group-hover:text-white transition-colors duration-200">
                  {profile.id === 'student' ? 'Student' : profile.id === 'professional' ? 'Professional' : 'Elite Athlete'}
                </span>

                {/* Compact mobile-friendly high-yield identity subtext */}
                <span className="text-zinc-500 text-[8px] sm:text-[9.5px] font-mono tracking-wider mt-1 block">
                  {profile.subtext}
                </span>

                {/* Profile Description - Hidden on mobile to prevent clutter and keep UI entirely inside screen height */}
                <span className="hidden sm:block text-zinc-500 font-mono text-[10px] md:text-[10.5px] text-center mt-2 px-1 max-w-[180px] md:max-w-[220px] leading-relaxed group-hover:text-zinc-300 transition-colors duration-200">
                  {profile.desc}
                </span>
              </motion.div>
            );
          })}
        </div>

        {/* Action / Back Button */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-8 sm:mt-12 flex flex-col items-center gap-3 px-4"
        >
          {showCancelButton && onCancel && (
            <button
              onClick={onCancel}
              className="px-6 py-2.5 bg-transparent hover:bg-zinc-900 text-zinc-500 hover:text-white border border-zinc-800 hover:border-zinc-700 rounded-xl font-mono text-[9px] sm:text-xs uppercase tracking-widest transition-all duration-300 cursor-pointer active:scale-95 touch-manipulation"
            >
              Cancel & Go Back
            </button>
          )}
        </motion.div>
      </div>
    </div>
  );
}
