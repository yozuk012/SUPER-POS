'use client';

import { useState, useCallback } from 'react';
import { useHppReferenceData } from './useHppReferenceData';
import { processHppSubmission } from '@/services/hppBahanBaku';

/**
 * Facade Hook untuk modul HPP Bahan Baku.
 * Menggabungkan useHppReferenceData dan service processHppSubmission
 * menjadi satu API yang bersih untuk komponen UI.
 * 
 * Bertanggung jawab atas:
 * - Mengorkestrasi data referensi (bahan baku & kategori) via useHppReferenceData
 * - Mengelola state UI untuk proses submit (isSubmitting, error submit)
 * - Mendelegasikan proses penyimpanan ke service layer
 * - Mengekspos API yang backward-compatible dengan hook lama
 * 
 * @returns {Object} State dan fungsi untuk modul HPP Bahan Baku.
 */
export function useHppBahanBaku() {
  // ==========================================
  // 1. DATA REFERENSI (dari hook kecil)
  // ==========================================
  const {
    storeId,
    rawMaterials,
    categories,
    isLoading,
    error: referenceError,
    fetchReferenceData,
    clearError: clearReferenceError,
  } = useHppReferenceData();

  // ==========================================
  // 2. STATE UI SUBMIT
  // ==========================================
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  // Gabungkan error dari referensi dan submit untuk kemudahan UI
  const error = submitError || referenceError;

  // ==========================================
  // 3. SUBMIT HANDLER
  // ==========================================
  /**
   * Memproses form HPP Bahan Baku.
   * Mendelegasikan seluruh logika bisnis ke service layer.
   * 
   * @param {Object} formData - Data dari form HPP (namaProduk, hppPerProduk, dll).
   * @returns {Promise<{ success: boolean, message: string, productId?: number, recipeId?: number }>}
   */
  const submitHPP = useCallback(async (formData) => {
    if (!storeId) {
      const errorMsg = 'Toko aktif tidak ditemukan. Silakan pilih toko terlebih dahulu.';
      setSubmitError(errorMsg);
      return { success: false, message: errorMsg };
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // Delegasikan seluruh proses ke service layer
      const result = await processHppSubmission(formData, storeId);

      // Setelah submit berhasil, refresh data referensi (terutama bahan baku)
      // karena mungkin ada bahan baku baru yang ditambahkan atau stok berubah
      await fetchReferenceData();

      return result;
    } catch (err) {
      console.error('Submit HPP error:', err);
      const errorMessage = err.message || 'Terjadi kesalahan saat menyimpan data HPP.';
      setSubmitError(errorMessage);
      return {
        success: false,
        message: errorMessage,
      };
    } finally {
      setIsSubmitting(false);
    }
  }, [storeId, fetchReferenceData]);

  // ==========================================
  // 4. HELPER
  // ==========================================
  const clearError = useCallback(() => {
    setSubmitError(null);
    clearReferenceError();
  }, [clearReferenceError]);

  // ==========================================
  // 5. RETURN API (backward-compatible)
  // ==========================================
  return {
    // Data referensi
    storeId,
    rawMaterials,
    categories,

    // State UI
    isLoading,
    isSubmitting,
    error,

    // Actions
    submitHPP,

    // Helper
    clearError,
    fetchReferenceData,
  };
}

export default useHppBahanBaku;