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
          {/* Ambient Backdrop Blur Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 transition-opacity"
          />
          
          {/* Gourmet Slide-Up Bottom Sheet Card */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 280 }}
            className="fixed bottom-0 left-0 right-0 top-auto md:inset-0 md:m-auto w-full max-w-lg h-[86vh] md:h-fit max-h-[92vh] md:max-h-[85vh] bg-[#0A0A0C] border-t border-x md:border border-white/10 rounded-t-[32px] md:rounded-3xl shadow-[0_-15px_50px_rgba(0,0,0,0.95)] md:shadow-[0_25px_60px_rgba(0,0,0,0.8)] z-50 flex flex-col overflow-hidden select-none"
          >
            {/* Native indicator handle bar for bottom sheets on mobile */}
            <div className="w-11 h-1 bg-white/20 rounded-full mx-auto my-3 shrink-0 md:hidden" />

            <div className="relative h-44 sm:h-60 shrink-0">
              <img 
                src={item.image} 
                alt={item.name} 
                className="w-full h-full object-cover" 
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0C] via-[#0A0A0C]/40 to-transparent" />
              
              {/* Premium Close button */}
              <button
                onClick={(e) => { e.stopPropagation(); onClose(); }}
                className="absolute top-4 right-4 p-2.5 bg-black/60 hover:bg-black/80 backdrop-blur-md rounded-full transition-colors border border-white/10 z-50 active:scale-90"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>

            <div className="p-5 sm:p-8 -mt-6 sm:-mt-8 relative z-10 flex-1 overflow-y-auto hide-scrollbar bg-gradient-to-b from-[#0A0A0C]/50 via-[#0A0A0C] to-[#0A0A0C] flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start gap-4 mb-4 sm:mb-6">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-display uppercase tracking-wider font-extrabold text-white leading-tight mb-2">
                      {item.name}
                    </h2>
                    <div className="flex items-center gap-2">
                      <span className="text-black font-mono font-black bg-[#D4FF00] px-2 py-0.5 rounded text-[10px] tracking-wider uppercase">
                        {item.protein}g PRO
                      </span>
                      <span className="text-gray-400 font-mono text-[10px] uppercase tracking-widest">
                        {item.calories} kcal
                      </span>
                    </div>
                  </div>
                  <div className="text-2xl sm:text-3xl font-display font-black text-white shrink-0 bg-white/5 border border-white/10 px-3.5 py-1 rounded-2xl">
                    ₹{item.price}
                  </div>
                </div>

                {/* Macro Specs Block */}
                <div className="mb-5 sm:mb-6 space-y-3 bg-[#0D0D0E] p-4 rounded-2xl border border-white/5">
                  <div>
                    <h4 className="text-[9px] font-mono text-gray-500 uppercase tracking-widest mb-1 font-bold">Protein Source</h4>
                    <p className="text-[#D4FF00] font-sans font-bold text-xs">
                      {item.proteinSource || getProteinSource(item.name)}
                    </p>
                  </div>
                  <div className="h-px bg-white/5" />
                  <div>
                    <h4 className="text-[9px] font-mono text-gray-500 uppercase tracking-widest mb-1 font-bold">Detailed Ingredients</h4>
                    <p className="text-gray-400 text-xs leading-relaxed font-medium">
                      {item.ingredients || getIngredients(item.name)}
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Selector Block */}
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-gray-400 uppercase tracking-wider font-bold">Quantity</span>
                    <div className="flex items-center gap-3 bg-[#121214] rounded-xl border border-white/5 p-1">
                      <button
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        disabled={quantity <= 1}
                        className={`p-2 rounded-lg transition-colors duration-200 ${quantity <= 1 ? 'opacity-20 cursor-not-allowed' : 'hover:bg-white/5 text-white active:scale-95'}`}
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="font-mono text-sm tracking-widest font-black text-white w-6 text-center">
                        {quantity}
                      </span>
                      <button
                        onClick={() => setQuantity(quantity + 1)}
                        className="p-2 hover:bg-white/5 rounded-lg text-white transition-colors duration-200 active:scale-95"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Comments/Notes */}
                  <div>
                    <span className="block text-[10px] font-mono text-gray-400 uppercase tracking-wider font-bold mb-1.5">Special cooking instructions</span>
                    <textarea
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="e.g. Less oil, extra spicy, well-done..."
                      className="w-full bg-[#121214] border border-white/5 rounded-xl p-3 text-xs text-white placeholder:text-gray-600 focus:outline-none focus:border-[#D4FF00]/25 transition-colors resize-none h-16 sm:h-20"
                    />
                  </div>
                </div>
              </div>

              {/* Action Sheet buttons */}
              <div className="flex flex-col gap-2 pt-4 bg-[#0A0A0C]">
                <button
                  onClick={handleAddToCart}
                  className="w-full bg-[#D4FF00] hover:bg-white text-black font-black py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all duration-200 shadow-[0_4px_20px_rgba(212,255,0,0.15)] text-xs uppercase tracking-wider active:scale-[0.98]"
                >
                  <ShoppingCart className="w-4 h-4 text-black" />
                  Add to Cart
                </button>
                <button
                  onClick={handleProceedToOrder}
                  className="w-full bg-[#121214] hover:bg-[#18181b] text-gray-300 font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 border border-white/5 transition-all text-xs uppercase tracking-wider active:scale-[0.98]"
                >
                  <MessageCircle className="w-4 h-4" />
                  Proceed directly to checklist
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
