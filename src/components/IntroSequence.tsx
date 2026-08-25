import React from 'react';
import { motion } from 'motion/react';

export function IntroSequence({ onComplete }: { onComplete: () => void }) {
  return (
    <motion.div
      className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-[#050505] overflow-hidden"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1.2, ease: "easeInOut" }}
    >
      {/* Cinematic Pre-Title */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9, filter: 'blur(10px)' }}
        animate={{ opacity: [0, 1, 1, 0], scale: [0.9, 1, 1.05, 1.1], filter: ['blur(10px)', 'blur(0px)', 'blur(0px)', 'blur(10px)'] }}
        transition={{ duration: 2.8, times: [0, 0.2, 0.8, 1], ease: "easeInOut" }}
        className="absolute flex flex-col items-center justify-center text-center px-4 z-10 w-full"
      >
        <span className="text-red-600 font-mono text-sm md:text-lg font-bold uppercase tracking-[0.5em] mb-3 md:mb-4">
          Belgaum's First
        </span>
        <span className="text-gray-200 font-display text-3xl md:text-6xl uppercase tracking-widest drop-shadow-lg">
          Cloud Protein Kitchen
        </span>
      </motion.div>

      {/* "WHEYO" Slam */}
      <motion.div
        initial={{ scale: 30, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.1, delay: 3.0, ease: "easeIn" }}
        onAnimationComplete={() => {
          setTimeout(onComplete, 2000); // Hold for 2s after slam
        }}
        className="relative flex flex-col items-center justify-center z-30 w-full"
      >
        <motion.h1 
          animate={{ x: [0, -15, 15, -10, 10, 0], y: [0, 15, -15, 10, -10, 0] }}
          transition={{ duration: 0.4, delay: 3.0 }}
          className="text-[28vw] md:text-[22rem] font-black uppercase tracking-tighter leading-none text-white drop-shadow-[0_0_50px_rgba(255,0,0,0.8)]"
        >
          WHEYO
        </motion.h1>
        <motion.div
          initial={{ opacity: 0, scale: 1.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.2, delay: 3.15, type: "spring", stiffness: 200 }}
          className="bg-red-600 text-white px-6 py-2 md:py-4 mt-[-6vw] md:mt-[-4vw] z-40 transform -rotate-2 shadow-2xl border-2 border-black"
        >
          <h2 className="text-2xl md:text-6xl font-display uppercase tracking-widest m-0 leading-none">
            The Protein Kitchen
          </h2>
        </motion.div>
      </motion.div>

      {/* Impact Flash & Blood Splatter */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 1, 0.4, 0] }}
        transition={{ duration: 1.5, delay: 3.0, times: [0, 0.05, 0.2, 1] }}
        className="absolute inset-0 bg-red-600 mix-blend-overlay pointer-events-none z-40"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: [0, 0.9, 0.9], scale: [0.5, 1.1, 1.15] }}
        transition={{ duration: 2.5, delay: 3.0, ease: "easeOut" }}
        className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1500462918059-b1a0cb512f1d?auto=format&fit=crop&q=80&w=2000')] bg-cover bg-center mix-blend-color-dodge pointer-events-none z-20"
      />
      
      {/* Vignette for cinematic feel */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_10%,#050505_100%)] z-50 pointer-events-none" />
    </motion.div>
  );
}
