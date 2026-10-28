'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

// Helper hitung harga online (disamakan dengan productUtils.js)
const calculateOnlinePrice = (basePrice, markupPct) => {
  const base = Number(basePrice) || 0;
  const markup = Number(markupPct) || 0;
  const calculatedPrice = base * (1 + markup / 100);
  return Math.ceil(calculatedPrice / 1000) * 1000;
};

export function useGlobalOnlineMarkup() {
  // ==========================================
  // 1. STATE MANAGEMENT
  // ==========================================
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  
  const [newPercentage, setNewPercentage] = useState('');
  const [selectionMode, setSelectionMode] = useState('online'); // 'online', 'offline', 'all'
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [progress, setProgress] = useState(0);
  
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState([]);

  // ==========================================
  // 2. FETCH PRODUCTS
  // ==========================================
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Ambil semua produk aktif + data online price dari product_prices
      const { data, error: fetchError } = await supabase
        .from('products')
        .select(`
          id,
          name,
          sku,
          base_price,
          hpp,
          online_markup_pct,
          is_active,
          unit,
          product_prices ( channel, price, id )
        `)
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (fetchError) throw fetchError;

      const productsWithCurrentPrice = (data || []).map(product => {
        const prices = product.product_prices || [];
        const onlinePriceData = prices.find(pp => pp.channel === 'online');
        
        const markupPct = product.online_markup_pct || 0;
        // Gunakan harga dari product_prices jika ada, kalau tidak hitung dari markup
        // Jika base_price = 0, gunakan hpp sebagai fallback
        const basePrice = product.base_price || product.hpp || 0;
        const currentOnlinePrice = onlinePriceData 
          ? onlinePriceData.price 
          : calculateOnlinePrice(basePrice, markupPct);
        
        return {
          ...product,
          has_online_price: !!onlinePriceData,
          online_price_id: onlinePriceData?.id || null, // Untuk update nanti
          current_markup_pct: markupPct,
          current_online_price: currentOnlinePrice,
        };
      });

      setProducts(productsWithCurrentPrice);

    } catch (err) {
      console.error('Error fetching products:', err);
      setError('Gagal memuat data produk: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch produk saat mount
    fetchProducts();
  }, [fetchProducts]);

  // ==========================================
  // 3. HANDLE PERCENTAGE INPUT & SELECTION
  // ==========================================
  const handlePercentageChange = (e) => {
    const value = e.target.value;
    const sanitized = value.replace(/[^0-9]/g, '').slice(0, 3);
    setNewPercentage(sanitized);
    setError(null);
    setSuccessMessage('');
    
    if (showPreview) {
      setShowPreview(false);
      setPreviewData([]);
    }
  };

  const handleSelectionChange = (mode) => {
    setSelectionMode(mode);
    setError(null);
    setSuccessMessage('');
    
    if (showPreview) {
      setShowPreview(false);
      setPreviewData([]);
    }
  };

  // ==========================================
  // 4. VALIDASI
  // ==========================================
  const validatePercentage = useCallback(() => {
    const pct = parseFloat(newPercentage);
    if (!newPercentage || newPercentage.trim() === '') return 'Persentase wajib diisi';
    if (isNaN(pct)) return 'Persentase harus berupa angka';
    if (pct < 0) return 'Persentase tidak boleh negatif';
    if (pct > 500) return 'Persentase terlalu besar (maksimal 500%)';
    return null;
  }, [newPercentage]);

  // ==========================================
  // 5. GENERATE PREVIEW
  // ==========================================
  const generatePreview = useCallback(() => {
    const validationError = validatePercentage();
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    const pct = parseFloat(newPercentage);

    // Filter produk berdasarkan selection mode
    let filteredProducts = products;
    if (selectionMode === 'online') {
      filteredProducts = products.filter(p => p.has_online_price);
    } else if (selectionMode === 'offline') {
      filteredProducts = products.filter(p => !p.has_online_price);
    }
    // 'all' -> semua produk

    const preview = filteredProducts.map(product => {
      // Gunakan base_price, jika 0 gunakan hpp sebagai fallback
      const basePrice = product.base_price || product.hpp || 0;
      const newOnlinePrice = calculateOnlinePrice(basePrice, pct);
      const priceDifference = newOnlinePrice - product.current_online_price;
      const priceChangePct = product.current_online_price > 0 
        ? ((newOnlinePrice - product.current_online_price) / product.current_online_price * 100)
        : 0;

      return {
        id: product.id,
        name: product.name,
        sku: product.sku,
        unit: product.unit,
        base_price: product.base_price,
        has_online_price: product.has_online_price,
        current_markup_pct: product.current_markup_pct,
        current_online_price: product.current_online_price,
        new_markup_pct: pct,
        new_online_price: newOnlinePrice,
        price_difference: priceDifference,
        price_change_pct: priceChangePct,
      };
    });

    preview.sort((a, b) => Math.abs(b.price_difference) - Math.abs(a.price_difference));
    setPreviewData(preview);
    setShowPreview(true);
  }, [newPercentage, products, validatePercentage, selectionMode]);

  // ==========================================
  // 6. APPLY GLOBAL MARKUP (FIXED VERSION)
  // ==========================================
  const applyGlobalMarkup = useCallback(async () => {
    const validationError = validatePercentage();
    if (validationError) {
      setError(validationError);
      return;
    }

    const pct = parseFloat(newPercentage);

    // Filter produk berdasarkan selection mode
    let productsToUpdate = products;
    if (selectionMode === 'online') {
      productsToUpdate = products.filter(p => p.has_online_price);
    } else if (selectionMode === 'offline') {
      productsToUpdate = products.filter(p => !p.has_online_price);
    }
    // 'all' -> semua produk

    if (productsToUpdate.length === 0) {
      setError(`Tidak ada produk ${selectionMode === 'online' ? 'online' : selectionMode === 'offline' ? 'offline' : ''} untuk diupdate.`);
      return;
    }

    const modeText = selectionMode === 'online' ? 'produk online (sudah punya harga online)' :
                     selectionMode === 'offline' ? 'produk offline (belum punya harga online)' :
                     'semua produk (online + offline)';
    
    const confirmMessage = 
      `⚠️ KONFIRMASI PERUBAHAN\n\n` +
      `Anda akan mengubah persentase markup online untuk:\n` +
      `📦 ${productsToUpdate.length} produk (${modeText})\n\n` +
      `Persentase baru: ${pct}%\n\n` +
      `Perubahan akan mengupdate:\n` +
      `✓ Kolom online_markup_pct di tabel products\n` +
      `✓ Kolom price di tabel product_prices (channel online) untuk produk online\n` +
      `✓ Buat entri baru di product_prices untuk produk offline\n\n` +
      `Lanjutkan?`;

    if (!window.confirm(confirmMessage)) return;

    setIsSubmitting(true);
    setError(null);
    setSuccessMessage('');
    setProgress(0);

    let successCount = 0;
    let errorCount = 0;

    try {
      for (let i = 0; i < productsToUpdate.length; i++) {
        const product = productsToUpdate[i];
        // Gunakan base_price, jika 0 gunakan hpp sebagai fallback
        const basePrice = product.base_price || product.hpp || 0;
        const newOnlinePrice = calculateOnlinePrice(basePrice, pct);

        // 1. Update online_markup_pct di tabel products
        const { error: productError } = await supabase
          .from('products')
          .update({ online_markup_pct: pct })
          .eq('id', product.id);

        if (productError) {
          console.error(`Error update product ${product.name}:`, productError);
          errorCount++;
        }

        // 2. Update price di tabel product_prices (channel = 'online')
        if (product.online_price_id) {
          const { error: priceError } = await supabase
            .from('product_prices')
            .update({ price: newOnlinePrice })
            .eq('id', product.online_price_id);

          if (priceError) {
            console.error(`Error update product_prices for ${product.name}:`, priceError);
            errorCount++;
          }
        } else {
          // Jika tidak ada online_price_id tapi has_online_price, buat baru
          const { error: insertError } = await supabase
            .from('product_prices')
            .insert({
              product_id: product.id,
              channel: 'online',
              price: newOnlinePrice,
              platform_fee_pct: 0,
            });

          if (insertError) {
            console.error(`Error insert product_prices for ${product.name}:`, insertError);
            errorCount++;
          }
        }

        if (!productError) successCount++;

        // Update progress
        const progressPct = Math.round(((i + 1) / productsToUpdate.length) * 100);
        setProgress(progressPct);
      }

      // Sukses
      if (errorCount === 0) {
        setSuccessMessage(
          `✅ Berhasil mengubah persentase markup untuk ${successCount} produk menjadi ${pct}%`
        );
      } else {
        setSuccessMessage(
          `⚠️ ${successCount} produk berhasil diupdate, ${errorCount} produk gagal.`
        );
      }

      setNewPercentage('');
      setShowPreview(false);
      setPreviewData([]);
      await fetchProducts();

      setTimeout(() => setSuccessMessage(''), 5000);

    } catch (err) {
      console.error('Error applying global markup:', err);
      setError('Gagal mengubah persentase: ' + err.message);
    } finally {
      setIsSubmitting(false);
      setProgress(0);
    }
  }, [newPercentage, products, fetchProducts, validatePercentage, selectionMode]);

  // ==========================================
  // 7. RESET & STATS
  // ==========================================
  const resetForm = useCallback(() => {
    setNewPercentage('');
    setShowPreview(false);
    setPreviewData([]);
    setError(null);
    setSuccessMessage('');
  }, []);

  const getSummaryStats = useCallback(() => {
    if (products.length === 0) return null;

    const onlineProducts = products.filter(p => p.has_online_price);
    const offlineProducts = products.filter(p => !p.has_online_price);

    let selectedProducts = products;
    if (selectionMode === 'online') selectedProducts = onlineProducts;
    else if (selectionMode === 'offline') selectedProducts = offlineProducts;

    const markups = onlineProducts.map(p => p.current_markup_pct);
    const avgMarkup = markups.length > 0 ? markups.reduce((a, b) => a + b, 0) / markups.length : 0;
    const minMarkup = markups.length > 0 ? Math.min(...markups) : 0;
    const maxMarkup = markups.length > 0 ? Math.max(...markups) : 0;
    
    const pct = parseFloat(newPercentage) || 0;
    const willChange = selectedProducts.filter(p => p.current_markup_pct !== pct).length;

    return {
      total_products: products.length,
      online_products: onlineProducts.length,
      offline_products: offlineProducts.length,
      selected_count: selectedProducts.length,
      avg_markup: avgMarkup.toFixed(1),
      min_markup: minMarkup,
      max_markup: maxMarkup,
      will_change: willChange,
    };
  }, [products, newPercentage, selectionMode]);

  const summaryStats = getSummaryStats();

  return {
    products,
    loading,
    error,
    successMessage,
    newPercentage,
    selectionMode,
    isSubmitting,
    progress,
    showPreview,
    previewData,
    summaryStats,
    onlyAffectedCount: summaryStats?.selected_count || 0,
    handlePercentageChange,
    handleSelectionChange,
    generatePreview,
    applyGlobalMarkup,
    resetForm,
    refreshData: fetchProducts,
  };
}

export default useGlobalOnlineMarkup;