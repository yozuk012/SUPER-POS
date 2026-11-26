'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { markOnboardingCompleted } from '@/lib/onboarding';
import { observeAuthSession, signOutSession } from '@/services/auth/session';
import { AuthContext } from '@/hooks/auth/useAuth';

export default function AuthProvider({ children }) {
  const router = useRouter();
  const [session, setSession] = useState({ user: null, merchant: null, loading: true, error: null });
  const observer = useRef(null);

  useEffect(() => {
    observer.current = observeAuthSession(supabase, setSession);
    return () => { observer.current.unsubscribe(); observer.current = null; };
  }, []);
  const refreshMerchant = useCallback(() => observer.current?.refreshMerchant(), []);

  const logout = useCallback(async () => {
    setSession(previous => ({ ...previous, loading: true, error: null }));
    try {
      await signOutSession(supabase, window.localStorage);
      markOnboardingCompleted();
      setSession({ user: null, merchant: null, loading: false, error: null });
      router.push('/auth/login');
    } catch (error) {
      setSession(previous => ({ ...previous, loading: false, error: error.message }));
    }
  }, [router]);

  const value = useMemo(() => ({ ...session, logout, refreshMerchant, isAuthenticated: !!session.user }), [session, logout, refreshMerchant]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
