'use client';

import { useState, useCallback, useEffect } from 'react';
import { useConvert } from '@/hooks/useConvertImages'; // Sesuaikan path jika berbeda
import { 
  validateProductForm, 
  isUnsafeProductName, 
  generateSkuFromName, 
  generateDefaultSku,
  parseNumber,
  parseDecimal
} from '@/lib/productValidation';

const MISSING_STOCK_COLUMN_MESSAGE =
  'Fitur "Stok Tanpa Batas" belum tersedia karena kolom `track_stock` belum ada di tabel products.\n\n' +
  'Jalankan SQL migrasi pada src/blueprint/DATABASE.MD, lalu simpan ulang produk.';

const INITIAL_FORM_DATA = {
  store_id: '',
  category_id: '',
  name: '',
  sku: '',
  unit: 'pack',
  base_price: '0',
  hpp: '0',
  discount_pct: '0',
  stock: '0',
  track_stock: true,
  is_active: true,
  is_online: false,
  online_markup_pct: '0',
  image_file: null,
  image_preview: null,
};

/**
 * Hook untuk mengelola state form, validasi, dan submit produk.
 * 
 * @param {Object} params
 * @param {string|number} [params.defaultStoreId] - ID toko default untuk auto-select.
 * @param {boolean} params.supportsStockTracking - Apakah DB mendukung kolom track_stock.
 * @param {Function} params.handleSaveProduct - Fungsi dari useProductData untuk menyimpan data.
 * @param {Function} [params.refetch] - Fungsi opsional untuk refresh data setelah berhasil simpan.
 * @returns {Object} State form dan handler UI.
 */
export function useProductForm({ 
  defaultStoreId = '', 
  supportsStockTracking = true, 
  handleSaveProduct, 
  refetch 
}) {
  const { convertToWebP } = useConvert();

  const [formData, setFormData] = useState(INITIAL_FORM_DATA);
  const [editingId, setEditingId] = useState(null);
  const [existingImageUrl, setExistingImageUrl] = useState(null);
  const [formError, setFormError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // ==========================================
  // 1. FORM LIFECYCLE & RESET
  // ==========================================
  
  const resetForm = useCallback(() => {
    setFormData({
      ...INITIAL_FORM_DATA,
      store_id: defaultStoreId ? String(defaultStoreId) : '',
      sku: generateDefaultSku(),
    });
    setEditingId(null);
    setExistingImageUrl(null);
    setFormError(null);
  }, [defaultStoreId]);

  // Reset form saat defaultStoreId berubah (misal: user switch toko)
  useEffect(() => {
    if (defaultStoreId && !editingId && !isModalOpen) {
      setFormData(prev => ({ ...prev, store_id: String(defaultStoreId) }));
    }
  }, [defaultStoreId, editingId, isModalOpen]);

  const startEdit = useCallback((product) => {
    setEditingId(product.id);
    setExistingImageUrl(product.image_url || null);

    setFormData({
      store_id: product.store_id ? String(product.store_id) : '',
      category_id: product.category_id ? String(product.category_id) : '',
      name: product.name,
      sku: product.sku || '',
      unit: product.unit || 'pack',
      base_price: String(product.base_price || 0),
      hpp: String(product.hpp || 0),
      discount_pct: String(product.discount_pct || 0),
      is_online: product.has_online_price || false,
      online_markup_pct: String(product.online_markup_pct || 0),
      stock: String(product.stock || 0),
      track_stock: product.track_stock !== false,
      is_active: product.is_active !== false,
      image_file: null,
      image_preview: product.image_url || null,
    });
    setFormError(null);
  }, []);

  const openAddModal = useCallback(() => {
    resetForm();
    setIsModalOpen(true);
  }, [resetForm]);

  const openEditModal = useCallback((product) => {
    startEdit(product);
    setIsModalOpen(true);
  }, [startEdit]);

  const closeModal = useCallback(() => {
    resetForm();
    setIsModalOpen(false);
  }, [resetForm]);

  // ==========================================
  // 2. INPUT HANDLERS
  // ==========================================

  const handleChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;

    // Validasi real-time untuk nama produk (XSS/SQLi)
    if (name === 'name') {
      if (isUnsafeProductName(value)) {
        setFormError('Nama produk tidak boleh berisi script, tag HTML, atau perintah SQL.');
        return; // Jangan update state jika tidak aman
      }
      setFormError(null); // Clear error jika input aman
    }

    setFormData((prev) => {
      const finalValue = type === 'checkbox' ? checked : value;
      const updates = { [name]: finalValue };

      // Auto-generate SKU saat nama berubah (hanya untuk produk baru)
      if (name === 'name' && !editingId) {
        updates.sku = generateSkuFromName(finalValue, prev.sku);
      }

      return { ...prev, ...updates };
    });
  }, [editingId]);

  const handleFileChange = useCallback(async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setFormError('Ukuran foto maksimal 2MB');
      e.target.value = ''; // Reset input file
      return;
    }

    setFormError('Sedang mengoptimalkan gambar...');
    const conversionResult = await convertToWebP(file, 0.8);

    if (!conversionResult.success) {
      setFormError(conversionResult.error || 'Gagal mengoptimalkan gambar');
      e.target.value = '';
      return;
    }

    setFormData((prev) => ({
      ...prev,
      image_file: conversionResult.file,
      image_preview: URL.createObjectURL(conversionResult.file),
    }));
    setFormError(null);
  }, [convertToWebP]);

  // ==========================================
  // 3. SUBMIT HANDLER
  // ==========================================

  const handleSubmit = useCallback(async (e) => {
    if (e) e.preventDefault();

    // 1. Validasi form lengkap menggunakan utility
    const validation = validateProductForm(formData, { supportsStockTracking });
    if (!validation.valid) {
      setFormError(validation.message);
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    try {
      // 2. Siapkan payload yang sesuai dengan ekspektasi service
      const stockTracked = formData.track_stock !== false;
      const payload = {
        formData,
        existingImageUrl,
        editingId,
        stockVal: stockTracked ? parseNumber(formData.stock) : 0,
        basePrice: parseDecimal(formData.base_price),
        discountPct: parseDecimal(formData.discount_pct),
        onlineMarkupPct: parseDecimal(formData.online_markup_pct),
        stockTracked,
        supportsStockTracking,
      };

      // 3. Delegasikan penyimpanan ke useProductData
      const result = await handleSaveProduct(payload);

      if (result.success) {
        if (result.needsMigrationAlert) {
          alert(MISSING_STOCK_COLUMN_MESSAGE);
        }
        closeModal();
        if (typeof refetch === 'function') {
          refetch();
        }
      } else {
        setFormError(result.error || 'Terjadi kesalahan saat menyimpan produk.');
      }
    } catch (err) {
      console.error('Submit product error:', err);
      setFormError(err.message || 'Terjadi kesalahan saat menyimpan produk.');
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, existingImageUrl, editingId, supportsStockTracking, handleSaveProduct, refetch, closeModal]);

  return {
    // State
    formData,
    editingId,
    existingImageUrl,
    formError,
    isSubmitting,
    isModalOpen,

    // Actions
    handleChange,
    handleFileChange,
    handleSubmit,
    resetForm,
    startEdit,
    openAddModal,
    openEditModal,
    closeModal,
    
    // Helper untuk clear error manual dari UI
    clearFormError: () => setFormError(null),
  };
}