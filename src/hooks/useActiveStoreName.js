/**
 * Custom hook untuk mendapatkan nama toko yang sedang aktif
 */

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { ACTIVE_STORE_EVENT, resolveActiveStore } from '@/lib/activeStore';

/**
 * Hook untuk mendapatkan informasi toko yang sedang aktif
 * @param {string} userId - ID user yang sedang login
 * @param {string} storeId - ID toko aktif (opsional, jika sudah ada)
 * @returns {Object} { storeName, storeLogo, loading, error }
 */
export function useActiveStoreName(userId, storeId = null) {
  const [storeName, setStoreName] = useState('');
  const [storeLogo, setStoreLogo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const fetchActiveStoreInfo = async () => {
      if (!userId && !storeId) {
        if (isMounted) {
          setStoreName('');
          setStoreLogo(null);
          setLoading(false);
        }
        return;
      }

      try {
        setLoading(true);
        setError(null);

        let query = supabase
          .from('stores')
          .select('id, name, logo_url, is_active');

        // Jika storeId sudah ada, langsung ambil berdasarkan id
        if (storeId) {
          query = query.eq('id', storeId).maybeSingle();
          const { data, error: storeError } = await query;

          if (storeError) throw storeError;

          if (isMounted) {
            setStoreName(data?.name || '');
            setStoreLogo(data?.logo_url || null);
          }
        } else {
          // Jika tidak ada storeId, ambil berdasarkan userId
          query = query.eq('user_id', userId).eq('is_active', true);
          const { data: stores, error: storeError } = await query;

          if (storeError) throw storeError;

          const activeStore = resolveActiveStore(stores);
          if (isMounted) {
            setStoreName(activeStore?.name || '');
            setStoreLogo(activeStore?.logo_url || null);
          }
        }
      } catch (err) {
        console.error('Failed to fetch active store info:', err);
        if (isMounted) {
          setError(err.message);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchActiveStoreInfo();

    // Listen to store changes
    const handleStoreChange = () => {
      fetchActiveStoreInfo();
    };

    window.addEventListener(ACTIVE_STORE_EVENT, handleStoreChange);

    return () => {
      isMounted = false;
      window.removeEventListener(ACTIVE_STORE_EVENT, handleStoreChange);
    };
  }, [userId, storeId]);

  return { storeName, storeLogo, loading, error };
}
