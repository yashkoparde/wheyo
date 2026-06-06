import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';
import { 
  User, 
  LogOut, 
  ShoppingBag, 
  Target, 
  History, 
  ChevronRight,
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
  Image
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { cn } from '../components/Layout';
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

export default function ProfilePage({ session }: { session: Session | null }) {
  const user = session?.user ?? null;
  const navigate = useNavigate();
  const { addItem, setIsCartOpen } = useCart();

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

  const [copiedSql, setCopiedSql] = useState(false);

  // Section Wise Revealing (Accordion State)
  // 'wheyocard' is default open. hydration and other sections start closed.
  const [expandedSections, setExpandedSections] = useState({
    wheyocard: true,
    hydration: false,
    nutrition: false,
    orders: false,
    favorites: false,
    macrosplit: false,
    calculator: false,
    settings: false,
    dbblueprint: false,
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
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
          const { data, error } = await supabase
            .from('products')
            .select('*')
            .eq('is_available', true);
          if (!error && data && data.length > 0) {
            const { getPublicUrl } = await import('../lib/supabase');
            fetched = data.map((p: any) => ({
              id: p.id.toString(),
              code: p.code,
              name: p.name,
              protein: Number(p.protein || 40),
              calories: Number(p.calories || 350),
              price: Number(p.price || 149),
              isVeg: p.is_veg,
              image: getPublicUrl(p.image_url),
              tags: p.tags || [],
            }));
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
          title: '🔥 MY WHEYO-PRO ATHLETIC STATUS 🔥',
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
      doc.text(`${activeStreak} DAYS 🔥`, 22, 82);

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
    setExpandedSections(prev => ({ ...prev, settings: false }));
    setDbFetchTrigger(prev => prev + 1);
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
        <p className="text-gray-400 font-mono text-[10px] uppercase tracking-widest animate-pulse">Retrieving Locker Profile...</p>
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

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 pb-24 md:pb-16 select-none" id="decluttered-profile">
      
      {/* SECTION 1: HEADER INFO BOX */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-gradient-to-r from-[#0C0C0E] to-[#08080A] border border-white/5 rounded-[24px] p-6 relative overflow-hidden mb-6"
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
                {user.email} • {profile?.phone || '+91 99999 99999'}
              </p>
            </div>
          </div>

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
            animate={{
              boxShadow: [
                "0 0 5px rgba(212,255,0,0.1)",
                "0 0 15px rgba(212,255,0,0.4)",
                "0 0 5px rgba(212,255,0,0.1)"
              ],
              borderColor: [
                "rgba(212,255,0,0.2)",
                "rgba(212,255,0,0.6)",
                "rgba(212,255,0,0.2)"
              ]
            }}
            transition={{
              duration: 2.5,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="flex items-center gap-3 bg-black/40 border px-4 py-2.5 rounded-2xl cursor-pointer select-none self-start sm:self-center"
          >
            <Flame className="w-5 h-5 text-[#D4FF00] fill-current animate-pulse shrink-0" />
            <div>
              <span className="text-[7px] font-mono text-gray-500 block uppercase tracking-widest leading-none">PROTEIN STREAK</span>
              <span className="text-xs font-mono font-black text-[#D4FF00] leading-none mt-1 block">{activeStreak} {activeStreak === 1 ? 'Day' : 'Days'} 🔥</span>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* REVEALING ACCORDION CONSTRUCTS */}
      <div className="space-y-4">

        {/* SECTION W: WHEYOCARD DYNAMIC BIO-IDENTITY */}
        <div className="border border-white/5 rounded-[20px] bg-[#0A0A0C] overflow-hidden shadow-sm">
          <button 
            onClick={() => toggleSection('wheyocard')}
            className="w-full px-5 py-4 flex items-center justify-between hover:bg-white/[0.01] transition-all text-left outline-none"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#D4FF00]/10 border border-[#D4FF00]/20 text-[#D4FF00] rounded-lg">
                <CreditCard className="w-4 h-4 text-[#D4FF00]" />
              </div>
              <div>
                <h2 className="text-xs font-mono font-black text-white uppercase tracking-widest leading-none">WheyoCard</h2>
                <span className="text-[9px] text-gray-400 uppercase tracking-wider mt-1 block">Your secure digital athlete-identity, target thresholds & objective</span>
              </div>
            </div>
            <ChevronDown className={cn("w-4 h-4 text-gray-400 transition-transform duration-300", expandedSections.wheyocard && "rotate-180")} />
          </button>

          <AnimatePresence initial={false}>
            {expandedSections.wheyocard && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden border-t border-white/5 bg-black/20"
              >
                <div className="p-5">
                  <div className="bg-[#0C0C0F] border border-[#D4FF00]/15 rounded-[24px] p-6 relative overflow-hidden group hover:border-[#D4FF00]/30 transition-all duration-500 shadow-xl max-w-2xl mx-auto">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-[#D4FF00]/[0.01] rounded-full blur-2xl" />
                    
                    <div className="flex justify-between items-start mb-6">
                      <div>
                        <span className="text-[7px] font-mono uppercase bg-[#D4FF00] text-black px-2 py-0.5 rounded font-black tracking-widest shadow-[0_4px_10px_rgba(212,255,0,0.2)]">
                          WHEYO CARD
                        </span>
                        <p className="text-[9px] text-gray-500 font-mono mt-1.5 uppercase tracking-widest leading-none">RANK LEVEL: PLATINUM ATHLETE</p>
                      </div>
                      
                      <button
                        onClick={() => {
                          if (isEditingPassport) {
                            savePassportChanges();
                          } else {
                            setIsEditingPassport(true);
                          }
                        }}
                        className="text-[8px] font-mono uppercase font-black tracking-widest text-[#D4FF00] bg-white/5 border border-white/5 hover:bg-[#D4FF00]/10 hover:border-[#D4FF00]/20 px-2.5 py-1 rounded-lg transition-all active:scale-95 cursor-pointer animate-pulse"
                      >
                        {isEditingPassport ? 'SAVE CARD' : 'EDIT CARD'}
                      </button>
                    </div>

                    {isEditingPassport ? (
                      <div className="space-y-4 pt-2">
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                          <div>
                            <label className="block text-[8px] font-mono text-gray-500 uppercase tracking-wider mb-1">Primary Objective</label>
                            <select
                              value={passportGoal}
                              onChange={(e) => setPassportGoal(e.target.value)}
                              className="w-full bg-[#121214] border border-white/10 rounded-lg p-2 text-[10px] text-white focus:outline-none focus:border-[#D4FF00]/50 font-mono"
                            >
                              <option value="Muscle Gain">Muscle Gain</option>
                              <option value="Fat Loss">Fat Loss</option>
                              <option value="Athletic Endurance">Athletic Endurance</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-[8px] font-mono text-gray-500 uppercase tracking-wider mb-1">Target Protein Goal (g)</label>
                            <input
                              type="number"
                              value={passportProtein}
                              onChange={(e) => setPassportProtein(Number(e.target.value))}
                              className="w-full bg-[#121214] border border-white/10 rounded-lg p-2 text-[10px] text-white focus:outline-none focus:border-[#D4FF00]/50 font-mono"
                            />
                          </div>
                          <div>
                            <label className="block text-[8px] font-mono text-gray-500 uppercase tracking-wider mb-1">Target Calorie (kcal)</label>
                            <input
                              type="number"
                              value={passportCalories}
                              onChange={(e) => setPassportCalories(Number(e.target.value))}
                              className="w-full bg-[#121214] border border-white/10 rounded-lg p-2 text-[10px] text-white focus:outline-none focus:border-[#D4FF00]/50 font-mono"
                            />
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={savePassportChanges}
                            className="px-3 py-1 bg-[#D4FF00] hover:bg-white text-black font-black uppercase text-[8px] tracking-wider rounded-lg transition-all cursor-pointer"
                          >
                            Confirm Details
                          </button>
                          <button
                            onClick={() => setIsEditingPassport(false)}
                            className="px-3 py-1 bg-white/5 hover:bg-white/10 text-gray-400 font-bold uppercase text-[8px] tracking-wider rounded-lg transition-all cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                          <span className="text-[8px] font-mono text-gray-600 uppercase tracking-widest block">Primary Objective</span>
                          <span className="text-xs sm:text-sm font-display font-bold text-white uppercase tracking-wider block mt-0.5">{profile?.fitness_goal || 'Muscle Gain'}</span>
                        </div>
                        <div>
                          <span className="text-[8px] font-mono text-gray-600 uppercase tracking-widest block">Target Protein Cap</span>
                          <span className="text-xs sm:text-sm font-mono font-extrabold text-[#D4FF00] block mt-0.5">{targetProteinGoal}g <span className="text-[9px] text-gray-500 font-normal">/ DAY</span></span>
                        </div>
                        <div>
                          <span className="text-[8px] font-mono text-gray-600 uppercase tracking-widest block">Consolidated Cap</span>
                          <span className="text-xs sm:text-sm font-mono font-extrabold text-white block mt-0.5">{targetCalGoal} kcal <span className="text-[9px] text-gray-600 font-normal">/ DAY</span></span>
                        </div>
                      </div>
                    )}

                    {/* Removed ISSUED IN and STATE: SECURE AUTHENTICATED lines */}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        {/* SECTION A: DAILY MACRO OVERVIEWS & PERFORMANCE */}
        <div className="border border-white/5 rounded-[20px] bg-[#0A0A0C] overflow-hidden shadow-sm">
          <button 
            onClick={() => toggleSection('nutrition')}
            className="w-full px-5 py-4 flex items-center justify-between hover:bg-white/[0.01] transition-all text-left outline-none"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#D4FF00]/10 border border-[#D4FF00]/20 text-[#D4FF00] rounded-lg">
                <Target className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-xs font-mono font-black text-white uppercase tracking-widest leading-none">Macro Milestones</h2>
                <span className="text-[9px] text-gray-500 uppercase tracking-wider mt-1 block">Live progress indicators & trends</span>
              </div>
            </div>
            <ChevronDown className={cn("w-4 h-4 text-gray-400 transition-transform duration-300", expandedSections.nutrition && "rotate-180")} />
          </button>

          <AnimatePresence initial={false}>
            {expandedSections.nutrition && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden border-t border-white/5 bg-black/20"
              >
                <div className="p-5 space-y-6">
                  {/* Real Macro Cards Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Protein Meter */}
                    <div className="bg-[#0D0D11] rounded-2xl border border-white/5 p-4 flex flex-col justify-between">
                      <div className="flex justify-between items-baseline mb-2">
                        <span className="text-[8px] font-mono text-gray-500 uppercase tracking-widest">Whey Protein Intake</span>
                        <span className="text-xs font-mono text-white font-bold">{dailyProtein}/{targetProteinGoal}g</span>
                      </div>
                      <div className="flex items-baseline gap-2 mb-3">
                        <span className="text-4xl font-display font-black text-white">{dailyProtein}</span>
                        <span className="text-xs font-mono text-[#D4FF00] uppercase font-bold">Protein Grams</span>
                      </div>
                      
                      {/* Bar progress indicator */}
                      <div className="w-full bg-white/5 rounded-full h-2.5 overflow-hidden border border-white/5 mb-4">
                        <div 
                          className="bg-gradient-to-r from-[#D4FF00] to-[#9FFF00] h-full rounded-full transition-all duration-300"
                          style={{ width: `${currentProteinPercentage}%` }}
                        />
                      </div>

                      {/* Simple direct addition handles */}
                      <div className="flex gap-2">
                        {[15, 30, 45].map(v => (
                          <button
                            key={v}
                            onClick={() => incProtein(v)}
                            className="flex-1 py-1.5 bg-white/5 hover:bg-[#D4FF00] hover:text-black hover:border-transparent text-gray-400 border border-white/5 rounded-lg text-[9px] font-mono font-bold uppercase transition-all"
                          >
                            +{v}g Scoop
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Energy Bank */}
                    <div className="bg-[#0D0D11] rounded-2xl border border-white/5 p-4 flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-baseline mb-2">
                          <span className="text-[8px] font-mono text-gray-500 uppercase tracking-widest">Active Calorie Target</span>
                          <span className="text-xs font-mono text-white font-bold">{dailyCalories}/{targetCalGoal} kcal</span>
                        </div>
                        <div className="flex items-baseline gap-2 mb-6">
                          <span className="text-4xl font-display font-black text-white">{dailyCalories}</span>
                          <span className="text-xs font-mono text-gray-400 uppercase font-bold">KCAL Bank</span>
                        </div>
                      </div>

                      <div className="border-t border-white/5 pt-3 flex justify-between items-center text-[10px] font-mono">
                        <span className="text-gray-500">REMAINING GAP:</span>
                        <span className="text-[#D4FF00] font-black">{Math.max(0, targetCalGoal - dailyCalories)} KCAL</span>
                      </div>
                    </div>
                  </div>

                  {/* Clean Non-cluttered Analytics Charts */}
                  <div className="space-y-3">
                    <span className="text-[9px] font-mono text-gray-500 uppercase tracking-widest font-black block pl-1">Weekly Macro Trend</span>
                    <div className="h-44 w-full bg-[#0D0D11] rounded-2xl border border-white/5 p-3">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={historyData}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff03" />
                          <XAxis dataKey="date" stroke="#666" fontSize={9} tickLine={false} axisLine={false} />
                          <YAxis stroke="#444" fontSize={9} tickLine={false} axisLine={false} />
                          <Tooltip 
                            contentStyle={{ backgroundColor: '#0C0C0E', border: '1px solid #222', borderRadius: '12px' }}
                            itemStyle={{ color: '#D4FF00', fontFamily: 'monospace', fontSize: '10px' }}
                            labelStyle={{ textTransform: 'uppercase', fontSize: '9px', color: '#888', fontFamily: 'monospace' }}
                          />
                          <Line 
                            type="monotone" 
                            dataKey="protein_consumed" 
                            name="Protein g" 
                            stroke="#D4FF00" 
                            strokeWidth={2} 
                            dot={false}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* SECTION B: RECENT TRANSACTIONS / ORDERS TIMELINE */}
        <div className="border border-white/5 rounded-[20px] bg-[#0A0A0C] overflow-hidden shadow-sm">
          <button 
            onClick={() => toggleSection('orders')}
            className="w-full px-5 py-4 flex items-center justify-between hover:bg-white/[0.01] transition-all text-left outline-none"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#D4FF00]/10 border border-[#D4FF00]/20 text-[#D4FF00] rounded-lg">
                <History className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-xs font-mono font-black text-white uppercase tracking-widest leading-none">Order Logs ({orders.length})</h2>
                <span className="text-[9px] text-gray-500 uppercase tracking-wider mt-1 block">Active dispatches & historical entries</span>
              </div>
            </div>
            <ChevronDown className={cn("w-4 h-4 text-gray-400 transition-transform duration-300", expandedSections.orders && "rotate-180")} />
          </button>

          <AnimatePresence initial={false}>
            {expandedSections.orders && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden border-t border-white/5 bg-black/20"
              >
                <div className="p-5 space-y-4">
                  {orders.length > 0 ? (
                    <div className="space-y-3">
                      {orders.map((o) => (
                        <div key={o.id} className="bg-[#0D0D11] border border-white/5 rounded-xl p-4 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-mono font-black text-white uppercase">BATCH #{o.id}</span>
                              <span className={cn(
                                "text-[8px] font-mono font-bold uppercase tracking-wider px-1.5 py-0.5 rounded",
                                o.status === 'delivered' ? "bg-green-500/10 text-green-400 border border-green-500/15" : "bg-yellow-500/10 text-yellow-400 border border-yellow-500/15"
                              )}>
                                {o.status}
                              </span>
                            </div>
                            <p className="text-[9px] text-gray-500 font-mono mt-1">
                              {new Date(o.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </p>
                            <div className="text-[10px] text-gray-400 font-mono mt-2">
                              Items: {o.items?.map(it => `${it.name || it.title} (x${it.qty || it.quantity || 1})`).join(', ')}
                            </div>
                          </div>

                          <div className="flex items-center justify-between sm:justify-end gap-3 border-t border-white/5 sm:border-0 pt-2 sm:pt-0">
                            <div className="text-left sm:text-right">
                              <span className="text-[8px] font-mono text-gray-500 uppercase block">Final Price</span>
                              <span className="text-sm font-display font-extrabold text-[#D4FF00]">₹{o.final_price}</span>
                            </div>
                            <button
                              onClick={() => {
                                o.items?.forEach(item => {
                                  addItem({
                                    id: item.id || '101',
                                    code: item.id || '101',
                                    name: item.name || 'Gourmet Healthy Meal',
                                    price: item.price || 149,
                                    protein: item.protein || 40,
                                    quantity: item.qty || 1,
                                    note: 'Reordered'
                                  });
                                });
                                setIsCartOpen(true);
                              }}
                              className="px-3 py-1.5 bg-white/5 hover:bg-[#D4FF00] hover:text-black rounded-lg text-[9px] font-mono uppercase tracking-widest font-black transition-all"
                            >
                              REFUEL
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <ShoppingBag className="w-8 h-8 text-neutral-800 mx-auto mb-2" />
                      <p className="text-[10px] font-mono text-gray-500 uppercase">No purchases registered on this locker</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* SECTION C: FAVORITE ATHLETE MEALS */}
        <div className="border border-white/5 rounded-[20px] bg-[#0A0A0C] overflow-hidden shadow-sm">
          <button 
            onClick={() => toggleSection('favorites')}
            className="w-full px-5 py-4 flex items-center justify-between hover:bg-white/[0.01] transition-all text-left outline-none"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#D4FF00]/10 border border-[#D4FF00]/20 text-[#D4FF00] rounded-lg">
                <Heart className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-xs font-mono font-black text-white uppercase tracking-widest leading-none">Favorite Dishes ({favorites.length})</h2>
                <span className="text-[9px] text-gray-500 uppercase tracking-wider mt-1 block">Quick replenishment shortlist</span>
              </div>
            </div>
            <ChevronDown className={cn("w-4 h-4 text-gray-400 transition-transform duration-300", expandedSections.favorites && "rotate-180")} />
          </button>

          <AnimatePresence initial={false}>
            {expandedSections.favorites && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden border-t border-white/5 bg-black/20"
              >
                <div className="p-5">
                  {favorites.length === 0 ? (
                    <div className="text-center py-10 bg-[#070709] border border-white/5 rounded-2xl p-6">
                      <Heart className="w-8 h-8 text-neutral-800 mx-auto mb-3 animate-pulse" />
                      <p className="text-xs font-display font-bold uppercase tracking-wider text-white mb-1">Your shortlist is empty</p>
                      <p className="text-[10px] text-gray-500 uppercase tracking-wide max-w-sm mx-auto leading-relaxed">
                        Navigate to the <span className="text-[#D4FF00] font-mono font-bold">Fuel Station</span> and tap the heart icon on any high-protein meal to save it here for speedy single-tap replenishment!
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {favorites.map(fav => (
                        <div key={fav.id} className="bg-[#0D0D11] border border-white/5 rounded-xl p-3 flex items-center justify-between gap-3 group hover:border-[#D4FF00]/30 transition-all">
                          <div className="flex gap-3 items-center min-w-0">
                            <img src={fav.image} alt={fav.name} className="w-12 h-12 rounded-lg object-cover border border-white/5 shrink-0" />
                            <div className="min-w-0">
                              <h4 className="text-xs font-display font-bold text-white uppercase tracking-tight truncate group-hover:text-[#D4FF00] transition-colors">{fav.name}</h4>
                              <p className="text-[9px] text-gray-500 font-mono uppercase mt-0.5">{fav.protein}g protein • {fav.calories} kcal</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-xs font-sans font-bold text-white">₹{fav.price}</span>
                            <button
                              onClick={() => {
                                addItem({
                                  id: fav.id,
                                  code: fav.code || fav.id,
                                  name: fav.name,
                                  price: fav.price,
                                  protein: fav.protein,
                                  quantity: 1,
                                  note: 'Instant from layout shortlist'
                                });
                                setIsCartOpen(true);
                              }}
                              className="p-2.5 bg-[#D4FF00] hover:bg-white text-black rounded-lg transition-all active:scale-95 cursor-pointer shadow-[0_0_10px_rgba(212,255,0,0.1)] hover:shadow-[0_0_15px_rgba(212,255,0,0.3)]"
                              title="Quick reorder to plate"
                            >
                              <ShoppingCart className="w-3.5 h-3.5 text-black" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* SECTION HYD: ATHLETE BIOMARKERS LOGBOOK */}
        <div className="border border-white/5 rounded-[20px] bg-[#0A0A0C] overflow-hidden shadow-sm">
          <button 
            onClick={() => toggleSection('hydration')}
            className="w-full px-5 py-4 flex items-center justify-between hover:bg-white/[0.01] transition-all text-left outline-none"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 rounded-lg">
                <ClipboardList className="w-4 h-4 text-cyan-400" />
              </div>
              <div>
                <h2 className="text-xs font-mono font-black text-white uppercase tracking-widest leading-none">Biomarkers Logging</h2>
                <span className="text-[9px] text-gray-500 uppercase tracking-wider mt-1 block">Log manual stats: Mutant mass, anabolic sleep, hydration tank, and lift sessions</span>
              </div>
            </div>
            <ChevronDown className={cn("w-4 h-4 text-gray-400 transition-transform duration-300", expandedSections.hydration && "rotate-180")} />
          </button>

          <AnimatePresence initial={false}>
            {expandedSections.hydration && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden border-t border-white/5 bg-black/20"
              >
                <div className="p-5 space-y-6">
                  {/* Dynamic workout streak indicator embedded in logbook with premium framer-motion glows */}
                  <motion.div 
                    animate={{
                      boxShadow: [
                        "0 0 0px rgba(249,115,22,0.0)",
                        "0 0 20px rgba(249,115,22,0.15)",
                        "0 0 0px rgba(249,115,22,0.0)"
                      ],
                      borderColor: [
                        "rgba(255,255,255,0.05)",
                        "rgba(249,115,22,0.2)",
                        "rgba(255,255,255,0.05)"
                      ]
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                    className="bg-[#070709] border rounded-xl p-4 space-y-3 relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/5 rounded-full blur-2xl pointer-events-none" />
                    <div className="relative z-10 flex justify-between items-center text-[9px] text-gray-400 uppercase font-mono tracking-wider">
                      <span>Active Exercise Streak</span>
                      <motion.span 
                        animate={{ scale: [1, 1.05, 1] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                        className="text-orange-400 font-bold flex items-center gap-1"
                      >
                        {activeStreak} {activeStreak === 1 ? 'Day' : 'Days'} 🔥
                      </motion.span>
                    </div>
                    <div className="relative z-10 flex gap-1.5">
                      {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, idx) => {
                        const isDayActive = idx < activeStreak;
                        return (
                          <div 
                            key={idx} 
                            className={cn(
                              "flex-1 h-6 rounded flex items-center justify-center text-[9px] font-mono font-bold border transition-all",
                              isDayActive 
                                ? "bg-orange-500/10 border-orange-500/20 text-orange-400 shadow-[0_2px_8px_rgba(249,115,22,0.2)]" 
                                : "bg-white/5 border-white/5 text-gray-600"
                            )}
                          >
                            {day}
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>

                  {/* Grid for manual input fields */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Sleep Card */}
                    <div className="bg-[#0D0D11] border border-white/5 rounded-xl p-4 space-y-3">
                      <span className="text-[8px] font-mono text-gray-500 uppercase tracking-widest block">ANABOLIC RECOVERY SLEEP</span>
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-display font-black text-white">{sleepLevel}</span>
                        <span className="text-xs font-mono text-gray-400">hours</span>
                      </div>
                      <div className="flex gap-1.5 items-center">
                        <button
                          onClick={() => applyBiomarkerChanges({ sleep_hours: Math.max(0, Number((sleepLevel - 0.5).toFixed(1))) })}
                          className="flex-1 py-1.5 bg-white/5 hover:bg-white/10 text-white rounded text-[10px] font-mono cursor-pointer transition-all active:scale-95 border border-white/5"
                        >
                          -0.5h
                        </button>
                        <button
                          onClick={() => applyBiomarkerChanges({ sleep_hours: Number((sleepLevel + 0.5).toFixed(1)) })}
                          className="flex-1 py-1.5 bg-white/5 hover:bg-white/10 text-white rounded text-[10px] font-mono cursor-pointer transition-all active:scale-95 border border-white/5"
                        >
                          +0.5h
                        </button>
                      </div>
                      <div className="flex gap-1.5 pt-1.5 border-t border-white/5">
                        <input
                          type="number"
                          step="0.1"
                          placeholder="precise"
                          value={localSleep}
                          onChange={(e) => setLocalSleep(e.target.value)}
                          className="flex-1 bg-black/40 border border-white/5 rounded px-2 py-1 text-[10px] font-mono text-white focus:outline-none focus:border-[#D4FF00]/40 text-center"
                        />
                        <button
                          onClick={() => {
                            const val = parseFloat(localSleep);
                            if (!isNaN(val) && val >= 0) {
                              applyBiomarkerChanges({ sleep_hours: val });
                            }
                          }}
                          className="px-2.5 py-1 bg-[#D4FF00] hover:bg-white text-black font-black rounded text-[9px] font-mono uppercase cursor-pointer"
                        >
                          Set
                        </button>
                      </div>
                    </div>

                    {/* Weight Card */}
                    <div className="bg-[#0D0D11] border border-white/5 rounded-xl p-4 space-y-3">
                      <span className="text-[8px] font-mono text-gray-500 uppercase tracking-widest block">MUTANT MASS (BODYWEIGHT)</span>
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-display font-black text-white">{weightLevel > 0 ? weightLevel : 'Not set'}</span>
                        <span className="text-xs font-mono text-gray-400">{weightLevel > 0 ? 'kg' : ''}</span>
                      </div>
                      <div className="flex gap-1.5">
                        <input
                          type="number"
                          step="0.1"
                          placeholder="e.g. 76.5 kg"
                          value={localWeight}
                          onChange={(e) => setLocalWeight(e.target.value)}
                          className="flex-1 bg-black/40 border border-white/5 rounded px-2 py-1 text-[10px] font-mono text-white focus:outline-none focus:border-[#D4FF00]/40"
                        />
                        <button
                          onClick={() => {
                            const val = parseFloat(localWeight);
                            if (!isNaN(val) && val > 0) {
                              applyBiomarkerChanges({ body_weight: val });
                            }
                          }}
                          className="px-3.5 py-1 bg-[#D4FF00] hover:bg-white text-black font-black rounded text-[9px] font-mono uppercase cursor-pointer transition-all active:scale-95"
                        >
                          Log
                        </button>
                      </div>
                      <p className="text-[7.5px] font-mono text-gray-500 uppercase leading-none mt-1">Updates immediately without page reset</p>
                    </div>

                    {/* Gym Workout Confirmation */}
                    <div className="bg-[#0D0D11] border border-white/5 rounded-xl p-4 flex flex-col justify-between">
                      <div>
                        <span className="text-[8px] font-mono text-gray-500 uppercase tracking-widest block">SICK IRON WORKOUT VERIFIED</span>
                        <span className="text-[10px] font-mono text-gray-400 block mt-2">Mark today's target exercise session as complete.</span>
                      </div>
                      <button
                        onClick={() => applyBiomarkerChanges({ workout_logged: !workoutLoggedToday })}
                        className={cn(
                          "w-full py-2.5 rounded-lg text-[9px] font-mono uppercase font-bold tracking-widest transition-all cursor-pointer mt-3",
                          workoutLoggedToday
                            ? "bg-green-500/10 border border-green-500/20 text-green-400 font-extrabold"
                            : "bg-[#D4FF00] hover:bg-white text-black font-black"
                        )}
                      >
                        {workoutLoggedToday ? 'Workout Logged (Feast Time!) 🔥' : 'Log Savage Iron Session'}
                      </button>
                    </div>
                  </div>

                  {/* Water Tracker banner inside Logbook */}
                  <div className="bg-[#0D0D11] border border-[#3B82F6]/14 rounded-xl p-4">
                    <div className="flex justify-between items-center mb-3">
                      <div className="flex items-center gap-2">
                        <Droplet className="w-4 h-4 text-blue-400" />
                        <span className="text-[9px] font-mono text-gray-400 uppercase tracking-widest">Water Intake Target (4000ml)</span>
                      </div>
                      <span className="text-[10px] font-mono text-white font-bold">{hydrationLevel}/4000 ml</span>
                    </div>

                    {/* Progres slider bar */}
                    <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden mb-4">
                      <div className="bg-blue-500 h-full rounded-full transition-all" style={{ width: `${Math.min(100, (hydrationLevel/4000)*100)}%` }} />
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <button
                        onClick={() => applyBiomarkerChanges({ water_ml: hydrationLevel + 250 })}
                        className="py-1.5 bg-white/5 hover:bg-blue-500/10 hover:text-blue-400 border border-white/5 hover:border-blue-500/20 text-gray-400 rounded text-[9px] font-mono font-bold uppercase transition-all cursor-pointer"
                      >
                        +250ml Cup
                      </button>
                      <button
                        onClick={() => applyBiomarkerChanges({ water_ml: hydrationLevel + 500 })}
                        className="py-1.5 bg-white/5 hover:bg-blue-500/10 hover:text-blue-400 border border-white/5 hover:border-blue-500/20 text-gray-400 rounded text-[9px] font-mono font-bold uppercase transition-all cursor-pointer"
                      >
                        +500ml Shaker
                      </button>
                      <button
                        onClick={() => applyBiomarkerChanges({ water_ml: 0 })}
                        className="py-1.5 bg-red-950/20 hover:bg-red-0/40 text-red-400 rounded text-[9px] font-mono font-bold uppercase transition-all cursor-pointer border border-transparent"
                      >
                        Reset Drink
                      </button>
                    </div>
                  </div>

                  {/* STANDALONE DYNAMIC TREND CHARTS - NO AI */}
                  {biomarkerHistory.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 pt-4 border-t border-white/5">
                      {/* Bodyweight Trend Chart */}
                      <div className="bg-[#070709] border border-white/5 p-4 rounded-xl space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-[8.5px] font-mono text-gray-400 uppercase tracking-widest font-black block">Bodyweight Trend (7 Days)</span>
                          <span className="text-[9px] font-mono text-[#D4FF00] font-bold">{weightLevel > 0 ? `${weightLevel} kg` : 'Latest Log'}</span>
                        </div>
                        <div className="h-40 w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={biomarkerHistory}>
                              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                              <XAxis dataKey="date" stroke="rgba(255,255,255,0.3)" fontSize={8.5} tickLine={false} />
                              <YAxis stroke="rgba(255,255,255,0.3)" fontSize={8.5} domain={['dataMin - 2', 'dataMax + 2']} tickLine={false} width={25} />
                              <Tooltip 
                                contentStyle={{ backgroundColor: '#0C0C0F', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                                labelStyle={{ color: '#aaa', fontSize: '9px', fontFamily: 'monospace' }}
                                itemStyle={{ color: '#D4FF00', fontSize: '9.5px', fontFamily: 'monospace' }}
                              />
                              <Line 
                                type="monotone" 
                                dataKey="weight" 
                                name="Weight (kg)" 
                                stroke="#D4FF00" 
                                strokeWidth={2.5} 
                                dot={{ fill: '#0C0C0F', stroke: '#D4FF00', strokeWidth: 1.5, r: 3.5 }} 
                                activeDot={{ r: 5 }} 
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </div>

                      {/* Sleep Trend Chart */}
                      <div className="bg-[#070709] border border-white/5 p-4 rounded-xl space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-[8.5px] font-mono text-gray-400 uppercase tracking-widest font-black block">Sleep Duration (7 Days)</span>
                          <span className="text-[9px] font-mono text-blue-400 font-bold">{sleepLevel > 0 ? `${sleepLevel} Hours` : 'Latest Log'}</span>
                        </div>
                        <div className="h-40 w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={biomarkerHistory}>
                              <defs>
                                <linearGradient id="sleepGrad" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.25}/>
                                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                              <XAxis dataKey="date" stroke="rgba(255,255,255,0.3)" fontSize={8.5} tickLine={false} />
                              <YAxis stroke="rgba(255,255,255,0.3)" fontSize={8.5} domain={[4, 11]} tickLine={false} width={15} />
                              <Tooltip 
                                contentStyle={{ backgroundColor: '#0C0C0F', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                                labelStyle={{ color: '#aaa', fontSize: '9px', fontFamily: 'monospace' }}
                                itemStyle={{ color: '#3B82F6', fontSize: '9.5px', fontFamily: 'monospace' }}
                              />
                              <Area 
                                type="monotone" 
                                dataKey="sleep" 
                                name="Sleep (h)" 
                                stroke="#3B82F6" 
                                fillOpacity={1}
                                fill="url(#sleepGrad)" 
                                strokeWidth={2}
                                dot={{ fill: '#0C0C0F', stroke: '#3B82F6', strokeWidth: 1.5, r: 3 }}
                              />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    </div>
                  )}

                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* SECTION SPLIT: ADVANCED MACRONUTRIENT RATIO SPLITS */}
        <div className="border border-white/5 rounded-[20px] bg-[#0A0A0C] overflow-hidden shadow-sm">
          <button 
            onClick={() => toggleSection('macrosplit')}
            className="w-full px-5 py-4 flex items-center justify-between hover:bg-white/[0.01] transition-all text-left outline-none"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#D4FF00]/10 border border-[#D4FF00]/20 text-[#D4FF00] rounded-lg">
                <Activity className="w-4 h-4 text-[#D4FF00]" />
              </div>
              <div>
                <h2 className="text-xs font-mono font-black text-white uppercase tracking-widest leading-none">Macronutrient Split Distribution</h2>
                <span className="text-[9px] text-gray-500 uppercase tracking-wider mt-1 block">Biochemical split calibrated for {profile?.fitness_goal || 'Muscle Gain'}</span>
              </div>
            </div>
            <ChevronDown className={cn("w-4 h-4 text-gray-400 transition-transform duration-300", expandedSections.macrosplit && "rotate-180")} />
          </button>

          <AnimatePresence initial={false}>
            {expandedSections.macrosplit && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden border-t border-white/5 bg-black/20"
              >
                <div className="p-5 max-w-xl mx-auto space-y-5">
                  <div className="bg-[#070709] border border-white/5 p-4 rounded-xl">
                    <p className="text-[10px] font-mono text-gray-400 uppercase tracking-wider leading-relaxed">
                      WHEYO biochem algorithms have mapped your <span className="text-white font-bold">{profile?.daily_calorie_goal || 2200} kcal</span> target using premium athletic threshold split distribution. Protein is locked to priority tissue synthesis, followed by energetic balances:
                    </p>
                  </div>

                  <div className="space-y-4">
                    {/* PROTEIN SPLIT */}
                    <div className="bg-[#0D0D11] border border-white/5 rounded-xl p-4">
                      <div className="flex justify-between items-baseline mb-2">
                        <span className="text-xs font-bold text-white uppercase tracking-wider font-display">Lean Muscle Protein</span>
                        <span className="text-xs font-mono text-[#D4FF00] font-black">{dynamicMacroCalculation.proteinG}g <span className="text-[9px] text-gray-500">({dynamicMacroCalculation.proteinKcal} kcal)</span></span>
                      </div>
                      <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-[#D4FF00] h-full rounded-full" style={{ width: `${dynamicMacroCalculation.proteinPct}%` }} />
                      </div>
                      <div className="flex justify-between text-[8px] font-mono text-gray-500 uppercase mt-1.5">
                        <span>Locker Locked Priority</span>
                        <span>{dynamicMacroCalculation.proteinPct}% of energy</span>
                      </div>
                    </div>

                    {/* CARBS SPLIT */}
                    <div className="bg-[#0D0D11] border border-white/5 rounded-xl p-4">
                      <div className="flex justify-between items-baseline mb-2">
                        <span className="text-xs font-bold text-white uppercase tracking-wider font-display">Glycogen Carb Fuel</span>
                        <span className="text-xs font-mono text-orange-400 font-extrabold">{dynamicMacroCalculation.carbsG}g <span className="text-[9px] text-gray-500">({dynamicMacroCalculation.carbsKcal} kcal)</span></span>
                      </div>
                      <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-orange-400 h-full rounded-full" style={{ width: `${dynamicMacroCalculation.carbsPct}%` }} />
                      </div>
                      <div className="flex justify-between text-[8px] font-mono text-gray-500 uppercase mt-1.5">
                        <span>Energy & Power Cycles</span>
                        <span>{dynamicMacroCalculation.carbsPct}% of energy</span>
                      </div>
                    </div>

                    {/* FATS SPLIT */}
                    <div className="bg-[#0D0D11] border border-white/5 rounded-xl p-4">
                      <div className="flex justify-between items-baseline mb-2">
                        <span className="text-xs font-bold text-white uppercase tracking-wider font-display">Hormonal Support Lipids</span>
                        <span className="text-xs font-mono text-red-400 font-extrabold">{dynamicMacroCalculation.fatsG}g <span className="text-[9px] text-gray-500">({dynamicMacroCalculation.fatsKcal} kcal)</span></span>
                      </div>
                      <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-red-400 h-full rounded-full" style={{ width: `${dynamicMacroCalculation.fatsPct}%` }} />
                      </div>
                      <div className="flex justify-between text-[8px] font-mono text-gray-500 uppercase mt-1.5">
                        <span>Anabolic Cellular Blocks</span>
                        <span>{dynamicMacroCalculation.fatsPct}% of energy</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* SECTION D: STAGE ATHLETE METRIC CALCULATORS */}
        <div className="border border-white/5 rounded-[20px] bg-[#0A0A0C] overflow-hidden shadow-sm">
          <button 
            onClick={() => toggleSection('calculator')}
            className="w-full px-5 py-4 flex items-center justify-between hover:bg-white/[0.01] transition-all text-left outline-none"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#D4FF00]/10 border border-[#D4FF00]/20 text-[#D4FF00] rounded-lg">
                <Calculator className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-xs font-mono font-black text-white uppercase tracking-widest leading-none">TDEE Estimator</h2>
                <span className="text-[9px] text-gray-500 uppercase tracking-wider mt-1 block">Maintenance and shred/bulk calibrations</span>
              </div>
            </div>
            <ChevronDown className={cn("w-4 h-4 text-gray-400 transition-transform duration-300", expandedSections.calculator && "rotate-180")} />
          </button>

          <AnimatePresence initial={false}>
            {expandedSections.calculator && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden border-t border-white/5 bg-black/20"
              >
                <div className="p-5 max-w-xl mx-auto space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[8px] font-mono text-gray-500 uppercase">Weight (kg)</label>
                      <input 
                        type="number" 
                        value={weightInput}
                        onChange={(e) => setWeightInput(e.target.value)}
                        className="w-full bg-[#121214] border border-white/5 rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[8px] font-mono text-gray-500 uppercase">Height (cm)</label>
                      <input 
                        type="number" 
                        value={heightInput}
                        onChange={(e) => setHeightInput(e.target.value)}
                        className="w-full bg-[#121214] border border-white/5 rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[8px] font-mono text-gray-500 uppercase">Age (Years)</label>
                      <input 
                        type="number" 
                        value={ageInput}
                        onChange={(e) => setAgeInput(e.target.value)}
                        className="w-full bg-[#121214] border border-white/5 rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[8px] font-mono text-gray-500 uppercase">Biological Sex</label>
                      <select 
                        value={genderInput}
                        onChange={(e) => setGenderInput(e.target.value)}
                        className="w-full bg-[#121214] border border-white/5 rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                      >
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                      </select>
                    </div>
                    <div className="col-span-2 space-y-1">
                      <label className="text-[8px] font-mono text-gray-500 uppercase">Activity Coefficient</label>
                      <select 
                        value={activityInput}
                        onChange={(e) => setActivityInput(e.target.value)}
                        className="w-full bg-[#121214] border border-white/5 rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                      >
                        <option value="1.2">Sedentary (No workouts)</option>
                        <option value="1.375">Light (1-2 times/week)</option>
                        <option value="1.55">Moderate (3-5 times/week)</option>
                        <option value="1.725">Extreme (6-7 intense sessions/week)</option>
                      </select>
                    </div>
                  </div>

                  <button
                    onClick={runBmrCalc}
                    className="w-full py-2.5 bg-[#D4FF00] hover:bg-white text-black font-black uppercase rounded-lg text-xs tracking-wider transition-all duration-200 active:scale-95 cursor-pointer"
                  >
                    Solve Bio-Energy Budget
                  </button>

                  <AnimatePresence>
                    {calculatedTdee !== null && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                        className="p-4 bg-[#0D0D11] border border-white/5 rounded-xl text-center space-y-3"
                      >
                        <div className="flex items-baseline justify-center gap-1.5">
                          <span className="text-3xl font-display font-black text-white">{calculatedTdee}</span>
                          <span className="text-[9px] font-mono text-gray-500">KCAL / DAY CAP</span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/5 text-left">
                          <div className="bg-white/[0.01] p-2 rounded border border-white/5">
                            <span className="block text-[7px] font-mono text-gray-500 uppercase">Bulking Peak (+350)</span>
                            <span className="text-sm font-bold text-white">{calculatedTdee + 350} kcal</span>
                          </div>
                          <div className="bg-white/[0.01] p-2 rounded border border-white/5">
                            <span className="block text-[7px] font-mono text-gray-500 uppercase">Cutting Deficit (-400)</span>
                            <span className="text-sm font-bold text-[#D4FF00]">{calculatedTdee - 400} kcal</span>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* SECTION E: USER GOAL & PROFILE SETTINGS */}
        <div className="border border-white/5 rounded-[20px] bg-[#0A0A0C] overflow-hidden shadow-sm">
          <button 
            onClick={() => toggleSection('settings')}
            className="w-full px-5 py-4 flex items-center justify-between hover:bg-white/[0.01] transition-all text-left outline-none"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#D4FF00]/10 border border-[#D4FF00]/20 text-[#D4FF00] rounded-lg">
                <SettingsIcon className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-xs font-mono font-black text-white uppercase tracking-widest leading-none">Parameters & Settings</h2>
                <span className="text-[9px] text-gray-500 uppercase tracking-wider mt-1 block">Customize target macros and goals</span>
              </div>
            </div>
            <ChevronDown className={cn("w-4 h-4 text-gray-400 transition-transform duration-300", expandedSections.settings && "rotate-180")} />
          </button>

          <AnimatePresence initial={false}>
            {expandedSections.settings && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden border-t border-white/5 bg-black/20"
              >
                <div className="p-5 max-w-xl mx-auto space-y-4">
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-[8px] font-mono text-gray-500 uppercase pl-1 animate-pulse">Personal Display Name</label>
                      <input 
                        type="text" 
                        value={settingsForm.full_name}
                        onChange={(e) => setSettingsForm({ ...settingsForm, full_name: e.target.value })}
                        className="w-full bg-[#121214] border border-white/5 rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[8px] font-mono text-gray-500 uppercase pl-1">Mobile Contact No</label>
                      <input 
                        type="text" 
                        value={settingsForm.phone}
                        onChange={(e) => setSettingsForm({ ...settingsForm, phone: e.target.value })}
                        className="w-full bg-[#121214] border border-white/5 rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[8px] font-mono text-gray-500 uppercase">Protein Goal (g)</label>
                        <input 
                          type="number" 
                          value={settingsForm.daily_protein_goal}
                          onChange={(e) => setSettingsForm({ ...settingsForm, daily_protein_goal: Number(e.target.value) })}
                          className="w-full bg-[#121214] border border-white/5 rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[8px] font-mono text-gray-500 uppercase">Calorie Goal (kcal)</label>
                        <input 
                          type="number" 
                          value={settingsForm.daily_calorie_goal}
                          onChange={(e) => setSettingsForm({ ...settingsForm, daily_calorie_goal: Number(e.target.value) })}
                          className="w-full bg-[#121214] border border-white/5 rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[8px] font-mono text-gray-500 uppercase">Active Fitness Goal</label>
                      <select 
                        value={settingsForm.fitness_goal}
                        onChange={(e) => setSettingsForm({ ...settingsForm, fitness_goal: e.target.value })}
                        className="w-full bg-[#121214] border border-white/5 rounded-lg px-3 py-2 text-xs text-white focus:outline-none cursor-pointer"
                      >
                        <option value="Muscle Gain">Muscle Gain (Heavy Hypertrophy)</option>
                        <option value="Fat Loss">Fat Loss (Deficit Precision)</option>
                        <option value="Maintenance">Maintenance (Biological Equilibrium)</option>
                      </select>
                    </div>
                  </div>

                  <button
                    onClick={applySettings}
                    disabled={isSavingSettings}
                    className="w-full py-2.5 bg-[#D4FF00] disabled:bg-neutral-850 disabled:text-gray-500 hover:bg-white text-black font-black uppercase rounded-lg text-xs tracking-wider transition-all duration-200 active:scale-95 cursor-pointer flex items-center justify-center gap-2"
                  >
                    {isSavingSettings ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Synchronizing Data...</span>
                      </>
                    ) : (
                      <span>Save Parameters</span>
                    )}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>

      {/* SECTION U: UNIVERSAL ATHLETE INTEGRATED GRAPH & CALCULATION DECK */}
      <div className="mt-8 border border-white/5 rounded-[24px] bg-[#0A0A0C] p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#D4FF00]/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6 border-b border-white/5 pb-5">
          <div>
            <h2 className="text-sm font-mono font-black text-white uppercase tracking-widest flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#D4FF00]" /> UNIVERSAL ATHLETE LOGS
            </h2>
          </div>

          {/* Controls: Days Range & Metrics View filter */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Days Range Select */}
            <div className="flex bg-black/40 border border-white/5 rounded-lg p-1">
              {([7, 14, 30] as const).map(days => (
                <button
                  key={days}
                  onClick={() => setUniversalRange(days)}
                  className={cn(
                    "px-3 py-1 rounded text-[9px] font-mono uppercase tracking-wider font-bold transition-all cursor-pointer",
                    universalRange === days 
                      ? "bg-[#D4FF00] text-black font-black" 
                      : "text-gray-400 hover:text-white"
                  )}
                >
                  {days}D
                </button>
              ))}
            </div>

            {/* Metric Selector Select */}
            <select
              value={universalView}
              onChange={(e: any) => setUniversalView(e.target.value)}
              className="bg-black border border-white/10 text-white rounded-lg p-1.5 text-[9px] uppercase font-mono font-bold focus:outline-none focus:border-[#D4FF00]/50 cursor-pointer"
            >
              <option value="all">Unified Overlap (All)</option>
              <option value="protein">Protein Only</option>
              <option value="water">Hydration Levels</option>
              <option value="sleep">Anabolic Recovery Sleep</option>
              <option value="weight">Bodyweight Mutant Mass</option>
            </select>
          </div>
        </div>

        {/* Dynamic Calculations Bento Grid (Strict calculations, absolutely NO AI placeholders) */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6 bg-black/30 border border-white/5 rounded-xl p-4">
          <div className="space-y-1">
            <span className="text-[7.5px] font-mono text-gray-500 uppercase tracking-widest block leading-none">BIOMETER ACTIVE ADHERENCE</span>
            <span className="text-lg font-display font-black text-white block mt-1">{universalStats.consistencyRate}%</span>
            <span className="text-[8px] font-mono text-[#D4FF00] block uppercase tracking-wider">Consistency Core</span>
          </div>

          <div className="space-y-1">
            <span className="text-[7.5px] font-mono text-gray-500 uppercase tracking-widest block leading-none">WEEKLY AVERAGE PROTEIN</span>
            <span className="text-lg font-display font-medium text-white block mt-1">{universalStats.avgProtein}g</span>
            <span className="text-[8px] font-mono text-gray-400 block uppercase tracking-wider">Target: {targetProteinGoal}g/d</span>
          </div>

          <div className="space-y-1">
            <span className="text-[7.5px] font-mono text-gray-500 uppercase tracking-widest block leading-none">HYDRATION RATE MEAN</span>
            <span className="text-lg font-display font-medium text-white block mt-1">{universalStats.avgWater}ml</span>
            <span className="text-[8px] font-mono text-blue-400 block uppercase tracking-wider">Target: 4000ml</span>
          </div>

          <div className="space-y-1">
            <span className="text-[7.5px] font-mono text-gray-500 uppercase tracking-widest block leading-none">SLEEP HOURS</span>
            <span className="text-lg font-display font-medium text-white block mt-1">{universalStats.avgSleep}h</span>
            <span className="text-[8px] font-mono text-violet-400 block uppercase tracking-wider">Sleep Hours Mean</span>
          </div>

          <div className="col-span-2 md:col-span-1 space-y-1">
            <span className="text-[7.5px] font-mono text-gray-500 uppercase tracking-widest block leading-none">COMPLETED WORKOUTS</span>
            <span className="text-lg font-display font-medium text-[#D4FF00] block mt-1">{universalStats.totalWorkouts} sessions</span>
            <span className="text-[8px] font-mono text-gray-400 block uppercase tracking-wider">Savage Sessions</span>
          </div>
        </div>

        {/* Dynamic Recharts container */}
        <div className="h-64 sm:h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={unifiedTrendData} margin={{ top: 15, right: 20, left: 20, bottom: 20 }}>
              <defs>
                <linearGradient id="proteinGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#D4FF00" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#D4FF00" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="waterGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="sleepGradUniv" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#A78BFA" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#A78BFA" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="weightGradUniv" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#F97316" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#F97316" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
              <XAxis 
                dataKey="label" 
                stroke="rgba(255,255,255,0.4)" 
                fontSize={9} 
                tickLine={false} 
                label={{ value: 'DATES (DAY/MONTH)', position: 'insideBottom', offset: -10, fill: 'rgba(255,255,255,0.3)', fontSize: 7, fontFamily: 'monospace', fontWeight: 'bold' }}
              />
              <YAxis 
                yAxisId="left" 
                stroke="rgba(255,255,255,0.4)" 
                fontSize={9} 
                tickLine={false} 
                width={35} 
                label={{ value: 'PROT (g) / SLEEP (h) / MASS (kg)', angle: -90, position: 'insideLeft', offset: -5, fill: 'rgba(255,255,255,0.3)', fontSize: 7, fontFamily: 'monospace', fontWeight: 'bold' }}
              />
              <YAxis 
                yAxisId="right" 
                orientation="right" 
                stroke="rgba(255,255,255,0.2)" 
                fontSize={9} 
                tickLine={false} 
                width={35} 
                label={{ value: 'WATER HYDRATION (ml)', angle: 90, position: 'insideRight', offset: -5, fill: 'rgba(255,255,255,0.3)', fontSize: 7, fontFamily: 'monospace', fontWeight: 'bold' }}
              />
              <Tooltip
                contentStyle={{ backgroundColor: '#0C0C0F', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px' }}
                labelStyle={{ color: '#888', fontSize: '9px', fontFamily: 'monospace', textTransform: 'uppercase' }}
                itemStyle={{ fontSize: '10px', fontFamily: 'monospace' }}
              />

              {(universalView === 'all' || universalView === 'protein') && (
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="protein"
                  name="Protein (g)"
                  stroke="#D4FF00"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#proteinGrad)"
                />
              )}

              {(universalView === 'all' || universalView === 'water') && (
                <Area
                  yAxisId="right"
                  type="monotone"
                  dataKey="water"
                  name="Water (ml)"
                  stroke="#3B82F6"
                  strokeWidth={2}
                  fillOpacity={0.6}
                  fill="url(#waterGrad)"
                />
              )}

              {(universalView === 'all' || universalView === 'sleep') && (
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="sleep"
                  name="Sleep (hrs)"
                  stroke="#A78BFA"
                  strokeWidth={2}
                  fillOpacity={0.6}
                  fill="url(#sleepGradUniv)"
                />
              )}

              {(universalView === 'all' || universalView === 'weight') && (
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="weight"
                  name="Weight (kg)"
                  stroke="#F97316"
                  strokeWidth={2.5}
                  fillOpacity={0.5}
                  fill="url(#weightGradUniv)"
                />
              )}
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Custom Legend */}
        <div className="flex gap-4 items-center justify-center flex-wrap mt-5 border-t border-white/5 pt-4">
          {(universalView === 'all' || universalView === 'protein') && (
            <div className="flex items-center gap-1.5 text-[9px] font-mono uppercase text-gray-400">
              <span className="w-2.5 h-2.5 rounded-full bg-[#D4FF00]" />
              <span>Protein (g)</span>
            </div>
          )}
          {(universalView === 'all' || universalView === 'water') && (
            <div className="flex items-center gap-1.5 text-[9px] font-mono uppercase text-gray-400">
              <span className="w-2.5 h-2.5 rounded-full bg-[#3B82F6]" />
              <span>Water Intake (ml)</span>
            </div>
          )}
          {(universalView === 'all' || universalView === 'sleep') && (
            <div className="flex items-center gap-1.5 text-[9px] font-mono uppercase text-gray-400">
              <span className="w-2.5 h-2.5 rounded-full bg-[#A78BFA]" />
              <span>Sleep Hours</span>
            </div>
          )}
          {(universalView === 'all' || universalView === 'weight') && (
            <div className="flex items-center gap-1.5 text-[9px] font-mono uppercase text-gray-400">
              <span className="w-2.5 h-2.5 rounded-full bg-[#F97316]" />
              <span>Bodyweight (kg)</span>
            </div>
          )}
        </div>
      </div>

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
                    Consistent protein tracking & workout discipline logged for <span className="text-[#D4FF00] font-black">7 Days</span>. You have officially unlocked the Iron Disciple title & earned 5% extra cashbacks on your next order!
                  </p>
                </>
              ) : (
                <>
                  <h2 className="text-2xl font-display font-black text-white uppercase tracking-tight">
                    MUTANT <span className="text-[#D4FF00]">BEAST</span>
                  </h2>
                  <p className="text-[11px] font-mono text-gray-400 mt-4 leading-relaxed max-w-xs mx-auto">
                    Superior status attained! Consistent tracking for <span className="text-[#D4FF00] font-black">30 Days</span>. You have unlocked exclusive complimentary shaker coupon code: <span className="text-[#D4FF00] font-black block bg-white/5 py-1.5 px-3 rounded mt-2 border border-white/5 tracking-wider font-mono">MUTANTSHAKER30</span>
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
                  7-Day Milestone {activeStreak >= 7 ? '✓' : '🔒'}
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
                  30-Day Milestone {activeStreak >= 30 ? '✓' : '🔒'}
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

      {/* GAMIFIED COLLECTIBLE ATHLETE STATUS CARD FOR SOCIAL MEDIA SHARING */}
      <div className="mt-16 flex flex-col items-center gap-6 px-4 max-w-lg mx-auto">
        <div className="text-center">
          <h3 className="text-sm font-mono uppercase tracking-widest text-[#D4FF00] mb-1 leading-none">WHEYO-PRO HUB</h3>
          <h2 className="text-xl font-display font-black text-white uppercase tracking-tight">
            SHARE YOUR <span className="text-[#D4FF00]">PROGRESS</span>
          </h2>
          <p className="text-[10px] font-mono text-gray-400 mt-2 leading-relaxed">
            Choose your signature squad, then export your dynamic status card directly to Instagram & WhatsApp stories.
          </p>
        </div>

        {/* TEAM SIGNATURE SELECTION CONTROLS */}
        <div className="w-full">
          <span className="text-[8px] font-mono text-gray-400 uppercase tracking-widest block text-center mb-2.5">
            CHOOSE YOUR TEAM DIVISION
          </span>
          <div className="grid grid-cols-2 gap-2 w-full">
            {[
              { id: 'TEAM SHRED', desc: 'FAT LOSS & DEFINITION', color: '#ff4a4a' },
              { id: 'TEAM BULK', desc: 'SIZE & HYPERTROPHY', color: '#D4FF00' },
              { id: 'TEAM POWER', desc: 'STRENGTH & HEAVY LIFTS', color: '#00ddff' },
              { id: 'TEAM ATHLETIC', desc: 'ENDURANCE & AGILITY', color: '#ff9900' },
            ].map((team) => (
              <button
                key={team.id}
                onClick={() => setSelectedTeam(team.id)}
                type="button"
                style={{ 
                  borderColor: selectedTeam === team.id ? team.color : 'rgba(255,255,255,0.06)',
                  boxShadow: selectedTeam === team.id ? `0 0 10px ${team.color}1e` : 'none'
                }}
                className={cn(
                  "p-2.5 rounded-xl border text-center transition-all duration-300 cursor-pointer flex flex-col items-center justify-center gap-0.5",
                  selectedTeam === team.id
                    ? "bg-zinc-900"
                    : "bg-black/40 hover:bg-white/5 border-white/5"
                )}
              >
                <span 
                  style={{ color: selectedTeam === team.id ? team.color : '#a1a1aa' }}
                  className="text-[10px] font-mono font-black uppercase tracking-wider"
                >
                  {team.id}
                </span>
                <span className="text-[7px] text-gray-400 font-mono tracking-wider uppercase">
                  {team.desc}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* HIGH-FIDELITY PREVIEW CARD ATTACHED TO REF FOR RASTERING */}
        <div className="w-full relative p-2 bg-black/40 rounded-3xl border border-white/5 shadow-[0_10px_35px_rgba(0,0,0,0.5)]">
          <div 
            ref={cardRef} 
            className="relative bg-gradient-to-br from-[#0c0c14] via-[#040406] to-[#0c0c14] border-3 border-[#D4FF00] rounded-2xl p-5 sm:p-7 w-full relative overflow-hidden shadow-[0_0_35px_rgba(212,255,0,0.18)] select-none text-left"
            id="status-card-preview"
          >
            {/* Neon background overlays */}
            <div className="absolute top-0 right-0 w-36 h-36 bg-[#D4FF00]/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-36 h-36 bg-[#00ddff]/5 rounded-full blur-3xl pointer-events-none" />
            
            {/* Holographic scanner active lines */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#D4FF00]/15 to-transparent pointer-events-none" />
            
            <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
              <div>
                <span className="text-[10px] font-mono font-black text-[#D4FF00] tracking-widest uppercase bg-[#D4FF00]/10 px-2 py-0.5 border border-[#D4FF00]/30 rounded">
                  WHEYO-PRO CARD
                </span>
              </div>
              <div className="text-[9px] font-mono text-[#D4FF00] uppercase tracking-widest text-right font-black">
                VERIFIED ATHLETE
              </div>
            </div>

            <div className="flex flex-row items-center justify-between gap-3">
              <div className="flex-1 min-w-0">
                <h1 
                  className="text-xl sm:text-2xl font-mono font-black text-white uppercase tracking-tight leading-none truncate"
                  title={(user?.email?.split('@')[0] || 'MUTANT_X').toUpperCase()}
                >
                  {(user?.email?.split('@')[0] || 'MUTANT_X').toUpperCase()}
                </h1>
                <p className="text-[9px] font-mono text-[#D4FF00] mt-1 uppercase font-bold tracking-widest truncate">
                  {selectedTeam} // ACTIVE
                </p>
                
                <div className="flex gap-1.5 sm:gap-2 mt-3.5">
                  <div className="bg-white/5 border border-white/10 px-2 md:px-2.5 py-1 rounded-lg">
                    <span className="text-[6px] text-gray-400 font-mono block uppercase">ACTIVE STREAK</span>
                    <span className="text-[10px] md:text-xs font-mono font-black text-[#D4FF00]">{activeStreak} DAYS 🔥</span>
                  </div>
                  <div className="bg-white/5 border border-white/10 px-2 md:px-2.5 py-1 rounded-lg">
                    <span className="text-[6px] text-gray-400 font-mono block uppercase">WORKOUTS</span>
                    <span className="text-[10px] md:text-xs font-mono font-black text-white">{universalStats.totalWorkouts || 0} LOGGED</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-center justify-center border-l border-white/10 pl-3 min-w-[75px] sm:min-w-[85px]">
                <span className="text-[6px] text-gray-400 font-mono font-bold uppercase tracking-wider mb-1.5">CONSISTENCY</span>
                <div className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-full border-2 border-white/5 flex items-center justify-center bg-black/60 shadow-[0_0_15px_rgba(212,255,0,0.1)]">
                  <div className="text-center">
                    <span className="text-xs sm:text-sm font-mono font-black text-[#D4FF00] block leading-none">{universalStats.consistencyRate}%</span>
                    <span className="text-[4px] sm:text-[5px] text-gray-500 font-mono font-bold uppercase tracking-wide">STREAKS</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="h-px bg-gradient-to-r from-transparent via-[#D4FF00]/25 to-transparent my-3.5" />

            {/* Micro biometrics highlights representing real tracking logs */}
            <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
              <div className="bg-white/5 border border-white/10 p-1.5 sm:p-2 rounded-lg text-center min-w-0">
                <span className="text-[5.5px] sm:text-[6.5px] text-gray-500 font-mono block uppercase truncate">AVG PROTEIN</span>
                <span className="text-[10px] sm:text-xs font-mono font-black text-white block truncate">{universalStats.avgProtein}g</span>
              </div>
              <div className="bg-white/5 border border-white/10 p-1.5 sm:p-2 rounded-lg text-center min-w-0">
                <span className="text-[5.5px] sm:text-[6.5px] text-gray-400 font-mono block uppercase truncate">MEAN WATER</span>
                <span className="text-[10px] sm:text-xs font-mono font-black text-white block truncate">{universalStats.avgWater}ml</span>
              </div>
              <div className="bg-white/5 border border-white/10 p-1.5 sm:p-2 rounded-lg text-center min-w-0">
                <span className="text-[5.5px] sm:text-[6.5px] text-gray-400 font-mono block uppercase truncate">RECOVERY</span>
                <span className="text-[10px] sm:text-xs font-mono font-black text-white block truncate">{universalStats.avgSleep}h</span>
              </div>
              <div className="bg-white/5 border border-white/10 p-1.5 sm:p-2 rounded-lg text-center min-w-0">
                <span className="text-[5.5px] sm:text-[6.5px] text-gray-400 font-mono block uppercase truncate">BODY MASS</span>
                <span className="text-[10px] sm:text-xs font-mono font-black text-white block truncate">{universalStats.avgWeight > 0 ? `${universalStats.avgWeight} kg` : 'N/A'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Live generation notifications */}
        <AnimatePresence>
          {sharingStatus && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="text-[10px] font-mono text-[#D4FF00] tracking-widest bg-zinc-950 px-4 py-2 border border-[#D4FF00]/30 rounded-xl leading-snug font-black uppercase"
            >
              ⚡ {sharingStatus}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Dynamic Action layout containing native Web Share controls */}
        <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
          <motion.button
            onClick={handleShareCard}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="bg-[#D4FF00] hover:bg-white text-black font-mono text-[10px] font-black uppercase tracking-widest py-4 px-4 rounded-xl transition-all duration-200 cursor-pointer shadow-[0_0_20px_rgba(212,255,0,0.15)] flex items-center justify-center gap-2"
          >
            <Share2 className="w-4 h-4" /> SHARE TO INSTA & WHATSAPP
          </motion.button>

          <motion.button
            onClick={handleDownloadCardPNG}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="bg-zinc-900 hover:bg-[#D4FF00] hover:text-black border border-[#D4FF00]/35 hover:border-[#D4FF00] text-[#D4FF00] font-mono text-[10px] font-black uppercase tracking-widest py-4 px-4 rounded-xl transition-all duration-200 cursor-pointer flex items-center justify-center gap-2"
          >
            <Image className="w-4 h-4" /> DOWNLOAD FLEX CARD (PNG)
          </motion.button>
        </div>

        {/* HIGHLY IMMERSIVE HIGHLIGHTED OFFLINE DOSSIER CONTROL PANEL */}
        <div className="w-full bg-zinc-950/80 border border-[#D4FF00]/25 rounded-2xl p-5 mt-4 text-center shadow-[0_8px_30px_rgba(0,0,0,0.5)] relative overflow-hidden">
          <div className="absolute top-0 left-1/4 right-1/4 h-[1px] bg-gradient-to-r from-transparent via-[#D4FF00]/60 to-transparent" />
          <h4 className="text-[10px] font-mono font-black text-[#D4FF00] uppercase tracking-widest mb-1 leading-none">
            OFFLINE DOSSIER & PROGRESS EXPORT
          </h4>
          <p className="text-[9px] font-mono text-gray-400 mt-2 mb-4 leading-normal max-w-sm mx-auto">
            Generate an official high-fidelity Wheyo-Pro progress ledger of your complete workout consistency levels, target benchmarks, and body weight logs.
          </p>
          <motion.button
            onClick={handleExportAnabolicReport}
            whileHover={{ scale: 1.02, backgroundColor: '#ffffff', color: '#000000', boxShadow: '0 0 25px rgba(212,255,0,0.4)' }}
            whileTap={{ scale: 0.98 }}
            className="w-full bg-[#D4FF00] text-black border-none font-mono text-[10px] font-black uppercase tracking-widest py-4 px-4 rounded-xl transition-all duration-300 cursor-pointer flex items-center justify-center gap-2.5 shadow-[0_4px_25px_rgba(212,255,0,0.3)]"
          >
            <Download className="w-4 h-4 animate-bounce" /> GENERATE OFFICIAL PERFORMANCE REPORT (PDF)
          </motion.button>
        </div>
      </div>

      {/* RELOCATED DEAUTH BUTTON: CENTER ALIGNED AT THE VERY BOTTOM OF THE PROFILE PAGE */}
      <div className="mt-12 flex justify-center pb-8">
        <button
          onClick={triggerLogout}
          className="bg-red-950/20 hover:bg-red-500 hover:text-black border border-red-500/20 hover:border-[#D4FF00] text-red-100 font-mono text-[10px] font-black uppercase tracking-widest px-8 py-3.5 rounded-2xl transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer shadow-[0_4px_24px_rgba(239,68,68,0.05)] flex items-center gap-2"
        >
          <LogOut className="w-4 h-4" /> DEAUTH ATHLETE LOCKER
        </button>
      </div>

    </div>
  );
}
