import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, Navigate } from 'react-router-dom';
import { Dumbbell, Utensils, ShoppingBag, User, Sparkles, Trophy, Flame, X } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { motion, AnimatePresence } from 'motion/react';
import { CartProvider, useCart } from '../context/CartContext';
import { CartDrawer } from './CartDrawer';
import { AppTourModal } from './AppTourModal';
import { initNotificationEngine } from '../lib/notificationEngine';
import type { Session } from '@supabase/supabase-js';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const SubscriptionNavIcon = ({ className }: { className?: string }) => (
  <svg 
    className={className} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2.5" 
    strokeLinecap="round" 
    strokeLinejoin="round"
  >
    <path d="M21.5 2v6h-6" />
    <path d="M21.34 15.57a10 10 0 1 1-.57-8.38l.73-.73" />
    <circle cx="12" cy="12" r="3.5" fill="#D4FF00" stroke="none" />
  </svg>
);

function Header({ session }: { session: Session | null }) {
  const location = useLocation();
  const { items, setIsCartOpen } = useCart();
  const user = session?.user ?? null;

  const navItems = [
    { path: '/', label: 'Menu', mobileLabel: 'Menu', icon: Utensils },
    { path: '/workouts', label: 'Workouts', mobileLabel: 'Workouts', icon: Dumbbell },
    { path: '/campus-league', label: 'Campus League', mobileLabel: 'Campus', icon: Trophy },
    { path: '/subscriptions', label: 'Meal Plans', mobileLabel: 'Plans', icon: SubscriptionNavIcon },
    { path: user ? '/profile' : '/login', label: user ? 'Profile' : 'Log In', mobileLabel: user ? 'Profile' : 'Login', icon: User },
  ];

  const mobileNavItems = navItems;

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <>
      {/* Desktop Nav */}
      <nav className="sticky top-0 z-40 border-b border-white/5 bg-[#050505]/80 backdrop-blur-md hidden md:block">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <Link to="/" className="flex items-center gap-3 group">
              <Dumbbell className="h-8 w-8 text-[#D4FF00] group-hover:scale-110 transition-transform" />
              <span className="font-display text-2xl tracking-wide uppercase font-black text-white group-hover:text-[#D4FF00] transition-colors">
                Wheyo
              </span>
            </Link>
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-8">
                {navItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={cn(
                      'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold uppercase tracking-wider transition-colors',
                      location.pathname === item.path
                        ? 'bg-white/10 text-[#D4FF00]'
                        : 'text-gray-400 hover:bg-white/5 hover:text-white'
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
            <div className="hidden md:flex items-center gap-4">
              <Link
                to={user ? '/profile' : '/login'}
                className="p-2.5 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors"
                title={user ? 'Profile' : 'Login'}
              >
                <User className={cn("h-5 w-5", user ? "text-[#D4FF00]" : "text-gray-400")} />
              </Link>
              <button
                onClick={() => setIsCartOpen(true)}
                className="relative flex items-center gap-2 bg-[#141414] border border-white/10 px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-white/5 hover:border-white/20 transition-all"
              >
                <ShoppingBag className="h-5 w-5 text-[#D4FF00]" />
                Cart
                {totalItems > 0 && (
                  <motion.span 
                    key={totalItems}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 500, damping: 15 }}
                    className="absolute -top-2 -right-2 bg-[#FF3E00] text-white text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full border-2 border-[#050505]"
                  >
                    {totalItems}
                  </motion.span>
                )}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Top Header */}
      <div className="md:hidden sticky top-0 z-40 border-b border-white/5 bg-[#050505]/80 backdrop-blur-md px-4 py-4 flex justify-between items-center">
        <Link to="/" className="flex items-center gap-2 group">
          <Dumbbell className="h-6 w-6 text-[#D4FF00] group-hover:scale-110 transition-transform" />
          <span className="font-display text-xl tracking-wide uppercase font-black text-white group-hover:text-[#D4FF00] transition-colors">
            Wheyo
          </span>
        </Link>
        <button
          onClick={() => setIsCartOpen(true)}
          className="relative flex items-center gap-2 bg-[#141414] border border-white/10 p-2 rounded-xl text-xs font-bold"
        >
          <ShoppingBag className="h-5 w-5 text-[#D4FF00]" />
          {totalItems > 0 && (
            <motion.span 
              key={totalItems}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 500, damping: 15 }}
              className="absolute -top-2 -right-2 bg-[#FF3E00] text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-[#050505]"
            >
              {totalItems}
            </motion.span>
          )}
        </button>
      </div>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#09090D]/95 backdrop-blur-lg border-t border-white/10 pb-safe shadow-[0_-4px_25px_rgba(0,0,0,0.7)]">
        <div className="flex justify-around items-center h-16 px-1.5">
          {mobileNavItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  'flex flex-col items-center justify-center w-full h-full gap-1 transition-all duration-200 active:scale-90 relative',
                  isActive
                    ? 'text-[#D4FF00] font-black'
                    : 'text-zinc-400 hover:text-zinc-200'
                )}
              >
                <div className="relative">
                  <Icon className={cn("h-5 w-5 transition-transform", isActive && "scale-110")} />
                  {isActive && (
                    <span className="absolute -top-1 -right-1 w-1.5 h-1.5 rounded-full bg-[#D4FF00] shadow-[0_0_8px_#D4FF00]" />
                  )}
                </div>
                <span className="text-[9px] font-mono font-bold uppercase tracking-wider">{item.mobileLabel}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}

function LayoutContent({ session }: { session: Session | null }) {
  const location = useLocation();
  const { tourStep } = useCart();
  const [activeNotif, setActiveNotif] = useState<any>(null);

  // Initialize algorithmic client-side notification engine
  useEffect(() => {
    initNotificationEngine();

    const handleInAppNotif = (e: any) => {
      if (e.detail) {
        setActiveNotif(e.detail);
        setTimeout(() => setActiveNotif(null), 6500);
      }
    };

    window.addEventListener('wheyo-inapp-notification', handleInAppNotif);
    return () => {
      window.removeEventListener('wheyo-inapp-notification', handleInAppNotif);
    };
  }, []);

  // Scroll to top of the page whenever path or tour step changes
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
    document.body.scrollTop = 0;
    document.documentElement.scrollTop = 0;
    const timer = setTimeout(() => {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
      document.body.scrollTop = 0;
      document.documentElement.scrollTop = 0;
    }, 50);
    return () => clearTimeout(timer);
  }, [location.pathname, tourStep]);

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-[#D4FF00] selection:text-black pb-28 md:pb-0 relative overflow-x-hidden">
      <Header session={session} />

      {/* Floating Algorithmic In-App Push Notification Banner */}
      <AnimatePresence>
        {activeNotif && (
          <motion.div
            initial={{ opacity: 0, y: -40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -40, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            className="fixed top-4 left-3 right-3 sm:left-auto sm:right-6 sm:max-w-sm z-[250] bg-[#12121C]/95 border border-[#D4FF00]/40 rounded-2xl p-3.5 shadow-[0_10px_35px_rgba(0,0,0,0.8)] backdrop-blur-xl"
          >
            <div className="flex items-start justify-between gap-2.5">
              <Link
                to={activeNotif.actionUrl || '/workouts'}
                onClick={() => setActiveNotif(null)}
                className="flex items-start gap-2.5 flex-1 min-w-0"
              >
                <div className="w-8 h-8 rounded-xl bg-[#D4FF00]/15 border border-[#D4FF00]/30 flex items-center justify-center shrink-0 text-[#D4FF00] text-sm">
                  ⚡
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="font-display text-xs font-black uppercase text-white truncate">
                      {activeNotif.title}
                    </span>
                    <span className="w-1.5 h-1.5 rounded-full bg-[#D4FF00] animate-ping shrink-0" />
                  </div>
                  <p className="text-[11px] font-mono text-zinc-300 leading-snug line-clamp-2">
                    {activeNotif.body}
                  </p>
                </div>
              </Link>

              <button
                onClick={() => setActiveNotif(null)}
                className="text-zinc-500 hover:text-white p-1 rounded-lg hover:bg-white/5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <main>
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>
      {!['/subscriptions', '/profile'].includes(location.pathname) && (
        <footer className="border-t border-white/5 bg-[#000000] py-6 mt-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-center sm:text-left">
              <div className="flex flex-col sm:flex-row items-center gap-2.5">
                <Link to="/" className="flex items-center gap-1.5 justify-center">
                  <Dumbbell className="h-4 w-4 text-[#D4FF00]" />
                  <span className="font-display text-sm tracking-wide uppercase font-black">
                    Wheyo
                  </span>
                </Link>
                <p className="text-zinc-600 text-[10px] font-mono uppercase tracking-wider">
                  &copy; {new Date().getFullYear()} Wheyo. Fuel your workouts.
                </p>
              </div>
              <div className="flex items-center gap-4 flex-wrap justify-center">
                <Link to="/privacy" className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 hover:text-[#D4FF00] transition-colors">
                  Privacy
                </Link>
                <Link to="/terms" className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 hover:text-[#D4FF00] transition-colors">
                  Terms
                </Link>
                <Link to="/refunds" className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 hover:text-[#D4FF00] transition-colors">
                  Refunds
                </Link>
              </div>
            </div>
          </div>
        </footer>
      )}
      <CartDrawer />
      <AppTourModal session={session} />
    </div>
  );
}


export default function Layout({ session }: { session: Session | null }) {
  return (
    <CartProvider>
      <LayoutContent session={session} />
    </CartProvider>
  );
}
