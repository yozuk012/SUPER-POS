'use client';

import { useState, useEffect } from 'react';
import { getOwnerStore } from '@/repositories/stores';
import { useActiveStore } from '@/lib/activeStore';
import { useAuth } from '@/hooks/auth/useAuth';

export function useProfile() {
  const { user, merchant, loading: authLoading } = useAuth();
  const { storeId } = useActiveStore();
  const [storeState, setStoreState] = useState({ id: null, userId: null, data: null });
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    if (!user?.id || !storeId) return;
    getOwnerStore(user.id, storeId).then(data => {
      if (active) { setStoreState({ id: storeId, userId: user.id, data }); setError(null); }
    }).catch(error => {
      if (active) { setError(error.message); setStoreState({ id: storeId, userId: user.id, data: null }); }
    });
    return () => { active = false; };
  }, [user?.id, storeId]);

  const storeReady = String(storeState.id) === String(storeId) && storeState.userId === user?.id;
  const store = storeReady ? storeState.data : null;
  return {
    data: {
      fullName: merchant?.full_name || user?.user_metadata?.full_name || user?.email || 'Pengguna',
      storeName: merchant ? store?.name || merchant.store_name || 'Nama Toko' : user?.user_metadata?.store_name || 'Nama Toko',
      logoUrl: merchant ? store?.logo_url || merchant.store_logo_url || null : null,
    },
    loading: authLoading || Boolean(user && storeId && !storeReady),
    error,
  };
}