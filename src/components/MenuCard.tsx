import React from 'react';
import { motion } from 'motion/react';
import { ShoppingCart } from 'lucide-react';
import { Tag } from './Tag';

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

export interface MenuCardProps {
  item: MenuItem;
  onOrder: () => void;
  key?: React.Key;
}

export function MenuCard({ item, onOrder }: MenuCardProps) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -8, scale: 1.02 }}
      transition={{ duration: 0.3 }}
      onClick={onOrder}
      className="bg-[#141414] border border-white/5 rounded-3xl overflow-hidden group hover:border-[#D4FF00]/50 hover:shadow-[0_10px_40px_rgba(212,255,0,0.15)] transition-all duration-500 flex flex-col h-full cursor-pointer"
    >
      <div className="relative h-56 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-transparent to-transparent z-10 opacity-80" />
        <img
          src={item.image}
          alt={item.name}
          className="w-full h-full object-cover group-hover:scale-125 transition-transform duration-700 ease-out"
          referrerPolicy="no-referrer"
        />
        <div className="absolute top-4 right-4 z-20 bg-black/80 backdrop-blur-md px-3 py-1 rounded-full border border-white/10">
          <span className="text-[#D4FF00] font-mono font-bold text-sm">₹{item.price}</span>
        </div>
      </div>
      
      <div className="p-6 flex-1 flex flex-col relative z-20 -mt-6 bg-gradient-to-b from-transparent to-[#141414]">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-xl font-display uppercase tracking-wide leading-tight text-white group-hover:text-[#D4FF00] transition-colors">{item.name}</h3>
        </div>
        
        <div className="flex flex-wrap gap-2 mb-6">
          {item.tags.map(tag => {
            let type: 'protein' | 'veg' | 'price' | 'gym' | 'default' = 'default';
            if (tag.includes('g P')) type = 'protein';
            else if (tag === 'Veg') type = 'veg';
            else if (tag.includes('₹')) type = 'price';
            else if (tag === 'Premium') type = 'gym';
            return <Tag key={tag} label={tag} type={type} />;
          })}
        </div>
        
        <div className="mt-auto pt-6 border-t border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="text-center">
              <span className="block text-2xl font-display text-white leading-none">{item.protein}g</span>
              <span className="text-[10px] font-mono text-gray-500 uppercase tracking-wider">Protein</span>
            </div>
            <div className="w-px h-8 bg-white/10" />
            <div className="text-center">
              <span className="block text-xl font-display text-gray-300 leading-none">{item.calories}</span>
              <span className="text-[10px] font-mono text-gray-500 uppercase tracking-wider">Kcal</span>
            </div>
          </div>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={(e) => { e.stopPropagation(); onOrder(); }}
            className="bg-[#D4FF00] text-black hover:bg-white border border-transparent px-4 py-3 rounded-xl transition-all shadow-[0_0_15px_rgba(212,255,0,0.2)] hover:shadow-[0_0_25px_rgba(212,255,0,0.5)] flex items-center gap-2 font-bold"
          >
            <ShoppingCart className="w-5 h-5" />
            <span className="hidden sm:inline">Order</span>
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}
