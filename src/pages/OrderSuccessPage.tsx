import React from 'react';
import { useLocation, Link, Navigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { CheckCircle2, ShoppingBag, ArrowRight, MessageSquare, MapPin, Calendar } from 'lucide-react';

export default function OrderSuccessPage() {
  const location = useLocation();
  const orderDetails = location.state?.orderDetails;

  if (!orderDetails) {
    return <Navigate to="/" replace />;
  }

  const { orderId, customerName, pickupPoint, items, finalPrice } = orderDetails;

  return (
    <div className="min-h-screen bg-[#050505] pt-32 pb-20 px-6">
      <div className="max-w-xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="inline-flex items-center justify-center w-24 h-24 bg-[#D4FF00]/10 rounded-full mb-8"
        >
          <CheckCircle2 className="w-12 h-12 text-[#D4FF00]" />
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-4xl md:text-5xl font-display uppercase tracking-tight mb-4"
        >
          Order Placed Successfully
        </motion.h1>
        
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-gray-500 font-mono text-sm uppercase tracking-widest mb-12"
        >
          Order #{orderId} has been queued for preparation
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-[#141414] border border-white/10 rounded-[2.5rem] p-8 mb-8 text-left"
        >
          <h3 className="text-[10px] font-mono text-[#D4FF00] uppercase tracking-widest mb-6 font-bold">Order Breakdown</h3>
          
          <div className="space-y-6">
            <div className="space-y-4">
              {items.map((item: any, idx: number) => (
                <div key={idx} className="flex justify-between items-center bg-white/5 rounded-2xl p-4">
                  <div className="flex items-center gap-4">
                    <span className="w-10 h-10 bg-black/40 rounded-xl flex items-center justify-center text-[10px] font-mono text-gray-400 border border-white/5">
                      {item.quantity}x
                    </span>
                    <div>
                      <p className="text-sm font-medium">{item.name}</p>
                      <p className="text-[10px] font-mono text-gray-500">{item.code}</p>
                    </div>
                  </div>
                  <span className="text-sm font-mono">₹{item.price * item.quantity}</span>
                </div>
              ))}
            </div>

            <div className="pt-6 border-t border-white/5 space-y-4">
              <div className="flex items-center gap-3 text-gray-400">
                <MapPin className="w-4 h-4 text-[#D4FF00]" />
                <span className="text-xs font-mono uppercase tracking-wider">{pickupPoint}</span>
              </div>
              <div className="flex items-center gap-3 text-gray-400">
                <Calendar className="w-4 h-4 text-[#D4FF00]" />
                <span className="text-xs font-mono uppercase tracking-wider">Ready in 20-30 mins</span>
              </div>
            </div>

            <div className="pt-6 border-t border-white/10 flex justify-between items-baseline">
              <span className="text-sm font-display uppercase text-gray-500">Total Damage</span>
              <span className="text-3xl font-display text-[#D4FF00]">₹{finalPrice}</span>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link
            to="/menu"
            className="flex items-center justify-center gap-2 bg-white/5 border border-white/10 text-white font-bold py-5 rounded-2xl text-xs uppercase tracking-widest hover:bg-white/10 transition-all"
          >
            <ShoppingBag className="w-4 h-4" />
            Stock Up More
          </Link>
          <Link
            to="/profile"
            className="flex items-center justify-center gap-2 bg-[#D4FF00] text-black font-bold py-5 rounded-2xl text-xs uppercase tracking-widest hover:scale-[1.02] transition-all shadow-[0_10px_30px_rgba(212,255,0,0.2)]"
          >
            Track Vitals
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <p className="mt-12 text-[10px] font-mono text-gray-600 uppercase tracking-[0.2em]">
          Need support? Ping us on <a href="https://wa.me/918778168629" className="text-[#D4FF00] underline">WhatsApp</a>
        </p>
      </div>
    </div>
  );
}
