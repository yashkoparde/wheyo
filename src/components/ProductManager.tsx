import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Plus, X, Save, Upload, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Session } from '@supabase/supabase-js';

interface ProductManagerProps {
  session: Session | null;
  onRefresh: () => void;
}

export function ProductManager({ session, onRefresh }: ProductManagerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    price: 0,
    protein: 0,
    calories: 0,
    carbs: 0,
    fat: 0,
    image_url: '',
    category: 'Bulk',
    is_veg: true,
    is_available: true,
    tags: [] as string[]
  });

  if (!session) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;

    try {
      setIsSubmitting(true);
      const { error } = await supabase
        .from('products')
        .insert([{
          ...formData,
          price: parseFloat(formData.price.toString()),
          protein: parseInt(formData.protein.toString()),
          calories: parseInt(formData.calories.toString()),
          carbs: parseInt(formData.carbs.toString()),
          fat: parseInt(formData.fat.toString()),
        }]);

      if (error) throw error;
      
      setIsOpen(false);
      setFormData({
        code: '',
        name: '',
        description: '',
        price: 0,
        protein: 0,
        calories: 0,
        carbs: 0,
        fat: 0,
        image_url: '',
        category: 'Bulk',
        is_veg: true,
        is_available: true,
        tags: []
      });
      onRefresh();
    } catch (err) {
      console.error('Error saving product:', err);
      alert('Failed to save product');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mb-12">
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 bg-[#D4FF00] text-black px-6 py-3 rounded-xl font-bold uppercase text-xs tracking-widest hover:bg-[#B8E600] transition-colors shadow-[0_10px_30px_rgba(212,255,0,0.2)]"
      >
        <Plus className="w-4 h-4" />
        Inject New Fuel
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm shadow-2xl">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#141414] border border-white/10 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-8 shadow-2xl"
          >
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-display uppercase tracking-tight">Fuel Specification</h2>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-white/5 rounded-full transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-mono text-gray-500 uppercase tracking-widest pl-2">Product Code</label>
                  <input
                    required
                    type="text"
                    value={formData.code}
                    onChange={e => setFormData({...formData, code: e.target.value})}
                    placeholder="e.g. 104"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white focus:outline-none focus:border-[#D4FF00]/50"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-mono text-gray-500 uppercase tracking-widest pl-2">Product Name</label>
                  <input
                    required
                    type="text"
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    placeholder="e.g. Nitro Chicken Bowl"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white focus:outline-none focus:border-[#D4FF00]/50"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-[10px] font-mono text-gray-500 uppercase tracking-widest pl-2">Description</label>
                  <textarea
                    required
                    value={formData.description}
                    onChange={e => setFormData({...formData, description: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white focus:outline-none focus:border-[#D4FF00]/50 min-h-[100px]"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-mono text-gray-500 uppercase tracking-widest pl-2">Price (₹)</label>
                  <input
                    required
                    type="number"
                    value={formData.price}
                    onChange={e => setFormData({...formData, price: parseFloat(e.target.value)})}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white focus:outline-none focus:border-[#D4FF00]/50"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-mono text-gray-500 uppercase tracking-widest pl-2">Category</label>
                  <select
                    value={formData.category}
                    onChange={e => setFormData({...formData, category: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white focus:outline-none focus:border-[#D4FF00]/50"
                  >
                    <option value="Bulk">Bulk</option>
                    <option value="Cut">Cut</option>
                    <option value="Quick Protein">Quick Protein</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 bg-black/40 rounded-2xl border border-white/5">
                <div className="space-y-2">
                  <label className="text-[9px] font-mono text-gray-600 uppercase tracking-wider pl-1">Protein</label>
                  <input type="number" value={formData.protein} onChange={e => setFormData({...formData, protein: parseInt(e.target.value)})} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs" />
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-mono text-gray-600 uppercase tracking-wider pl-1">Calories</label>
                  <input type="number" value={formData.calories} onChange={e => setFormData({...formData, calories: parseInt(e.target.value)})} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs" />
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-mono text-gray-600 uppercase tracking-wider pl-1">Carbs</label>
                  <input type="number" value={formData.carbs} onChange={e => setFormData({...formData, carbs: parseInt(e.target.value)})} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs" />
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-mono text-gray-600 uppercase tracking-wider pl-1">Fat</label>
                  <input type="number" value={formData.fat} onChange={e => setFormData({...formData, fat: parseInt(e.target.value)})} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs" />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-[#D4FF00] text-black font-bold py-5 rounded-2xl text-sm uppercase tracking-[0.2em] shadow-[0_0_20px_rgba(212,255,0,0.2)] hover:scale-[1.01] transition-transform disabled:opacity-50 disabled:scale-100"
              >
                {isSubmitting ? 'Syncing...' : 'Confirm Injection'}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
