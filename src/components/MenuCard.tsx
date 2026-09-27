import React from 'react';
import { Heart, Info, Plus, Flame } from 'lucide-react';
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
      <div className="bg-[#0C0C10] border border-white/5 rounded-2xl p-3.5 sm:p-4 flex items-center justify-between gap-3 animate-pulse h-[105px] sm:h-[118px]">
        <div className="w-20 h-20 sm:w-24 sm:h-24 bg-[#18181E] rounded-xl shrink-0" />
        <div className="flex-1 space-y-2.5">
          <div className="h-4 bg-white/10 rounded w-3/4" />
          <div className="h-3.5 bg-[#D4FF00]/10 rounded w-20" />
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-white/5 rounded-lg" />
          <div className="w-16 h-8 bg-[#D4FF00]/10 rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#0C0C10] border border-white/5 rounded-2xl overflow-hidden animate-pulse h-[250px] flex flex-col">
      <div className="h-36 bg-[#18181E] shrink-0" />
      <div className="p-3 flex-1 flex flex-col justify-between">
        <div className="h-4 bg-white/10 rounded w-4/5" />
        <div className="flex items-center justify-between pt-2">
          <div className="h-4 bg-[#D4FF00]/10 rounded w-16" />
          <div className="w-14 h-8 bg-[#D4FF00]/10 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

export function MenuCard({ item, onOrder, onAddDirect, onInfo, mode = 'list' }: MenuCardProps) {
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
      } catch {}
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

  const isBestseller = item.tags?.includes('Bestseller');

  // List Mode (Primary High-Converting Card)
  if (mode === 'list') {
    return (
      <div
        onClick={() => {
          triggerHaptic(8);
          onOrder();
        }}
        className="bg-[#0C0C10] border border-white/10 hover:border-[#D4FF00]/40 rounded-2xl p-3 sm:p-4 flex items-center justify-between gap-3 sm:gap-4 transition-all duration-200 cursor-pointer group active:scale-[0.99] w-full relative overflow-hidden select-none shadow-[0_4px_20px_rgba(0,0,0,0.4)]"
      >
        {/* Left Vivid Image Thumbnail */}
        <div
          onClick={handleThumbnailTap}
          className="relative w-20 h-20 sm:w-24 sm:h-24 bg-[#18181E] rounded-xl overflow-hidden shrink-0 border border-white/10 shadow-md select-none"
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
          <div className="absolute top-1.5 left-1.5 z-10 flex items-center bg-black/85 px-1.5 py-0.5 rounded-md border border-white/10 shadow-sm">
            <span
              className={cn(
                "w-1.5 h-1.5 rounded-full shadow-sm",
                item.isVeg ? "bg-emerald-400 shadow-[0_0_6px_#34d399]" : "bg-rose-500 shadow-[0_0_6px_#f43f5e]"
              )}
            />
          </div>

          {/* Favorite Button */}
          <button
            type="button"
            onClick={toggleFav}
            className="absolute top-1.5 right-1.5 z-20 w-6 h-6 rounded-md bg-black/80 flex items-center justify-center border border-white/10 hover:border-rose-500/40 transition-colors active:scale-90"
            title="Favorite"
          >
            <Heart
              className={cn(
                "w-3 h-3 transition-colors",
                isFav ? "fill-rose-500 text-rose-500" : "text-zinc-400"
              )}
            />
          </button>

          {/* Double tap heart animation */}
          {showHeartPop && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-30 animate-scale-in">
              <Heart className="w-8 h-8 fill-[#D4FF00] text-[#D4FF00] drop-shadow-[0_0_10px_#D4FF00]" />
            </div>
          )}
        </div>

        {/* Center Details: High-impact typography */}
        <div className="flex-1 min-w-0 flex flex-col justify-center gap-1.5 py-0.5">
          <div className="flex items-center gap-1.5">
            <h3 className="text-[14px] sm:text-[16px] font-display font-extrabold uppercase tracking-wide text-white group-hover:text-[#D4FF00] transition-colors line-clamp-1">
              {item.name}
            </h3>
            {isBestseller && (
              <span className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-400 font-mono text-[9px] font-black uppercase tracking-wider shrink-0">
                <Flame className="w-2.5 h-2.5 fill-orange-400" /> Hot
              </span>
            )}
          </div>

          {/* Macro Split & Price Badges */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center bg-[#D4FF00]/15 border border-[#D4FF00]/30 px-2 py-0.5 rounded-lg font-mono text-[11px] sm:text-xs text-[#D4FF00] font-black leading-none whitespace-nowrap shadow-[0_0_10px_rgba(212,255,0,0.1)]">
              🍗 {item.protein}g Protein
            </span>
            <span className="text-[10px] sm:text-xs font-mono text-zinc-400 font-bold leading-none whitespace-nowrap">
              {item.calories} kcal
            </span>
            <span className="text-xs sm:text-sm font-mono text-white font-black bg-white/5 border border-white/10 px-2 py-0.5 rounded-lg leading-none whitespace-nowrap">
              ₹{item.price}
            </span>
          </div>
        </div>

        {/* Right Actions: Tactile Impulse Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              triggerHaptic(8);
              if (onInfo) onInfo(e);
              else onOrder();
            }}
            className="w-8 h-8 sm:w-9 sm:h-9 border border-white/10 hover:border-white/30 text-zinc-400 hover:text-white rounded-xl flex items-center justify-center bg-white/5 active:bg-zinc-800 transition-colors"
            title="Nutrition Details"
          >
            <Info className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              triggerHaptic(18);
              if (onAddDirect) onAddDirect(e);
              else onOrder();
            }}
            className="h-8 px-3 sm:h-9 sm:px-4 bg-[#D4FF00] hover:bg-white text-black font-mono text-xs font-black uppercase rounded-xl flex items-center justify-center gap-1.5 shadow-[0_0_15px_rgba(212,255,0,0.25)] hover:shadow-[0_0_20px_rgba(212,255,0,0.4)] active:scale-95 transition-all cursor-pointer"
            title="Add to Plate"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
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
      className="bg-[#0C0C10] border border-white/10 hover:border-[#D4FF00]/40 rounded-2xl overflow-hidden group transition-all duration-200 flex flex-col h-full cursor-pointer relative active:scale-[0.99] w-full select-none shadow-[0_4px_20px_rgba(0,0,0,0.4)]"
    >
      <div
        onClick={handleThumbnailTap}
        className="relative h-36 sm:h-44 overflow-hidden bg-[#18181E] border-b border-white/10"
      >
        <img
          src={item.image}
          alt={item.name}
          loading="lazy"
          decoding="async"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 pointer-events-none"
          referrerPolicy="no-referrer"
        />

        <div className="absolute top-2 left-2 z-10 flex items-center bg-black/85 px-1.5 py-0.5 rounded-md border border-white/10 shadow-sm">
          <span
            className={cn(
              "w-1.5 h-1.5 rounded-full shadow-sm",
              item.isVeg ? "bg-emerald-400 shadow-[0_0_6px_#34d399]" : "bg-rose-500 shadow-[0_0_6px_#f43f5e]"
            )}
          />
        </div>

        <button
          type="button"
          onClick={toggleFav}
          className="absolute top-2 right-2 z-20 w-7 h-7 rounded-lg bg-black/80 flex items-center justify-center border border-white/10 hover:border-rose-500/40 transition-colors active:scale-90"
          title="Favorite"
        >
          <Heart
            className={cn(
              "w-3.5 h-3.5 transition-colors",
              isFav ? "fill-rose-500 text-rose-500" : "text-zinc-400"
            )}
          />
        </button>

        {showHeartPop && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-30 animate-scale-in">
            <Heart className="w-8 h-8 fill-[#D4FF00] text-[#D4FF00] drop-shadow-[0_0_10px_#D4FF00]" />
          </div>
        )}
      </div>

      <div className="p-3.5 sm:p-4 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="text-xs sm:text-sm font-display font-extrabold uppercase tracking-wide text-white group-hover:text-[#D4FF00] transition-colors line-clamp-1 mb-2">
            {item.name}
          </h3>

          <div className="flex items-center justify-between gap-1 mb-3">
            <span className="inline-flex items-center bg-[#D4FF00]/15 border border-[#D4FF00]/30 px-2 py-0.5 rounded-lg font-mono text-[11px] sm:text-xs text-[#D4FF00] font-black leading-none whitespace-nowrap shadow-[0_0_10px_rgba(212,255,0,0.1)]">
              🍗 {item.protein}g Protein
            </span>
            <span className="text-xs sm:text-sm font-mono text-white font-black bg-white/5 border border-white/10 px-2 py-0.5 rounded-lg leading-none whitespace-nowrap">
              ₹{item.price}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 pt-1">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              triggerHaptic(8);
              if (onInfo) onInfo(e);
              else onOrder();
            }}
            className="flex-1 py-1.5 bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white border border-white/10 rounded-xl flex items-center justify-center gap-1 text-[10px] sm:text-xs font-mono font-bold uppercase transition-colors"
          >
            <Info className="w-3.5 h-3.5" />
            <span>Info</span>
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              triggerHaptic(18);
              if (onAddDirect) onAddDirect(e);
              else onOrder();
            }}
            className="flex-1 py-1.5 bg-[#D4FF00] hover:bg-white text-black rounded-xl flex items-center justify-center gap-1 text-[10px] sm:text-xs font-mono font-black uppercase transition-all shadow-[0_0_12px_rgba(212,255,0,0.2)] active:scale-95 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
            <span>Add</span>
          </button>
        </div>
      </div>
    </div>
  );
}
