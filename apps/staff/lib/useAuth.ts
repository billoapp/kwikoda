'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from './supabase';

export function useAuth() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [bar, setBar] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        router.push('/login');
      } else {
        loadUserData(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push('/login');
        return;
      }

      await loadUserData(session.user);
    } catch (error) {
      console.error('Auth check error:', error);
      router.push('/login');
    } finally {
      setLoading(false);
    }
  };

  const loadUserData = async (user: any) => {
    setUser(user);
    
    const barId = user.user_metadata?.bar_id;
    if (barId) {
      const { data: barData } = await supabase
        .from('bars')
        .select('*')
        .eq('id', barId)
        .single();
      
      setBar(barData);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  return { user, bar, loading, signOut };
}