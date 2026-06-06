import React from 'react';
import { motion } from 'motion/react';
import { ShoppingCart, Heart } from 'lucide-react';
import { Tag } from './Tag';
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
}

const getProteinSourceLocal = (name: string) => {
  const lower = name.toLowerCase();
  if (lower.includes('chicken')) return 'Lean Chicken Breast';
  if (lower.includes('paneer')) return 'Fresh Cottage Cheese (Paneer)';
  if (lower.includes('mutton')) return 'Lean Mutton cuts';
  if (lower.includes('soya')) return 'High-Protein Soya';
  if (lower.includes('fish')) return 'White Fish Fillet';
  if (lower.includes('egg')) return 'Egg Whites';
  if (lower.includes('whey')) return 'Whey Isolate';
  return 'Gourmet Plant & Dairy Protein';
};

export interface MenuCardProps {
  item: MenuItem;
  onOrder: () => void;
  onAddDirect?: (e: React.MouseEvent) => void;
  mode?: 'grid' | 'list';
  key?: React.Key;
}

export function MenuCard({ item, onOrder, onAddDirect, mode = 'grid' }: MenuCardProps) {
  const isLeaf = !item.isVeg;

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

  const toggleFav = (e: React.MouseEvent) => {
    e.stopPropagation();
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

  if (mode === 'list') {
    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        whileTap={{ scale: 0.98 }}
        onClick={onOrder}
        className="bg-[#0A0A0C] border border-white/5 rounded-2xl p-4 flex items-center justify-between gap-4 hover:border-[#D4FF00]/50 hover:shadow-[0_0_25px_rgba(212,255,0,0.1)] hover:bg-[#0E0E12] transition-all duration-300 cursor-pointer group active:bg-[#121215]"
      >
        {/* Left: Thumbnail image with status indicators */}
        <div className="relative w-24 h-24 sm:w-28 sm:h-28 bg-[#141416] rounded-xl overflow-hidden shrink-0 border border-white/5">
          <img
            src={item.image}
            alt={item.name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 ease-out"
            referrerPolicy="no-referrer"
          />
          <div className="absolute top-2 left-2 z-10 flex items-center gap-1 bg-black/75 backdrop-blur-md px-1.5 py-0.5 rounded-md border border-white/10">
            <span className={cn(
              "w-2 h-2 rounded-full",
              item.isVeg ? "bg-green-500 shadow-[0_0_8px_#22c55e]" : "bg-red-500 shadow-[0_0_8px_#ef4444]"
            )} />
            <span className="text-[8px] font-mono font-bold uppercase text-white tracking-widest hidden sm:inline">
              {item.isVeg ? "Veg" : "Non-Veg"}
            </span>
          </div>

          {/* Premium Heart toggle on top-right of thumbnail */}
          <button
            onClick={toggleFav}
            className="absolute top-2 right-2 z-20 w-6 h-6 rounded-lg bg-black/60 backdrop-blur-md flex items-center justify-center border border-white/10 hover:border-red-500/30 transition-colors cursor-pointer"
            title="Add to Favorite Shortlist"
          >
            <Heart className={cn("w-3.5 h-3.5 transition-all duration-300", isFav ? "fill-red-500 text-red-500 scale-110" : "text-gray-400")} />
          </button>
        </div>

        {/* Center: Meal Details */}
        <div className="flex-1 min-w-0 pr-1 space-y-1">
          <h3 className="text-sm sm:text-base font-display font-extrabold uppercase tracking-wide text-white group-hover:text-[#D4FF00] transition-colors line-clamp-1">
            {item.name}
          </h3>

          {/* Premium formatted nutrition XXg P |\nXXXX kcal */}
          <div className="pt-0.5">
            <span className="text-xs sm:text-sm font-mono tracking-wide block leading-tight">
              <strong className="text-[#D4FF00] font-black">{item.protein}g P |</strong>
              <br />
              <span className="text-gray-300 font-bold">{item.calories} kcal</span>
            </span>
          </div>
        </div>

        {/* Right: Price & Quick Action */}
        <div className="flex flex-col items-end justify-between shrink-0 pl-1 h-20 sm:h-24">
          {/* Custom Premium pricing representation */}
          <div className="text-sm sm:text-base font-display text-white font-black bg-gradient-to-r from-white/5 to-white/[0.02] border border-white/10 px-2.5 py-1 rounded-lg">
            ₹{item.price}
          </div>

          {/* Quick Add Button - Icon only */}
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={(e) => {
              e.stopPropagation();
              if (onAddDirect) {
                onAddDirect(e);
              } else {
                onOrder();
              }
            }}
            className="w-8 h-8 sm:w-10 sm:h-10 bg-[#D4FF00] hover:bg-white text-black rounded-lg sm:rounded-xl flex items-center justify-center transition-all shadow-[0_4px_12px_rgba(212,255,0,0.25)] hover:shadow-[0_4px_16px_rgba(212,255,0,0.45)] active:scale-95 group/btn"
            title="Add to Plate"
          >
            <ShoppingCart className="w-4 h-4 text-black group-hover/btn:scale-110 transition-transform" />
          </motion.button>
        </div>
      </motion.div>
    );
  }

  // Grid Mode (Highly Optimized for 2-column mobile and 3-column desktop)
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileTap={{ scale: 0.98 }}
      onClick={onOrder}
      className="bg-[#0A0A0C] border border-white/5 rounded-2xl overflow-hidden group hover:border-[#D4FF00]/50 hover:shadow-[0_0_25px_rgba(212,255,0,0.1)] hover:bg-[#0E0E12] transition-all duration-300 flex flex-col h-full cursor-pointer relative active:bg-[#121215]"
    >
      {/* Top Banner Tag Overlay */}
      <div className="absolute top-3 left-3 z-30 pointer-events-none flex gap-1.5 flex-wrap">
        <span className={cn(
          "w-5 h-5 rounded-full flex items-center justify-center border border-white/10 bg-black/60 backdrop-blur-md text-[10px]",
          item.isVeg ? "text-green-400" : "text-red-400"
        )}>
          {item.isVeg ? "●" : "▲"}
        </span>
      </div>

      <div className="relative h-36 sm:h-52 overflow-hidden bg-[#141416] border-b border-white/5">
        <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0C] via-transparent to-transparent z-10 opacity-90" />
        <img
          src={item.image}
          alt={item.name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 ease-out"
          referrerPolicy="no-referrer"
        />
        
        {/* Premium Heart toggle on top-right of Grid Card */}
        <button
          onClick={toggleFav}
          className="absolute top-3 right-16 z-20 w-8 h-8 rounded-xl bg-black/80 backdrop-blur-md flex items-center justify-center border border-white/10 hover:border-red-500/30 hover:scale-105 active:scale-95 transition-all cursor-pointer"
          title="Add to Favorite Shortlist"
        >
          <Heart className={cn("w-4 h-4 transition-all duration-300", isFav ? "fill-red-500 text-red-500 scale-110" : "text-white")} />
        </button>

        {/* Absolute floating price */}
        <div className="absolute top-3 right-3 z-20 bg-black/80 backdrop-blur-md px-2.5 py-1 rounded-xl border border-white/10 group-hover:border-[#D4FF00]/20 transition-all">
          <span className="text-[#D4FF00] font-sans font-bold text-xs sm:text-sm">₹{item.price}</span>
        </div>
      </div>
      
      {/* Description space & Macros block */}
      <div className="p-3 sm:p-5 flex-1 flex flex-col relative z-20 -mt-4 bg-gradient-to-b from-transparent via-[#0A0A0C] to-[#0A0A0C]">
        
        <h3 className="text-xs sm:text-base font-display font-extrabold uppercase tracking-wide leading-snug text-white group-hover:text-[#D4FF00] transition-colors mb-2 line-clamp-1">
          {item.name}
        </h3>
        
        <div className="mt-auto pt-3 border-t border-white/5 flex items-center justify-between gap-2">
          <div>
            <span className="text-[10px] sm:text-xs font-mono tracking-wide block leading-tight">
              <strong className="text-[#D4FF00] font-black">{item.protein}g P |</strong>
              <br />
              <span className="text-gray-300 font-bold">{item.calories} kcal</span>
            </span>
          </div>
          
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={(e) => {
              e.stopPropagation();
              if (onAddDirect) {
                onAddDirect(e);
              } else {
                onOrder();
              }
            }}
            className="bg-[#D4FF00] text-black hover:bg-white border border-transparent w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center transition-all shadow-[0_0_12px_rgba(212,255,0,0.15)] select-none shrink-0"
            title="Grab instant single"
          >
            <ShoppingCart className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-black" />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}
