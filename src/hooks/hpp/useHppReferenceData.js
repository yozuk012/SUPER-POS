'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/auth/useAuth';
import { listOwnerStores } from '@/repositories/stores';
import { getRawMaterialsByStoreId } from '@/repositories/rawMaterials';
import { getCategoriesByStoreIds } from '@/repositories/categories';
import { ACTIVE_STORE_EVENT, resolveActiveStore } from '@/lib/activeStore';

/**
 * Hook untuk mengelola data referensi modul HPP Bahan Baku.
 * Bertanggung jawab atas:
 * - Menentukan storeId aktif (dari toko user yang sedang dipilih)
 * - Fetching daftar bahan baku (raw materials) untuk toko aktif
 * - Fetching daftar kategori untuk toko aktif
 * - Reset data saat user berpindah toko (via ACTIVE_STORE_EVENT)
 * 
 * @returns {Object} State data referensi dan fungsi untuk me-refresh data.
 */
export function useHppReferenceData() {
  const { user } = useAuth();

  // ==========================================
  // 1. STATE
  // ==========================================
  const [storeId, setStoreId] = useState(null);
  const [rawMaterials, setRawMaterials] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // ==========================================
  // 2. FETCH DATA REFERENSI
  // ==========================================
  const fetchReferenceData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // 2a. Validasi user
      if (!user?.id) {
        setStoreId(null);
        setRawMaterials([]);
        setCategories([]);
        setIsLoading(false);
        return;
      }

      // 2b. Ambil daftar toko aktif user
      const allStores = await listOwnerStores(user.id, { activeOnly: true });
      const activeStore = resolveActiveStore(allStores);

      if (!activeStore) {
        setStoreId(null);
        setRawMaterials([]);
        setCategories([]);
        setIsLoading(false);
        return;
      }

      const currentStoreId = activeStore.id;
      setStoreId(currentStoreId);

      // 2c. Fetch bahan baku & kategori secara paralel untuk performa optimal
      const [materialsData, categoriesData] = await Promise.all([
        getRawMaterialsByStoreId(currentStoreId),
        getCategoriesByStoreIds([currentStoreId]),
      ]);

      setRawMaterials(materialsData || []);
      setCategories(categoriesData || []);
    } catch (err) {
      console.error('Gagal memuat data referensi HPP:', err);
      setError('Gagal memuat data bahan baku atau kategori. Silakan refresh halaman.');
      setRawMaterials([]);
      setCategories([]);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  // ==========================================
  // 3. EFFECTS
  // ==========================================

  // 3a. Fetch data referensi saat pertama kali mount / user berubah
  useEffect(() => {
    fetchReferenceData();
  }, [fetchReferenceData]);

  // 3b. Listen event pergantian toko aktif (dari Sidebar/StoreSwitcher)
  useEffect(() => {
    const handleStoreChange = () => {
      // Reset data referensi sebelum fetch ulang
      setRawMaterials([]);
      setCategories([]);
      setStoreId(null);
      fetchReferenceData();
    };

    window.addEventListener(ACTIVE_STORE_EVENT, handleStoreChange);
    return () => window.removeEventListener(ACTIVE_STORE_EVENT, handleStoreChange);
  }, [fetchReferenceData]);

  // ==========================================
  // 4. RETURN API
  // ==========================================
  return {
    // State
    storeId,
    rawMaterials,
    categories,
    isLoading,
    error,

    // Actions
    fetchReferenceData,

    // Helper
    clearError: () => setError(null),
  };
}