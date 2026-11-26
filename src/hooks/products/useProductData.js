'use client';

import { useState, useCallback } from 'react';
import { 
  getProducts, 
  updateProductStatus, 
  updateProductStockTracking, 
  deleteProduct as deleteProductRepo
} from '@/repositories/products';
import { getCategoriesByStoreIds } from '@/repositories/categories';
import { 
  saveProductDetails, 
  deleteImageFromStorage, 
  isImageStillUsed 
} from '@/services/products';
import { isMissingColumnError } from '@/lib/productUtils';

const MISSING_STOCK_COLUMN_MESSAGE =
  'Fitur "Stok Tanpa Batas" belum tersedia karena kolom `track_stock` belum ada di tabel products.\n\n' +
  'Jalankan SQL migrasi pada src/blueprint/DATABASE.MD, lalu simpan ulang produk.';

/**
 * Hook untuk mengelola data produk (fetching & mutation).
 * Tidak mengelola state form atau filter UI (tanggung jawab hook lain).
 * 
 * @param {number[]} storeIds - Array ID toko yang sedang aktif.
 * @returns {Object} State dan fungsi mutasi data produk.
 */
export function useProductData(storeIds) {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [supportsStockTracking, setSupportsStockTracking] = useState(true);

  // ==========================================
  // 1. FETCHING DATA
  // ==========================================

  const fetchCategories = useCallback(async () => {
    if (!storeIds || storeIds.length === 0) {
      setCategories([]);
      return;
    }

    try {
      setCategories(await getCategoriesByStoreIds(storeIds));
    } catch (err) {
      console.error('Fetch categories error:', err);
      setError(`Gagal memuat kategori: ${err.message}`);
      setCategories([]);
    }
  }, [storeIds]);

  const fetchProducts = useCallback(async (filters = {}) => {
    if (!storeIds || storeIds.length === 0) {
      setProducts([]);
      setTotalItems(0);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, count, error: productsError } = await getProducts({
        storeIds,
        searchQuery: filters.searchQuery || '',
        filterCategory: filters.filterCategory || 'all',
        filterChannel: filters.filterChannel || 'all',
        filterStatus: filters.filterStatus || 'all',
        page: filters.currentPage || 1,
        itemsPerPage: filters.itemsPerPage || 10,
      });

      if (productsError) throw productsError;

      // Mapping data agar sesuai dengan format yang diharapkan UI
      const mappedProducts = (data || []).map((p) => {
        const prices = p.product_prices || [];
        const onlinePriceData = prices.find((pp) => pp.channel === 'online');
        const offlinePriceData = prices.find((pp) => pp.channel === 'offline');

        return {
          ...p,
          category_name: p.categories?.name || 'Tanpa Kategori',
          stock: Array.isArray(p.inventory)
            ? p.inventory[0]?.qty_on_hand || 0
            : p.inventory?.qty_on_hand || 0,
          track_stock: p.track_stock !== false,
          has_online_price: !!onlinePriceData,
          online_price: onlinePriceData ? onlinePriceData.price : 0,
          online_markup_pct: p.online_markup_pct || 0,
          display_offline_price: offlinePriceData ? offlinePriceData.price : p.base_price,
        };
      });

      setProducts(mappedProducts);
      setTotalItems(count || 0);

      // Deteksi dukungan kolom track_stock dari hasil query
      if ((data || []).length > 0) {
        const hasColumn = (data || []).some((row) =>
          Object.prototype.hasOwnProperty.call(row, 'track_stock')
        );
        setSupportsStockTracking(hasColumn);
      } else {
        // Fallback: Jika toko belum punya produk sama sekali, asumsikan kolom didukung 
        // (default aman untuk environment database terbaru yang sudah migrasi).
        setSupportsStockTracking(true);
      }
    } catch (err) {
      console.error('Fetch products error:', err);
      setError(`Gagal memuat produk: ${err.message}`);
      setProducts([]);
      setTotalItems(0);
    } finally {
      setLoading(false);
    }
  }, [storeIds]);

  // ==========================================
  // 2. MUTASI DATA
  // ==========================================

  const handleSaveProduct = useCallback(async (payload) => {
    setLoading(true);
    setError(null);

    try {
      const result = await saveProductDetails(payload);
      
      if (payload.supportsStockTracking && !result.supportsStockTracking) {
        setSupportsStockTracking(false);
        // Kembalikan flag khusus agar caller (useProducts) bisa menampilkan alert
        return { success: true, needsMigrationAlert: true };
      }

      return { success: true, needsMigrationAlert: false };
    } catch (err) {
      console.error('Save product error:', err);
      setError(err.message || 'Terjadi kesalahan saat menyimpan produk.');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const handleToggleProductStatus = useCallback(async (product) => {
    const nextStatus = !product.is_active;
    if (!window.confirm(`Yakin ingin ${nextStatus ? 'mengaktifkan' : 'menonaktifkan'} produk "${product.name}"?`)) {
      return false;
    }

    try {
      await updateProductStatus(product.id, nextStatus);
      return true;
    } catch (err) {
      console.error('Toggle status error:', err);
      alert(`Gagal: ${err.message}`);
      return false;
    }
  }, []);

  const handleToggleStockTracking = useCallback(async (product) => {
    // Jika saat ini unlimited (track_stock === false), maka kita akan mengaktifkannya (true)
    const enableTracking = product.track_stock === false;
    
    const konfirmasi = enableTracking
      ? `Aktifkan kembali pelacakan stok untuk "${product.name}"?\n\nStok produk akan divalidasi & dikurangi otomatis saat transaksi.`
      : `Nonaktifkan stok produk "${product.name}" menjadi TANPA BATAS (unlimited)?\n\nProduk tetap bisa dijual walau stok 0 dan stok tidak dikurangi otomatis saat transaksi.`;

    if (!window.confirm(konfirmasi)) {
      return false;
    }

    try {
      await updateProductStockTracking(product.id, enableTracking);
      return true;
    } catch (err) {
      console.error('Toggle stock tracking error:', err);
      alert(
        isMissingColumnError(err, 'track_stock')
          ? MISSING_STOCK_COLUMN_MESSAGE
          : `Gagal: ${err.message}`
      );
      return false;
    }
  }, []);

  const handleDeleteProduct = useCallback(async (productId, currentProducts) => {
    const productToDelete = currentProducts.find((p) => p.id === productId);
    if (!productToDelete) return false;

    if (!window.confirm('Yakin ingin menghapus produk ini secara permanen?')) {
      return false;
    }

    try {
      // 1. Hapus dari database (mengembalikan data yang terhapus untuk cek gambar)
      // Catatan: Supabase delete().select() memerlukan konfigurasi RLS/returning, 
      // jadi kita ambil data dari state lokal untuk keamanan.
      const { image_url: imageUrl } = productToDelete;

      await deleteProductRepo(productId);

      // 2. Cek dan hapus gambar dari storage jika tidak dipakai lagi
      if (imageUrl && !(await isImageStillUsed(imageUrl, productId))) {
        await deleteImageFromStorage(imageUrl);
      }

      return true;
    } catch (err) {
      console.error('Delete product error:', err);
      alert('Gagal menghapus: ' + err.message);
      return false;
    }
  }, []);

  return {
    // State
    products,
    categories,
    totalItems,
    loading,
    error,
    supportsStockTracking,
    
    // Actions
    fetchProducts,
    fetchCategories,
    handleSaveProduct,
    handleToggleProductStatus,
    handleToggleStockTracking,
    handleDeleteProduct,
    
    // Helper untuk reset error manual dari UI
    clearError: () => setError(null),
  };
}