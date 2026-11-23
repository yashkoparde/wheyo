import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShoppingBag, Zap, ArrowRight } from 'lucide-react';
import { useCart } from '../context/CartContext';

export function QuickCartPill() {
  const { items, totalPrice, setIsCartOpen } = useCart();

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalProtein = items.reduce((sum, item) => sum + (item.protein || 0) * item.quantity, 0);

  if (totalItems === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 50, opacity: 0, scale: 0.9 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 50, opacity: 0, scale: 0.9 }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        className="fixed bottom-20 left-4 right-4 z-40 md:hidden flex justify-center pointer-events-auto"
      >
        <button
          onClick={() => setIsCartOpen(true)}
          className="w-full max-w-sm bg-[#12121A]/95 backdrop-blur-xl border border-[#D4FF00]/50 rounded-2xl p-3 shadow-[0_8px_30px_rgba(212,255,0,0.25)] flex items-center justify-between gap-3 active:scale-95 transition-transform"
        >
          <div className="flex items-center gap-2.5">
            <div className="relative bg-[#D4FF00] text-black p-2 rounded-xl flex items-center justify-center font-black">
              <ShoppingBag className="w-5 h-5 text-black" />
              <span className="absolute -top-1.5 -right-1.5 bg-[#FF3E00] text-white text-[10px] font-mono font-bold w-4 h-4 rounded-full flex items-center justify-center border border-[#050505]">
                {totalItems}
              </span>
            </div>
            <div className="flex flex-col text-left">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-mono font-black text-[#D4FF00] bg-[#D4FF00]/10 px-2 py-0.5 rounded border border-[#D4FF00]/30 flex items-center gap-1">
                  <Zap className="w-3 h-3 text-[#D4FF00] fill-[#D4FF00]" />
                  +{totalProtein}g P
                </span>
              </div>
              <span className="text-[11px] font-mono font-semibold text-zinc-400">
                Total Refuel Fuel
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-base font-display font-black text-white">
              ₹{totalPrice}
            </span>
            <div className="bg-[#D4FF00] text-black p-1.5 rounded-lg flex items-center justify-center">
              <ArrowRight className="w-4 h-4 stroke-[3]" />
            </div>
          </div>
        </button>
      </motion.div>
    </AnimatePresence>
  );
}
