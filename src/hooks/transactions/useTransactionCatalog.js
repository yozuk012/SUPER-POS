import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { ACTIVE_STORE_EVENT, isMainStore, resolveActiveStore } from '@/lib/activeStore';
import { isMissingColumnError } from '@/lib/productUtils';

const buildProductSelect = (withTrackStock) =>
  [
    'id, name, sku, unit, base_price, hpp, image_url, is_active, store_id, category_id, discount_pct',
    withTrackStock ? 'track_stock' : null,
    'categories (name)',
    'product_prices (channel, price, platform_fee_pct)',
    'inventory (qty_on_hand)',
  ]
    .filter(Boolean)
    .join(', ');


export function useTransactionCatalog(userId, { search, channel, categoryId, currentPage, onStoreChange }) {
  const [storeId, setStoreId] = useState(null);
  const [storeName, setStoreName] = useState('');
  const [isMainBranch, setIsMainBranch] = useState(false);
  const [supportsStockTracking, setSupportsStockTracking] = useState(true);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [totalItems, setTotalItems] = useState(0);
  const [storeQrisUrl, setStoreQrisUrl] = useState(null);
  const [storeInfo, setStoreInfo] = useState({ name: 'Toko Saya' });
  const limit = 20;
  useEffect(() => {
    let revision = 0;
    const fetchInitialData = async () => {
      const currentRevision = ++revision;
      if (!userId) {
        setStoreId(null);
        setStoreName('');
        setIsMainBranch(false);
        setProducts([]);
        setCategories([]);

        return;
      }

      const { data: stores, error: storeError } = await supabase
        .from('stores')
        .select('id, name, logo_url, address, qris_code_url, qris_merchant_id, bank_name, account_number, account_name')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('id', { ascending: true });

      if (!current || currentRevision !== revision) return;
      if (storeError) throw storeError;
      const storeData = resolveActiveStore(stores);

      if (!storeData) {
        setStoreId(null);
        setStoreName('');
        setIsMainBranch(false);
        setCategories([]);
        setProducts([]);

        return;
      }

      setStoreId(storeData.id);
      setStoreName(storeData.name || '');
      setIsMainBranch(isMainStore(storeData, stores));

      const { data: merchantData } = await supabase
        .from('merchants')
        .select('phone')
        .eq('id', userId)
        .maybeSingle();

      const { data: catData, error: categoryError } = await supabase
        .from('categories')
        .select('id, name')
        .eq('store_id', storeData.id)
        .order('name', { ascending: true });
      
      if (!current || currentRevision !== revision) return;
      if (categoryError) throw categoryError;
      setCategories(catData || []);

      const cleanUrl = storeData.qris_code_url?.replace(/^(https?:\/\/)+/i, 'https://') || null;
      setStoreQrisUrl(cleanUrl);
      setStoreInfo({
        name: storeData.name || 'Toko Saya',
        logo_url: storeData.logo_url || null,
        address: storeData.address || null,
        phone: merchantData?.phone || null,
        bank_name: storeData.bank_name || null,
        account_number: storeData.account_number || null,
        account_name: storeData.account_name || null
      });
    };

    let current = true;
    fetchInitialData().catch(error => console.error('Gagal memuat data transaksi:', error));

    const handleStoreChange = () => {
      // KETIKA SWITCH TOKO: TRANSAKSI KOSONG, PRODUK KOSONG, KATEGORI KOSONG

      onStoreChange();
      setProducts([]);
      setCategories([]);
      setTotalItems(0);
      fetchInitialData().catch(error => console.error('Gagal memuat toko setelah pergantian:', error));
    };

    window.addEventListener(ACTIVE_STORE_EVENT, handleStoreChange);
    return () => { current = false; window.removeEventListener(ACTIVE_STORE_EVENT, handleStoreChange); };
  }, [userId, onStoreChange]);

  // ==========================================
  // 3. FETCH PRODUCTS (DENGAN DATA STOK)
  // ==========================================
  const fetchProducts = useCallback(async () => {
    if (!storeId) {
      setProducts([]);
      setTotalItems(0);
      return;
    }

    setIsLoadingProducts(true);
    try {
      const runProductsQuery = (withTrackStock) => {
        let query = supabase
          .from('products')
          .select(buildProductSelect(withTrackStock), { count: 'exact' })
          .eq('store_id', storeId)
          .eq('is_active', true)
          .order('name', { ascending: true });

        if (search) {
          query = query.or(`name.ilike.%${search}%,sku.ilike.%${search}%`);
        }

        if (categoryId !== 'all') {
          query = query.eq('category_id', categoryId);
        }

        return query;
      };

      let { data, error, count } = await runProductsQuery(supportsStockTracking);

      // Kolom `track_stock` belum ada di database -> ulangi query tanpa kolom
      // tersebut agar katalog kasir tetap tampil (semua produk dianggap
      // masih melacak stok).
      if (error && supportsStockTracking && isMissingColumnError(error, 'track_stock')) {
        setSupportsStockTracking(false);
        ({ data, error, count } = await runProductsQuery(false));
      }

      if (error) throw error;

      // PERBAIKAN 1: Mapping data agar properti 'stock' mudah diakses
      let filteredData = (data || []).map(p => ({
        ...p,
        stock: Array.isArray(p.inventory) 
          ? (p.inventory[0]?.qty_on_hand || 0) 
          : (p.inventory?.qty_on_hand || 0),
        // Stok tanpa batas bila kolom track_stock = false. Tanpa kolom -> true.
        track_stock: p.track_stock !== false
      }));
      
      if (channel === 'online') {
        const onlineChannels = ['online', 'shopee', 'tokopedia', 'grabmart', 'gojek'];
        filteredData = filteredData.filter(product => 
          product.product_prices?.some(p => onlineChannels.includes(p.channel.toLowerCase()))
        );
      } 

      const totalFiltered = filteredData.length;
      const from = (currentPage - 1) * limit;
      const to = from + limit;
      const paginatedData = filteredData.slice(from, to);

      setProducts(paginatedData);
      setTotalItems(totalFiltered);
      
    } catch (error) {
      console.error('❌ Error fetching products:', error);
    } finally {
      setIsLoadingProducts(false);
    }
  }, [currentPage, search, channel, categoryId, storeId, supportsStockTracking]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch produk kasir saat mount / filter berubah
    fetchProducts();
  }, [fetchProducts]);


  return { storeId, storeName, isMainBranch, supportsStockTracking, products, categories,
    isLoadingProducts, totalItems, storeQrisUrl, storeInfo, fetchProducts, limit };
}
