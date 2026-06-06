/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { BrowserRouter, HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import MenuPage from './pages/MenuPage';
import LoginPage from './pages/LoginPage';
import ProfilePage from './pages/ProfilePage';
import OrderSuccessPage from './pages/OrderSuccessPage';
import { supabase } from './lib/supabase';
import type { Session } from '@supabase/supabase-js';

const isElectron = typeof window !== 'undefined' && navigator.userAgent.toLowerCase().includes('electron');
const Router = isElectron ? HashRouter : BrowserRouter;

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkSession = () => {
      if (supabase) {
        supabase.auth.getSession().then(({ data: { session } }) => {
          if (session) {
            setSession(session);
          } else {
            const localMock = localStorage.getItem('mock_session');
            if (localMock) {
              setSession(JSON.parse(localMock));
            } else {
              setSession(null);
            }
          }
          setLoading(false);
        });
      } else {
        const localMock = localStorage.getItem('mock_session');
        if (localMock) {
          setSession(JSON.parse(localMock));
        } else {
          setSession(null);
        }
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
            setSession(JSON.parse(localMock));
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
          <Route index element={<HomePage />} />
          <Route path="menu" element={<MenuPage session={session} />} />
          <Route path="login" element={session ? <Navigate to="/profile" replace /> : <LoginPage />} />
          <Route 
            path="profile" 
            element={session ? <ProfilePage session={session} /> : <Navigate to="/login" replace />} 
          />
          <Route path="order-success" element={<OrderSuccessPage />} />
        </Route>
      </Routes>
    </Router>
  );
}
