import React from 'react';
import { ShoppingCart, Heart, Info, Plus } from 'lucide-react';
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
  mode?: 'grid' | 'list';
}

export function MenuCardSkeleton({ mode = 'grid' }: { mode?: 'grid' | 'list' }) {
  if (mode === 'list') {
    return (
      <div className="bg-[#0D0D10] border border-white/5 rounded-2xl p-3.5 sm:p-4 flex items-center justify-between gap-3 animate-pulse h-[98px] sm:h-[112px]">
        <div className="w-18 h-18 sm:w-20 sm:h-20 bg-[#16161A] rounded-xl shrink-0" />
        <div className="flex-1 space-y-2.5">
          <div className="h-4 bg-white/10 rounded w-3/4" />
          <div className="h-3.5 bg-[#D4FF00]/10 rounded w-16" />
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-white/5 rounded-lg" />
          <div className="w-8 h-8 bg-[#D4FF00]/10 rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#0D0D10] border border-white/5 rounded-2xl overflow-hidden animate-pulse h-[240px] flex flex-col">
      <div className="h-32 bg-[#16161A] shrink-0" />
      <div className="p-3 flex-1 flex flex-col justify-between">
        <div className="h-4 bg-white/10 rounded w-4/5" />
        <div className="flex items-center justify-between pt-2">
          <div className="h-4 bg-[#D4FF00]/10 rounded w-14" />
          <div className="w-8 h-8 bg-[#D4FF00]/10 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

export function MenuCard({ item, onOrder, onAddDirect, onInfo, mode = 'grid' }: MenuCardProps) {
  const [showHeartPop, setShowHeartPop] = React.useState(false);
  const lastTapRef = React.useRef<number>(0);

  const [isFav, setIsFav] = React.useState<boolean>(() => {
    try {
      const favs = JSON.parse(localStorage.getItem('wheyo_favorites') || '[]');
      return Array.isArray(favs) ? favs.includes(item.id) : false;
    } catch {
      return false;
    }
  });

  React.useEffect(() => {
    const handleUpdate = () => {
      try {
        const favs = JSON.parse(localStorage.getItem('wheyo_favorites') || '[]');
        setIsFav(Array.isArray(favs) ? favs.includes(item.id) : false);
      } catch {
        // Safe fallback
      }
    };
    window.addEventListener('wheyo-favorites-changed', handleUpdate);
    return () => window.removeEventListener('wheyo-favorites-changed', handleUpdate);
  }, [item.id]);

  const triggerHaptic = (duration: number = 10) => {
    try {
      if (navigator.vibrate) navigator.vibrate(duration);
    } catch {}
  };

  const toggleFav = (e: React.MouseEvent) => {
    e.stopPropagation();
    triggerHaptic(15);
    try {
      const favsStr = localStorage.getItem('wheyo_favorites') || '[]';
      let favs = JSON.parse(favsStr);
      if (!Array.isArray(favs)) favs = [];
      if (favs.includes(item.id)) {
        favs = favs.filter((id: string) => id !== item.id);
        setIsFav(false);
      } else {
        favs.push(item.id);
        setIsFav(true);
      }
      localStorage.setItem('wheyo_favorites', JSON.stringify(favs));
      window.dispatchEvent(new Event('wheyo-favorites-changed'));
    } catch {}
  };

  const handleThumbnailTap = (e: React.MouseEvent) => {
    e.stopPropagation();
    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      if (!isFav) toggleFav(e);
      setShowHeartPop(true);
      triggerHaptic(20);
      setTimeout(() => setShowHeartPop(false), 600);
    } else {
      onOrder();
    }
    lastTapRef.current = now;
  };

  // High-performance List Mode (default for smooth vertical scroll on mobile)
  if (mode === 'list') {
    return (
      <div
        onClick={() => {
          triggerHaptic(8);
          onOrder();
        }}
        className="bg-[#0A0A0C] border border-white/5 hover:border-white/15 rounded-2xl p-3 sm:p-4 flex items-center justify-between gap-3 sm:gap-4 transition-colors cursor-pointer group active:bg-[#121215] w-full relative overflow-hidden select-none"
      >
        {/* Left Image Thumbnail */}
        <div
          onClick={handleThumbnailTap}
          className="relative w-18 h-18 sm:w-22 sm:h-22 bg-[#141416] rounded-xl overflow-hidden shrink-0 border border-white/5 select-none"
        >
          <img
            src={item.image}
            alt={item.name}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 pointer-events-none"
            referrerPolicy="no-referrer"
          />

          {/* Veg / Non-Veg Dot Indicator */}
          <div className="absolute top-1 left-1 z-10 flex items-center bg-black/80 px-1 py-0.5 rounded border border-white/10">
            <span
              className={cn(
                "w-1.5 h-1.5 rounded-full",
                item.isVeg ? "bg-green-500" : "bg-red-500"
              )}
            />
          </div>

          {/* Favorite Button */}
          <button
            type="button"
            onClick={toggleFav}
            className="absolute top-1 right-1 z-20 w-6 h-6 rounded-md bg-black/75 flex items-center justify-center border border-white/10 hover:border-red-500/30 transition-colors active:scale-90"
            title="Favorite"
          >
            <Heart
              className={cn(
                "w-3 h-3 transition-colors",
                isFav ? "fill-red-500 text-red-500" : "text-zinc-400"
              )}
            />
          </button>

          {/* Double tap heart animation */}
          {showHeartPop && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-30 animate-scale-in">
              <Heart className="w-7 h-7 fill-[#D4FF00] text-[#D4FF00]" />
            </div>
          )}
        </div>

        {/* Center Details */}
        <div className="flex-1 min-w-0 flex flex-col justify-center gap-1">
          <h3 className="text-[13.5px] sm:text-[15.5px] font-display font-bold uppercase tracking-wide text-zinc-100 group-hover:text-[#D4FF00] transition-colors line-clamp-1">
            {item.name}
          </h3>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center bg-[#D4FF00]/10 border border-[#D4FF00]/25 px-1.5 py-0.5 rounded font-mono text-[11px] sm:text-xs text-[#D4FF00] font-black leading-none whitespace-nowrap">
              {item.protein}g Protein
            </span>
            <span className="text-xs sm:text-sm font-mono text-zinc-300 font-bold leading-none whitespace-nowrap">
              ₹{item.price}
            </span>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              triggerHaptic(8);
              if (onInfo) onInfo(e);
              else onOrder();
            }}
            className="w-8 h-8 sm:w-9 sm:h-9 border border-white/5 hover:border-white/20 text-zinc-400 hover:text-white rounded-xl flex items-center justify-center bg-white/5 active:bg-zinc-800 transition-colors"
            title="Nutrition Info"
          >
            <Info className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              triggerHaptic(15);
              if (onAddDirect) onAddDirect(e);
              else onOrder();
            }}
            className="h-8 px-2.5 sm:h-9 sm:px-3 bg-[#D4FF00] hover:bg-white text-black font-mono text-xs font-black uppercase rounded-xl flex items-center justify-center gap-1 shadow-sm active:scale-95 transition-all"
            title="Add to Cart"
          >
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
            <span>Add</span>
          </button>
        </div>
      </div>
    );
  }

  // Grid Mode
  return (
    <div
      onClick={() => {
        triggerHaptic(8);
        onOrder();
      }}
      className="bg-[#0A0A0C] border border-white/5 hover:border-white/15 rounded-2xl overflow-hidden group transition-colors flex flex-col h-full cursor-pointer relative active:bg-[#121215] w-full select-none"
    >
      <div
        onClick={handleThumbnailTap}
        className="relative h-32 sm:h-40 overflow-hidden bg-[#141416] border-b border-white/5"
      >
        <img
          src={item.image}
          alt={item.name}
          loading="lazy"
          decoding="async"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 pointer-events-none"
          referrerPolicy="no-referrer"
        />

        <div className="absolute top-2 left-2 z-10 flex items-center bg-black/80 px-1.5 py-0.5 rounded border border-white/10">
          <span
            className={cn(
              "w-1.5 h-1.5 rounded-full",
              item.isVeg ? "bg-green-500" : "bg-red-500"
            )}
          />
        </div>

        <button
          type="button"
          onClick={toggleFav}
          className="absolute top-2 right-2 z-20 w-7 h-7 rounded-lg bg-black/80 flex items-center justify-center border border-white/10 hover:border-red-500/30 transition-colors active:scale-90"
          title="Favorite"
        >
          <Heart
            className={cn(
              "w-3.5 h-3.5 transition-colors",
              isFav ? "fill-red-500 text-red-500" : "text-zinc-400"
            )}
          />
        </button>

        {showHeartPop && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-30 animate-scale-in">
            <Heart className="w-8 h-8 fill-[#D4FF00] text-[#D4FF00]" />
          </div>
        )}
      </div>

      <div className="p-3 sm:p-4 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="text-xs sm:text-sm font-display font-bold uppercase tracking-wide text-zinc-100 group-hover:text-[#D4FF00] transition-colors line-clamp-1 mb-1.5">
            {item.name}
          </h3>

          <div className="flex items-center justify-between gap-1 mb-3">
            <span className="inline-flex items-center bg-[#D4FF00]/10 border border-[#D4FF00]/25 px-1.5 py-0.5 rounded font-mono text-[10.5px] sm:text-xs text-[#D4FF00] font-black leading-none whitespace-nowrap">
              {item.protein}g Protein
            </span>
            <span className="text-xs sm:text-sm font-mono text-zinc-200 font-bold leading-none whitespace-nowrap">
              ₹{item.price}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 pt-1">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              triggerHaptic(8);
              if (onInfo) onInfo(e);
              else onOrder();
            }}
            className="flex-1 py-1.5 bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white border border-white/10 rounded-lg flex items-center justify-center gap-1 text-[10px] sm:text-xs font-mono font-bold uppercase transition-colors"
          >
            <Info className="w-3.5 h-3.5" />
            <span>Info</span>
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              triggerHaptic(15);
              if (onAddDirect) onAddDirect(e);
              else onOrder();
            }}
            className="flex-1 py-1.5 bg-[#D4FF00] hover:bg-white text-black rounded-lg flex items-center justify-center gap-1 text-[10px] sm:text-xs font-mono font-black uppercase transition-all shadow-sm active:scale-95"
          >
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
            <span>Add</span>
          </button>
        </div>
      </div>
    </div>
  );
}
