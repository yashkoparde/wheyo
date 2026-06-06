import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, Loader2, ArrowRight, User, Phone } from 'lucide-react';
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
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phoneCode, setPhoneCode] = useState('+91');
  const [phoneNum, setPhoneNum] = useState('');
  const [isSignUp, setIsSignUp] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

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
          navigate('/profile');
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

        // Also, try to insert profile row explicitly in public.profiles table
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
          navigate('/profile');
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

        navigate('/profile');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-20 overflow-hidden">
      <div className="bg-[#141414] border border-white/10 rounded-3xl p-8 shadow-2xl relative min-h-[520px]">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={isSignUp ? 'signup' : 'login'}
            initial={{ opacity: 0, x: isSignUp ? 120 : -120, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: isSignUp ? -120 : 120, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 350, damping: 28 }}
            className="w-full"
          >
            <div className="text-center mb-8">
              <h1 className="text-3xl font-display uppercase tracking-tight mb-2">
                {isSignUp ? 'Join the' : 'Welcome'} <span className="text-[#D4FF00]">Relentless</span>
              </h1>
              <p className="text-gray-500 text-sm font-mono uppercase leading-relaxed">
                {isSignUp ? 'Create your profile to track gains' : 'Sign in to access your fuel history'}
              </p>
            </div>

            <form onSubmit={handleAuth} className="space-y-4">
              {isSignUp && (
                <>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                    <input
                      type="text"
                      placeholder="Full Name"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                      className="w-full bg-[#050505] border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-[#D4FF00]/50 transition-colors"
                    />
                  </div>

                  <div className="flex gap-2">
                    <select
                      value={phoneCode}
                      onChange={(e) => setPhoneCode(e.target.value)}
                      className="bg-[#050505] border border-white/10 rounded-2xl py-4 px-3 text-white text-xs focus:outline-none focus:border-[#D4FF00]/50 transition-colors cursor-pointer outline-none w-28 uppercase font-mono"
                    >
                      {COUNTRY_CODES.map((c) => (
                        <option key={c.code} value={c.code} className="bg-[#141414] text-white">
                          {c.code}
                        </option>
                      ))}
                    </select>

                    <div className="relative flex-1">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
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
                        className="w-full bg-[#050505] border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-[#D4FF00]/50 transition-colors font-mono"
                      />
                    </div>
                  </div>
                </>
              )}

              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type="email"
                  placeholder="Email Address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full bg-[#050505] border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-[#D4FF00]/50 transition-colors"
                />
              </div>

              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full bg-[#050505] border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-[#D4FF00]/50 transition-colors"
                />
              </div>

              {error && (
                <p className="text-red-400 text-center text-sm font-medium bg-red-400/5 py-2 rounded-lg border border-red-400/10">
                  {error}
                </p>
              )}

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={loading}
                className="w-full bg-[#D4FF00] hover:bg-[#B8E600] text-black font-extrabold py-4 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(212,255,0,0.2)] text-sm tracking-wider uppercase"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    {isSignUp ? 'Create Account' : 'Sign In'} <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </motion.button>
            </form>

            <div className="mt-8 text-center pt-5 border-t border-white/5">
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setIsSignUp(!isSignUp);
                }}
                className="group text-gray-400 hover:text-[#D4FF00] transition-colors font-mono text-xs uppercase"
              >
                {isSignUp ? (
                  <>
                    Already have an account?{' '}
                    <span className="text-[#D4FF00] font-black underline group-hover:text-white transition-all pl-1.5 inline-block">
                      Sign In Now
                    </span>
                  </>
                ) : (
                  <>
                    Don't have an account?{' '}
                    <span className="text-[#D4FF00] font-black underline group-hover:text-white transition-all pl-1.5 inline-block">
                      Sign Up Here
                    </span>
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
