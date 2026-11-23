import { motion } from 'motion/react';
import { Link, useNavigate } from 'react-router-dom';
import { Dumbbell, Utensils, Calendar, Trophy, ArrowLeft, AlertTriangle } from 'lucide-react';

export default function NotFoundPage() {
  const navigate = useNavigate();

  const recoveryLinks = [
    { title: 'Workouts & Tracker', path: '/workouts', icon: Dumbbell, desc: 'Log sets & calculate volume points', color: 'border-[#D4FF00]/30 hover:border-[#D4FF00]' },
    { title: 'Menu & Refuel', path: '/', icon: Utensils, desc: 'Order 35g-65g high-protein meal bowls', color: 'border-[#FF3E00]/30 hover:border-[#FF3E00]' },
    { title: 'Meal Plans & Tiffins', path: '/subscriptions', icon: Calendar, desc: 'Monthly bulk & shred subscription boxes', color: 'border-[#00E5FF]/30 hover:border-[#00E5FF]' },
    { title: 'Belgaum Campus League', path: '/campus-league', icon: Trophy, desc: 'KLS GIT vs KLE Tech vs JNMC ranks', color: 'border-[#D4FF00]/30 hover:border-[#D4FF00]' }
  ];

  return (
    <div className="min-h-[85vh] bg-[#070708] flex items-center justify-center py-16 px-4 sm:px-6 lg:px-8">
      <motion.div 
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.35 }}
        className="max-w-xl w-full text-center space-y-8"
      >
        {/* Neon 404 Glitch Badge */}
        <div className="relative inline-block">
          <div className="text-8xl sm:text-9xl font-black font-sans tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-[#D4FF00] via-[#8fad00] to-transparent select-none">
            404
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="px-3 py-1 rounded-full bg-[#FF3E00]/20 border border-[#FF3E00]/50 text-[#FF3E00] text-[10px] font-mono font-black uppercase tracking-widest flex items-center gap-1.5 shadow-[0_0_15px_rgba(255,62,0,0.4)]">
              <AlertTriangle className="w-3.5 h-3.5" />
              Anabolic Window Missed
            </span>
          </div>
        </div>

        {/* Headline & Description */}
        <div className="space-y-3">
          <h1 className="text-2xl sm:text-3xl font-black font-sans uppercase text-white tracking-tight">
            Off-Track Set Detected
          </h1>
          <p className="text-xs sm:text-sm font-mono text-zinc-400 max-w-md mx-auto leading-relaxed">
            The page you are looking for has been moved, completed, or doesn't exist in our Belagavi kitchen catalog. Don't let your cortisol spike—get back on your training split.
          </p>
        </div>

        {/* Quick Recovery Navigation Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
          {recoveryLinks.map((item, idx) => (
            <Link
              key={idx}
              to={item.path}
              className={`bg-[#0C0C0E] border ${item.color} rounded-2xl p-4 transition-all duration-200 hover:scale-[1.02] flex items-start gap-3 group`}
            >
              <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 group-hover:bg-white/10 text-white">
                <item.icon className="w-4 h-4 text-[#D4FF00]" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold font-sans text-xs uppercase text-white truncate">
                  {item.title}
                </div>
                <div className="text-[10px] font-mono text-zinc-400 leading-snug mt-0.5">
                  {item.desc}
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Back Button */}
        <div className="pt-2">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs font-mono font-bold uppercase tracking-wider text-zinc-300 hover:text-white hover:bg-white/10 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Return to Previous Screen
          </button>
        </div>
      </motion.div>
    </div>
  );
}
