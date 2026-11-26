'use client';

import { useCallback, useEffect, useState } from 'react';
import { listOwnerStores } from '@/repositories/stores';

export function useOwnerStores(userId, { activeOnly = false, newestFirst = false, enabled = true } = {}) {
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(Boolean(userId && enabled));
  const [error, setError] = useState(null);
  const refresh = useCallback(async () => {
    if (!userId || !enabled) return;
    setLoading(true);
    try {
      setStores(await listOwnerStores(userId, { activeOnly, newestFirst }));
      setError(null);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, [userId, activeOnly, newestFirst, enabled]);

  useEffect(() => {
    let active = true;
    async function load() {
      if (!userId || !enabled) {
        if (active) { setStores([]); setLoading(false); }
        return;
      }
      setLoading(true);
      try {
        const data = await listOwnerStores(userId, { activeOnly, newestFirst });
        if (active) { setStores(data); setError(null); }
      } catch (error) {
        if (active) setError(error.message);
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => { active = false; };
  }, [userId, activeOnly, newestFirst, enabled]);

  return { stores, loading, error, refresh };
}