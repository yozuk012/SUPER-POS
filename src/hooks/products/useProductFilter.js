'use client';

import { useState, useEffect, useCallback } from 'react';

const DEFAULT_ITEMS_PER_PAGE = 10;

/**
 * Hook untuk mengelola state filter dan paginasi produk.
 * Bertanggung jawab atas: search, kategori, channel, status, dan halaman aktif.
 * Tidak melakukan fetch data (tanggung jawab useProductData).
 * 
 * @param {Object} [options]
 * @param {number} [options.itemsPerPage=10] - Jumlah item per halaman.
 * @returns {Object} State filter, setter, dan helper paginasi.
 */
export function useProductFilter({ itemsPerPage = DEFAULT_ITEMS_PER_PAGE } = {}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterChannel, setFilterChannel] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  // ==========================================
  // 1. AUTO-RESET HALAMAN SAAT FILTER BERUBAH
  // ==========================================
  // Setiap kali filter/search berubah, kita kembali ke halaman 1
  // agar user tidak terjebak di halaman kosong (misal: hasil filter < halaman saat ini).
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterCategory, filterChannel, filterStatus]);

  // ==========================================
  // 2. HANDLER FILTER
  // ==========================================
  const handleSearchChange = useCallback((value) => {
    setSearchQuery(value || '');
  }, []);

  const handleCategoryChange = useCallback((value) => {
    setFilterCategory(value || 'all');
  }, []);

  const handleChannelChange = useCallback((value) => {
    setFilterChannel(value || 'all');
  }, []);

  const handleStatusChange = useCallback((value) => {
    setFilterStatus(value || 'all');
  }, []);

  const handlePageChange = useCallback((page) => {
    const safePage = Math.max(1, Number(page) || 1);
    setCurrentPage(safePage);
  }, []);

  // ==========================================
  // 3. RESET SEMUA FILTER
  // ==========================================
  const resetFilters = useCallback(() => {
    setSearchQuery('');
    setFilterCategory('all');
    setFilterChannel('all');
    setFilterStatus('all');
    setCurrentPage(1);
  }, []);

  // ==========================================
  // 4. DERIVED STATE (untuk UI pagination)
  // ==========================================
  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    filterCategory !== 'all' ||
    filterChannel !== 'all' ||
    filterStatus !== 'all';

  return {
    // State
    searchQuery,
    filterCategory,
    filterChannel,
    filterStatus,
    currentPage,
    itemsPerPage,

    // Setters
    setSearchQuery: handleSearchChange,
    setFilterCategory: handleCategoryChange,
    setFilterChannel: handleChannelChange,
    setFilterStatus: handleStatusChange,
    setCurrentPage: handlePageChange,

    // Actions
    resetFilters,

    // Derived
    hasActiveFilters,
  };
}