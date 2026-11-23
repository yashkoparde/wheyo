import React, { useEffect } from 'react';
import { motion } from 'motion/react';

export function IntroSequence({ onComplete }: { onComplete: () => void }) {
  // Guaranteed completion safety timer (ensures onComplete triggers even if GPU animation callback drops)
  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete();
    }, 5200);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <motion.div
      onClick={onComplete}
      className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-[#050505] overflow-hidden cursor-pointer select-none"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1.2, ease: "easeInOut" }}
    >
      {/* Cinematic Pre-Title */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: [0, 1, 1, 0], scale: [0.95, 1, 1.02, 1.05] }}
        transition={{ duration: 2.2, times: [0, 0.25, 0.75, 1], ease: "easeInOut" }}
        className="absolute flex flex-col items-center justify-center text-center px-4 z-20 w-full"
      >
        <span className="text-red-500 font-mono text-sm md:text-lg font-black uppercase tracking-[0.4em] mb-2 sm:mb-3 drop-shadow-[0_2px_10px_rgba(255,0,0,0.5)]">
          Belgaum's First
        </span>
        <span className="text-white font-display text-3xl sm:text-5xl md:text-6xl uppercase tracking-widest drop-shadow-[0_4px_20px_rgba(0,0,0,0.9)]">
          Cloud Protein Kitchen
        </span>
      </motion.div>

      {/* "WHEYO" Slam */}
      <motion.div
        initial={{ scale: 3, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.25, delay: 2.3, ease: "easeOut" }}
        className="relative flex flex-col items-center justify-center z-30 w-full px-4"
      >
        <motion.h1 
          animate={{ x: [0, -10, 10, -5, 5, 0], y: [0, 8, -8, 4, -4, 0] }}
          transition={{ duration: 0.35, delay: 2.35 }}
          className="text-[26vw] sm:text-[20vw] md:text-[14rem] lg:text-[18rem] font-black uppercase tracking-tighter leading-none text-white drop-shadow-[0_0_60px_rgba(220,38,38,0.7)]"
        >
          WHEYO
        </motion.h1>
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.25, delay: 2.5, type: "spring", stiffness: 220 }}
          className="bg-red-600 text-white px-5 sm:px-8 py-2 sm:py-3.5 mt-[-4vw] sm:mt-[-3vw] md:mt-[-2.5rem] z-40 transform -rotate-2 shadow-[0_10px_30px_rgba(220,38,38,0.5)] border-2 border-black"
        >
          <h2 className="text-xl sm:text-3xl md:text-5xl font-display uppercase tracking-widest m-0 leading-none">
            The Protein Kitchen
          </h2>
        </motion.div>
      </motion.div>

      {/* Impact Flash */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.8, 0] }}
        transition={{ duration: 0.6, delay: 2.3, times: [0, 0.1, 1] }}
        className="absolute inset-0 bg-red-600 mix-blend-screen pointer-events-none z-40"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: [0, 0.9, 0.9], scale: [0.5, 1.1, 1.15] }}
        transition={{ duration: 2.5, delay: 3.0, ease: "easeOut" }}
        className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1500462918059-b1a0cb512f1d?auto=format&fit=crop&q=80&w=2000')] bg-cover bg-center mix-blend-color-dodge pointer-events-none z-20"
      />
      
      {/* Vignette for cinematic feel */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_10%,#050505_100%)] z-50 pointer-events-none" />

      {/* Instant Skip Trigger */}
      <div className="absolute bottom-6 sm:bottom-8 z-50 text-zinc-500 hover:text-zinc-300 font-mono text-[10px] uppercase tracking-widest transition-colors">
        Tap anywhere to enter →
      </div>
    </motion.div>
  );
}
