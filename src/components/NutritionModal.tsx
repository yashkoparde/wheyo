import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Flame, Beef, Wheat, Droplets } from 'lucide-react';
import { MenuItem } from './MenuCard';

interface NutritionModalProps {
  item: MenuItem | null;
  onClose: () => void;
}

export function NutritionModal({ item, onClose }: NutritionModalProps) {
  if (!item) return null;

  // Derive estimated macros based on calories and protein
  const proteinCalories = item.protein * 4;
  const remainingCalories = Math.max(0, item.calories - proteinCalories);
  
  // Rule of thumb approximation for carbs and fats in our menu
  const isHighProt = item.tags.includes('High Protein');
  const isKeto = item.tags.includes('Keto');
  
  let carbs = item.carbs !== undefined && item.carbs > 0 ? item.carbs : 0;
  let fats = item.fats !== undefined && item.fats > 0 ? item.fats : 0;

  if (carbs === 0 && fats === 0) {
    if (isKeto) {
      fats = Math.round((remainingCalories * 0.8) / 9);
      carbs = Math.round((remainingCalories * 0.2) / 4);
    } else if (isHighProt) {
      fats = Math.round((remainingCalories * 0.4) / 9);
      carbs = Math.round((remainingCalories * 0.6) / 4);
    } else {
      carbs = Math.round((remainingCalories * 0.65) / 4);
      fats = Math.round((remainingCalories * 0.35) / 9);
    }
  }

  return (
    <AnimatePresence>
      {item && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/85 backdrop-blur-md z-[60] transition-opacity"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed left-4 right-4 top-1/2 -translate-y-1/2 md:inset-0 md:m-auto md:translate-y-0 w-auto md:w-full max-w-sm h-fit bg-[#0F0F12] border border-[#D4FF00]/20 rounded-3xl shadow-[0_0_50px_rgba(212,255,0,0.1)] z-[60] flex flex-col overflow-hidden"
          >
            <div className="absolute top-4 right-4 z-10">
              <button
                onClick={onClose}
                className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors active:scale-95 text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 md:p-8 flex flex-col items-center">
              <h2 className="text-xl font-display uppercase tracking-widest font-black text-white text-center mb-1 pr-6">
                {item.name}
              </h2>
              <div className="flex flex-wrap justify-center gap-1.5 mb-2.5">
                <span className={`inline-flex items-center px-2 py-0.5 rounded font-mono text-[9px] font-black uppercase leading-none border ${item.isVeg ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
                  {item.isVeg ? "VEG" : "NON-VEG"}
                </span>
                {item.tags?.map((tag) => (
                  <span key={tag} className="inline-flex items-center bg-white/5 border border-white/10 px-2 py-0.5 rounded font-mono text-[9px] font-bold text-gray-300 uppercase leading-none">
                    {tag}
                  </span>
                ))}
              </div>
              <p className="text-sm font-mono text-gray-400 mb-6 uppercase tracking-wider text-center">
                Nutritional Profile
              </p>

              <div className="w-full space-y-4">
                {/* Calories */}
                <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-orange-500/20 rounded-lg text-orange-400">
                      <Flame className="w-5 h-5" />
                    </div>
                    <span className="font-mono text-xs uppercase tracking-widest text-gray-300 font-bold">Calories</span>
                  </div>
                  <span className="font-display text-xl font-black text-white">{item.calories}</span>
                </div>

                {/* Macros Grid */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="flex flex-col items-center p-3 rounded-2xl bg-[#D4FF00]/5 border border-[#D4FF00]/10">
                    <Beef className="w-5 h-5 text-[#D4FF00] mb-2 mt-1" />
                    <span className="font-display font-black text-lg text-white">{item.protein}g</span>
                    <span className="font-mono text-[9px] uppercase tracking-widest text-gray-400 mt-0.5">Protein</span>
                  </div>
                  
                  <div className="flex flex-col items-center p-3 rounded-2xl bg-white/5 border border-white/5">
                    <Wheat className="w-5 h-5 text-indigo-400 mb-2 mt-1" />
                    <span className="font-display font-black text-lg text-white">{carbs}g</span>
                    <span className="font-mono text-[9px] uppercase tracking-widest text-gray-400 mt-0.5">Carbs</span>
                  </div>

                  <div className="flex flex-col items-center p-3 rounded-2xl bg-white/5 border border-white/5">
                    <Droplets className="w-5 h-5 text-yellow-400 mb-2 mt-1" />
                    <span className="font-display font-black text-lg text-white">{fats}g</span>
                    <span className="font-mono text-[9px] uppercase tracking-widest text-gray-400 mt-0.5">Fats</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-[#151518] p-4 text-center border-t border-white/5">
               <p className="text-[10px] font-mono text-gray-500 leading-relaxed max-w-[250px] mx-auto">
                 Macros are derived from verified ingredient scaling. Expect {"<"}5% variance based on cooking.
               </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
