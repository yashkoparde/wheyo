import { Outlet, Link, useLocation } from 'react-router-dom';
import { Dumbbell, Utensils, ShoppingBag, User } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { motion, AnimatePresence } from 'motion/react';
import { CartProvider, useCart } from '../context/CartContext';
import { CartDrawer } from './CartDrawer';
import { supabase } from '../lib/supabase';
import { useState, useEffect } from 'react';
import type { Session } from '@supabase/supabase-js';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

function Header({ session }: { session: Session | null }) {
  const location = useLocation();
  const { items, setIsCartOpen } = useCart();
  const user = session?.user ?? null;

  const navItems = [
    { path: '/', label: 'Home', icon: Dumbbell },
    { path: '/menu', label: 'Fuel Station', icon: Utensils },
    { path: user ? '/profile' : '/login', label: user ? 'Profile' : 'Login', icon: User },
  ];

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <>
      {/* Desktop Nav */}
      <nav className="sticky top-0 z-40 border-b border-white/5 bg-[#050505]/80 backdrop-blur-md hidden md:block">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center gap-3">
              <Dumbbell className="h-8 w-8 text-[#D4FF00]" />
              <span className="font-display text-2xl tracking-wide uppercase">
                Wheyo
              </span>
            </div>
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
        <div className="flex items-center gap-2">
          <Dumbbell className="h-6 w-6 text-[#D4FF00]" />
          <span className="font-display text-xl tracking-wide uppercase">
            Wheyo
          </span>
        </div>
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
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#050505]/90 backdrop-blur-md border-t border-white/5 pb-safe">
        <div className="flex justify-around items-center h-16 px-2">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                'flex flex-col items-center justify-center w-full h-full gap-1 transition-colors',
                location.pathname === item.path
                  ? 'text-[#D4FF00]'
                  : 'text-gray-500 hover:text-gray-300'
              )}
            >
              <item.icon className="h-6 w-6" />
              <span className="text-[10px] font-bold uppercase tracking-wider">{item.label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </>
  );
}

export default function Layout({ session }: { session: Session | null }) {
  return (
    <CartProvider>
      <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-[#D4FF00] selection:text-black pb-20 md:pb-0 relative">
        <Header session={session} />
        <main>
          <Outlet />
        </main>
        <footer className="border-t border-white/5 bg-[#000000] py-16 mt-20 hidden md:block">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="flex items-center gap-3">
                <Dumbbell className="h-8 w-8 text-[#D4FF00]" />
                <span className="font-display text-2xl tracking-wide uppercase">
                  Wheyo
                </span>
              </div>
              <p className="text-gray-500 text-sm font-mono uppercase tracking-widest">
                &copy; {new Date().getFullYear()} Wheyo - The Protein Kitchen. Fuel your workouts.
              </p>
            </div>
          </div>
        </footer>
        <CartDrawer />
      </div>
    </CartProvider>
  );
}
