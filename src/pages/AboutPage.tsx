import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { 
  Dumbbell, 
  Flame, 
  ShieldCheck, 
  MapPin, 
  UtensilsCrossed, 
  TrendingUp, 
  Award, 
  Sparkles,
  ArrowRight,
  HeartPulse,
  Truck
} from 'lucide-react';

export default function AboutPage() {
  const stats = [
    { label: 'Verified Protein / Meal', value: '35g - 65g', accent: 'text-[#D4FF00]' },
    { label: 'Belagavi Collegiate Population', value: '55,000+', accent: 'text-[#FF3E00]' },
    { label: 'Partner Gyms in 8 km Radius', value: '35+ Gyms', accent: 'text-[#00E5FF]' },
    { label: 'Student Meal Pricing', value: '₹99 - ₹179', accent: 'text-[#D4FF00]' }
  ];

  const standards = [
    {
      icon: ShieldCheck,
      title: 'Macro Precision (±2g Accuracy)',
      desc: 'Every bowl is weighed on digital commercial scales. Zero guessed calories, zero hidden fats.'
    },
    {
      icon: UtensilsCrossed,
      title: 'Zero Excess Palm Oil or Junk Sauces',
      desc: 'Cooked with light cold-pressed olive or mustard oil. Steamed, flame-grilled, and vacuum-sealed hot.'
    },
    {
      icon: MapPin,
      title: 'Hyper-Local Belagavi Sourcing',
      desc: 'Direct farm-to-kitchen partnership with wholesale poultry hatcheries and dairies in Udyambag & Tilakwadi.'
    },
    {
      icon: Truck,
      title: 'Synchronized Campus Batch Logistics',
      desc: 'Batched dispatches at 1:00 PM (Lunch) & 7:30 - 9:30 PM (Post-Gym) deliver warm meals to hostel gates with zero delivery markup.'
    }
  ];

  const campuses = [
    { name: 'KLS GIT (Gogte Institute of Technology)', area: 'Udyambag', students: '6,500+ Students' },
    { name: 'KLE Technological University', area: 'Udyambag', students: '5,200+ Students' },
    { name: 'JNMC / KAHER Medical College', area: 'Nehru Nagar', students: '4,800+ Medics' },
    { name: 'VTU Headquarters & Research Campus', area: 'Machhe', students: '3,200+ Postgrads' },
    { name: 'Jain College of Engineering (JCE)', area: 'Machhe', students: '4,000+ Engineers' }
  ];

  return (
    <div className="min-h-screen bg-[#070708] text-gray-300 py-12 px-4 sm:px-6 lg:px-8">
      <motion.div 
        initial={{ opacity: 0, y: 15 }} 
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="max-w-5xl mx-auto space-y-12"
      >
        {/* Top Header Badge */}
        <div className="space-y-4 text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 bg-[#D4FF00]/10 border border-[#D4FF00]/25 rounded-full">
            <Dumbbell className="h-4 w-4 text-[#D4FF00]" />
            <span className="text-[11px] uppercase font-mono tracking-wider text-[#D4FF00] font-bold">
              The Protein Kitchen // Belagavi First
            </span>
          </div>
          <h1 className="text-4xl sm:text-6xl font-sans font-black tracking-tighter text-white uppercase">
            Fueling <span className="text-[#D4FF00]">Belagavi's</span> Daily Grind
          </h1>
          <p className="max-w-2xl mx-auto text-sm sm:text-base font-mono text-zinc-400">
            Wheyo was born out of one glaring reality: 55,000+ collegiate students in Belagavi train hard in the gym, but struggle to hit 20g of protein in standard mess meals.
          </p>
        </div>

        {/* Live Numbers Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          {stats.map((s, idx) => (
            <div 
              key={idx}
              className="bg-[#0C0C0E] border border-white/5 rounded-2xl p-4 sm:p-5 text-center relative overflow-hidden group hover:border-[#D4FF00]/30 transition-colors"
            >
              <div className={`text-2xl sm:text-3xl font-black font-sans tracking-tight ${s.accent}`}>
                {s.value}
              </div>
              <div className="text-[10px] sm:text-xs font-mono text-zinc-400 uppercase tracking-wider mt-1">
                {s.label}
              </div>
            </div>
          ))}
        </div>

        {/* The Problem & The Origin */}
        <div className="bg-[#0C0C0E] border border-white/5 rounded-3xl p-6 sm:p-10 relative overflow-hidden space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#FF3E00]/10 border border-[#FF3E00]/20 flex items-center justify-center text-[#FF3E00]">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black font-sans uppercase text-white tracking-tight">
                The Hostel Mess Deficit
              </h2>
              <p className="text-xs font-mono text-zinc-400">
                ICMR 2024 Dietary Mandate & Local Belagavi Reality
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6 text-sm text-zinc-300 leading-relaxed font-sans">
            <div className="space-y-3">
              <p>
                In 2024, the <strong className="text-white">ICMR-NIN (National Institute of Nutrition)</strong> reported that over 73% of urban youth diets suffer from severe protein deficiency, with carb-dense diets fueling metabolic fatigue.
              </p>
              <p>
                Nowhere is this truer than in Belagavi’s student hubs. Hostellers at KLS GIT, KLE Tech, and JNMC lift heavy five days a week, only to return to a hostel dinner of white rice, watery dal, and aloo curry providing barely <span className="text-[#FF3E00] font-bold">14g of protein</span>.
              </p>
            </div>
            <div className="space-y-3">
              <p>
                Ordering plain chicken on aggregator apps in Belagavi costs ₹320–₹400 after commissions and surge fees, completely out of reach for a student on a monthly allowance.
              </p>
              <p className="bg-white/5 border border-white/10 rounded-xl p-3.5 text-xs text-zinc-200 font-mono">
                💡 <strong className="text-[#D4FF00]">The Wheyo Formula:</strong> We built an 800 sq. ft dedicated cloud kitchen in Tilakwadi that cuts out the 28% aggregator middleman, batch-delivering <span className="text-white font-bold">35g–65g protein meals directly to campus gates for just ₹99–₹179</span>.
              </p>
            </div>
          </div>
        </div>

        {/* 4 Kitchen Quality Standards */}
        <div className="space-y-6">
          <div className="text-center space-y-1">
            <h2 className="text-2xl sm:text-3xl font-black font-sans uppercase text-white tracking-tight">
              The Kitchen Standard
            </h2>
            <p className="text-xs font-mono text-zinc-400 uppercase tracking-widest">
              Zero compromises on athlete nutrition
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            {standards.map((std, idx) => (
              <div 
                key={idx}
                className="bg-[#0C0C0E] border border-white/5 rounded-2xl p-6 space-y-3 hover:border-white/10 transition-colors"
              >
                <div className="w-10 h-10 rounded-xl bg-[#D4FF00]/10 border border-[#D4FF00]/25 flex items-center justify-center text-[#D4FF00]">
                  <std.icon className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-base text-white uppercase font-sans tracking-tight">
                  {std.title}
                </h3>
                <p className="text-xs text-zinc-400 leading-relaxed font-mono">
                  {std.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Campus Corridors Served */}
        <div className="bg-[#0C0C0E] border border-white/5 rounded-3xl p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-black font-sans uppercase text-white tracking-tight flex items-center gap-2">
                <MapPin className="w-5 h-5 text-[#D4FF00]" />
                Belagavi Campus Hubs Served
              </h2>
              <p className="text-xs font-mono text-zinc-400">
                Scheduled 1:00 PM Lunch & 8:30 PM Post-Gym Gate Deliveries
              </p>
            </div>
            <Link 
              to="/campus-league"
              className="text-xs font-mono font-bold uppercase tracking-wider text-[#D4FF00] hover:underline flex items-center gap-1.5"
            >
              View Campus League <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
            {campuses.map((c, i) => (
              <div 
                key={i} 
                className="bg-black/40 border border-white/5 rounded-xl p-3.5 flex flex-col justify-between hover:border-[#D4FF00]/30 transition-colors"
              >
                <div>
                  <div className="font-sans font-bold text-xs uppercase text-white truncate">
                    {c.name}
                  </div>
                  <div className="text-[10px] font-mono text-zinc-400 mt-0.5">
                    {c.area} Corridor
                  </div>
                </div>
                <div className="mt-2 text-[10px] font-mono font-bold text-[#D4FF00]">
                  {c.students}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom CTA Banner */}
        <div className="bg-gradient-to-r from-[#111116] via-[#161622] to-[#0D150B] border border-[#D4FF00]/30 rounded-3xl p-8 sm:p-10 text-center space-y-5">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#D4FF00]/15 rounded-full border border-[#D4FF00]/30">
            <Sparkles className="w-3.5 h-3.5 text-[#D4FF00]" />
            <span className="text-[10px] font-mono uppercase font-bold text-[#D4FF00] tracking-widest">
              Join 3,200+ Active Lifters
            </span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-sans font-black uppercase text-white tracking-tight">
            Ready to Hit Your Macro Targets Today?
          </h2>
          <p className="max-w-xl mx-auto text-xs sm:text-sm font-mono text-zinc-300">
            Log your workout to unlock instant meal points or pick a monthly high-protein tiffin subscription.
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap pt-2">
            <Link 
              to="/"
              className="px-6 py-3 rounded-xl bg-[#D4FF00] text-black font-sans font-black text-xs uppercase tracking-wider hover:bg-[#bce400] transition-transform active:scale-95 shadow-[0_0_20px_rgba(212,255,0,0.3)]"
            >
              Order Refuel Meal
            </Link>
            <Link 
              to="/workouts"
              className="px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-white font-sans font-bold text-xs uppercase tracking-wider hover:bg-white/10 transition-colors"
            >
              Log Workout & Earn Points
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
