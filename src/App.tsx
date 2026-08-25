/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { BrowserRouter, HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import MenuPage from './pages/MenuPage';
import LoginPage from './pages/LoginPage';
import ProfilePage from './pages/ProfilePage';
import SubscriptionsPage from './pages/SubscriptionsPage';
import OrderSuccessPage from './pages/OrderSuccessPage';
import PrivacyPage from './pages/PrivacyPage';
import TermsPage from './pages/TermsPage';
import RefundsPage from './pages/RefundsPage';
import { supabase } from './lib/supabase';
import type { Session } from '@supabase/supabase-js';
import { useCart } from './context/CartContext';

const isElectron = typeof window !== 'undefined' && navigator.userAgent.toLowerCase().includes('electron');
const Router = isElectron ? HashRouter : BrowserRouter;

function ProfileRoute({ session }: { session: Session | null }) {
  const { tourStep } = useCart();
  if (session) {
    return <ProfilePage session={session} />;
  }
  if (tourStep !== null) {
    const tourGuestSession = {
      user: {
        id: 'tour-guest-athlete',
        email: 'athlete@wheyo.fit',
        user_metadata: { full_name: 'Guest Athlete' }
      }
    } as unknown as Session;
    return <ProfilePage session={tourGuestSession} />;
  }
  return <Navigate to="/login" replace />;
}

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkSession = () => {
      const getValidLocalMock = () => {
        const localMock = localStorage.getItem('mock_session');
        if (localMock) {
          try {
            const parsed = JSON.parse(localMock);
            if (parsed?.user?.id === 'tour-guest-athlete') {
              localStorage.removeItem('mock_session');
              return null;
            }
            return parsed;
          } catch {
            localStorage.removeItem('mock_session');
            return null;
          }
        }
        return null;
      };

      if (supabase) {
        supabase.auth.getSession().then(({ data: { session } }) => {
          if (session) {
            setSession(session);
          } else {
            setSession(getValidLocalMock());
          }
          setLoading(false);
        });
      } else {
        setSession(getValidLocalMock());
        setLoading(false);
      }
    };

    checkSession();

    // Listen for mock logins page wide
    window.addEventListener('mock-auth-change', checkSession);

    if (supabase) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session) {
          setSession(session);
        } else {
          const localMock = localStorage.getItem('mock_session');
          if (localMock) {
            try {
              const parsed = JSON.parse(localMock);
              if (parsed?.user?.id === 'tour-guest-athlete') {
                localStorage.removeItem('mock_session');
                setSession(null);
              } else {
                setSession(parsed);
              }
            } catch {
              localStorage.removeItem('mock_session');
              setSession(null);
            }
          } else {
            setSession(null);
          }
        }
      });
      return () => {
        subscription.unsubscribe();
        window.removeEventListener('mock-auth-change', checkSession);
      };
    }

    return () => {
      window.removeEventListener('mock-auth-change', checkSession);
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#D4FF00] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout session={session} />}>
          <Route index element={<MenuPage session={session} />} />
          <Route path="menu" element={<Navigate to="/" replace />} />
          <Route path="login" element={session ? <Navigate to="/profile" replace /> : <LoginPage />} />
          <Route 
            path="profile" 
            element={<ProfileRoute session={session} />} 
          />
          <Route path="subscriptions" element={<SubscriptionsPage session={session} />} />
          <Route path="order-success" element={<OrderSuccessPage />} />
          <Route path="privacy" element={<PrivacyPage />} />
          <Route path="terms" element={<TermsPage />} />
          <Route path="refunds" element={<RefundsPage />} />
        </Route>
      </Routes>
    </Router>
  );
}
