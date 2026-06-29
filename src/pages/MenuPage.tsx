import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Filter, Loader2, ChefHat, Flame, BrainCircuit, LayoutGrid, ListFilter, Dumbbell, Sparkles, X, Crown, Trophy, Leaf, Zap, User, GraduationCap, Coffee } from 'lucide-react';
import { MenuCard, MenuCardSkeleton, type MenuItem } from '../components/MenuCard';
import { OrderModal } from '../components/OrderModal';
import { NutritionModal } from '../components/NutritionModal';
import { cn } from '../components/Layout';
import { supabase, getPublicUrl } from '../lib/supabase';
import type { Session } from '@supabase/supabase-js';
import { useCart } from '../context/CartContext';
import { IdentitySelector } from '../components/IdentitySelector';

const SEGMENT_DEFS = [
  {
    id: 'student',
    label: 'Student',
    icon: GraduationCap,
    sub: 'Mass Calories',
  },
  {
    id: 'professional',
    label: 'Professional',
    icon: Coffee,
    sub: 'Clean Focus',
  },
  {
    id: 'elite',
    label: 'Elite Athlete',
    icon: Trophy,
    sub: 'Peak Macros',
  },
];

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
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [infoItem, setInfoItem] = useState<MenuItem | null>(null);
  const [products, setProducts] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tutorialStep, setTutorialStep] = useState<number>(-1);
  
  // Constant premium rectangular list layout
  const viewMode = 'list';
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const navigate = useNavigate();

  const { addItem } = useCart();

  useEffect(() => {
    if (!localStorage.getItem('tutorial_seen')) {
      setTutorialStep(0);
    }
  }, []);

  const completeTutorial = () => {
    setTutorialStep(-1);
    localStorage.setItem('tutorial_seen', 'true');
  };

  useEffect(() => {
    // Process pending cart item from signup/login
    const checkPendingIntent = () => {
      const isAuth = session || localStorage.getItem('mock_session');
      if (isAuth) {
        const pending = sessionStorage.getItem('pending_cart_item');
        if (pending) {
          try {
            const parsed = JSON.parse(pending);
            addItem(parsed);
            sessionStorage.removeItem('pending_cart_item');
            setToastMessage(`Added ${parsed.name} to cart (+${parsed.protein}g protein)!`);
            setTimeout(() => setToastMessage(null), 3500);
          } catch(e) {}
        }
      }
    };
    checkPendingIntent();
  }, [session, addItem]);

  useEffect(() => {
    const hasSelectedSegment = !!localStorage.getItem('user_segment');
    if (!hasSelectedSegment && !session) {
      navigate('/', { replace: true });
    }
  }, [navigate, session]);

  const [userSegment, setUserSegment] = useState<string>(localStorage.getItem('user_segment') || 'student');
  const [showIdentityModal, setShowIdentityModal] = useState(false);
  const [dismissedItemIds, setDismissedItemIds] = useState<string[]>([]);
  const [lastDismissedId, setLastDismissedId] = useState<string | null>(null);

  const handleSelectSegment = async (segmentId: string) => {
    localStorage.setItem('user_segment', segmentId);
    setUserSegment(segmentId);
    
    if (supabase && session?.user?.id) {
      try {
        await supabase
          .from('profiles')
          .update({ user_segment: segmentId })
          .eq('id', session.user.id);
      } catch (err) {
        console.warn('Could not update segment in DB:', err);
      }
    }
  };

  const handleDismissItem = (itemId: string, itemName: string) => {
    setDismissedItemIds((prev) => [...prev, itemId]);
    setLastDismissedId(itemId);
    setToastMessage(`Hidden "${itemName}" from your menu. Tap to Undo.`);
    
    setTimeout(() => {
      setToastMessage((curr) => {
        if (curr && curr.includes(itemName)) return null;
        return curr;
      });
    }, 4500);
  };

  const handleUndoDismiss = () => {
    if (lastDismissedId) {
      setDismissedItemIds((prev) => prev.filter((id) => id !== lastDismissedId));
      setLastDismissedId(null);
      setToastMessage("Meal restored to active board.");
      setTimeout(() => setToastMessage(null), 1800);
    }
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      if (!supabase) {
        setProducts(FALLBACK_PRODUCTS);
        setLoading(false);
        return;
      }

      // Check profiles table for segment update if authenticated and not cached locally
      let currentSeg = userSegment;
      if (session?.user?.id && !localStorage.getItem('user_segment')) {
        try {
          const { data: profData } = await supabase
            .from('profiles')
            .select('user_segment')
            .eq('id', session.user.id)
            .single();
          if (profData?.user_segment) {
            currentSeg = profData.user_segment;
            setUserSegment(currentSeg);
            localStorage.setItem('user_segment', currentSeg);
          }
        } catch (e) {}
      }

      // Map segment to Supabase table
      let tableName = 'student_menu';
      if (currentSeg === 'professional') {
        tableName = 'proff_menu';
      } else if (currentSeg === 'elite') {
        tableName = 'elite_menu';
      }

      // Dynamic table query with fallback to student_menu
      let { data, error } = await supabase
        .from(tableName)
        .select('*')
        .eq('is_available', true);

      if (error) {
        console.warn(`Error querying segment table ${tableName}, attempting fallback to 'student_menu':`, error);
        const fbResult = await supabase
          .from('student_menu')
          .select('*')
          .eq('is_available', true);
        
        data = fbResult.data;
        error = fbResult.error;
      }

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
          carbs: Number(p.carbs || 0),
          fats: Number(p.fat || 0),
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
  }, [session, userSegment]);

  const filteredItems = useMemo(() => {
    const list = products.filter((item) => {
      const isDismissed = dismissedItemIds.includes(item.id);
      if (isDismissed) return false;

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
      const codeA = a.code || '';
      const codeB = b.code || '';
      return codeA.localeCompare(codeB, undefined, { numeric: true, sensitivity: 'base' });
    });
  }, [products, searchQuery, activeFilter, dismissedItemIds]);

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
      carbs: item.carbs,
      fats: item.fats,
      calories: item.calories,
      isVeg: item.isVeg,
    });

    // Toast Alert
    setToastMessage(`Added ${item.name} to cart (+${item.protein}g protein)!`);
    setTimeout(() => {
      setToastMessage(null);
    }, 2800);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-12 pb-28 md:pb-16 select-none">
      
      {/* Centered Premium Title Header */}
      <div className="mb-6 sm:mb-8 text-center animate-fade-in">
        <motion.h1
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-4xl sm:text-5xl lg:text-6xl font-display uppercase tracking-widest font-black text-white"
        >
          Fuel <span className="bg-gradient-to-r from-[#D4FF00] to-[#A3FF00] bg-clip-text text-transparent drop-shadow-[0_4px_24px_rgba(212,255,0,0.3)]">Station</span>
        </motion.h1>
      </div>


      {/* Controls: Premium Search Bar with Filter */}
      <div 
        className={cn(
          "mb-6 sm:mb-8 max-w-xl mx-auto transition-all",
          tutorialStep === 0 && "relative z-[60] ring-4 ring-[#D4FF00] rounded-2xl bg-[#0D0D0D]"
        )}
      >
        <div className="bg-[#0D0D0D]/60 p-2 rounded-2xl border border-white/5 shadow-2xl backdrop-blur-md flex items-center gap-2">
          <div className="relative flex-1">
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
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              "px-4 py-3 rounded-xl transition-all border flex items-center justify-center h-full",
              showFilters || activeFilter !== 'All Meals'
                ? "bg-[#D4FF00] text-black border-transparent shadow-[0_4px_15px_rgba(212,255,0,0.3)]"
                : "bg-[#141414] text-gray-400 border-white/5 box-border hover:border-white/10"
            )}
          >
            <Filter className="w-4.5 h-4.5" />
          </button>
        </div>
      </div>

      {/* 3 Circular Identity selectors right below the search bar */}
      <div className="max-w-md mx-auto mb-8 flex items-center justify-between px-6 sm:px-4">
        {SEGMENT_DEFS.map((seg) => {
          const IconComponent = seg.icon;
          const isActive = userSegment === seg.id;
          return (
            <button
              key={seg.id}
              onClick={() => handleSelectSegment(seg.id)}
              className="flex flex-col items-center gap-2 group transition-all duration-300 focus:outline-none cursor-pointer"
            >
              {/* The circle container */}
              <div
                className={cn(
                  "relative w-14 h-14 sm:w-16 sm:h-16 rounded-full border flex items-center justify-center transition-all duration-300 active:scale-95",
                  isActive
                    ? "border-[#D4FF00] bg-zinc-900/90 shadow-[0_0_20px_rgba(212,255,0,0.2)] ring-2 ring-[#D4FF00]/40 ring-offset-2 ring-offset-black"
                    : "border-white/5 bg-[#0D0D0D]/60 hover:border-white/20 hover:bg-zinc-900/50"
                )}
              >
                <IconComponent
                  className={cn(
                    "w-5 h-5 sm:w-6 sm:h-6 transition-all duration-300",
                    isActive ? "text-[#D4FF00] scale-110" : "text-zinc-500 group-hover:text-zinc-300"
                  )}
                />
                
                {/* Active dot indicator on the circle border */}
                {isActive && (
                  <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-[#D4FF00] border-2 border-black rounded-full shadow-[0_0_8px_rgba(212,255,0,0.5)]" />
                )}
              </div>
              
              {/* Label and description beneath */}
              <div className="text-center">
                <span
                  className={cn(
                    "text-[10px] sm:text-xs font-mono font-black uppercase tracking-wider block transition-colors",
                    isActive ? "text-[#D4FF00]" : "text-zinc-400 group-hover:text-zinc-200"
                  )}
                >
                  {seg.label}
                </span>
                <span className="text-[7.5px] sm:text-[8.5px] font-mono text-zinc-600 group-hover:text-zinc-400 transition-colors uppercase tracking-widest block mt-0.5">
                  {seg.sub}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Premium Aligned Grid/Flex Category Filter Pills */}
      <AnimatePresence>
        {showFilters && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-8 select-none flex justify-center overflow-hidden"
          >
            <div className="flex flex-wrap gap-2 max-w-2xl justify-center pt-2">
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
          </motion.div>
        )}
      </AnimatePresence>



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
            {loading ? (
              Array.from({ length: 4 }).map((_, index) => (
                <motion.div
                  key={`skeleton-${index}`}
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <MenuCardSkeleton mode={viewMode} />
                </motion.div>
              ))
            ) : (
              filteredItems.map((item, index) => (
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
                    onInfo={(e) => { e.stopPropagation(); setSelectedItem(item); }}
                    onSwipeLeft={() => handleDismissItem(item.id, item.name)}
                    onSwipeRight={() => {
                      addItem({
                        id: item.id,
                        code: item.code,
                        name: item.name,
                        price: item.price,
                        protein: item.protein,
                        quantity: 1,
                        note: '',
                        carbs: item.carbs,
                        fats: item.fats,
                        calories: item.calories,
                        isVeg: item.isVeg,
                      });
                      setToastMessage(`Swiped "${item.name}" into Plate (+${item.protein}g P)!`);
                      setTimeout(() => setToastMessage(null), 2800);
                    }}
                  />
                </motion.div>
              ))
            )}
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
          <div className="flex flex-wrap gap-4 items-center justify-center">
            {dismissedItemIds.length > 0 && (
              <button 
                onClick={() => setDismissedItemIds([])}
                className="bg-[#D4FF00]/10 border border-[#D4FF00]/20 text-[#D4FF00] px-4 py-2 rounded-xl font-mono text-xs uppercase tracking-wider hover:bg-[#D4FF00]/20 transition-all active:scale-95 cursor-pointer"
              >
                Restore Hidden Meals ({dismissedItemIds.length})
              </button>
            )}
            <button 
              onClick={() => { setActiveFilter('All Meals'); setSearchQuery(''); }}
              className="text-[#D4FF00] font-mono text-xs uppercase hover:underline underline-offset-4"
            >
              Reset Filters
            </button>
          </div>
        </div>
      )}

      {/* Change Athletic Identity Button at the end of MenuPage */}
      <div className="mt-20 mb-10 flex flex-col items-center justify-center border-t border-white/5 pt-8">
        <p className="text-zinc-600 font-mono text-[10px] uppercase tracking-widest mb-3">
          CURRENT ATHLETIC FEED: <span className="text-[#D4FF00]">{userSegment === 'student' ? 'Student / Hosteler' : userSegment === 'professional' ? 'Working Professional' : 'Elite Athlete'}</span>
        </p>
        <div className="flex flex-col items-center gap-3">
          <button
            onClick={() => {
              setShowIdentityModal(true);
            }}
            className="px-6 py-3 bg-[#0A0A0C] hover:bg-zinc-900 text-zinc-400 hover:text-[#D4FF00] border border-white/10 rounded-2xl font-mono text-[11px] font-black uppercase tracking-wider transition-all duration-300 shadow-[0_4px_24px_rgba(0,0,0,0.6)] flex items-center gap-2 cursor-pointer"
          >
            <User className="w-4.5 h-4.5 text-zinc-500 group-hover:text-[#D4FF00]" /> CHANGE ATHLETIC IDENTITY
          </button>
          {dismissedItemIds.length > 0 && (
            <button
              onClick={() => setDismissedItemIds([])}
              className="text-[10px] font-mono uppercase text-zinc-500 hover:text-white transition-colors cursor-pointer tracking-wider"
            >
              RESTORE {dismissedItemIds.length} HIDDEN MEAL{dismissedItemIds.length > 1 ? 'S' : ''}
            </button>
          )}
        </div>
      </div>

      {showIdentityModal && (
        <IdentitySelector
          session={session}
          onSelect={(segmentId) => {
            localStorage.setItem('user_segment', segmentId);
            setUserSegment(segmentId);
            setShowIdentityModal(false);
          }}
          onCancel={() => setShowIdentityModal(false)}
          showCancelButton={true}
        />
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
            <span className="text-xs uppercase tracking-wide font-sans leading-snug flex-1">
              {toastMessage}
            </span>
            <div className="flex items-center gap-1.5 shrink-0">
              {toastMessage.includes("Hidden") && (
                <button
                  onClick={() => {
                    handleUndoDismiss();
                  }}
                  className="text-[10px] font-mono uppercase px-2.5 py-1 bg-black text-[#D4FF00] hover:bg-zinc-900 rounded-md transition-colors"
                >
                  Undo
                </button>
              )}
              <button 
                onClick={() => setToastMessage(null)}
                className="text-[10px] font-mono uppercase px-2 py-1 bg-black/10 hover:bg-black/20 rounded-md transition-colors"
              >
                Dismiss
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <OrderModal item={selectedItem} onClose={() => setSelectedItem(null)} session={session} />
      <NutritionModal item={infoItem} onClose={() => setInfoItem(null)} />

      {/* Gamified Tutorial Overlay */}
      <AnimatePresence>
        {tutorialStep >= 0 && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              onClick={completeTutorial}
            />
            
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 30, scale: 0.9 }}
              className={cn(
                "relative z-[70] bg-[#141414] border border-[#D4FF00]/30 shadow-[0_0_40px_rgba(212,255,0,0.2)] rounded-3xl p-6 md:p-8 max-w-sm w-full text-center overflow-hidden",
                tutorialStep === 0 ? "mt-[-20vh]" : "mt-[30vh]"
              )}
            >
              {/* Highlight Glow Accent */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#D4FF00] to-transparent" />
              
              <div className="w-12 h-12 bg-[#D4FF00]/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-[#D4FF00]/20">
                {tutorialStep === 0 && <Search className="w-6 h-6 text-[#D4FF00]" />}
                {tutorialStep === 1 && <Sparkles className="w-6 h-6 text-[#D4FF00]" />}
              </div>
              
              <h3 className="text-[#D4FF00] font-display uppercase tracking-widest text-lg mb-2">
                {tutorialStep === 0 ? 'Find Your Fuel' : 'Lightning Order'}
              </h3>
              
              <div className="text-gray-300 font-mono text-sm leading-relaxed mb-8 flex flex-col gap-2">
                {tutorialStep === 0 ? (
                  <>
                    <p>Search for any meal or click the <Filter className="inline w-3.5 h-3.5 mx-1" /> icon to reveal category tags.</p>
                  </>
                ) : (
                  <>
                    <p>Ordering is seamless. Hit <span className="font-bold text-white">+</span> to quick-add, or tap the card for details.</p>
                    <p className="text-[#D4FF00]/70 text-xs mt-2">No forced sign-ups required. Fuel up instantly!</p>
                  </>
                )}
              </div>
              
              <div className="flex gap-3">
                {tutorialStep === 0 ? (
                  <button 
                    onClick={() => setTutorialStep(1)}
                    className="flex-1 bg-[#D4FF00] text-black font-extrabold uppercase py-3 rounded-xl hover:bg-[#B8E600] active:scale-95 transition-all text-sm tracking-wider"
                  >
                    Got It, Next
                  </button>
                ) : (
                  <button 
                    onClick={completeTutorial}
                    className="flex-1 bg-[#D4FF00] text-black font-extrabold uppercase py-3 rounded-xl hover:bg-[#B8E600] active:scale-95 transition-all text-sm tracking-wider shadow-[0_0_15px_rgba(212,255,0,0.4)]"
                  >
                    Start Fueling
                  </button>
                )}
                <button 
                  onClick={completeTutorial}
                  className="px-4 bg-[#222] text-gray-400 font-mono uppercase text-xs rounded-xl hover:bg-[#333] hover:text-white transition-all"
                >
                  Skip
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
