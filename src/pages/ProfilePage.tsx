import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { 
  User, 
  LogOut, 
  ShoppingBag, 
  Flame, 
  Target, 
  Plus, 
  History, 
  ChevronRight,
  TrendingUp,
  Loader2,
  Calculator,
  Settings as SettingsIcon,
  Calendar,
  Zap,
  Activity
} from 'lucide-react';
import { supabase, getPublicUrl } from '../lib/supabase';
import { cn } from '../components/Layout';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

import type { Session } from '@supabase/supabase-js';

interface OrderHistory {
  id: number;
  created_at: string;
  final_price: number;
  status: string;
  items: any[];
}

interface MacroData {
  date: string;
  protein_consumed: number;
}

type TabType = 'overview' | 'orders' | 'meal-plan' | 'bmr' | 'settings';

export default function ProfilePage({ session }: { session: Session | null }) {
  const user = session?.user ?? null;
  const [profile, setProfile] = useState<any>(null);
  const [orders, setOrders] = useState<OrderHistory[]>([]);
  const [dailyProtein, setDailyProtein] = useState(0);
  const [historyData, setHistoryData] = useState<MacroData[]>([]);
  const [loading, setLoading] = useState(true);
  const [manualProtein, setManualProtein] = useState('');
  const [isUpdatingProtein, setIsUpdatingProtein] = useState(false);
  const [activeSection, setActiveSection] = useState('overview');
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [settingsForm, setSettingsForm] = useState({
    full_name: '',
    daily_protein_goal: 0,
    phone: ''
  });
  const navigate = useNavigate();

  // BMR Calc State
  const [bmrInput, setBmrInput] = useState({ weight: '', height: '', age: '', gender: 'male', activity: '1.55' });
  const [bmrResult, setBmrResult] = useState<number | null>(null);

  useEffect(() => {
    async function getDashboardData() {
      if (!supabase || !user) return;
      
      try {
        // Fetch profile
        const { data: prof, error: profError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        
        if (profError) {
          if (profError.message.includes('user_id')) {
             console.error('Database Error: Trying to query profiles using user_id but it expects id.');
          }
        }
        
        setProfile(prof);
        if (prof) {
          setSettingsForm({
            full_name: prof.full_name || '',
            daily_protein_goal: prof.daily_protein_goal || 150,
            phone: prof.phone || ''
          });
        }

        // Fetch orders
        const { data: ords, error: ordsError } = await supabase
          .from('orders')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        
        if (ordsError && ordsError.message.includes('user_id')) {
          console.error('Orders table is missing user_id column');
        }
        setOrders(ords || []);

        // Fetch last 7 days of macros
        const { data: macros, error: macrosError } = await supabase
          .from('daily_macros')
          .select('date, protein_consumed')
          .eq('user_id', user.id)
          .order('date', { ascending: false })
          .limit(7);
        
        if (macrosError && macrosError.message.includes('user_id')) {
          console.error('daily_macros table is missing user_id column');
        }

        const today = new Date().toISOString().split('T')[0];
        const todayMacro = macros?.find(m => m.date === today);
        
        setDailyProtein(Number(todayMacro?.protein_consumed || 0));
        
        // Sort for chart (ascending)
        const sortedMacros = macros ? [...macros].sort((a, b) => a.date.localeCompare(b.date)) : [];
        setHistoryData(sortedMacros.map(m => ({ ...m, protein_consumed: Number(m.protein_consumed) })));

        // If no entry for today, initialize it
        if (!todayMacro && !macrosError) {
          try {
            await supabase.from('daily_macros').upsert({ 
              user_id: user.id, 
              date: today, 
              protein_consumed: 0 
            }, { onConflict: 'user_id,date' });
          } catch (e) {
            console.error('Error initializing today macro:', e);
          }
        }
      } catch (err) {
        console.error('Error fetching dashboard:', err);
      } finally {
        setLoading(false);
      }
    }

    getDashboardData();
  }, [navigate]);

  const updateProtein = async (amount: number) => {
    if (!supabase || !user) return;
    setIsUpdatingProtein(true);
    const today = new Date().toISOString().split('T')[0];
    const newValue = dailyProtein + amount;

    try {
      const { error } = await supabase
        .from('daily_macros')
        .upsert({ 
          user_id: user.id, 
          date: today, 
          protein_consumed: newValue 
        }, { onConflict: 'user_id,date' })
        .select();
      
      if (!error) {
        setDailyProtein(newValue);
        // Update history graph in real-time
        setHistoryData(prev => {
          const exists = prev.find(d => d.date === today);
          if (exists) return prev.map(d => d.date === today ? { ...d, protein_consumed: newValue } : d);
          return [...prev, { date: today, protein_consumed: newValue }];
        });
      }
    } catch (err) {
      console.error('Error updating protein:', err);
    } finally {
      setIsUpdatingProtein(false);
      setManualProtein('');
    }
  };

  const calculateBMR = () => {
    const { weight, height, age, gender, activity } = bmrInput;
    if (!weight || !height || !age) return;
    
    let bmr = 0;
    const w = parseFloat(weight);
    const h = parseFloat(height);
    const a = parseInt(age);

    if (gender === 'male') {
      // Mifflin-St Jeor for Men
      bmr = (10 * w) + (6.25 * h) - (5 * a) + 5;
    } else {
      // Mifflin-St Jeor for Women
      bmr = (10 * w) + (6.25 * h) - (5 * a) - 161;
    }
    
    setBmrResult(Math.round(bmr * parseFloat(activity)));
  };

  const handleLogout = async () => {
    if (supabase) {
      await supabase.auth.signOut();
      navigate('/login');
    }
  };

  const handleSaveSettings = async () => {
    if (!supabase || !user) return;
    setIsSavingSettings(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: settingsForm.full_name,
          daily_protein_goal: settingsForm.daily_protein_goal,
          phone: settingsForm.phone
        })
        .eq('id', user.id);

      if (!error) {
        setProfile({ ...profile, ...settingsForm });
        alert('Profile updated successfully!');
      } else {
        alert('Error updating profile: ' + error.message);
      }
    } catch (err) {
      console.error('Error saving settings:', err);
    } finally {
      setIsSavingSettings(false);
    }
  };

  const referralLink = typeof window !== 'undefined' 
    ? `${window.location.origin}/join?ref=${user?.id?.substring(0, 8)}` 
    : '';

  const copyReferral = () => {
    navigator.clipboard.writeText(referralLink);
    alert('Referral link copied to clipboard!');
  };

  const scrollToSection = (id: string) => {
    setActiveSection(id);
    const element = document.getElementById(id);
    if (element) {
      const offset = 100;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;
      
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      const sections = ['overview', 'orders', 'bmr', 'settings', 'meal-plan'];
      const scrollPosition = window.scrollY + 120;

      for (const section of sections) {
        const element = document.getElementById(section);
        if (element) {
          const top = element.offsetTop;
          const height = element.offsetHeight;
          if (scrollPosition >= top && scrollPosition < top + height) {
            setActiveSection(section);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-12 h-12 text-[#D4FF00] animate-spin mb-4" />
        <p className="text-gray-400 font-display uppercase tracking-widest">Opening Locker Room...</p>
      </div>
    );
  }

  const proteinGoal = profile?.daily_protein_goal || 150;
  const proteinProgress = Math.min(100, (dailyProtein / proteinGoal) * 100);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex flex-col lg:flex-row gap-8 items-start">
        
        {/* Sidebar Info */}
        <aside className="w-full lg:w-80 space-y-6 lg:sticky lg:top-24">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-[#141414] border border-white/10 rounded-3xl p-8 text-center shadow-xl"
          >
            <div className="relative inline-block mb-4">
              <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center border-2 border-[#D4FF00]/20 overflow-hidden">
                {profile?.avatar_url ? (
                  <img src={getPublicUrl(profile.avatar_url)} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-12 h-12 text-[#D4FF00]" />
                )}
              </div>
              <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-[#D4FF00] rounded-full flex items-center justify-center text-black shadow-lg">
                <Zap className="w-4 h-4" />
              </div>
            </div>
            <h2 className="text-2xl font-display uppercase tracking-tight text-white mb-1">
              {profile?.full_name || 'Beast Mode'}
            </h2>
            <p className="text-gray-500 text-[10px] font-mono uppercase mb-6 tracking-widest">{user?.email}</p>
            
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 text-red-400/60 font-mono text-[9px] uppercase tracking-[0.2em] hover:text-red-400 transition-colors py-2 border border-red-500/10 rounded-xl hover:bg-red-500/5"
            >
              <LogOut className="w-3 h-3" /> End Session
            </button>
          </motion.div>

          {/* Navigation */}
          <nav className="bg-[#141414] border border-white/10 rounded-3xl p-6 shadow-xl">
            <h3 className="text-[10px] font-mono text-gray-500 uppercase tracking-[0.2em] mb-6 flex items-center gap-2 px-2">
              <Activity className="w-3 h-3" /> Dashboard
            </h3>
            <div className="space-y-1">
              {[
                { id: 'overview', label: 'Stats & Progress', icon: History },
                { id: 'orders', label: 'Order History', icon: ShoppingBag },
                { id: 'settings', label: 'Profile Settings', icon: SettingsIcon },
                { id: 'bmr', label: 'TDEE Calc', icon: Calculator },
                { id: 'meal-plan', label: 'Macro Intel', icon: Target },
              ].map(tab => (
                <button 
                  key={tab.id} 
                  onClick={() => scrollToSection(tab.id)}
                  className={cn(
                    "w-full text-left px-4 py-3.5 rounded-xl transition-all flex items-center justify-between group",
                    activeSection === tab.id 
                      ? "bg-[#D4FF00] text-black shadow-[0_0_15px_rgba(212,255,0,0.2)]" 
                      : "text-gray-400 hover:text-white hover:bg-white/5"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <tab.icon className="w-4 h-4" />
                    <span className="text-[11px] font-bold uppercase tracking-wider">{tab.label}</span>
                  </div>
                  <ChevronRight className={cn(
                    "w-4 h-4 transition-all",
                    activeSection === tab.id ? "opacity-100" : "opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0"
                  )} />
                </button>
              ))}
            </div>
          </nav>
        </aside>

        {/* Main Dashboard Area */}
        <main className="flex-1 space-y-24 pb-24">
          {/* Overview Section */}
          <section id="overview" className="scroll-mt-24">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="space-y-8"
            >
              {/* Protein Tracker Card */}
              <div className="bg-[#141414] border border-white/10 rounded-[2.5rem] p-8 md:p-12 relative overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
                  <Flame className="w-64 h-64 text-[#D4FF00]" />
                </div>

                <div className="flex flex-col lg:flex-row gap-12 relative z-10">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-8">
                      <span className="text-[10px] font-mono font-bold text-[#D4FF00] bg-[#D4FF00]/10 px-3 py-1 rounded-full uppercase tracking-widest border border-[#D4FF00]/20">Active Intake</span>
                    </div>
                    
                    <div className="flex items-baseline gap-4 mb-2">
                      <span className="text-8xl font-display text-white leading-none tracking-tighter">{dailyProtein}</span>
                      <div className="flex flex-col">
                        <span className="text-2xl text-gray-500 font-display">GRAMS</span>
                        <span className="text-xs text-[#D4FF00] font-mono uppercase tracking-[0.2em] font-bold opacity-60">Protein</span>
                      </div>
                    </div>

                    <div className="mb-8">
                      <div className="flex justify-between items-end mb-3">
                        <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Progress to Goal</span>
                        <span className="text-sm font-mono text-white font-bold">{proteinProgress.toFixed(0)}%</span>
                      </div>
                      <div className="w-full bg-white/5 h-5 rounded-2xl overflow-hidden p-1 border border-white/5">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${proteinProgress}%` }}
                          className="h-full bg-gradient-to-r from-[#D4FF00] to-[#E6FF66] rounded-xl shadow-[0_0_20px_rgba(212,255,0,0.3)] relative"
                        >
                           <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.2)_50%,transparent_75%)] bg-[length:20px_20px] animate-[shimmer_2s_linear_infinite]" />
                        </motion.div>
                      </div>
                      <p className="text-[9px] font-mono text-gray-600 uppercase tracking-[0.3em] mt-3">Daily Goal: {proteinGoal}g</p>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      {[25, 50, 75].map(val => (
                        <button
                          key={val}
                          onClick={() => updateProtein(val)}
                          disabled={isUpdatingProtein}
                          className="bg-white/5 hover:bg-[#D4FF00] text-gray-400 hover:text-black px-6 py-3 rounded-2xl transition-all border border-white/10 hover:border-transparent font-bold text-xs uppercase tracking-widest flex items-center gap-2 group"
                        >
                          <Plus className="w-4 h-4 group-hover:scale-125 transition-transform" /> {val}G
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="w-full lg:w-72 space-y-4">
                    <div className="bg-black/60 backdrop-blur-xl border border-white/5 p-6 rounded-[2rem]">
                      <h4 className="text-[10px] font-mono text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <Plus className="w-3 h-3" /> Quick Add
                      </h4>
                      <div className="flex gap-2 mb-4">
                        <input
                          type="number"
                          placeholder="Add..."
                          value={manualProtein}
                          onChange={(e) => setManualProtein(e.target.value)}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white font-mono text-sm focus:outline-none focus:border-[#D4FF00]/50"
                        />
                      </div>
                      <button
                        onClick={() => manualProtein && updateProtein(parseInt(manualProtein))}
                        disabled={isUpdatingProtein || !manualProtein}
                        className="w-full bg-white/10 text-white font-bold py-3.5 rounded-xl hover:bg-[#D4FF00] hover:text-black transition-all flex items-center justify-center gap-2 text-xs uppercase tracking-widest"
                      >
                        {isUpdatingProtein ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Log Macros'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tracking Visualization */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-[#141414] border border-white/10 rounded-3xl p-8 shadow-xl relative">
                  <h3 className="text-xs font-mono text-gray-500 uppercase tracking-widest mb-8 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" /> Gym Progress (Last 7 Days)
                  </h3>
                  <div className="h-64 w-full relative">
                    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                      <AreaChart data={historyData}>
                        <defs>
                          <linearGradient id="colorProtein" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#D4FF00" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#D4FF00" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff05" />
                        <XAxis 
                          dataKey="date" 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fill: '#666', fontSize: 10, fontFamily: 'monospace' }}
                          tickFormatter={(val) => val.split('-')[2]}
                        />
                        <YAxis hide domain={[0, 'dataMax + 20']} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#141414', border: '1px solid #ffffff10', borderRadius: '12px' }}
                          itemStyle={{ color: '#D4FF00', fontFamily: 'monospace', fontSize: '10px' }}
                         />
                        <Area 
                          type="monotone" 
                          dataKey="protein_consumed" 
                          stroke="#D4FF00" 
                          strokeWidth={3}
                          fillOpacity={1} 
                          fill="url(#colorProtein)" 
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-[#141414] border border-white/10 rounded-3xl p-8 flex flex-col justify-between shadow-xl">
                  <div className="flex items-center justify-between mb-8">
                    <h3 className="text-xs font-mono text-gray-500 uppercase tracking-widest flex items-center gap-2">
                      <ShoppingBag className="w-4 h-4" /> Latest Order
                    </h3>
                    <button onClick={() => scrollToSection('orders')} className="text-[10px] font-mono text-[#D4FF00] hover:underline uppercase">View All</button>
                  </div>
                  
                  {orders[0] ? (
                    <div className="bg-black/40 border border-white/5 rounded-2xl p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <span className="text-[10px] font-mono text-[#D4FF00] block mb-1">ORDER #{orders[0].id}</span>
                          <h4 className="font-bold text-lg text-white">Status: {orders[0].status.toUpperCase()}</h4>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-mono text-gray-500 block">TOTAL</span>
                          <span className="text-xl font-display text-white">₹{orders[0].final_price}</span>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4].map(step => (
                          <div key={step} className={cn(
                            "h-1 flex-1 rounded-full",
                            step === 1 ? "bg-[#D4FF00]" : "bg-white/5"
                          )} />
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-500 font-mono text-[10px] uppercase">No recent orders</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </section>

          {/* Orders Section */}
          <section id="orders" className="scroll-mt-24">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-3xl font-display uppercase tracking-tight">Order Logs</h2>
                <div className="px-4 py-1.5 bg-white/5 border border-white/10 rounded-full">
                  <span className="text-[10px] font-mono text-gray-500 uppercase">Confirmed: {orders.length}</span>
                </div>
              </div>

              <div className="space-y-4">
                {orders.map(order => (
                  <div key={order.id} className="bg-[#141414] border border-white/5 rounded-3xl p-8 hover:border-white/20 transition-all group shadow-lg">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                      <div className="flex items-center gap-6">
                        <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center group-hover:bg-[#D4FF00]/10 transition-colors">
                          <ShoppingBag className="w-6 h-6 text-gray-500 group-hover:text-[#D4FF00]" />
                        </div>
                        <div>
                          <div className="flex items-center gap-3 mb-1">
                            <span className="text-sm font-mono text-[#D4FF00] font-bold">BATCH #{order.id}</span>
                            <span className="text-[10px] text-gray-500 font-mono">{new Date(order.created_at).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1.5">
                              <span className={cn(
                                "w-2 h-2 rounded-full",
                                order.status === 'delivered' ? "bg-green-500" : "bg-[#FF3E00] animate-pulse"
                              )} />
                              <span className="text-[10px] font-mono font-bold uppercase text-gray-400">{order.status}</span>
                            </div>
                            <span className="text-xs text-gray-600 font-mono">• {Array.isArray(order.items) ? order.items.length : 1} Items</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-3xl font-display text-white mb-2 leading-none tracking-tighter">₹{order.final_price}</p>
                        <button className="text-[9px] font-mono text-gray-500 uppercase tracking-widest hover:text-[#D4FF00] border border-white/10 px-4 py-2 rounded-lg hover:bg-white/5 transition-all">Details</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </section>

          {/* Settings Section */}
          <section id="settings" className="scroll-mt-24">
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="space-y-8"
            >
              <div className="bg-[#141414] border border-white/10 rounded-3xl p-8 shadow-xl">
                <h3 className="text-xl font-display uppercase tracking-widest mb-8">Profile Settings</h3>
                <div className="space-y-6 max-w-md">
                  <div className="space-y-3">
                    <label className="text-[10px] font-mono text-gray-500 uppercase tracking-widest pl-2">Display Name</label>
                    <input 
                      type="text" 
                      value={settingsForm.full_name}
                      onChange={(e) => setSettingsForm({ ...settingsForm, full_name: e.target.value })}
                      className="w-full bg-[#050505] border border-white/10 rounded-2xl p-4 text-white focus:outline-none focus:border-[#D4FF00]/50"
                      placeholder="Your Name"
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-mono text-gray-500 uppercase tracking-widest pl-2">Phone Number</label>
                    <input 
                      type="tel" 
                      value={settingsForm.phone}
                      onChange={(e) => setSettingsForm({ ...settingsForm, phone: e.target.value })}
                      className="w-full bg-[#050505] border border-white/10 rounded-2xl p-4 text-white focus:outline-none focus:border-[#D4FF00]/50"
                      placeholder="WhatsApp Number"
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-mono text-gray-500 uppercase tracking-widest pl-2">Daily Protein Goal (g)</label>
                    <input 
                      type="number" 
                      value={settingsForm.daily_protein_goal}
                      onChange={(e) => setSettingsForm({ ...settingsForm, daily_protein_goal: parseInt(e.target.value) || 0 })}
                      className="w-full bg-[#050505] border border-white/10 rounded-2xl p-4 text-white focus:outline-none focus:border-[#D4FF00]/50"
                    />
                  </div>

                  <div className="pt-4 space-y-3">
                    <label className="text-[10px] font-mono text-gray-500 uppercase tracking-widest pl-2">Your Referral Link</label>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        readOnly 
                        value={referralLink}
                        className="flex-1 bg-[#050505] border border-white/10 rounded-2xl p-4 text-gray-500 text-xs focus:outline-none cursor-default"
                      />
                      <button 
                        onClick={copyReferral}
                        className="px-6 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-mono uppercase hover:bg-white/10 transition-colors"
                      >
                        Copy
                      </button>
                    </div>
                    <p className="text-[9px] font-mono text-gray-600 uppercase tracking-widest pl-2">Share this with friends to earn rewards</p>
                  </div>

                  <button 
                    onClick={handleSaveSettings}
                    disabled={isSavingSettings}
                    className="bg-[#D4FF00] text-black font-bold py-4 rounded-xl w-full hover:bg-[#B8E600] transition-colors uppercase text-xs tracking-widest mt-4 shadow-[0_10px_30px_rgba(212,255,0,0.2)]"
                  >
                    {isSavingSettings ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Save Profile Changes'}
                  </button>
                </div>
              </div>
            </motion.div>
          </section>

          {/* BMR Section */}
          <section id="bmr" className="scroll-mt-24">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="bg-[#141414] border border-white/10 rounded-[2.5rem] p-12 shadow-2xl"
            >
              <div className="max-w-2xl mx-auto">
                <div className="text-center mb-12">
                  <div className="inline-block p-4 bg-[#D4FF00]/10 rounded-3xl mb-6">
                    <Calculator className="w-12 h-12 text-[#D4FF00]" />
                  </div>
                  <h2 className="text-4xl font-display uppercase tracking-tight mb-4">TDEE Calculator</h2>
                  <p className="text-gray-500 font-mono text-xs uppercase tracking-widest">Optimize your daily fuel intake for maximum gains</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div className="space-y-4">
                    <label className="text-[10px] font-mono text-gray-500 uppercase tracking-widest pl-2">Weight (kg)</label>
                    <input 
                      type="number" 
                      value={bmrInput.weight}
                      onChange={(e) => setBmrInput({...bmrInput, weight: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white focus:outline-none focus:border-[#D4FF00]/50" 
                    />
                  </div>
                  <div className="space-y-4">
                    <label className="text-[10px] font-mono text-gray-500 uppercase tracking-widest pl-2">Height (cm)</label>
                    <input 
                      type="number" 
                      value={bmrInput.height}
                      onChange={(e) => setBmrInput({...bmrInput, height: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white focus:outline-none focus:border-[#D4FF00]/50" 
                    />
                  </div>
                  <div className="space-y-4">
                    <label className="text-[10px] font-mono text-gray-500 uppercase tracking-widest pl-2">Age</label>
                    <input 
                      type="number" 
                      value={bmrInput.age}
                      onChange={(e) => setBmrInput({...bmrInput, age: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white focus:outline-none focus:border-[#D4FF00]/50" 
                    />
                  </div>
                  <div className="space-y-4">
                    <label className="text-[10px] font-mono text-gray-500 uppercase tracking-widest pl-2">Activity Level</label>
                    <select 
                      value={bmrInput.activity}
                      onChange={(e) => setBmrInput({...bmrInput, activity: e.target.value})}
                      className="w-full bg-[#1A1A1A] border border-white/10 rounded-2xl p-4 text-white focus:outline-none focus:border-[#D4FF00]/50 outline-none appearance-none cursor-pointer"
                    >
                      <option value="1.2" className="bg-[#1A1A1A] text-white">Sedentary (No exercise)</option>
                      <option value="1.375" className="bg-[#1A1A1A] text-white">Lightly Active (1-2 days/week)</option>
                      <option value="1.55" className="bg-[#1A1A1A] text-white">Moderately Active (3-5 days/week)</option>
                      <option value="1.725" className="bg-[#1A1A1A] text-white">Very Active (6-7 days/week)</option>
                      <option value="1.9" className="bg-[#1A1A1A] text-white">Athlete (2x/day, heavy job)</option>
                    </select>
                  </div>
                </div>

                <button 
                  onClick={calculateBMR}
                  className="w-full bg-[#D4FF00] text-black font-bold py-5 rounded-2xl text-sm uppercase tracking-[0.2em] shadow-[0_0_20px_rgba(212,255,0,0.2)] hover:scale-[1.01] transition-transform"
                >
                  Calculate Maintenance Calories
                </button>

                {bmrResult && (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-12 p-8 bg-black/40 border border-[#D4FF00]/20 rounded-3xl text-center shadow-xl"
                  >
                    <span className="text-[10px] font-mono text-[#D4FF00] uppercase tracking-widest mb-2 block font-bold">Maintenance Calories</span>
                    <div className="flex items-baseline justify-center gap-4">
                      <span className="text-7xl font-display text-white">{bmrResult}</span>
                      <span className="text-xl text-gray-500 font-display">KCAL</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mt-8">
                      <div className="p-4 bg-white/5 rounded-2xl">
                        <span className="text-[9px] font-mono text-gray-600 block mb-1">BULKING (+500)</span>
                        <span className="text-xl font-bold">{bmrResult + 500}</span>
                      </div>
                      <div className="p-4 bg-white/5 rounded-2xl">
                        <span className="text-[9px] font-mono text-gray-600 block mb-1">CUTTING (-500)</span>
                        <span className="text-xl font-bold">{bmrResult - 500}</span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          </section>

          {/* Macro Intel Section (at the end) */}
          <section id="meal-plan" className="scroll-mt-24">
            <motion.div 
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-center py-24 bg-[#141414] border border-white/5 rounded-3xl shadow-xl"
            >
              <Target className="w-16 h-16 text-gray-700 mx-auto mb-6" />
              <h2 className="text-2xl font-display uppercase text-white mb-2">Locked Feature</h2>
              <p className="text-gray-500 font-mono text-xs uppercase tracking-widest">Custom meal plans based on your profile coming soon.</p>
            </motion.div>
          </section>
        </main>
      </div>
    </div>
  );
}
