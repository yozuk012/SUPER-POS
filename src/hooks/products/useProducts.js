'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/auth/useAuth';
import { listOwnerStores } from '@/repositories/stores';
import { ACTIVE_STORE_EVENT, resolveActiveStore } from '@/lib/activeStore';
import { useProductData } from './useProductData';
import { useProductForm } from './useProductForm';
import { useProductFilter } from './useProductFilter';

const ITEMS_PER_PAGE = 10;

/**
 * Facade Hook untuk modul Produk.
 * Menggabungkan useProductData, useProductForm, dan useProductFilter
 * menjadi satu API yang bersih untuk komponen UI.
 * 
 * Bertanggung jawab atas:
 * - Mengelola state `stores` (toko aktif user)
 * - Mendengarkan event pergantian toko aktif (ACTIVE_STORE_EVENT)
 * - Mengorkestrasi pemanggilan fetch saat stores/filter berubah
 * - Mengekspos API yang backward-compatible dengan useProducts lama
 */
export function useProducts() {
  const { user } = useAuth();

  // ==========================================
  // 1. STATE LOKAL: STORES
  // ==========================================
  // State `stores` dikelola di sini karena merupakan konteks global
  // untuk modul produk (bukan tanggung jawab hook kecil manapun).
  const [stores, setStores] = useState([]);
  const [storesLoading, setStoresLoading] = useState(true);

  // ==========================================
  // 2. INISIALISASI HOOK KECIL
  // ==========================================
  const storeIds = stores.map((s) => s.id);
  const defaultStoreId = stores.length > 0 ? stores[0].id : '';

  const {
    products,
    categories,
    totalItems,
    loading: dataLoading,
    error: dataError,
    supportsStockTracking,
    fetchProducts,
    fetchCategories,
    handleSaveProduct,
    handleToggleProductStatus,
    handleToggleStockTracking,
    handleDeleteProduct,
    clearError: clearDataError,
  } = useProductData(storeIds);

  const {
    searchQuery,
    filterCategory,
    filterChannel,
    filterStatus,
    currentPage,
    itemsPerPage,
    setSearchQuery,
    setFilterCategory,
    setFilterChannel,
    setFilterStatus,
    setCurrentPage,
    resetFilters,
    hasActiveFilters,
  } = useProductFilter({ itemsPerPage: ITEMS_PER_PAGE });

  const {
    formData,
    editingId,
    existingImageUrl,
    formError,
    isSubmitting,
    isModalOpen,
    handleChange,
    handleFileChange,
    handleSubmit,
    resetForm,
    startEdit,
    openAddModal,
    openEditModal,
    closeModal,
    clearFormError,
  } = useProductForm({
    defaultStoreId,
    supportsStockTracking,
    handleSaveProduct,
    refetch: () => fetchProducts(buildFiltersObject()),
  });

  // ==========================================
  // 3. HELPER: BANGUN OBJEK FILTER
  // ==========================================
  // Karena `fetchProducts` menerima objek filter, kita perlu
  // menyusun objek ini dari state useProductFilter.
  // Menggunakan closure agar selalu mengambil nilai filter terbaru.
  const buildFiltersObject = useCallback(() => ({
    searchQuery,
    filterCategory,
    filterChannel,
    filterStatus,
    currentPage,
    itemsPerPage,
  }), [searchQuery, filterCategory, filterChannel, filterStatus, currentPage, itemsPerPage]);

  // ==========================================
  // 4. FETCH STORES
  // ==========================================
  const fetchStores = useCallback(async () => {
    if (!user?.id) {
      setStores([]);
      setStoresLoading(false);
      return;
    }

    setStoresLoading(true);
    try {
      const allStores = await listOwnerStores(user.id, { activeOnly: true });
      if (allStores.length > 0) {
        const activeStore = resolveActiveStore(allStores);
        setStores(activeStore ? [activeStore] : []);
      } else {
        setStores([]);
      }
    } catch (err) {
      console.error('Fetch stores error:', err);
      setStores([]);
    } finally {
      setStoresLoading(false);
    }
  }, [user]);

  // ==========================================
  // 5. EFFECTS: SINKRONISASI DATA
  // ==========================================

  // 5a. Fetch stores saat user berubah / pertama kali mount
  useEffect(() => {
    if (user?.id) {
      fetchStores();
    } else {
      setStores([]);
      setStoresLoading(false);
    }
  }, [user, fetchStores]);

  // 5b. Listen event pergantian toko aktif (dari Sidebar/StoreSwitcher)
  useEffect(() => {
    const handleStoreChange = () => {
      // Reset state produk & filter saat toko berganti
      resetFilters();
      fetchStores();
    };

    window.addEventListener(ACTIVE_STORE_EVENT, handleStoreChange);
    return () => window.removeEventListener(ACTIVE_STORE_EVENT, handleStoreChange);
  }, [fetchStores, resetFilters]);

  // 5c. Fetch categories & products saat stores siap
  useEffect(() => {
    if (stores.length > 0) {
      fetchCategories();
      fetchProducts(buildFiltersObject());
    }
  }, [stores]); // eslint-disable-line react-hooks/exhaustive-deps

  // 5d. Re-fetch products saat filter/paginasi berubah
  // (Hanya jika stores sudah siap, agar tidak trigger fetch kosong)
  useEffect(() => {
    if (stores.length > 0) {
      fetchProducts(buildFiltersObject());
    }
  }, [searchQuery, filterCategory, filterChannel, filterStatus, currentPage]); // eslint-disable-line react-hooks/exhaustive-deps

  // ==========================================
  // 6. WRAPPER ACTIONS (backward-compatible)
  // ==========================================
  // Beberapa aksi dari useProductData perlu di-wrap agar
  // setelah berhasil, data produk otomatis di-refresh.

  const toggleProductStatus = useCallback(async (product) => {
    const success = await handleToggleProductStatus(product);
    if (success) {
      fetchProducts(buildFiltersObject());
    }
  }, [handleToggleProductStatus, fetchProducts, buildFiltersObject]);

  const toggleStockTracking = useCallback(async (product) => {
    const success = await handleToggleStockTracking(product);
    if (success) {
      fetchProducts(buildFiltersObject());
    }
  }, [handleToggleStockTracking, fetchProducts, buildFiltersObject]);

  const deleteProduct = useCallback(async (id) => {
    const success = await handleDeleteProduct(id, products);
    if (success) {
      fetchProducts(buildFiltersObject());
    }
  }, [handleDeleteProduct, products, fetchProducts, buildFiltersObject]);

  // Gabungkan error dari data dan form untuk kemudahan UI
  const error = dataError || formError;
  const loading = storesLoading || dataLoading;

  // ==========================================
  // 7. RETURN API (backward-compatible)
  // ==========================================
  return {
    // Data
    stores,
    categories,
    products,
    loading,
    error,

    // Form state
    formData,
    editingId,
    isSubmitting,
    isModalOpen,

    // Filter state
    searchQuery,
    setSearchQuery,
    filterCategory,
    setFilterCategory,
    filterChannel,
    setFilterChannel,
    filterStatus,
    setFilterStatus,
    currentPage,
    setCurrentPage,
    totalItems,
    itemsPerPage,
    hasActiveFilters,

    // Actions
    resetFilters,
    handleChange,
    handleFileChange,
    handleSubmit,
    deleteProduct,
    toggleProductStatus,
    toggleStockTracking,
    supportsStockTracking,

    // Modal control
    openAddModal,
    openEditModal,
    closeModal,

    // Refetch manual (untuk keperluan eksternal)
    refetch: () => fetchProducts(buildFiltersObject()),
    fetchCategories,

    // Helper untuk clear error
    clearError: () => {
      clearDataError();
      clearFormError();
    },
  };
}

export default useProducts;