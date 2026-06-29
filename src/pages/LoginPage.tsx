import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock, Loader2, ArrowRight, User, Phone, AlertCircle, Dumbbell } from 'lucide-react';
import { supabase } from '../lib/supabase';

const COUNTRY_CODES = [
  { code: '+91', name: 'IN (+91)' },
  { code: '+1', name: 'US/CA (+1)' },
  { code: '+44', name: 'UK (+44)' },
  { code: '+971', name: 'UAE (+971)' },
  { code: '+61', name: 'AU (+61)' },
  { code: '+65', name: 'SG (+65)' },
  { code: '+49', name: 'DE (+49)' },
  { code: '+966', name: 'SA (+966)' },
  { code: '+81', name: 'JP (+81)' },
];

export default function LoginPage() {
  const location = useLocation();
  const navigate = useNavigate();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phoneCode, setPhoneCode] = useState('+91');
  const [phoneNum, setPhoneNum] = useState('');
  const [isSignUp, setIsSignUp] = useState(location.state?.isSignUp ?? false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const returnTo = location.state?.returnTo || '/profile';
  const displayMessage = location.state?.message || null;

  const triggerHaptic = (type: 'light' | 'medium' | 'success' = 'light') => {
    try {
      if (navigator.vibrate) {
        if (type === 'light') navigator.vibrate(10);
        else if (type === 'medium') navigator.vibrate(18);
        else if (type === 'success') navigator.vibrate([15, 30, 15]);
      }
    } catch {
      // Safe catch
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    triggerHaptic('medium');

    const useMockAuth = !supabase;

    try {
      if (isSignUp) {
        if (phoneNum.length !== 10) {
          throw new Error('Please enter exactly 10 digits for your phone number.');
        }
        const fullPhone = phoneCode + phoneNum;
        
        if (useMockAuth) {
          const mockUser = {
            id: 'mock-user-' + Math.random().toString(36).substring(2, 9),
            aud: 'authenticated',
            role: 'authenticated',
            email: email,
            user_metadata: {
              full_name: fullName,
              phone: fullPhone
            }
          };
          const mockSession = {
            access_token: 'mock-token',
            token_type: 'bearer',
            expires_in: 3600,
            refresh_token: 'mock-refresh',
            user: mockUser
          };
          
          localStorage.setItem('mock_session', JSON.stringify(mockSession));
          localStorage.setItem('customer_name', fullName);
          localStorage.setItem('customer_phone', fullPhone);
          
          window.dispatchEvent(new Event('mock-auth-change'));
          triggerHaptic('success');
          navigate(returnTo);
          return;
        }

        const { data: signUpData, error } = await supabase!.auth.signUp({
          email,
          password,
          options: {
            data: { 
              full_name: fullName,
              phone: fullPhone
            }
          }
        });
        if (error) throw error;

        // Populate local storage
        localStorage.setItem('customer_name', fullName);
        localStorage.setItem('customer_phone', fullPhone);

        // Try to insert profile row explicitly in public.profiles table
        if (signUpData?.user) {
          try {
            await supabase!.from('profiles').upsert({
              id: signUpData.user.id,
              full_name: fullName,
              phone: fullPhone
            });
          } catch (profileErr) {
            console.error('Non-blocking profiles insert error:', profileErr);
          }
        }

        setError('Check your email for confirmation link!');
        triggerHaptic('success');
      } else {
        if (useMockAuth) {
          const mockUser = {
            id: 'mock-user-1',
            aud: 'authenticated',
            role: 'authenticated',
            email: email,
            user_metadata: {
              full_name: localStorage.getItem('customer_name') || email.split('@')[0],
              phone: localStorage.getItem('customer_phone') || '+919999999999'
            }
          };
          const mockSession = {
            access_token: 'mock-token',
            token_type: 'bearer',
            expires_in: 3600,
            refresh_token: 'mock-refresh',
            user: mockUser
          };
          
          localStorage.setItem('mock_session', JSON.stringify(mockSession));
          if (!localStorage.getItem('customer_name')) {
            localStorage.setItem('customer_name', mockUser.user_metadata.full_name);
          }
          if (!localStorage.getItem('customer_phone')) {
            localStorage.setItem('customer_phone', mockUser.user_metadata.phone);
          }
          
          window.dispatchEvent(new Event('mock-auth-change'));
          triggerHaptic('success');
          navigate(returnTo);
          return;
        }

        const { data: signInData, error } = await supabase!.auth.signInWithPassword({
          email,
          password
        });
        if (error) throw error;

        // Fetch profile to set in localStorage
        if (signInData?.user) {
          try {
            const { data: prof } = await supabase!
              .from('profiles')
              .select('*')
              .eq('id', signInData.user.id)
              .single();
            
            if (prof) {
              localStorage.setItem('customer_name', prof.full_name || '');
              localStorage.setItem('customer_phone', prof.phone || '');
            } else {
              localStorage.setItem('customer_name', signInData.user.user_metadata?.full_name || '');
              localStorage.setItem('customer_phone', signInData.user.user_metadata?.phone || '');
            }
          } catch (profileErr) {
            console.error('Non-blocking profiles fetch error:', profileErr);
            localStorage.setItem('customer_name', signInData.user.user_metadata?.full_name || '');
            localStorage.setItem('customer_phone', signInData.user.user_metadata?.phone || '');
          }
        }

        triggerHaptic('success');
        navigate(returnTo);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070709] text-white flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden">
      {/* Absolute Ambient Background Lights */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] sm:w-[500px] h-[350px] sm:h-[500px] bg-[#D4FF00]/5 rounded-full blur-[120px] pointer-events-none" />
      
      {/* Alert Banner */}
      <AnimatePresence>
        {displayMessage && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="w-full max-w-md bg-[#D4FF00]/10 border border-[#D4FF00]/20 text-[#D4FF00] p-4 rounded-2xl flex items-start gap-3 mb-6 shadow-xl"
          >
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <p className="text-xs font-mono leading-relaxed uppercase tracking-wide">{displayMessage}</p>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Simplistic, Highly Polished Centered Card */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 120 }}
        className="w-full max-w-[420px] bg-[#0A0A0C] border border-white/5 rounded-3xl p-6 sm:p-8 shadow-[0_24px_60px_rgba(0,0,0,0.8)] relative z-10"
      >
        {/* App Branding Header */}
        <div className="flex flex-col items-center mb-8 text-center">
          <motion.div 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="w-11 h-11 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center mb-4 text-[#D4FF00] shadow-md cursor-pointer"
          >
            <Dumbbell className="w-5 h-5" />
          </motion.div>
          <h1 className="text-xl font-display font-black tracking-widest text-white uppercase leading-none">
            WHEYO
          </h1>
          <p className="text-[10px] font-mono tracking-widest text-zinc-500 uppercase mt-1">
            Fuel your performance
          </p>
        </div>

        {/* Content Wrapper for dynamic changes */}
        <AnimatePresence mode="wait">
          <motion.div
            key={isSignUp ? 'signup' : 'login'}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            {/* Simple Form Titles */}
            <div className="text-center">
              <h2 className="text-base font-mono font-bold uppercase tracking-wider text-white">
                {isSignUp ? 'Create Account' : 'Sign In'}
              </h2>
            </div>

            <form onSubmit={handleAuth} className="space-y-4">
              {isSignUp && (
                <>
                  {/* Full Name input */}
                  <div className="relative group">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within:text-[#D4FF00] transition-colors" />
                    <input
                      type="text"
                      placeholder="Full Name"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                      className="w-full bg-black/40 border border-white/5 rounded-2xl py-3.5 pl-11 pr-4 text-xs font-mono text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#D4FF00]/30 transition-all h-11"
                    />
                  </div>

                  {/* Phone Code and Phone Number combined beautifully */}
                  <div className="flex gap-2.5">
                    <select
                      value={phoneCode}
                      onChange={(e) => setPhoneCode(e.target.value)}
                      className="bg-black/40 border border-white/5 rounded-2xl px-3.5 text-white text-xs focus:outline-none focus:border-[#D4FF00]/30 transition-all cursor-pointer font-mono w-24 h-11"
                    >
                      {COUNTRY_CODES.map((c) => (
                        <option key={c.code} value={c.code} className="bg-zinc-950 text-white">
                          {c.code}
                        </option>
                      ))}
                    </select>

                    <div className="relative flex-1 group">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within:text-[#D4FF00] transition-colors" />
                      <input
                        type="tel"
                        placeholder="WhatsApp (10 digits)"
                        value={phoneNum}
                        onChange={(e) => {
                          const cleaned = e.target.value.replace(/\D/g, '');
                          if (cleaned.length <= 10) {
                            setPhoneNum(cleaned);
                          }
                        }}
                        required
                        className="w-full bg-black/40 border border-white/5 rounded-2xl py-3.5 pl-11 pr-4 text-xs font-mono text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#D4FF00]/30 transition-all h-11"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Email Input */}
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within:text-[#D4FF00] transition-colors" />
                <input
                  type="email"
                  placeholder="Email Address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full bg-black/40 border border-white/5 rounded-2xl py-3.5 pl-11 pr-4 text-xs font-mono text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#D4FF00]/30 transition-all h-11"
                />
              </div>

              {/* Password Input */}
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within:text-[#D4FF00] transition-colors" />
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full bg-black/40 border border-white/5 rounded-2xl py-3.5 pl-11 pr-4 text-xs font-mono text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#D4FF00]/30 transition-all h-11"
                />
              </div>

              {/* Error Box */}
              {error && (
                <motion.p 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-red-400 text-center text-[10.5px] font-mono bg-red-500/5 py-2.5 px-3 rounded-xl border border-red-500/10 uppercase tracking-wide leading-relaxed"
                >
                  {error}
                </motion.p>
              )}

              {/* Primary Action Button */}
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                type="submit"
                disabled={loading}
                className="w-full bg-[#D4FF00] hover:bg-white text-black font-extrabold py-3.5 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-[0_4px_16px_rgba(212,255,0,0.15)] hover:shadow-[0_4px_24px_rgba(212,255,0,0.25)] text-xs tracking-widest uppercase font-mono cursor-pointer h-12"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin text-black" />
                ) : (
                  <>
                    <span>{isSignUp ? 'REGISTER' : 'LOG IN'}</span> 
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </motion.button>
            </form>

            {/* Switch State Link */}
            <div className="text-center pt-3 border-t border-white/5">
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setIsSignUp(!isSignUp);
                  triggerHaptic('light');
                }}
                className="text-zinc-500 hover:text-white transition-colors font-mono text-[10px] uppercase tracking-widest"
              >
                {isSignUp ? (
                  <>
                    ALREADY REGISTERED?{' '}
                    <span className="text-[#D4FF00] font-black underline hover:text-white pl-1">
                      SIGN IN
                    </span>
                  </>
                ) : (
                  <>
                    NEW TO WHEYO?{' '}
                    <span className="text-[#D4FF00] font-black underline hover:text-white pl-1">
                      CREATE ACCOUNT
                    </span>
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
