import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Plus, Minus, ShoppingCart, MessageCircle } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { MenuItem } from './MenuCard';

interface OrderModalProps {
  item: MenuItem | null;
  onClose: () => void;
}

const getIngredients = (name: string) => {
  const lower = name.toLowerCase();
  if (lower.includes('chicken')) return 'Premium Chicken Breast, Olive Oil, Secret Spice Blend, Fresh Herbs, Mixed Greens';
  if (lower.includes('paneer')) return 'Fresh Malai Paneer, Greek Yogurt, Indian Spices, Bell Peppers, Onions';
  if (lower.includes('mutton')) return 'Lean Mutton Cut, Whole Spices, Onion, Tomato, Garlic, Ginger';
  if (lower.includes('soya')) return 'High-Protein Soya Chunks, Vegan Marinade, Fresh Veggies, Mint Chutney';
  if (lower.includes('fish')) return 'Fresh Catch White Fish, Lemon, Garlic, Herbs, Olive Oil';
  if (lower.includes('egg')) return 'Farm Fresh Egg Whites, Multigrain Bread, Light Butter, Black Pepper';
  if (lower.includes('whey')) return 'Premium Whey Protein Isolate, Almond Milk, Natural Flavoring, Stevia';
  return 'Fresh locally sourced ingredients, macro-friendly chef special marinade.';
};

const getProteinSource = (name: string) => {
  const lower = name.toLowerCase();
  if (lower.includes('chicken')) return 'Chicken Breast';
  if (lower.includes('paneer')) return 'Paneer (Cottage Cheese)';
  if (lower.includes('mutton')) return 'Lean Mutton';
  if (lower.includes('soya')) return 'Soya Chunks';
  if (lower.includes('fish')) return 'White Fish';
  if (lower.includes('egg')) return 'Egg Whites';
  if (lower.includes('whey')) return 'Whey Protein Isolate';
  return 'Mixed Plant & Dairy Protein';
};

export function OrderModal({ item, onClose }: OrderModalProps) {
  const [quantity, setQuantity] = useState(1);
  const [note, setNote] = useState('');
  const { addItem, setIsCartOpen } = useCart();

  useEffect(() => {
    if (item) {
      setQuantity(1);
      setNote('');
    }
  }, [item]);

  if (!item) return null;

  const handleAddToCart = () => {
    addItem({
      id: item.id,
      code: item.code,
      name: item.name,
      price: item.price,
      protein: item.protein,
      quantity,
      note,
    });
    onClose();
  };

  const handleProceedToOrder = () => {
    handleAddToCart();
    setIsCartOpen(true);
  };

  return (
    <AnimatePresence>
      {item && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-4 md:inset-0 m-auto w-full max-w-lg h-fit max-h-[85vh] bg-[#141414] border border-white/10 rounded-3xl shadow-2xl z-50 flex flex-col overflow-hidden"
          >
            <div className="relative h-28 sm:h-56 shrink-0">
              <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#141414] to-transparent" />
              <button
                onClick={(e) => { e.stopPropagation(); onClose(); }}
                className="absolute top-3 right-3 sm:top-4 sm:right-4 p-2 bg-black/50 hover:bg-black/80 backdrop-blur-md rounded-full transition-colors border border-white/10 z-50"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </button>
            </div>

            <div className="p-4 sm:p-8 -mt-4 sm:-mt-8 relative z-10 flex-1 overflow-y-auto hide-scrollbar bg-gradient-to-b from-transparent to-[#141414]">
              <div className="flex justify-between items-end mb-4 sm:mb-5">
                <div>
                  <h2 className="text-xl sm:text-3xl font-display tracking-wide uppercase leading-tight mb-1 sm:mb-2">{item.name}</h2>
                  <div className="flex items-center gap-2 sm:gap-3">
                    <span className="text-[#D4FF00] font-mono font-bold bg-[#D4FF00]/10 px-2 py-1 rounded border border-[#D4FF00]/20 text-xs sm:text-sm">{item.protein}g PRO</span>
                    <span className="text-gray-400 font-mono text-xs sm:text-sm">{item.calories} kcal</span>
                  </div>
                </div>
                <div className="text-2xl sm:text-3xl font-bold text-white">₹{item.price}</div>
              </div>

              <div className="mb-4 sm:mb-5 space-y-2 sm:space-y-3 bg-white/5 p-3 sm:p-4 rounded-2xl border border-white/10">
                <div>
                  <h4 className="text-[10px] sm:text-xs font-mono text-gray-500 uppercase mb-1">Protein Source</h4>
                  <p className="text-[#D4FF00] font-medium text-xs sm:text-sm">{item.proteinSource || getProteinSource(item.name)}</p>
                </div>
                <div>
                  <h4 className="text-[10px] sm:text-xs font-mono text-gray-500 uppercase mb-1">Ingredients</h4>
                  <p className="text-gray-300 text-xs sm:text-sm leading-relaxed">{item.ingredients || getIngredients(item.name)}</p>
                </div>
              </div>

              <div className="space-y-4 sm:space-y-5">
                <div className="flex items-center justify-between sm:block">
                  <label className="block text-xs sm:text-sm font-mono text-gray-400 uppercase mb-0 sm:mb-2">Quantity</label>
                  <div className="flex items-center gap-2 sm:gap-3 bg-[#050505] w-fit rounded-xl border border-white/10 p-1">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      disabled={quantity <= 1}
                      className={`p-1.5 sm:p-3 rounded-lg transition-colors ${quantity <= 1 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-white/5'}`}
                    >
                      <Minus className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                    <span className="font-display text-lg sm:text-xl w-6 sm:w-8 text-center">{quantity}</span>
                    <button
                      onClick={() => setQuantity(quantity + 1)}
                      className="p-1.5 sm:p-3 hover:bg-white/5 rounded-lg transition-colors"
                    >
                      <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-mono text-gray-400 uppercase mb-1 sm:mb-2">Special Instructions</label>
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="e.g. Less spicy, extra sauce..."
                    className="w-full bg-[#050505] border border-white/10 rounded-xl p-3 sm:p-4 text-sm sm:text-base text-white placeholder:text-gray-600 focus:outline-none focus:border-[#D4FF00]/50 transition-colors resize-none h-14 sm:h-24"
                  />
                </div>

                <div className="flex flex-col gap-3 pt-2 sm:pt-3 border-t border-white/10">
                  <motion.button
                    whileHover={{ scale: 1.02, backgroundColor: '#B8E600' }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleAddToCart}
                    className="w-full bg-[#D4FF00] text-black font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-[0_0_15px_rgba(212,255,0,0.2)] hover:shadow-[0_0_25px_rgba(212,255,0,0.4)] text-sm sm:text-base"
                  >
                    <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5" />
                    Add to Cart
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02, backgroundColor: 'rgba(255,255,255,0.05)' }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleProceedToOrder}
                    className="w-full bg-black border border-white/10 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-colors text-sm sm:text-base"
                  >
                    <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                    Proceed to Order
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
