'use client';

import { useEffect } from 'react';
import { useActiveStore, resolveActiveStore, setActiveStoreId } from '@/lib/activeStore';
import { useOwnerStores } from './useOwnerStores';

export function useResolvedActiveStore(userId) {
  const { storeId } = useActiveStore();
  const { stores, loading, error } = useOwnerStores(userId, { activeOnly: true });
  const activeStore = resolveActiveStore(stores, storeId);

  useEffect(() => {
    if (activeStore && String(activeStore.id) !== String(storeId)) setActiveStoreId(activeStore.id);
  }, [activeStore, storeId]);

  return { storeId: activeStore?.id || null, loading, error };
}