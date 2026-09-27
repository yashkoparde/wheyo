import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Filter, Loader2, ChefHat, Flame, BrainCircuit, LayoutGrid, ListFilter, Dumbbell, Sparkles, X, Crown, Trophy, Leaf, Zap, User, GraduationCap, Coffee, Calendar, Activity, ClipboardList, ShoppingBag, Utensils, ArrowRight, ArrowLeft, ChevronRight, Check } from 'lucide-react';
import { MenuCard, MenuCardSkeleton, type MenuItem } from '../components/MenuCard';
import { OrderModal } from '../components/OrderModal';
import { NutritionModal } from '../components/NutritionModal';
import { cn } from '../components/Layout';
import { supabase, getPublicUrl } from '../lib/supabase';
import { getCachedMenuProducts } from '../lib/preloadTourAssets';
import type { Session } from '@supabase/supabase-js';
import { useCart } from '../context/CartContext';
import { IdentitySelector } from '../components/IdentitySelector';
import { IntroSequence } from '../components/IntroSequence';

const SEGMENT_DEFS = [
  {
    id: 'student',
    label: 'Student',
    icon: GraduationCap,
    sub: 'High Calorie',
  },
  {
    id: 'professional',
    label: 'Pro',
    icon: Coffee,
    sub: 'Clean Fuel',
  },
  {
    id: 'elite',
    label: 'Athlete',
    icon: Trophy,
    sub: 'High Protein',
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

  const [showIntro, setShowIntro] = useState(() => !sessionStorage.getItem('has_completed_intro'));
  const [showIdentitySelector, setShowIdentitySelector] = useState(false);

  const handleIntroComplete = () => {
    sessionStorage.setItem('has_completed_intro', 'true');
    setShowIntro(false);
    if (!localStorage.getItem('user_segment')) {
      localStorage.setItem('user_segment', 'student');
    }
  };

  useEffect(() => {
    if (showIntro) {
      document.body.style.overflow = 'hidden';
      window.scrollTo(0, 0);
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showIntro]);

  const { addItem, setTourStep } = useCart();

  useEffect(() => {
    if (!localStorage.getItem('tutorial_seen')) {
      localStorage.setItem('tutorial_seen', 'true');
    }
  }, []);

  const completeTutorial = () => {
    setTourStep(-1);
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

  const [userSegment, setUserSegment] = useState<string>(() => localStorage.getItem('user_segment') || 'student');
  const [showIdentityModal, setShowIdentityModal] = useState(false);
  const [dismissedItemIds, setDismissedItemIds] = useState<string[]>([]);
  const [lastDismissedId, setLastDismissedId] = useState<string | null>(null);

  // 🎯 Daily Protein Goal & Habit Tracker Growth Loop
  const [dailyProteinGoal, setDailyProteinGoal] = useState<number>(() => {
    return Number(localStorage.getItem('daily_protein_goal') || '150');
  });

  const [todayMeals, setTodayMeals] = useState<{ id: string; name: string; protein: number; calories: number; loggedAt: string }[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('today_meals') || '[]');
    } catch {
      return [];
    }
  });

  const [streakDays, setStreakDays] = useState<number>(() => {
    return Number(localStorage.getItem('wheyo_streak_days') || '3');
  });

  const [showQuickLogModal, setShowQuickLogModal] = useState(false);
  const [quickMealName, setQuickMealName] = useState('');
  const [quickMealProtein, setQuickMealProtein] = useState('');
  const [quickMealCalories, setQuickMealCalories] = useState('');

  // Sync macros with storage events
  useEffect(() => {
    const handleMacroUpdate = () => {
      try {
        const meals = JSON.parse(localStorage.getItem('today_meals') || '[]');
        setTodayMeals(meals);
      } catch {}
      const goal = Number(localStorage.getItem('daily_protein_goal') || '150');
      setDailyProteinGoal(goal);
    };
    window.addEventListener('wheyo-macros-updated', handleMacroUpdate);
    return () => window.removeEventListener('wheyo-macros-updated', handleMacroUpdate);
  }, []);

  const totalProteinLogged = useMemo(() => {
    return todayMeals.reduce((sum, m) => sum + (Number(m.protein) || 0), 0);
  }, [todayMeals]);

  const proteinDeficit = Math.max(0, dailyProteinGoal - totalProteinLogged);
  const progressPercent = Math.min(100, Math.round((totalProteinLogged / dailyProteinGoal) * 100));

  const logDirectProtein = (proteinGrams: number, label: string, calories: number = 120) => {
    const newEntry = {
      id: 'meal_' + Date.now(),
      name: label,
      protein: proteinGrams,
      calories: calories,
      loggedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    const updated = [newEntry, ...todayMeals];
    setTodayMeals(updated);
    localStorage.setItem('today_meals', JSON.stringify(updated));
    window.dispatchEvent(new Event('wheyo-macros-updated'));
    setToastMessage(`Logged +${proteinGrams}g Protein (${label})!`);
    setTimeout(() => setToastMessage(null), 2500);
  };

  // 🚀 Smart "Macro Gap" Sales Conversion Recommendation
  const recommendedMeal = useMemo(() => {
    if (proteinDeficit <= 0 || products.length === 0) return null;
    const sorted = [...products].sort((a, b) => {
      const diffA = Math.abs(a.protein - proteinDeficit);
      const diffB = Math.abs(b.protein - proteinDeficit);
      return diffA - diffB;
    });
    return sorted[0] || null;
  }, [proteinDeficit, products]);

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

  // Immediate scroll-to-top anchor effect on segment or category filter change
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
    document.body.scrollTop = 0;
    document.documentElement.scrollTop = 0;
  }, [userSegment, activeFilter]);

  const fetchProducts = async () => {
    try {
      const cached = getCachedMenuProducts();
      if (cached && cached.length > 0) {
        setProducts(cached);
        setLoading(false);
      } else {
        setLoading(true);
      }
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
    <div className="relative min-h-screen bg-[#050505] overflow-x-hidden text-white font-sans selection:bg-[#D4FF00] selection:text-black">
      <AnimatePresence mode="wait">
        {showIntro && <IntroSequence onComplete={handleIntroComplete} />}
      </AnimatePresence>

      {showIdentitySelector && (
        <IdentitySelector
          session={session}
          onSelect={(segmentId) => {
            setShowIdentitySelector(false);
          }}
        />
      )}

      {/* Tutorial Overlay */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-12 pb-28 md:pb-16 select-none">
      
      {/* Centered Clean Title Header */}
      <div className="mb-6 sm:mb-8 text-center animate-fade-in flex flex-col items-center">
        <motion.h1
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-4xl sm:text-5xl lg:text-6xl font-display uppercase tracking-widest font-black text-white"
        >
          Wheyo <span className="bg-gradient-to-r from-[#D4FF00] to-[#A3FF00] bg-clip-text text-transparent drop-shadow-[0_4px_24px_rgba(212,255,0,0.3)]">Kitchen</span>
        </motion.h1>
        <p className="text-zinc-400 font-mono text-[11px] sm:text-xs mt-1 tracking-wide">
          Clean high-protein meals cooked fresh for your daily fitness goals.
        </p>

        {/* Action Pills */}
        <div className="mt-3 flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowIntro(true)}
            className="inline-flex items-center px-3 py-1.5 bg-[#0E0E14] hover:bg-[#D4FF00] text-zinc-300 hover:text-black border border-white/10 hover:border-[#D4FF00] rounded-xl font-mono text-[10px] font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer active:scale-95"
          >
            ⚡ Replay Splash
          </button>
          <button
            type="button"
            onClick={() => setTourStep(0)}
            className="inline-flex items-center px-3 py-1.5 bg-[#0E0E14] hover:bg-white text-zinc-300 hover:text-black border border-white/10 hover:border-white rounded-xl font-mono text-[10px] font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer active:scale-95"
          >
            Quick App Tour
          </button>
        </div>
      </div>

      {/* 🎯 Daily Protein Habit Tracker Directly on the Menu */}
      <div className="mb-6 max-w-2xl mx-auto bg-[#0E0E14] border border-white/10 rounded-2xl p-4 shadow-[0_4px_25px_rgba(0,0,0,0.5)]">
        <div className="flex items-center justify-between gap-3 mb-2.5">
          <div className="flex items-center gap-2">
            <span className="text-xs sm:text-sm font-display font-extrabold uppercase text-white tracking-wide">
              Today's Protein Goal
            </span>
            <span className="inline-flex items-center gap-1 bg-orange-500/15 border border-orange-500/30 text-orange-400 px-2 py-0.5 rounded-full font-mono text-[10px] font-black uppercase">
              <Flame className="w-3 h-3 fill-orange-400" /> {streakDays} Day Streak
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-mono text-xs sm:text-sm font-black text-[#D4FF00]">
              {totalProteinLogged}g <span className="text-zinc-500 font-normal">/ {dailyProteinGoal}g P</span>
            </span>
          </div>
        </div>

        {/* Dynamic Glowing Progress Bar */}
        <div className="w-full bg-zinc-900 rounded-full h-2.5 overflow-hidden p-0.5 border border-white/5 mb-3">
          <div
            className="bg-gradient-to-r from-[#A3FF00] to-[#D4FF00] h-full rounded-full transition-all duration-500 shadow-[0_0_12px_rgba(212,255,0,0.4)]"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Action Row */}
        <div className="flex items-center justify-between gap-2 flex-wrap pt-1 border-t border-white/5">
          <span className="text-[11px] font-mono text-zinc-400">
            {proteinDeficit > 0 ? (
              <><strong className="text-white">{proteinDeficit}g remaining</strong> to hit your daily goal!</>
            ) : (
              <span className="text-[#D4FF00] font-bold">🎉 Daily protein target crushed!</span>
            )}
          </span>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => logDirectProtein(25, 'Protein Scoop')}
              className="px-2.5 py-1 bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white border border-white/10 rounded-lg font-mono text-[10px] font-bold uppercase transition-all active:scale-95 cursor-pointer"
              title="Quick Log 25g Scoop"
            >
              + Scoop (25g)
            </button>
            <button
              type="button"
              onClick={() => setShowQuickLogModal(true)}
              className="px-2.5 py-1 bg-[#D4FF00]/15 hover:bg-[#D4FF00]/25 text-[#D4FF00] border border-[#D4FF00]/30 rounded-lg font-mono text-[10px] font-black uppercase transition-all active:scale-95 cursor-pointer"
            >
              + Log Custom
            </button>
          </div>
        </div>
      </div>

      {/* Controls: Clean Search Bar with Filter */}
      <div 
        id="search-controls"
        className={cn(
          "mb-6 sm:mb-8 max-w-xl mx-auto transition-all",
          tutorialStep === 1 && "relative z-[60] ring-4 ring-[#D4FF00] rounded-2xl bg-[#0D0D0D]"
        )}
      >
        <div className="bg-[#0D0D0D]/60 p-2 rounded-2xl border border-white/5 shadow-2xl backdrop-blur-md flex items-center gap-2">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <Search className="text-gray-500 w-4.5 h-4.5" />
            </div>
            <input
              type="text"
              placeholder="Search chicken, eggs, soya, paneer, rolls..."
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
      <div id="identity-selectors" className="max-w-md mx-auto mb-8 flex items-center justify-between px-6 sm:px-4">
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

      {/* 🚀 Smart "Macro Gap" Sales Conversion Banner */}
      {recommendedMeal && proteinDeficit > 15 && (
        <div className="mb-6 max-w-3xl mx-auto bg-gradient-to-r from-[#14141A] via-[#181822] to-[#14141A] border border-[#D4FF00]/30 rounded-2xl p-3.5 sm:p-4 flex items-center justify-between gap-3 shadow-[0_0_20px_rgba(212,255,0,0.12)]">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 border border-white/10 bg-zinc-900 hidden sm:block">
              <img src={recommendedMeal.image} alt={recommendedMeal.name} className="w-full h-full object-cover" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-mono font-bold uppercase text-[#D4FF00] tracking-wider block">
                🎯 Target Gap: Need {proteinDeficit}g Protein
              </span>
              <p className="text-xs sm:text-sm font-display font-extrabold uppercase text-white line-clamp-1">
                Fuel up with {recommendedMeal.name} (+{recommendedMeal.protein}g P)
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={(e) => handleAddDirect(recommendedMeal, e)}
            className="px-3.5 py-2 bg-[#D4FF00] hover:bg-white text-black font-mono text-xs font-black uppercase rounded-xl flex items-center gap-1.5 shrink-0 shadow-[0_0_12px_rgba(212,255,0,0.3)] active:scale-95 transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
            <span>Add ₹{recommendedMeal.price}</span>
          </button>
        </div>
      )}



      {/* Food Items Display Section */}
      {error ? (
        <div className="text-center py-16 bg-red-500/5 border border-red-500/10 rounded-2xl">
          <p className="text-red-400 font-display tracking-wide uppercase text-sm">{error}</p>
        </div>
      ) : (
        <div 
          id="food-items-deck"
          className="grid gap-2.5 sm:gap-4 grid-cols-1 max-w-3xl mx-auto"
        >
          {loading ? (
            Array.from({ length: 4 }).map((_, index) => (
              <MenuCardSkeleton key={`skeleton-${index}`} mode="list" />
            ))
          ) : (
            filteredItems.map((item) => (
              <MenuCard 
                key={item.id}
                item={item} 
                mode="list"
                onOrder={() => setSelectedItem(item)} 
                onAddDirect={(e) => handleAddDirect(item, e)}
                onInfo={(e) => { e.stopPropagation(); setSelectedItem(item); }}
              />
            ))
          )}
        </div>
      )}

      {/* Empty State matches design discipline */}
      {filteredItems.length === 0 && !loading && !error && (
        <div className="text-center py-16 flex flex-col items-center gap-3 bg-[#0D0D10] rounded-2xl border border-white/5 p-6 max-w-md mx-auto">
          <div className="p-3 bg-white/5 rounded-full">
            <BrainCircuit className="w-6 h-6 text-gray-500" />
          </div>
          <p className="text-gray-400 text-xs font-mono uppercase">No meals found matching criteria.</p>
          <button 
            onClick={() => { setActiveFilter('All Meals'); setSearchQuery(''); }}
            className="text-[#D4FF00] font-mono text-xs uppercase font-bold hover:underline"
          >
            Reset Filters
          </button>
        </div>
      )}

      {/* Change Athletic Identity Pill at the end of MenuPage */}
      <div className="mt-12 mb-6 flex flex-col items-center justify-center border-t border-white/5 pt-6">
        <button
          onClick={() => setShowIdentityModal(true)}
          className="px-4 py-2 bg-[#0E0E12] hover:bg-zinc-900 text-zinc-300 hover:text-[#D4FF00] border border-white/10 rounded-xl font-mono text-[11px] font-bold uppercase tracking-wider transition-colors flex items-center gap-2 cursor-pointer shadow-sm active:scale-95"
        >
          <User className="w-3.5 h-3.5 text-[#D4FF00]" />
          <span>Profile: <strong className="text-white">{userSegment === 'student' ? 'Student' : userSegment === 'professional' ? 'Professional' : 'Athlete'}</strong></span>
          <span className="text-[#D4FF00] text-[10px] ml-1 font-black">Change</span>
        </button>
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

      {/* Quick Custom Meal Log Modal */}
      <AnimatePresence>
        {showQuickLogModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowQuickLogModal(false)}
              className="fixed inset-0 bg-black/80 z-[120]"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed left-4 right-4 top-1/2 -translate-y-1/2 md:inset-0 md:m-auto w-auto md:w-full max-w-sm h-fit bg-[#0F0F14] border border-white/10 rounded-3xl p-6 shadow-2xl z-[120] select-none"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display text-lg font-black uppercase text-white tracking-wider">
                  Log What You Ate
                </h3>
                <button
                  onClick={() => setShowQuickLogModal(false)}
                  className="p-1 text-zinc-400 hover:text-white rounded-lg bg-white/5"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-[10px] font-mono uppercase text-zinc-400 font-bold block mb-1">
                    Meal Name (e.g. 4 Boiled Eggs, Protein Shake)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 4 Boiled Eggs, Greek Yogurt"
                    value={quickMealName}
                    onChange={(e) => setQuickMealName(e.target.value)}
                    className="w-full bg-[#16161C] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#D4FF00]/40"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-mono uppercase text-[#D4FF00] font-bold block mb-1">
                      Protein (g)
                    </label>
                    <input
                      type="number"
                      placeholder="e.g. 30"
                      value={quickMealProtein}
                      onChange={(e) => setQuickMealProtein(e.target.value)}
                      className="w-full bg-[#16161C] border border-[#D4FF00]/20 rounded-xl px-3 py-2.5 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#D4FF00]"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-mono uppercase text-zinc-400 font-bold block mb-1">
                      Calories (kcal)
                    </label>
                    <input
                      type="number"
                      placeholder="e.g. 250"
                      value={quickMealCalories}
                      onChange={(e) => setQuickMealCalories(e.target.value)}
                      className="w-full bg-[#16161C] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#D4FF00]/40"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      const p = Number(quickMealProtein);
                      if (!p || p <= 0) return;
                      const name = quickMealName.trim() || 'Custom Meal';
                      const cal = Number(quickMealCalories) || (p * 4 + 100);
                      logDirectProtein(p, name, cal);
                      setQuickMealName('');
                      setQuickMealProtein('');
                      setQuickMealCalories('');
                      setShowQuickLogModal(false);
                    }}
                    disabled={!quickMealProtein || Number(quickMealProtein) <= 0}
                    className="w-full py-3 bg-[#D4FF00] hover:bg-white text-black font-mono text-xs font-black uppercase rounded-xl transition-all shadow-[0_0_15px_rgba(212,255,0,0.3)] disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer active:scale-95"
                  >
                    + Save to Today's Log
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <OrderModal item={selectedItem} onClose={() => setSelectedItem(null)} session={session} />
      <NutritionModal item={infoItem} onClose={() => setInfoItem(null)} />
      </div>
    </div>
  );
}
