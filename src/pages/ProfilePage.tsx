import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate, Link } from 'react-router-dom';
import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';
import { 
  User, 
  LogOut, 
  ShoppingBag, 
  Target, 
  History, 
  ChevronRight,
  ArrowLeft,
  X,
  TrendingUp,
  Loader2,
  Calculator,
  Settings as SettingsIcon,
  Zap,
  Activity,
  Heart,
  Mail,
  Lock,
  Phone,
  CheckCircle,
  ShoppingCart,
  ChevronDown,
  Database,
  Droplet,
  Flame,
  Copy,
  Plus,
  CreditCard,
  ClipboardList,
  Trophy,
  Award,
  Download,
  Share2,
  Image,
  Dumbbell,
  BrainCircuit,
  Crown,
  Trash2,
  PlusCircle,
  Sparkles,
  Clock,
  Moon,
  Footprints,
  Scale,
  Ruler
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { cn } from '../components/Layout';
import { ResponsiveBentoWrapper, useBreakpointObserver } from '../components/ResponsiveBentoWrapper';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';
import { useCart } from '../context/CartContext';
import type { Session } from '@supabase/supabase-js';

const CircularProgress = ({ progress, color, label, value, target }: { progress: number, color: string, label: string, value: string, target: string }) => {
  const radius = 35;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-20 h-20 sm:w-24 sm:h-24 flex items-center justify-center">
        <svg className="w-full h-full transform -rotate-90">
          <circle
            cx="50%"
            cy="50%"
            r={radius}
            stroke="currentColor"
            strokeWidth="6"
            fill="transparent"
            className="text-white/5"
          />
          <motion.circle
            cx="50%"
            cy="50%"
            r={radius}
            stroke={color}
            strokeWidth="6"
            fill="transparent"
            strokeLinecap="round"
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.5, ease: "easeOut", delay: 0.2 }}
            style={{ strokeDasharray: circumference }}
          />
        </svg>
        <div className="absolute flex flex-col items-center justify-center text-center">
          <span className="text-white font-display font-bold text-xs sm:text-sm tracking-tight">{value}</span>
        </div>
      </div>
      <div className="mt-2 text-center">
        <span className="text-[9px] font-mono font-bold uppercase tracking-widest block text-white/80">{label}</span>
        <span className="text-[8px] font-mono text-gray-500 uppercase tracking-wider block mt-0.5">Target: {target}</span>
      </div>
    </div>
  );
};

interface OrderHistory {
  id: number;
  created_at: string;
  final_price: number;
  status: string;
  items: any[];
  protein_total?: number;
}

interface MacroData {
  date: string;
  protein_consumed: number;
  calories_consumed: number;
}

export interface WheyoOffer {
  id: string | number;
  title: string;
  description: string;
  trigger_rule: string;
  category: string;
  is_revealed: boolean;
  is_active: boolean;
  created_at?: string;
}

export default function ProfilePage({ session }: { session: Session | null }) {
  const user = session?.user ?? null;
  const navigate = useNavigate();
  const { addItem, setIsCartOpen } = useCart();
  const isMobile = useBreakpointObserver(768);

  const renderDetailContentRef = useRef<((id: string | null) => React.ReactNode) | null>(null);
  const renderDetailContent = (id: string | null): React.ReactNode => {
    return renderDetailContentRef.current ? renderDetailContentRef.current(id) : null;
  };

  // State Management
  const [profile, setProfile] = useState<any>(null);
  const [orders, setOrders] = useState<OrderHistory[]>([]);
  const [dailyProtein, setDailyProtein] = useState(0);
  const [dailyCalories, setDailyCalories] = useState(0);
  const [historyData, setHistoryData] = useState<MacroData[]>([]);
  const [biomarkerHistory, setBiomarkerHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState<any[]>([]);
  const [allProducts, setAllProducts] = useState<any[]>([]);
  
  // Custom Hydration & Biomarkers Intake Tracking state (strictly database synchronization)
  const [hydrationLevel, setHydrationLevel] = useState<number>(0);
  const [sleepLevel, setSleepLevel] = useState<number>(0);
  const [weightLevel, setWeightLevel] = useState<number>(0);
  const [localWeight, setLocalWeight] = useState('');
  const [bodyFat, setBodyFat] = useState<number>(() => {
    return Number(localStorage.getItem('athlete_body_fat') || '14');
  });
  const [localSleep, setLocalSleep] = useState('');
  const [workoutLoggedToday, setWorkoutLoggedToday] = useState<boolean>(false);
  const [activeStreak, setActiveStreak] = useState<number>(0);
  const [dbFetchTrigger, setDbFetchTrigger] = useState<number>(0);

  // Raw database tables caching for Universal Graphical Dashboard
  const [allDbMacros, setAllDbMacros] = useState<any[]>([]);
  const [allDbBiomarkers, setAllDbBiomarkers] = useState<any[]>([]);

  // Refs and state for social-media sharing of gamified status card (Instagram, WhatsApp)
  const cardRef = useRef<HTMLDivElement>(null);
  const [sharingStatus, setSharingStatus] = useState<string>('');
  const [selectedTeam, setSelectedTeam] = useState<string>('TEAM BULK');

  // Milestones Achievement unlocking system
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [unlockMilestone, setUnlockMilestone] = useState<7 | 30>(7);

  // Passport instant-edit states
  const [isEditingPassport, setIsEditingPassport] = useState(false);
  const [passportGoal, setPassportGoal] = useState('Muscle Gain');
  const [passportProtein, setPassportProtein] = useState(150);
  const [passportCalories, setPassportCalories] = useState(2200);

  const [targetWaterGoal, setTargetWaterGoal] = useState<number>(() => Number(localStorage.getItem('target_water_goal') || 4000));
  const [cnsStress, setCnsStress] = useState<string>(() => localStorage.getItem('cns_stress_level') || 'Normal');
  const [sorenessLevel, setSorenessLevel] = useState<string>(() => localStorage.getItem('soreness_level') || 'Fresh (Fully Ready)');
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [physicalLogSubTab, setPhysicalLogSubTab] = useState<'nutrition' | 'fitness' | 'recovery'>('nutrition');
  const [activeLogCircle, setActiveLogCircle] = useState<string | null>(null);
  const [isIdRevealed, setIsIdRevealed] = useState(false);
  const [mealSubTab, setMealSubTab] = useState<'log' | 'restock'>('log');
  const [supplementSubTab, setSupplementSubTab] = useState<'log' | 'restock'>('log');
  const [bodyStatsSubTab, setBodyStatsSubTab] = useState<'core' | 'tape' | 'snapshots'>('core');
  const [recoverySubTab, setRecoverySubTab] = useState<'sleep' | 'steps' | 'heart' | 'energy'>('sleep');
  const [showOffersDialog, setShowOffersDialog] = useState(false);
  const [offersContent, setOffersContent] = useState<string>('');
  const [dbOffers, setDbOffers] = useState<WheyoOffer[]>([]);
  const [selectedOfferCategory, setSelectedOfferCategory] = useState<string>('ALL');
  const [isOffersLoading, setIsOffersLoading] = useState<boolean>(false);

  // Food logging / Meal diary states
  const [todayMeals, setTodayMeals] = useState<{ id: string; name: string; protein: number; calories: number; loggedAt: string }[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('today_meals') || '[]');
    } catch {
      return [];
    }
  });
  const [customFoodName, setCustomFoodName] = useState('');
  const [customFoodProtein, setCustomFoodProtein] = useState('');
  const [customFoodCalories, setCustomFoodCalories] = useState('');

  // Extended Physical Activity Logging features
  const [dailySteps, setDailySteps] = useState<number>(() => {
    const today = new Date().toISOString().split('T')[0];
    return Number(localStorage.getItem(`steps_${today}`) || '6230');
  });
  const [activeMinutes, setActiveMinutes] = useState<number>(() => {
    const today = new Date().toISOString().split('T')[0];
    return Number(localStorage.getItem(`active_mins_${today}`) || '35');
  });
  const [heartRate, setHeartRate] = useState<number>(() => {
    const today = new Date().toISOString().split('T')[0];
    return Number(localStorage.getItem(`heart_rate_${today}`) || '68');
  });
  const [hrv, setHrv] = useState<number>(() => {
    const today = new Date().toISOString().split('T')[0];
    return Number(localStorage.getItem(`hrv_${today}`) || '72');
  });

  // Meal Catalog browser states
  const [catalogSearch, setCatalogSearch] = useState('');
  const [catalogVegFilter, setCatalogVegFilter] = useState('all');
  const [catalogToastMessage, setCatalogToastMessage] = useState<string | null>(null);

  const toggleFavoriteProduct = (productId: string) => {
    const favsStr = localStorage.getItem('wheyo_favorites') || '[]';
    let favs = [];
    try {
      favs = JSON.parse(favsStr);
      if (!Array.isArray(favs)) favs = [];
    } catch {
      favs = [];
    }

    if (favs.includes(productId)) {
      favs = favs.filter((id: string) => id !== productId);
    } else {
      favs.push(productId);
    }
    localStorage.setItem('wheyo_favorites', JSON.stringify(favs));
    window.dispatchEvent(new Event('wheyo-favorites-changed'));
  };

  // Supplements Stack Tracking State
  const [supplementsChecked, setSupplementsChecked] = useState<Record<string, boolean>>(() => {
    try {
      const today = new Date().toISOString().split('T')[0];
      return JSON.parse(localStorage.getItem(`supplements_checked_${today}`) || '{}');
    } catch {
      return {};
    }
  });

  const toggleSupplement = (id: string) => {
    const today = new Date().toISOString().split('T')[0];
    const updated = { ...supplementsChecked, [id]: !supplementsChecked[id] };
    setSupplementsChecked(updated);
    localStorage.setItem(`supplements_checked_${today}`, JSON.stringify(updated));
  };

  // Cardio Tracker State
  const [cardioLogs, setCardioLogs] = useState<{ id: string; type: string; duration: number; distance?: number; loggedAt: string }[]>(() => {
    try {
      const today = new Date().toISOString().split('T')[0];
      return JSON.parse(localStorage.getItem(`cardio_logs_${today}`) || '[]');
    } catch {
      return [];
    }
  });
  const [newCardioType, setNewCardioType] = useState('Running');
  const [newCardioDuration, setNewCardioDuration] = useState('');
  const [newCardioDistance, setNewCardioDistance] = useState('');

  const handleAddCardio = (type: string, durationStr: string, distanceStr: string) => {
    const today = new Date().toISOString().split('T')[0];
    const duration = Number(durationStr);
    if (!duration || duration <= 0) return;
    const distance = distanceStr ? Number(distanceStr) : undefined;
    
    const newLog = {
      id: Math.random().toString(36).substring(2, 9),
      type,
      duration,
      distance,
      loggedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    const updated = [...cardioLogs, newLog];
    setCardioLogs(updated);
    localStorage.setItem(`cardio_logs_${today}`, JSON.stringify(updated));
  };

  const handleDeleteCardio = (id: string) => {
    const today = new Date().toISOString().split('T')[0];
    const updated = cardioLogs.filter(log => log.id !== id);
    setCardioLogs(updated);
    localStorage.setItem(`cardio_logs_${today}`, JSON.stringify(updated));
  };

  // Body Measures State
  const [bodyMeasures, setBodyMeasures] = useState<Record<string, string>>(() => {
    try {
      return JSON.parse(localStorage.getItem('body_measures_metrics') || '{}');
    } catch {
      return {};
    }
  });

  const saveBodyMeasure = (part: string, value: string) => {
    const updated = { ...bodyMeasures, [part.toLowerCase()]: value };
    setBodyMeasures(updated);
    localStorage.setItem('body_measures_metrics', JSON.stringify(updated));
  };

  // Exercise set log / Strength record states
  const [exerciseLogs, setExerciseLogs] = useState<{ id: string; name: string; weight: number; reps: number; oneRepMax: number; date: string }[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('exercise_logs') || '[]');
    } catch {
      return [
        { id: 'ex-1', name: 'Bench Press', weight: 100, reps: 5, oneRepMax: 115, date: 'Jun 20' },
        { id: 'ex-2', name: 'Deadlift', weight: 160, reps: 4, oneRepMax: 180, date: 'Jun 19' },
        { id: 'ex-3', name: 'Squat', weight: 120, reps: 5, oneRepMax: 140, date: 'Jun 18' }
      ];
    }
  });
  const [customExName, setCustomExName] = useState('Bench Press');
  const [customExWeight, setCustomExWeight] = useState('');
  const [customExReps, setCustomExReps] = useState('');

  const strengthRecords = useMemo(() => {
    return exerciseLogs.map(log => ({
      exercise_name: log.name,
      date: log.date,
      weight_lbs: log.weight,
      reps_count_completed: log.reps
    }));
  }, [exerciseLogs]);

  const filteredCatalogProducts = useMemo(() => {
    return allProducts.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(catalogSearch.toLowerCase()) || 
                            (p.tags && p.tags.some((t: string) => t.toLowerCase().includes(catalogSearch.toLowerCase())));
      const matchesVeg = catalogVegFilter === 'all' || 
                         (catalogVegFilter === 'veg' && p.isVeg) || 
                         (catalogVegFilter === 'nonveg' && !p.isVeg);
      return matchesSearch && matchesVeg;
    });
  }, [allProducts, catalogSearch, catalogVegFilter]);

  const handleAddStrengthRecord = (exerciseName: string, weight: number, reps: number) => {
    handleAddExerciseLog(exerciseName, weight, reps);
  };

  const [copiedSql, setCopiedSql] = useState(false);

  // Subscription plans, add-ons, and user active subscription loaded dynamically from Database
  const [dbSubscriptionPlans, setDbSubscriptionPlans] = useState<any[]>([]);
  const [dbSubscriptionAddons, setDbSubscriptionAddons] = useState<any[]>([]);
  const [dbUserSubscription, setDbUserSubscription] = useState<any>(null);
  const [hasDbUserSub, setHasDbUserSub] = useState(false);
  const [loadingSubscriptions, setLoadingSubscriptions] = useState(false);
  const [subscriptionStatusMsg, setSubscriptionStatusMsg] = useState<string | null>(null);

  // Helper action to seed standard plans directly into Supabase user tables
  const seedSubscriptionDatabase = async () => {
    if (!supabase) return;
    setLoadingSubscriptions(true);
    setSubscriptionStatusMsg("Seeding database tables...");
    try {
      // Create seed plans
      const defaultPlans = [
        {
          name: "Student Basic Fuel",
          price: 75.00,
          billing_cycle: "weekly",
          description: "7x high-protein performance bowls with shake pack. Ideal for core macro-engine baseline.",
          is_popular: false
        },
        {
          name: "Elite Hyper-Drive Pack",
          price: 220.00,
          billing_cycle: "weekly",
          description: "21x Premium salmon & beef bowls, 14x Shake packs, full daily multivitamins package.",
          is_popular: true
        }
      ];

      const { error: errPlans } = await supabase.from('subscription_plans').insert(defaultPlans);
      if (errPlans) throw errPlans;

      const defaultAddons = [
        { name: 'Whey Protein Isolate Daily Mix', price: 38.25, reg_price: 45.00 },
        { name: 'Elite Pre-Workout Booster Tub', price: 29.75, reg_price: 35.00 },
        { name: '7-Day Rice & Complex Carb Preps', price: 17.00, reg_price: 20.00 }
      ];

      const { error: errAddons } = await supabase.from('subscription_addons').insert(defaultAddons);
      if (errAddons) throw errAddons;

      setSubscriptionStatusMsg("Subscriptions tables successfully seeded in Supabase!");
      setDbFetchTrigger(prev => prev + 1);
    } catch (err: any) {
      console.error(err);
      setSubscriptionStatusMsg("Error seeding database: " + (err.message || err));
    } finally {
      setLoadingSubscriptions(false);
      setTimeout(() => setSubscriptionStatusMsg(null), 5000);
    }
  };

  // Subscribe dynamic action
  const handleSubscribe = async (plan: any) => {
    if (!supabase || !user) {
      setSubscriptionStatusMsg("Plases log in to subscribe to plans.");
      setTimeout(() => setSubscriptionStatusMsg(null), 4000);
      return;
    }
    setLoadingSubscriptions(true);
    setSubscriptionStatusMsg(`Initiating subscription to ${plan.name}...`);
    try {
      const deliveryDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString(undefined, {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      const items = plan.name.includes("Elite") ? [
        "21x Premium Salmon & Beef Bowls",
        "14x Active Post-Workout Whey Shakes",
        "1x Multivitamin Baseline Pack"
      ] : [
        "7x High-Protein Performance Bowls",
        "7x Lean Whey Shakes"
      ];

      const { error } = await supabase.from('user_subscriptions').upsert({
        user_id: user.id,
        plan_id: plan.uuid || plan.id,
        plan_name: plan.name,
        price: plan.price,
        billing_cycle: plan.billing_cycle || 'weekly',
        pickup_locker: `GIT Main Gate (Handover)`,
        next_delivery: `${deliveryDate} (Delivery Handover)`,
        status: 'active',
        items: items
      }, { onConflict: 'user_id' });

      if (error) {
        // Fallback to secondary if table different
        const { error: errAlt } = await supabase.from('subscriptions').upsert({
          user_id: user.id,
          plan_name: plan.name,
          price: plan.price,
          status: 'active',
          next_delivery: `Next Friday`
        }, { onConflict: 'user_id' });
        if (errAlt) throw errAlt;
      }

      setSubscriptionStatusMsg(`Subscribed to ${plan.name}!`);
      setDbFetchTrigger(prev => prev + 1);
    } catch (err: any) {
      console.error(err);
      setSubscriptionStatusMsg("Subscription failed: " + (err.message || err));
    } finally {
      setLoadingSubscriptions(false);
      setTimeout(() => setSubscriptionStatusMsg(null), 5000);
    }
  };

  // Pause subscription action
  const handlePauseSubscription = async () => {
    if (!supabase || !user) return;
    setLoadingSubscriptions(true);
    setSubscriptionStatusMsg("Suspending active cycle...");
    try {
      const activeStatus = dbUserSubscription?.status === 'paused' ? 'active' : 'paused';
      let updateError = null;

      const { error } = await supabase
        .from('user_subscriptions')
        .update({ status: activeStatus })
        .eq('user_id', user.id);

      if (error) {
        const { error: altError } = await supabase
          .from('subscriptions')
          .update({ status: activeStatus })
          .eq('user_id', user.id);
        updateError = altError;
      }

      if (updateError) throw updateError;
      setSubscriptionStatusMsg(activeStatus === 'paused' ? "Subscription paused." : "Subscription reactivated!");
      setDbFetchTrigger(prev => prev + 1);
    } catch (err: any) {
      console.error(err);
      setSubscriptionStatusMsg("Could not change status: " + (err.message || err));
    } finally {
      setLoadingSubscriptions(false);
      setTimeout(() => setSubscriptionStatusMsg(null), 5000);
    }
  };

  // Profile Accordion State
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    overview: true,
    performance: false,
    recovery: false,
    biometrics: false,
    history: false,
    subscriptions: false,
    settings: false,
  });

  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      const isOpening = !prev[section];
      // Close all others, toggle the clicked one
      const newState = Object.keys(prev).reduce((acc, key) => {
        acc[key] = false;
        return acc;
      }, {} as Record<string, boolean>);
      newState[section] = isOpening;
      return newState;
    });
  };

  // Settings & Form State
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [settingsForm, setSettingsForm] = useState({
    full_name: '',
    daily_protein_goal: 150,
    daily_calorie_goal: 2200,
    phone: '',
    fitness_goal: 'Muscle Gain'
  });

  // Biological Calc Inputs
  const [weightInput, setWeightInput] = useState('76');
  const [heightInput, setHeightInput] = useState('178');

  // Universal chart controls
  const [universalRange, setUniversalRange] = useState<7 | 14 | 30>(7);
  const [universalView, setUniversalView] = useState<'all' | 'protein' | 'water' | 'sleep' | 'weight'>('all');

  // Unified calculations and data matching (100% database driven)
  const unifiedTrendData = useMemo(() => {
    const result: any[] = [];
    const todayDate = new Date();
    
    const macroMap = new Map<string, any>();
    allDbMacros.forEach(m => {
      macroMap.set(m.date, m);
    });
    
    const bioMap = new Map<string, any>();
    allDbBiomarkers.forEach(b => {
      bioMap.set(b.date, b);
    });

    for (let i = universalRange - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(todayDate.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      
      const month = d.getMonth() + 1;
      const day = d.getDate();
      const formattedLabel = `${day}/${month}`;

      const dbMac = macroMap.get(dateStr);
      const protein = dbMac ? Number(dbMac.protein_consumed || 0) : 0;
      const calories = dbMac ? Number(dbMac.calories_consumed || 0) : 0;

      const b = bioMap.get(dateStr);
      const water = b ? Number(b.water_ml || 0) : 0;
      const sleep = b ? Number(b.sleep_hours || 0) : 0;
      const weight = b ? Number(b.body_weight || 0) : 0;
      const workout = b ? (b.workout_logged ? 1 : 0) : 0;

      result.push({
        label: formattedLabel,
        date: dateStr,
        protein: protein,
        calories: calories,
        water: water,
        sleep: sleep,
        weight: weight,
        workout: workout
      });
    }
    return result;
  }, [allDbMacros, allDbBiomarkers, universalRange]);

  const universalStats = useMemo(() => {
    if (unifiedTrendData.length === 0) {
      return { avgProtein: 0, avgWater: 0, avgSleep: 0, avgWeight: 0, consistencyRate: 0, totalWorkouts: 0 };
    }
    let totalProtein = 0;
    let proteinDays = 0;
    let totalWater = 0;
    let waterDays = 0;
    let totalSleep = 0;
    let sleepDays = 0;
    let totalWeight = 0;
    let weightDays = 0;
    let activeDays = 0;
    let totalWorkouts = 0;

    unifiedTrendData.forEach(d => {
      let hasTrackedAny = false;
      if (d.protein > 0) {
        totalProtein += d.protein;
        proteinDays++;
        hasTrackedAny = true;
      }
      if (d.water > 0) {
        totalWater += d.water;
        waterDays++;
        hasTrackedAny = true;
      }
      if (d.sleep > 0) {
        totalSleep += d.sleep;
        sleepDays++;
        hasTrackedAny = true;
      }
      if (d.weight > 0) {
        totalWeight += d.weight;
        weightDays++;
        hasTrackedAny = true;
      }
      if (d.workout > 0) {
        totalWorkouts++;
        hasTrackedAny = true;
      }
      if (hasTrackedAny) {
        activeDays++;
      }
    });

    return {
      avgProtein: proteinDays > 0 ? Math.round(totalProtein / proteinDays) : 0,
      avgWater: waterDays > 0 ? Math.round(totalWater / waterDays) : 0,
      avgSleep: sleepDays > 0 ? Number((totalSleep / sleepDays).toFixed(1)) : 0,
      avgWeight: weightDays > 0 ? Number((totalWeight / weightDays).toFixed(1)) : 0,
      consistencyRate: Math.round((activeDays / unifiedTrendData.length) * 100),
      totalWorkouts
    };
  }, [unifiedTrendData]);
  const [ageInput, setAgeInput] = useState('24');
  const [genderInput, setGenderInput] = useState('male');
  const [activityInput, setActivityInput] = useState('1.55');
  const [calculatedTdee, setCalculatedTdee] = useState<number | null>(null);

  // Auth panel variables
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authName, setAuthName] = useState('');
  const [authPhone, setAuthPhone] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    async function loadLockerData() {
      if (!user) {
        setLoading(false);
        return;
      }

      const today = new Date().toISOString().split('T')[0];
      
      // 1. Fetch user profile from PostgreSQL profiles table
      let dbProfile = null;
      if (supabase) {
        try {
          const { data: prof, error: profError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .maybeSingle();

          if (!profError && prof) {
            dbProfile = prof;
          } else if (profError) {
            console.warn("Retrying profile reload or checking table:", profError);
          }
        } catch (err) {
          console.error("Error reading profiles table:", err);
        }
      }

      const localName = dbProfile?.full_name || user.user_metadata?.full_name || localStorage.getItem(`customer_name_${user.id}`) || localStorage.getItem('customer_name') || 'Beast Mode';
      const localPhone = dbProfile?.phone || user.user_metadata?.phone || localStorage.getItem(`customer_phone_${user.id}`) || localStorage.getItem('customer_phone') || '+91 99999 99999';
      const localPGoal = dbProfile?.daily_protein_goal || Number(localStorage.getItem(`daily_protein_goal_${user.id}`)) || Number(localStorage.getItem('daily_protein_goal')) || 150;
      const localCGoal = dbProfile?.daily_calorie_goal || Number(localStorage.getItem(`daily_calorie_goal_${user.id}`)) || Number(localStorage.getItem('daily_calorie_goal')) || 2200;
      const localGoalTag = dbProfile?.fitness_goal || localStorage.getItem(`fitness_goal_selection_${user.id}`) || localStorage.getItem('fitness_goal_selection') || 'Muscle Gain';
      
      const hydratedProfile = {
        id: user.id,
        full_name: localName,
        phone: localPhone,
        daily_protein_goal: localPGoal,
        daily_calorie_goal: localCGoal,
        fitness_goal: localGoalTag
      };

      setProfile(hydratedProfile);
      setSettingsForm(hydratedProfile);
      setPassportGoal(localGoalTag);
      setPassportProtein(localPGoal);
      setPassportCalories(localCGoal);

      // If no db profile exists yet and supabase is working, let's create one automatically and silently
      if (!dbProfile && supabase) {
        try {
          await supabase.from('profiles').upsert({
            id: user.id,
            full_name: localName,
            phone: localPhone,
            daily_protein_goal: localPGoal,
            daily_calorie_goal: localCGoal,
            fitness_goal: localGoalTag,
            updated_at: new Date().toISOString()
          }, { onConflict: 'id' });
        } catch (regErr) {
          console.warn("Could not auto-register profile in db, continuing locally:", regErr);
        }
      }

      // 2. Fetch order history
      let loadedOrders: OrderHistory[] = [];
      try {
        if (supabase) {
          const { data: ords, error: ordsError } = await supabase
            .from('orders')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });
          if (!ordsError && ords) {
            loadedOrders = ords;
          }
        }
      } catch (e) {
        console.error('Database fetching exception, reverting to local standard', e);
      }

      if (loadedOrders.length === 0) {
        const localOrdersStr = localStorage.getItem('local_orders') || '[]';
        const parsed = JSON.parse(localOrdersStr);
        if (parsed.length > 0) {
          loadedOrders = parsed;
        } else {
          // Standard starting local orders
          loadedOrders = [];
        }
      }
      setOrders(loadedOrders);

      // 3. Fetch real daily macros from database
      let dbMacros: any[] = [];
      if (supabase) {
        try {
          const { data, error } = await supabase
            .from('daily_macros')
            .select('*')
            .eq('user_id', user.id)
            .order('date', { ascending: false });
          if (!error && data) {
            dbMacros = data;
          }
        } catch (err) {
          console.warn("Could not read daily_macros:", err);
        }
      }

      // 4. Fetch real manual biomarkers from database
      let dbBiomarkers: any[] = [];
      let todayBiomarker = null;
      if (supabase) {
        try {
          const { data, error } = await supabase
            .from('biomarkers')
            .select('*')
            .eq('user_id', user.id)
            .order('date', { ascending: false });
          if (!error && data) {
            dbBiomarkers = data;
            todayBiomarker = data.find(b => b.date === today);
          }
        } catch (err) {
          console.warn("Could not read biomarkers:", err);
        }
      }

      // Sync active states with today's biomarker values or fallbacks
      const currentHydration = todayBiomarker?.water_ml || Number(localStorage.getItem(`hydration_${today}`)) || 0;
      const currentSleep = Number(todayBiomarker?.sleep_hours || localStorage.getItem(`sleep_${today}`) || 0);
      const currentWeight = Number(todayBiomarker?.body_weight || localStorage.getItem(`weight_${today}`) || 0);
      const currentWorkout = todayBiomarker ? !!todayBiomarker.workout_logged : (localStorage.getItem(`workout_${today}`) === 'true');

      setHydrationLevel(currentHydration);
      setSleepLevel(currentSleep);
      setWeightLevel(currentWeight);
      setWorkoutLoggedToday(currentWorkout);

      setLocalSleep(currentSleep > 0 ? String(currentSleep) : '');
      setLocalWeight(currentWeight > 0 ? String(currentWeight) : '');

      // AUTO UPDATER to Database: If they log in, automatically save biomarker data to Supabase if DB lacks records
      if (!todayBiomarker && supabase && (currentHydration > 0 || currentSleep > 0 || currentWeight > 0 || currentWorkout)) {
        try {
          await supabase.from('biomarkers').upsert({
            user_id: user.id,
            date: today,
            water_ml: currentHydration,
            sleep_hours: currentSleep,
            body_weight: currentWeight,
            workout_logged: currentWorkout
          }, { onConflict: 'user_id,date' });
        } catch (err) {
          console.warn("Could not auto-sync local biomarkers to DB:", err);
        }
      }

      // Sync local macros map & construct daily sums
      const localMacrosStr = localStorage.getItem('local_macros') || '{}';
      const localMacrosMap = JSON.parse(localMacrosStr);
      
      const todayDbMacrosRow = dbMacros.find(m => m.date === today);
      let todayProteinSum = Number(todayDbMacrosRow?.protein_consumed || 0);
      let todayCalorieSum = Number(todayDbMacrosRow?.calories_consumed || 0);

      const localTodayProtein = Number(localMacrosMap[today] || 0);
      if (localTodayProtein > todayProteinSum) {
        todayProteinSum = localTodayProtein;
      }
      const localTodayCalories = Number(localStorage.getItem(`local_calories_${today}`) || 0);
      if (localTodayCalories > todayCalorieSum) {
        todayCalorieSum = localTodayCalories;
      }

      setDailyProtein(todayProteinSum);
      setDailyCalories(todayCalorieSum || Math.round(todayProteinSum * 8.5));

      // AUTO UPDATER to Database: If they log in, automatically save macros back to PostgreSQL
      if (supabase && (todayProteinSum > Number(todayDbMacrosRow?.protein_consumed || 0))) {
        try {
          await supabase.from('daily_macros').upsert({
            user_id: user.id,
            date: today,
            protein_consumed: todayProteinSum,
            calories_consumed: todayCalorieSum || Math.round(todayProteinSum * 8.5)
          }, { onConflict: 'user_id,date' });
        } catch (err) {
          console.warn("Could not auto-sync local macros to DB:", err);
        }
      }

      // 4.6 Fetch Subscriptions & Plans from PostgreSQL Database (Resilient & Dynamic fallback)
      if (supabase) {
        setLoadingSubscriptions(true);
        try {
          // A. Available Plans Loader (Resilient check for either 'subscription_plans' or 'plans')
          let loadedPlans = null;
          const { data: qPlans, error: errPlans } = await supabase.from('subscription_plans').select('*');
          if (!errPlans && qPlans && qPlans.length > 0) {
            loadedPlans = qPlans;
          } else {
            const { data: qPlansAlt, error: errPlansAlt } = await supabase.from('plans').select('*');
            if (!errPlansAlt && qPlansAlt && qPlansAlt.length > 0) {
              loadedPlans = qPlansAlt;
            }
          }
          if (loadedPlans) {
            const mappedPlans = loadedPlans.map((p: any) => ({
              id: p.id?.toString() || p.code || '1',
              name: p.name || p.title || 'Plan',
              price: Number(p.price || 0),
              billing_cycle: p.billing_cycle || p.period || 'weekly',
              description: p.description || p.details || 'Macro fueling plan',
              is_popular: !!p.is_popular || !!p.popular
            }));
            setDbSubscriptionPlans(mappedPlans);
          }

          // B. Addons Loader (Resilient check for either 'subscription_addons' or 'addons')
          let loadedAddons = null;
          const { data: qAddons, error: errAddons } = await supabase.from('subscription_addons').select('*');
          if (!errAddons && qAddons && qAddons.length > 0) {
            loadedAddons = qAddons;
          } else {
            const { data: qAddonsAlt, error: errAddonsAlt } = await supabase.from('addons').select('*');
            if (!errAddonsAlt && qAddonsAlt && qAddonsAlt.length > 0) {
              loadedAddons = qAddonsAlt;
            }
          }
          if (loadedAddons) {
            const mappedAddons = loadedAddons.map((a: any) => ({
              id: a.id?.toString() || '1',
              name: a.name || 'Booster',
              price: Number(a.price || 0),
              reg_price: Number(a.reg_price || a.regular_price || a.price || 0)
            }));
            setDbSubscriptionAddons(mappedAddons);
          }

          // C. Active User Subscription Loader
          let loadedUserSub = null;
          const { data: qUserSub, error: errUserSub } = await supabase
            .from('user_subscriptions')
            .select('*, subscription_plans(*)')
            .eq('user_id', user.id)
            .maybeSingle();
            
          if (!errUserSub && qUserSub) {
            loadedUserSub = qUserSub;
          } else {
            const { data: qUserSubAlt, error: errUserSubAlt } = await supabase
              .from('subscriptions')
              .select('*')
              .eq('user_id', user.id)
              .maybeSingle();
              
            if (!errUserSubAlt && qUserSubAlt) {
              loadedUserSub = qUserSubAlt;
            }
          }
          if (loadedUserSub) {
            const planDetails = loadedUserSub.subscription_plans || {};
            let itemsVal = [];
            if (Array.isArray(loadedUserSub.items)) {
              itemsVal = loadedUserSub.items;
            } else if (typeof loadedUserSub.items === 'string') {
              try { itemsVal = JSON.parse(loadedUserSub.items); } catch { itemsVal = []; }
            }
              
            setDbUserSubscription({
              plan_name: loadedUserSub.plan_name || planDetails.name || loadedUserSub.name || "ACTIVE AUTO-FUEL PLAN",
              price: Number(loadedUserSub.price || planDetails.price || 0),
              billing_cycle: loadedUserSub.billing_cycle || planDetails.billing_cycle || "weekly",
              next_delivery: loadedUserSub.next_delivery || "Friday, June 26, 2026",
              pickup_locker: loadedUserSub.pickup_locker || loadedUserSub.pickup_point || "GIT Main Gate (Handover)",
              status: loadedUserSub.status || "active",
              items: itemsVal.length > 0 ? itemsVal : [
                "14x Classic Chicken Prep",
                "7x Post-Workout Whey Shakes",
                "1x Bulk Creatine (30srv, Monthly)"
              ]
            });
            setHasDbUserSub(true);
          } else {
            setDbUserSubscription(null);
            setHasDbUserSub(false);
          }
        } catch (subErr) {
          console.warn("Resilient loader caught subscription tables read failure:", subErr);
        } finally {
          setLoadingSubscriptions(false);
        }
      }

      // 5. Calculate Real Non-Prefilled Streak from Database Logs & Local Map
      const activeDates = new Set<string>();
      
      // Load dates with protein intake from database
      dbMacros.forEach(m => {
        if (Number(m.protein_consumed || 0) > 0) {
          activeDates.add(m.date);
        }
      });

      // Load dates with biomarker activity (logged water, workouts, weight or sleep)
      dbBiomarkers.forEach(b => {
        if (Number(b.water_ml || 0) > 0 || Number(b.sleep_hours || 0) > 0 || Number(b.body_weight || 0) > 0 || b.workout_logged) {
          activeDates.add(b.date);
        }
      });

      // Load dates from local macros list
      Object.keys(localMacrosMap).forEach(d => {
        if (Number(localMacrosMap[d] || 0) > 0) {
          activeDates.add(d);
        }
      });

      // Calculate streak ending today or yesterday
      let calculatedStreak = 0;
      let checkDate = new Date();
      let checkDateStr = checkDate.toISOString().split('T')[0];

      if (!activeDates.has(checkDateStr)) {
        checkDate.setDate(checkDate.getDate() - 1);
        checkDateStr = checkDate.toISOString().split('T')[0];
      }

      while (activeDates.has(checkDateStr)) {
        calculatedStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
        checkDateStr = checkDate.toISOString().split('T')[0];
      }

      setActiveStreak(calculatedStreak);

      // 6. Build true 7-day trend line
      const listMacros: MacroData[] = [];
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const macroMap = new Map<string, number>();
      dbMacros.forEach(m => {
        macroMap.set(m.date, Number(m.protein_consumed || 0));
      });

      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        const dayLabel = dayNames[d.getDay()];

        let proteinLogged = 0;
        if (i === 0) {
          proteinLogged = todayProteinSum;
        } else {
          proteinLogged = Number(macroMap.get(dateStr) || localMacrosMap[dateStr] || 0);
        }

        listMacros.push({
          date: dayLabel,
          protein_consumed: proteinLogged,
          calories_consumed: Math.round(proteinLogged * 8.5)
        });
      }
      setHistoryData(listMacros);

      // Build 7-day biomarker trend data
      const listBiomarkers: any[] = [];
      const bioMap = new Map<string, any>();
      dbBiomarkers.forEach(b => {
        bioMap.set(b.date, b);
      });

      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        const dayLabel = dayNames[d.getDay()];

        let sleepValue = 0;
        let weightValue = 0;

        if (i === 0) {
          sleepValue = currentSleep;
          weightValue = currentWeight;
        } else {
          const pastB = bioMap.get(dateStr);
          sleepValue = Number(pastB?.sleep_hours || localStorage.getItem(`sleep_${dateStr}`) || 0);
          weightValue = Number(pastB?.body_weight || localStorage.getItem(`weight_${dateStr}`) || 0);
        }

        // Apply a nice default fallback weight for visualization if 0
        if (weightValue === 0) {
          weightValue = currentWeight || 75; 
        }
        if (sleepValue === 0) {
          sleepValue = currentSleep || 7;
        }

        listBiomarkers.push({
          date: dayLabel,
          sleep: sleepValue,
          weight: weightValue
        });
      }
      setBiomarkerHistory(listBiomarkers);
      setAllDbMacros(dbMacros);
      setAllDbBiomarkers(dbBiomarkers);

      setLoading(false);
    }

    loadLockerData();
  }, [user, dbFetchTrigger]);

  // Auto-pop milestone modal on hitting the target milestone
  useEffect(() => {
    if (activeStreak >= 30) {
      const hasShown = localStorage.getItem(`milestone_shown_30_${user?.id}`);
      if (!hasShown) {
        setUnlockMilestone(30);
        setShowUnlockModal(true);
        localStorage.setItem(`milestone_shown_30_${user?.id}`, 'true');
      }
    } else if (activeStreak >= 7) {
      const hasShown = localStorage.getItem(`milestone_shown_7_${user?.id}`);
      if (!hasShown) {
        setUnlockMilestone(7);
        setShowUnlockModal(true);
        localStorage.setItem(`milestone_shown_7_${user?.id}`, 'true');
      }
    }
  }, [activeStreak, user?.id]);

  // Fetch offers dynamically from database with high-fidelity client fallback
  useEffect(() => {
    async function loadOffersAndFile() {
      setIsOffersLoading(true);
      // 1. Fetch from database using supabase
      try {
        if (supabase) {
          const { data, error } = await supabase
            .from('wheyo_offers')
            .select('*')
            .eq('is_active', true)
            .order('id', { ascending: true });

          if (!error && data && data.length > 0) {
            setDbOffers(data as WheyoOffer[]);
            setIsOffersLoading(false);
            return;
          }
          if (error) {
            console.warn("Database fetch warning:", error.message);
          }
        }
      } catch (err) {
        console.warn("Database fetch failed (falling back):", err);
      }

      // 2. High-fidelity Offline fallback list with "To be revealed soon!" for mystery rewards
      const fallbackList: WheyoOffer[] = [
        {
          id: 1,
          title: "5th Order Loyalty Reward",
          description: "Flat 10% discount automatically applied at checkout on orders above ₹299.",
          trigger_rule: "5 Completed Fuel Orders",
          category: "Loyalty Milestones",
          is_revealed: true,
          is_active: true
        },
        {
          id: 2,
          title: "10th Order Elite Champion",
          description: "Flat 20% elite discount automatically applied at checkout on orders above ₹299.",
          trigger_rule: "10 Completed Fuel Orders",
          category: "Loyalty Milestones",
          is_revealed: true,
          is_active: true
        },
        {
          id: 3,
          title: "15th Milestone Drop",
          description: "Mystery Reward Locked! To be revealed soon.",
          trigger_rule: "15 Completed Fuel Orders",
          category: "Loyalty Milestones",
          is_revealed: false,
          is_active: true
        },
        {
          id: 4,
          title: "20th Milestone Champion",
          description: "Mystery Reward Locked! To be revealed soon.",
          trigger_rule: "20 Completed Fuel Orders",
          category: "Loyalty Milestones",
          is_revealed: false,
          is_active: true
        },
        {
          id: 5,
          title: "7-Day Consistency Boost",
          description: "Mystery Reward Locked! To be revealed soon.",
          trigger_rule: "7-Day Active Health Streak",
          category: "Streak Bonuses",
          is_revealed: false,
          is_active: true
        },
        {
          id: 6,
          title: "30-Day Mutant Champion",
          description: "Mystery Reward Locked! To be revealed soon.",
          trigger_rule: "30-Day Active Health Streak",
          category: "Streak Bonuses",
          is_revealed: false,
          is_active: true
        }
      ];
      setDbOffers(fallbackList);
      setIsOffersLoading(false);

      // 3. Keep standard file sync as extra fallback
      try {
        const res = await fetch('/Offers.md');
        if (res.ok) {
          const text = await res.text();
          setOffersContent(text);
        }
      } catch (err) {
        console.error("Failed to load static file:", err);
      }
    }

    loadOffersAndFile();
  }, [showOffersDialog]);

  // Load products and filter favorites
  useEffect(() => {
    let cleanupFn: (() => void) | null = null;
    let isActive = true;

    async function fetchAllProductsAndFilterFavorites() {
      const FALLBACK_PRODUCTS = [
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

      let fetched = [...FALLBACK_PRODUCTS];
      try {
        if (supabase) {
          const { getPublicUrl } = await import('../lib/supabase');
          const tables = ['student_menu', 'proff_menu', 'elite_menu'];
          let allCombinedData: any[] = [];

          for (const tableName of tables) {
            try {
              const { data, error } = await supabase
                .from(tableName)
                .select('*')
                .eq('is_available', true);
              
              if (!error && data && data.length > 0) {
                const items = data.map((p: any) => ({
                  id: `${tableName}_${p.id}`,
                  code: p.code,
                  name: p.name,
                  protein: Number(p.protein || 40),
                  calories: Number(p.calories || 350),
                  price: Number(p.price || 149),
                  isVeg: p.is_veg,
                  image: getPublicUrl(p.image_url),
                  tags: Array.isArray(p.tags) ? p.tags : [],
                }));
                allCombinedData = [...allCombinedData, ...items];
              }
            } catch (err) {
              console.warn(`ProfilePage error fetching table ${tableName}:`, err);
            }
          }

          if (allCombinedData.length > 0) {
            fetched = allCombinedData;
          }
        }
      } catch (e) {
        console.warn('Fallback products activated in profile:', e);
      }
      
      if (!isActive) return;
      setAllProducts(fetched);

      const syncFavoritesList = () => {
        const favsStr = localStorage.getItem('wheyo_favorites') || '[]';
        try {
          const ids = JSON.parse(favsStr);
          if (Array.isArray(ids)) {
            const matched = fetched.filter(p => ids.includes(p.id));
            setFavorites(matched);
          } else {
            setFavorites([]);
          }
        } catch {
          setFavorites([]);
        }
      };

      syncFavoritesList();

      window.addEventListener('wheyo-favorites-changed', syncFavoritesList);
      cleanupFn = () => {
        window.removeEventListener('wheyo-favorites-changed', syncFavoritesList);
      };
    }
    
    fetchAllProductsAndFilterFavorites();
    
    return () => {
      isActive = false;
      if (cleanupFn) cleanupFn();
    };
  }, [user]);

  // Auth Submit Handlers
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError(null);

    const useMock = !supabase;

    try {
      if (isSignUp) {
        if (!authName || !authPhone) {
          throw new Error('Please enter name and mobile number.');
        }
        if (authPhone.replace(/\D/g, '').length < 10) {
          throw new Error('Please enter a valid 10-digit mobile number.');
        }

        if (useMock) {
          const mockUser = {
            id: 'mw-' + Math.random().toString(36).substring(3, 10),
            email: authEmail,
            user_metadata: { full_name: authName, phone: authPhone }
          };
          const mockSess = { access_token: 'mw-token', user: mockUser };
          localStorage.setItem('mock_session', JSON.stringify(mockSess));
          localStorage.setItem('customer_name', authName);
          localStorage.setItem('customer_phone', authPhone);
          window.dispatchEvent(new Event('mock-auth-change'));
          window.location.reload();
        } else {
          const { data, error } = await supabase!.auth.signUp({
            email: authEmail,
            password: authPassword,
            options: { data: { full_name: authName, phone: authPhone } }
          });
          if (error) throw error;
          
          if (data.user) {
            await supabase!.from('profiles').upsert({
              id: data.user.id,
              full_name: authName,
              phone: authPhone,
              daily_protein_goal: 150,
              daily_calorie_goal: 2200
            });
          }
          localStorage.setItem('customer_name', authName);
          localStorage.setItem('customer_phone', authPhone);
          window.location.reload();
        }
      } else {
        if (useMock) {
          const mockUser = {
            id: 'mw-9923',
            email: authEmail,
            user_metadata: { full_name: 'Yash Koparde', phone: '+91 98765 43210' }
          };
          const mockSess = { access_token: 'mw-token', user: mockUser };
          localStorage.setItem('mock_session', JSON.stringify(mockSess));
          localStorage.setItem('customer_name', 'Yash Koparde');
          localStorage.setItem('customer_phone', '+91 98765 43210');
          window.dispatchEvent(new Event('mock-auth-change'));
          window.location.reload();
        } else {
          const { error } = await supabase!.auth!.signInWithPassword({
            email: authEmail,
            password: authPassword
          });
          if (error) throw error;
          window.location.reload();
        }
      }
    } catch (err: any) {
      setAuthError(err.message || 'Verification rejected.');
    } finally {
      setAuthLoading(false);
    }
  };

  const triggerLogout = async () => {
    if (supabase) {
      await supabase!.auth!.signOut();
    }
    localStorage.removeItem('mock_session');
    window.dispatchEvent(new Event('mock-auth-change'));
    navigate('/login');
  };

  const handleDownloadCardPNG = async () => {
    if (!cardRef.current) return;
    try {
      setSharingStatus('Generating high-res flexing image...');
      
      const el = cardRef.current;
      
      // Wait for fonts to resolve fully to prevent cut-off or mismatched text/fallback layers
      if (typeof document !== 'undefined' && document.fonts) {
        await document.fonts.ready;
      }
      
      // Slight delay to ensure layout has settled perfectly
      await new Promise(resolve => setTimeout(resolve, 200));

      // Warm-up call to cache assets/fonts inside the SVG foreignObject layer
      try {
        await toPng(el, { cacheBust: true });
      } catch (e) {
        console.warn("Pre-render warm-up caught expected cycle:", e);
      }

      // Safeguard proportions: use a stable minimum dimensions of 540px width 
      // during rasterization to prevent text/metric lines from wrapping or truncating on mobile screens
      const width = Math.max(el.offsetWidth, 540);
      const height = Math.max(el.offsetHeight, 330);

      const dataUrl = await toPng(el, { 
        cacheBust: true,
        pixelRatio: 3, // Premium 3x pixel scale for pristine crispness on stories
        width: width,
        height: height,
        backgroundColor: '#030304',
        style: {
          transform: 'none',
          margin: '0',
          width: `${width}px`,
          height: `${height}px`,
          overflow: 'hidden',
          borderRadius: '16px',
        }
      });

      const username = user?.email?.split('@')[0] || 'Member';
      const cleanUsername = username.replace(/[^a-zA-Z0-9]/g, '_');
      const filename = `${cleanUsername}_WheyoPro_Card.png`;

      const tempLink = document.createElement('a');
      tempLink.href = dataUrl;
      tempLink.download = filename;
      document.body.appendChild(tempLink);
      tempLink.click();
      document.body.removeChild(tempLink);
      
      setSharingStatus('Success! high-res image saved. Go flex it on stories!');
      setTimeout(() => setSharingStatus(''), 4000);
    } catch (error) {
      console.error('Error generating status image:', error);
      setSharingStatus('Failed to generate image. Please try again.');
      setTimeout(() => setSharingStatus(''), 4000);
    }
  };

  const handleShareCard = async () => {
    if (!cardRef.current) return;
    try {
      setSharingStatus('Preparing flexing card to share...');
      
      const el = cardRef.current;
      
      // Wait for fonts to resolve fully to prevent cut-off or mismatched text/fallback layers
      if (typeof document !== 'undefined' && document.fonts) {
        await document.fonts.ready;
      }
      
      // Slight delay to ensure layout has settled perfectly
      await new Promise(resolve => setTimeout(resolve, 200));

      // Warm-up call to cache assets/fonts inside the SVG foreignObject layer
      try {
        await toPng(el, { cacheBust: true });
      } catch (e) {
        console.warn("Pre-render warm-up caught expected cycle:", e);
      }

      const width = Math.max(el.offsetWidth, 540);
      const height = Math.max(el.offsetHeight, 330);

      const dataUrl = await toPng(el, { 
        cacheBust: true,
        pixelRatio: 3,
        width: width,
        height: height,
        backgroundColor: '#030304',
        style: {
          transform: 'none',
          margin: '0',
          width: `${width}px`,
          height: `${height}px`,
          overflow: 'hidden',
          borderRadius: '16px',
        }
      });
      
      const username = user?.email?.split('@')[0] || 'Member';
      const cleanUsername = username.replace(/[^a-zA-Z0-9]/g, '_');
      const filename = `${cleanUsername}_WheyoPro_Card.png`;

      const response = await fetch(dataUrl);
      const blob = await response.blob();
      const file = new File([blob], filename, { type: 'image/png' });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'MY WHEYO-PRO ATHLETIC STATUS',
          text: `Logged my premium athletic metrics! Current streak: ${activeStreak} days. Active team: ${selectedTeam}.`,
        });
        setSharingStatus('Social Share Panel opened successfully!');
        setTimeout(() => setSharingStatus(''), 4000);
      } else {
        await handleDownloadCardPNG();
        setSharingStatus('Web Share unsupported. Saved to downloads! Post it on Instagram & WhatsApp status.');
        setTimeout(() => setSharingStatus(''), 6000);
      }
    } catch (error: any) {
      console.error('Error in Web Share flow:', error);
      await handleDownloadCardPNG();
      setSharingStatus('Image saved to downloads! Upload it to Instagram/WhatsApp status.');
      setTimeout(() => setSharingStatus(''), 6000);
    }
  };

  const handleExportAnabolicReport = () => {
    try {
      setSharingStatus('Generating high-fidelity athlete PDF...');
      
      const username = user?.email?.split('@')[0] || 'Athlete';
      const cleanUsername = username.replace(/[^a-zA-Z0-9]/g, '_');
      
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // 1. Sleek elite charcoal dark background
      doc.setFillColor(11, 11, 15);
      doc.rect(0, 0, 210, 297, 'F');

      // 2. Glowing Neon Green frame border
      doc.setDrawColor(212, 255, 0); // #D4FF00
      doc.setLineWidth(0.8);
      doc.rect(8, 8, 194, 281, 'S');

      // 3. Document Header Info
      doc.setTextColor(212, 255, 0);
      doc.setFont('courier', 'bold');
      doc.setFontSize(8.5);
      doc.text('WHEYO-PRO ELITE PERFORMANCE LABS // OFFICIAL DECK', 15, 20);

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(14);
      doc.text(`${cleanUsername.toUpperCase()} // PERFORMANCE LEDGER`, 15, 27);

      // Neon separator line
      doc.setDrawColor(212, 255, 0);
      doc.setLineWidth(0.4);
      doc.line(15, 33, 195, 33);

      // 4. Primary Athlete Dossier Card
      doc.setFillColor(16, 16, 22);
      doc.setDrawColor(32, 32, 42);
      doc.roundedRect(15, 39, 180, 52, 4, 4, 'FD');

      doc.setTextColor(212, 255, 0);
      doc.setFontSize(7.5);
      doc.text('WHEYO-PRO OFFICIAL ATHLETE DOSSIER', 22, 46);

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(13);
      doc.text(`DIVISION: ${selectedTeam.toUpperCase()}`, 22, 53);

      doc.setTextColor(150, 150, 150);
      doc.setFontSize(8);
      doc.text(`ATHLETE KEY: ${user?.email || 'ANONYMOUS_KEY'}`, 22, 60);

      const memberId = (activeStreak * 17) + 1092;
      doc.text(`MEMBER REGISTRY ID: #${memberId}`, 22, 65);

      doc.setDrawColor(212, 255, 0);
      doc.setLineWidth(0.2);
      doc.line(22, 70, 188, 70);

      // Horizontal micro stat blocks
      doc.setTextColor(150, 150, 150);
      doc.setFontSize(7);
      doc.text('ACTIVE TRACKING STREAK', 22, 76);
      doc.setTextColor(212, 255, 0);
      doc.setFontSize(10.5);
      doc.text(`${activeStreak} DAYS`, 22, 82);

      doc.setTextColor(150, 150, 150);
      doc.setFontSize(7);
      doc.text('WORKOUT COMPLIANCE', 76, 76);
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(10.5);
      doc.text(`${universalStats.totalWorkouts || 0} SESSIONS`, 76, 82);

      doc.setTextColor(150, 150, 150);
      doc.setFontSize(7);
      doc.text('ADHERENCE SCORE', 135, 76);
      doc.setTextColor(212, 255, 0);
      doc.setFontSize(10.5);
      doc.text(`${universalStats.consistencyRate}% RATE`, 135, 82);

      // 5. Four Biometrics Highlights Boxes
      // Box 1: Avg Protein
      doc.setFillColor(16, 16, 22);
      doc.setDrawColor(32, 32, 42);
      doc.roundedRect(15, 96, 41, 18, 2, 2, 'FD');
      doc.setTextColor(150, 150, 150);
      doc.setFontSize(6.5);
      doc.text('AVG PROTEIN', 19, 101);
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(8.5);
      doc.text(`${universalStats.avgProtein}g`, 19, 108);

      // Box 2: Mean hydration
      doc.setFillColor(16, 16, 22);
      doc.roundedRect(61, 96, 41, 18, 2, 2, 'FD');
      doc.setTextColor(150, 150, 150);
      doc.setFontSize(6.5);
      doc.text('MEAN WATER', 65, 101);
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(8.5);
      doc.text(`${universalStats.avgWater}ml`, 65, 108);

      // Box 3: Sleep recovery
      doc.setFillColor(16, 16, 22);
      doc.roundedRect(107, 96, 41, 18, 2, 2, 'FD');
      doc.setTextColor(150, 150, 150);
      doc.setFontSize(6.5);
      doc.text('SLEEP RECOVERY', 111, 101);
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(8.5);
      doc.text(`${universalStats.avgSleep}h`, 111, 108);

      // Box 4: Active Weight
      doc.setFillColor(16, 16, 22);
      doc.roundedRect(153, 96, 42, 18, 2, 2, 'FD');
      doc.setTextColor(150, 150, 150);
      doc.setFontSize(6.5);
      doc.text('BODY WEIGHT', 157, 101);
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(8.5);
      doc.text(universalStats.avgWeight > 0 ? `${universalStats.avgWeight} kg` : 'N/A', 157, 108);

      // 6. Configured Fitness Alignment Goal
      doc.setFillColor(13, 13, 19);
      doc.setDrawColor(32, 32, 42);
      doc.roundedRect(15, 119, 180, 8, 2, 2, 'FD');
      doc.setTextColor(150, 150, 150);
      doc.setFontSize(7.5);
      doc.text('FITNESS GOAL:', 19, 124.5);
      doc.setTextColor(212, 255, 0);
      doc.text((settingsForm.fitness_goal?.toUpperCase() || 'HYPERTROPHY FOCUS'), 41, 124.5);
      doc.setTextColor(150, 150, 150);
      doc.text('GENERATED TIMESTAMP:', 105, 124.5);
      doc.setTextColor(255, 255, 255);
      doc.text(new Date().toLocaleString(), 138, 124.5);

      // 7. Milestones and Awards
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(9);
      doc.text('AWARD PROFILE & ATHLETE MILESTONES', 15, 137);
      doc.setDrawColor(212, 255, 0);
      doc.setLineWidth(0.4);
      doc.line(15, 139, 65, 139);

      doc.setFillColor(13, 13, 19);
      doc.roundedRect(15, 143, 180, 22, 3, 3, 'FD');

      const ms7Unlocked = activeStreak >= 7;
      doc.setFontSize(8);
      doc.setTextColor(ms7Unlocked ? 212 : 110, ms7Unlocked ? 255 : 110, ms7Unlocked ?  0 : 110);
      doc.text(`[${ms7Unlocked ? 'UNLOCKED' : 'LOCKED'}] 7-Day Signature Success Title`, 22, 151);

      const ms30Unlocked = activeStreak >= 30;
      doc.setTextColor(ms30Unlocked ? 212 : 110, ms30Unlocked ? 255 : 110, ms30Unlocked ?  0 : 110);
      doc.text(`[${ms30Unlocked ? 'UNLOCKED' : 'LOCKED'}] 30-Day Wheyo-Pro Legend Achievement`, 22, 158);

      doc.setTextColor(120, 120, 120);
      doc.setFontSize(7);
      doc.text('Milestones unlock upon satisfying required workout and macronutrient consistency logs.', 105, 155);

      // 8. Logbook History Graph Data Table
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(9);
      doc.text(`BIO-REACTIVE HISTORY LOGBOOK (${universalRange}D TIMEFRAME)`, 15, 174);
      doc.setDrawColor(212, 255, 0);
      doc.setLineWidth(0.4);
      doc.line(15, 176, 65, 176);

      // Grid header
      doc.setFillColor(20, 20, 28);
      doc.rect(15, 180, 180, 8, 'F');
      doc.setTextColor(212, 255, 0);
      doc.setFontSize(7.5);
      doc.setFont('courier', 'bold');
      doc.text('DATE', 18, 185);
      doc.text('WEIGHT', 48, 185);
      doc.text('PROTEIN PROGRESS', 73, 185);
      doc.text('HYDRATION FLOW', 113, 185);
      doc.text('SLEEP', 153, 185);
      doc.text('TRAINING STATUS', 173, 185);

      let rowY = 188;
      const logsToRender = unifiedTrendData.slice(-9);

      if (logsToRender.length === 0) {
        doc.setFillColor(13, 13, 19);
        doc.rect(15, rowY, 180, 15, 'F');
        doc.setTextColor(120, 120, 120);
        doc.text('NO REAL LOG DATA SYNCHRONIZED TO CURRENT SESSION', 45, rowY + 9);
        rowY += 15;
      } else {
        logsToRender.forEach((d, index) => {
          if (index % 2 === 0) {
            doc.setFillColor(12, 12, 18);
          } else {
            doc.setFillColor(16, 16, 22);
          }
          doc.rect(15, rowY, 180, 8, 'F');
          
          doc.setTextColor(212, 255, 0);
          doc.text(d.label, 18, rowY + 5);

          doc.setTextColor(255, 255, 255);
          doc.text(d.weight > 0 ? `${d.weight} kg` : 'N/A', 48, rowY + 5);
          doc.text(`${d.protein}g / ${targetProteinGoal}g`, 73, rowY + 5);
          doc.text(`${d.water}ml / 4000`, 113, rowY + 5);
          doc.text(`${d.sleep}h / 8`, 153, rowY + 5);

          if (d.workout) {
            doc.setTextColor(212, 255, 0);
            doc.text('LOGGED OK', 173, rowY + 5);
          } else {
            doc.setTextColor(120, 120, 120);
            doc.text('REST DAY', 173, rowY + 5);
          }

          doc.setDrawColor(255, 255, 255, 0.05);
          doc.setLineWidth(0.15);
          doc.line(15, rowY + 8, 195, rowY + 8);

          rowY += 8;
        });
      }

      // 9. Maxim & signature footer
      const quoteY = Math.max(rowY + 5, 262);

      doc.setFillColor(13, 13, 19);
      doc.setDrawColor(212, 255, 0);
      doc.setLineWidth(0.4);
      doc.rect(15, quoteY, 180, 11, 'F');
      doc.line(15, quoteY, 15, quoteY + 11);

      doc.setTextColor(212, 255, 0);
      doc.setFontSize(7);
      doc.text('WHEYO-PRO METABOLIC MAXIM:', 18, quoteY + 4);

      doc.setTextColor(170, 170, 170);
      doc.setFontSize(6);
      doc.setFont('courier', 'italic');
      doc.text('"Discipline isn\'t premium. It\'s a daily lifting protocol. Miss your protein, miss the gains. Charge ahead."', 18, quoteY + 8.5);

      doc.setFont('courier', 'bold');
      doc.setTextColor(100, 100, 100);
      doc.setFontSize(7.5);
      doc.text('WHEYO-PRO PERFORMANCE LABS \u2022 VERIFIED ATHLETE PROGRESS SHEET \u2022 DIRECT SECURE EXPORT', 15, 283);

      doc.save(`${cleanUsername}_WheyoPro_Report.pdf`);
      setSharingStatus('Success! Verified PDF ledger downloaded successfully.');
      setTimeout(() => setSharingStatus(''), 5000);
    } catch (error) {
      console.error('Error generating PDF report:', error);
      setSharingStatus('Failed to generate secure PDF data. Please try again.');
      setTimeout(() => setSharingStatus(''), 4000);
    }
  };

  const incProtein = async (amount: number) => {
    const today = new Date().toISOString().split('T')[0];
    const newP = dailyProtein + amount;
    setDailyProtein(newP);
    
    const localMacrosStr = localStorage.getItem('local_macros') || '{}';
    const localMacrosMap = JSON.parse(localMacrosStr);
    localMacrosMap[today] = newP;
    localStorage.setItem('local_macros', JSON.stringify(localMacrosMap));

    const extraCal = Math.round(amount * 8.5);
    const newC = dailyCalories + extraCal;
    setDailyCalories(newC);
    localStorage.setItem(`local_calories_${today}`, String(newC));

    if (supabase && user) {
      try {
        await supabase.from('daily_macros').upsert({
          user_id: user.id,
          date: today,
          protein_consumed: newP,
          calories_consumed: newC
        }, { onConflict: 'user_id,date' });
         setDbFetchTrigger(prev => prev + 1);
      } catch (err) {
        console.error("Database error logging macros:", err);
      }
    }
  };

  const incCalories = async (amount: number) => {
    const today = new Date().toISOString().split('T')[0];
    const newC = dailyCalories + amount;
    setDailyCalories(newC);
    localStorage.setItem(`local_calories_${today}`, String(newC));

    if (supabase && user) {
      try {
        await supabase.from('daily_macros').upsert({
          user_id: user.id,
          date: today,
          protein_consumed: dailyProtein,
          calories_consumed: newC
        }, { onConflict: 'user_id,date' });
        setDbFetchTrigger(prev => prev + 1);
      } catch (err) {
        console.error("Database error logging calories:", err);
      }
    }
  };

  const runBmrCalc = () => {
    const w = parseFloat(weightInput);
    const h = parseFloat(heightInput);
    const a = parseInt(ageInput);
    if (!w || !h || !a) return;

    let base = 0;
    if (genderInput === 'male') {
      base = (10 * w) + (6.25 * h) - (5 * a) + 5;
    } else {
      base = (10 * w) + (6.25 * h) - (5 * a) - 161;
    }
    const tdeeResult = Math.round(base * parseFloat(activityInput));
    setCalculatedTdee(tdeeResult);
  };

  // Dynamic Macro calculations block for athlete breakdown
  const dynamicMacroCalculation = useMemo(() => {
    const proteinG = Number(profile?.daily_protein_goal || 150);
    const caloriesGoal = Number(profile?.daily_calorie_goal || 2200);
    const fitnessGoal = profile?.fitness_goal || 'Muscle Gain';

    const proteinKcal = proteinG * 4;
    const remainingKcal = Math.max(0, caloriesGoal - proteinKcal);

    let carbsPercent = 0.50;
    let fatsPercent = 0.50;

    if (fitnessGoal === 'Muscle Gain') {
      carbsPercent = 0.55;
      fatsPercent = 0.45;
    } else {
      carbsPercent = 0.35;
      fatsPercent = 0.65;
    }

    const carbsKcal = remainingKcal * carbsPercent;
    const fatsKcal = remainingKcal * fatsPercent;

    const carbsG = Math.round(carbsKcal / 4);
    const fatsG = Math.round(fatsKcal / 9);

    return {
      proteinG,
      proteinKcal,
      carbsG,
      carbsKcal: Math.round(carbsKcal),
      fatsG,
      fatsKcal: Math.round(fatsKcal),
      proteinPct: Math.round((proteinKcal / caloriesGoal) * 100),
      carbsPct: Math.round((carbsKcal / caloriesGoal) * 100),
      fatsPct: Math.round((fatsKcal / caloriesGoal) * 100),
    };
  }, [profile]);

  const applyBiomarkerChanges = async (updates: {
    water_ml?: number;
    sleep_hours?: number;
    body_weight?: number;
    workout_logged?: boolean;
  }) => {
    const today = new Date().toISOString().split('T')[0];
    const finalWater = updates.water_ml !== undefined ? updates.water_ml : hydrationLevel;
    const finalSleep = updates.sleep_hours !== undefined ? updates.sleep_hours : sleepLevel;
    const finalWeight = updates.body_weight !== undefined ? updates.body_weight : weightLevel;
    const finalWorkout = updates.workout_logged !== undefined ? updates.workout_logged : workoutLoggedToday;

    if (updates.water_ml !== undefined) {
      setHydrationLevel(updates.water_ml);
      localStorage.setItem(`hydration_${today}`, String(updates.water_ml));
    }
    if (updates.sleep_hours !== undefined) {
      setSleepLevel(updates.sleep_hours);
      localStorage.setItem(`sleep_${today}`, String(updates.sleep_hours));
      setLocalSleep(String(updates.sleep_hours));
    }
    if (updates.body_weight !== undefined) {
      setWeightLevel(updates.body_weight);
      localStorage.setItem(`weight_${today}`, String(updates.body_weight));
      setLocalWeight(String(updates.body_weight));
    }
    if (updates.workout_logged !== undefined) {
      setWorkoutLoggedToday(updates.workout_logged);
      localStorage.setItem(`workout_${today}`, String(updates.workout_logged));
    }

    if (supabase && user) {
      try {
        await supabase.from('biomarkers').upsert({
          user_id: user.id,
          date: today,
          water_ml: Number(finalWater),
          sleep_hours: Number(finalSleep),
          body_weight: Number(finalWeight),
          workout_logged: !!finalWorkout
        }, { onConflict: 'user_id,date' });
      } catch (err) {
        console.error("Database error saving biomarkers:", err);
      }
    }
    setDbFetchTrigger(prev => prev + 1);
  };

  const incWater = async (amount: number) => {
    const nextVal = hydrationLevel + amount;
    await applyBiomarkerChanges({ water_ml: nextVal });
  };

  const logCns = async (level: string) => {
    setCnsStress(level);
    localStorage.setItem(`cns_stress_level_${user?.id || 'default'}`, level);
  };

  const logSoreness = async (level: string) => {
    setSorenessLevel(level);
    localStorage.setItem(`soreness_level_${user?.id || 'default'}`, level);
  };

  const handleUpdateSteps = (val: number) => {
    const today = new Date().toISOString().split('T')[0];
    const nextSteps = Math.max(0, val);
    setDailySteps(nextSteps);
    localStorage.setItem(`steps_${today}`, String(nextSteps));
    setDbFetchTrigger(prev => prev + 1);
  };

  const handleUpdateActiveMinutes = (val: number) => {
    const today = new Date().toISOString().split('T')[0];
    const nextMins = Math.max(0, val);
    setActiveMinutes(nextMins);
    localStorage.setItem(`active_mins_${today}`, String(nextMins));
    setDbFetchTrigger(prev => prev + 1);
  };

  const handleUpdateHeartRate = (val: number) => {
    const today = new Date().toISOString().split('T')[0];
    const nextBpm = Math.max(30, Math.min(220, val));
    setHeartRate(nextBpm);
    localStorage.setItem(`heart_rate_${today}`, String(nextBpm));
    setDbFetchTrigger(prev => prev + 1);
  };

  const applySettings = async () => {
    setIsSavingSettings(true);
    
    localStorage.setItem(`customer_name_${user.id}`, settingsForm.full_name);
    localStorage.setItem(`customer_phone_${user.id}`, settingsForm.phone);
    localStorage.setItem(`daily_protein_goal_${user.id}`, String(settingsForm.daily_protein_goal));
    localStorage.setItem(`daily_calorie_goal_${user.id}`, String(settingsForm.daily_calorie_goal));
    localStorage.setItem(`fitness_goal_selection_${user.id}`, settingsForm.fitness_goal);

    localStorage.setItem('customer_name', settingsForm.full_name);
    localStorage.setItem('customer_phone', settingsForm.phone);
    localStorage.setItem('daily_protein_goal', String(settingsForm.daily_protein_goal));
    localStorage.setItem('daily_calorie_goal', String(settingsForm.daily_calorie_goal));
    localStorage.setItem('fitness_goal_selection', settingsForm.fitness_goal);
    
    if (supabase && user) {
      try {
        await supabase.from('profiles').upsert({
          id: user.id,
          full_name: settingsForm.full_name,
          phone: settingsForm.phone,
          daily_protein_goal: settingsForm.daily_protein_goal,
          daily_calorie_goal: settingsForm.daily_calorie_goal,
          fitness_goal: settingsForm.fitness_goal,
          updated_at: new Date().toISOString()
        }, { onConflict: 'id' });
      } catch (err) {
        console.error("Database error saving profiles:", err);
      }
    }

    setProfile(settingsForm);
    setIsSavingSettings(false);
    setDbFetchTrigger(prev => prev + 1);
  };

  const handleAddCustomMeal = async (name: string, protein: number, calories: number) => {
    if (!name.trim()) return;
    const newMeal = {
      id: 'meal-' + Math.random().toString(36).substring(2, 9),
      name: name,
      protein: protein,
      calories: calories,
      loggedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    const updated = [newMeal, ...todayMeals];
    setTodayMeals(updated);
    localStorage.setItem('today_meals', JSON.stringify(updated));

    const today = new Date().toISOString().split('T')[0];
    const newP = dailyProtein + protein;
    const newC = dailyCalories + calories;
    setDailyProtein(newP);
    setDailyCalories(newC);
    
    const localMacrosStr = localStorage.getItem('local_macros') || '{}';
    const localMacrosMap = JSON.parse(localMacrosStr);
    localMacrosMap[today] = newP;
    localStorage.setItem('local_macros', JSON.stringify(localMacrosMap));
    localStorage.setItem(`local_calories_${today}`, String(newC));

    if (supabase && user) {
      try {
        await supabase.from('daily_macros').upsert({
          user_id: user.id,
          date: today,
          protein_consumed: newP,
          calories_consumed: newC
        }, { onConflict: 'user_id,date' });
        setDbFetchTrigger(prev => prev + 1);
      } catch (err) {
        console.error("Database sync error for custom meal:", err);
      }
    }
  };

  const handleDeleteMeal = async (mealId: string) => {
    const mealToDelete = todayMeals.find(m => m.id === mealId);
    if (!mealToDelete) return;
    
    const updated = todayMeals.filter(m => m.id !== mealId);
    setTodayMeals(updated);
    localStorage.setItem('today_meals', JSON.stringify(updated));

    const today = new Date().toISOString().split('T')[0];
    const newP = Math.max(0, dailyProtein - mealToDelete.protein);
    const newC = Math.max(0, dailyCalories - mealToDelete.calories);
    setDailyProtein(newP);
    setDailyCalories(newC);

    const localMacrosStr = localStorage.getItem('local_macros') || '{}';
    const localMacrosMap = JSON.parse(localMacrosStr);
    localMacrosMap[today] = newP;
    localStorage.setItem('local_macros', JSON.stringify(localMacrosMap));
    localStorage.setItem(`local_calories_${today}`, String(newC));

    if (supabase && user) {
      try {
        await supabase.from('daily_macros').upsert({
          user_id: user.id,
          date: today,
          protein_consumed: newP,
          calories_consumed: newC
        }, { onConflict: 'user_id,date' });
        setDbFetchTrigger(prev => prev + 1);
      } catch (err) {
        console.error("Database sync error for custom meal delete:", err);
      }
    }
  };

  const handleAddExerciseLog = (name: string, weight: number, reps: number) => {
    if (!name || weight <= 0 || reps <= 0) return;
    const oneRepMax = Math.round(weight * (1 + reps / 30));
    const newLog = {
      id: 'ex-' + Math.random().toString(36).substring(2, 9),
      name: name,
      weight: weight,
      reps: reps,
      oneRepMax: oneRepMax,
      date: new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
    };
    const updated = [newLog, ...exerciseLogs];
    setExerciseLogs(updated);
    localStorage.setItem('exercise_logs', JSON.stringify(updated));
  };

  const handleDeleteExerciseLog = (logId: string) => {
    const updated = exerciseLogs.filter(ex => ex.id !== logId);
    setExerciseLogs(updated);
    localStorage.setItem('exercise_logs', JSON.stringify(updated));
  };

  const savePassportChanges = async () => {
    setIsEditingPassport(false);
    
    localStorage.setItem(`daily_protein_goal_${user.id}`, String(passportProtein));
    localStorage.setItem(`daily_calorie_goal_${user.id}`, String(passportCalories));
    localStorage.setItem(`fitness_goal_selection_${user.id}`, passportGoal);

    localStorage.setItem('daily_protein_goal', String(passportProtein));
    localStorage.setItem('daily_calorie_goal', String(passportCalories));
    localStorage.setItem('fitness_goal_selection', passportGoal);
    
    const updatedForm = {
      ...settingsForm,
      daily_protein_goal: Number(passportProtein),
      daily_calorie_goal: Number(passportCalories),
      fitness_goal: passportGoal
    };

    setSettingsForm(updatedForm);
    setProfile(updatedForm);

    if (supabase && user) {
      try {
        await supabase.from('profiles').upsert({
          id: user.id,
          full_name: updatedForm.full_name || 'Beast Mode',
          phone: updatedForm.phone || '+91 99999 99999',
          daily_protein_goal: Number(passportProtein),
          daily_calorie_goal: Number(passportCalories),
          fitness_goal: passportGoal,
          updated_at: new Date().toISOString()
        }, { onConflict: 'id' });
      } catch (err) {
        console.error("Database error saving profiles from passport:", err);
      }
    }
    setDbFetchTrigger(prev => prev + 1);
  };

  // Checked dynamic list of favorites linked to user preferences is managed reactively via favorites state hooks.

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh]">
        <Loader2 className="w-10 h-10 text-[#D4FF00] animate-spin mb-4" />
        <p className="text-gray-400 font-mono text-[10px] uppercase tracking-widest animate-pulse">Retrieving Athlete Profile...</p>
      </div>
    );
  }

  // AUTH PANEL IF NOT LOGGED IN
  if (!user) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 sm:py-24 select-none min-h-[80vh] flex flex-col justify-center">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#0A0A0C] border border-white/5 rounded-[28px] p-6 sm:p-8 shadow-2xl relative overflow-hidden"
        >
          <div className="text-center mb-8">
            <h1 className="text-2xl font-display uppercase tracking-widest font-black text-white">
              WHEYO <span className="text-[#D4FF00]">MEMBER</span> LOG
            </h1>
            <p className="text-[10px] text-gray-500 mt-1 uppercase tracking-wider font-mono">
              Provide credentials to sync your meal history
            </p>
          </div>

          <form onSubmit={handleAuthSubmit} className="space-y-4">
            {isSignUp && (
              <>
                <div>
                  <label className="block text-[9px] font-mono text-gray-500 uppercase tracking-wider mb-1 pl-1">BEAST NAME</label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-600" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Yash Koparde"
                      value={authName}
                      onChange={(e) => setAuthName(e.target.value)}
                      className="w-full bg-[#121214] border border-white/5 rounded-xl py-3 pl-11 pr-4 text-xs font-medium text-white placeholder:text-gray-700 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[9px] font-mono text-gray-500 uppercase tracking-wider mb-1 pl-1">MOBILE CONTACT</label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-600" />
                    <input
                      type="tel"
                      required
                      placeholder="e.g. 9876543210"
                      value={authPhone}
                      onChange={(e) => setAuthPhone(e.target.value)}
                      className="w-full bg-[#121214] border border-white/5 rounded-xl py-3 pl-11 pr-4 text-xs font-medium text-white placeholder:text-gray-700 focus:outline-none"
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-[9px] font-mono text-gray-500 uppercase tracking-wider mb-1 pl-1">EMAIL ADDRESS</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-600" />
                <input
                  type="email"
                  required
                  placeholder="athlete@domain.com"
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  className="w-full bg-[#121214] border border-white/5 rounded-xl py-3 pl-11 pr-4 text-xs font-medium text-white placeholder:text-gray-700 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[9px] font-mono text-gray-500 uppercase tracking-wider mb-1 pl-1">SECURE ACCESS KEYS</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-600" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  className="w-full bg-[#121214] border border-white/5 rounded-xl py-3 pl-11 pr-4 text-xs font-medium text-white placeholder:text-gray-700 focus:outline-none"
                />
              </div>
            </div>

            {authError && (
              <p className="text-[10px] text-red-500 font-mono text-center pt-2">
                {authError}
              </p>
            )}

            <button
              type="submit"
              disabled={authLoading}
              className="w-full bg-[#D4FF00] hover:bg-white text-black font-black py-3.5 rounded-xl text-xs uppercase tracking-widest transition-all duration-200 mt-2 flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
            >
              {authLoading ? (
                <Loader2 className="w-4 h-4 animate-spin text-black" />
              ) : (
                <>
                  <span>{isSignUp ? 'Generate Membership ID' : 'Validate Access Profile'}</span>
                  <CheckCircle className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="text-center mt-6 pt-4 border-t border-white/5">
            <button
              onClick={() => {
                setIsSignUp(!isSignUp);
                setAuthError(null);
              }}
              className="text-[10px] font-mono text-gray-400 hover:text-white uppercase tracking-wider underline underline-offset-4 cursor-pointer bg-transparent"
            >
              {isSignUp ? 'Sign In' : 'Sign Up'}
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // METRICS FOR MAIN BOARD EXTRUSION
  const targetProteinGoal = profile?.daily_protein_goal || 150;
  const targetCalGoal = profile?.daily_calorie_goal || 2200;
  const currentProteinPercentage = Math.min(100, (dailyProtein / targetProteinGoal) * 100);

  const bentoItems = [
    { id: 'athlete_id', label: 'Athlete ID', icon: User, color: '#D4FF00', glow: 'rgba(212,255,0,0.15)', description: 'Athlete passport, verified credentials, and digital QR locker access.', badge: 'Core' },
    { id: 'diurnal_log', label: 'Physical Log', icon: Zap, color: '#FCD34D', glow: 'rgba(252,211,77,0.15)', colSpan: 'col-span-2', description: 'Post-workout tracking, daily step counters, and hydration index logging.', badge: 'Live' },
    { id: 'goal_targets', label: 'Goal Targets', icon: Target, color: '#FB923C', glow: 'rgba(251,146,60,0.15)', description: 'Set, track, and synchronize your target macros and caloric milestones.' },
    { id: 'meal_diary', label: 'Meal Logging', icon: ClipboardList, color: '#F87171', glow: 'rgba(248,113,113,0.15)', description: 'Log meals, view current nutrition diaries, and restock healthy bowls.' },
    { id: 'exercises_pr', label: 'Favourites', icon: Heart, color: '#EC4899', glow: 'rgba(236,72,153,0.15)', description: 'Curated personal records and favorite exercises database.' },
    { id: 'supplement_stack', label: 'Supplements', icon: Sparkles, color: '#10B981', glow: 'rgba(16,185,129,0.15)', description: 'Your custom daily stack and performance boosters catalog.', badge: 'Shop' },
    { id: 'cardio_log', label: 'Cardio Log', icon: Flame, color: '#EF4444', glow: 'rgba(239,68,68,0.15)', description: 'Track and log cardiovascular sessions and fat-burning workouts.' },
    { id: 'body_measures', label: 'Body Stats', icon: TrendingUp, color: '#EC4899', glow: 'rgba(236,72,153,0.15)', colSpan: 'col-span-2', description: 'Body stats, tape measurements, and progress snapshots tracker.' },
    { id: 'bio_records', label: 'Recovery', icon: Activity, color: '#60A5FA', glow: 'rgba(96,165,250,0.15)', colSpan: 'col-span-2', description: 'Deep physiological diagnostics, sleep data, and bio-marker history tracking.' },
  ];

  const renderHeaderInfoBox = () => (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-gradient-to-r from-[#0C0C0E] to-[#08080A] border border-white/5 rounded-[24px] p-6 relative overflow-hidden mb-6 text-left"
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="relative w-16 h-16 rounded-full bg-gradient-to-tr from-[#D4FF00] to-neutral-900 flex items-center justify-center text-black shadow-md font-bold text-lg shrink-0">
            <User className="w-7 h-7 text-white" />
          </div>
          
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-display font-black uppercase text-white tracking-tight">
                {profile?.full_name || 'Beast Mode'}
              </h1>
              <span className="text-[8px] font-mono font-black uppercase bg-[#D4FF00]/10 border border-[#D4FF00]/20 text-[#D4FF00] px-1.5 py-0.5 rounded">
                Elite Club
              </span>
            </div>
            <p className="text-[10px] text-gray-500 font-mono tracking-wider mt-0.5">
              {user?.email} • {profile?.phone || '+91 99999 99999'}
            </p>
          </div>
        </div>

        {/* Daily Streak & Loyalty Milestones Container */}
        <div className="grid grid-cols-2 gap-3 w-full sm:w-auto sm:min-w-[420px]">
          {/* Daily Streak Indicator */}
          <motion.div 
            whileHover={{ scale: 1.05 }}
            onClick={() => {
              if (activeStreak >= 30) {
                setUnlockMilestone(30);
                setShowUnlockModal(true);
              } else {
                setUnlockMilestone(7);
                setShowUnlockModal(true);
              }
            }}
            className="flex items-center gap-3 bg-black/45 border border-[#D4FF00]/20 hover:border-[#D4FF00]/60 px-4 py-2.5 rounded-2xl cursor-pointer select-none transition-all duration-300 w-full"
          >
            <Flame className="w-5 h-5 text-[#D4FF00] fill-current shrink-0" />
            <div>
              <span className="text-[7px] font-mono text-gray-500 block uppercase tracking-widest leading-none">CONSISTENCY STREAK</span>
              <span className="text-xs font-mono font-black text-[#D4FF00] leading-none mt-1 block">{activeStreak} {activeStreak === 1 ? 'Day' : 'Days'}</span>
            </div>
          </motion.div>

          {/* Loyalty Milestones Card */}
          <motion.div 
            whileHover={{ scale: 1.05 }}
            onClick={() => setShowOffersDialog(true)}
            className="flex items-center gap-3 bg-[#09090B]/60 border border-purple-500/20 hover:border-purple-500/50 px-4 py-2.5 rounded-2xl select-none transition-all duration-300 relative overflow-hidden cursor-pointer w-full"
            title="Click to view all future upcoming offers!"
          >
            <div className="absolute -top-4 -right-4 w-12 h-12 bg-purple-500/5 rounded-full blur-md pointer-events-none" />
            <Trophy className="w-5 h-5 text-purple-400 shrink-0" />
            <div>
              <span className="text-[7px] font-mono text-purple-400/80 block uppercase tracking-widest leading-none">LOYALTY MILESTONES</span>
              <span className="text-[9.5px] font-mono font-black text-zinc-100 leading-none mt-1 block">
                {(() => {
                  const qualifyingCount = orders.filter(o => Number(o.final_price || 0) >= 299).length;
                  if (qualifyingCount >= 10) {
                    return <span className="text-[#D4FF00]">20% OFF ACTIVE!</span>;
                  } else if (qualifyingCount >= 5) {
                    return <span className="text-purple-300">10% OFF ACTIVE <span className="text-gray-500">({10 - qualifyingCount} to 20% off)</span></span>;
                  } else {
                    return <span>{qualifyingCount}/5 orders for 10% off</span>;
                  }
                })()}
              </span>
              <span className="text-[7px] font-mono text-purple-400 font-bold block mt-1 uppercase tracking-widest leading-none flex items-center gap-0.5">
                View Future Offers <Sparkles className="w-2.5 h-2.5 text-purple-400 shrink-0 animate-pulse" />
              </span>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );

  const renderWheyoWears = () => (
    <div className="relative overflow-hidden bg-gradient-to-r from-zinc-900/50 via-zinc-950/60 to-zinc-900/50 border border-white/5 rounded-3xl p-5 text-center max-w-lg mx-auto mb-2 backdrop-blur-md shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
      <div className="absolute -top-12 -left-12 w-32 h-32 bg-[#D4FF00]/5 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-purple-500/5 rounded-full blur-2xl pointer-events-none" />
      
      <div className="flex items-center justify-center gap-1.5 mb-2.5">
        <span className="text-[8px] font-mono font-black uppercase bg-[#D4FF00]/10 border border-[#D4FF00]/20 text-[#D4FF00] px-2 py-0.5 rounded-full tracking-wider animate-pulse">
          COMING SOON
        </span>
        <span className="text-[8px] font-mono font-black uppercase bg-white/5 border border-white/10 text-white px-2 py-0.5 rounded-full tracking-wider">
          WHEYO LABS
        </span>
      </div>

      <h3 className="text-xl font-display font-black uppercase text-white tracking-tight leading-none">
        WHEYO<span className="text-[#D4FF00]">WEARS</span>
      </h3>
      
      <p className="text-[11px] font-mono text-zinc-400 max-w-sm mx-auto mt-2.5 leading-relaxed">
        Premium high-performance activewear, engineered training shoes, and tactical fitness accessories designed for maximum workout output.
      </p>

      <div className="grid grid-cols-3 gap-2 mt-4 max-w-xs mx-auto">
        {[
          { label: 'Activewear', desc: 'Breathable fabric' },
          { label: 'Training Shoes', desc: 'Metcon stability' },
          { label: 'Gear & Bags', desc: 'Tactical packs' }
        ].map((item, idx) => (
          <div key={idx} className="bg-white/[0.02] border border-white/5 p-2 rounded-xl text-center">
            <span className="text-[9px] font-mono font-bold text-white block truncate">{item.label}</span>
            <span className="text-[7.5px] font-mono text-zinc-500 block mt-0.5 truncate">{item.desc}</span>
          </div>
        ))}
      </div>
    </div>
  );

  const renderSignOutButton = () => (
    <div className="mt-8 flex justify-center pb-4">
      <button
        onClick={triggerLogout}
        className="bg-red-950/20 hover:bg-red-500 hover:text-black border border-red-500/20 hover:border-[#D4FF00] text-red-100 font-mono text-[10px] font-black uppercase tracking-widest px-8 py-3.5 rounded-2xl transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer shadow-[0_4px_24px_rgba(239,68,68,0.05)] flex items-center gap-2"
      >
        <LogOut className="w-4 h-4" /> SIGN OUT ATHLETE PROFILE
      </button>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 pb-24 md:pb-16 select-none" id="decluttered-profile">
      
      {/* High-contrast Breadcrumb & Backtracking navigation bar */}
      {activeTab === null && (
        <div className="flex items-center justify-between gap-3 mb-6 bg-zinc-900/80 border border-white/5 p-3 rounded-2xl backdrop-blur-md">
          <Link 
            to="/menu"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white font-mono text-[10px] sm:text-[11px] uppercase font-black rounded-lg transition-all"
          >
            <ArrowLeft className="w-3 h-3 text-[#D4FF00]" /> Fuel Station
          </Link>
          
          <div className="flex items-center gap-2">
            <span className="text-[9px] sm:text-[10px] font-mono text-zinc-500 uppercase tracking-widest bg-zinc-950 px-2 py-1 rounded border border-white/5">
              Profile Hub
            </span>
          </div>
        </div>
      )}

      {/* If activeTab is null, we show the main Control Hub dashboard */}
      {activeTab === null ? (
        <>
          {renderHeaderInfoBox()}
          
          {/* THE 9 GLOWING INTERACTIVE CORE ORBS GRID */}
          <div id="athlete-wellness-deck" className="flex flex-col items-center justify-center mb-8 bg-[#09090B]/60 border border-white/5 p-4 rounded-3xl backdrop-blur-md">
            <span className="text-[10px] font-mono text-[#D4FF00] uppercase tracking-widest block mb-4 font-black">
              ATHLETE CONTROL HUB
            </span>
            {/* 3X3 RECTANGLE MOUNT GRID FOR ULTIMATE MOBILE EASE & FLUIDITY */}
            <div className="grid grid-cols-3 gap-y-5 gap-x-4 max-w-lg mx-auto w-full justify-items-center">
              {[
                { id: 'athlete_id', label: 'Athlete ID', icon: User, color: '#D4FF00', glow: 'rgba(212,255,0,0.3)' },
                { id: 'diurnal_log', label: 'Physical Log', icon: Zap, color: '#FCD34D', glow: 'rgba(252,211,77,0.3)' },
                { id: 'goal_targets', label: 'Goal Targets', icon: Target, color: '#FB923C', glow: 'rgba(251,146,60,0.3)' },
                { id: 'meal_diary', label: 'Meal Logging', icon: ClipboardList, color: '#F87171', glow: 'rgba(248,113,113,0.3)' },
                { id: 'exercises_pr', label: 'Favourites', icon: Heart, color: '#EC4899', glow: 'rgba(236,72,153,0.3)' },
                { id: 'supplement_stack', label: 'Supplements', icon: Sparkles, color: '#10B981', glow: 'rgba(16,185,129,0.3)' },
                { id: 'cardio_log', label: 'Cardio Log', icon: Flame, color: '#EF4444', glow: 'rgba(239,68,68,0.3)' },
                { id: 'body_measures', label: 'Body Stats', icon: TrendingUp, color: '#EC4899', glow: 'rgba(236,72,153,0.3)' },
                { id: 'bio_records', label: 'Recovery', icon: Activity, color: '#60A5FA', glow: 'rgba(96,165,250,0.3)' },
              ].map(orb => {
                const IconComp = orb.icon;
                return (
                  <button
                    key={orb.id}
                    onClick={() => {
                      setActiveTab(orb.id);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="flex flex-col items-center justify-center outline-none group cursor-pointer"
                    id={`orb-selector-${orb.id}`}
                  >
                    <div 
                      className={cn(
                        "w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center transition-all duration-300 relative bg-[#050505] overflow-hidden border border-white/5 hover:border-white/10 hover:scale-105 active:scale-95"
                      )}
                      style={{
                        boxShadow: `0 0 15px ${orb.glow}, inset 0 0 5px ${orb.glow}`,
                        borderColor: orb.color
                      }}
                    >
                      {/* Rotating Tech Outer Ring */}
                      <svg 
                        className="absolute inset-0 w-full h-full transition-all duration-300 pointer-events-none opacity-40 animate-[spin_30s_linear_infinite]" 
                        viewBox="0 0 100 100"
                      >
                        <circle
                          cx="50"
                          cy="50"
                          r="44"
                          className="fill-none"
                          stroke={orb.color}
                          strokeWidth="2"
                          strokeDasharray="4, 6"
                        />
                      </svg>

                      <IconComp 
                        className="w-5 h-5 transition-transform group-hover:rotate-6 z-10"
                        style={{ color: orb.color }}
                      />
                    </div>
                    <span 
                      className="text-[8.5px] font-mono mt-2 uppercase tracking-widest transition-colors text-center block text-gray-400 group-hover:text-white"
                    >
                      {orb.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {renderWheyoWears()}
          {renderSignOutButton()}
        </>
      ) : (
        /* If activeTab is NOT null, we show the full screen segment view */
        <div className="space-y-4">
          {/* BACK TO HUB BAR */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between mb-4 bg-[#09090B]/60 border border-white/5 p-4 rounded-3xl backdrop-blur-md"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="text-[10px] sm:text-xs font-mono text-zinc-100 uppercase tracking-widest font-black truncate">
                {(() => {
                  const names: Record<string, string> = {
                    athlete_id: 'Athlete ID & Passport',
                    diurnal_log: 'Physical Log & Workout',
                    goal_targets: 'Goal Targets & Macros',
                    meal_diary: 'Meal Logging & Store',
                    exercises_pr: 'Favourites & Exercises',
                    supplement_stack: 'Supplements Store',
                    cardio_log: 'Cardio Log Tracker',
                    body_measures: 'Body Stats & Dimensions',
                    bio_records: 'Recovery & Biomarkers'
                  };
                  return names[activeTab || ''] || 'Segment Details';
                })()}
              </span>
            </div>

            <div className="flex items-center shrink-0">
              <button
                onClick={() => {
                  setActiveTab(null);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="flex items-center gap-1.5 px-3 py-2 sm:px-4 sm:py-2.5 bg-[#D4FF00] hover:bg-white text-black font-mono text-[10px] sm:text-[11px] uppercase font-black rounded-xl border border-transparent transition-all active:scale-95 cursor-pointer shadow-[0_0_20px_rgba(212,255,0,0.25)]"
                title="Return to Athlete Control Hub"
              >
                BACK TO HUB <X className="w-3 h-3" />
              </button>
            </div>
          </motion.div>

          {(() => {
            renderDetailContentRef.current = (id: string | null) => {
              if (!id) return null;
              return (
                <div className="space-y-4">
                  {/* DYNAMIC SUB-TAB CIRCULAR PROGRESS WIDGET ONLY FOR DIURNAL LOG */}
                  {id === 'diurnal_log' && (() => {
            const getSubTabCircularConfig = () => {
              switch (physicalLogSubTab) {
                case 'fitness':
                  return [
                    {
                      id: 'steps',
                      label: 'STEPS',
                      value: `${dailySteps.toLocaleString()}`,
                      target: '10K steps',
                      progress: Math.min(100, (dailySteps / 10000) * 100),
                      color: '#FB923C',
                      glowColor: 'rgba(251,146,60,0.15)',
                      options: [
                        { label: '+1.5K', action: () => handleUpdateSteps(dailySteps + 1500) },
                        { label: '+3.5K', action: () => handleUpdateSteps(dailySteps + 3500) },
                        { label: '+5K', action: () => handleUpdateSteps(dailySteps + 5000) }
                      ]
                    },
                    {
                      id: 'active_mins',
                      label: 'ACTIVE',
                      value: `${activeMinutes}m`,
                      target: '45m goal',
                      progress: Math.min(100, (activeMinutes / 45) * 100),
                      color: '#F59E0B',
                      glowColor: 'rgba(245,158,11,0.15)',
                      options: [
                        { label: '+15m', action: () => handleUpdateActiveMinutes(activeMinutes + 15) },
                        { label: '+30m', action: () => handleUpdateActiveMinutes(activeMinutes + 30) },
                        { label: '+45m', action: () => handleUpdateActiveMinutes(activeMinutes + 45) }
                      ]
                    },
                    {
                      id: 'heart_rate',
                      label: 'PULSE',
                      value: `${heartRate} bpm`,
                      target: 'Resting',
                      progress: Math.min(100, (heartRate / 100) * 100),
                      color: '#EF4444',
                      glowColor: 'rgba(239,68,68,0.15)',
                      options: [
                        { label: '60 bpm', action: () => handleUpdateHeartRate(60) },
                        { label: '72 bpm', action: () => handleUpdateHeartRate(72) },
                        { label: '85 bpm', action: () => handleUpdateHeartRate(85) }
                      ]
                    }
                  ];
                case 'recovery':
                  return [
                    {
                      id: 'sleep',
                      label: 'SLEEP',
                      value: `${sleepLevel}h`,
                      target: '8h goal',
                      progress: Math.min(100, (sleepLevel / 8) * 100),
                      color: '#6366F1',
                      glowColor: 'rgba(99,102,241,0.15)',
                      options: [
                        { label: '6h', action: () => applyBiomarkerChanges({ sleep_hours: 6 }) },
                        { label: '8h', action: () => applyBiomarkerChanges({ sleep_hours: 8 }) },
                        { label: '9h', action: () => applyBiomarkerChanges({ sleep_hours: 9 }) }
                      ]
                    },
                    {
                      id: 'cns',
                      label: 'CNS STATE',
                      value: cnsStress === 'Low Stress' ? 'Calm' : cnsStress === 'Normal' ? 'Normal' : 'Fatigued',
                      target: 'Stress Level',
                      progress: cnsStress === 'Low Stress' ? 100 : cnsStress === 'Normal' ? 65 : 30,
                      color: '#A855F7',
                      glowColor: 'rgba(168,85,247,0.15)',
                      options: [
                        { label: 'Calm', action: () => logCns('Low Stress') },
                        { label: 'Normal', action: () => logCns('Normal') },
                        { label: 'Fatigued', action: () => logCns('High Fatigued') }
                      ]
                    },
                    {
                      id: 'soreness',
                      label: 'SORE',
                      value: sorenessLevel.includes('Fresh') ? 'Fresh' : sorenessLevel.includes('Normal') ? 'Normal' : sorenessLevel.includes('Sore') ? 'Sore' : 'Damaged',
                      target: 'Muscle Soreness',
                      progress: sorenessLevel.includes('Fresh') ? 100 : sorenessLevel.includes('Normal') ? 70 : sorenessLevel.includes('Sore') ? 40 : 15,
                      color: '#EC4899',
                      glowColor: 'rgba(236,72,153,0.15)',
                      options: [
                        { label: 'Fresh', action: () => logSoreness('Fresh (Fully Ready)') },
                        { label: 'Sore', action: () => logSoreness('Sore / Tired') },
                        { label: 'Damage', action: () => logSoreness('Highly Damaged') }
                      ]
                    }
                  ];
                case 'nutrition':
                default:
                  return [
                    {
                      id: 'protein',
                      label: 'PROTEIN',
                      value: `${dailyProtein}g`,
                      target: `${targetProteinGoal}g`,
                      progress: currentProteinPercentage,
                      color: '#D4FF00',
                      glowColor: 'rgba(212,255,0,0.15)',
                      options: [
                        { label: '+15g', action: () => incProtein(15) },
                        { label: '+25g', action: () => incProtein(25) },
                        { label: '+45g', action: () => incProtein(45) }
                      ]
                    },
                    {
                      id: 'calories',
                      label: 'CALORIES',
                      value: `${dailyCalories}`,
                      target: `${targetCalGoal}`,
                      progress: Math.min(100, (dailyCalories / targetCalGoal) * 100),
                      color: '#F97316',
                      glowColor: 'rgba(249,115,22,0.15)',
                      options: [
                        { label: '+100', action: () => incCalories(100) },
                        { label: '+250', action: () => incCalories(250) },
                        { label: '+500', action: () => incCalories(500) }
                      ]
                    },
                    {
                      id: 'water',
                      label: 'WATER',
                      value: `${hydrationLevel}ml`,
                      target: `${targetWaterGoal}ml`,
                      progress: Math.min(100, (hydrationLevel / targetWaterGoal) * 100),
                      color: '#3B82F6',
                      glowColor: 'rgba(59,130,246,0.15)',
                      options: [
                        { label: '+250', action: () => incWater(250) },
                        { label: '+500', action: () => incWater(500) },
                        { label: '+1L', action: () => incWater(1000) }
                      ]
                    }
                  ];
              }
            };

            return (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="grid grid-cols-3 gap-3 sm:gap-4 mb-6 items-start w-full"
              >
                {getSubTabCircularConfig().map((circle) => (
                  <div key={circle.id} className="flex flex-col items-center min-w-0">
                    <button
                      onClick={() => {
                        setActiveLogCircle(activeLogCircle === circle.id ? null : circle.id);
                        setActiveTab('diurnal_log');
                      }}
                      className={cn(
                        "w-full bg-[#0A0A0C] border rounded-[20px] p-4 flex flex-col items-center justify-center relative overflow-hidden shadow-sm cursor-pointer transition-all duration-300 active:scale-98 text-left outline-none",
                        activeLogCircle === circle.id
                          ? "shadow-[0_0_20px_var(--glow)]"
                          : "border-white/5 hover:bg-white/[0.01]"
                      )}
                      style={{
                        borderColor: activeLogCircle === circle.id ? circle.color : 'rgba(255,255,255,0.05)',
                        ['--glow' as any]: circle.glowColor
                      }}
                    >
                      <CircularProgress
                        progress={circle.progress}
                        color={circle.color}
                        label={circle.label}
                        value={circle.value}
                        target={circle.target}
                      />
                      {physicalLogSubTab === 'nutrition' && (
                        <span className="text-[7.5px] font-mono uppercase tracking-widest mt-2 block opacity-60 group-hover:opacity-100 transition-opacity" style={{ color: circle.color }}>
                          • Click to log •
                        </span>
                      )}
                    </button>
                    
                    <AnimatePresence>
                      {activeLogCircle === circle.id && (
                        <motion.div
                          initial={{ opacity: 0, height: 0, scale: 0.9 }}
                          animate={{ opacity: 1, height: 'auto', scale: 1 }}
                          exit={{ opacity: 0, height: 0, scale: 0.9 }}
                          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                          className="flex justify-center gap-1.5 mt-3 overflow-hidden w-full px-0.5"
                        >
                          {circle.options.map((opt, optIdx) => (
                            <button
                              key={optIdx}
                              onClick={async (e) => {
                                e.stopPropagation();
                                await opt.action();
                              }}
                              className="flex-1 aspect-square rounded-full border bg-[#050505] flex flex-col items-center justify-center text-[10px] font-mono font-black transition-all duration-300 active:scale-90 cursor-pointer min-w-0"
                              style={{
                                borderColor: `${circle.color}40`,
                                color: circle.color,
                                boxShadow: `0 0 15px ${circle.glowColor}`
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = circle.color;
                                e.currentTarget.style.color = '#000000';
                                e.currentTarget.style.borderColor = 'transparent';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = '#050505';
                                e.currentTarget.style.color = circle.color;
                                e.currentTarget.style.borderColor = `${circle.color}40`;
                              }}
                            >
                              <span className="text-[9px] sm:text-[9.5px] font-extrabold">{opt.label}</span>
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </motion.div>
            );
          })()}

      {/* DYNAMIC SCREEN VIEWER CONTAINER */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="space-y-4"
        >
          {activeTab === 'athlete_id' && (
            <motion.div 
              id="decluttered-profile-viewer"
              className="border border-white/5 rounded-[24px] bg-[#0A0A0C] p-5 sm:p-6 shadow-xl space-y-6"
            >
              <div className="text-center">
                <span className="text-[#D4FF00] font-mono text-[9px] font-black tracking-widest block uppercase">ATHLETE PASSPORT ACCESS</span>
                <h2 className="text-xl font-mono font-bold uppercase text-white mt-1">MUTANT VERIFICATION</h2>
              </div>

              {/* TEAM DIVISION SELECTOR */}
              <div className="space-y-3 bg-black/45 border border-white/5 p-4 rounded-2xl">
                <span className="text-[9px] font-mono text-zinc-400 block uppercase tracking-wider text-center font-bold">
                  Division Squad Affiliation
                </span>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {[
                    { id: 'TEAM BULK', desc: 'SIZE & GAINS', color: '#D4FF00' },
                    { id: 'TEAM SHRED', desc: 'SHRED PRECISION', color: '#ff4a4a' },
                    { id: 'TEAM POWER', desc: 'STRENGTH LIFT', color: '#00ddff' },
                    { id: 'TEAM ATHLETIC', desc: 'ENDURANCE SPEED', color: '#ff9900' }
                  ].map((team) => (
                    <button
                      key={team.id}
                      onClick={() => setSelectedTeam(team.id)}
                      type="button"
                      style={{ 
                        borderColor: selectedTeam === team.id ? team.color : 'rgba(255,255,255,0.05)',
                        boxShadow: selectedTeam === team.id ? `0 0 10px ${team.color}20` : 'none'
                      }}
                      className={cn(
                        "p-2 rounded-xl border text-center transition-all duration-200 cursor-pointer flex flex-col items-center justify-center",
                        selectedTeam === team.id ? "bg-zinc-900" : "bg-black/20 hover:bg-white/5 border-white/5"
                      )}
                    >
                      <span 
                        style={{ color: selectedTeam === team.id ? team.color : '#a1a1aa' }}
                        className="text-[9px] font-mono font-bold tracking-wider uppercase"
                      >
                        {team.id}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* HIGH-FIDELITY ATHLETE SIGNATURE PASSPORT DISPLAY CARD */}
              <div className="max-w-md mx-auto relative p-1 bg-zinc-950 rounded-2xl border border-white/5 shadow-xl">
                <div 
                  ref={cardRef} 
                  className="relative bg-[#060608] border border-[#D4FF00]/15 rounded-xl p-5 text-left overflow-hidden select-none"
                  id="status-card-preview"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-[#D4FF00]/5 rounded-full blur-2xl pointer-events-none" />
                  
                  <div className="flex items-center justify-between border-b border-white/10 pb-2.5 mb-4">
                    <div className="flex items-center gap-1.5">
                      <Crown className="w-3.5 h-3.5 text-[#D4FF00]" />
                      <span className="text-[9px] font-mono font-bold text-white tracking-widest uppercase">
                        WHEYO ATHLETE PASSPORT
                      </span>
                    </div>
                    <div className="text-[8px] font-mono text-[#D4FF00]/80 uppercase tracking-widest font-black flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#D4FF00] inline-block" />
                      PLATINUM
                    </div>
                  </div>

                  <div className="flex justify-between items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <span className="text-[7.5px] font-mono text-zinc-500 uppercase tracking-widest block leading-none">VERIFIED MEMBER</span>
                      <h3 className="text-base font-mono font-bold text-white uppercase mt-1 truncate">
                        {(profile?.full_name || user?.email?.split('@')[0] || 'Athlete').toUpperCase()}
                      </h3>
                      
                      <div className="flex gap-2 mt-4">
                        <div className="bg-white/5 border border-white/5 px-2 py-1 rounded-lg flex items-center gap-1.5">
                          <Flame className="w-3 h-3 text-[#D4FF00]" />
                          <div>
                            <span className="text-[5px] text-zinc-400 font-mono block uppercase leading-none">STREAK</span>
                            <span className="text-[8.5px] font-mono font-bold text-[#D4FF00] block mt-0.5 leading-none">{activeStreak} Days</span>
                          </div>
                        </div>

                        <div className="bg-white/5 border border-white/5 px-2 py-1 rounded-lg flex items-center gap-1.5">
                          <CheckCircle className="w-3 h-3 text-white" />
                          <div>
                            <span className="text-[5px] text-zinc-400 font-mono block uppercase leading-none">DIVISION</span>
                            <span className="text-[8.5px] font-mono font-bold text-white block mt-0.5 leading-none truncate max-w-[80px]">{selectedTeam}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-center justify-center border-l border-white/5 pl-4 min-w-[80px]">
                      <span className="text-[5.5px] text-zinc-500 font-mono font-bold uppercase tracking-wider mb-1">CONSISTENCY</span>
                      <div className="relative w-10 h-10 rounded-full border border-white/5 flex items-center justify-center bg-black/60 shadow-[0_0_10px_rgba(212,255,0,0.05)]">
                        <div className="text-center">
                          <span className="text-[10px] font-mono font-black text-[#D4FF00] block leading-none">{universalStats.consistencyRate}%</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="h-px bg-white/5 my-3" />

                  {/* Micro averages cells */}
                  <div className="grid grid-cols-4 gap-1.5">
                    {[
                      { l: 'PROTEIN', v: `${universalStats.avgProtein}g` },
                      { l: 'WATER', v: `${universalStats.avgWater}ml` },
                      { l: 'SLEEP', v: `${universalStats.avgSleep}h` },
                      { l: 'WEIGHT', v: universalStats.avgWeight > 0 ? `${universalStats.avgWeight}kg` : 'N/A' }
                    ].map((cell, i) => (
                      <div key={i} className="bg-white/5 border border-white/5 p-1 rounded-lg text-center font-mono">
                        <span className="text-[5px] text-zinc-500 font-mono block uppercase truncate">{cell.l}</span>
                        <span className="text-[8px] font-mono font-bold text-white block mt-0.5 truncate">{cell.v}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {sharingStatus && (
                <div className="text-center text-[9px] font-mono text-[#D4FF00] uppercase tracking-wider">
                  {sharingStatus}
                </div>
              )}

              {/* PASS ACTION CONTROLS */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 max-w-md mx-auto pt-2">
                <button
                  onClick={handleShareCard}
                  className="bg-[#D4FF00] hover:bg-white text-black font-mono text-[10px] font-black uppercase tracking-widest py-3 px-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95"
                >
                  <Share2 className="w-3.5 h-3.5" /> SHARE PROGRESS
                </button>
                <button
                  onClick={handleDownloadCardPNG}
                  className="bg-zinc-900 border border-white/5 text-zinc-300 hover:text-white font-mono text-[10px] font-black uppercase tracking-widest py-3 px-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95"
                >
                  <Image className="w-3.5 h-3.5" /> DOWNLOAD PNG
                </button>
                <button
                  onClick={handleExportAnabolicReport}
                  className="bg-zinc-900 border border-white/5 text-zinc-300 hover:text-white font-mono text-[10px] font-black uppercase tracking-widest py-3 px-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95"
                >
                  <Download className="w-3.5 h-3.5" /> DOWNLOAD PDF
                </button>
              </div>

              {/* REMOVED ATHLETE PASSPORT SIGN OUT TO KEEP IT ONLY AT THE BOTTOMST MAIN ZONE */}
            </motion.div>
          )}

          {/* ORB 4: FAVORITES (REPLACES STRENGTH RECORDS 1RM LOGGING) */}
          {activeTab === 'exercises_pr' && (
            <motion.div 
              id="decluttered-profile-viewer"
              className="border border-white/5 rounded-[24px] bg-[#0A0A0C] p-5 sm:p-6 shadow-xl space-y-6 text-left"
            >
              <div className="border-b border-white/5 pb-4 text-center sm:text-left">
                <h2 className="text-xl font-mono font-bold uppercase text-white flex items-center justify-center sm:justify-start gap-2">
                  <Heart className="w-5 h-5 text-pink-500 fill-current" />
                  FAVORITE HIGH-PROTEIN FUELS
                </h2>
              </div>

              {/* Favorites list display */}
              <div className="space-y-4">
                {favorites && favorites.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                    {favorites.map((item) => (
                      <div 
                        key={item.id} 
                        className="bg-black/40 border border-white/5 hover:border-pink-500/20 rounded-2xl p-4 flex flex-col justify-between gap-4 transition-all hover:bg-gradient-to-b hover:from-pink-500/[0.01]"
                      >
                        <div className="flex items-start gap-3.5">
                          {item.image ? (
                            <img 
                              src={item.image} 
                              alt={item.name} 
                              className="w-14 h-14 rounded-xl object-cover shrink-0 border border-white/5 select-none"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className="w-14 h-14 rounded-xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center shrink-0">
                              <Heart className="w-7 h-7 text-pink-400 fill-current" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-bold text-white text-xs uppercase truncate block">{item.name}</span>
                              <span className={cn(
                                "w-1.5 h-1.5 rounded-full shrink-0",
                                item.isVeg ? "bg-emerald-500" : "bg-red-500"
                              )} />
                            </div>
                            <span className="text-[9.5px] font-mono text-zinc-400 block mt-0.5 uppercase">
                              {item.protein}g Protein | {item.calories} kCal
                            </span>
                            <span className="text-[10px] font-mono text-[#D4FF00] block mt-1.5 font-bold">
                              PRICE: ₹{item.price || 149}
                            </span>
                          </div>
                        </div>

                        <div className="flex gap-2 w-full mt-auto">
                          {/* QUICK RE-ORDER BUTTON */}
                          <button
                            type="button"
                            onClick={() => {
                              addItem(item);
                              setIsCartOpen(true);
                            }}
                            className="flex-1 py-2 bg-pink-500 hover:bg-white text-black font-mono font-black text-[9.5px] uppercase rounded-xl transition-all cursor-pointer whitespace-nowrap active:scale-95 text-center flex items-center justify-center gap-1.5 font-bold shadow-lg shadow-pink-500/10"
                          >
                            <ShoppingCart className="w-3.5 h-3.5" /> RE-ORDER NOW
                          </button>

                          {/* REMOVE BUTTON */}
                          <button
                            type="button"
                            onClick={() => toggleFavoriteProduct(item.id)}
                            className="px-3 py-2 bg-zinc-900 hover:bg-red-500/20 text-zinc-400 hover:text-red-400 border border-white/5 hover:border-red-500/20 font-mono font-black text-[9.5px] uppercase rounded-xl transition-all cursor-pointer whitespace-nowrap active:scale-95 text-center"
                            title="Remove from Favorites"
                          >
                            REMOVE
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-zinc-500 border border-dashed border-white/5 rounded-2xl">
                    <Heart className="w-10 h-10 text-zinc-600 block mx-auto mb-2 animate-pulse" />
                    <span className="text-[11px] font-mono uppercase block font-bold">NO FAVORITE FUELS SAVED YET</span>
                    <p className="text-[9px] font-mono text-zinc-600 uppercase max-w-xs mx-auto mt-1">
                      Navigate to the Meal Book selection panel to bookmark your standard daily fueling items!
                    </p>
                    <button 
                      type="button" 
                      onClick={() => { 
                        setActiveTab('meal_diary');
                        setMealSubTab('restock');
                      }}
                      className="px-4 py-2.5 bg-[#F87171]/10 hover:bg-[#F87171] border border-[#F87171]/20 hover:border-transparent text-[#F87171] hover:text-black font-mono font-bold text-[9.5px] uppercase mt-4 rounded-xl transition-all cursor-pointer active:scale-95 inline-block"
                    >
                      Browse Meal Book
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'diurnal_log' && (
            <motion.div 
              id="decluttered-profile-viewer"
              className="bg-[#0A0A0C] border border-white/5 rounded-[24px] p-6 relative overflow-hidden shadow-xl space-y-6"
            >
              <div className="absolute top-0 right-0 w-44 h-44 bg-[#D4FF00]/[0.02] rounded-full blur-3xl pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-500/[0.01] rounded-full blur-2xl pointer-events-none" />
              
              <div className="border-b border-white/5 pb-4 text-center sm:text-left">
                <div>
                  <h2 className="text-xs font-mono font-black text-white uppercase tracking-widest leading-none flex items-center justify-center sm:justify-start gap-1.5">
                    <Zap className="w-4 h-4 text-[#FCD34D]" />
                    DAILY WORKOUT & FITNESS LOG
                  </h2>
                </div>
              </div>

              {/* THREE INTERACTIVE NAVIGATION CIRCLES FOR NUTRITION, KINETIC, RECOVERY */}
              <div className="grid grid-cols-3 gap-2 sm:gap-8 md:gap-12 py-4 border-b border-white/[0.04] mb-2 justify-items-center max-w-md mx-auto w-full">
                {[
                  {
                    id: 'nutrition',
                    label: 'NUTRITION',
                    icon: Flame,
                    color: '#D4FF00',
                    glow: 'rgba(212,255,0,0.15)',
                    desc: 'Protein & Hydration',
                    progress: targetProteinGoal > 0 ? Math.min(100, Math.round((dailyProtein / targetProteinGoal) * 100)) : 0
                  },
                  {
                    id: 'fitness',
                    label: 'KINETIC',
                    icon: Dumbbell,
                    color: '#F97316',
                    glow: 'rgba(249,115,22,0.15)',
                    desc: 'Heart & Movement',
                    progress: Math.min(100, Math.round((dailySteps / 10000) * 100))
                  },
                  {
                    id: 'recovery',
                    label: 'RECOVERY',
                    icon: BrainCircuit,
                    color: '#3B82F6',
                    glow: 'rgba(59,130,246,0.15)',
                    desc: 'CNS & Sleep Recovery',
                    progress: Math.min(100, Math.round((sleepLevel / 8) * 100))
                  }
                ].map((circle) => {
                  const isActive = physicalLogSubTab === circle.id;
                  const IconComponent = circle.icon;
                  return (
                    <button
                      key={circle.id}
                      type="button"
                      onClick={() => {
                        setPhysicalLogSubTab(circle.id as any);
                        setActiveLogCircle(null);
                      }}
                      className="flex flex-col items-center group focus:outline-none cursor-pointer w-24 sm:w-[130px] shrink-0"
                    >
                      {/* Modern circular container */}
                      <div className="relative flex items-center justify-center w-16 h-16 sm:w-24 sm:h-24 transition-all duration-300">
                        {/* Animated active/inactive background circle/rings */}
                        <div 
                          className={cn(
                            "absolute inset-0 rounded-full transition-all duration-300 border",
                            isActive 
                              ? "border-transparent" 
                              : "border-white/5 group-hover:border-white/10"
                          )}
                          style={{
                            backgroundColor: isActive ? 'rgba(0, 0, 0, 0.45)' : 'transparent',
                            boxShadow: isActive ? `0 0 20px ${circle.glow}, inset 0 0 10px ${circle.glow}` : 'none',
                          }}
                        />

                        {/* SVG Progress Circle around the border */}
                        <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
                          <circle
                            cx="50"
                            cy="50"
                            r="43"
                            className="stroke-white/[0.02] fill-none"
                            strokeWidth="1.5"
                          />
                          <motion.circle
                            cx="50"
                            cy="50"
                            r="43"
                            className="fill-none"
                            stroke={isActive ? circle.color : 'rgba(255, 255, 255, 0.1)'}
                            strokeWidth={isActive ? "3.5" : "1.5"}
                            strokeDasharray="270"
                            initial={{ strokeDashoffset: 270 }}
                            animate={{ strokeDashoffset: 270 - (270 * circle.progress) / 100 }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                            strokeLinecap="round"
                          />
                        </svg>

                        {/* Inner content */}
                        <div className="flex flex-col items-center justify-center z-10 space-y-0.5">
                          <IconComponent 
                            className={cn(
                              "w-4 h-4 sm:w-5 sm:h-5 transition-all duration-300",
                              isActive ? "scale-110" : "text-zinc-500 group-hover:text-zinc-300"
                            )} 
                            style={{ color: isActive ? circle.color : undefined }}
                          />
                          <span 
                            className={cn(
                              "text-[7.5px] sm:text-[8px] font-mono font-black tracking-widest block transition-all",
                              isActive ? "opacity-100" : "text-zinc-600 group-hover:text-zinc-400"
                            )}
                            style={{ color: isActive ? circle.color : undefined }}
                          >
                            {circle.progress}%
                          </span>
                        </div>
                      </div>

                      {/* Outer text details */}
                      <div className="text-center mt-3 space-y-0.5">
                        <span 
                          className={cn(
                            "text-[9px] sm:text-[10px] font-mono font-black tracking-widest uppercase block transition-colors duration-300",
                            isActive ? "text-white" : "text-zinc-500 group-hover:text-zinc-300"
                          )}
                          style={isActive ? { textShadow: `0 0 8px ${circle.color}40` } : undefined}
                        >
                          {circle.label}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* ACTIVE SUB-TAB CONTENT */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={physicalLogSubTab}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.15 }}
                  className="space-y-6 py-2"
                >
                  {physicalLogSubTab === 'nutrition' && (
                    <div className="space-y-6">
                      <p className="text-[10px] font-mono text-[#D4FF00] uppercase tracking-wider font-extrabold border-b border-white/5 pb-2 text-left">
                        1. LIQUID & POWDER LOGGING
                      </p>

                      {/* Protein scoops */}
                      <div className="bg-black/30 p-5 rounded-2xl border border-white/5 space-y-3.5 text-left">
                        <div className="flex justify-between items-baseline">
                          <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider font-bold">Whey Protein Scoop</span>
                          <span className="text-sm font-mono text-white font-bold">{dailyProtein}g / {targetProteinGoal}g</span>
                        </div>
                        <div className="flex gap-2">
                          {[15, 25, 45].map(v => (
                            <button
                              key={v}
                              onClick={() => incProtein(v)}
                              className="flex-1 py-2.5 bg-white/[0.03] hover:bg-[#D4FF00] hover:text-black border border-white/5 hover:border-transparent text-gray-300 rounded-xl text-[10px] font-mono font-black uppercase transition-all duration-150 active:scale-95 cursor-pointer"
                            >
                              +{v}g Scoop
                            </button>
                          ))}
                        </div>
                        <div className="flex gap-2">
                          <input
                            type="number"
                            placeholder="Log custom grams..."
                            id="custom-protein-input"
                            className="bg-black border border-white/5 rounded-xl px-3 py-2 text-xs text-white font-mono w-full focus:outline-none focus:border-[#D4FF00]/45"
                            onKeyDown={async (e) => {
                              if (e.key === 'Enter') {
                                const val = Number((e.target as HTMLInputElement).value);
                                if (val > 0) {
                                  await incProtein(val);
                                  (e.target as HTMLInputElement).value = '';
                                }
                              }
                            }}
                          />
                          <button
                            onClick={async () => {
                              const el = document.getElementById('custom-protein-input') as HTMLInputElement;
                              const val = Number(el?.value || 0);
                              if (val > 0) {
                                await incProtein(val);
                                el.value = '';
                              }
                            }}
                            className="px-4 bg-[#D4FF00]/10 border border-[#D4FF00]/25 text-[#D4FF00] rounded-xl text-[10px] font-mono font-bold uppercase hover:bg-[#D4FF00] hover:text-black transition-all cursor-pointer whitespace-nowrap"
                          >
                            ADD SCOOP
                          </button>
                        </div>
                      </div>

                      {/* Calories input */}
                      <div className="bg-black/30 p-5 rounded-2xl border border-white/5 space-y-3.5 text-left">
                        <div className="flex justify-between items-baseline">
                          <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider font-bold">Consumable Calories Intake</span>
                          <span className="text-sm font-mono text-white font-bold">{dailyCalories} / {targetCalGoal} kcal</span>
                        </div>
                        <div className="flex gap-2">
                          {[100, 250, 500].map(v => (
                            <button
                              key={v}
                              onClick={() => incCalories(v)}
                              className="flex-1 py-2.5 bg-white/[0.03] hover:bg-orange-500 hover:text-white border border-white/5 hover:border-transparent text-gray-300 rounded-xl text-[10px] font-mono font-black uppercase transition-all duration-150 active:scale-95 cursor-pointer"
                            >
                              +{v} kcal
                            </button>
                          ))}
                        </div>
                        <div className="flex gap-2">
                          <input
                            type="number"
                            placeholder="Log custom calories..."
                            id="custom-calories-input"
                            className="bg-black border border-white/5 rounded-xl px-3 py-2 text-xs text-white font-mono w-full focus:outline-none focus:border-orange-500/45"
                            onKeyDown={async (e) => {
                              if (e.key === 'Enter') {
                                const val = Number((e.target as HTMLInputElement).value);
                                if (val > 0) {
                                  await incCalories(val);
                                  (e.target as HTMLInputElement).value = '';
                                }
                              }
                            }}
                          />
                          <button
                            onClick={async () => {
                              const el = document.getElementById('custom-calories-input') as HTMLInputElement;
                              const val = Number(el?.value || 0);
                              if (val > 0) {
                                await incCalories(val);
                                el.value = '';
                              }
                            }}
                            className="px-4 bg-orange-500/10 border border-orange-500/25 text-orange-400 rounded-xl text-[10px] font-mono font-bold uppercase hover:bg-orange-500 hover:text-white transition-all cursor-pointer whitespace-nowrap"
                          >
                            ADD INTENSE
                          </button>
                        </div>
                      </div>

                      {/* Water logs */}
                      <div className="bg-black/30 p-5 rounded-2xl border border-white/5 space-y-3.5 text-left">
                        <div className="flex justify-between items-baseline">
                          <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider font-bold">Hydration Volume</span>
                          <span className="text-sm font-mono text-blue-400 font-bold">{hydrationLevel}ml / {targetWaterGoal}ml</span>
                        </div>
                        <div className="flex gap-2">
                          {[250, 500, 1000].map(v => (
                            <button
                              key={v}
                              onClick={() => incWater(v)}
                              className="flex-1 py-2.5 bg-white/[0.03] hover:bg-blue-500 hover:text-white border border-white/5 hover:border-transparent text-gray-300 rounded-xl text-[10px] font-mono font-black uppercase transition-all duration-150 active:scale-95 cursor-pointer"
                            >
                              +{v === 1000 ? "1L" : `${v}ml`}
                            </button>
                          ))}
                        </div>
                        <div className="flex gap-2">
                          <input
                            type="number"
                            placeholder="Log custom hydration (ml)..."
                            id="custom-water-input"
                            className="bg-black border border-white/5 rounded-xl px-3 py-2 text-xs text-white font-mono w-full focus:outline-none focus:border-blue-500/40"
                            onKeyDown={async (e) => {
                              if (e.key === 'Enter') {
                                const val = Number((e.target as HTMLInputElement).value);
                                if (val > 0) {
                                  await incWater(val);
                                  (e.target as HTMLInputElement).value = '';
                                }
                              }
                            }}
                          />
                          <button
                            onClick={async () => {
                              const el = document.getElementById('custom-water-input') as HTMLInputElement;
                              const val = Number(el?.value || 0);
                              if (val > 0) {
                                await incWater(val);
                                el.value = '';
                              }
                            }}
                            className="px-4 bg-blue-500/10 border border-blue-500/25 text-blue-400 rounded-xl text-[10px] font-mono font-bold uppercase hover:bg-blue-500 hover:text-white transition-all cursor-pointer whitespace-nowrap"
                          >
                            DRINK
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {physicalLogSubTab === 'fitness' && (
                    <div className="space-y-6">
                      <p className="text-[10px] font-mono text-[#FCD34D] uppercase tracking-wider font-extrabold border-b border-white/5 pb-2 text-left">
                        2. MOBILE KINETIC TRACKERS & HEART RATE
                      </p>

                      {/* Steps Counter */}
                      <div className="bg-black/30 p-5 rounded-2xl border border-white/5 space-y-4 text-left">
                        <div className="flex justify-between items-baseline">
                          <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider font-bold">Daily Step Counter</span>
                          <span className="text-sm font-mono text-zinc-200 font-bold">{dailySteps.toLocaleString()} / 10,000 steps</span>
                        </div>
                        
                        <div className="w-full bg-white/5 rounded-full h-2.5 overflow-hidden relative border border-white/5">
                          <div 
                            className="bg-gradient-to-r from-amber-500 to-[#D4FF00] h-full rounded-full transition-all duration-300" 
                            style={{ width: `${Math.min(100, (dailySteps / 10000) * 100)}%` }}
                          />
                        </div>

                        <div className="text-[9.5px] font-mono text-zinc-400 flex justify-between uppercase">
                          <span>Progress: {Math.round((dailySteps / 10000) * 100)}%</span>
                          <span className="text-[#D4FF00] font-black mr-0.5 font-bold">Burned ~{Math.round(dailySteps * 0.04)} kCal</span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 mt-1">
                          <button 
                            onClick={() => handleUpdateSteps(dailySteps + 1500)}
                            className="py-2.5 bg-white/[0.03] hover:bg-white/10 active:scale-95 transition-all text-[10px] font-mono text-white uppercase rounded-xl border border-white/5 cursor-pointer font-bold animate-none"
                          >
                            +1.5K Steps Quick
                          </button>
                          <button 
                            onClick={() => handleUpdateSteps(dailySteps + 3500)}
                            className="py-2.5 bg-white/[0.03] hover:bg-white/10 active:scale-95 transition-all text-[10px] font-mono text-white uppercase rounded-xl border border-white/5 cursor-pointer font-bold animate-none"
                          >
                            +3.5K Active Jog
                          </button>
                        </div>

                        <div className="flex gap-2">
                          <input 
                            type="number"
                            placeholder="Log custom steps count..."
                            id="custom-steps-input"
                            className="bg-black border border-white/5 rounded-xl px-3 py-2 text-xs text-white font-mono w-full focus:outline-none focus:border-[#D4FF00]/45"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                const val = Number((e.target as HTMLInputElement).value);
                                if (val > 0) {
                                  handleUpdateSteps(val);
                                  (e.target as HTMLInputElement).value = '';
                                }
                              }
                            }}
                          />
                          <button 
                            onClick={() => {
                              const el = document.getElementById('custom-steps-input') as HTMLInputElement;
                              const val = Number(el?.value || 0);
                              if (val > 0) {
                                handleUpdateSteps(val);
                                el.value = '';
                              }
                            }}
                            className="px-4 bg-amber-500/10 border border-amber-500/25 text-amber-400 rounded-xl text-[10px] font-mono font-bold uppercase hover:bg-amber-500 hover:text-black transition-all cursor-pointer whitespace-nowrap"
                          >
                            LOG STEPS
                          </button>
                        </div>
                      </div>

                      {/* Exertion active minutes tracker */}
                      <div className="bg-black/30 p-5 rounded-2xl border border-white/5 space-y-4 text-left">
                        <div className="flex justify-between items-baseline">
                          <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider font-bold">Active Cardio Minutes</span>
                          <span className="text-sm font-mono text-orange-400 font-bold">{activeMinutes}m / 45m Goal</span>
                        </div>
                        
                        <div className="flex gap-2 flex-wrap">
                          {[
                            { label: 'HIIT Run', mins: 15 },
                            { label: 'Cycling', mins: 20 },
                            { label: 'Heavy Lifts', mins: 45 }
                          ].map((act, idx) => (
                            <button
                              key={idx}
                              onClick={() => handleUpdateActiveMinutes(activeMinutes + act.mins)}
                              className="flex-1 py-2.5 hover:border-[#F97316]/50 bg-white/[0.03] hover:bg-[#F97316]/10 border border-white/5 text-gray-300 rounded-xl text-[9.5px] font-mono font-bold uppercase transition-all duration-150 cursor-pointer"
                            >
                              +{act.mins}m {act.label}
                            </button>
                          ))}
                        </div>

                        <div className="flex justify-end items-center pl-1">
                          <button 
                            onClick={() => handleUpdateActiveMinutes(0)}
                            className="text-[9px] font-mono text-red-400/60 hover:text-red-400 uppercase font-black tracking-wider cursor-pointer bg-transparent"
                          >
                            Reset Timer
                          </button>
                        </div>
                      </div>

                      {/* Heart rate tracker */}
                      <div className="bg-black/30 p-5 rounded-2xl border border-white/5 space-y-3.5 text-left">
                        <div className="flex justify-between items-baseline">
                          <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider font-bold">Resting Heart Rate (BPM)</span>
                          <span className="text-sm font-mono text-white font-bold">{heartRate} BPM</span>
                        </div>

                        <div className="flex gap-2">
                          <input 
                            type="number"
                            placeholder="Log pulse (e.g. 68)..."
                            id="heart-bpm-input"
                            className="bg-black border border-white/5 rounded-xl px-3 py-2 text-xs text-white font-mono w-full focus:outline-none focus:border-red-500/40"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                const val = Number((e.target as HTMLInputElement).value);
                                if (val > 0) {
                                  handleUpdateHeartRate(val);
                                  (e.target as HTMLInputElement).value = '';
                                }
                              }
                            }}
                          />
                          <button 
                            onClick={() => {
                              const el = document.getElementById('heart-bpm-input') as HTMLInputElement;
                              const val = Number(el?.value || 0);
                              if (val > 0) {
                                handleUpdateHeartRate(val);
                                el.value = '';
                              }
                            }}
                            className="px-4 bg-red-500/10 border border-red-500/25 text-red-400 rounded-xl text-[10px] font-mono font-bold uppercase hover:bg-red-500 hover:text-white transition-all cursor-pointer whitespace-nowrap"
                          >
                            RECORD BEAT
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {physicalLogSubTab === 'recovery' && (
                    <div className="space-y-6">
                      <p className="text-[10px] font-mono text-[#60A5FA] uppercase tracking-wider font-extrabold border-b border-white/5 pb-2 text-left">
                        3. RECOVERY & NERVOUS SYSTEM STRESS
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="bg-black/30 p-4 rounded-xl border border-white/5 space-y-2 text-left">
                          <span className="text-[9px] font-mono text-zinc-500 uppercase block">CNS Stress level</span>
                          <select
                            value={cnsStress}
                            onChange={(e) => logCns(e.target.value)}
                            className="w-full bg-[#07070A] border border-white/10 rounded-xl px-2.5 py-2 text-xs text-white font-mono focus:outline-none cursor-pointer hover:border-white/20 transition-all"
                          >
                            <option value="Low Stress">Low Stress (Calm System)</option>
                            <option value="Normal">Normal (Stabilized State)</option>
                            <option value="High Fatigued">Severe (Depleted / Burned)</option>
                          </select>
                        </div>

                        <div className="bg-black/30 p-4 rounded-xl border border-white/5 space-y-2 text-left">
                          <span className="text-[9px] font-mono text-zinc-500 uppercase block">Muscle Soreness Score</span>
                          <select
                            value={sorenessLevel}
                            onChange={(e) => logSoreness(e.target.value)}
                            className="w-full bg-[#07070A] border border-white/10 rounded-xl px-2.5 py-2 text-xs text-white font-mono focus:outline-none cursor-pointer hover:border-white/20 transition-all"
                          >
                            <option value="Fresh (Perfect)">Fresh (Fully Ready)</option>
                            <option value="Normal State">Normal (Adapting/Slight Tightness)</option>
                            <option value="Sore / Tired">Sore (Muscle Trauma / Strain)</option>
                            <option value="Highly Damaged">Highly Sore (Absolute Rest Advocated)</option>
                          </select>
                        </div>
                      </div>

                      {/* Sleep Hours */}
                      <div className="bg-black/30 p-5 rounded-2xl border border-white/5 space-y-3.5 text-left">
                        <div className="flex justify-between items-baseline">
                          <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider font-bold">Sleep Hours Logged</span>
                          <span className="text-sm font-mono text-white font-bold">{sleepLevel}h</span>
                        </div>
                        <div className="flex gap-2">
                          <input
                            type="number"
                            placeholder="Log hours (e.g. 8).."
                            id="sleep-hours-direct-input"
                            className="bg-[#07070A] border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono w-full focus:outline-none focus:border-indigo-500/40"
                            onKeyDown={async (e) => {
                              if (e.key === 'Enter') {
                                const val = Number((e.target as HTMLInputElement).value);
                                if (val > 0) {
                                  await applyBiomarkerChanges({ sleep_hours: val });
                                  (e.target as HTMLInputElement).value = '';
                                }
                              }
                            }}
                          />
                          <button
                            onClick={async () => {
                              const el = document.getElementById('sleep-hours-direct-input') as HTMLInputElement;
                              const val = Number(el?.value || 0);
                              if (val > 0) {
                                await applyBiomarkerChanges({ sleep_hours: val });
                                el.value = '';
                              }
                            }}
                            className="px-4 bg-indigo-500/10 border border-indigo-500/25 text-indigo-400 rounded-xl text-[10px] font-mono font-bold uppercase hover:bg-indigo-500 hover:text-white transition-all cursor-pointer whitespace-nowrap"
                          >
                            SAVE SLEEP
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>

              {/* Highly minimal, clean static feedback text (Always Visible) */}
              <div className="bg-zinc-950 border border-white/5 p-4 rounded-2xl text-left font-mono mt-4">
                {(() => {
                  const sleepScore = Math.min(100, Math.round((sleepLevel / 8) * 100));
                  const cnsRating = cnsStress === 'Low Stress' ? 100 : cnsStress === 'Normal' ? 80 : 35;
                  const sorenessRating = sorenessLevel.includes('Fresh') ? 100 : sorenessLevel.includes('Normal') ? 80 : sorenessLevel.includes('Sore') ? 50 : 25;
                  const recoveryScore = Math.round((sleepScore + cnsRating + sorenessRating) / 3);

                  return (
                    <div className="flex items-center gap-3 text-xs justify-center sm:justify-start">
                      <span className="text-zinc-400 uppercase">Calculated Recovery State:</span>
                      <span className="text-white font-bold">{recoveryScore}%</span>
                    </div>
                  );
                })()}
              </div>

            </motion.div>
          )}

          {activeTab === 'meal_diary' && (
            <motion.div 
              id="decluttered-profile-viewer"
              className="bg-[#0A0A0C] border border-white/5 rounded-[24px] p-6 relative overflow-hidden shadow-xl space-y-6"
            >
              <div className="absolute top-0 right-0 w-44 h-44 bg-[#F87171]/[0.02] rounded-full blur-3xl pointer-events-none" />
              
              <div className="border-b border-white/5 pb-4 text-center sm:text-left">
                <h2 className="text-xs font-mono font-black text-white uppercase tracking-widest leading-none flex items-center justify-center sm:justify-start gap-2">
                  <ClipboardList className="w-4 h-4 text-[#F87171]" />
                  DAILY MEAL & NUTRITION DIARY
                </h2>
              </div>

              {/* TWO INTERACTIVE NESTED CIRCULAR SUB-TABS */}
              <div className="grid grid-cols-2 gap-1.5 sm:gap-6 mb-6 bg-black/25 p-3 sm:p-4 rounded-3xl border border-white/5 max-w-xs mx-auto justify-items-center w-full">
                {[
                  { id: 'log', label: 'LOGGING', color: '#F87171', glow: 'rgba(248,113,113,0.15)', desc: 'Entries & History' },
                  { id: 'restock', label: 'RESTOCK', color: '#D4FF00', glow: 'rgba(212,255,0,0.15)', desc: 'Concierge Store' }
                ].map((sub) => {
                  const isActive = mealSubTab === sub.id;
                  return (
                    <button
                      key={sub.id}
                      type="button"
                      onClick={() => setMealSubTab(sub.id as any)}
                      className="flex flex-col items-center group focus:outline-none cursor-pointer w-24 sm:w-[120px] shrink-0"
                    >
                      <div 
                        className={cn(
                          "w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all duration-300 relative bg-[#050505] overflow-hidden border",
                          isActive 
                            ? "scale-110 shadow-2xl" 
                            : "border-white/5 opacity-60 hover:opacity-100 hover:scale-105"
                        )}
                        style={{
                          borderColor: isActive ? sub.color : 'rgba(255,255,255,0.05)',
                          boxShadow: isActive ? `0 0 20px ${sub.glow}, inset 0 0 10px ${sub.glow}` : 'none'
                        }}
                      >
                        {/* Rotating Tech Outer Ring */}
                        <svg 
                          className={cn(
                            "absolute inset-0 w-full h-full transition-all duration-300 pointer-events-none",
                            isActive ? "animate-[spin_20s_linear_infinite]" : "opacity-40"
                          )} 
                          viewBox="0 0 100 100"
                        >
                          <circle
                            cx="50"
                            cy="50"
                            r="44"
                            className="fill-none"
                            stroke={isActive ? sub.color : "rgba(255,255,255,0.08)"}
                            strokeWidth={isActive ? "3" : "1.5"}
                            strokeDasharray={isActive ? "6, 4" : "4, 6"}
                          />
                        </svg>

                        <span className="text-[10px] font-mono font-black tracking-widest z-10" style={{ color: isActive ? sub.color : '#8A8A93' }}>
                          {sub.id === 'log' ? 'LOG' : 'SHOP'}
                        </span>
                      </div>
                      
                      <span 
                        className="text-[9px] font-mono uppercase tracking-widest mt-2 block font-extrabold transition-colors duration-200"
                        style={{ color: isActive ? sub.color : '#8A8A93' }}
                      >
                        {sub.label}
                      </span>
                    </button>
                  );
                })}
              </div>

              {mealSubTab === 'log' && (
                <div className="space-y-6">
                  {/* Customize log forms */}
                  <div className="bg-black/40 border border-white/5 p-4 rounded-xl space-y-3.5">
                    <span className="text-[9px] font-mono text-[#F87171] font-bold block uppercase tracking-wider text-center">
                      RECORD CUSTOM MEAL LOG
                    </span>
                    <form 
                      onSubmit={(e) => {
                        e.preventDefault();
                        if (customFoodName.trim()) {
                          handleAddCustomMeal(
                            customFoodName, 
                            Number(customFoodProtein || 0), 
                            Number(customFoodCalories || 0)
                          );
                          setCustomFoodName('');
                          setCustomFoodProtein('');
                          setCustomFoodCalories('');
                        }
                      }}
                      className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end"
                    >
                      <div className="space-y-1 text-left">
                        <span className="text-[8px] font-mono text-zinc-500 uppercase block">MEAL / FOOD ITEM NAME</span>
                        <input
                          type="text"
                          required
                          placeholder=""
                          className="w-full bg-black border border-white/5 rounded-xl px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none"
                          value={customFoodName}
                          onChange={(e) => setCustomFoodName(e.target.value)}
                        />
                      </div>

                      <div className="space-y-1 text-left">
                        <span className="text-[8px] font-mono text-zinc-500 uppercase block">PROTEIN (GRAMS)</span>
                        <input
                          type="number"
                          required
                          placeholder=""
                          className="w-full bg-black border border-white/5 rounded-xl px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none"
                          value={customFoodProtein}
                          onChange={(e) => setCustomFoodProtein(e.target.value)}
                        />
                      </div>

                      <div className="space-y-1 text-left">
                        <span className="text-[8px] font-mono text-zinc-500 uppercase block">CALORIES (KCAL)</span>
                        <input
                          type="number"
                          required
                          placeholder=""
                          className="w-full bg-black border border-white/5 rounded-xl px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none"
                          value={customFoodCalories}
                          onChange={(e) => setCustomFoodCalories(e.target.value)}
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full py-1.5 bg-[#F87171] hover:bg-white text-black font-mono font-bold text-xs uppercase rounded-xl transition-all cursor-pointer"
                      >
                        LOG MEAL
                      </button>
                    </form>
                  </div>

                  {/* Today's Meals logged list */}
                  <div className="bg-black/40 border border-white/5 p-4 rounded-xl space-y-2">
                    <span className="text-[9px] font-mono text-zinc-400 block uppercase tracking-wider text-left font-extrabold">SOLID MEALS LOGGED TODAY</span>
                    <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1 text-left">
                      {todayMeals.length > 0 ? (
                        todayMeals.map((item) => (
                          <div key={item.id} className="flex justify-between items-center bg-white/5 border border-white/5 p-2.5 rounded-lg text-xs font-mono">
                            <div>
                              <span className="font-bold text-white uppercase block">{item.name}</span>
                              <span className="text-[8.5px] text-zinc-500 font-medium block uppercase">{item.loggedAt || 'Logged Today'}</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-[#F87171] font-black text-right">{item.protein}g Protein | {item.calories} kcal</span>
                              <button 
                                onClick={() => handleDeleteMeal(item.id)}
                                className="text-zinc-500 hover:text-red-500 p-1 rounded transition-colors cursor-pointer"
                                title="Delete meal log"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-6 text-zinc-600">
                          <span className="text-[10px] font-mono uppercase block">NO SOLID MEALS LOGGED TODAY</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {mealSubTab === 'restock' && (
                <div className="space-y-6">
                  {/* MEAL LOGGING PROMO RECTANGLE IN ACCORDANCE WITH REQS */}
                  <div className="relative border border-white/10 bg-zinc-900/40 p-5 rounded-2xl overflow-hidden flex flex-col md:flex-row items-center justify-between gap-4 text-left shadow-none">
                    <div className="absolute top-0 right-0 px-3 py-1 bg-zinc-800 text-zinc-400 text-[9px] font-mono font-bold uppercase tracking-wider rounded-bl-xl">
                      SUBSCRIPTION ADVANTAGE
                    </div>
                    <div className="space-y-1 z-10 max-w-xl">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono text-[#F87171] uppercase tracking-widest font-bold">WHEYO PRO METABOLIC PRESETS</span>
                      </div>
                      <h4 className="text-sm font-mono font-bold text-white uppercase tracking-wide">WHEYO ACTIVE FUEL PACKS</h4>
                    </div>
                    <button 
                      onClick={() => {
                        const subTabEl = document.querySelector('button[title*="SUBSCRIPTIONS"]');
                        if (subTabEl) {
                          (subTabEl as HTMLButtonElement).click();
                        } else {
                          window.location.href = '#subscriptions';
                        }
                      }}
                      className="shrink-0 px-4 py-3 bg-[#F87171] hover:bg-white text-black font-mono font-black text-[10px] uppercase rounded-xl transition-all shadow-[0_0_15px_rgba(248,113,113,0.25)] active:scale-95 cursor-pointer whitespace-nowrap"
                    >
                      VIEW SUBSCRIPTIONS
                    </button>
                  </div>

                  {/* QUICK ADD WHEYO HIGH-PROTEIN MEALS BROWSER */}
                  <div id="meal-browser-section" className="border border-[#F87171]/20 bg-gradient-to-b from-[#F87171]/5 to-transparent p-5 rounded-2xl space-y-4 text-left">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5 pb-3">
                      <div>
                        <span className="text-[#F87171] font-mono text-[9px] font-black tracking-widest block uppercase">HEALTHY NUTRITION CONCIERGE</span>
                        <h3 className="text-sm font-mono font-bold text-white uppercase mt-0.5">FRESH METABOLIC PERFORMANCE BOWLS</h3>
                      </div>
                    </div>

                    {/* SEARCH AND FILTERS ROW */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <span className="text-[8px] font-mono text-zinc-500 uppercase pl-1 font-bold">Search Wheyo Meals</span>
                        <input 
                          type="text" 
                          placeholder="e.g. Chicken, Whey, Egg, Oats..."
                          value={catalogSearch}
                          onChange={(e) => setCatalogSearch(e.target.value)}
                          className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#F87171]/50 font-mono"
                        />
                      </div>
                      <div className="space-y-1">
                        <span className="text-[8px] font-mono text-zinc-500 uppercase pl-1 font-bold">Bio Preference Standard</span>
                        <div className="flex gap-1.5">
                          {['all', 'veg', 'nonveg'].map((pref) => (
                            <button
                              key={pref}
                              type="button"
                              onClick={() => setCatalogVegFilter(pref)}
                              className={cn(
                                "flex-1 py-1.5 text-[9px] font-mono uppercase font-black tracking-wider rounded-xl border transition-all cursor-pointer",
                                catalogVegFilter === pref
                                  ? "bg-[#F87171]/10 border-[#F87171]/30 text-[#F87171]"
                                  : "bg-black/30 border-white/5 text-zinc-400 hover:bg-white/5"
                              )}
                            >
                              {pref === 'all' ? 'All' : pref === 'veg' ? 'Veg' : 'Non-veg'}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* PRODUCT LISTING CONTAINER */}
                    <div className="max-h-[600px] overflow-y-auto space-y-4 pr-1 scrollbar-thin">
                      {filteredCatalogProducts && filteredCatalogProducts.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                          {filteredCatalogProducts.map((p) => {
                            const isFavorited = favorites.some((fav) => fav.id === p.id);
                            return (
                              <div 
                                key={p.id} 
                                className="bg-zinc-900/30 border border-white/5 rounded-2xl overflow-hidden flex flex-col justify-between hover:border-[#F87171]/40 transition-all group hover:bg-zinc-900/60 shadow-md"
                              >
                                {/* Meal Image and Indicator */}
                                <div className="relative">
                                  {p.image ? (
                                    <img 
                                      src={p.image} 
                                      alt={p.name} 
                                      className="w-full h-44 object-cover border-b border-white/5 select-none"
                                      referrerPolicy="no-referrer"
                                    />
                                  ) : (
                                    <div className="w-full h-44 bg-[#F87171]/15 flex items-center justify-center border-b border-white/5">
                                      <Plus className="w-8 h-8 text-[#F87171]" />
                                    </div>
                                  )}
                                  
                                  {/* Vegetarian status badge */}
                                  <div className="absolute top-3 left-3 bg-black/80 px-2.5 py-1 rounded-lg border border-white/10 flex items-center gap-1.5 backdrop-blur-md">
                                    <span className={cn(
                                      "w-2 h-2 rounded-full shrink-0",
                                      p.isVeg ? "bg-emerald-500" : "bg-red-500"
                                    )} />
                                    <span className="text-[8px] font-mono font-black text-white uppercase tracking-wider">
                                      {p.isVeg ? 'VEG' : 'NON-VEG'}
                                    </span>
                                  </div>
                                </div>

                                {/* Content Info & CTA */}
                                <div className="p-4 text-left space-y-3.5 flex-1 flex flex-col justify-between">
                                  <div className="space-y-1">
                                    <span className="font-black text-white text-sm uppercase tracking-wide line-clamp-2 block group-hover:text-[#F87171] transition-colors">
                                      {p.name}
                                    </span>
                                    <span className="text-[9px] font-mono text-zinc-400 block font-medium mt-0.5">
                                      {p.calories} kCal per serving
                                    </span>
                                  </div>

                                  {/* Thoroughly Display Protein and Cost */}
                                  <div className="grid grid-cols-2 gap-2 bg-black/40 border border-white/5 rounded-xl p-3 text-center">
                                    <div className="flex flex-col justify-center border-r border-white/5">
                                      <span className="text-[8px] font-mono text-zinc-500 uppercase font-black tracking-wider">PROTEIN CONTENT</span>
                                      <span className="text-sm font-mono font-black text-[#F87171] tracking-wide mt-0.5">
                                        {p.protein}g Protein
                                      </span>
                                    </div>
                                    <div className="flex flex-col justify-center">
                                      <span className="text-[8px] font-mono text-zinc-500 uppercase font-black tracking-wider">MEAL COST</span>
                                      <span className="text-sm font-mono font-black text-[#D4FF00] tracking-wide mt-0.5">
                                        ₹{p.price || 149}
                                      </span>
                                    </div>
                                  </div>

                                  {/* Action CTA Buttons */}
                                  <div className="space-y-2 pt-1.5">
                                    {/* MAIN HIGH-CONTRAST HIGHLIGHTED BUY BUTTON */}
                                    <button
                                      type="button"
                                      onClick={() => {
                                        addItem({
                                          id: p.id,
                                          name: p.name,
                                          price: p.price || 149,
                                          protein: p.protein,
                                          calories: p.calories,
                                          image: p.image || 'https://images.unsplash.com/photo-1546767060-221e94403013?w=800&q=80',
                                          isVeg: p.isVeg
                                        });
                                        setIsCartOpen(true);
                                      }}
                                      className="w-full py-2.5 bg-[#F87171] hover:bg-white text-black font-mono font-black text-[10px] uppercase rounded-xl transition-all cursor-pointer whitespace-nowrap active:scale-95 text-center flex items-center justify-center gap-1.5 shadow-[0_0_15px_rgba(248,113,113,0.3)] hover:shadow-none"
                                    >
                                      <ShoppingCart className="w-3.5 h-3.5" /> BUY MEAL NOW
                                    </button>

                                    {/* SECONDARY UTILITY ROW */}
                                    <div className="grid grid-cols-2 gap-2">
                                      <button
                                        type="button"
                                        onClick={() => toggleFavoriteProduct(p.id)}
                                        className={cn(
                                          "py-1.5 border font-mono font-black text-[8px] uppercase rounded-lg transition-all cursor-pointer active:scale-95 text-center flex items-center justify-center gap-1 min-w-[32px]",
                                          isFavorited 
                                            ? "bg-pink-500/15 border-pink-500/30 text-pink-400" 
                                            : "bg-zinc-800/40 border-white/5 text-zinc-400 hover:bg-zinc-800 hover:text-white"
                                        )}
                                        title={isFavorited ? "Remove from Favorites" : "Add to Favorites"}
                                      >
                                        <Heart className={cn("w-2.5 h-2.5", isFavorited ? "fill-current" : "")} />
                                        {isFavorited ? "FAVORITED" : "FAVORITE"}
                                      </button>

                                      <button
                                        type="button"
                                        onClick={() => {
                                          handleAddCustomMeal(p.name, p.protein, p.calories);
                                        }}
                                        className="py-1.5 bg-zinc-800/60 hover:bg-zinc-700 border border-white/5 text-zinc-300 font-mono font-black text-[8px] uppercase rounded-lg transition-all cursor-pointer active:scale-95 text-center flex items-center justify-center"
                                      >
                                        LOG TO DIARY
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-zinc-600 border border-dashed border-white/5 rounded-xl">
                          <span className="text-[10px] font-mono uppercase block">NO WHEYO MEALS FOUND CONTAINING "{catalogSearch}"</span>
                          <button 
                            type="button" 
                            onClick={() => { setCatalogSearch(''); setCatalogVegFilter('all'); }}
                            className="text-[9px] font-mono uppercase font-black text-[#F87171] underline mt-1 cursor-pointer block mx-auto"
                          >
                            RESET CATALOG FILTER
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'goal_targets' && (
            <motion.div 
              id="decluttered-profile-viewer"
              className="bg-[#0A0A0C] border border-white/5 rounded-[24px] p-6 relative overflow-hidden shadow-xl space-y-6"
            >
              <div className="absolute top-0 right-0 w-44 h-44 bg-[#FB923C]/[0.02] rounded-full blur-3xl pointer-events-none" />
              
              <div className="border-b border-white/5 pb-4 text-center sm:text-left">
                <h2 className="text-xs font-mono font-black text-white uppercase tracking-widest leading-none flex items-center justify-center sm:justify-start gap-2">
                  <Target className="w-4 h-4 text-[#FB923C]" />
                  GEOMETRIC TARGET CONSTRAINTS
                </h2>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1 text-left">
                    <label className="text-[9px] font-mono text-gray-500 uppercase pl-1 block">Personal Display Name</label>
                    <input 
                      type="text" 
                      value={settingsForm.full_name}
                      onChange={(e) => setSettingsForm({ ...settingsForm, full_name: e.target.value })}
                      className="w-full bg-black border border-white/5 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#FB923C]/50 font-mono"
                    />
                  </div>

                  <div className="space-y-1 text-left">
                    <label className="text-[9px] font-mono text-gray-400 uppercase pl-1 block">Mobile Contact No</label>
                    <input 
                      type="text" 
                      value={settingsForm.phone}
                      onChange={(e) => setSettingsForm({ ...settingsForm, phone: e.target.value })}
                      className="w-full bg-black border border-white/5 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#FB923C]/50 font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 text-left">
                  <div className="space-y-1">
                    <label className="text-[9px] font-mono text-gray-500 uppercase block pl-1">Protein (g)</label>
                    <input 
                      type="number" 
                      value={settingsForm.daily_protein_goal}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setSettingsForm({ ...settingsForm, daily_protein_goal: val });
                        setPassportProtein(val);
                      }}
                      className="w-full bg-black border border-white/5 rounded-xl px-2 py-1.5 text-xs text-white focus:outline-none focus:border-[#D4FF00]/50 font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-mono text-gray-500 uppercase block pl-1">Calories (kcal)</label>
                    <input 
                      type="number" 
                      value={settingsForm.daily_calorie_goal}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setSettingsForm({ ...settingsForm, daily_calorie_goal: val });
                        setPassportCalories(val);
                      }}
                      className="w-full bg-black border border-white/5 rounded-xl px-2 py-1.5 text-xs text-white focus:outline-none focus:border-orange-500/50 font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-mono text-gray-500 uppercase block pl-1">Water (ml)</label>
                    <input 
                      type="number" 
                      value={targetWaterGoal}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setTargetWaterGoal(val);
                        localStorage.setItem('target_water_goal', String(val));
                      }}
                      className="w-full bg-black border border-white/5 rounded-xl px-2 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500/50 font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-1 text-left">
                  <label className="text-[9px] font-mono text-gray-500 uppercase block pl-1">Active Fitness Goal</label>
                  <select 
                    value={settingsForm.fitness_goal}
                    onChange={(e) => {
                      setSettingsForm({ ...settingsForm, fitness_goal: e.target.value });
                      setPassportGoal(e.target.value);
                    }}
                    className="w-full bg-black border border-white/5 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none cursor-pointer font-mono"
                  >
                    <option value="Muscle Gain">Muscle Gain (Heavy Hypertrophy)</option>
                    <option value="Fat Loss">Fat Loss (Deficit Precision)</option>
                    <option value="Maintenance">Maintenance (Biological Equilibrium)</option>
                  </select>
                </div>

                <button
                  onClick={applySettings}
                  disabled={isSavingSettings}
                  className="w-full py-2.5 bg-[#D4FF00] disabled:bg-[#121214] disabled:text-gray-500 hover:bg-white text-black font-black uppercase rounded-xl text-xs tracking-wider transition-all duration-200 active:scale-95 cursor-pointer flex items-center justify-center gap-2 mt-4 shadow-sm font-mono text-[10px]"
                >
                  {isSavingSettings ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Synchronizing...</span>
                    </>
                  ) : (
                    <>
                      <SettingsIcon className="w-3.5 h-3.5" />
                      <span>SYNC PARAMETERS</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          )}

          {activeTab === 'bio_records' && (
            <motion.div 
              id="decluttered-profile-viewer"
              className="bg-[#0A0A0C] border border-white/5 rounded-[24px] p-6 relative overflow-hidden shadow-xl space-y-6"
            >
              <div className="absolute top-0 right-0 w-44 h-44 bg-[#60A5FA]/[0.02] rounded-full blur-3xl pointer-events-none" />
              
              <div className="border-b border-white/5 pb-4 text-center sm:text-left">
                <h2 className="text-xs font-mono font-black text-white uppercase tracking-widest leading-none flex items-center justify-center sm:justify-start gap-2">
                  <Activity className="w-4 h-4 text-[#60A5FA]" />
                  RECOVERY & HEALTH STATS
                </h2>
              </div>

              {/* FOUR INTERACTIVE CIRCULAR SUB-TABS LIKE PHYSICAL LOG */}
              <div className="grid grid-cols-4 gap-1.5 sm:gap-6 mb-6 bg-black/25 p-3 sm:p-4 rounded-3xl border border-white/5 max-w-md mx-auto justify-items-center w-full">
                {[
                  { id: 'sleep', label: 'SLEEP', color: '#60A5FA', glow: 'rgba(96,165,250,0.15)', desc: 'Rest Hours', icon: Moon },
                  { id: 'steps', label: 'STEPS', color: '#D4FF00', glow: 'rgba(212,255,0,0.15)', desc: 'Activity', icon: Footprints },
                  { id: 'heart', label: 'HEART', color: '#EF4444', glow: 'rgba(239,68,68,0.15)', desc: 'BPM & HRV', icon: Heart },
                  { id: 'energy', label: 'ENERGY', color: '#F59E0B', glow: 'rgba(245,158,11,0.15)', desc: 'Fatigue & Sore', icon: BrainCircuit }
                ].map((sub) => {
                  const isActive = recoverySubTab === sub.id;
                  const IconComponent = sub.icon;
                  return (
                    <button
                      key={sub.id}
                      type="button"
                      onClick={() => setRecoverySubTab(sub.id as any)}
                      className="flex flex-col items-center group focus:outline-none cursor-pointer w-14 sm:w-[80px] shrink-0"
                    >
                      <div 
                        className={cn(
                          "w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all duration-300 relative bg-[#050505] overflow-hidden border",
                          isActive 
                            ? "scale-110 shadow-2xl" 
                            : "border-white/5 opacity-60 hover:opacity-100 hover:scale-105"
                        )}
                        style={{
                          borderColor: isActive ? sub.color : 'rgba(255,255,255,0.05)',
                          boxShadow: isActive ? `0 0 20px ${sub.glow}, inset 0 0 10px ${sub.glow}` : 'none'
                        }}
                      >
                        {/* Rotating Tech Outer Ring */}
                        <svg 
                          className={cn(
                            "absolute inset-0 w-full h-full transition-all duration-300 pointer-events-none",
                            isActive ? "animate-[spin_20s_linear_infinite]" : "opacity-40"
                          )} 
                          viewBox="0 0 100 100"
                        >
                          <circle
                            cx="50"
                            cy="50"
                            r="44"
                            className="fill-none"
                            stroke={isActive ? sub.color : "rgba(255,255,255,0.08)"}
                            strokeWidth={isActive ? "3" : "1.5"}
                            strokeDasharray={isActive ? "6, 4" : "4, 6"}
                          />
                        </svg>

                        <IconComponent className="w-3.5 h-3.5 sm:w-4 sm:h-4 z-10" style={{ color: isActive ? sub.color : '#8A8A93' }} />
                      </div>
                      
                      <span 
                        className="text-[7.5px] sm:text-[8px] font-mono uppercase tracking-wider mt-2 block font-extrabold transition-colors duration-200 text-center"
                        style={{ color: isActive ? sub.color : '#8A8A93' }}
                      >
                        {sub.label}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Conditionally Rendered Subtabs */}
              <div className="space-y-4">
                {recoverySubTab === 'sleep' && (
                  <div className="bg-black/30 border border-white/5 p-4 rounded-xl space-y-4 text-left animate-none">
                    <span className="text-[9.5px] font-mono text-[#60A5FA] uppercase font-black tracking-widest block pl-0.5">
                      Daily Sleep Tracker
                    </span>

                    {/* Sleep Tracker */}
                    <div className="space-y-2 pt-1 text-left">
                      <div className="flex justify-between items-baseline">
                        <span className="text-[9px] font-mono text-gray-400 uppercase">Hours of sleep last night</span>
                        <span className="text-xs font-mono text-[#60A5FA] font-bold">{localSleep || String(sleepLevel || 7.5)} hrs</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <input 
                          type="range"
                          min="2"
                          max="14"
                          step="0.5"
                          value={Number(localSleep || sleepLevel || 7.5)}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setLocalSleep(String(val));
                            applyBiomarkerChanges({ sleep_hours: val });
                          }}
                          className="flex-1 h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-[#60A5FA]"
                        />
                        <input 
                          type="number"
                          min="0"
                          max="24"
                          step="0.1"
                          placeholder="7.5"
                          value={localSleep || String(sleepLevel || '')}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setLocalSleep(e.target.value);
                            applyBiomarkerChanges({ sleep_hours: val });
                          }}
                          className="bg-black border border-white/10 rounded-xl px-2 py-1 text-xs text-white font-mono w-16 text-center focus:outline-none focus:border-[#60A5FA]/50"
                        />
                      </div>
                      
                      <div className="w-full h-1.5 flex rounded-full overflow-hidden bg-black mt-2">
                        <div className="h-full w-[20%] bg-blue-500/80" title="Deep Sleep"></div>
                        <div className="h-full w-[25%] bg-blue-400/60" title="REM"></div>
                        <div className="h-full w-[50%] bg-zinc-600" title="Light"></div>
                        <div className="h-full w-[5%] bg-blue-900" title="Awake"></div>
                      </div>
                      <div className="flex justify-between text-[7px] font-mono text-zinc-500 uppercase leading-none mt-1">
                        <span>Deep Sleep (20%)</span>
                        <span>REM Sleep (25%)</span>
                        <span>Light Sleep (50%)</span>
                        <span>Awake Time (5%)</span>
                      </div>
                    </div>
                  </div>
                )}

                {recoverySubTab === 'steps' && (
                  <div className="bg-black/30 border border-white/5 p-4 rounded-xl space-y-4 text-left animate-none">
                    <span className="text-[9.5px] font-mono text-[#D4FF00] uppercase font-black tracking-widest block pl-0.5">
                      DAILY STEP TRACKER & CARDIO DISCIPLINE
                    </span>
                    
                    <div className="space-y-2 pt-1">
                      <div className="flex justify-between items-baseline">
                        <span className="text-[9px] font-mono text-gray-400 uppercase">Daily steps counter</span>
                        <span className="text-xs font-mono text-zinc-200 font-bold">{dailySteps.toLocaleString()} / 10,000 steps</span>
                      </div>
                      <div className="w-full bg-zinc-950 h-2 rounded-full overflow-hidden border border-white/5">
                        <div 
                          className="bg-[#D4FF00] h-full transition-all duration-500 rounded-full shadow-[0_0_10px_rgba(212,255,0,0.3)]" 
                          style={{ width: `${Math.min(100, (dailySteps / 10000) * 100)}%` }}
                        />
                      </div>
                      <div className="flex justify-between items-center text-[8px] font-mono text-zinc-500 uppercase mt-1">
                        <span>Progress: {Math.round((dailySteps / 10000) * 100)}%</span>
                        <span className="text-[#D4FF00] font-black font-bold">Burned ~{Math.round(dailySteps * 0.04)} kCal</span>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 pt-2">
                      <div className="flex gap-2 w-full sm:w-auto">
                        <button 
                          onClick={() => handleUpdateSteps(dailySteps + 1500)}
                          className="flex-1 sm:flex-none px-3 py-1.5 bg-[#D4FF00]/10 hover:bg-[#D4FF00] hover:text-black hover:border-transparent text-[8px] text-[#D4FF00] font-mono uppercase rounded-lg border border-[#D4FF00]/30 transition-all cursor-pointer font-bold shrink-0"
                        >
                          +1.5K Steps
                        </button>
                        <button 
                          onClick={() => handleUpdateSteps(dailySteps + 3500)}
                          className="flex-1 sm:flex-none px-3 py-1.5 bg-[#D4FF00]/10 hover:bg-[#D4FF00] hover:text-black hover:border-transparent text-[8px] text-[#D4FF00] font-mono uppercase rounded-lg border border-[#D4FF00]/30 transition-all cursor-pointer font-bold shrink-0"
                        >
                          +3.5K Steps
                        </button>
                      </div>

                      <div className="flex-1 relative flex items-center">
                        <input 
                          type="number" 
                          placeholder="Log custom steps count..."
                          id="recovery-steps-input"
                          className="w-full bg-black border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-[#D4FF00]/40 font-mono pr-14"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              const el = e.currentTarget;
                              const val = Number(el.value);
                              if (val > 0) {
                                handleUpdateSteps(val);
                                el.value = '';
                              }
                            }
                          }}
                        />
                        <button
                          onClick={() => {
                            const el = document.getElementById('recovery-steps-input') as HTMLInputElement;
                            if (el) {
                              const val = Number(el.value);
                              if (val > 0) {
                                handleUpdateSteps(val);
                                el.value = '';
                              }
                            }
                          }}
                          className="absolute right-1 px-2.5 py-1 bg-[#D4FF00] text-black font-mono font-black text-[8px] uppercase rounded-lg transition-all cursor-pointer hover:bg-white"
                        >
                          LOG
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {recoverySubTab === 'heart' && (
                  <div className="bg-black/30 border border-white/5 p-4 rounded-xl space-y-4 text-left animate-none">
                    <span className="text-[9.5px] font-mono text-[#EF4444] uppercase font-black tracking-widest block pl-0.5">
                      Heart Rate & Vitality
                    </span>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[9px] font-mono text-gray-500 uppercase tracking-wider block mb-1">Resting Heart Rate (BPM)</label>
                        <input 
                          type="number" 
                          min="30"
                          max="150"
                          value={heartRate || ''}
                          placeholder="68"
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setHeartRate(val);
                            localStorage.setItem(`heart_rate_${new Date().toISOString().split('T')[0]}`, String(val));
                          }}
                          className="w-full bg-black border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-white font-mono text-center focus:outline-none focus:border-[#EF4444]/40"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] font-mono text-gray-500 uppercase tracking-wider block mb-1">Heart Rate Variability (HRV ms)</label>
                        <input 
                          type="number" 
                          min="10"
                          max="200"
                          value={hrv || ''}
                          placeholder="72"
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setHrv(val);
                            localStorage.setItem(`hrv_${new Date().toISOString().split('T')[0]}`, String(val));
                          }}
                          className="w-full bg-black border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-white font-mono text-center focus:outline-none focus:border-[#EF4444]/40"
                        />
                      </div>
                    </div>
                    
                    <button 
                      onClick={() => {
                        const today = new Date().toISOString().split('T')[0];
                        localStorage.setItem(`heart_rate_${today}`, String(heartRate));
                        localStorage.setItem(`hrv_${today}`, String(hrv));
                      }}
                      className="w-full py-1.5 bg-[#EF4444]/10 hover:bg-[#EF4444] hover:text-black hover:border-transparent text-[9px] text-[#EF4444] font-mono uppercase rounded-lg border border-[#EF4444]/30 transition-all active:scale-95 cursor-pointer font-black"
                    >
                      Save Heart Metrics
                    </button>
                  </div>
                )}

                {recoverySubTab === 'energy' && (
                  <div className="bg-black/30 border border-white/5 p-4 rounded-xl space-y-4 text-left animate-none">
                    <span className="text-[9.5px] font-mono text-[#F59E0B] uppercase font-black tracking-widest block pl-0.5">
                      Energy Levels & Muscle Soreness
                    </span>

                    <div className="grid grid-cols-1 gap-3">
                      <div className="space-y-1 text-left">
                        <span className="text-[9px] font-mono text-zinc-500 uppercase block pl-0.5">Fatigue / Energy Level</span>
                        <select
                          value={cnsStress}
                          onChange={(e) => logCns(e.target.value)}
                          className="w-full bg-black border border-white/10 rounded-xl px-2.5 py-2 text-xs text-white font-mono focus:outline-none cursor-pointer hover:border-white/20 transition-all focus:border-[#F59E0B]/40"
                        >
                          <option value="Low Stress">Low Fatigue (Energetic & Fresh)</option>
                          <option value="Normal">Normal Energy State</option>
                          <option value="High Fatigued">Exhausted / Highly Fatigued</option>
                        </select>
                      </div>

                      <div className="space-y-1 text-left">
                        <span className="text-[9px] font-mono text-zinc-500 uppercase block pl-0.5">Muscle Soreness Level</span>
                        <select
                          value={sorenessLevel}
                          onChange={(e) => logSoreness(e.target.value)}
                          className="w-full bg-black border border-white/10 rounded-xl px-2.5 py-2 text-xs text-white font-mono focus:outline-none cursor-pointer hover:border-white/20 transition-all focus:border-[#F59E0B]/40"
                        >
                          <option value="Fresh (Perfect)">Fresh (No Muscle Soreness)</option>
                          <option value="Normal State">Normal (Ready to Train)</option>
                          <option value="Sore / Tired">Sore (Recovering)</option>
                          <option value="Highly Damaged">Highly Sore (Absolute Rest Needed)</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {/* Calculated Overall Recovery Indicator Box */}
                {(() => {
                  const sleepScore = Math.min(100, Math.round((sleepLevel / 8) * 100));
                  const cnsRating = cnsStress.includes('Low') ? 100 : cnsStress.includes('Normal') ? 80 : 35;
                  const sorenessRating = sorenessLevel.includes('Fresh') ? 100 : sorenessLevel.includes('Normal') ? 80 : sorenessLevel.includes('Sore') ? 50 : 25;
                  const heartRateRating = heartRate < 60 ? 100 : heartRate < 72 ? 85 : heartRate < 82 ? 65 : 40;
                  const hrvRating = hrv > 75 ? 100 : hrv > 60 ? 85 : hrv > 45 ? 65 : 40;
                  const recoveryScore = Math.round((sleepScore + cnsRating + sorenessRating + heartRateRating + hrvRating) / 5);

                  return (
                    <div className="mt-6 flex flex-col items-center justify-center p-6 bg-zinc-950 border border-white/5 rounded-2xl">
                      <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest font-black mb-3">
                        DAILY RECOVERY SCORE
                      </span>
                      <div 
                        className="w-20 h-20 rounded-full border border-[#D4FF00] flex items-center justify-center text-xl font-mono font-black text-white bg-black/40 relative shadow-[0_0_20px_rgba(212,255,0,0.15)]"
                        style={{ boxShadow: '0 0 15px rgba(212,255,0,0.1)' }}
                      >
                        {recoveryScore}%
                      </div>
                    </div>
                  );
                })()}
              </div>
            </motion.div>
          )}

          {activeTab === 'supplement_stack' && (
            <motion.div 
               id="decluttered-profile-viewer"
               className="bg-[#0A0A0C] border border-white/5 rounded-[24px] p-6 relative overflow-hidden shadow-xl space-y-6 animate-none"
            >
              <div className="absolute top-0 right-0 w-44 h-44 bg-[#10B981]/[0.02] rounded-full blur-3xl pointer-events-none" />
              
              <div className="border-b border-white/5 pb-4 text-center sm:text-left">
                <h2 className="text-xs font-mono font-black text-white uppercase tracking-widest leading-none flex items-center justify-center sm:justify-start gap-2">
                  <Sparkles className="w-4 h-4 text-[#10B981]" />
                  SUPPLEMENTS STACK
                </h2>
              </div>

              {/* TWO INTERACTIVE NESTED CIRCULAR SUB-TABS */}
              <div className="grid grid-cols-2 gap-1.5 sm:gap-6 mb-6 bg-black/25 p-3 sm:p-4 rounded-3xl border border-white/5 max-w-xs mx-auto justify-items-center w-full">
                {[
                  { id: 'log', label: 'LOGGING', color: '#10B981', glow: 'rgba(16,185,129,0.15)', desc: 'Compliance & Stack' },
                  { id: 'restock', label: 'RESTOCK', color: '#D4FF00', glow: 'rgba(212,255,0,0.15)', desc: 'Wheyo Labs Store' }
                ].map((sub) => {
                  const isActive = supplementSubTab === sub.id;
                  return (
                    <button
                      key={sub.id}
                      type="button"
                      onClick={() => setSupplementSubTab(sub.id as any)}
                      className="flex flex-col items-center group focus:outline-none cursor-pointer w-24 sm:w-[120px] shrink-0"
                    >
                      <div 
                        className={cn(
                          "w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all duration-300 relative bg-[#050505] overflow-hidden border",
                          isActive 
                            ? "scale-110 shadow-2xl" 
                            : "border-white/5 opacity-60 hover:opacity-100 hover:scale-105"
                        )}
                        style={{
                          borderColor: isActive ? sub.color : 'rgba(255,255,255,0.05)',
                          boxShadow: isActive ? `0 0 20px ${sub.glow}, inset 0 0 10px ${sub.glow}` : 'none'
                        }}
                      >
                        {/* Rotating Tech Outer Ring */}
                        <svg 
                          className={cn(
                            "absolute inset-0 w-full h-full transition-all duration-300 pointer-events-none",
                            isActive ? "animate-[spin_20s_linear_infinite]" : "opacity-40"
                          )} 
                          viewBox="0 0 100 100"
                        >
                          <circle
                            cx="50"
                            cy="50"
                            r="44"
                            className="fill-none"
                            stroke={isActive ? sub.color : "rgba(255,255,255,0.08)"}
                            strokeWidth={isActive ? "3" : "1.5"}
                            strokeDasharray={isActive ? "6, 4" : "4, 6"}
                          />
                        </svg>

                        <span className="text-[10px] font-mono font-black tracking-widest z-10" style={{ color: isActive ? sub.color : '#8A8A93' }}>
                          {sub.id === 'log' ? 'LOG' : 'SHOP'}
                        </span>
                      </div>
                      
                      <span 
                        className="text-[9px] font-mono uppercase tracking-widest mt-2 block font-extrabold transition-colors duration-200"
                        style={{ color: isActive ? sub.color : '#8A8A93' }}
                      >
                        {sub.label}
                      </span>
                    </button>
                  );
                })}
              </div>

              {(() => {
                const list = [
                  { id: 'all_whey', name: 'Whey Protein Iso-Mutator' },
                  { id: 'all_creatine', name: 'Creatine Monohydrate (Creapure)' },
                  { id: 'all_pre', name: 'Pre-Workout Stack' },
                  { id: 'all_omega', name: 'Omega-3 Fish Oil' },
                  { id: 'all_multi', name: 'Multi-nutrient Complex' },
                ];
                const checkedCount = list.filter(item => supplementsChecked[item.id]).length;
                const percent = Math.round((checkedCount / list.length) * 100);
                
                return (
                  <div className="space-y-6">
                    {supplementSubTab === 'log' && (
                      /* DAILY TICK MARK COMPLIANCE CHECKBOXES */
                      <div className="space-y-4 animate-none">
                        <div className="bg-black/30 border border-white/5 p-4 rounded-xl">
                          <div className="flex justify-between items-center mb-1.5">
                            <span className="text-[9px] font-mono text-zinc-400 uppercase font-bold">Stack Compliance Rate</span>
                            <span className="text-xs font-mono text-[#10B981] font-black">{percent}% COMPLETED</span>
                          </div>
                          <div className="w-full bg-zinc-950 h-2 rounded-full overflow-hidden border border-white/5">
                            <div 
                              className="bg-[#10B981] h-full transition-all duration-500 rounded-full" 
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                        </div>

                      <div className="space-y-2.5 text-left">
                        {list.map(item => {
                          const isChecked = !!supplementsChecked[item.id];
                          return (
                            <div 
                              key={item.id}
                              onClick={() => toggleSupplement(item.id)}
                              className={cn(
                                "flex items-center justify-between border group p-3.5 rounded-xl transition-all duration-200 cursor-pointer select-none",
                                isChecked 
                                  ? "bg-[#10B981]/5 border-[#10B981]/30 hover:border-[#10B981]/50" 
                                  : "bg-black/20 border-white/5 hover:border-white/10 hover:bg-black/30"
                              )}
                            >
                              <div className="text-left">
                                <span className={cn(
                                  "text-xs font-mono uppercase font-black block transition-colors tracking-wide",
                                  isChecked ? "text-[#10B981]" : "text-white"
                                )}>
                                  {item.name}
                                </span>
                              </div>

                              <div className="shrink-0 pl-4">
                                <div className={cn(
                                  "w-5 h-5 rounded-md border flex items-center justify-center transition-all",
                                  isChecked 
                                    ? "bg-[#10B981] border-[#10B981] text-black" 
                                    : "border-zinc-700 bg-black/60 group-hover:border-zinc-500"
                                )}>
                                  {isChecked && <CheckCircle className="w-3.5 h-3.5 stroke-[3px]" />}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    )}

                    {supplementSubTab === 'restock' && (
                      /* WHEYO LABS */
                      <div className="border border-white/10 bg-zinc-900/40 p-6 rounded-2xl space-y-4 relative overflow-hidden shadow-none">
                        <div className="absolute top-0 right-0 px-3 py-1 bg-zinc-800 text-zinc-400 text-[9px] font-mono font-bold uppercase tracking-wider rounded-bl-xl">
                          LABS STORE
                        </div>
                        
                        <div className="border-b border-white/5 pb-3">
                          <div className="text-left">
                            <span className="text-[#10B981] font-mono text-[9px] font-black tracking-widest block uppercase">OFFICIAL WHEYO STORE</span>
                            <h3 className="text-sm font-mono font-black text-white uppercase flex items-center gap-1.5 mt-0.5 tracking-wide">
                              PREMIUM SUPPLS
                            </h3>
                          </div>
                        </div>

                        <div className="text-left">
                          <p className="text-[10px] text-zinc-300 font-mono uppercase leading-relaxed font-bold">
                            Compounding high-protein synthesis elements. Running low on vital micronutrients or pure isolate? Restock Wheyo Labs® high-grade supplements below and upgrade your cellular potential!
                          </p>
                        </div>

                        {/* RESTOCK ITEMS LIST */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 text-left">
                          {[
                            {
                              id: 'supp_iso_mutator',
                              name: 'Wheyo Iso-Mutator Stack (Protein Reload)',
                              price: 1199,
                              specs: '900g Isolate | 30 Servings | 27g Protein/scoop',
                              protein: 27,
                              calories: 120,
                              image: 'https://images.unsplash.com/photo-1579758629938-03607ccdbaba?q=80&w=200&auto=format&fit=crop'
                            },
                            {
                              id: 'supp_creatine',
                              name: 'Wheyo Creapure ATP Reload (Creatine Compound)',
                              price: 699,
                              specs: '250g Creapure Monohydrate | 50 Servings',
                              protein: 0,
                              calories: 0,
                              image: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?q=80&w=200&auto=format&fit=crop'
                            },
                            {
                              id: 'supp_preworkout',
                              name: 'Wheyo Pre-Workout Hyper-Drive (Energy Matrix)',
                              price: 999,
                              specs: '300g Beta-Alanine, Citrulline & Caffeine Pump',
                              protein: 0,
                              calories: 15,
                              image: 'https://images.unsplash.com/photo-1593079831268-3381b0db4a77?q=80&w=200&auto=format&fit=crop'
                            },
                            {
                              id: 'supp_omega3',
                              name: 'Wheyo Omega-3 & Joint Shield (Essential Lipids)',
                              price: 549,
                              specs: '60 Softgels Premium EPA/DHA Lipid Complex',
                              protein: 0,
                              calories: 9,
                              image: 'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?q=80&w=200&auto=format&fit=crop'
                            }
                          ].map((supp) => (
                            <div 
                              key={supp.id} 
                              className="bg-black/40 border border-white/5 rounded-xl p-3 flex flex-col justify-between gap-3 hover:border-[#10B981]/20 transition-all hover:bg-gradient-to-b hover:from-[#10B981]/[0.01]"
                            >
                              <div className="flex items-start gap-3 min-w-0">
                                <img 
                                  src={supp.image} 
                                  alt={supp.name} 
                                  className="w-12 h-12 rounded-lg object-cover shrink-0 border border-white/5 select-none grayscale opacity-80"
                                  referrerPolicy="no-referrer"
                                />
                                <div className="min-w-0">
                                  <span className="font-bold text-white text-[10.5px] uppercase truncate block">{supp.name}</span>
                                  <span className="text-[8.5px] font-mono text-zinc-500 block mt-0.5 uppercase">{supp.specs}</span>
                                  <span className="text-[10px] font-bold text-[#D4FF00] font-mono mt-1 block">₹{supp.price}</span>
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={() => {
                                  addItem({
                                    id: supp.id,
                                    name: supp.name,
                                    price: supp.price,
                                    protein: supp.protein,
                                    calories: supp.calories,
                                    image: supp.image,
                                    isVeg: true
                                  });
                                  setIsCartOpen(true);
                                }}
                                className="w-full py-1.5 bg-[#10B981] hover:bg-white text-black font-mono font-black text-[8px] uppercase rounded-lg transition-all cursor-pointer select-none active:scale-95 text-center flex items-center justify-center gap-1 shadow-md shadow-[#10B981]/10"
                              >
                                ORDER RESTOCK PACK
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </motion.div>
          )}

          {activeTab === 'cardio_log' && (
            <motion.div 
              id="decluttered-profile-viewer"
              className="bg-[#0A0A0C] border border-white/5 rounded-[24px] p-6 relative overflow-hidden shadow-xl space-y-6 animate-none"
            >
              <div className="absolute top-0 right-0 w-44 h-44 bg-[#EF4444]/[0.02] rounded-full blur-3xl pointer-events-none" />
              
              <div className="border-b border-white/5 pb-4 text-center sm:text-left">
                <h2 className="text-xs font-mono font-black text-white uppercase tracking-widest leading-none flex items-center justify-center sm:justify-start gap-2">
                  <Flame className="w-4 h-4 text-[#EF4444]" />
                  CARDIO CIRCUITS & ACTIVE MINUTES
                </h2>
              </div>

              {/* CIRCLE BASED SELECTOR FOR CARDIO TYPE */}
              <div className="bg-black/25 p-4 rounded-3xl border border-white/5 space-y-3.5">
                <span className="text-[9px] font-mono text-[#EF4444] uppercase font-black block pl-1 tracking-wider text-center">
                  Select Cardio Circuit Type
                </span>
                <div className="flex flex-wrap justify-center gap-4">
                  {[
                    { type: 'Running', label: 'RUNNING', color: '#EF4444', glow: 'rgba(239,68,68,0.15)', icon: Flame },
                    { type: 'Treadmill', label: 'TREADMILL', color: '#F59E0B', glow: 'rgba(245,158,11,0.15)', icon: Activity },
                    { type: 'Cycling', label: 'CYCLING', color: '#10B981', glow: 'rgba(16,185,129,0.15)', icon: Dumbbell },
                    { type: 'HIIT Circuit', label: 'HIIT', color: '#3B82F6', glow: 'rgba(59,130,246,0.15)', icon: Zap },
                    { type: 'Swimming', label: 'SWIMMING', color: '#06B6D4', glow: 'rgba(6,182,212,0.15)', icon: Droplet }
                  ].map((item) => {
                    const isActive = newCardioType === item.type;
                    const IconComponent = item.icon;
                    return (
                      <button
                        key={item.type}
                        type="button"
                        onClick={() => setNewCardioType(item.type)}
                        className="flex flex-col items-center group focus:outline-none cursor-pointer w-[76px] shrink-0"
                      >
                        <div 
                          className={cn(
                            "w-11 h-11 rounded-full flex items-center justify-center transition-all duration-300 relative bg-[#050505] overflow-hidden border text-lg",
                            isActive 
                              ? "scale-110 shadow-2xl" 
                              : "border-white/5 opacity-60 hover:opacity-100 hover:scale-105"
                          )}
                          style={{
                            borderColor: isActive ? item.color : 'rgba(255,255,255,0.05)',
                            boxShadow: isActive ? `0 0 20px ${item.glow}, inset 0 0 10px ${item.glow}` : 'none'
                          }}
                        >
                          {/* Rotating Tech Outer Ring */}
                          <svg 
                            className={cn(
                              "absolute inset-0 w-full h-full transition-all duration-300 pointer-events-none",
                              isActive ? "animate-[spin_20s_linear_infinite]" : "opacity-40"
                            )} 
                            viewBox="0 0 100 100"
                          >
                            <circle
                              cx="50"
                              cy="50"
                              r="44"
                              className="fill-none"
                              stroke={isActive ? item.color : "rgba(255,255,255,0.08)"}
                              strokeWidth={isActive ? "3" : "1.5"}
                              strokeDasharray={isActive ? "6, 4" : "4, 6"}
                            />
                          </svg>

                          <IconComponent className="w-4 h-4 z-10" style={{ color: isActive ? item.color : '#8A8A93' }} />
                        </div>
                        
                        <span 
                          className="text-[8px] font-mono uppercase tracking-wider mt-1.5 block font-extrabold transition-colors duration-200 text-center"
                          style={{ color: isActive ? item.color : '#8A8A93' }}
                        >
                          {item.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Form column */}
                <div className="space-y-4 bg-black/30 border border-white/5 p-4 rounded-xl text-left">
                  <span className="text-[9px] font-mono text-[#EF4444] uppercase font-bold block pl-1 tracking-wider">
                    RECORD {newCardioType.toUpperCase()} PERFORMANCE
                  </span>

                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-[9px] font-mono text-zinc-500 uppercase pl-1 block">Duration (mins)</label>
                        <input 
                          type="number"
                          placeholder="e.g. 30"
                          value={newCardioDuration}
                          onChange={(e) => setNewCardioDuration(e.target.value)}
                          className="w-full bg-black border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#EF4444]/40 font-mono"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-mono text-zinc-500 uppercase pl-1 block">Distance (km)</label>
                        <input 
                          type="number"
                          step="0.1"
                          placeholder="e.g. 4.2"
                          value={newCardioDistance}
                          onChange={(e) => setNewCardioDistance(e.target.value)}
                          className="w-full bg-black border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#EF4444]/40 font-mono"
                        />
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        handleAddCardio(newCardioType, newCardioDuration, newCardioDistance);
                        setNewCardioDuration('');
                        setNewCardioDistance('');
                      }}
                      className="w-full py-2 bg-[#EF4444]/10 hover:bg-[#EF4444] hover:text-black text-red-400 font-mono uppercase text-[9px] tracking-widest font-extrabold rounded-xl transition-all border border-[#EF4444]/20 hover:border-transparent active:scale-95 cursor-pointer flex items-center justify-center gap-1.5 font-bold"
                    >
                      SUMMIT CARDIO CIRCUIT
                    </button>
                  </div>
                </div>

                {/* Log display Column */}
                <div className="space-y-3">
                  <div className="flex justify-between items-baseline">
                    <span className="text-[9px] font-mono text-zinc-400 uppercase font-black">TODAY CARDIO INTENSITY LOG</span>
                    <span className="text-xs font-mono text-[#EF4444] font-black font-bold">
                      {cardioLogs.reduce((acc, curr) => acc + curr.duration, 0)} Mins Loaded
                    </span>
                  </div>

                  <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1 text-left scrollbar-thin">
                    {cardioLogs.length > 0 ? (
                      cardioLogs.map((log) => (
                        <div key={log.id} className="bg-black/40 border border-white/5 p-3 rounded-xl flex justify-between items-center text-xs font-mono">
                          <div>
                            <span className="text-white font-black uppercase text-xs block font-bold">{log.type}</span>
                            <span className="text-[9px] text-[#EF4444] font-bold block uppercase mt-0.5">
                              ⏱️ {log.duration} MINS {log.distance ? `| ${log.distance} KM` : ''}
                            </span>
                          </div>
                          <button
                            onClick={() => handleDeleteCardio(log.id)}
                            className="text-zinc-600 hover:text-red-500 p-1 rounded transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-zinc-500 border border-dashed border-white/5 rounded-xl">
                        <span className="text-[10px] font-mono uppercase block">NO ACTIVE CARDIO LOADED TODAY</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'body_measures' && (
            <motion.div 
              id="decluttered-profile-viewer"
              className="bg-[#0A0A0C] border border-white/5 rounded-[24px] p-6 relative overflow-hidden shadow-xl space-y-6 animate-none"
            >
              <div className="absolute top-0 right-0 w-44 h-44 bg-[#EC4899]/[0.02] rounded-full blur-3xl pointer-events-none" />
              
              <div className="border-b border-white/5 pb-4 text-center sm:text-left">
                <h2 className="text-xs font-mono font-black text-white uppercase tracking-widest leading-none flex items-center justify-center sm:justify-start gap-2">
                  <TrendingUp className="w-4 h-4 text-[#EC4899]" />
                  BODY STATS & MEASUREMENTS
                </h2>
              </div>

              {/* THREE INTERACTIVE CIRCULAR SUB-TABS LIKE PHYSICAL LOG */}
              <div className="grid grid-cols-3 gap-1.5 sm:gap-6 mb-6 bg-black/25 p-3 sm:p-4 rounded-3xl border border-white/5 max-w-sm mx-auto justify-items-center w-full">
                {[
                  { id: 'core', label: 'CORE', color: '#EC4899', glow: 'rgba(236,72,153,0.15)', desc: 'Weight & Fat', icon: Scale },
                  { id: 'tape', label: 'TAPE', color: '#60A5FA', glow: 'rgba(96,165,250,0.15)', desc: 'Measures', icon: Ruler },
                  { id: 'snapshots', label: 'HEALTH', color: '#10B981', glow: 'rgba(16,185,129,0.15)', desc: 'Mealtime Snap', icon: ClipboardList }
                ].map((sub) => {
                  const isActive = bodyStatsSubTab === sub.id;
                  const IconComponent = sub.icon;
                  return (
                    <button
                      key={sub.id}
                      type="button"
                      onClick={() => setBodyStatsSubTab(sub.id as any)}
                      className="flex flex-col items-center group focus:outline-none cursor-pointer w-16 sm:w-[100px] shrink-0"
                    >
                      <div 
                        className={cn(
                          "w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all duration-300 relative bg-[#050505] overflow-hidden border",
                          isActive 
                            ? "scale-110 shadow-2xl" 
                            : "border-white/5 opacity-60 hover:opacity-100 hover:scale-105"
                        )}
                        style={{
                          borderColor: isActive ? sub.color : 'rgba(255,255,255,0.05)',
                          boxShadow: isActive ? `0 0 20px ${sub.glow}, inset 0 0 10px ${sub.glow}` : 'none'
                        }}
                      >
                        {/* Rotating Tech Outer Ring */}
                        <svg 
                          className={cn(
                            "absolute inset-0 w-full h-full transition-all duration-300 pointer-events-none",
                            isActive ? "animate-[spin_20s_linear_infinite]" : "opacity-40"
                          )} 
                          viewBox="0 0 100 100"
                        >
                          <circle
                            cx="50"
                            cy="50"
                            r="44"
                            className="fill-none"
                            stroke={isActive ? sub.color : "rgba(255,255,255,0.08)"}
                            strokeWidth={isActive ? "3" : "1.5"}
                            strokeDasharray={isActive ? "6, 4" : "4, 6"}
                          />
                        </svg>

                        <IconComponent className="w-3.5 h-3.5 sm:w-4 sm:h-4 z-10" style={{ color: isActive ? sub.color : '#8A8A93' }} />
                      </div>
                      
                      <span 
                        className="text-[8px] font-mono uppercase tracking-widest mt-2 block font-extrabold transition-colors duration-200 text-center"
                        style={{ color: isActive ? sub.color : '#8A8A93' }}
                      >
                        {sub.label}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="space-y-4">
                {bodyStatsSubTab === 'core' && (
                  /* Section 1: Core Biophysics Loggers */
                  <div className="bg-gradient-to-r from-pink-500/5 to-transparent border border-pink-500/10 p-4 rounded-xl text-left space-y-3 animate-none">
                    <span className="text-[9px] font-mono text-[#EC4899] uppercase font-black tracking-widest block">
                      CORE WEIGHT & ADIPOSE COMPOSITION (LOGGABLE)
                    </span>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[8.5px] font-mono text-zinc-400 uppercase font-bold pl-0.5 block">Current Bodyweight (KG)</label>
                        <input 
                          type="number"
                          step="0.1"
                          placeholder="76.4"
                          value={localWeight || String(weightLevel || '')}
                          onChange={(e) => {
                            const val = e.target.value;
                            setLocalWeight(val);
                            applyBiomarkerChanges({ body_weight: Number(val) });
                          }}
                          className="w-full bg-black border border-white/10 rounded-xl px-2.5 py-2 text-xs text-white font-mono text-center focus:border-[#EC4899]/40 focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[8.5px] font-mono text-zinc-400 uppercase font-bold pl-0.5 block">Estimated Body Fat %</label>
                        <input 
                          type="number"
                          step="0.1"
                          placeholder="14"
                          value={bodyFat || ''}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setBodyFat(val);
                            localStorage.setItem('athlete_body_fat', String(val));
                          }}
                          className="w-full bg-black border border-white/10 rounded-xl px-2.5 py-2 text-xs text-white font-mono text-center focus:border-[#EC4899]/40 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {bodyStatsSubTab === 'tape' && (
                  /* Section 2: Skeletal & Limb Tape Measures */
                  <div className="bg-gradient-to-r from-[#60A5FA]/5 to-transparent border border-[#60A5FA]/10 p-4 rounded-xl text-left space-y-3 animate-none">
                    <span className="text-[9px] font-mono text-[#60A5FA] uppercase font-black tracking-widest block">
                      ANTHROPOMETRIC TAPE CIRCUMFERENCES (LOGGABLE)
                    </span>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {[
                        { label: 'Chest', placeholder: '104' },
                        { label: 'Waist', placeholder: '80' },
                        { label: 'Arms', placeholder: '39' },
                        { label: 'Legs', placeholder: '60' },
                      ].map((part) => (
                        <div key={part.label} className="bg-black/50 border border-white/5 p-2 rounded-xl flex flex-col items-center">
                          <span className="text-[8.5px] font-mono text-zinc-400 uppercase font-bold text-center block mb-1">
                            {part.label} (cm)
                          </span>
                          <input
                            type="number"
                            step="0.1"
                            placeholder={part.placeholder}
                            value={bodyMeasures[part.label.toLowerCase()] || ''}
                            onChange={(e) => saveBodyMeasure(part.label, e.target.value)}
                            className="bg-black text-center border border-white/10 rounded-lg px-2 py-0.5 text-xs text-white font-mono w-20 focus:border-[#60A5FA]/40 focus:outline-none"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {bodyStatsSubTab === 'snapshots' && (
                  /* Unified Digital Audit Snapshots */
                  <div className="bg-black/35 border border-white/5 p-4 rounded-xl text-left space-y-2.5 animate-none">
                    <span className="text-[9px] font-mono text-zinc-400 block uppercase font-black tracking-widest">
                      MEALTIME MEASUREMENT AUDIT SNAPSHOTS
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 bg-black/10 p-1.5 rounded-lg">
                      {[
                        { name: 'Weight', value: localWeight || String(weightLevel || 'NOT LOGGED'), suffix: ' kg', color: '#fbcfe8' },
                        { name: 'Body Fat', value: bodyFat ? `${bodyFat}%` : 'NOT LOGGED', suffix: '', color: '#fbcfe8' },
                        { name: 'Chest', value: bodyMeasures['chest'] ? `${bodyMeasures['chest']} cm` : 'NOT LOGGED', suffix: '', color: '#dae7fc' },
                        { name: 'Waist', value: bodyMeasures['waist'] ? `${bodyMeasures['waist']} cm` : 'NOT LOGGED', suffix: '', color: '#dae7fc' },
                        { name: 'Arms', value: bodyMeasures['arms'] ? `${bodyMeasures['arms']} cm` : 'NOT LOGGED', suffix: '', color: '#dae7fc' },
                        { name: 'Legs', value: bodyMeasures['legs'] ? `${bodyMeasures['legs']} cm` : 'NOT LOGGED', suffix: '', color: '#dae7fc' },
                      ].map(metric => {
                        return (
                          <div key={metric.name} className="bg-black/40 border border-white/5 p-2 rounded-lg flex flex-col justify-between">
                            <span className="text-[7.5px] font-mono text-zinc-500 uppercase font-black">{metric.name}</span>
                            <span 
                              style={{ color: metric.value !== 'NOT LOGGED' ? metric.color : '#52525b' }} 
                              className="text-[11px] font-mono font-black mt-1 uppercase"
                            >
                              {metric.value === 'NOT LOGGED' ? metric.value : `${metric.value}${metric.suffix}`}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
            </motion.div>
          </AnimatePresence>
                </div>
              );
            };
            return renderDetailContent(activeTab);
          })()}

          {/* ONE-CLICK NAVIGATORS */}
          <div className="pt-6 pb-2 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => {
                setActiveTab(null);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="w-full sm:w-auto px-8 py-3 bg-[#D4FF00] hover:bg-white text-black font-mono font-black text-[10px] sm:text-[11px] uppercase tracking-widest rounded-2xl transition-all duration-300 cursor-pointer active:scale-95 flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(212,255,0,0.35)] hover:shadow-none"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Athlete Hub
            </button>
            <button
              onClick={() => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="w-full sm:w-auto px-6 py-3 bg-zinc-900/60 hover:bg-zinc-800 border border-white/5 hover:border-white/10 text-zinc-400 hover:text-white font-mono font-black text-[10px] uppercase tracking-widest rounded-2xl transition-all duration-300 cursor-pointer active:scale-95 flex items-center justify-center gap-2"
            >
              Back to Top
            </button>
          </div>
      
        </div>
      )}

      {/* 7 OR 30 DAYS REWARD MILESTONE UNLOCK MODAL */}
      <AnimatePresence>
        {showUnlockModal && (
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowUnlockModal(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-md cursor-pointer z-10"
            />
            
            {/* Content Card */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md bg-[#0C0C0E] border border-white/10 rounded-[28px] p-6 sm:p-8 overflow-hidden shadow-[0_20px_50px_rgba(212,255,0,0.15)] z-20 text-center"
            >
              {/* Top ambient glow */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-[#D4FF00]/10 rounded-full blur-[64px]" />
              
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 rounded-full bg-[#D4FF00]/10 border border-[#D4FF00]/30 flex items-center justify-center text-[#D4FF00]">
                  <Trophy className="w-8 h-8 text-[#D4FF00]" />
                </div>
              </div>
              
              <h3 className="text-sm font-mono uppercase tracking-widest text-gray-500 mb-1 leading-none">MILESTONE REWARD</h3>
              
              {unlockMilestone === 7 ? (
                <>
                  <h2 className="text-2xl font-display font-black text-white uppercase tracking-tight">
                    IRON <span className="text-[#D4FF00]">DISCIPLE</span>
                  </h2>
                  <p className="text-[11px] font-mono text-gray-400 mt-4 leading-relaxed max-w-xs mx-auto">
                    Consistent logging and physical workout discipline logged for <span className="text-[#D4FF00] font-black">7 Days</span>. You have officially unlocked the prestigious <span className="text-[#D4FF00] font-black">Iron Disciple</span> rank and active tracker aesthetic badge!
                  </p>
                </>
              ) : (
                <>
                  <h2 className="text-2xl font-display font-black text-white uppercase tracking-tight">
                    MUTANT <span className="text-[#D4FF00]">BEAST</span>
                  </h2>
                  <p className="text-[11px] font-mono text-gray-400 mt-4 leading-relaxed max-w-xs mx-auto">
                    Superior tracking status attained! Consistent daily logs for <span className="text-[#D4FF00] font-black">30 Days</span>. You have officially unlocked the legendary <span className="text-[#D4FF00] font-black">Mutant Beast</span> elite champion rank badge!
                  </p>
                </>
              )}

              {/* Selector tabs */}
              <div className="grid grid-cols-2 gap-2 mt-6 pt-6 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setUnlockMilestone(7)}
                  className={cn(
                    "py-2 rounded-xl text-[9px] font-mono uppercase font-black tracking-wider transition-all cursor-pointer border",
                    unlockMilestone === 7 
                      ? "bg-[#D4FF00]/10 border-[#D4FF00]/30 text-[#D4FF00]" 
                      : "bg-white/5 border-transparent text-gray-500 hover:text-gray-300"
                  )}
                >
                  7-Day Milestone {activeStreak >= 7 ? '✓' : '[LOCKED]'}
                </button>
                <button
                  type="button"
                  onClick={() => setUnlockMilestone(30)}
                  className={cn(
                    "py-2 rounded-xl text-[9px] font-mono uppercase font-black tracking-wider transition-all cursor-pointer border",
                    unlockMilestone === 30 
                      ? "bg-[#D4FF00]/10 border-[#D4FF00]/20 text-[#D4FF00]" 
                      : "bg-white/5 border-transparent text-gray-500 hover:text-gray-300"
                  )}
                >
                  30-Day Milestone {activeStreak >= 30 ? '✓' : '[LOCKED]'}
                </button>
              </div>

              <div className="mt-6">
                <button
                  onClick={() => setShowUnlockModal(false)}
                  className="w-full py-3 bg-[#D4FF00] hover:bg-white text-black font-black uppercase text-[10px] tracking-widest rounded-xl transition-all cursor-pointer"
                >
                  Close parameters
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* UPCOMING OFFERS & LOYALTY PROGRAM DIALOG */}
      <AnimatePresence>
        {showOffersDialog && (
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowOffersDialog(false)}
              className="fixed inset-0 bg-black/90 backdrop-blur-md cursor-pointer z-10"
            />
            
            {/* Modal Box */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-2xl bg-[#09090B] border border-white/5 rounded-[32px] p-6 sm:p-8 overflow-hidden shadow-[0_24px_60px_rgba(0,0,0,0.8)] z-20 flex flex-col max-h-[90vh]"
            >
              {/* Decorative Subtle Ambient Glows */}
              <div className="absolute top-0 right-0 w-48 h-48 bg-[#D4FF00]/5 rounded-full blur-[80px] pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/5 rounded-full blur-[80px] pointer-events-none" />
              
              {/* Header */}
              <div className="flex items-start justify-between pb-4 border-b border-white/5 relative z-10">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#D4FF00] opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-[#D4FF00]"></span>
                    </span>
                    <span className="text-[10px] font-mono text-zinc-400 font-bold uppercase tracking-widest">
                      Synced Live Feed
                    </span>
                  </div>
                  <h3 className="text-xl font-display font-black uppercase text-white tracking-tight leading-none">
                    Athlete Milestones & Active Perks
                  </h3>
                </div>
                <button 
                  onClick={() => setShowOffersDialog(false)}
                  className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-zinc-400 hover:text-white transition-all cursor-pointer hover:bg-white/10 active:scale-90"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Metrics Bar */}
              <div className="grid grid-cols-3 gap-2.5 my-4 bg-zinc-950 border border-white/5 p-3 rounded-2xl relative z-10">
                <div className="text-center py-1">
                  <span className="text-[9px] font-mono text-zinc-500 block uppercase tracking-wider">Unlocked Perks</span>
                  <span className="text-sm font-mono font-black text-[#D4FF00] block mt-0.5">
                    {dbOffers.filter(o => o.is_revealed).length} Active
                  </span>
                </div>
                <div className="text-center py-1 border-x border-white/5">
                  <span className="text-[9px] font-mono text-zinc-500 block uppercase tracking-wider">Active Streak</span>
                  <span className="text-sm font-mono font-black text-white block mt-0.5 flex items-center justify-center gap-1">
                    <Flame className="w-3.5 h-3.5 text-orange-500 fill-current" /> {activeStreak} Days
                  </span>
                </div>
                <div className="text-center py-1">
                  <span className="text-[9px] font-mono text-zinc-500 block uppercase tracking-wider">Mystery Locked</span>
                  <span className="text-sm font-mono font-black text-purple-400 block mt-0.5">
                    {dbOffers.filter(o => !o.is_revealed).length} Chests
                  </span>
                </div>
              </div>

              {/* Interactive Category Filters */}
              <div className="flex flex-wrap gap-1.5 pb-4 border-b border-white/5 relative z-10 overflow-x-auto scrollbar-none">
                {['ALL', 'Loyalty Milestones', 'Streak Bonuses', 'Seasonal Drops', 'Exclusive Perks'].map((cat) => {
                  const isSelected = selectedOfferCategory === cat;
                  return (
                    <button
                      key={cat}
                      onClick={() => setSelectedOfferCategory(cat)}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-[9px] font-mono font-black uppercase tracking-wider transition-all duration-200 cursor-pointer border whitespace-nowrap",
                        isSelected 
                          ? "bg-[#D4FF00] border-[#D4FF00] text-black" 
                          : "bg-white/[0.02] border-white/5 text-zinc-400 hover:border-white/10 hover:text-white"
                      )}
                    >
                      {cat === 'ALL' ? 'Show All' : cat}
                    </button>
                  );
                })}
              </div>

              {/* Body (Scrollable List) */}
              <div className="flex-1 overflow-y-auto py-5 space-y-3 scrollbar-thin scrollbar-thumb-white/10 relative z-10">
                {isOffersLoading ? (
                  <div className="flex flex-col items-center justify-center py-12 space-y-3">
                    <Loader2 className="w-6 h-6 text-[#D4FF00] animate-spin" />
                    <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Retrieving Live Milestones...</span>
                  </div>
                ) : dbOffers.filter(o => selectedOfferCategory === 'ALL' ? true : o.category === selectedOfferCategory).length === 0 ? (
                  <div className="border border-dashed border-white/10 bg-zinc-950 p-8 rounded-3xl text-center max-w-sm mx-auto">
                    <Trophy className="w-8 h-8 text-zinc-600 mx-auto mb-3" />
                    <p className="text-xs font-mono font-bold text-white uppercase tracking-wider">No Active Milestones found</p>
                    <p className="text-[10px] font-mono text-zinc-500 mt-1">Keep training and complete orders to activate new premium campaigns!</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {dbOffers
                      .filter(o => selectedOfferCategory === 'ALL' ? true : o.category === selectedOfferCategory)
                      .map((offer, idx) => {
                        const isUnlocked = offer.is_revealed;
                        return (
                          <motion.div 
                            key={offer.id || idx}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            className={cn(
                              "border rounded-2xl p-4 transition-all duration-300 relative overflow-hidden flex flex-col justify-between min-h-[125px]",
                              isUnlocked 
                                ? "bg-zinc-900/20 border-[#D4FF00]/10 hover:border-[#D4FF00]/30 shadow-[0_4px_20px_rgba(212,255,0,0.02)]" 
                                : "bg-black/40 border-purple-900/20 hover:border-purple-500/20 shadow-[inset_0_0_24px_rgba(147,51,234,0.03)]"
                            )}
                          >
                            {/* Card Glow FX */}
                            {isUnlocked ? (
                              <div className="absolute -top-12 -right-12 w-24 h-24 bg-[#D4FF00]/2 rounded-full blur-xl pointer-events-none" />
                            ) : (
                              <div className="absolute -top-12 -right-12 w-24 h-24 bg-purple-500/3 rounded-full blur-xl pointer-events-none" />
                            )}

                            <div>
                              <div className="flex items-start justify-between gap-2 mb-2">
                                <span className={cn(
                                  "text-[8px] font-mono font-bold px-1.5 py-0.5 rounded uppercase border leading-none tracking-wider",
                                  isUnlocked 
                                    ? "bg-[#D4FF00]/10 border-[#D4FF00]/20 text-[#D4FF00]" 
                                    : "bg-purple-950/20 border-purple-500/20 text-purple-400"
                                )}>
                                  {offer.category}
                                </span>
                                
                                {isUnlocked ? (
                                  <span className="text-[7.5px] font-mono text-[#D4FF00] font-black uppercase tracking-wider flex items-center gap-1">
                                    ● Unlocked
                                  </span>
                                ) : (
                                  <span className="text-[7.5px] font-mono text-purple-400 font-black uppercase tracking-wider flex items-center gap-1">
                                    <Lock className="w-2.5 h-2.5" /> Locked
                                  </span>
                                )}
                              </div>

                              <h4 className="text-xs font-mono font-black text-white uppercase tracking-wide leading-tight mb-1">
                                {offer.title}
                              </h4>

                              {isUnlocked ? (
                                <p className="text-[10px] font-mono text-zinc-400 leading-relaxed mb-3">
                                  {offer.description}
                                </p>
                              ) : (
                                <div className="flex items-center gap-2 py-2 mb-2">
                                  <Lock className="w-3.5 h-3.5 text-purple-500 shrink-0 animate-pulse" />
                                  <span className="text-[10px] font-mono text-zinc-500 italic">
                                    Mystery Reward Locked! To be revealed soon.
                                  </span>
                                </div>
                              )}
                            </div>

                            {/* Trigger rule or mystery hint */}
                            <div className="pt-2 border-t border-white/[0.03] mt-auto">
                              <span className="text-[8px] font-mono text-zinc-500 block uppercase tracking-wider leading-none">
                                Rule: {offer.trigger_rule}
                              </span>
                            </div>
                          </motion.div>
                        );
                      })}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="pt-4 border-t border-white/5 flex flex-col gap-2 relative z-10">
                <button
                  onClick={() => setShowOffersDialog(false)}
                  className="w-full py-3 bg-[#D4FF00] hover:bg-white text-black font-mono font-black uppercase text-[10px] tracking-widest rounded-xl transition-all duration-300 cursor-pointer text-center"
                >
                  Dismiss View
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* SECTION REMOVED TO PREVENT DUPLICATION WITH THE NEW ATHLETE ID CYBERNETIC PROGRESS METER */}

    </div>
  );
}

// Custom Markdown parser for loyalty structures
function parseOffersMarkdown(md: string) {
  if (!md) {
    // Elegant local fallback matching the design system
    return {
      title: "WHEYO LOYALTY & OFFERS",
      intro: "Your active loyalty rewards and future milestones, designed to reward consistent training discipline.",
      sections: [
        {
          heading: "Active Rewards Program",
          items: [
            { title: "5th Order Loyalty", desc: "Get 10% Flat Discount automatically applied at checkout on orders above ₹299!" },
            { title: "10th Order Loyalty", desc: "Get 20% Elite Discount automatically applied at checkout on orders above ₹299!" }
          ]
        },
        {
          heading: "Upcoming Milestones",
          items: [
            { title: "15th Milestone Drop", desc: "To be revealed soon." },
            { title: "20th Milestone Champion", desc: "To be revealed soon." },
            { title: "Weekly Streak Bonus", desc: "To be revealed soon." },
            { title: "Monthly Elite Status", desc: "To be revealed soon." }
          ]
        }
      ]
    };
  }

  const lines = md.split('\n');
  let title = "WHEYO LOYALTY & OFFERS";
  let intro = "Your active loyalty rewards and future milestones, designed to reward consistent training discipline.";
  const sections: { heading: string; items: { title: string; desc: string }[] }[] = [];
  let currentSection: { heading: string; items: { title: string; desc: string }[] } | null = null;

  lines.forEach((line) => {
    const trimmed = line.trim();
    if (trimmed.startsWith('# ')) {
      title = trimmed.replace('# ', '').trim();
    } else if (trimmed.startsWith('## ')) {
      if (currentSection) {
        sections.push(currentSection);
      }
      currentSection = {
        heading: trimmed.replace('## ', '').replace('(Edit these below)', '').trim(),
        items: []
      };
    } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      const content = trimmed.substring(2).trim();
      // Split on "**" to find the title
      if (content.includes('**')) {
        const parts = content.split('**');
        if (parts.length >= 3) {
          const itemTitle = parts[1].trim();
          const itemDesc = parts.slice(2).join('').replace(/^:\s*/, '').trim();
          if (currentSection) {
            currentSection.items.push({ title: itemTitle, desc: itemDesc });
          }
        } else {
          if (currentSection) {
            currentSection.items.push({ title: '', desc: content.replace(/\*\*/g, '') });
          }
        }
      } else {
        if (currentSection) {
          currentSection.items.push({ title: '', desc: content });
        }
      }
    } else if (trimmed && !trimmed.startsWith('#') && !trimmed.startsWith('-') && !trimmed.startsWith('*') && !currentSection) {
      intro = trimmed;
    }
  });

  if (currentSection) {
    sections.push(currentSection);
  }

  return { title, intro, sections };
}
