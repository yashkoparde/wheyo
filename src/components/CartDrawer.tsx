import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Minus, Plus, ShoppingBag, ArrowRight, Trash2, Tag, MapPin, User, Phone, Loader2, ChevronDown } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

const WHATSAPP_ORDER_NUMBER = import.meta.env.VITE_WHATSAPP_NUMBER || '918778168629';
const FLAT_COUPON_CODE = import.meta.env.VITE_COUPON_FLAT_CODE || 'WHEYO50';
const FLAT_COUPON_AMOUNT = Number(import.meta.env.VITE_COUPON_FLAT_AMOUNT) || 50;
const PERCENT_COUPON_CODE = import.meta.env.VITE_COUPON_PERCENT_CODE || 'PROTEIN10';
const PERCENT_COUPON_AMOUNT = Number(import.meta.env.VITE_COUPON_PERCENT_AMOUNT) || 10;

const PICKUP_POINTS = [
  'GIT Main Gate',
  'KLE Hostel Block',
  'VTU Campus',
  'Gogte Circle',
  'Other'
];

export function CartDrawer() {
  const { items, isCartOpen, setIsCartOpen, updateQuantity, removeItem, totalPrice, clearCart } = useCart();
  const navigate = useNavigate();
  
  const [couponCode, setCouponCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [couponMessage, setCouponMessage] = useState('');
  const [couponType, setCouponType] = useState<'success' | 'error' | ''>('');
  const [pickupPoint, setPickupPoint] = useState('');
  const [otherPickupPoint, setOtherPickupPoint] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [checkoutError, setCheckoutError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Scroll to top when cart opens
  useEffect(() => {
    if (isCartOpen && scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [isCartOpen]);

  // Reset coupon when cart is empty
  useEffect(() => {
    if (items.length === 0) {
      setCouponCode('');
      setDiscount(0);
      setCouponMessage('');
      setCouponType('');
    }
  }, [items.length]);

  const handleApplyCoupon = () => {
    const code = couponCode.trim().toUpperCase();
    if (!code) {
      setCouponMessage('Please enter a code');
      setCouponType('error');
      setDiscount(0);
      return;
    }

    if (code === FLAT_COUPON_CODE) {
      setDiscount(FLAT_COUPON_AMOUNT);
      setCouponMessage(`₹${FLAT_COUPON_AMOUNT} flat discount applied!`);
      setCouponType('success');
    } else if (code === PERCENT_COUPON_CODE) {
      const discountAmt = Math.floor(totalPrice * (PERCENT_COUPON_AMOUNT / 100));
      setDiscount(discountAmt);
      setCouponMessage(`${PERCENT_COUPON_AMOUNT}% discount applied (-₹${discountAmt})!`);
      setCouponType('success');
    } else {
      setDiscount(0);
      setCouponMessage('Invalid or expired coupon code');
      setCouponType('error');
    }
  };

  const finalPrice = Math.max(0, totalPrice - discount);

  const handleCheckout = async () => {
    if (items.length === 0 || isSubmitting) return;
    
    if (!pickupPoint) {
      setCheckoutError('Please select a pickup point');
      return;
    }
    if (pickupPoint === 'Other' && !otherPickupPoint.trim()) {
      setCheckoutError('Please specify your pickup location');
      return;
    }
    if (!customerName.trim()) {
      setCheckoutError('Please enter your name');
      return;
    }
    if (!customerPhone.trim()) {
      setCheckoutError('Please enter your phone number');
      return;
    }
    setCheckoutError('');

    try {
      setIsSubmitting(true);
      
      if (!supabase) {
        throw new Error('Supabase client not initialized. Check your environment variables.');
      }
      
      const { data: userData } = await supabase.auth.getUser();
      const user = userData?.user;
      
      const finalPickupPoint = pickupPoint === 'Other' ? `Other: ${otherPickupPoint}` : pickupPoint;

      // 1. Save order to Supabase
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user?.id || null, 
          customer_name: customerName,
          customer_phone: customerPhone,
          pickup_point: finalPickupPoint,
          items: items,
          total_price: totalPrice,
          discount_amount: discount,
          final_price: finalPrice,
          status: 'pending'
        })
        .select('id')
        .single();

      if (orderError) {
        if (orderError.message.includes('user_id')) {
          throw new Error('Database Error: The "user_id" column is missing in the "orders" table. Please run the SQL in tables.md to fix this.');
        }
        if (orderError.code === 'PGRST205') {
          throw new Error('The "orders" table is missing in your database. Please run the SQL in tables.md');
        }
        throw orderError;
      }

      const orderId = orderData.id;
      const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
      const orderProtein = items.reduce((sum, item) => sum + (item.protein * item.quantity), 0);

      // 1b. Update daily macros if user is logged in
      if (user && orderProtein > 0) {
        const today = new Date().toISOString().split('T')[0];
        
        try {
          const { data: currentMacro } = await supabase
            .from('daily_macros')
            .select('protein_consumed')
            .eq('user_id', user.id)
            .eq('date', today)
            .maybeSingle();
            
          const currentAmount = currentMacro ? Number(currentMacro.protein_consumed) : 0;
          
          await supabase.from('daily_macros').upsert({
            user_id: user.id,
            date: today,
            protein_consumed: currentAmount + orderProtein
          }, { onConflict: 'user_id,date' });
        } catch (macroErr) {
          console.error('Error logging protein from order:', macroErr);
          // Don't fail the whole checkout if macro logging fails
        }
      }
      
      // 2. Format WhatsApp Message
      let message = `*Order #${orderId} - Wheyo Fuel*\n`;
      message += `--------------------------\n`;
      message += `*Customer:* ${customerName}\n`;
      message += `*Phone:* ${customerPhone}\n`;
      message += `*Pickup:* ${finalPickupPoint}\n`;
      message += `--------------------------\n\n`;
      
      items.forEach((item) => {
        message += `• [${item.code}] ${item.name} × ${item.quantity}\n`;
        if (item.note) {
          message += `  _Note: ${item.note}_\n`;
        }
      });
      
      if (discount > 0) {
        message += `\n*Subtotal:* ₹${totalPrice}`;
        message += `\n*Discount (${couponCode.toUpperCase()}):* -₹${discount}`;
      }
      message += `\n*Total Amount:* ₹${finalPrice}\n\n`;
      message += `_Please confirm your order by replying to this message._`;

      const encodedMessage = encodeURIComponent(message);
      window.open(`https://wa.me/${WHATSAPP_ORDER_NUMBER}?text=${encodedMessage}`, '_blank');
      
      const sessionDetails = {
        orderId,
        customerName,
        pickupPoint: finalPickupPoint,
        items: [...items],
        finalPrice
      };

      clearCart();
      setIsCartOpen(false);
      setCustomerName('');
      setCustomerPhone('');
      setPickupPoint('');

      navigate('/order-success', { state: { orderDetails: sessionDetails } });
    } catch (err: any) {
      console.error('Checkout error:', err);
      const errorMsg = err.message || 'Failed to place order in database.';
      setCheckoutError(`${errorMsg} Please try again.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isCartOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsCartOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-full w-full max-w-md bg-[#050505] border-l border-white/10 shadow-2xl z-50 flex flex-col"
          >
            <div className="p-5 border-b border-white/10 flex items-center justify-between bg-[#141414]">
              <div className="flex items-center gap-2.5">
                <ShoppingBag className="w-5 h-5 text-[#D4FF00]" />
                <h2 className="text-xl font-display tracking-tight uppercase">Your Fuel</h2>
              </div>
              <button
                onClick={() => setIsCartOpen(false)}
                className="p-1.5 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white"
                disabled={isSubmitting}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-6">
              {items.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
                  <div className="w-16 h-16 bg-white/5 rounded-3xl flex items-center justify-center mb-4">
                    <ShoppingBag className="w-8 h-8" />
                  </div>
                  <p className="text-lg font-display tracking-wide uppercase mb-1">Cart is empty</p>
                  <p className="text-xs font-mono">Load up on high-protein meals.</p>
                </div>
              ) : (
                <>
                  {/* Receiver Info at the top */}
                  <div className="space-y-4 pb-4 border-b border-white/10">
                    <h3 className="text-[10px] font-mono text-gray-500 uppercase tracking-[0.2em] px-1">Receiver Details</h3>
                    
                    <div className="grid grid-cols-1 gap-2.5">
                      <div className="relative group">
                        <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-600 transition-colors group-focus-within:text-[#D4FF00]" />
                        <input
                          type="text"
                          placeholder="Full Name"
                          value={customerName}
                          onChange={(e) => setCustomerName(e.target.value)}
                          disabled={isSubmitting}
                          className="w-full bg-white/[0.05] border border-white/10 rounded-xl py-3 pl-10 pr-3 text-xs text-white focus:outline-none focus:border-[#D4FF00]/30 transition-all font-mono"
                        />
                      </div>
                      
                      <div className="relative group">
                        <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-600 transition-colors group-focus-within:text-[#D4FF00]" />
                        <input
                          type="tel"
                          placeholder="WhatsApp Number (of receiver)"
                          value={customerPhone}
                          onChange={(e) => setCustomerPhone(e.target.value)}
                          disabled={isSubmitting}
                          className="w-full bg-white/[0.05] border border-white/10 rounded-xl py-3 pl-10 pr-3 text-xs text-white focus:outline-none focus:border-[#D4FF00]/30 transition-all font-mono"
                        />
                      </div>

                      <div className="relative group">
                        <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-600 transition-colors group-focus-within:text-[#D4FF00]" />
                        <select
                          value={pickupPoint}
                          onChange={(e) => {
                            setPickupPoint(e.target.value);
                            setCheckoutError('');
                            if (e.target.value !== 'Other') setOtherPickupPoint('');
                          }}
                          disabled={isSubmitting}
                          className="w-full bg-[#1A1A1A] border border-white/20 rounded-xl py-3.5 pl-10 pr-10 text-sm text-white focus:outline-none focus:border-[#D4FF00]/40 transition-all appearance-none cursor-pointer font-mono shadow-inner"
                        >
                          <option value="" disabled className="bg-[#1A1A1A] text-gray-400">Select pickup point...</option>
                          {PICKUP_POINTS.map(point => (
                            <option key={point} value={point} className="bg-[#1A1A1A] text-white py-2">{point}</option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-600 pointer-events-none" />
                      </div>

                      <AnimatePresence>
                        {pickupPoint === 'Other' && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="relative group overflow-hidden"
                          >
                            <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-600 transition-colors group-focus-within:text-[#D4FF00]" />
                            <input
                              type="text"
                              placeholder="Enter specific pickup location"
                              value={otherPickupPoint}
                              onChange={(e) => setOtherPickupPoint(e.target.value)}
                              disabled={isSubmitting}
                              className="w-full bg-white/[0.05] border border-white/10 rounded-xl py-3 pl-10 pr-3 text-xs text-white focus:outline-none focus:border-[#D4FF00]/30 transition-all font-mono"
                            />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>

                  {/* Promo Code - Moved from footer to scrollable area */}
                  <div className="bg-white/[0.03] p-3 rounded-2xl border border-white/5 mx-1">
                    <div className="flex gap-2">
                      <div className="relative flex-1 group">
                        <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-600 transition-colors group-focus-within:text-[#D4FF00]" />
                        <input
                          type="text"
                          value={couponCode}
                          onChange={(e) => {
                            setCouponCode(e.target.value);
                            setCouponMessage('');
                          }}
                          placeholder="PROMO CODE"
                          disabled={isSubmitting}
                          className="w-full bg-black/40 border border-white/5 rounded-xl py-2 pl-8 pr-3 text-[10px] text-white placeholder:text-gray-700 focus:outline-none focus:border-[#D4FF00]/30 transition-all uppercase font-mono"
                        />
                      </div>
                      <button
                        onClick={handleApplyCoupon}
                        disabled={isSubmitting}
                        className="bg-white/5 hover:bg-white/10 text-white px-3 py-2 rounded-xl text-[10px] font-bold transition-all border border-white/5 uppercase tracking-wider"
                      >
                        Apply
                      </button>
                    </div>
                    {couponMessage && (
                      <p className={`text-[9px] font-mono px-1 mt-1 ${couponType === 'success' ? 'text-[#D4FF00]' : 'text-red-400'}`}>
                        {couponMessage}
                      </p>
                    )}
                  </div>

                  {/* Cart Items */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between px-1">
                      <h3 className="text-[10px] font-mono text-gray-500 uppercase tracking-[0.2em]">Deployment Items ({items.length})</h3>
                    </div>
                    {items.map((item) => (
                      <div key={`${item.id}-${item.note}`} className="bg-[#141414]/80 backdrop-blur-sm border border-white/5 p-4 rounded-[1.25rem] group transition-all hover:border-white/20">
                        <div className="flex items-start gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start mb-1">
                              <h3 className="font-bold text-sm text-white truncate">{item.name}</h3>
                              <button
                                onClick={() => removeItem(item.id)}
                                className="text-gray-600 hover:text-red-400 transition-colors p-1"
                                disabled={isSubmitting}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <div className="flex items-baseline gap-2 mb-3">
                              <span className="text-[#D4FF00] font-bold text-sm">₹{item.price}</span>
                              <span className="text-[10px] text-gray-600 font-mono">PER UNIT</span>
                            </div>
                            
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5 bg-black/40 p-0.5 rounded-lg border border-white/5">
                                <button
                                  onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                  className="w-7 h-7 flex items-center justify-center hover:bg-white/5 rounded-md transition-colors text-gray-500"
                                  disabled={isSubmitting}
                                >
                                  <Minus className="w-3 h-3" />
                                </button>
                                <span className="font-mono font-bold w-5 text-center text-xs text-white">{item.quantity}</span>
                                <button
                                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                  className="w-7 h-7 flex items-center justify-center hover:bg-white/5 rounded-md transition-colors text-gray-500"
                                  disabled={isSubmitting}
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                              </div>
                              <p className="font-bold text-white text-sm">₹{item.price * item.quantity}</p>
                            </div>
                          </div>
                        </div>
                        
                        {item.note && (
                          <div className="mt-3 text-[10px] text-gray-500 bg-black/20 px-3 py-2 rounded-lg italic border border-white/5 flex items-center gap-2">
                             <div className="w-1 h-1 rounded-full bg-[#D4FF00]" />
                             {item.note}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            <div className="p-5 border-t border-white/10 bg-[#0A0A0A] shadow-[0_-10px_20px_rgba(0,0,0,0.4)]">
              <div className="space-y-1.5 mb-5 px-1">
                {discount > 0 && (
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="text-gray-500 font-mono uppercase tracking-widest">Gross Total</span>
                    <span className="text-gray-400">₹{totalPrice}</span>
                  </div>
                )}
                {discount > 0 && (
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="text-[#D4FF00]/80 font-mono uppercase tracking-widest">Promo Applied</span>
                    <span className="text-[#D4FF00] font-bold">-₹{discount}</span>
                  </div>
                )}
                <div className="flex justify-between items-center pt-1.5">
                  <span className="text-gray-500 font-mono uppercase text-[10px] tracking-widest">Final Amount</span>
                  <div className="flex items-baseline gap-1">
                     <span className="text-white text-[10px] font-mono mb-1">₹</span>
                     <span className="text-2xl font-display text-white tracking-widest">{finalPrice}</span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2.5">
                {checkoutError && <p className="text-red-400 text-[10px] font-mono text-center mb-1">{checkoutError}</p>}
                
                <motion.button
                  whileHover={{ scale: items.length > 0 && !isSubmitting ? 1.01 : 1 }}
                  whileTap={{ scale: items.length > 0 && !isSubmitting ? 0.99 : 1 }}
                  onClick={handleCheckout}
                  disabled={items.length === 0 || isSubmitting}
                  className="w-full bg-[#D4FF00] hover:bg-[#B8E600] disabled:bg-[#D4FF00]/20 disabled:text-gray-600 text-black font-bold py-4 rounded-[1.25rem] flex items-center justify-center gap-2 transition-all shadow-[0_5px_15px_rgba(212,255,0,0.2)] hover:shadow-[0_8px_25px_rgba(212,255,0,0.3)] text-xs uppercase tracking-[0.2em]"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>Checkout via WHATSAPP <ArrowRight className="w-4 h-4" /></>
                  )}
                </motion.button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
