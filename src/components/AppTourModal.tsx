import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Dumbbell, ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { preloadTourAssets } from '../lib/preloadTourAssets';
import type { Session } from '@supabase/supabase-js';

export const APP_TOUR_STEPS = [
  {
    step: 0,
    title: "Personalized Nutrition Profiles",
    commentary: "Select between Student, Working Professional, and Athlete profiles to automatically adjust your meal calories, protein ratios, and prices.",
    actionRoute: "/",
    badge: "SELECT YOUR PROFILE",
    highlightId: "identity-selectors"
  },
  {
    step: 1,
    title: "Search & Macro Filters",
    commentary: "Filter meals by Veg, Non-Veg, High Protein, or search directly for specific items.",
    actionRoute: "/",
    badge: "SEARCH & MACRO FILTERS",
    highlightId: "search-controls"
  },
  {
    step: 2,
    title: "High-Protein Food Menu",
    commentary: "Browse clean, chef-cooked meals with verified protein, calorie, carb, and fat breakdowns.",
    actionRoute: "/",
    badge: "FULL MEAL CATALOG",
    highlightId: "food-items-deck"
  },
  {
    step: 3,
    title: "Daily Meal Subscriptions",
    commentary: "Get fresh, hot meals delivered daily to your gym or campus before your training session.",
    actionRoute: "/subscriptions",
    badge: "DAILY MEAL PLANS",
    highlightId: "tour-subscription-plans"
  },
  {
    step: 4,
    title: "7-Day Protein Tracker",
    commentary: "Track your daily protein intake automatically whenever you order and consume meals.",
    actionRoute: "/profile",
    badge: "PROTEIN PROGRESS CHART",
    highlightId: "tour-protein-chart"
  },
  {
    step: 5,
    title: "Meal Logging and Reorder",
    commentary: "Keep track of your daily nutrition logs and reorder your favorite meals in 1 tap.",
    actionRoute: "/profile",
    badge: "MEAL LOGGING & REORDER",
    highlightId: "tour-meal-diary"
  },
  {
    step: 6,
    title: "Supplements & Daily Recovery",
    commentary: "Track your whey protein, creatine, water intake, and daily sleep for maximum recovery.",
    actionRoute: "/profile",
    badge: "SUPPLEMENTS & WATER TRACKER",
    highlightId: "tour-supplements"
  },
  {
    step: 7,
    title: "Quick Checkout & Pick Up",
    commentary: "Select your campus gate, hostel, or gym pickup point in your cart.",
    actionRoute: "/",
    badge: "SELECT PICKUP LOCATION",
    highlightId: "tour-cart-extraction"
  },
  {
    step: 8,
    title: "Register & Order Now",
    commentary: "Create your profile or order now to get fresh, chef-cooked high-protein meals delivered directly to your location!",
    actionRoute: "/login",
    badge: "REGISTER & ORDER NOW",
    highlightId: "login-container"
  },
];

export function AppTourModal({ session }: { session?: Session | null }) {
  const { tourStep, setTourStep, setIsCartOpen, endTour, hasTourEnded } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const [targetRect, setTargetRect] = useState<{ top: number; left: number; width: number; height: number } | null>(null);

  // Direction tracking for frame-by-frame slide animation
  const prevStepRef = useRef<number>(0);
  const [direction, setDirection] = useState<number>(1);

  // Ensure tour automatically starts upon refreshes unless user has signed in
  useEffect(() => {
    if (!session?.user) {
      if (tourStep === null && !hasTourEnded) {
        setTourStep(0);
      }
    } else {
      if (tourStep !== null) {
        endTour();
      }
    }
  }, [session?.user]);

  // Pre-load menu data & profile image assets during early tour stages
  useEffect(() => {
    preloadTourAssets();
  }, []);

  // Update direction on tourStep change
  useEffect(() => {
    if (tourStep !== null) {
      if (tourStep > prevStepRef.current) {
        setDirection(1);
      } else if (tourStep < prevStepRef.current) {
        setDirection(-1);
      }
      prevStepRef.current = tourStep;
    }
  }, [tourStep]);

  const currentStepData = tourStep !== null && tourStep >= 0 && tourStep < APP_TOUR_STEPS.length 
    ? APP_TOUR_STEPS[tourStep] 
    : null;

  // Auto-navigate to actual feature route & open drawer/view when step changes
  useEffect(() => {
    if (currentStepData) {
      if (currentStepData.actionRoute && location.pathname !== currentStepData.actionRoute) {
        navigate(currentStepData.actionRoute);
      }

      // If step 7 (Cart checkout location), open cart drawer
      if (tourStep === 7) {
        setIsCartOpen(true);
      } else {
        setIsCartOpen(false);
      }

      // Preload assets trigger on step change as well
      preloadTourAssets();

      // Always keep page at top during tour step changes
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
      document.body.scrollTop = 0;
      document.documentElement.scrollTop = 0;
      setTimeout(() => {
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
        document.body.scrollTop = 0;
        document.documentElement.scrollTop = 0;
      }, 50);
    }
  }, [tourStep, currentStepData, navigate, location.pathname, setIsCartOpen]);

  // Continuously track target element DOM position for pinpoint highlighting
  useEffect(() => {
    if (!currentStepData || tourStep === null || location.pathname === '/login') {
      setTargetRect(null);
      return;
    }

    const updateRect = () => {
      const el = document.getElementById(currentStepData.highlightId);
      if (el) {
        const rect = el.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          setTargetRect({
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height
          });
          return;
        }
      }
      setTargetRect(null);
    };

    updateRect();
    const timer = setTimeout(updateRect, 300);
    window.addEventListener('resize', updateRect, { passive: true });
    window.addEventListener('scroll', updateRect, { passive: true });

    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', updateRect);
      window.removeEventListener('scroll', updateRect);
    };
  }, [currentStepData, tourStep, location.pathname]);

  if (tourStep === null || !currentStepData) return null;

  const scrollToTop = () => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
    document.body.scrollTop = 0;
    document.documentElement.scrollTop = 0;
  };

  const handleNext = () => {
    scrollToTop();
    if (tourStep < APP_TOUR_STEPS.length - 1) {
      setTourStep(tourStep + 1);
    } else {
      endTour();
    }
  };

  const handlePrev = () => {
    scrollToTop();
    if (tourStep > 0) {
      setTourStep(tourStep - 1);
    }
  };

  const handleFinishLastStep = () => {
    scrollToTop();
    navigate("/login");
    endTour();
  };

  const handleClose = () => {
    scrollToTop();
    endTour();
  };

  // Gamified slide animation variants for frame-by-frame step changes
  const slideVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 50 : -50,
      opacity: 0,
      scale: 0.96,
      filter: 'blur(2px)',
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
      filter: 'blur(0px)',
    },
    exit: (dir: number) => ({
      x: dir < 0 ? 50 : -50,
      opacity: 0,
      scale: 0.96,
      filter: 'blur(2px)',
    }),
  };

  return (
    <>
      {/* Live Feature Spotlight Frame & Pointer Tag Anchored Directly to the Component */}
      {targetRect && location.pathname !== '/login' && (
        <>
          {/* Glowing Target Frame with smooth sliding CSS transition */}
          <div
            className="fixed pointer-events-none z-[95] border-2 border-[#D4FF00] rounded-xl sm:rounded-2xl shadow-[0_0_25px_rgba(212,255,0,0.5),inset_0_0_12px_rgba(212,255,0,0.15)] animate-pulse"
            style={{
              top: Math.max(4, targetRect.top - 6),
              left: Math.max(4, targetRect.left - 6),
              width: Math.min(window.innerWidth - 8, targetRect.width + 12),
              height: targetRect.height + 12,
              transition: 'top 0.3s cubic-bezier(0.16, 1, 0.3, 1), left 0.3s cubic-bezier(0.16, 1, 0.3, 1), width 0.3s cubic-bezier(0.16, 1, 0.3, 1), height 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          />

          {/* Pointer Badge Tag with frame slide animation */}
          <motion.div
            key={`pointer-${tourStep}`}
            initial={{ opacity: 0, y: -10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            className="fixed z-[96] pointer-events-none flex flex-col items-center"
            style={{
              top: Math.max(12, targetRect.top - 44),
              left: Math.max(12, Math.min(window.innerWidth - 240, targetRect.left + targetRect.width / 2 - 100)),
              transition: 'top 0.3s cubic-bezier(0.16, 1, 0.3, 1), left 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          >
            <div className="bg-black/95 border-2 border-[#D4FF00] text-[#D4FF00] font-mono text-[9px] sm:text-xs font-black uppercase tracking-wider px-3 py-0.5 rounded-full shadow-[0_0_20px_rgba(212,255,0,0.5)] backdrop-blur-md flex items-center justify-center animate-bounce">
              <span>{currentStepData.badge}</span>
            </div>
          </motion.div>
        </>
      )}

      {/* Gamified Frame-by-Frame Mobile-First Control Dock */}
      <div className="fixed inset-x-0 bottom-2.5 sm:bottom-5 z-[100] flex justify-center px-2.5 sm:px-4 pointer-events-none">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={tourStep}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: "spring", stiffness: 380, damping: 30 },
              opacity: { duration: 0.15 },
              scale: { duration: 0.18 }
            }}
            className="relative z-[110] bg-[#0A0A0C]/95 border border-[#D4FF00]/50 shadow-[0_8px_32px_rgba(0,0,0,0.9),0_0_20px_rgba(212,255,0,0.15)] backdrop-blur-xl rounded-xl sm:rounded-2xl p-3 sm:p-4 max-w-[90vw] sm:max-w-sm w-full text-left pointer-events-auto select-none"
          >
            {/* Top Glowing Accent Line */}
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#D4FF00] to-transparent rounded-t-xl sm:rounded-t-2xl" />

            {/* Centered Glowing Step Indicator Dots */}
            <div className="flex items-center justify-center gap-1.5 mb-2">
              {APP_TOUR_STEPS.map((s) => {
                const isActive = s.step === tourStep;
                const isPassed = s.step < tourStep;
                return (
                  <div
                    key={s.step}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      isActive
                        ? 'w-5 bg-[#D4FF00] shadow-[0_0_8px_#D4FF00]'
                        : isPassed
                        ? 'w-2 bg-white/60'
                        : 'w-1.5 bg-white/20'
                    }`}
                  />
                );
              })}
            </div>

            {/* Title & Close */}
            <div className="flex items-center justify-between gap-2 mb-1">
              <div className="flex items-center gap-1.5 min-w-0">
                <Dumbbell className="w-3.5 h-3.5 text-[#D4FF00] shrink-0" />
                <h3 className="text-[11px] sm:text-xs font-mono font-bold uppercase text-white tracking-wide truncate">
                  {currentStepData.title}
                </h3>
              </div>

              <button
                onClick={handleClose}
                className="text-zinc-400 hover:text-white font-mono text-xs uppercase px-1 py-0.5 rounded hover:bg-white/10 transition-colors cursor-pointer shrink-0"
                title="Close & End Tour"
              >
                ✕
              </button>
            </div>

            {/* Commentary */}
            <p className="text-zinc-300 font-mono text-[10px] sm:text-xs leading-tight mb-2.5">
              {currentStepData.commentary}
            </p>

            {/* Navigation Controls */}
            <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/10">
              <button
                onClick={handlePrev}
                disabled={tourStep === 0}
                className="px-2.5 sm:px-3 py-1 bg-[#18181B] hover:bg-zinc-800 disabled:opacity-30 text-zinc-200 font-mono text-[10px] sm:text-xs font-bold uppercase rounded-lg transition-all border border-white/10 flex items-center gap-1 cursor-pointer disabled:cursor-not-allowed shadow-[0_0_10px_rgba(0,0,0,0.5)] shrink-0"
              >
                <ChevronLeft className="w-3.5 h-3.5 text-[#D4FF00]" />
                <span>PREV</span>
              </button>

              {tourStep < APP_TOUR_STEPS.length - 1 ? (
                <button
                  onClick={handleNext}
                  className="px-3 sm:px-4 py-1 bg-[#D4FF00] hover:bg-white text-black font-mono text-[10px] sm:text-xs font-black uppercase rounded-lg transition-all shadow-[0_0_15px_rgba(212,255,0,0.3)] active:scale-95 cursor-pointer flex items-center gap-1 shrink-0"
                >
                  <span>NEXT</span>
                  <ChevronRight className="w-3.5 h-3.5 stroke-[3]" />
                </button>
              ) : (
                <button
                  onClick={handleFinishLastStep}
                  className="px-3 sm:px-4 py-1 bg-[#D4FF00] hover:bg-white text-black font-mono text-[10px] sm:text-xs font-black uppercase rounded-lg transition-all shadow-[0_0_20px_rgba(212,255,0,0.4)] active:scale-95 cursor-pointer flex items-center gap-1.5 font-extrabold shrink-0"
                >
                  <span>REGISTER & ORDER NOW</span>
                  <ArrowRight className="w-3.5 h-3.5 stroke-[3]" />
                </button>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </>
  );
}


