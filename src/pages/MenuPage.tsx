import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Filter, Loader2, ChefHat, Flame, BrainCircuit } from 'lucide-react';
import { MenuCard, type MenuItem } from '../components/MenuCard';
import { OrderModal } from '../components/OrderModal';
import { cn } from '../components/Layout';
import { supabase, getPublicUrl } from '../lib/supabase';
import type { Session } from '@supabase/supabase-js';
import { ProductManager } from '../components/ProductManager';

const FILTERS = [
  'All Meals',
  'Veg',
  'Non-Veg',
  'Bestseller',
  'Bulk',
  'Cut',
  'Premium',
  'Quick Protein',
];

export default function MenuPage({ session }: { session: Session | null }) {
  const [activeFilter, setActiveFilter] = useState('All Meals');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [products, setProducts] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAdmin, setShowAdmin] = useState(false);

  const fetchProducts = async () => {
    if (!supabase) {
      setError('Supabase is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in environment variables.');
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_available', true);

      if (error) throw error;

      if (data) {
        const mappedProducts: MenuItem[] = data.map((p: any) => ({
          id: p.id.toString(),
          code: p.code,
          name: p.name,
          protein: p.protein,
          calories: p.calories,
          price: p.price,
          isVeg: p.is_veg,
          image: getPublicUrl(p.image_url),
          tags: p.tags || [],
        }));
        setProducts(mappedProducts);
      }
    } catch (err: any) {
      console.error('Error fetching products:', err);
      setError('Failed to load menu. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const filteredItems = useMemo(() => {
    return products.filter((item) => {
      const matchesSearch = 
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.code.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesFilter = 
        activeFilter === 'All Meals' || 
        (activeFilter === 'Veg' && item.isVeg) ||
        (activeFilter === 'Non-Veg' && !item.isVeg) ||
        item.tags.includes(activeFilter);

      return matchesSearch && matchesFilter;
    });
  }, [products, searchQuery, activeFilter]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-12 h-12 text-[#D4FF00] animate-spin mb-4" />
        <p className="text-gray-400 font-display uppercase tracking-widest">Loading Fuel...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-12">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 mb-6"
        >
          <Flame className="w-4 h-4 text-[#FF3E00]" />
          <span className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-white">Daily Fresh Fuel</span>
        </motion.div>
        
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-5xl md:text-7xl font-display uppercase tracking-tight mb-4"
        >
          Fuel <span className="text-[#D4FF00] drop-shadow-[0_0_15px_rgba(212,255,0,0.3)]">Station</span>
        </motion.h1>
        
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-gray-400 max-w-2xl mx-auto text-lg flex items-center justify-center gap-3"
        >
          <ChefHat className="w-5 h-5 opacity-50" />
          Precision-cooked protein for peak performance.
        </motion.p>
      </div>

      <div className="flex flex-col md:flex-row gap-6 mb-8 group">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="text-gray-500 w-5 h-5 group-focus-within:text-[#D4FF00] transition-colors" />
          </div>
          <input
            type="text"
            placeholder="Search by meal name or code (e.g. 101)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#141414] border border-white/10 rounded-2xl py-5 pl-12 pr-4 text-white placeholder:text-gray-600 focus:outline-none focus:border-[#D4FF00]/50 transition-all shadow-inner"
          />
        </div>
      </div>

      <div className="mb-12 overflow-x-auto pb-4 hide-scrollbar">
        <div className="flex gap-3 min-w-max p-1">
          {FILTERS.map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={cn(
                'px-8 py-3 rounded-xl text-xs font-bold uppercase tracking-[0.1em] transition-all border outline-none',
                activeFilter === filter
                  ? 'bg-[#D4FF00] text-black border-transparent shadow-[0_0_20px_rgba(212,255,0,0.4)] scale-105'
                  : 'bg-[#141414]/50 text-gray-500 border-white/5 hover:border-white/20 hover:text-white'
              )}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {error ? (
        <div className="text-center py-20 bg-red-500/5 border border-red-500/10 rounded-3xl">
          <p className="text-red-400 font-display tracking-wide uppercase">{error}</p>
        </div>
      ) : (
        <AnimatePresence mode="popLayout">
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            layout
          >
            {filteredItems.map((item, index) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <MenuCard item={item} onOrder={() => setSelectedItem(item)} />
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>
      )}

      {filteredItems.length === 0 && !loading && !error && (
        <div className="text-center py-24 flex flex-col items-center gap-6">
          <div className="p-6 bg-white/5 rounded-full">
            <BrainCircuit className="w-12 h-12 text-gray-600" />
          </div>
          <p className="text-gray-500 text-xl font-display tracking-widest uppercase">No macros found matching your search.</p>
          <button 
            onClick={() => { setActiveFilter('All Meals'); setSearchQuery(''); }}
            className="text-[#D4FF00] font-mono text-sm uppercase hover:underline"
          >
            Reset Filters
          </button>
        </div>
      )}

      <OrderModal item={selectedItem} onClose={() => setSelectedItem(null)} />
    </div>
  );
}
