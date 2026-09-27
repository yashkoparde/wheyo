import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Trophy, 
  Building2, 
  Flame, 
  Dumbbell, 
  Coins, 
  Award, 
  Users, 
  TrendingUp, 
  Share2, 
  Check, 
  ArrowRight,
  ShieldAlert,
  Sparkles
} from 'lucide-react';
import { 
  BELGAUM_CAMPUSES, 
  Campus, 
  getUserCampusId, 
  setUserCampusId, 
  getPointsBalance, 
  getWorkoutHistory 
} from '../lib/workoutMath';
import { Link } from 'react-router-dom';

export default function CampusLeaguePage() {
  const [selectedCampusId, setSelectedCampusId] = useState<string>(getUserCampusId);
  const [pointsBalance, setPointsBalance] = useState<number>(getPointsBalance);
  const [copied, setCopied] = useState(false);
  const [showFlexModal, setShowFlexModal] = useState(false);

  useEffect(() => {
    const handleCampus = () => setSelectedCampusId(getUserCampusId());
    const handlePoints = () => setPointsBalance(getPointsBalance());
    window.addEventListener('wheyo-campus-updated', handleCampus);
    window.addEventListener('wheyo-points-updated', handlePoints);
    return () => {
      window.removeEventListener('wheyo-campus-updated', handleCampus);
      window.removeEventListener('wheyo-points-updated', handlePoints);
    };
  }, []);

  const currentCampus = BELGAUM_CAMPUSES.find((c) => c.id === selectedCampusId) || BELGAUM_CAMPUSES[0];

  const handleSelectCampus = (campusId: string) => {
    setSelectedCampusId(campusId);
    setUserCampusId(campusId);
  };

  // Campus Top Athletes Leaderboard Mock Data (Realistic Belgaum athletes)
  const campusAthletes = [
    { rank: 1, name: 'Sanket Patil', streak: 18, points: 1420, volumeKg: '18,400 kg', badge: '🥇 Heavy Lifter' },
    { rank: 2, name: 'Aditya Kulkarni', streak: 14, points: 1180, volumeKg: '14,200 kg', badge: '🥈 Bar Beast' },
    { rank: 3, name: 'Rohan Deshmukh', streak: 12, points: 960, volumeKg: '12,800 kg', badge: '🥉 Cardio King' },
    { rank: 4, name: 'Prajwal Joshi', streak: 9, points: 840, volumeKg: '10,500 kg', badge: '🔥 Iron Warrior' },
    { rank: 5, name: 'Sneha Shinde', streak: 8, points: 720, volumeKg: '9,100 kg', badge: '⚡ Shred Queen' },
    { rank: 6, name: 'You (Athlete)', streak: 5, points: pointsBalance, volumeKg: '6,200 kg', badge: '💪 Rising Beast', isUser: true },
    { rank: 7, name: 'Varun Hegde', streak: 4, points: 510, volumeKg: '5,800 kg', badge: '🥊 Grinder' },
    { rank: 8, name: 'Nikhil Pai', streak: 3, points: 430, volumeKg: '4,600 kg', badge: '🥗 Clean Fuel' },
  ];

  return (
    <div className="min-h-screen bg-[#050505] text-white pt-4 pb-28 px-4 sm:px-6 lg:px-8 select-none">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Hero Section */}
        <div className="bg-gradient-to-br from-[#12121E] via-[#0E0E18] to-[#0A0A10] border border-white/10 rounded-3xl p-6 sm:p-8 shadow-[0_8px_32px_rgba(0,0,0,0.6)] relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-96 h-96 bg-[#D4FF00]/8 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 space-y-3">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-[#D4FF00]/15 border border-[#D4FF00]/30 text-[#D4FF00] font-mono text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
                <Trophy className="w-3.5 h-3.5" /> Belgaum Inter-Campus War 2026
              </span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-display font-black uppercase tracking-tight text-white">
              Rep Your Campus, <span className="text-[#D4FF00]">Rule Belgaum</span>
            </h1>
            <p className="text-zinc-400 font-mono text-xs sm:text-sm max-w-xl leading-relaxed">
              Every set, rep, and cardio minute you log earns points for your college ranking. Compete with classmates and unlock real meal discounts!
            </p>

            <div className="pt-2 flex items-center gap-3 flex-wrap">
              <button
                type="button"
                onClick={() => setShowFlexModal(true)}
                className="px-5 py-2.5 bg-[#D4FF00] hover:bg-white text-black font-mono text-xs font-black uppercase rounded-xl shadow-[0_0_20px_rgba(212,255,0,0.3)] transition-all cursor-pointer active:scale-95 flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>Flex Campus Card</span>
              </button>

              <Link
                to="/workouts"
                className="px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 hover:text-white font-mono text-xs font-bold uppercase rounded-xl transition-all flex items-center gap-1.5"
              >
                <span>+ Log Workout Now</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>

        {/* Selected Campus Dashboard Card */}
        <div className="bg-[#0C0C12] border border-[#D4FF00]/30 rounded-3xl p-5 sm:p-7 space-y-5 shadow-2xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-mono uppercase font-black text-zinc-400 tracking-widest block">
                Your Active Campus
              </span>
              <h2 className="text-xl sm:text-2xl font-display font-black uppercase text-white tracking-wide mt-0.5">
                {currentCampus.name}
              </h2>
              <span className="text-xs font-mono text-zinc-500">{currentCampus.location}</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-3.5 py-1.5 rounded-xl bg-[#D4FF00] text-black font-mono text-xs font-black uppercase shadow-[0_0_15px_rgba(212,255,0,0.3)]">
                Rank #{currentCampus.rank} Belgaum
              </span>
            </div>
          </div>

          {/* Campus Live Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-[#141420] border border-white/5 rounded-2xl p-3.5">
              <span className="text-[10px] font-mono uppercase text-zinc-400 font-bold block flex items-center gap-1">
                <Users className="w-3 h-3 text-cyan-400" /> Athletes
              </span>
              <span className="text-xl font-mono font-black text-white">{currentCampus.totalAthletes}</span>
            </div>

            <div className="bg-[#141420] border border-white/5 rounded-2xl p-3.5">
              <span className="text-[10px] font-mono uppercase text-zinc-400 font-bold block flex items-center gap-1">
                <Dumbbell className="w-3 h-3 text-[#D4FF00]" /> Volume Lifted
              </span>
              <span className="text-xl font-mono font-black text-white">{currentCampus.totalVolumeTons} Tons</span>
            </div>

            <div className="bg-[#141420] border border-white/5 rounded-2xl p-3.5">
              <span className="text-[10px] font-mono uppercase text-zinc-400 font-bold block flex items-center gap-1">
                <Flame className="w-3 h-3 text-orange-400" /> Torched
              </span>
              <span className="text-xl font-mono font-black text-orange-400">{(currentCampus.totalCaloriesBurned / 1000).toFixed(0)}k kcal</span>
            </div>

            <div className="bg-[#141420] border border-white/5 rounded-2xl p-3.5">
              <span className="text-[10px] font-mono uppercase text-zinc-400 font-bold block flex items-center gap-1">
                🍗 Protein Fueled
              </span>
              <span className="text-xl font-mono font-black text-[#D4FF00]">{(currentCampus.totalProteinFueledGrams / 1000).toFixed(1)}k g</span>
            </div>
          </div>
        </div>

        {/* Switch Campus Selector */}
        <div className="bg-[#0C0C10] border border-white/10 rounded-2xl p-4 sm:p-5">
          <span className="text-[10px] font-mono uppercase font-black text-zinc-400 tracking-wider block mb-3">
            Switch / Join Belgaum College:
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
            {BELGAUM_CAMPUSES.map((c) => {
              const isSelected = c.id === selectedCampusId;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => handleSelectCampus(c.id)}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#D4FF00]/10 border-[#D4FF00] text-white shadow-[0_0_15px_rgba(212,255,0,0.15)]'
                      : 'bg-[#14141C] border-white/5 text-zinc-400 hover:border-white/15 hover:text-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[9px] font-black uppercase text-[#D4FF00]">
                      #{c.rank}
                    </span>
                    {isSelected && <span className="w-2 h-2 rounded-full bg-[#D4FF00]" />}
                  </div>
                  <h4 className="font-display text-xs font-black uppercase tracking-wide text-white mt-1 line-clamp-1">
                    {c.shortName}
                  </h4>
                  <span className="text-[9px] font-mono text-zinc-500 block mt-0.5">
                    {c.totalAthletes} lifters
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Campus Leaderboard */}
        <div className="bg-[#0C0C10] border border-white/10 rounded-3xl p-5 sm:p-7 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg sm:text-xl font-display font-black uppercase text-white tracking-wide">
                🏆 Top Athletes of {currentCampus.shortName}
              </h3>
              <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">
                Updated in real-time based on verified workout logs
              </span>
            </div>
            <span className="px-2.5 py-1 rounded bg-white/5 border border-white/10 font-mono text-[10px] font-bold text-zinc-300">
              Season 1 Active
            </span>
          </div>

          <div className="space-y-2">
            {campusAthletes.map((ath) => (
              <div
                key={ath.name}
                className={`p-3 sm:p-4 rounded-2xl border flex items-center justify-between gap-3 transition-all ${
                  ath.isUser
                    ? 'bg-gradient-to-r from-[#181826] to-[#12121E] border-[#D4FF00] shadow-[0_0_20px_rgba(212,255,0,0.15)]'
                    : 'bg-[#121218] border-white/5'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-mono font-black text-xs ${
                    ath.rank === 1
                      ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/40'
                      : ath.rank === 2
                      ? 'bg-zinc-300/20 text-zinc-200 border border-zinc-300/40'
                      : ath.rank === 3
                      ? 'bg-amber-600/20 text-amber-500 border border-amber-600/40'
                      : 'bg-white/5 text-zinc-400 border border-white/10'
                  }`}>
                    #{ath.rank}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-display text-xs sm:text-sm font-black uppercase text-white">
                        {ath.name}
                      </h4>
                      <span className="hidden sm:inline-block px-2 py-0.5 rounded bg-white/5 text-[9px] font-mono text-zinc-400">
                        {ath.badge}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wide">
                      🔥 {ath.streak} Day Streak • {ath.volumeKg} Lifted
                    </span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="font-mono text-xs sm:text-sm font-black text-[#D4FF00] block">
                    {ath.points} PTS
                  </span>
                  <span className="text-[9px] font-mono text-zinc-500 block">
                    = ₹{(ath.points * 0.1).toFixed(0)} Off
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Flex Campus Card Modal */}
      <AnimatePresence>
        {showFlexModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowFlexModal(false)}
              className="fixed inset-0 bg-black/85 backdrop-blur-sm z-[150]"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed left-4 right-4 top-1/2 -translate-y-1/2 md:inset-0 md:m-auto w-auto md:w-full max-w-sm bg-[#0E0E16] border border-[#D4FF00] rounded-3xl p-6 shadow-[0_0_50px_rgba(212,255,0,0.25)] z-[150] select-none text-center"
            >
              <div className="w-14 h-14 mx-auto rounded-2xl bg-[#D4FF00]/15 border border-[#D4FF00]/30 flex items-center justify-center mb-3">
                <Trophy className="w-7 h-7 text-[#D4FF00]" />
              </div>

              <span className="text-[10px] font-mono uppercase font-black text-[#D4FF00] tracking-widest block">
                Official Wheyo Athlete Pass
              </span>
              <h3 className="text-xl font-display font-black uppercase text-white mt-1">
                {currentCampus.shortName} Warrior
              </h3>
              <p className="text-xs font-mono text-zinc-400 mt-1">
                Ranked #{currentCampus.rank} in Belgaum • {pointsBalance} Points Earned
              </p>

              <div className="bg-[#141420] border border-white/10 rounded-2xl p-4 my-4 space-y-2 text-left">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-zinc-400">Campus:</span>
                  <span className="text-white font-bold">{currentCampus.shortName}</span>
                </div>
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-zinc-400">Wheyo PTS:</span>
                  <span className="text-[#D4FF00] font-black">{pointsBalance} PTS</span>
                </div>
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-zinc-400">Food Discount:</span>
                  <span className="text-emerald-400 font-bold">₹{(pointsBalance * 0.1).toFixed(0)} INR OFF</span>
                </div>
              </div>

              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => {
                    if (navigator.clipboard) {
                      navigator.clipboard.writeText(
                        `I'm repping ${currentCampus.shortName} on Wheyo! Logged workouts & unlocked ₹${(pointsBalance * 0.1).toFixed(0)} food discounts. Join the Belgaum Campus War: http://localhost:3000/campus-league`
                      );
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2500);
                    }
                  }}
                  className="w-full py-3 bg-[#D4FF00] hover:bg-white text-black font-mono text-xs font-black uppercase rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_15px_rgba(212,255,0,0.3)]"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
                  <span>{copied ? 'Copied Share Link!' : 'Share & Flex With Friends'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowFlexModal(false)}
                  className="w-full py-2.5 bg-white/5 hover:bg-white/10 text-zinc-400 font-mono text-xs font-bold uppercase rounded-xl transition-colors"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
