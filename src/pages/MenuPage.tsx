import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Filter, Loader2, ChefHat, Flame, BrainCircuit, LayoutGrid, ListFilter, Dumbbell, Sparkles, X, Crown, Trophy, Leaf, Zap } from 'lucide-react';
import { MenuCard, type MenuItem } from '../components/MenuCard';
import { OrderModal } from '../components/OrderModal';
import { cn } from '../components/Layout';
import { supabase, getPublicUrl } from '../lib/supabase';
import type { Session } from '@supabase/supabase-js';
import { useCart } from '../context/CartContext';

const FILTER_DEFS = [
  { value: 'All Meals', label: 'All Meals' },
  { value: 'Veg', label: 'Veg Only' },
  { value: 'Non-Veg', label: 'Lean Meat' },
  { value: 'Bestseller', label: 'Bestsellers' },
  { value: 'Bulk', label: 'Mass Bulk' },
  { value: 'Cut', label: 'Shred Cut' },
  { value: 'Premium', label: 'Elite Meals' },
  { value: 'Quick Protein', label: 'Quick Pro' },
];

const FILTER_ICONS: Record<string, React.ComponentType<any>> = {
  'All Meals': LayoutGrid,
  'Veg': Leaf,
  'Non-Veg': Flame,
  'Bestseller': Crown,
  'Bulk': Dumbbell,
  'Cut': Zap,
  'Premium': Trophy,
  'Quick Protein': Sparkles,
};

const FALLBACK_PRODUCTS: MenuItem[] = [
  {
    id: '101',
    code: '101',
    name: 'Hyper-Volume Chicken Roll',
    protein: 25,
    calories: 350,
    price: 99,
    isVeg: false,
    image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&q=80',
    tags: ['Bestseller', 'Quick Protein']
  },
  {
    id: '102',
    code: '102',
    name: 'Elite Boiled Chicken (200g)',
    protein: 62,
    calories: 330,
    price: 149,
    isVeg: false,
    image: 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=800&q=80',
    tags: ['Premium', 'Cut']
  },
  {
    id: '103',
    code: '103',
    name: 'Mass Gainer Soya Rice',
    protein: 30,
    calories: 450,
    price: 129,
    isVeg: true,
    image: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=800&q=80',
    tags: ['Veg', 'Bulk']
  },
  {
    id: '104',
    code: '104',
    name: 'Pro-Tiffin Box',
    protein: 45,
    calories: 550,
    price: 180,
    isVeg: false,
    image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80',
    tags: ['Premium', 'Bestseller']
  }
];

export default function MenuPage({ session }: { session: Session | null }) {
  const [activeFilter, setActiveFilter] = useState('All Meals');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [products, setProducts] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Constant premium rectangular list layout
  const viewMode = 'list';
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isFloatOpen, setIsFloatOpen] = useState(false);

  const { addItem } = useCart();

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      if (!supabase) {
        setProducts(FALLBACK_PRODUCTS);
        setLoading(false);
        return;
      }
      
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_available', true);

      if (error) throw error;

      if (data && data.length > 0) {
        const mappedProducts: MenuItem[] = data.map((p: any) => ({
          id: p.id.toString(),
          code: p.code,
          name: p.name,
          protein: Number(p.protein || 0),
          calories: Number(p.calories || 0),
          price: Number(p.price || 0),
          isVeg: p.is_veg,
          image: getPublicUrl(p.image_url),
          tags: p.tags || [],
        }));
        setProducts(mappedProducts);
      } else {
        setProducts(FALLBACK_PRODUCTS);
      }
    } catch (err: any) {
      console.warn('Error fetching products from Supabase (falling back to pre-seeded static list):', err);
      setProducts(FALLBACK_PRODUCTS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [session]);

  const filteredItems = useMemo(() => {
    const list = products.filter((item) => {
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

    return list.sort((a, b) => {
      const numA = parseInt(a.code) || parseInt(a.id) || 0;
      const numB = parseInt(b.code) || parseInt(b.id) || 0;
      return numA - numB;
    });
  }, [products, searchQuery, activeFilter]);

  const handleAddDirect = (item: MenuItem, e: React.MouseEvent) => {
    e.stopPropagation();
    addItem({
      id: item.id,
      code: item.code,
      name: item.name,
      price: item.price,
      protein: item.protein,
      quantity: 1,
      note: '',
    });

    // Toast Alert
    setToastMessage(`Added ${item.name} to cart (+${item.protein}g protein)!`);
    setTimeout(() => {
      setToastMessage(null);
    }, 2800);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-12 h-12 text-[#D4FF00] animate-spin mb-4" />
        <p className="text-gray-400 font-display uppercase tracking-widest">Loading Fuel...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-12 pb-28 md:pb-16 select-none">
      
      {/* Centered Premium Title Header */}
      <div className="mb-6 sm:mb-10 text-center animate-fade-in">
        <motion.h1
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-4xl sm:text-5xl lg:text-6xl font-display uppercase tracking-widest font-black text-white"
        >
          Fuel <span className="bg-gradient-to-r from-[#D4FF00] to-[#A3FF00] bg-clip-text text-transparent drop-shadow-[0_4px_24px_rgba(212,255,0,0.3)]">Station</span>
        </motion.h1>
      </div>

      {/* Controls: Premium Search Bar */}
      <div className="mb-6 sm:mb-8 bg-[#0D0D0D]/60 p-2 rounded-2xl border border-white/5 shadow-2xl backdrop-blur-md max-w-xl mx-auto">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
            <Search className="text-gray-500 w-4.5 h-4.5" />
          </div>
          <input
            type="text"
            placeholder="Search roll, egg, chicken..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#141414] border border-transparent rounded-xl py-3 pl-11 pr-4 text-xs font-medium text-white placeholder:text-gray-600 focus:outline-none focus:border-[#D4FF00]/25 focus:bg-[#161616] transition-all"
          />
        </div>
      </div>

      {/* Premium Aligned Grid/Flex Category Filter Pills */}
      <div className="mb-8 select-none flex justify-center">
        <div className="flex flex-wrap gap-2 max-w-2xl justify-center">
          {FILTER_DEFS.map((f) => (
            <button
              key={f.value}
              onClick={() => setActiveFilter(f.value)}
              className={cn(
                'px-4 py-2 rounded-xl text-[10px] sm:text-xs font-mono uppercase tracking-wider transition-all border outline-none duration-250 active:scale-95',
                activeFilter === f.value
                  ? 'bg-[#D4FF00] text-black border-transparent shadow-[0_4px_15px_rgba(212,255,0,0.3)] font-black scale-105'
                  : 'bg-[#0D0D0D]/60 text-gray-400 border-white/5 hover:border-white/10 hover:text-white'
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Food Items Display Section */}
      {error ? (
        <div className="text-center py-16 bg-red-500/5 border border-red-500/10 rounded-2xl">
          <p className="text-red-400 font-display tracking-wide uppercase text-sm">{error}</p>
        </div>
      ) : (
        <AnimatePresence mode="popLayout">
          <motion.div 
            id="food-items-deck"
            className={cn(
              "grid gap-3 sm:gap-6",
              viewMode === 'list' 
                ? "grid-cols-1 max-w-3xl mx-auto" 
                : "grid-cols-2 md:grid-cols-2 lg:grid-cols-3"
            )}
            layout
          >
            {filteredItems.map((item, index) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.25, delay: index * 0.03 }}
              >
                <MenuCard 
                  item={item} 
                  mode={viewMode}
                  onOrder={() => setSelectedItem(item)} 
                  onAddDirect={(e) => handleAddDirect(item, e)}
                />
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>
      )}

      {/* Empty State matches design discipline */}
      {filteredItems.length === 0 && !loading && !error && (
        <div className="text-center py-20 flex flex-col items-center gap-4 bg-[#101010] rounded-2xl border border-white/5 p-8 max-w-xl mx-auto">
          <div className="p-4 bg-white/5 rounded-full ring-4 ring-[#D4FF00]/5">
            <BrainCircuit className="w-8 h-8 text-gray-500" />
          </div>
          <p className="text-gray-400 text-sm font-display tracking-widest uppercase">No macros found matching criteria.</p>
          <button 
            onClick={() => { setActiveFilter('All Meals'); setSearchQuery(''); }}
            className="text-[#D4FF00] font-mono text-xs uppercase hover:underline underline-offset-4"
          >
            Reset Filters
          </button>
        </div>
      )}

      {/* Highly Tactile Floating Direct Add Toast Pill for iOS & Android */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-20 left-4 right-4 md:left-auto md:right-8 md:max-w-md z-50 bg-[#D4FF00] text-black px-4 py-3.5 rounded-2xl shadow-[0_12px_45px_rgba(212,255,0,0.35)] flex items-center justify-between border border-black/10 gap-3 font-bold"
          >
            <span className="text-xs uppercase tracking-wide font-sans leading-snug">
              {toastMessage}
            </span>
            <button 
              onClick={() => setToastMessage(null)}
              className="text-[10px] font-mono uppercase px-2 py-1 bg-black/10 hover:bg-black/20 rounded-md transition-colors"
            >
              Dismiss
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Category Drawer Overlay */}
      <AnimatePresence>
        {isFloatOpen && (
          <>
            {/* Semi-transparent Backdrop click-to-close */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsFloatOpen(false)}
              className="fixed inset-0 bg-[#000000]/75 backdrop-blur-xs z-40 pointer-events-auto cursor-pointer"
            />

            {/* Floating Category Navigation Deck */}
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.93 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 30, scale: 0.93 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className="fixed bottom-42 right-5 md:bottom-26 md:right-8 z-50 w-64 bg-[#0c0c0e] border border-white/10 rounded-2xl p-4 shadow-[0_20px_50px_rgba(0,0,0,0.9)] max-h-[60vh] overflow-y-auto"
            >
              <div className="text-[10px] uppercase font-mono tracking-widest text-[#D4FF00] mb-3 border-b border-white/5 pb-2 font-black flex justify-between items-center">
                <span>Bro Categories</span>
                <span className="text-[9px] text-gray-400 normal-case font-medium">Quick Jump Bench</span>
              </div>

              <div className="space-y-1.5">
                {FILTER_DEFS.map((f) => {
                  const IconComp = FILTER_ICONS[f.value] || Filter;
                  const matches = activeFilter === f.value;
                  return (
                    <motion.button
                      key={f.value}
                      whileHover={{ x: 4 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        setActiveFilter(f.value);
                        setIsFloatOpen(false);
                        // Smoothly scroll back to the active food deck
                        setTimeout(() => {
                          const anchor = document.getElementById('food-items-deck');
                          if (anchor) {
                            anchor.scrollIntoView({ behavior: 'smooth', block: 'center' });
                          }
                        }, 50);
                      }}
                      className={cn(
                        "w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-left border text-xs tracking-wider uppercase font-mono transition-all outline-none cursor-pointer",
                        matches 
                          ? "bg-[#D4FF00] text-black border-transparent font-black shadow-[0_4px_12px_rgba(212,255,0,0.2)]" 
                          : "bg-white/[0.02] hover:bg-white/[0.06] text-gray-300 border-white/5"
                      )}
                    >
                      <IconComp className={cn("w-4 h-4 shrink-0", matches ? "text-black" : "text-[#D4FF00]")} />
                      <span className="truncate leading-none">{f.label}</span>
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Floating Quick Action Trigger Button */}
      <div className="fixed bottom-26 right-5 md:bottom-8 md:right-8 z-50">
        <motion.button
          onClick={() => setIsFloatOpen(!isFloatOpen)}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          animate={{
            boxShadow: isFloatOpen 
              ? "0 0 25px rgba(212,255,0,0.4)" 
              : ["0 0 10px rgba(212,255,0,0.1)", "0 0 20px rgba(212,255,0,0.3)", "0 0 10px rgba(212,255,0,0.1)"]
          }}
          transition={{
            boxShadow: {
              duration: 2.5,
              repeat: Infinity,
              ease: "easeInOut"
            }
          }}
          className={cn(
            "w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center border transition-colors relative outline-none cursor-pointer shadow-lg",
            isFloatOpen 
              ? "bg-[#D4FF00] border-transparent text-black" 
              : "bg-black/90 border-white/10 hover:border-[#D4FF00]/40 text-[#D4FF00]"
          )}
        >
          <AnimatePresence mode="wait">
            {isFloatOpen ? (
              <motion.div
                key="close"
                initial={{ opacity: 0, rotate: -90 }}
                animate={{ opacity: 1, rotate: 0 }}
                exit={{ opacity: 0, rotate: 90 }}
                transition={{ duration: 0.2 }}
                className="flex items-center justify-center"
              >
                <X className="w-5 h-5 md:w-6 md:h-6 text-black" />
              </motion.div>
            ) : (
              <motion.div
                key="menu"
                initial={{ opacity: 0, rotate: 90 }}
                animate={{ opacity: 1, rotate: 0 }}
                exit={{ opacity: 0, rotate: -90 }}
                transition={{ duration: 0.2 }}
                className="flex items-center justify-center"
              >
                <ListFilter className="w-5 h-5 md:w-6 md:h-6" />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>
      </div>

      <OrderModal item={selectedItem} onClose={() => setSelectedItem(null)} />
    </div>
  );
}
