import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShoppingCart, Heart, Info, EyeOff } from 'lucide-react';
import { cn } from './Layout';

export interface MenuItem {
  id: string;
  code: string;
  name: string;
  protein: number;
  calories: number;
  price: number;
  isVeg: boolean;
  image: string;
  tags: string[];
  ingredients?: string;
  proteinSource?: string;
  carbs?: number;
  fats?: number;
}

export interface MenuCardProps {
  item: MenuItem;
  onOrder: () => void;
  onAddDirect?: (e: React.MouseEvent) => void;
  onInfo?: (e: React.MouseEvent) => void;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  mode?: 'grid' | 'list';
  key?: React.Key;
}

export function MenuCardSkeleton({ mode = 'grid' }: { mode?: 'grid' | 'list' }) {
  if (mode === 'list') {
    return (
      <div className="bg-[#0A0A0C] border border-white/5 rounded-2xl p-4 flex items-center justify-between gap-4 animate-pulse h-[116px] sm:h-[130px]">
        {/* Left Thumbnail */}
        <div className="w-20 h-20 sm:w-24 sm:h-24 bg-[#141416] rounded-xl shrink-0 border border-white/5" />
        
        {/* Center Details */}
        <div className="flex-1 space-y-3">
          <div className="h-4 bg-white/10 rounded w-2/3" />
          <div className="h-4 bg-[#D4FF00]/10 rounded w-16" />
        </div>
        
        {/* Right Actions */}
        <div className="flex flex-col items-end justify-between h-full py-1">
          <div className="h-5 w-10 bg-white/10 rounded-lg" />
          <div className="flex gap-2">
            <div className="w-9 h-9 bg-white/5 rounded-lg" />
            <div className="w-9 h-9 bg-[#D4FF00]/10 rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#0A0A0C] border border-white/5 rounded-2xl overflow-hidden animate-pulse h-[260px] sm:h-[310px] flex flex-col">
      <div className="relative h-32 sm:h-44 bg-[#141416] border-b border-white/5 shrink-0" />
      <div className="p-3 sm:p-5 flex-1 flex flex-col justify-between">
        <div className="h-4 bg-white/10 rounded w-4/5 mb-3" />
        <div className="flex items-center justify-between">
          <div className="h-4 bg-[#D4FF00]/10 rounded w-12" />
          <div className="flex gap-2">
            <div className="w-9 h-9 bg-white/5 rounded-lg" />
            <div className="w-9 h-9 bg-[#D4FF00]/10 rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function MenuCard({ item, onOrder, onAddDirect, onInfo, onSwipeLeft, onSwipeRight, mode = 'grid' }: MenuCardProps) {
  const [dragX, setDragX] = React.useState(0);
  const [showHeartPop, setShowHeartPop] = React.useState(false);
  const lastTapRef = React.useRef<number>(0);

  // Estimate macros if they are missing
  const proteinVal = item.protein || 0;
  const caloriesVal = item.calories || (proteinVal * 4 + 180);
  let carbsVal = item.carbs || 0;
  let fatsVal = item.fats || 0;
  if (carbsVal === 0 && fatsVal === 0) {
    const isKeto = item.tags?.includes('Keto') || false;
    const isHighProt = item.tags?.includes('High Protein') || false;
    const remaining = Math.max(0, caloriesVal - proteinVal * 4);
    if (isKeto) {
      fatsVal = Math.round((remaining * 0.8) / 9);
      carbsVal = Math.round((remaining * 0.2) / 4);
    } else if (isHighProt) {
      fatsVal = Math.round((remaining * 0.4) / 9);
      carbsVal = Math.round((remaining * 0.6) / 4);
    } else {
      carbsVal = Math.round((remaining * 0.65) / 4);
      fatsVal = Math.round((remaining * 0.35) / 9);
    }
  }

  const [isFav, setIsFav] = React.useState<boolean>(() => {
    const favsStr = localStorage.getItem('wheyo_favorites') || '[]';
    try {
      const favs = JSON.parse(favsStr);
      return Array.isArray(favs) ? favs.includes(item.id) : false;
    } catch {
      return false;
    }
  });

  React.useEffect(() => {
    const handleUpdate = () => {
      const favsStr = localStorage.getItem('wheyo_favorites') || '[]';
      try {
        const favs = JSON.parse(favsStr);
        setIsFav(Array.isArray(favs) ? favs.includes(item.id) : false);
      } catch {
        // Safe fallback
      }
    };
    window.addEventListener('wheyo-favorites-changed', handleUpdate);
    return () => window.removeEventListener('wheyo-favorites-changed', handleUpdate);
  }, [item.id]);

  // Unified haptic feedback simulator for mobile screen responsiveness
  const triggerHaptic = (type: 'light' | 'medium' | 'success' = 'light') => {
    try {
      if (navigator.vibrate) {
        if (type === 'light') {
          navigator.vibrate(10);
        } else if (type === 'medium') {
          navigator.vibrate(18);
        } else if (type === 'success') {
          navigator.vibrate([15, 30, 15]);
        }
      }
    } catch {
      // Safe catch for environment constraints
    }
  };

  const toggleFav = (e: React.MouseEvent) => {
    e.stopPropagation();
    triggerHaptic('medium');
    const favsStr = localStorage.getItem('wheyo_favorites') || '[]';
    let favs = [];
    try {
      favs = JSON.parse(favsStr);
      if (!Array.isArray(favs)) favs = [];
    } catch {
      favs = [];
    }

    if (favs.includes(item.id)) {
      favs = favs.filter((id: string) => id !== item.id);
      setIsFav(false);
    } else {
      favs.push(item.id);
      setIsFav(true);
    }
    localStorage.setItem('wheyo_favorites', JSON.stringify(favs));
    window.dispatchEvent(new Event('wheyo-favorites-changed'));
  };

  // Double-tap to favorite handler (extremely delightful mobile UX gesture)
  const handleThumbnailTap = (e: React.MouseEvent) => {
    e.stopPropagation();
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;
    if (now - lastTapRef.current < DOUBLE_TAP_DELAY) {
      // Double tap action
      if (!isFav) {
        toggleFav(e);
      }
      setShowHeartPop(true);
      triggerHaptic('success');
      setTimeout(() => setShowHeartPop(false), 700);
    } else {
      // Single tap fallback - open meal details modal
      // We don't block normal order/detail click on thumbnail
    }
    lastTapRef.current = now;
  };

  const showSwipeRightBg = dragX > 25;
  const showSwipeLeftBg = dragX < -25;

  // List Mode rendering block
  if (mode === 'list') {
    const listCardContent = (
      <div
        onClick={(e) => {
          triggerHaptic('light');
          onOrder();
        }}
        style={{
          borderColor: dragX > 15 ? `rgba(16, 185, 129, ${Math.min(0.6, dragX / 100)})` : dragX < -15 ? `rgba(239, 68, 68, ${Math.min(0.6, -dragX / 100)})` : ''
        }}
        className={cn(
          "bg-[#0A0A0C] border border-white/5 rounded-2xl p-4 sm:p-5 flex items-center justify-between gap-4 hover:bg-[#0E0E12] transition-all duration-300 cursor-pointer group active:bg-[#121215] w-full relative overflow-hidden",
          dragX > 15 ? "shadow-[0_0_20px_rgba(16,185,129,0.06)]" : dragX < -15 ? "shadow-[0_0_20px_rgba(239,68,68,0.06)]" : ""
        )}
      >
        {/* Left: Thumbnail image with status indicators */}
        <div 
          onClick={handleThumbnailTap}
          className="relative w-20 h-20 sm:w-24 sm:h-24 bg-[#141416] rounded-xl overflow-hidden shrink-0 border border-white/5 shadow-inner select-none active:scale-95 transition-transform"
        >
          <img
            src={item.image}
            alt={item.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out pointer-events-none select-none"
            referrerPolicy="no-referrer"
          />
          <div className="absolute top-1.5 left-1.5 z-10 flex items-center gap-1 bg-black/80 backdrop-blur-md px-1.5 py-0.5 rounded-md border border-white/10">
            <span className={cn(
              "w-1.5 h-1.5 rounded-full",
              item.isVeg ? "bg-green-500 shadow-[0_0_6px_#22c55e]" : "bg-red-500 shadow-[0_0_6px_#ef4444]"
            )} />
            <span className="text-[7px] font-mono font-bold uppercase text-white tracking-widest hidden sm:inline">
              {item.isVeg ? "Veg" : "Non-Veg"}
            </span>
          </div>
 
          {/* Micro-Fav Indicator */}
          <button
            onClick={toggleFav}
            className="absolute top-1.5 right-1.5 z-20 w-6.5 h-6.5 rounded-lg bg-black/70 backdrop-blur-md flex items-center justify-center border border-white/10 hover:border-red-500/30 transition-colors cursor-pointer active:scale-90"
            title="Add to Favorite"
          >
            <Heart className={cn("w-3.5 h-3.5 transition-all duration-300", isFav ? "fill-red-500 text-red-500 scale-110" : "text-zinc-400")} />
          </button>
 
          {/* Delightful Double-tap Heart Animation */}
          <AnimatePresence>
            {showHeartPop && (
              <motion.div
                initial={{ opacity: 0, scale: 0.3 }}
                animate={{ opacity: 1, scale: 1.2 }}
                exit={{ opacity: 0, scale: 0.5 }}
                className="absolute inset-0 bg-black/40 backdrop-blur-[1px] flex items-center justify-center z-30"
              >
                <Heart className="w-8 h-8 fill-[#D4FF00] text-[#D4FF00] drop-shadow-[0_0_12px_#D4FF00]" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
 
        {/* Center/Right Details: Clean, simple, and beautifully styled */}
        <div className="flex-1 min-w-0 flex flex-row items-center justify-between gap-2 sm:gap-4">
          <div className="flex-1 min-w-0 flex flex-col justify-center gap-1 sm:gap-1.5 py-0.5">
            <h3 className="text-[14px] sm:text-[16.5px] font-display font-black uppercase tracking-wide text-zinc-100 group-hover:text-[#D4FF00] transition-colors line-clamp-1">
              {item.name}
            </h3>
  
            {/* Protein and Price tag layout side by side with larger text */}
            <div className="flex items-center gap-1.5 sm:gap-2 mt-0.5">
              <span className="inline-flex items-center bg-[#D4FF00]/10 border border-[#D4FF00]/20 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded font-mono text-[10.5px] sm:text-[14px] text-[#D4FF00] font-black leading-none whitespace-nowrap shrink-0">
                {item.protein}G P
              </span>
              <span className="text-[11px] sm:text-[16px] font-mono text-zinc-200 font-black bg-zinc-900/85 px-2 py-0.5 sm:py-1 rounded border border-white/5 leading-none whitespace-nowrap shrink-0">
                ₹{item.price}
              </span>
            </div>
          </div>
  
          {/* Right-most Actions with aligned layout */}
          <div className="flex gap-1.5 shrink-0 pl-1 items-center justify-end">
            <motion.button
              whileTap={{ scale: 0.90 }}
              onClick={(e) => {
                e.stopPropagation();
                triggerHaptic('light');
                if (onInfo) onInfo(e);
              }}
              className="w-8.5 h-8.5 sm:w-11 sm:h-11 border border-white/5 hover:border-white/20 text-zinc-400 hover:text-white rounded-xl flex items-center justify-center transition-all bg-white/5 touch-manipulation active:bg-zinc-800 shrink-0"
              title="Nutrition Info"
            >
              <Info className="w-4 h-4 sm:w-5 sm:h-5" />
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.90 }}
              onClick={(e) => {
                e.stopPropagation();
                triggerHaptic('medium');
                if (onAddDirect) {
                  onAddDirect(e);
                } else {
                  onOrder();
                }
              }}
              className="w-8.5 h-8.5 sm:w-11 sm:h-11 bg-[#D4FF00] hover:bg-white text-black rounded-xl flex items-center justify-center transition-all shadow-[0_2px_8px_rgba(212,255,0,0.15)] active:scale-95 group/btn touch-manipulation shrink-0"
              title="Add to Plate"
            >
              <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5 text-black group-hover/btn:scale-110 transition-transform" />
            </motion.button>
          </div>
        </div>
      </div>
    );

    return (
      <div className="relative overflow-hidden rounded-2xl w-full h-full select-none touch-pan-y bg-zinc-950/40">
        {/* Swipe Right Backdrop (Add to Plate) */}
        <div 
          className={cn(
            "absolute inset-0 z-0 flex items-center pl-6 rounded-2xl transition-all duration-150",
            showSwipeRightBg ? "opacity-100 bg-emerald-600/90 text-white animate-pulse" : "opacity-0 bg-transparent text-transparent"
          )}
        >
          <div className="flex items-center gap-2.5">
            <ShoppingCart className="w-4 h-4 animate-bounce" />
            <span className="font-mono font-black text-[9.5px] uppercase tracking-wider">Add to Plate</span>
          </div>
        </div>

        {/* Draggable container with optimized elasticity */}
        <motion.div
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={{ left: 0.1, right: 0.45 }} // Low elasticity to the left to prevent accidental backward swipes
          onDrag={(e, info) => setDragX(info.offset.x)}
          onDragEnd={(e, info) => {
            const threshold = 110;
            if (info.offset.x > threshold) {
              triggerHaptic('success');
              if (onSwipeRight) onSwipeRight();
            }
            setDragX(0);
          }}
          className="w-full h-full relative z-10 touch-pan-y"
        >
          {listCardContent}
        </motion.div>
      </div>
    );
  }

  // Grid Mode (Rearranged: name, protein, price, info button and quick add. Calories removed!)
  const gridCardContent = (
    <div
      onClick={(e) => {
        triggerHaptic('light');
        onOrder();
      }}
      style={{
        borderColor: dragX > 15 ? `rgba(16, 185, 129, ${Math.min(0.6, dragX / 100)})` : dragX < -15 ? `rgba(239, 68, 68, ${Math.min(0.6, -dragX / 100)})` : ''
      }}
      className={cn(
        "bg-[#0A0A0C] border border-white/5 rounded-2xl overflow-hidden group hover:bg-[#0E0E12] transition-all duration-300 flex flex-col h-full cursor-pointer relative active:bg-[#121215] w-full",
        dragX > 15 ? "shadow-[0_0_25px_rgba(16,185,129,0.06)]" : dragX < -15 ? "shadow-[0_0_25px_rgba(239,68,68,0.06)]" : ""
      )}
    >
      {/* Top Banner Tag Overlay */}
      <div className="absolute top-2.5 left-2.5 z-30 pointer-events-none flex gap-1 flex-wrap">
        <span className={cn(
          "w-4.5 h-4.5 rounded-full flex items-center justify-center border border-white/10 bg-black/70 backdrop-blur-md text-[8.5px]",
          item.isVeg ? "text-green-400" : "text-red-400"
        )}>
          {item.isVeg ? "●" : "▲"}
        </span>
      </div>

      {/* Image Thumbnail wrapper with double-tap listener */}
      <div 
        onClick={handleThumbnailTap}
        className="relative h-32 sm:h-44 overflow-hidden bg-[#141416] border-b border-white/5 active:scale-98 transition-transform select-none"
      >
        <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0C] via-transparent to-transparent z-10 opacity-90 pointer-events-none" />
        <img
          src={item.image}
          alt={item.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out pointer-events-none select-none"
          referrerPolicy="no-referrer"
        />
        
        {/* Favorite Button Overlay */}
        <button
          onClick={toggleFav}
          className="absolute top-2.5 right-2.5 z-20 w-7.5 h-7.5 rounded-xl bg-black/80 backdrop-blur-md flex items-center justify-center border border-white/10 hover:border-red-500/30 hover:scale-105 active:scale-90 transition-all cursor-pointer"
          title="Add to Favorite"
        >
          <Heart className={cn("w-3.5 h-3.5 transition-all duration-300", isFav ? "fill-red-500 text-red-500 scale-110" : "text-white")} />
        </button>

        {/* Delightful Double-tap Heart Animation */}
        <AnimatePresence>
          {showHeartPop && (
            <motion.div
              initial={{ opacity: 0, scale: 0.3 }}
              animate={{ opacity: 1, scale: 1.25 }}
              exit={{ opacity: 0, scale: 0.5 }}
              className="absolute inset-0 bg-black/30 backdrop-blur-[1px] flex items-center justify-center z-30"
            >
              <Heart className="w-10 h-10 fill-[#D4FF00] text-[#D4FF00] drop-shadow-[0_0_15px_#D4FF00]" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      {/* Details Section: Non-overlapping, robust layout with structured elements */}
      <div className="p-3 sm:p-4.5 flex-1 flex flex-col bg-[#0A0A0C] border-t border-white/5 relative z-20">
        
        <h3 className="text-[12px] sm:text-[14.5px] font-display font-black uppercase tracking-wide leading-snug text-zinc-100 group-hover:text-[#D4FF00] transition-colors line-clamp-2 min-h-[32px] sm:min-h-[40px] mb-1.5">
          {item.name}
        </h3>

        {/* Protein and Price tag layout side by side with responsive sizing */}
        <div className="flex items-center justify-between gap-1 mt-1.5 mb-3">
          <span className="inline-flex items-center bg-[#D4FF00]/10 border border-[#D4FF00]/20 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-lg font-mono text-[10px] sm:text-[11.5px] text-[#D4FF00] font-black leading-none whitespace-nowrap shrink-0">
            {item.protein}G P
          </span>
          <span className="text-[11.5px] sm:text-[13.5px] font-mono text-zinc-200 font-black bg-zinc-900/85 px-2 py-0.5 sm:py-1 rounded-lg border border-white/5 leading-none whitespace-nowrap shrink-0">
            ₹{item.price}
          </span>
        </div>
        
        {/* Sleek actions footer */}
        <div className="mt-auto pt-2 border-t border-white/5 flex items-center justify-between gap-1.5">
          {/* Nutrition Info Button */}
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={(e) => {
              e.stopPropagation();
              triggerHaptic('light');
              if (onInfo) onInfo(e);
            }}
            className="flex-1 flex items-center justify-center gap-1 bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white border border-white/10 h-7.5 sm:h-9.5 rounded-lg transition-all select-none text-[9.5px] sm:text-xs font-mono font-bold tracking-wider uppercase cursor-pointer"
            title="Nutrition Info"
          >
            <Info className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden min-[340px]:inline">Info</span>
          </motion.button>

          {/* Direct Add to Plate Button */}
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={(e) => {
              e.stopPropagation();
              triggerHaptic('medium');
              if (onAddDirect) {
                onAddDirect(e);
              } else {
                onOrder();
              }
            }}
            className="flex-1 flex items-center justify-center gap-1 bg-[#D4FF00] hover:bg-white text-black h-7.5 sm:h-9.5 rounded-lg transition-all shadow-[0_2px_8px_rgba(212,255,0,0.15)] select-none text-[9.5px] sm:text-xs font-mono font-black tracking-wider uppercase cursor-pointer"
            title="Add to Plate"
          >
            <ShoppingCart className="w-3.5 h-3.5 shrink-0 text-black" />
            <span className="hidden min-[340px]:inline">Add</span>
          </motion.button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="relative overflow-hidden rounded-2xl w-full h-full select-none touch-pan-y bg-zinc-950/40">
      {/* Swipe Right Backdrop (Add to Plate) */}
      <div 
        className={cn(
          "absolute inset-0 z-0 flex items-center pl-4 sm:pl-6 rounded-2xl transition-all duration-150",
          showSwipeRightBg ? "opacity-100 bg-emerald-600/90 text-white animate-pulse" : "opacity-0 bg-transparent text-transparent"
        )}
      >
        <div className="flex flex-col items-center gap-1 justify-center h-full max-w-[64px]">
          <ShoppingCart className="w-4 h-4 text-white" />
          <span className="font-mono font-black text-[8px] uppercase tracking-wider">Add</span>
        </div>
      </div>

      {/* Draggable container with optimized elasticity */}
      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={{ left: 0.1, right: 0.45 }}
        onDrag={(e, info) => setDragX(info.offset.x)}
        onDragEnd={(e, info) => {
          const threshold = 110;
          if (info.offset.x > threshold) {
            triggerHaptic('success');
            if (onSwipeRight) onSwipeRight();
          }
          setDragX(0);
        }}
        className="w-full h-full relative z-10 touch-pan-y"
      >
        {gridCardContent}
      </motion.div>
    </div>
  );
}
