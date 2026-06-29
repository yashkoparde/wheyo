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
  const [qualifyingOrdersCount, setQualifyingOrdersCount] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Fetch previous qualifying orders count
  useEffect(() => {
    if (isCartOpen) {
      const fetchOrdersCount = async () => {
        let count = 0;
        try {
          if (supabase) {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
              const { data: ords } = await supabase
                .from('orders')
                .select('final_price, total_price')
                .eq('user_id', session.user.id);
              if (ords) {
                count = ords.filter(o => {
                  const price = Number(o.final_price || o.total_price || 0);
                  return price >= 299;
                }).length;
              }
            }
          }
        } catch (e) {
          console.error("Error fetching orders in cart drawer:", e);
        }

        if (count === 0) {
          try {
            const localOrders = JSON.parse(localStorage.getItem('local_orders') || '[]');
            count = localOrders.filter((o: any) => {
              const price = Number(o.final_price || o.total_price || 0);
              return price >= 299;
            }).length;
          } catch (e) {
            console.error(e);
          }
        }
        setQualifyingOrdersCount(count);
      };

      fetchOrdersCount();
    }
  }, [isCartOpen]);

  // Scroll to top when cart opens
  useEffect(() => {
    if (isCartOpen && scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [isCartOpen]);

  // Load initial receiver details from localStorage or active user profile
  useEffect(() => {
    if (isCartOpen) {
      const savedName = localStorage.getItem('customer_name');
      const savedPhone = localStorage.getItem('customer_phone');
      if (savedName) setCustomerName(savedName);
      if (savedPhone) setCustomerPhone(savedPhone);

      const fetchUserProfile = async () => {
        if (!supabase) return;
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const { data: prof } = await supabase
            .from('profiles')
            .select('full_name, phone')
            .eq('id', session.user.id)
            .single();
          
          if (prof) {
            if (prof.full_name) {
              setCustomerName(prof.full_name);
              localStorage.setItem('customer_name', prof.full_name);
            }
            if (prof.phone) {
              setCustomerPhone(prof.phone);
              localStorage.setItem('customer_phone', prof.phone);
            }
          } else {
            const metaName = session.user.user_metadata?.full_name;
            const metaPhone = session.user.user_metadata?.phone;
            if (metaName) {
              setCustomerName(metaName);
              localStorage.setItem('customer_name', metaName);
            }
            if (metaPhone) {
              setCustomerPhone(metaPhone);
              localStorage.setItem('customer_phone', metaPhone);
            }
          }
        }
      };
      fetchUserProfile();
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

  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);

  const handleApplyCoupon = async () => {
    const code = couponCode.trim().toUpperCase();
    if (!code) {
      setCouponMessage('Please enter a code');
      setCouponType('error');
      setDiscount(0);
      return;
    }

    setIsApplyingCoupon(true);
    setCouponMessage('Checking Code...');
    setCouponType('');

    try {
      if (supabase) {
        // Query database Coupons Table representing the true user data
        const { data: coupon, error } = await supabase
          .from('coupons')
          .select('*')
          .eq('code', code)
          .maybeSingle();

        // Existence Check
        if (error || !coupon) {
          setDiscount(0);
          setCouponMessage("This coupon code doesn't exist.");
          setCouponType('error');
          setIsApplyingCoupon(false);
          return;
        }

        // Status Check
        if (!coupon.is_active) {
          setDiscount(0);
          setCouponMessage("This coupon is no longer active.");
          setCouponType('error');
          setIsApplyingCoupon(false);
          return;
        }

        // Expiry Check
        if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
          setDiscount(0);
          setCouponMessage("This coupon has expired.");
          setCouponType('error');
          setIsApplyingCoupon(false);
          return;
        }

        // Usage Limit Check
        if (coupon.max_uses !== null && typeof coupon.max_uses === 'number' && coupon.times_used >= coupon.max_uses) {
          setDiscount(0);
          setCouponMessage("This coupon is sold out or has reached its maximum usage limit.");
          setCouponType('error');
          setIsApplyingCoupon(false);
          return;
        }

        // Cart Value Criteria Check
        const minVal = Number(coupon.min_order_value || 0);
        if (totalPrice < minVal) {
          setDiscount(0);
          setCouponMessage(`This coupon requires a minimum order value of ₹${minVal}.`);
          setCouponType('error');
          setIsApplyingCoupon(false);
          return;
        }

        // Apply Discount Calculations
        let calculatedDiscount = 0;
        if (coupon.discount_type === 'percentage') {
          calculatedDiscount = totalPrice * (Number(coupon.discount_value) / 100);
        } else {
          calculatedDiscount = Number(coupon.discount_value);
        }

        const discountAmt = Math.floor(calculatedDiscount);
        setDiscount(discountAmt);
        setCouponMessage(`✓ Coupon applied: ₹${discountAmt} off your order of ₹${minVal || totalPrice} or more!`);
        setCouponType('success');
        setIsApplyingCoupon(false);
        return;
      }
    } catch (err) {
      console.error("Coupons DB check error: ", err);
    }

    // Fallback to Env/Hardcoded verification
    if (code === FLAT_COUPON_CODE) {
      setDiscount(FLAT_COUPON_AMOUNT);
      setCouponMessage(`✓ Coupon applied: ₹${FLAT_COUPON_AMOUNT} flat discount applied!`);
      setCouponType('success');
    } else if (code === PERCENT_COUPON_CODE) {
      const discountAmt = Math.floor(totalPrice * (PERCENT_COUPON_AMOUNT / 100));
      setDiscount(discountAmt);
      setCouponMessage(`✓ Coupon applied: ${PERCENT_COUPON_AMOUNT}% discount applied (-₹${discountAmt})!`);
      setCouponType('success');
    } else {
      setDiscount(0);
      setCouponMessage('Invalid or expired coupon code');
      setCouponType('error');
    }
    setIsApplyingCoupon(false);
  };

  const isFifthOrder = qualifyingOrdersCount === 4 && totalPrice >= 299;
  const isTenthOrder = qualifyingOrdersCount === 9 && totalPrice >= 299;

  let loyaltyDiscount = 0;
  let loyaltyMessage = '';
  if (isTenthOrder) {
    loyaltyDiscount = Math.floor(totalPrice * 0.20);
    loyaltyMessage = "🎉 Elite Loyalty: 20% off applied on your 10th order above ₹299!";
  } else if (isFifthOrder) {
    loyaltyDiscount = Math.floor(totalPrice * 0.10);
    loyaltyMessage = "🎉 Milestone Loyalty: 10% off applied on your 5th order above ₹299!";
  }

  const activeDiscount = Math.max(discount, loyaltyDiscount);
  const finalPrice = Math.max(0, totalPrice - activeDiscount);

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
      
      let user: any = null;
      let orderId = Math.floor(1000 + Math.random() * 9000);
      const finalPickupPoint = pickupPoint === 'Other' ? `Other: ${otherPickupPoint}` : pickupPoint;

      if (!supabase) {
        // Save locally to local_orders
        const localOrders = JSON.parse(localStorage.getItem('local_orders') || '[]');
        const todayStr = new Date().toISOString();
        const newOrder = {
          id: orderId,
          user_id: 'mock-user-1',
          customer_name: customerName,
          customer_phone: customerPhone,
          pickup_point: finalPickupPoint,
          items: items,
          total_price: totalPrice,
          discount_amount: activeDiscount,
          final_price: finalPrice,
          status: 'pending',
          created_at: todayStr
        };
        localOrders.unshift(newOrder);
        localStorage.setItem('local_orders', JSON.stringify(localOrders));

        const orderProtein = items.reduce((sum, item) => {
          const itemProtein = Number(item.protein || 0);
          return sum + (itemProtein * item.quantity);
        }, 0);

        // Update local daily macros if there are proteins
        if (orderProtein > 0) {
          const today = new Date().toISOString().split('T')[0];
          const localMacrosStr = localStorage.getItem('local_macros') || '{}';
          const localMacrosMap = JSON.parse(localMacrosStr);
          const currentAmount = Number(localMacrosMap[today] || 0);
          localMacrosMap[today] = currentAmount + orderProtein;
          localStorage.setItem('local_macros', JSON.stringify(localMacrosMap));
        }

        // WhatsApp message trigger
        let message = `*Order #${orderId} - Wheyo Fuel (Demo)*\n`;
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
        
        if (activeDiscount > 0) {
          message += `\n*Subtotal:* ₹${totalPrice}`;
          const label = loyaltyDiscount > 0 ? (isTenthOrder ? "10TH ORDER LOYALTY 20% OFF" : "5TH ORDER LOYALTY 10% OFF") : couponCode.toUpperCase();
          message += `\n*Discount (${label}):* -₹${activeDiscount}`;
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
          finalPrice,
          orderProtein
        };

        clearCart();
        setIsCartOpen(false);
        setCustomerName('');
        setCustomerPhone('');
        setPickupPoint('');

        navigate('/order-success', { state: { orderDetails: sessionDetails } });
        setIsSubmitting(false);
        return;
      }
      
      const { data: userData } = await supabase.auth.getUser();
      user = userData?.user;

      // 1. Save order to Supabase
      let insertPayload: any = {
        user_id: user?.id || null, 
        customer_name: customerName,
        customer_phone: customerPhone,
        pickup_point: finalPickupPoint,
        items: items,
        total_price: totalPrice,
        discount_amount: activeDiscount,
        final_price: finalPrice,
        status: 'pending'
      };

      try {
        const { count, error: countErr } = await supabase
          .from('orders')
          .select('*', { count: 'exact', head: true });
        
        if (!countErr && (count === 0 || count === null)) {
          insertPayload.id = 1;
        }
      } catch (countCheckErr) {
        console.warn('Could not query current orders count:', countCheckErr);
      }

      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert(insertPayload)
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

      orderId = orderData.id;

      // Increment coupon usage count if used in database
      if (discount > 0 && supabase) {
        try {
          const { data: dbCop } = await supabase
            .from('coupons')
            .select('id, times_used')
            .eq('code', couponCode.trim().toUpperCase())
            .maybeSingle();
          
          if (dbCop) {
            await supabase
              .from('coupons')
              .update({ times_used: (dbCop.times_used || 0) + 1 })
              .eq('id', dbCop.id);
          }
        } catch (couponUsgErr) {
          console.warn('Coupon usage increment failed gracefully:', couponUsgErr);
        }
      }

      const orderProtein = items.reduce((sum, item) => {
        const itemProtein = Number(item.protein || 0);
        return sum + (itemProtein * item.quantity);
      }, 0);

      // 1b. Update daily macros if user is logged in
      if (user && orderProtein > 0) {
        const today = new Date().toISOString().split('T')[0];
        
        try {
          // Fetch latest value first to avoid overwriting other updates
          const { data: currentMacro } = await supabase
            .from('daily_macros')
            .select('protein_consumed')
            .eq('user_id', user.id)
            .eq('date', today)
            .maybeSingle();
            
          const currentAmount = Number(currentMacro?.protein_consumed || 0);
          const totalProtein = currentAmount + orderProtein;
          
          await supabase.from('daily_macros').upsert({
            user_id: user.id,
            date: today,
            protein_consumed: totalProtein
          }, { onConflict: 'user_id,date' });
          
          console.log(`Log: Updated daily macros for ${user.id} on ${today}. Added ${orderProtein}g. New Total: ${totalProtein}g.`);
        } catch (macroErr) {
          console.error('Error logging protein from order:', macroErr);
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
      
      if (activeDiscount > 0) {
        message += `\n*Subtotal:* ₹${totalPrice}`;
        const label = loyaltyDiscount > 0 ? (isTenthOrder ? "10TH ORDER LOYALTY 20% OFF" : "5TH ORDER LOYALTY 10% OFF") : couponCode.toUpperCase();
        message += `\n*Discount (${label}):* -₹${activeDiscount}`;
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
        finalPrice,
        orderProtein
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
                    <h3 className="text-[10px] font-mono text-[#D4FF00] uppercase tracking-[0.2em] px-1 font-bold">Receiver Details (WhatsApp Sync)</h3>
                    
                    <div className="grid grid-cols-1 gap-3">
                      {/* Name - Neon highlighted */}
                      <div className="relative group border-2 border-[#D4FF00]/40 hover:border-[#D4FF00] rounded-xl transition-all shadow-[0_0_15px_rgba(212,255,0,0.1)] focus-within:shadow-[0_0_20px_rgba(212,255,0,0.25)] focus-within:border-[#D4FF00] bg-black/40">
                        <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#D4FF00] transition-colors" />
                        <input
                          type="text"
                          placeholder="Full Name"
                          value={customerName}
                          onChange={(e) => {
                            setCustomerName(e.target.value);
                            localStorage.setItem('customer_name', e.target.value);
                          }}
                          disabled={isSubmitting}
                          className="w-full bg-transparent py-3 pl-10 pr-3 text-xs text-white focus:outline-none transition-all font-mono placeholder:text-gray-600"
                        />
                      </div>
                      
                      {/* Phone - Neon highlighted */}
                      <div className="relative group border-2 border-[#D4FF00]/40 hover:border-[#D4FF00] rounded-xl transition-all shadow-[0_0_15px_rgba(212,255,0,0.1)] focus-within:shadow-[0_0_20px_rgba(212,255,0,0.25)] focus-within:border-[#D4FF00] bg-black/40">
                        <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#D4FF00] transition-colors" />
                        <input
                          type="tel"
                          placeholder="WhatsApp Number (of receiver)"
                          value={customerPhone}
                          onChange={(e) => {
                            setCustomerPhone(e.target.value);
                            localStorage.setItem('customer_phone', e.target.value);
                          }}
                          disabled={isSubmitting}
                          className="w-full bg-transparent py-3 pl-10 pr-3 text-xs text-white focus:outline-none transition-all font-mono placeholder:text-gray-600"
                        />
                      </div>

                      {/* Delivery/Pickup Point Selector with Neon Outlining */}
                      
                      {/* Desktop View: Dropdown selection */}
                      <div className="hidden md:block relative group border-2 border-[#D4FF00]/40 hover:border-[#D4FF00] rounded-xl transition-all shadow-[0_0_15px_rgba(212,255,0,0.1)] focus-within:shadow-[0_0_20px_rgba(212,255,0,0.25)] focus-within:border-[#D4FF00] bg-black/40">
                        <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#D4FF00] transition-colors" />
                        <select
                          value={pickupPoint}
                          onChange={(e) => {
                            setPickupPoint(e.target.value);
                            setCheckoutError('');
                            if (e.target.value !== 'Other') setOtherPickupPoint('');
                          }}
                          disabled={isSubmitting}
                          className="w-full bg-transparent py-3.5 pl-10 pr-10 text-xs text-white focus:outline-none transition-all cursor-pointer font-mono appearance-none"
                        >
                          <option value="" disabled className="bg-[#141414] text-gray-500">Select pickup point (computer/tablet)...</option>
                          {PICKUP_POINTS.map(point => (
                            <option key={point} value={point} className="bg-[#141414] text-white py-2">{point}</option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#D4FF00] pointer-events-none" />
                      </div>

                      {/* Mobile View: Selectable Rectangular Cards */}
                      <div className="block md:hidden space-y-2.5">
                        <div className="flex items-center gap-1.5 pl-1">
                          <MapPin className="w-3.5 h-3.5 text-[#D4FF00]" />
                          <label className="text-[10px] font-mono font-bold text-[#D4FF00] uppercase tracking-wider">Select Fuel Station Spot</label>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          {PICKUP_POINTS.map((point) => {
                            const isSelected = pickupPoint === point;
                            return (
                              <button
                                key={point}
                                type="button"
                                onClick={() => {
                                  setPickupPoint(point);
                                  setCheckoutError('');
                                  if (point !== 'Other') setOtherPickupPoint('');
                                }}
                                className={`px-3 py-3 rounded-xl border-2 text-left flex flex-col justify-between h-16 transition-all relative overflow-hidden ${
                                  isSelected
                                    ? 'bg-[#D4FF00]/10 border-[#D4FF00] text-white shadow-[0_0_15px_rgba(212,255,0,0.3)] scale-[1.02]'
                                    : 'bg-black/30 border-[#D4FF00]/10 text-gray-400 hover:border-[#D4FF00]/30 hover:bg-black/60'
                                }`}
                              >
                                <span className={`text-[9px] font-mono font-bold uppercase tracking-wider ${isSelected ? 'text-[#D4FF00]' : 'text-gray-500'}`}>
                                  {point === 'Other' ? 'Custom Spot' : 'Active Station'}
                                </span>
                                <span className="truncate font-display font-black text-[12px] uppercase tracking-wider text-white">
                                  {point}
                                </span>
                                {isSelected && (
                                  <div className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-[#D4FF00] shadow-[0_0_8px_rgba(212,255,0,1)]" />
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <AnimatePresence>
                        {pickupPoint === 'Other' && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="relative group overflow-hidden border-2 border-[#D4FF00]/30 rounded-xl transition-all shadow-[0_0_10px_rgba(212,255,0,0.05)] bg-black/40 mt-1"
                          >
                            <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#D4FF00]" />
                            <input
                              type="text"
                              placeholder="Enter specific pickup location"
                              value={otherPickupPoint}
                              onChange={(e) => setOtherPickupPoint(e.target.value)}
                              disabled={isSubmitting}
                              className="w-full bg-transparent py-3 pl-10 pr-3 text-xs text-white focus:outline-none transition-all font-mono placeholder:text-gray-600"
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
                        disabled={isSubmitting || isApplyingCoupon}
                        className="bg-white/5 hover:bg-white/10 text-white px-3 py-2 rounded-xl text-[10px] font-bold transition-all border border-white/5 uppercase tracking-wider"
                      >
                        {isApplyingCoupon ? '...' : 'Apply'}
                      </button>
                    </div>
                    {couponMessage && (
                      <p className={`text-[9px] font-mono px-1 mt-1 ${couponType === 'success' ? 'text-[#D4FF00]' : 'text-red-400'}`}>
                        {couponMessage}
                      </p>
                    )}
                    {loyaltyMessage && (
                      <div className="mt-2 text-[9px] font-mono px-2 py-1.5 bg-[#D4FF00]/10 border border-[#D4FF00]/20 rounded-xl text-[#D4FF00] animate-pulse">
                        {loyaltyMessage}
                      </div>
                    )}
                  </div>

                  {/* Cart Items */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between px-1">
                      <h3 className="text-[10px] font-mono text-gray-500 uppercase tracking-[0.2em]">Deployment Items ({items.length})</h3>
                    </div>
                    {items.map((item) => {
                      // Derive or estimate macros
                      const proteinVal = item.protein || 0;
                      const caloriesVal = item.calories !== undefined && item.calories > 0 ? item.calories : (proteinVal * 4 + 180);
                      
                      let carbsVal = item.carbs !== undefined && item.carbs > 0 ? item.carbs : 0;
                      let fatsVal = item.fats !== undefined && item.fats > 0 ? item.fats : 0;
                      if (carbsVal === 0 && fatsVal === 0) {
                        const remaining = Math.max(0, caloriesVal - proteinVal * 4);
                        carbsVal = Math.round((remaining * 0.6) / 4);
                        fatsVal = Math.round((remaining * 0.4) / 9);
                      }
                      
                      const isVegVal = item.isVeg !== undefined ? item.isVeg : (
                        item.name.toLowerCase().includes('paneer') || 
                        item.name.toLowerCase().includes('soya') || 
                        item.name.toLowerCase().includes('whey') ||
                        item.name.toLowerCase().includes('shake')
                      );

                      return (
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
                              <div className="flex items-baseline gap-2 mb-1">
                                <span className="text-[#D4FF00] font-bold text-sm">₹{item.price}</span>
                                <span className="text-[10px] text-gray-600 font-mono">PER UNIT</span>
                              </div>
                              
                              {/* Inline display of all required nutritional macros and veg/non-veg status */}
                              <div className="flex flex-wrap items-center gap-1.5 mb-3.5 mt-2">
                                <span className={`inline-flex items-center px-1.5 py-0.5 rounded font-mono text-[8.5px] font-black uppercase leading-none border ${isVegVal ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
                                  {isVegVal ? "VEG" : "NON-VEG"}
                                </span>
                                <span className="inline-flex items-center bg-[#D4FF00]/10 border border-[#D4FF00]/20 px-1.5 py-0.5 rounded font-mono text-[8.5px] text-[#D4FF00] font-black leading-none uppercase whitespace-nowrap">
                                  {proteinVal}G P
                                </span>
                                <span className="inline-flex items-center bg-zinc-900 border border-white/5 px-1.5 py-0.5 rounded font-mono text-[8.5px] text-zinc-300 font-bold leading-none whitespace-nowrap">
                                  {caloriesVal} KCAL
                                </span>
                                <span className="inline-flex items-center bg-indigo-500/10 border border-indigo-500/20 px-1.5 py-0.5 rounded font-mono text-[8.5px] text-indigo-400 font-bold leading-none whitespace-nowrap">
                                  {carbsVal}G C
                                </span>
                                <span className="inline-flex items-center bg-yellow-500/10 border border-yellow-500/20 px-1.5 py-0.5 rounded font-mono text-[8.5px] text-yellow-400 font-bold leading-none whitespace-nowrap">
                                  {fatsVal}G F
                                </span>
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
                      );
                    })}
                  </div>
                </>
              )}
            </div>

            <div className="p-5 border-t border-white/10 bg-[#0A0A0A] shadow-[0_-10px_20px_rgba(0,0,0,0.4)]">
              <div className="space-y-1.5 mb-5 px-1">
                {activeDiscount > 0 && (
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="text-gray-500 font-mono uppercase tracking-widest">Gross Total</span>
                    <span className="text-gray-400">₹{totalPrice}</span>
                  </div>
                )}
                {activeDiscount > 0 && (
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="text-[#D4FF00]/80 font-mono uppercase tracking-widest border-b border-dashed border-[#D4FF00]/20" title={loyaltyMessage || undefined}>
                      {loyaltyDiscount > 0 ? "Loyalty Auto-Discount" : "Promo Applied"}
                    </span>
                    <span className="text-[#D4FF00] font-bold">-₹{activeDiscount}</span>
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
