import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Dumbbell, 
  Flame, 
  Trophy, 
  Plus, 
  Trash2, 
  Sparkles, 
  Coins, 
  ArrowRight, 
  CheckCircle2, 
  Zap, 
  Activity, 
  Clock, 
  TrendingUp, 
  Award, 
  Bell, 
  ShoppingBag, 
  X,
  ChevronRight,
  ShieldCheck,
  Search,
  Layers,
  Play,
  RotateCcw,
  Target
} from 'lucide-react';
import { 
  COMPREHENSIVE_EXERCISE_LIBRARY,
  PRESET_WORKOUT_ROUTINES,
  GYM_EXERCISE_LIBRARY, 
  CALISTHENICS_LIBRARY, 
  CARDIO_LIBRARY,
  GymExerciseLog, 
  CalisthenicsLog, 
  CardioLog, 
  WorkoutSession,
  MuscleCategory,
  ExerciseDefinition,
  calculateGymCaloriesAndPoints,
  calculateCalisthenicsCaloriesAndPoints,
  calculateCardioCaloriesAndPoints,
  getPointsBalance,
  saveWorkoutSession,
  getWorkoutHistory,
  getActiveChallenges,
  claimChallengeReward,
  getRecommendedPostWorkoutMeal,
  getUserCampusId,
  BELGAUM_CAMPUSES,
  POINTS_TO_INR_RATIO,
  sanitizeText
} from '../lib/workoutMath';
import { requestNotificationPermission } from '../lib/notificationEngine';
import { useCart } from '../context/CartContext';
import { supabase } from '../lib/supabase';
import { Link } from 'react-router-dom';

export default function WorkoutsPage() {
  const { addItem, setIsCartOpen } = useCart();
  const [activeTab, setActiveTab] = useState<'gym' | 'calisthenics' | 'cardio' | 'challenges' | 'history'>('gym');
  const [pointsBalance, setPointsBalance] = useState<number>(getPointsBalance);
  const [challenges, setChallenges] = useState(getActiveChallenges);
  const [workoutHistory, setWorkoutHistory] = useState(getWorkoutHistory);
  const [userCampus, setUserCampus] = useState(getUserCampusId);
  const [products, setProducts] = useState<any[]>([]);

  // Exercise Library Modal / Search state
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMuscleFilter, setSelectedMuscleFilter] = useState<string>('all');

  // Push Notification / Modal state
  const [completedSession, setCompletedSession] = useState<WorkoutSession | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Fetch live products for recovery food matching
  useEffect(() => {
    const fetchCatalog = async () => {
      try {
        if (supabase) {
          const { data } = await supabase.from('products').select('*');
          if (data && data.length > 0) {
            setProducts(data);
            return;
          }
        }
      } catch (e) {
        console.error(e);
      }
      // Local fallback catalog
      try {
        const local = localStorage.getItem('local_products');
        if (local) setProducts(JSON.parse(local));
      } catch {}
    };
    fetchCatalog();
  }, []);

  // Listen for points updates
  useEffect(() => {
    const handlePoints = () => setPointsBalance(getPointsBalance());
    const handleWorkouts = () => setWorkoutHistory(getWorkoutHistory());
    const handleChallenges = () => setChallenges(getActiveChallenges());
    window.addEventListener('wheyo-points-updated', handlePoints);
    window.addEventListener('wheyo-workouts-updated', handleWorkouts);
    window.addEventListener('wheyo-challenges-updated', handleChallenges);
    return () => {
      window.removeEventListener('wheyo-points-updated', handlePoints);
      window.removeEventListener('wheyo-workouts-updated', handleWorkouts);
      window.removeEventListener('wheyo-challenges-updated', handleChallenges);
    };
  }, []);

  // ----------------------------------------------------
  // 🏋️ GYM LOGGING STATE
  // ----------------------------------------------------
  const [gymExercises, setGymExercises] = useState<GymExerciseLog[]>([
    {
      id: 'ex_1',
      exerciseName: 'Barbell Flat Bench Press',
      category: 'chest',
      sets: [
        { id: 's_1', weightKg: 60, reps: 10 },
        { id: 's_2', weightKg: 70, reps: 8 },
        { id: 's_3', weightKg: 75, reps: 6 },
      ],
    },
    {
      id: 'ex_2',
      exerciseName: 'Incline Dumbbell Press',
      category: 'chest',
      sets: [
        { id: 's_4', weightKg: 24, reps: 10 },
        { id: 's_5', weightKg: 26, reps: 8 },
      ],
    },
  ]);

  const gymCalc = useMemo(() => calculateGymCaloriesAndPoints(gymExercises), [gymExercises]);

  const addGymExerciseFromDef = (def: ExerciseDefinition) => {
    const sets = Array.from({ length: Math.min(def.defaultSets || 3, 4) }, (_, i) => ({
      id: 's_' + Date.now() + '_' + i,
      weightKg: def.defaultWeightKg || 40,
      reps: def.defaultReps || 10,
    }));

    const newEx: GymExerciseLog = {
      id: 'ex_' + Date.now(),
      exerciseName: def.name,
      category: def.category,
      targetMuscle: def.targetMuscle,
      sets,
    };
    setGymExercises((prev) => [...prev, newEx]);
    setIsLibraryOpen(false);
    setToastMessage(`Added ${def.name}`);
    setTimeout(() => setToastMessage(null), 2000);
  };

  const addGymExercise = (name: string, category: MuscleCategory = 'chest') => {
    const newEx: GymExerciseLog = {
      id: 'ex_' + Date.now(),
      exerciseName: name,
      category,
      sets: [{ id: 's_' + Date.now(), weightKg: 40, reps: 10 }],
    };
    setGymExercises((prev) => [...prev, newEx]);
  };

  const addGymSet = (exId: string) => {
    setGymExercises(
      gymExercises.map((ex) => {
        if (ex.id !== exId) return ex;
        const lastSet = ex.sets[ex.sets.length - 1];
        return {
          ...ex,
          sets: [
            ...ex.sets,
            {
              id: 's_' + Date.now(),
              weightKg: lastSet ? lastSet.weightKg : 50,
              reps: lastSet ? lastSet.reps : 10,
            },
          ],
        };
      })
    );
  };

  const updateGymSet = (exId: string, setId: string, field: 'weightKg' | 'reps', value: number) => {
    setGymExercises(
      gymExercises.map((ex) => {
        if (ex.id !== exId) return ex;
        return {
          ...ex,
          sets: ex.sets.map((s) => (s.id === setId ? { ...s, [field]: Math.max(0, value) } : s)),
        };
      })
    );
  };

  const removeGymSet = (exId: string, setId: string) => {
    setGymExercises(
      gymExercises.map((ex) => {
        if (ex.id !== exId) return ex;
        return {
          ...ex,
          sets: ex.sets.filter((s) => s.id !== setId),
        };
      }).filter((ex) => ex.sets.length > 0)
    );
  };

  const removeGymExercise = (exId: string) => {
    setGymExercises(gymExercises.filter((ex) => ex.id !== exId));
  };

  // 1-Tap Load Preset Routine
  const loadPresetRoutine = (routineId: string) => {
    const routine = PRESET_WORKOUT_ROUTINES.find((r) => r.id === routineId);
    if (!routine) return;

    if (routine.category === 'calisthenics') {
      setActiveTab('calisthenics');
      const loaded: CalisthenicsLog[] = routine.exercises.map((ex, idx) => ({
        id: 'cal_' + Date.now() + '_' + idx,
        exerciseName: ex.exerciseName,
        intensityFactor: 1.5,
        sets: Array.from({ length: ex.sets }, (_, sIdx) => ({
          id: 'cs_' + Date.now() + '_' + idx + '_' + sIdx,
          reps: ex.defaultReps,
          addedWeightKg: ex.defaultWeightKg,
        })),
      }));
      setCalisthenicsExercises(loaded);
    } else if (routine.category === 'cardio') {
      setActiveTab('cardio');
      setCardioLogs([
        {
          id: 'car_' + Date.now(),
          activityType: routine.exercises[0]?.exerciseName || 'Outdoor 5K Road Run',
          durationMinutes: routine.targetTimeMins,
          distanceKm: 5.0,
          intensity: 'high',
          met: 11.0,
        },
      ]);
    } else {
      setActiveTab('gym');
      const loaded: GymExerciseLog[] = routine.exercises.map((ex, idx) => ({
        id: 'ex_' + Date.now() + '_' + idx,
        exerciseName: ex.exerciseName,
        category: ex.category,
        sets: Array.from({ length: ex.sets }, (_, sIdx) => ({
          id: 's_' + Date.now() + '_' + idx + '_' + sIdx,
          weightKg: ex.defaultWeightKg,
          reps: ex.defaultReps,
        })),
      }));
      setGymExercises(loaded);
    }

    setToastMessage(`⚡ Loaded "${routine.name}" Routine!`);
    setTimeout(() => setToastMessage(null), 2500);
  };

  // ----------------------------------------------------
  // 🤸 CALISTHENICS LOGGING STATE
  // ----------------------------------------------------
  const [calisthenicsExercises, setCalisthenicsExercises] = useState<CalisthenicsLog[]>([
    {
      id: 'cal_1',
      exerciseName: 'Strict Bodyweight Pull-Ups',
      intensityFactor: 1.8,
      sets: [
        { id: 'cs_1', reps: 10, addedWeightKg: 0 },
        { id: 'cs_2', reps: 8, addedWeightKg: 0 },
        { id: 'cs_3', reps: 8, addedWeightKg: 0 },
      ],
    },
    {
      id: 'cal_2',
      exerciseName: 'Parallel Bar Dips',
      intensityFactor: 1.4,
      sets: [
        { id: 'cs_4', reps: 15, addedWeightKg: 0 },
        { id: 'cs_5', reps: 12, addedWeightKg: 0 },
      ],
    },
  ]);

  const calisthenicsCalc = useMemo(
    () => calculateCalisthenicsCaloriesAndPoints(calisthenicsExercises),
    [calisthenicsExercises]
  );

  const addCalisthenicsExercise = (name: string, factor: number) => {
    const newEx: CalisthenicsLog = {
      id: 'cal_' + Date.now(),
      exerciseName: name,
      intensityFactor: factor,
      sets: [{ id: 'cs_' + Date.now(), reps: 10, addedWeightKg: 0 }],
    };
    setCalisthenicsExercises([...calisthenicsExercises, newEx]);
  };

  const addCalisthenicsSet = (exId: string) => {
    setCalisthenicsExercises(
      calisthenicsExercises.map((ex) => {
        if (ex.id !== exId) return ex;
        const lastSet = ex.sets[ex.sets.length - 1];
        return {
          ...ex,
          sets: [
            ...ex.sets,
            {
              id: 'cs_' + Date.now(),
              reps: lastSet ? lastSet.reps : 10,
              addedWeightKg: lastSet ? lastSet.addedWeightKg : 0,
            },
          ],
        };
      })
    );
  };

  const updateCalisthenicsSet = (
    exId: string,
    setId: string,
    field: 'reps' | 'addedWeightKg',
    value: number
  ) => {
    setCalisthenicsExercises(
      calisthenicsExercises.map((ex) => {
        if (ex.id !== exId) return ex;
        return {
          ...ex,
          sets: ex.sets.map((s) => (s.id === setId ? { ...s, [field]: Math.max(0, value) } : s)),
        };
      })
    );
  };

  const removeCalisthenicsExercise = (exId: string) => {
    setCalisthenicsExercises(calisthenicsExercises.filter((ex) => ex.id !== exId));
  };

  // ----------------------------------------------------
  // 🏃 CARDIO LOGGING STATE
  // ----------------------------------------------------
  const [cardioLogs, setCardioLogs] = useState<CardioLog[]>([
    {
      id: 'car_1',
      activityType: 'Outdoor 5K Road Run',
      durationMinutes: 30,
      distanceKm: 5.2,
      intensity: 'high',
      met: 10.5,
    },
  ]);

  const cardioCalc = useMemo(() => calculateCardioCaloriesAndPoints(cardioLogs), [cardioLogs]);

  // ----------------------------------------------------
  // SUBMISSION & PUSH NOTIFICATION HANDLER
  // ----------------------------------------------------
  const handleLogWorkout = (type: 'gym' | 'calisthenics' | 'cardio') => {
    let calories = 0;
    let points = 0;
    let title = '';
    let volumeKg = 0;
    let duration = 45;

    if (type === 'gym') {
      calories = gymCalc.calories;
      points = gymCalc.points;
      volumeKg = gymCalc.totalVolumeKg;
      title = `${gymExercises[0]?.exerciseName || 'Gym'} + ${gymExercises.length - 1} Exercises`;
      duration = Math.round(gymExercises.reduce((sum, ex) => sum + ex.sets.length, 0) * 2.5);
    } else if (type === 'calisthenics') {
      calories = calisthenicsCalc.calories;
      points = calisthenicsCalc.points;
      title = `${calisthenicsExercises[0]?.exerciseName || 'Bodyweight'} Routine`;
      duration = Math.round(calisthenicsExercises.reduce((sum, ex) => sum + ex.sets.length, 0) * 2.0);
    } else {
      calories = cardioCalc.calories;
      points = cardioCalc.points;
      title = cardioLogs[0]?.activityType || 'Cardio Session';
      duration = cardioLogs.reduce((sum, c) => sum + c.durationMinutes, 0);
    }

    if (calories <= 0) return;

    const newSession: WorkoutSession = {
      id: 'sess_' + Date.now(),
      date: 'Today, ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      timestamp: Date.now(),
      type,
      title,
      durationMinutes: Math.max(10, duration),
      caloriesBurned: calories,
      pointsEarned: points,
      totalVolumeKg: volumeKg > 0 ? volumeKg : undefined,
      details: {
        gym: type === 'gym' ? gymExercises : undefined,
        calisthenics: type === 'calisthenics' ? calisthenicsExercises : undefined,
        cardio: type === 'cardio' ? cardioLogs : undefined,
      },
      campusId: userCampus,
    };

    saveWorkoutSession(newSession);
    setCompletedSession(newSession);

    // Try browser push notification if permitted
    try {
      if (typeof window !== 'undefined' && 'Notification' in window) {
        if (Notification.permission === 'granted') {
          new Notification('⚡ Wheyo Workout Logged!', {
            body: `Torched ${calories} kcal & earned +${points} Points (₹${(points * POINTS_TO_INR_RATIO).toFixed(1)} Discount)! Time to refuel with clean protein.`,
            icon: '/favicon.ico',
          });
        } else if (Notification.permission !== 'denied') {
          Notification.requestPermission();
        }
      }
    } catch {}

    // Vibrate haptic
    if (navigator.vibrate) navigator.vibrate([30, 50, 30]);
  };

  const currentCampusInfo = BELGAUM_CAMPUSES.find((c) => c.id === userCampus) || BELGAUM_CAMPUSES[0];

  // Filtered 100+ Exercise Library
  const filteredLibrary = useMemo(() => {
    return COMPREHENSIVE_EXERCISE_LIBRARY.filter((ex) => {
      const matchesMuscle = selectedMuscleFilter === 'all' || ex.category === selectedMuscleFilter;
      const matchesQuery = 
        ex.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ex.targetMuscle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ex.category.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesMuscle && matchesQuery;
    });
  }, [searchQuery, selectedMuscleFilter]);

  // Post-workout recovery recommendation
  const recoveryInfo = useMemo(() => {
    if (!completedSession) return null;
    return getRecommendedPostWorkoutMeal(completedSession.caloriesBurned, completedSession.type, products);
  }, [completedSession, products]);

  return (
    <div className="min-h-screen bg-[#050505] text-white pt-4 pb-28 px-4 sm:px-6 lg:px-8 select-none">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Top Header & Points Ledger Hero */}
        <div className="bg-gradient-to-br from-[#0F0F16] via-[#0C0C12] to-[#0A0A0E] border border-white/10 rounded-3xl p-5 sm:p-7 shadow-[0_8px_32px_rgba(0,0,0,0.6)] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-[#D4FF00]/5 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                <span className="px-2.5 py-0.5 rounded-full bg-[#D4FF00]/15 border border-[#D4FF00]/30 text-[#D4FF00] font-mono text-[10px] font-black uppercase tracking-wider">
                  🔥 150+ Workouts & Gamified Engine
                </span>
                <Link
                  to="/campus-league"
                  className="px-2.5 py-0.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 hover:text-white font-mono text-[10px] font-bold uppercase tracking-wider transition-colors flex items-center gap-1"
                >
                  <Trophy className="w-3 h-3 text-[#D4FF00]" />
                  <span>{currentCampusInfo.shortName}</span>
                </Link>
                <button
                  type="button"
                  onClick={async () => {
                    const granted = await requestNotificationPermission();
                    if (granted) {
                      setToastMessage('🔔 Push Notifications Enabled!');
                    } else {
                      setToastMessage('🔔 In-App Auto Reminders Active');
                    }
                    setTimeout(() => setToastMessage(null), 3000);
                  }}
                  className="px-2.5 py-0.5 rounded-full bg-[#D4FF00]/10 hover:bg-[#D4FF00]/25 border border-[#D4FF00]/30 text-[#D4FF00] font-mono text-[10px] font-bold uppercase tracking-wider transition-colors flex items-center gap-1 cursor-pointer active:scale-95"
                >
                  <Bell className="w-3 h-3" />
                  <span>Auto Push Alerts</span>
                </button>
              </div>

              <h1 className="text-2xl sm:text-4xl font-display font-black uppercase tracking-tight text-white">
                Log Training, <span className="text-[#D4FF00]">Earn Food Discounts</span>
              </h1>
              <p className="text-zinc-400 font-mono text-xs sm:text-sm mt-1 max-w-lg">
                Log 150+ Gym, Calisthenics or Cardio exercises. Pure mathematical calories & points convert directly to ₹ INR off your next meal!
              </p>
            </div>

            {/* Points Ledger Balance Card */}
            <div className="bg-[#14141E] border border-[#D4FF00]/30 rounded-2xl p-4 shrink-0 flex flex-col items-center justify-center min-w-[170px] shadow-[0_0_25px_rgba(212,255,0,0.12)]">
              <span className="text-[10px] font-mono text-zinc-400 uppercase font-black tracking-widest flex items-center gap-1">
                <Coins className="w-3.5 h-3.5 text-[#D4FF00]" /> Wheyo Balance
              </span>
              <div className="flex items-baseline gap-1.5 my-1">
                <span className="text-3xl font-mono font-black text-white">{pointsBalance}</span>
                <span className="text-xs font-mono text-[#D4FF00] font-bold">PTS</span>
              </div>
              <div className="bg-[#D4FF00]/15 px-2 py-0.5 rounded text-[10px] font-mono font-black text-[#D4FF00]">
                = ₹{(pointsBalance * POINTS_TO_INR_RATIO).toFixed(0)} Real Discount
              </div>
            </div>
          </div>

          {/* Points conversion explanation pill */}
          <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between flex-wrap gap-2 text-[11px] font-mono text-zinc-400">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Rate: <strong>100 Points = ₹10 INR</strong> applied automatically at Cart checkout</span>
            </span>
            <span className="text-zinc-500">100% Algorithmic • Zero AI Ingestion</span>
          </div>
        </div>


        {/* 1-Tap Preset Routine Quick Bar */}
        <div className="bg-[#0C0C12] border border-white/10 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-[10px] font-mono uppercase font-black text-zinc-400 tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#D4FF00]" /> 1-Tap Preset Routines:
            </span>
            <span className="text-[9px] font-mono text-zinc-500">Pre-populates full workout</span>
          </div>
          <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-none">
            {PRESET_WORKOUT_ROUTINES.map((routine) => (
              <button
                key={routine.id}
                type="button"
                onClick={() => loadPresetRoutine(routine.id)}
                className="px-3.5 py-2 rounded-xl bg-[#14141E] hover:bg-[#D4FF00] text-zinc-300 hover:text-black border border-white/10 hover:border-[#D4FF00] font-mono text-[11px] font-bold uppercase tracking-wider whitespace-nowrap transition-all duration-150 flex items-center gap-2 shrink-0 cursor-pointer active:scale-95"
              >
                <Play className="w-3 h-3 fill-current" />
                <span>{routine.name.split(':')[0]}</span>
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-black/20 font-black">
                  ~{routine.expectedBurnKcal} kcal
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Interactive Navigation Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {[
            { id: 'gym', label: '🏋️ Gym & Weights', desc: 'Volume & Sets' },
            { id: 'calisthenics', label: '🤸 Calisthenics', desc: 'Bodyweight Bars' },
            { id: 'cardio', label: '🏃 Cardio & Run', desc: 'MET Torcher' },
            { id: 'challenges', label: '🏆 Challenges', desc: 'Earn Big PTS' },
            { id: 'history', label: '📜 Log History', desc: 'Past Sessions' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2.5 rounded-2xl font-mono text-xs font-black uppercase tracking-wider transition-all duration-200 shrink-0 border cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-[#D4FF00] text-black border-[#D4FF00] shadow-[0_0_20px_rgba(212,255,0,0.3)] scale-[1.02]'
                  : 'bg-[#0E0E14] text-zinc-400 border-white/10 hover:border-white/20 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ======================================================== */}
        {/* 🏋️ TAB 1: GYM & WEIGHTS LOGGER                          */}
        {/* ======================================================== */}
        {activeTab === 'gym' && (
          <div className="space-y-4">
            {/* Action Bar: Open 110+ Exercise Library */}
            <div className="flex items-center justify-between gap-3 bg-[#0C0C12] border border-white/10 rounded-2xl p-3.5">
              <div className="flex items-center gap-2">
                <Dumbbell className="w-4 h-4 text-[#D4FF00]" />
                <span className="text-xs font-mono font-black uppercase text-white">
                  Active Routine ({gymExercises.length} Exercises)
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsLibraryOpen(true)}
                className="px-4 py-2 bg-[#D4FF00] hover:bg-white text-black font-mono text-xs font-black uppercase tracking-wider rounded-xl shadow-[0_0_15px_rgba(212,255,0,0.25)] flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
              >
                <Plus className="w-3.5 h-3.5 stroke-[3]" />
                <span>Browse 110+ Library</span>
              </button>
            </div>

            {/* Exercises List */}
            {gymExercises.map((ex, exIdx) => (
              <div
                key={ex.id}
                className="bg-[#0C0C10] border border-white/10 rounded-2xl p-4 sm:p-5 shadow-lg space-y-3"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-[#D4FF00]/10 border border-[#D4FF00]/20 flex items-center justify-center font-mono font-black text-xs text-[#D4FF00]">
                      #{exIdx + 1}
                    </div>
                    <div>
                      <h3 className="font-display text-sm sm:text-base font-black uppercase text-white tracking-wide">
                        {ex.exerciseName}
                      </h3>
                      <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
                        Category: {ex.category} {ex.targetMuscle ? `• ${ex.targetMuscle}` : ''}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => removeGymExercise(ex.id)}
                    className="p-1.5 text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                    title="Remove Exercise"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Sets Header */}
                <div className="grid grid-cols-12 gap-2 text-[10px] font-mono uppercase text-zinc-400 font-bold px-2 pt-1">
                  <div className="col-span-2 sm:col-span-1">Set</div>
                  <div className="col-span-5 sm:col-span-4">Weight (kg)</div>
                  <div className="col-span-4 sm:col-span-4">Reps</div>
                  <div className="col-span-1 sm:col-span-3 text-right">Action</div>
                </div>

                {/* Sets rows */}
                <div className="space-y-2">
                  {ex.sets.map((s, sIdx) => (
                    <div
                      key={s.id}
                      className="grid grid-cols-12 gap-2 items-center bg-[#14141C] p-2 rounded-xl border border-white/5"
                    >
                      <div className="col-span-2 sm:col-span-1 font-mono font-black text-xs text-zinc-400 pl-1">
                        S{sIdx + 1}
                      </div>
                      <div className="col-span-5 sm:col-span-4">
                        <input
                          type="number"
                          value={s.weightKg}
                          onChange={(e) => updateGymSet(ex.id, s.id, 'weightKg', Number(e.target.value))}
                          className="w-full bg-[#1A1A24] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs font-mono font-black text-white focus:outline-none focus:border-[#D4FF00]"
                          placeholder="kg"
                        />
                      </div>
                      <div className="col-span-4 sm:col-span-4">
                        <input
                          type="number"
                          value={s.reps}
                          onChange={(e) => updateGymSet(ex.id, s.id, 'reps', Number(e.target.value))}
                          className="w-full bg-[#1A1A24] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs font-mono font-black text-white focus:outline-none focus:border-[#D4FF00]"
                          placeholder="reps"
                        />
                      </div>
                      <div className="col-span-1 sm:col-span-3 text-right pr-1">
                        <button
                          onClick={() => removeGymSet(ex.id, s.id)}
                          className="text-zinc-600 hover:text-rose-400 p-1"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => addGymSet(ex.id)}
                  className="w-full py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl font-mono text-[11px] font-bold uppercase text-zinc-300 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 text-[#D4FF00]" />
                  <span>+ Add Next Set</span>
                </button>
              </div>
            ))}

            {/* Quick Add Pill Row */}
            <div className="bg-[#0C0C10] border border-white/10 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono uppercase font-black text-zinc-400 tracking-wider">
                  + Popular Quick Adds:
                </span>
                <button
                  onClick={() => setIsLibraryOpen(true)}
                  className="text-[10px] font-mono font-bold text-[#D4FF00] hover:underline"
                >
                  View All 110+ →
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {GYM_EXERCISE_LIBRARY.slice(0, 10).map((item) => (
                  <button
                    key={item.name}
                    type="button"
                    onClick={() => addGymExercise(item.name, item.category)}
                    className="px-3 py-1.5 bg-[#14141C] hover:bg-[#D4FF00] text-zinc-300 hover:text-black border border-white/10 hover:border-[#D4FF00] rounded-xl font-mono text-[10px] font-bold uppercase tracking-wider transition-all duration-150 cursor-pointer active:scale-95"
                  >
                    + {item.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Real-time Math Summary & Log Button */}
            <div className="bg-gradient-to-r from-[#12121A] via-[#161622] to-[#12121A] border border-[#D4FF00]/40 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-[0_0_30px_rgba(212,255,0,0.15)]">
              <div className="flex items-center gap-5 sm:gap-8">
                <div>
                  <span className="text-[10px] font-mono uppercase text-zinc-500 font-black block">Total Volume</span>
                  <span className="text-lg sm:text-xl font-mono font-black text-white">{gymCalc.totalVolumeKg} kg</span>
                </div>
                <div>
                  <span className="text-[10px] font-mono uppercase text-zinc-500 font-black block">Est. Calories</span>
                  <span className="text-lg sm:text-xl font-mono font-black text-orange-400">🔥 {gymCalc.calories} kcal</span>
                </div>
                <div>
                  <span className="text-[10px] font-mono uppercase text-zinc-500 font-black block">Reward</span>
                  <span className="text-lg sm:text-xl font-mono font-black text-[#D4FF00]">+{gymCalc.points} Pts</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleLogWorkout('gym')}
                className="w-full sm:w-auto px-6 py-3.5 bg-[#D4FF00] hover:bg-white text-black font-mono text-xs font-black uppercase tracking-wider rounded-xl shadow-[0_0_20px_rgba(212,255,0,0.4)] active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4 stroke-[3]" />
                <span>Save Session & Claim +{gymCalc.points} Pts</span>
              </button>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* 🤸 TAB 2: CALISTHENICS LOGGER                            */}
        {/* ======================================================== */}
        {activeTab === 'calisthenics' && (
          <div className="space-y-4">
            {calisthenicsExercises.map((ex, exIdx) => (
              <div
                key={ex.id}
                className="bg-[#0C0C10] border border-white/10 rounded-2xl p-4 sm:p-5 shadow-lg space-y-3"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center font-mono font-black text-xs text-cyan-400">
                      #{exIdx + 1}
                    </div>
                    <div>
                      <h3 className="font-display text-sm sm:text-base font-black uppercase text-white tracking-wide">
                        {ex.exerciseName}
                      </h3>
                      <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
                        Intensity Multiplier: {ex.intensityFactor}x
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => removeCalisthenicsExercise(ex.id)}
                    className="p-1.5 text-zinc-500 hover:text-rose-400 rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-12 gap-2 text-[10px] font-mono uppercase text-zinc-400 font-bold px-2 pt-1">
                  <div className="col-span-2">Set</div>
                  <div className="col-span-5">Reps / Seconds</div>
                  <div className="col-span-5">Added Weight (kg)</div>
                </div>

                <div className="space-y-2">
                  {ex.sets.map((s, sIdx) => (
                    <div
                      key={s.id}
                      className="grid grid-cols-12 gap-2 items-center bg-[#14141C] p-2 rounded-xl border border-white/5"
                    >
                      <div className="col-span-2 font-mono font-black text-xs text-zinc-400 pl-1">
                        S{sIdx + 1}
                      </div>
                      <div className="col-span-5">
                        <input
                          type="number"
                          value={s.reps}
                          onChange={(e) => updateCalisthenicsSet(ex.id, s.id, 'reps', Number(e.target.value))}
                          className="w-full bg-[#1A1A24] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs font-mono font-black text-white focus:outline-none focus:border-cyan-400"
                          placeholder="reps"
                        />
                      </div>
                      <div className="col-span-5">
                        <input
                          type="number"
                          value={s.addedWeightKg || 0}
                          onChange={(e) => updateCalisthenicsSet(ex.id, s.id, 'addedWeightKg', Number(e.target.value))}
                          className="w-full bg-[#1A1A24] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs font-mono font-black text-white focus:outline-none focus:border-cyan-400"
                          placeholder="0kg"
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => addCalisthenicsSet(ex.id)}
                  className="w-full py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl font-mono text-[11px] font-bold uppercase text-zinc-300 transition-colors flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5 text-cyan-400" />
                  <span>+ Add Next Set</span>
                </button>
              </div>
            ))}

            <div className="bg-[#0C0C10] border border-white/10 rounded-2xl p-4">
              <span className="text-[10px] font-mono uppercase font-black text-zinc-400 tracking-wider block mb-2">
                + Add Calisthenics Exercise:
              </span>
              <div className="flex flex-wrap gap-2">
                {CALISTHENICS_LIBRARY.map((item) => (
                  <button
                    key={item.name}
                    type="button"
                    onClick={() => addCalisthenicsExercise(item.name, item.intensityFactor)}
                    className="px-3 py-1.5 bg-[#14141C] hover:bg-cyan-400 text-zinc-300 hover:text-black border border-white/10 hover:border-cyan-400 rounded-xl font-mono text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer active:scale-95"
                  >
                    + {item.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-gradient-to-r from-[#12121A] via-[#161622] to-[#12121A] border border-cyan-400/40 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-[0_0_30px_rgba(34,211,238,0.15)]">
              <div className="flex items-center gap-6 sm:gap-8">
                <div>
                  <span className="text-[10px] font-mono uppercase text-zinc-500 font-black block">Total Reps</span>
                  <span className="text-lg sm:text-xl font-mono font-black text-white">{calisthenicsCalc.totalReps} Reps</span>
                </div>
                <div>
                  <span className="text-[10px] font-mono uppercase text-zinc-500 font-black block">Est. Calories</span>
                  <span className="text-lg sm:text-xl font-mono font-black text-orange-400">🔥 {calisthenicsCalc.calories} kcal</span>
                </div>
                <div>
                  <span className="text-[10px] font-mono uppercase text-zinc-500 font-black block">Reward</span>
                  <span className="text-lg sm:text-xl font-mono font-black text-cyan-400">+{calisthenicsCalc.points} Pts</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleLogWorkout('calisthenics')}
                className="w-full sm:w-auto px-6 py-3.5 bg-cyan-400 hover:bg-white text-black font-mono text-xs font-black uppercase tracking-wider rounded-xl shadow-[0_0_20px_rgba(34,211,238,0.4)] active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4 stroke-[3]" />
                <span>Save & Claim +{calisthenicsCalc.points} Pts</span>
              </button>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* 🏃 TAB 3: CARDIO & RUNNING LOGGER                        */}
        {/* ======================================================== */}
        {activeTab === 'cardio' && (
          <div className="space-y-4">
            <div className="bg-[#0C0C10] border border-white/10 rounded-2xl p-5 space-y-4">
              <div>
                <label className="text-[10px] font-mono uppercase text-zinc-400 font-black block mb-1.5">
                  Select Cardio Activity
                </label>
                <select
                  value={cardioLogs[0]?.activityType}
                  onChange={(e) => {
                    const found = CARDIO_LIBRARY.find((c) => c.activityType === e.target.value);
                    setCardioLogs([
                      {
                        ...cardioLogs[0],
                        activityType: e.target.value,
                        met: found ? found.met : 9.0,
                      },
                    ]);
                  }}
                  className="w-full bg-[#161622] border border-white/10 rounded-xl px-3.5 py-3 text-xs font-mono font-bold text-white focus:outline-none focus:border-rose-400"
                >
                  {CARDIO_LIBRARY.map((c) => (
                    <option key={c.activityType} value={c.activityType}>
                      {c.activityType} (MET: {c.met})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-mono uppercase text-zinc-400 font-black block mb-1">
                    Duration (Minutes)
                  </label>
                  <input
                    type="number"
                    value={cardioLogs[0]?.durationMinutes}
                    onChange={(e) =>
                      setCardioLogs([
                        { ...cardioLogs[0], durationMinutes: Math.max(1, Number(e.target.value)) },
                      ])
                    }
                    className="w-full bg-[#161622] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm font-mono font-black text-white focus:outline-none focus:border-rose-400"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-mono uppercase text-zinc-400 font-black block mb-1">
                    Distance (km)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={cardioLogs[0]?.distanceKm}
                    onChange={(e) =>
                      setCardioLogs([
                        { ...cardioLogs[0], distanceKm: Math.max(0, Number(e.target.value)) },
                      ])
                    }
                    className="w-full bg-[#161622] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm font-mono font-black text-white focus:outline-none focus:border-rose-400"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-mono uppercase text-zinc-400 font-black block mb-1.5">
                  Workout Intensity Zone
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {(['low', 'moderate', 'high', 'extreme'] as const).map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setCardioLogs([{ ...cardioLogs[0], intensity: lvl }])}
                      className={`py-2 rounded-xl font-mono text-[10px] font-black uppercase border transition-all cursor-pointer ${
                        cardioLogs[0]?.intensity === lvl
                          ? 'bg-rose-500 text-white border-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.4)]'
                          : 'bg-[#14141C] text-zinc-400 border-white/5 hover:border-white/10'
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-[#12121A] via-[#161622] to-[#12121A] border border-rose-500/40 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-[0_0_30px_rgba(244,63,94,0.15)]">
              <div className="flex items-center gap-6 sm:gap-8">
                <div>
                  <span className="text-[10px] font-mono uppercase text-zinc-500 font-black block">Est. Calories</span>
                  <span className="text-lg sm:text-xl font-mono font-black text-rose-400">🔥 {cardioCalc.calories} kcal</span>
                </div>
                <div>
                  <span className="text-[10px] font-mono uppercase text-zinc-500 font-black block">Reward</span>
                  <span className="text-lg sm:text-xl font-mono font-black text-[#D4FF00]">+{cardioCalc.points} Pts</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleLogWorkout('cardio')}
                className="w-full sm:w-auto px-6 py-3.5 bg-rose-500 hover:bg-white text-white hover:text-black font-mono text-xs font-black uppercase tracking-wider rounded-xl shadow-[0_0_20px_rgba(244,63,94,0.4)] active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4 stroke-[3]" />
                <span>Save Cardio & Claim +{cardioCalc.points} Pts</span>
              </button>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* 🏆 TAB 4: ACTIVE GAMIFIED CHALLENGES                     */}
        {/* ======================================================== */}
        {activeTab === 'challenges' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {challenges.map((ch) => {
                const percent = Math.min(100, Math.round((ch.currentValue / ch.targetValue) * 100));
                const canClaim = ch.currentValue >= ch.targetValue && !ch.isCompleted;

                return (
                  <div
                    key={ch.id}
                    className={`bg-[#0C0C10] border rounded-2xl p-4 sm:p-5 flex flex-col justify-between gap-4 relative overflow-hidden transition-all ${
                      ch.isCompleted
                        ? 'border-emerald-500/30 bg-[#0A140F]'
                        : canClaim
                        ? 'border-[#D4FF00] shadow-[0_0_25px_rgba(212,255,0,0.15)]'
                        : 'border-white/10 hover:border-white/20'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 font-mono text-[9px] font-black uppercase tracking-wider text-zinc-400">
                          {ch.category} • {ch.expiresInDays}d Left
                        </span>
                        <span className="font-mono text-xs font-black text-[#D4FF00] bg-[#D4FF00]/10 px-2 py-0.5 rounded border border-[#D4FF00]/20">
                          +{ch.pointsReward} Pts (₹{(ch.pointsReward * POINTS_TO_INR_RATIO).toFixed(0)})
                        </span>
                      </div>

                      <h3 className="font-display text-base font-extrabold uppercase text-white tracking-wide">
                        {ch.title}
                      </h3>
                      <p className="text-zinc-400 font-mono text-xs mt-0.5">
                        {ch.subtitle}
                      </p>
                    </div>

                    {/* Progress Bar */}
                    <div>
                      <div className="flex items-center justify-between text-[11px] font-mono mb-1.5">
                        <span className="text-zinc-400">
                          Progress: <strong className="text-white">{ch.currentValue} / {ch.targetValue} {ch.unit}</strong>
                        </span>
                        <span className="text-[#D4FF00] font-black">{percent}%</span>
                      </div>
                      <div className="w-full bg-zinc-900 rounded-full h-2 overflow-hidden p-0.5 border border-white/5">
                        <div
                          className="bg-gradient-to-r from-[#A3FF00] to-[#D4FF00] h-full rounded-full transition-all duration-500"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>

                    {/* Action Button */}
                    <div>
                      {ch.isCompleted ? (
                        <div className="py-2.5 bg-emerald-500/15 border border-emerald-500/30 rounded-xl font-mono text-xs font-black uppercase text-emerald-400 text-center flex items-center justify-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Claimed +{ch.pointsReward} Points</span>
                        </div>
                      ) : canClaim ? (
                        <button
                          type="button"
                          onClick={() => {
                            const res = claimChallengeReward(ch.id);
                            if (res.success) {
                              setToastMessage(`🎉 Claimed +${res.pointsClaimed} Wheyo Points!`);
                              setTimeout(() => setToastMessage(null), 3000);
                            }
                          }}
                          className="w-full py-2.5 bg-[#D4FF00] hover:bg-white text-black font-mono text-xs font-black uppercase rounded-xl shadow-[0_0_15px_rgba(212,255,0,0.3)] transition-all cursor-pointer active:scale-95"
                        >
                          🎁 Claim +{ch.pointsReward} Points Now!
                        </button>
                      ) : (
                        <div className="py-2.5 bg-white/5 border border-white/5 rounded-xl font-mono text-xs font-bold uppercase text-zinc-500 text-center">
                          {ch.targetValue - ch.currentValue} {ch.unit} to complete
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* 📜 TAB 5: PAST LOGS HISTORY                              */}
        {/* ======================================================== */}
        {activeTab === 'history' && (
          <div className="space-y-3">
            {workoutHistory.map((sess) => (
              <div
                key={sess.id}
                className="bg-[#0C0C10] border border-white/10 rounded-2xl p-4 flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-lg">
                    {sess.type === 'gym' ? '🏋️' : sess.type === 'calisthenics' ? '🤸' : '🏃'}
                  </div>
                  <div>
                    <h4 className="font-display text-sm font-extrabold uppercase text-white tracking-wide">
                      {sess.title}
                    </h4>
                    <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block mt-0.5">
                      {sess.date} • {sess.durationMinutes} Mins
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <span className="font-mono text-xs font-black text-orange-400 block">
                      🔥 {sess.caloriesBurned} kcal
                    </span>
                    <span className="font-mono text-[10px] font-bold text-[#D4FF00]">
                      +{sess.pointsEarned} PTS
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>

      {/* ======================================================== */}
      {/* 📚 110+ EXERCISE LIBRARY FULL-SCREEN MODAL/DRAWER        */}
      {/* ======================================================== */}
      <AnimatePresence>
        {isLibraryOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsLibraryOpen(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-md z-[160]"
            />
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className="fixed inset-x-2 bottom-2 top-10 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 sm:top-1/2 sm:-translate-y-1/2 sm:w-full sm:max-w-2xl sm:h-[85vh] bg-[#0E0E16] border border-white/15 rounded-3xl p-5 sm:p-6 shadow-2xl z-[170] flex flex-col overflow-hidden"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between pb-3 border-b border-white/10 shrink-0">
                <div className="flex items-center gap-2">
                  <Dumbbell className="w-5 h-5 text-[#D4FF00]" />
                  <div>
                    <h3 className="font-display text-base font-black uppercase text-white">
                      110+ Exercise Library
                    </h3>
                    <span className="text-[10px] font-mono text-zinc-400">
                      Select exercise to inject directly into your workout routine
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setIsLibraryOpen(false)}
                  className="p-1.5 text-zinc-400 hover:text-white rounded-xl bg-white/5 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Search Bar */}
              <div className="relative my-3 shrink-0">
                <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search 110+ exercises by name or muscle..."
                  className="w-full bg-[#161622] border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs font-mono font-bold text-white placeholder:text-zinc-500 focus:outline-none focus:border-[#D4FF00]"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white text-xs"
                  >
                    Clear
                  </button>
                )}
              </div>

              {/* Category Filter Pills */}
              <div className="flex gap-1.5 overflow-x-auto pb-2 shrink-0 scrollbar-none">
                {[
                  { id: 'all', label: `All (${COMPREHENSIVE_EXERCISE_LIBRARY.length})` },
                  { id: 'chest', label: 'Chest (18)' },
                  { id: 'back', label: 'Back & Lats (21)' },
                  { id: 'shoulders', label: 'Shoulders (16)' },
                  { id: 'legs', label: 'Legs (20)' },
                  { id: 'arms', label: 'Arms (20)' },
                  { id: 'core', label: 'Core & Abs (15)' },
                  { id: 'calisthenics', label: 'Calisthenics (18)' },
                  { id: 'cardio', label: 'Cardio (17)' },
                ].map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedMuscleFilter(cat.id)}
                    className={`px-3 py-1.5 rounded-xl font-mono text-[10px] font-black uppercase whitespace-nowrap border transition-all cursor-pointer ${
                      selectedMuscleFilter === cat.id
                        ? 'bg-[#D4FF00] text-black border-[#D4FF00]'
                        : 'bg-white/5 text-zinc-400 border-white/5 hover:border-white/15'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* Scrollable Exercise Grid (Performance Sliced) */}
              <div className="flex-1 overflow-y-auto space-y-2 pr-1 mt-2">
                {filteredLibrary.length === 0 ? (
                  <div className="text-center py-12 text-zinc-500 font-mono text-xs">
                    No exercises found for "{searchQuery}". Try a different search!
                  </div>
                ) : (
                  filteredLibrary.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => addGymExerciseFromDef(item)}
                      className="p-3 bg-[#141420] hover:bg-[#1C1C2A] border border-white/5 hover:border-[#D4FF00]/40 rounded-2xl flex items-center justify-between gap-3 cursor-pointer group transition-all"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="px-2 py-0.5 rounded bg-white/5 font-mono text-[9px] font-black uppercase text-zinc-400">
                            {item.category}
                          </span>
                          <span className="text-[10px] font-mono text-[#D4FF00] font-bold">
                            {item.targetMuscle}
                          </span>
                        </div>
                        <h4 className="font-display text-xs sm:text-sm font-black uppercase text-white group-hover:text-[#D4FF00] transition-colors truncate">
                          {item.name}
                        </h4>
                        <p className="text-[10px] font-mono text-zinc-500 line-clamp-1 mt-0.5">
                          {item.description}
                        </p>
                      </div>

                      <div className="shrink-0 flex items-center gap-2">
                        <div className="text-right hidden sm:block">
                          <span className="text-[10px] font-mono text-zinc-400 block font-bold">
                            {item.defaultSets} Sets × {item.defaultReps} Reps
                          </span>
                          {item.defaultWeightKg > 0 && (
                            <span className="text-[9px] font-mono text-zinc-500 block">
                              Base: {item.defaultWeightKg} kg
                            </span>
                          )}
                        </div>
                        <div className="w-8 h-8 rounded-xl bg-[#D4FF00]/10 border border-[#D4FF00]/30 group-hover:bg-[#D4FF00] flex items-center justify-center text-[#D4FF00] group-hover:text-black transition-all">
                          <Plus className="w-4 h-4 stroke-[3]" />
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>


      {/* ======================================================== */}
      {/* 🚀 POST-WORKOUT PUSH NOTIFICATION & RECOVERY MODAL       */}
      {/* ======================================================== */}
      <AnimatePresence>
        {completedSession && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setCompletedSession(null)}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[180]"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 30 }}
              className="fixed left-4 right-4 top-1/2 -translate-y-1/2 md:inset-0 md:m-auto w-auto md:w-full max-w-md bg-[#0D0D14] border border-[#D4FF00]/40 rounded-3xl p-6 shadow-[0_0_50px_rgba(212,255,0,0.2)] z-[190] select-none"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#D4FF00] animate-ping" />
                  <span className="text-[10px] font-mono uppercase font-black text-[#D4FF00] tracking-widest">
                    ⚡ Workout Completed!
                  </span>
                </div>
                <button
                  onClick={() => setCompletedSession(null)}
                  className="p-1 text-zinc-400 hover:text-white rounded-lg bg-white/5"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Math Stats Box */}
              <div className="bg-[#141420] border border-white/10 rounded-2xl p-4 mb-4 grid grid-cols-2 gap-3 text-center">
                <div>
                  <span className="text-[10px] font-mono uppercase text-zinc-400 font-bold block">Calories Burned</span>
                  <span className="text-2xl font-mono font-black text-orange-400">🔥 {completedSession.caloriesBurned}</span>
                </div>
                <div>
                  <span className="text-[10px] font-mono uppercase text-zinc-400 font-bold block">Points Earned</span>
                  <span className="text-2xl font-mono font-black text-[#D4FF00]">+{completedSession.pointsEarned} PTS</span>
                  <span className="text-[9px] font-mono text-zinc-500 block">(= ₹{(completedSession.pointsEarned * POINTS_TO_INR_RATIO).toFixed(1)} OFF)</span>
                </div>
              </div>

              {/* Smart Mathematical Recovery Meal Suggestion */}
              {recoveryInfo?.meal && (
                <div className="bg-gradient-to-br from-[#181824] to-[#12121C] border border-[#D4FF00]/30 rounded-2xl p-4 mb-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono uppercase font-black text-[#D4FF00] tracking-wider">
                      🎯 Mathematical Anabolic Window Refuel
                    </span>
                  </div>

                  <p className="text-xs font-mono text-zinc-300 leading-relaxed">
                    Based on your session load, your body needs <strong className="text-white">~{recoveryInfo.proteinNeededGrams}g Protein</strong> within 45 minutes to rebuild broken muscle tissue.
                  </p>

                  <div className="flex items-center gap-3 bg-[#0C0C12] p-2.5 rounded-xl border border-white/10">
                    <img
                      src={recoveryInfo.meal.image}
                      alt={recoveryInfo.meal.name}
                      className="w-12 h-12 rounded-lg object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-display text-xs font-extrabold uppercase text-white line-clamp-1">
                        {recoveryInfo.meal.name}
                      </h4>
                      <span className="font-mono text-[10px] text-[#D4FF00] font-black">
                        🍗 {recoveryInfo.meal.protein}g Protein • ₹{recoveryInfo.meal.price}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        addItem({
                          id: recoveryInfo.meal.id,
                          code: recoveryInfo.meal.code || 'MEAL',
                          name: recoveryInfo.meal.name,
                          price: recoveryInfo.meal.price,
                          protein: recoveryInfo.meal.protein,
                          quantity: 1,
                        });
                        setCompletedSession(null);
                        setIsCartOpen(true);
                      }}
                      className="px-3 py-2 bg-[#D4FF00] hover:bg-white text-black font-mono text-xs font-black uppercase rounded-xl shrink-0 shadow-[0_0_12px_rgba(212,255,0,0.3)] transition-all active:scale-95 cursor-pointer"
                    >
                      + Add to Plate
                    </button>
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={() => setCompletedSession(null)}
                className="w-full py-3 bg-white/10 hover:bg-white/20 text-white font-mono text-xs font-black uppercase rounded-xl transition-all"
              >
                Close & Keep Grinding
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Floating Toast */}
      {toastMessage && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-[#D4FF00] text-black px-4 py-2.5 rounded-2xl font-mono text-xs font-black uppercase shadow-2xl z-[200] animate-bounce">
          {toastMessage}
        </div>
      )}
    </div>
  );
}
