import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import type { Session } from '@supabase/supabase-js';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../components/Layout';
import { UpiPaymentModal } from '../components/UpiPaymentModal';

// High Polish Premium Icons
const PremiumCrownIcon = () => (
  <svg className="w-5 h-5 text-[#D4FF00]" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M5 21H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <path d="M5 17L3 7L9 11L12 4L15 11L21 7L19 17H5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="12" cy="4" r="1.5" fill="currentColor"/>
    <circle cx="3" cy="7" r="1.5" fill="currentColor"/>
    <circle cx="21" cy="7" r="1.5" fill="currentColor"/>
  </svg>
);

const SubscriptionBadgeIcon = () => (
  <svg className="w-6 h-6 text-[#D4FF00] drop-shadow-[0_0_8px_rgba(212,255,0,0.5)]" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeDasharray="4 2"/>
    <path d="M12 7V12L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <circle cx="12" cy="12" r="3" fill="#D4FF00" className="animate-pulse" />
  </svg>
);

const ArrowLeftIcon = ({ className }: { className?: string }) => (
  <svg className={cn("w-4 h-4 text-[#D4FF00]", className)} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="12" x2="5" y2="12" />
    <polyline points="12 19 5 12 12 5" />
  </svg>
);

const CheckIcon = ({ className }: { className?: string }) => (
  <svg className={cn("w-4 h-4 text-[#D4FF00]", className)} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

interface SubscriptionsPageProps {
  session: Session | null;
}

interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  billing_cycle: 'weekly' | 'monthly';
  description: string;
  is_popular: boolean;
  inclusions: string[];
}

interface SubscriptionAddon {
  id: string;
  name: string;
  price: number;
  reg_price: number;
  description?: string;
}

// Rebranded to Drop Locations, queried dynamically from database order history or standard points

// Target blueprints database admins can automatically seed/sync
const ORIGINAL_DB_PLANS_SEEDS = [
  {
    id: "student-basic-fuel",
    name: "Student Basic Fuel",
    price: 1499.00,
    billing_cycle: "weekly",
    description: "Daily high-protein meals & recovery shakes customized for campus routines.",
    is_popular: false,
    items: JSON.stringify([
      "7x Classic Lean Chicken Prep",
      "5x Post-Workout Whey Shakes",
      "Custom Macro Assessment"
    ])
  },
  {
    id: "athletic-prep",
    name: "Athletic Performance Prep",
    price: 2499.00,
    billing_cycle: "weekly",
    description: "Optimized nutrition designed for rigorous training schedules.",
    is_popular: false,
    items: JSON.stringify([
      "10x Grilled Teriyaki Chicken Plates",
      "7x Amino Energy Post-Train Shakers",
      "Hydration Mineral Powder Mix"
    ])
  },
  {
    id: "6de347da-9c85-48fa-8cf7-3473919bd5ff",
    name: "Lean Gain Blueprint",
    price: 3499.00,
    billing_cycle: "weekly",
    description: "Signature double-prep package. 14 customized meals and 7 high-potency recovery boosters.",
    is_popular: true,
    items: JSON.stringify([
      "14x Selected Clean Chicken Bowls",
      "7x Post-Workout Fuel Isolate",
      "7x Amino Acid Bullets (Intra)",
      "Dedicated Delivery Executive Assigned"
    ])
  },
  {
    id: "elite-mass-gainer",
    name: "Elite Mass Gainer",
    price: 4599.00,
    billing_cycle: "weekly",
    description: "High-density protein & carb formulations for rapid muscle tissue volume.",
    is_popular: false,
    items: JSON.stringify([
      "14x Double-Chicken High-Carb Plates",
      "14x Gold Mass-Gaining Shakes",
      "Intra-Workout Carb Carousels"
    ])
  },
  {
    id: "pro-ultimate-athlete",
    name: "Pro Ultimate Athlete Coverage",
    price: 5999.00,
    billing_cycle: "weekly",
    description: "Absolute uncompromised coverage. 3 premium macro meal-packs daily, pre & intra workout nutrients included.",
    is_popular: false,
    items: JSON.stringify([
      "21x Specialized Macro Plates",
      "14x Gold Standard Recovery Formulas",
      "7x Electrolyte Cell-Rehydrators",
      "Priority Direct Delivery Handover"
    ])
  }
];

const ORIGINAL_DB_ADDONS_SEEDS = [
  {
    id: "f60f64be-45ac-4a2a-aba5-829ced9f9b5a",
    name: "Whey Protein Isolate Daily Mix",
    price: 499.00,
    reg_price: 599.00,
    description: "Ultra-pure grass-fed whey isolate for rapid post-workout recovery."
  },
  {
    id: "3be19000-d830-4e3f-a957-c866dc649989",
    name: "Lean Creatine Booster Tub",
    price: 199.00,
    reg_price: 299.00,
    description: "Premium Creapure monohydrate to fuel immediate ATP synthesis."
  },
  {
    id: "ce951838-8fa1-4543-bc8e-d9ed30154831",
    name: "Extra Carb Oats Portion",
    price: 149.00,
    reg_price: 199.00,
    description: "Clean slow-release organic carbohydrates to optimize energy curves."
  },
  {
    id: "addon-hydra-refuel",
    name: "Electro-Hydration Fizz Mix",
    price: 249.00,
    reg_price: 349.00,
    description: "Mineral-dense electrolyte hydration mix supporting fluid cell retention."
  },
  {
    id: "addon-vitamins-pack",
    name: "Athletic Micronutrient Shield",
    price: 299.00,
    reg_price: 399.00,
    description: "Daily vitamin, magnesium and zinc blocks designed for athletes."
  }
];

export default function SubscriptionsPage({ session }: SubscriptionsPageProps) {
  const user = session?.user ?? null;

  // Supabase Table States (Strictly Database Only, Initially Empty until queried)
  const [dbPlans, setDbPlans] = useState<SubscriptionPlan[]>([]);
  const [dbAddons, setDbAddons] = useState<SubscriptionAddon[]>([]);
  const [activeUserSub, setActiveUserSub] = useState<any>(null);
  
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  // States for user subscription configuration
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');
  const [activeDetailPlanId, setActiveDetailPlanId] = useState<string | null>(null);
  const [selectedAddonIds, setSelectedAddonIds] = useState<string[]>([]);
  const [selectedDropLocation, setSelectedDropLocation] = useState<string>('GIT Main Gate');
  const [billingCycle, setBillingCycle] = useState<'weekly' | 'monthly'>('weekly');
  const [fetchTrigger, setFetchTrigger] = useState(0);

  const [dropLocations, setDropLocations] = useState<string[]>([
    'GIT Main Gate',
    'KLE Hostel Block',
    'VTU Campus',
    'Gogte Circle',
    'Other'
  ]);

  // Gamified Walkthrough States
  const [tutorialStep, setTutorialStep] = useState(0);
  const [xpPoints, setXpPoints] = useState(0);
  const [viewedWelcome, setViewedWelcome] = useState(true);
  const [completedTutorial, setCompletedTutorial] = useState(false);

  // Active status checks
  const hasLoadedAnyPlans = dbPlans.length > 0;

  // Load plans, addons, and active subscription from database clean and strict
  useEffect(() => {
    let active = true;
    async function loadData() {
      if (!supabase) return;
      setLoading(true);
      try {
        // Query plans from the real supabase table
        const { data: plansData, error: plansErr } = await supabase
          .from('subscription_plans')
          .select('*')
          .order('price', { ascending: true });

        if (!plansErr && plansData && plansData.length > 0) {
          const parsedPlans: SubscriptionPlan[] = plansData.map((p: any) => {
            let items: string[] = [];
            if (Array.isArray(p.items)) {
              items = p.items;
            } else if (typeof p.items === 'string') {
              try {
                items = JSON.parse(p.items);
              } catch {
                items = [];
              }
            }
            return {
              id: p.id,
              name: p.name,
              price: Number(p.price),
              billing_cycle: p.billing_cycle || 'weekly',
              description: p.description || '',
              is_popular: p.is_popular || p.name.includes("Lean Gain") || p.name.includes("Blueprint"),
              inclusions: items.length > 0 ? items : ["Daily Balanced Macro-Plate", "Protein Recovery Boosters", "Direct Delivery Boy Handover"]
            };
          });
          if (active) {
            setDbPlans(parsedPlans);
            // Default selected plan to first element or the Lean Gain Blueprint
            const defaultPlan = parsedPlans.find(plan => plan.name.includes("Lean Gain") || plan.name.includes("Blueprint")) || parsedPlans[0];
            if (defaultPlan) setSelectedPlanId(defaultPlan.id);
          }
        } else {
          if (active) setDbPlans([]); // ZERO fallback fake plans
        }

        // Query addons from database Table
        const { data: addonsData, error: addonsErr } = await supabase
          .from('subscription_addons')
          .select('*')
          .order('price', { ascending: true });

        if (!addonsErr && addonsData && addonsData.length > 0) {
          const parsedAddons: SubscriptionAddon[] = addonsData.map((a: any) => ({
            id: a.id,
            name: a.name,
            price: Number(a.price),
            reg_price: Number(a.reg_price || a.price * 1.25),
            description: a.description || "Micro-Booster formulation"
          }));
          if (active) setDbAddons(parsedAddons);
        } else {
          if (active) setDbAddons([]); // ZERO fallback fake addons
        }

        // Fetch User Running Subscription from real database table
        if (user) {
          const { data: userSubData, error: subErr } = await supabase
            .from('user_subscriptions')
            .select('*, subscription_plans(*)')
            .eq('user_id', user.id)
            .maybeSingle();

          if (!subErr && userSubData && active) {
            setupUserActiveSubscriptionState(userSubData);
          } else if (active) {
            setActiveUserSub(null);
          }
        }

        // Query database for previously used dynamic drop locations from orders table
        if (supabase) {
          const { data: ordersData, error: ordersErr } = await supabase
            .from('orders')
            .select('pickup_point');
          
          if (!ordersErr && ordersData && ordersData.length > 0) {
            const uniquePoints = Array.from(new Set(
              ordersData
                .map((o: any) => o.pickup_point)
                .filter((p: any) => p && typeof p === 'string' && p.trim() !== '')
            ));
            
            if (active) {
              setDropLocations(prev => {
                const combined = [...prev];
                uniquePoints.forEach(pt => {
                  if (!combined.includes(pt)) {
                    combined.push(pt);
                  }
                });
                return combined;
              });
            }
          }
        }
      } catch (err) {
        console.warn("Database strictly isolated: ", err);
        if (active) {
          setDbPlans([]);
          setDbAddons([]);
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadData();
    return () => {
      active = false;
    };
  }, [user, fetchTrigger]);

  function setupUserActiveSubscriptionState(row: any) {
    let itemsVal: string[] = [];
    if (Array.isArray(row.items)) {
      itemsVal = row.items;
    } else if (typeof row.items === 'string') {
      try {
        itemsVal = JSON.parse(row.items);
      } catch {
        itemsVal = [];
      }
    }

    setActiveUserSub({
      ...row,
      plan_name: row.plan_name || row.subscription_plans?.name || "Premium Athlete Fuel",
      price: Number(row.price || 0),
      billing_cycle: row.billing_cycle || "weekly",
      pickup_locker: row.pickup_locker || "GIT Main Gate",
      next_delivery: row.next_delivery || "Within 48 hours",
      status: row.status || "active",
      items: itemsVal
    });
  }

  // Active Selected Plan Data object
  const currentSelectedPlan = useMemo(() => {
    return dbPlans.find(p => p.id === selectedPlanId);
  }, [dbPlans, selectedPlanId]);

  // Total Realtime Subtotal calculation
  const calculatedSubtotal = useMemo(() => {
    if (!currentSelectedPlan) return 0;
    
    let basePrice = currentSelectedPlan.price;
    if (billingCycle === 'monthly') {
      basePrice = Math.round(basePrice * 4 * 0.88);
    }

    let addonsTotal = 0;
    dbAddons.forEach(addon => {
      if (selectedAddonIds.includes(addon.id)) {
        let addonPrice = addon.price;
        if (billingCycle === 'monthly') {
          addonPrice = Math.round(addonPrice * 4 * 0.88);
        }
        addonsTotal += addonPrice;
      }
    });

    return basePrice + addonsTotal;
  }, [currentSelectedPlan, dbAddons, selectedAddonIds, billingCycle]);

  // Checkbox toggle logic
  const handleToggleAddon = (addonId: string) => {
    setSelectedAddonIds(prev => {
      if (prev.includes(addonId)) {
        return prev.filter(id => id !== addonId);
      } else {
        return [...prev, addonId];
      }
    });
  };

  // Direct Auto Seed functionality using Supabase to populate database tables on demand
  const handleSyncBlueprintsToDatabase = async () => {
    if (!supabase) return;
    setSyncing(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      // 1. Clear any current entries in subscription_plans and seed
      const { error: clearPlansErr } = await supabase.from('subscription_plans').delete().neq('name', 'none_existing_placeholder');
      const { error: seedPlansErr } = await supabase.from('subscription_plans').insert(
        ORIGINAL_DB_PLANS_SEEDS.map(p => ({
          id: p.id,
          name: p.name,
          price: p.price,
          billing_cycle: p.billing_cycle,
          description: p.description,
          is_popular: p.is_popular,
          items: p.items
        }))
      );

      if (seedPlansErr) throw seedPlansErr;

      // 2. Clear and seed subscription_addons
      const { error: clearAddonsErr } = await supabase.from('subscription_addons').delete().neq('name', 'none_existing_placeholder');
      const { error: seedAddonsErr } = await supabase.from('subscription_addons').insert(ORIGINAL_DB_ADDONS_SEEDS);

      if (seedAddonsErr) throw seedAddonsErr;

      setSuccessMessage("Live Sync succeeded! 5 Plans & 5 Boosters successfully recorded inside Supabase database.");
      setFetchTrigger(prev => prev + 1);
    } catch (err: any) {
      console.error(err);
      setErrorMessage("Error writing/upserting tables: " + err.message + ". Ensure RLS policies or tables exist in Supabase!");
    } finally {
      setSyncing(false);
    }
  };

  // Run Direct Checkout Contract creation on Supabase
  const handleCheckoutContract = () => {
    if (!user) {
      setErrorMessage("Please sign in first to deploy your customized autopilot plan.");
      setTimeout(() => setErrorMessage(null), 4000);
      return;
    }

    if (!currentSelectedPlan) {
      setErrorMessage("Select a primary plan level from the database first.");
      return;
    }

    setErrorMessage(null);
    setSuccessMessage(null);
    setIsPaymentModalOpen(true);
  };

  const finalizeSubscription = async () => {
    setLoading(true);

    const deliveryDate = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN', {
      weekday: 'long',
      month: 'short',
      day: 'numeric'
    });

    const selectedAddonList = dbAddons.filter(a => selectedAddonIds.includes(a.id));
    const finalLocation = selectedDropLocation;

    const contractItems = [
      ...currentSelectedPlan.inclusions,
      ...selectedAddonList.map(addon => `+ Booster: ${addon.name}`)
    ];

    try {
      const subscriptionRecord = {
        user_id: user.id,
        plan_id: currentSelectedPlan.id,
        plan_name: currentSelectedPlan.name,
        price: calculatedSubtotal,
        billing_cycle: billingCycle,
        pickup_locker: finalLocation,
        next_delivery: `Every Sunday (Start Drop: ${deliveryDate})`,
        status: 'active',
        items: contractItems
      };

      if (supabase) {
        const { error } = await supabase
          .from('user_subscriptions')
          .upsert(subscriptionRecord, { onConflict: 'user_id' });

        if (error) {
          throw error;
        }

        setSuccessMessage(`Subscription active! Weekly drop points reserved at: ${finalLocation}`);
        setFetchTrigger(prev => prev + 1);
      }
      
      setSelectedAddonIds([]);
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err: any) {
      console.error(err);
      setErrorMessage("Failed to deploy active plan in database: " + err.message);
      setTimeout(() => setErrorMessage(null), 5000);
    } finally {
      setLoading(false);
    }
  };

  const handleDeactivateSubscription = async () => {
    if (!confirm("Are you sure you want to cancel your active meal plan contract?")) return;
    setLoading(true);
    try {
      if (supabase && user) {
        await supabase.from('user_subscriptions').delete().eq('user_id', user.id);
        setSuccessMessage("Subscription cancelled successfully.");
        setActiveUserSub(null);
        setFetchTrigger(prev => prev + 1);
      }
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      setErrorMessage("Could not pause contract: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Onboarding Tutorial steps text/images/actions
  const TUTORIAL_STEPS = [
    {
      title: "Step 1: Fuel Blueprint Setup",
      desc: "Customize your core protein intake. Select your baseline plan depending on your current training split. Student and Elite athletes get macro targets personalized in real time.",
      award: "+5 Athlete XP"
    },
    {
      title: "Step 2: Stack Active Boosters",
      desc: "Accelerate recovery intervals by adding specialized shaker booster tubes (Whey, Creatine, Carb-Oats, Electrolytes) that drop alongside your main meal-packs.",
      award: "+5 Athlete XP"
    },
    {
      title: "Step 3: Direct Handover Drop Locations",
      desc: "Delivered by our dedicated delivery executive directly to your chosen spot! When the delivery boy arrives, you'll be notified so you can come, meet and collect your customized high-protein fuels instantly.",
      award: "+10 Full Academy XP"
    }
  ];

  const triggerNextTutorialStep = () => {
    setXpPoints(prev => prev + 5);
    if (tutorialStep < TUTORIAL_STEPS.length - 1) {
      setTutorialStep(prev => prev + 1);
    } else {
      setCompletedTutorial(true);
      setSuccessMessage("Onboarding complete! Athlete Badge Unlocked (+20 XP). Ready for auto-fuel!");
      setTimeout(() => setSuccessMessage(null), 5000);
    }
  };

  return (
    <div className="min-h-screen bg-[#070708] text-[#9A99A2] font-sans antialiased selection:bg-[#D4FF00] selection:text-black">
      
      {/* CRISP & LUXURY ATHLETE HEADER */}
      <header className="border-b border-white/[0.04] bg-[#0A0A0C] py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h1 id="title-main" className="text-3xl font-sans font-black tracking-tighter text-white uppercase sm:text-4xl">
            ATHLETE <span className="text-[#D4FF00] font-light">SUBSCRIPTIONS</span>
          </h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-10">
        
        {/* TOUR AND TUTORIAL REMOVED FOR CLEAN ATMOSPHERIC STYLE */}

        {/* FEEDBACK STATUS SYSTEMS */}
        <AnimatePresence mode="wait">
          {successMessage && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-4 bg-[#0D0D10] border border-[#D4FF00]/50 text-[#D4FF00] rounded-xl flex items-center gap-3 font-mono text-xs uppercase"
            >
              <div className="w-2 h-2 bg-[#D4FF00] rounded-full animate-ping" />
              <span>{successMessage}</span>
            </motion.div>
          )}

          {errorMessage && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-4 bg-red-950/20 border border-red-500/20 text-red-400 rounded-xl flex items-center gap-3 font-mono text-xs uppercase"
            >
              <span className="w-1.5 h-1.5 bg-red-500 rounded-full" />
              <span>{errorMessage}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ACTIVE RUNNING RECURRING BLUEPRINT DISPLAY */}
        {activeUserSub && (
          <motion.div 
            initial={{ opacity: 0, y: 15 }} 
            animate={{ opacity: 1, y: 0 }}
            className="border border-[#D4FF00]/25 rounded-2xl bg-[#0D0D10] p-6 sm:p-8 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#D4FF00]/[0.02] rounded-full blur-2xl pointer-events-none" />
            
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-white/[0.04]">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="px-2.5 py-0.5 bg-green-500/10 border border-green-500/20 text-green-400 rounded-md text-[9px] font-mono uppercase tracking-widest font-black">
                    ACTIVE AUTO-FUEL DELIVERY
                  </span>
                  <span className="text-gray-400 font-mono text-xs font-bold uppercase tracking-wider">{activeUserSub.billing_cycle} Cycle</span>
                </div>
                <h3 className="text-white text-2xl font-black uppercase tracking-tight">{activeUserSub.plan_name}</h3>
                <p className="text-xs text-[#9A99A2] font-mono flex items-center gap-2">
                  <span className="w-2 h-2 bg-[#D4FF00] rounded-full" />
                  Your Drop Location: {activeUserSub.pickup_locker}
                </p>
              </div>

              <div className="flex flex-col items-start lg:items-end gap-1 font-mono">
                <span className="text-[10px] text-gray-500 uppercase tracking-widest">Ongoing Rates Per Cycle</span>
                <span className="text-3xl font-black text-[#D4FF00]">₹{Number(activeUserSub.price).toFixed(2)}</span>
              </div>
            </div>

            <div className="pt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-3">
                <span className="text-[10px] font-mono text-gray-400 uppercase tracking-widest block font-bold">
                  AUTOPILOT BLUEPRINT INCLUSIONS & ADDONS:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {activeUserSub.items?.map((item: string, i: number) => (
                    <div key={i} className="px-3.5 py-2.5 bg-zinc-950/80 border border-white/[0.03] rounded-xl text-xs font-mono text-[#E4E4E7] flex items-center gap-2.5">
                      <span className="w-1.5 h-1.5 bg-[#D4FF00] rounded-full" />
                      <span className="truncate">{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-[#08080A] p-4 rounded-xl border border-white/[0.03] flex flex-col justify-end">
                <button 
                  onClick={handleDeactivateSubscription}
                  className="w-full py-2.5 bg-red-950/25 hover:bg-red-950/50 border border-red-500/20 text-red-400 font-mono text-[10px] font-bold uppercase rounded-lg transition-colors"
                >
                  DEACTIVATE BLUEPRINT
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* PRIMARY PLANS VISUALIZER */}
        <div id="tour-subscription-plans" className="space-y-6">
          
          {loading ? (
            <div className="py-12 border border-white/[0.04] rounded-2xl bg-[#0C0C0E] text-center space-y-3 animate-pulse">
              <div className="w-8 h-8 rounded-full border-2 border-dashed border-[#D4FF00] animate-spin mx-auto" />
              <p className="text-xs font-mono uppercase text-gray-400">Loading live athletic blueprints from metadata tables...</p>
            </div>
          ) : !hasLoadedAnyPlans ? (
            // EXTREME EMPTY NOTIFICATION WARNING - PREVENT MOCKS FALLBACK
            <div id="no-plans-notice" className="p-8 border-2 border-dashed border-red-500/30 rounded-2xl bg-red-500/[0.01] space-y-5 text-center">
              <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mx-auto text-red-400 text-lg font-mono font-bold">
                !
              </div>
              <div className="space-y-2">
                <h3 className="text-white font-extrabold uppercase text-sm tracking-wide">NO LIVE SUBSCRIPTION PLANS FOUND IN DATABASE</h3>
                <p className="text-xs text-gray-400 max-w-lg mx-auto">
                  In compliance with direct instructions, hardcoded local fallback plans are completely disabled. Live plans must be queried from the <code className="text-[#D4FF00]">subscription_plans</code> table.
                </p>
              </div>

              <div className="pt-2">
                <button 
                  onClick={handleSyncBlueprintsToDatabase}
                  disabled={syncing}
                  className="px-6 py-3 bg-[#D4FF00] hover:bg-white text-black font-mono text-xs font-black uppercase rounded-xl transition-colors tracking-wide inline-flex items-center gap-2 shadow-lg"
                >
                  {syncing ? (
                    <>
                      <span className="w-3 h-3 rounded-full border-2 border-black border-dashed animate-spin" />
                      Seeding Supabase Tables...
                    </>
                  ) : (
                    "Instant Live Sync database Blueprints"
                  )}
                </button>
                <p className="text-[10px] text-gray-500 mt-2 uppercase font-mono">Seeds 5 plans & 5 custom boosters directly into Supabase instantly</p>
              </div>
            </div>
          ) : activeDetailPlanId === null ? (
            /* CONDENSED RECTANGLE CARDS LIST - LOW COGNITIVE EFFORT INITIAL VIEW */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-mono font-black text-white uppercase tracking-widest">
                  SELECT YOUR AUTOPILOT BASE PLAN
                </h2>
                <span className="text-[10px] font-mono text-gray-500 uppercase">
                  TAP ANY RECTANGLE TO CONFIGURE
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {dbPlans.map((plan) => {
                  const isSelected = selectedPlanId === plan.id;
                  const firstItems = plan.inclusions && plan.inclusions.length > 0 
                    ? plan.inclusions.slice(0, 2).join(' • ') 
                    : 'Custom Macro Fuel';

                  return (
                    <div 
                      key={plan.id}
                      onClick={() => {
                        setSelectedPlanId(plan.id);
                        setActiveDetailPlanId(plan.id);
                        window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
                      }}
                      className={cn(
                        "cursor-pointer rounded-2xl bg-[#0C0C0E] border p-4 sm:p-5 relative overflow-hidden transition-all duration-200 group select-none flex flex-col justify-between hover:border-[#D4FF00] active:scale-[0.99] shadow-md",
                        plan.is_popular 
                          ? "border-[#D4FF00]/80 bg-[#D4FF00]/[0.02]" 
                          : isSelected
                            ? "border-[#D4FF00]/60 bg-white/[0.02]"
                            : "border-white/10 hover:bg-white/[0.01]"
                      )}
                    >
                      {plan.is_popular && (
                        <div className="absolute top-0 right-0 bg-[#D4FF00] text-black font-mono font-black text-[8px] uppercase px-3 py-1 tracking-wider rounded-bl-xl shadow-md">
                          POPULAR
                        </div>
                      )}

                      <div className="space-y-2">
                        <div className="flex justify-between items-baseline gap-2 pr-12">
                          <h3 className="text-white text-sm sm:text-base font-extrabold uppercase tracking-tight group-hover:text-[#D4FF00] transition-colors">
                            {plan.name}
                          </h3>
                        </div>

                        <p className="text-[11px] text-gray-400 font-mono line-clamp-1">
                          {firstItems}
                        </p>
                      </div>

                      <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
                        <div className="font-mono">
                          <span className="text-base sm:text-lg font-black text-[#D4FF00]">
                            ₹{Number(plan.price).toLocaleString()}
                          </span>
                          <span className="text-[9px] text-gray-500 uppercase ml-1">/ {plan.billing_cycle}</span>
                        </div>

                        <div className="px-3 py-1.5 bg-[#D4FF00] group-hover:bg-white text-black font-mono text-[10px] font-black uppercase rounded-xl transition-all flex items-center gap-1">
                          <span>CONFIGURE</span>
                          <span>→</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* SUBPAGE FULL CONFIGURATION VIEW (OPENED UPON CLICKING A PLAN RECTANGLE) */
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="space-y-6 bg-[#08080A] border border-white/10 rounded-3xl p-5 sm:p-8 shadow-2xl"
            >
              {/* SUBPAGE TOP NAVIGATION BAR */}
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <button 
                  onClick={() => {
                    setActiveDetailPlanId(null);
                    window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
                  }}
                  className="flex items-center gap-2 px-3.5 py-2 bg-zinc-900 hover:bg-zinc-800 text-white font-mono text-xs font-bold uppercase rounded-xl border border-white/10 transition-all cursor-pointer active:scale-95"
                >
                  <ArrowLeftIcon />
                  <span>← ALL BLUEPRINTS</span>
                </button>

                <div className="text-right">
                  <span className="text-[10px] font-mono text-[#D4FF00] uppercase tracking-widest font-black block">
                    PLAN SUBPAGE CONFIGURATOR
                  </span>
                </div>
              </div>

              {/* TWO COLUMN GRID FOR SUBPAGE: PLAN DETAILS ON LEFT, ADDONS & CHECKOUT ON RIGHT */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                
                {/* SELECTED PLAN EXPANDED DETAILS */}
                <div className="lg:col-span-6 space-y-5 bg-[#0C0C0E] border border-white/10 rounded-2xl p-6">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <h3 className="text-white text-xl font-extrabold uppercase tracking-tight text-[#D4FF00]">
                        {currentSelectedPlan?.name || "Selected Blueprint"}
                      </h3>
                      {currentSelectedPlan?.is_popular && (
                        <span className="bg-[#D4FF00] text-black font-mono font-black text-[9px] uppercase px-2.5 py-0.5 rounded-md">
                          POPULAR
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-gray-300 font-sans leading-relaxed">
                      {currentSelectedPlan?.description}
                    </p>
                  </div>

                  <div className="border-t border-white/10 pt-4 space-y-3">
                    <span className="text-[10px] font-mono text-gray-400 uppercase tracking-wider block font-black">
                      COMPLETE BLUEPRINT INCLUSIONS:
                    </span>
                    <div className="space-y-2">
                      {currentSelectedPlan?.inclusions?.map((inc, index) => (
                        <div key={index} className="flex items-center gap-3 p-2.5 bg-zinc-950 rounded-xl border border-white/5 text-xs text-gray-200 font-mono">
                          <CheckIcon className="w-4 h-4 text-[#D4FF00] shrink-0" />
                          <span>{inc}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-2 text-xs font-mono text-gray-400 flex items-center justify-between">
                    <span>Base Subscription Rate:</span>
                    <span className="text-lg font-black text-white">
                      ₹{Number(currentSelectedPlan?.price || 0).toLocaleString()} / {currentSelectedPlan?.billing_cycle}
                    </span>
                  </div>
                </div>

                {/* ADDONS + DROP CONFIGURATION + SUBSCRIBE CTA */}
                <div className="lg:col-span-6 space-y-5">
                  
                  {/* BOOSTER ADDONS PANEL */}
                  <div className="border border-white/10 bg-[#0C0C0E] rounded-2xl p-5 space-y-4">
                    <h4 className="text-xs font-mono font-black text-white uppercase tracking-widest pb-2 border-b border-white/5">
                      STEP 2: ADD PERFORMANCE BOOSTERS
                    </h4>

                    <div className="space-y-2.5">
                      {dbAddons.map((addon) => {
                        const isChecked = selectedAddonIds.includes(addon.id);

                        return (
                          <div 
                            key={addon.id}
                            onClick={() => handleToggleAddon(addon.id)}
                            className={cn(
                              "p-3 rounded-xl border flex items-center justify-between gap-3 cursor-pointer transition-all select-none",
                              isChecked ? "border-[#D4FF00] bg-[#D4FF00]/10" : "border-white/5 bg-[#070708] hover:border-white/20"
                            )}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className={cn(
                                "w-4 h-4 rounded-md border flex items-center justify-center shrink-0",
                                isChecked ? "border-[#D4FF00] bg-[#D4FF00] text-black" : "border-white/20"
                              )}>
                                {isChecked && <CheckIcon className="w-3 h-3 text-black" />}
                              </div>
                              <span className="text-white text-xs font-bold uppercase truncate">
                                {addon.name}
                              </span>
                            </div>

                            <span className="text-xs font-mono font-black text-[#D4FF00] shrink-0">
                              +₹{addon.price}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* DROP LOCATION & BILLING CYCLE */}
                  <div className="border border-white/10 bg-[#0C0C0E] rounded-2xl p-5 space-y-4">
                    <h4 className="text-xs font-mono font-black text-white uppercase tracking-widest pb-2 border-b border-white/5">
                      STEP 3: CONFIG DROP & RECURRENCE
                    </h4>

                    {/* RENEWAL INTERVAL SELECTOR */}
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-mono text-gray-400 uppercase font-bold block">Billing Cycle</span>
                      <div className="grid grid-cols-2 gap-2 p-1 bg-[#070708] rounded-xl border border-white/5">
                        <button 
                          onClick={() => setBillingCycle('weekly')}
                          className={cn(
                            "py-2 text-xs font-mono uppercase rounded-lg transition-colors text-center font-black cursor-pointer",
                            billingCycle === 'weekly' ? "bg-white/10 text-white border border-white/20" : "text-gray-500"
                          )}
                        >
                          Weekly
                        </button>
                        <button 
                          onClick={() => setBillingCycle('monthly')}
                          className={cn(
                            "py-2 text-xs font-mono uppercase rounded-lg transition-colors text-center relative font-black cursor-pointer",
                            billingCycle === 'monthly' ? "bg-[#D4FF00]/10 text-[#D4FF00] border border-[#D4FF00]/20" : "text-gray-500"
                          )}
                        >
                          Monthly <span className="text-[7px] px-1 bg-[#D4FF00] text-black rounded font-black">SAVE 12%</span>
                        </button>
                      </div>
                    </div>

                    {/* DROP LOCATION SELECTOR */}
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-mono text-gray-400 uppercase font-bold block">Drop Location</span>
                      <select 
                        value={selectedDropLocation}
                        onChange={(e) => setSelectedDropLocation(e.target.value)}
                        className="w-full bg-[#070708] text-white border border-white/10 p-3 text-xs font-mono outline-none rounded-xl focus:border-[#D4FF00] transition-colors cursor-pointer"
                      >
                        {dropLocations.map((loc, idx) => (
                          <option key={idx} value={loc}>{loc}</option>
                        ))}
                      </select>
                    </div>

                    {/* TOTAL SUB SUMMARY & CTA */}
                    <div className="bg-zinc-950 p-4 rounded-xl border border-white/10 space-y-3 font-mono text-xs">
                      <div className="flex justify-between items-baseline">
                        <span className="text-xs uppercase text-[#D4FF00] font-black">TOTAL RECURRING:</span>
                        <div className="text-right">
                          <span className="text-2xl font-black text-[#D4FF00]">
                            ₹{calculatedSubtotal.toLocaleString()}
                          </span>
                          <span className="text-[10px] text-gray-500 uppercase block">/ {billingCycle}</span>
                        </div>
                      </div>

                      <button 
                        onClick={handleCheckoutContract}
                        disabled={loading || !currentSelectedPlan}
                        className={cn(
                          "w-full py-4 rounded-xl font-mono text-black font-black uppercase text-xs tracking-widest transition-all duration-200 cursor-pointer shadow-lg",
                          (loading || !currentSelectedPlan) 
                            ? "bg-[#D4FF00]/40 cursor-not-allowed" 
                            : "bg-[#D4FF00] hover:bg-white active:scale-95"
                        )}
                      >
                        {loading ? "PROCESSING..." : "SUBSCRIBE NOW"}
                      </button>
                    </div>

                  </div>

                </div>

              </div>
            </motion.div>
          )}

        </div>

        {/* BOTTOM REDIRECTS & NAVIGATION GRID IN ACCORDANCE WITH REQS */}
        <section className="pt-2 border-t border-white/[0.04] flex flex-col items-center gap-[20px] pb-2">
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 hover:text-[#D4FF00] transition-colors cursor-pointer py-1 flex items-center gap-1"
          >
            ▲ Go to Top
          </button>
          
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-center">
            <Link 
              to="/menu"
              className="px-6 py-3 bg-white/5 border border-white/10 hover:bg-white/10 text-white font-mono text-xs font-black uppercase rounded-xl tracking-wider transition-all active:scale-[0.98] text-center min-w-[200px]"
            >
              ← Back to Fuel Station
            </Link>
            <Link 
              to="/profile"
              className="px-6 py-3 bg-[#D4FF00] hover:bg-white text-black font-mono text-xs font-black uppercase rounded-xl tracking-wider transition-all shadow-[0_5px_25px_rgba(212,255,0,0.15)] active:scale-[0.98] text-center min-w-[200px]"
            >
              Go to Profile Hub →
            </Link>
          </div>
        </section>

      </main>

      <UpiPaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        onSuccess={() => {
          setIsPaymentModalOpen(false);
          finalizeSubscription();
        }}
        amount={calculatedSubtotal}
      />
    </div>
  );
}
