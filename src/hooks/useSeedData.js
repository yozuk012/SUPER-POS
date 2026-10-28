'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase, uploadFile } from '@/lib/supabase';
import { useConvert } from './useConvertImages';
import { ACTIVE_STORE_EVENT, resolveActiveStore } from '@/lib/activeStore';
import {
  buildSeedCatalog,
  calculateOfflinePrice,
  ensureUniqueSku,
  normalizeKey,
  slugify,
  SEED_DEFAULT_ROUNDING_STEP,
  SEED_EXISTING_MODES,
  SEED_PRICE_MODES,
} from '@/lib/seedCatalog';

// Jumlah produk yang diproses bersamaan (upload gambar + insert) per batch
const SEED_CHUNK_SIZE = 5;

export function useSeedData() {
  const { convertToWebP } = useConvert();

  // ==========================================
  // 1. STATE MANAGEMENT
  // ==========================================
  const catalog = useMemo(() => buildSeedCatalog(), []);

  const [store, setStore] = useState(null);
  const [existingStats, setExistingStats] = useState({ categories: 0, products: 0 });
  const [loading, setLoading] = useState(true);

  const [isSeeding, setIsSeeding] = useState(false);
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState('');
  const [log, setLog] = useState([]);
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState(null);

  // ==========================================
  // 2. HELPER: LOG PROGRES
  // ==========================================
  const pushLog = useCallback((type, message) => {
    setLog((prev) =>
      [...prev, { type, message, time: new Date().toISOString() }].slice(-80)
    );
  }, []);

  // ==========================================
  // 3. HELPER: AMBIL TOKO AKTIF + STATISTIK
  // ==========================================
  const countStoreData = useCallback(async (storeId) => {
    const [categoryRes, productRes] = await Promise.all([
      supabase.from('categories').select('id', { count: 'exact', head: true }).eq('store_id', storeId),
      supabase.from('products').select('id', { count: 'exact', head: true }).eq('store_id', storeId),
    ]);

    if (categoryRes.error) {
      throw new Error('Gagal menghitung kategori: ' + categoryRes.error.message);
    }
    if (productRes.error) {
      throw new Error('Gagal menghitung produk: ' + productRes.error.message);
    }

    return {
      categories: categoryRes.count || 0,
      products: productRes.count || 0,
    };
  }, []);

  // Ambil user id langsung dari Supabase (bukan dari objek `user` useAuth)
  // supaya identitasnya stabil dan tidak memicu re-render berantai.
  const getCurrentUserId = useCallback(async () => {
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    return currentUser?.id || null;
  }, []);

  const fetchActiveStore = useCallback(async (userId) => {
    if (!userId) return null;

    const { data, error: storesError } = await supabase
      .from('stores')
      .select('id, name')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('name');

    if (storesError) throw new Error('Gagal memuat toko: ' + storesError.message);
    return resolveActiveStore(data || []);
  }, []);

  const loadContext = useCallback(async () => {
    // Await pertama dilakukan sebelum setState apa pun supaya efek ini tidak
    // memicu cascading render (aturan react-hooks/set-state-in-effect).
    const userId = await getCurrentUserId();

    if (!userId) {
      setStore(null);
      setExistingStats({ categories: 0, products: 0 });
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const activeStore = await fetchActiveStore(userId);
      setStore(activeStore || null);
      setExistingStats(
        activeStore?.id ? await countStoreData(activeStore.id) : { categories: 0, products: 0 }
      );
    } catch (err) {
      console.error('Seed data context error:', err);
      setError(err.message || 'Gagal memuat data toko.');
    } finally {
      setLoading(false);
    }
  }, [getCurrentUserId, fetchActiveStore, countStoreData]);

  useEffect(() => {
    // loadContext() hanya memanggil setState setelah await pertama (ambil user
    // & toko dari Supabase), jadi tidak ada cascading render. Aturan
    // react-hooks/set-state-in-effect belum mengenali pola async ini.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadContext();
    const handleStoreChange = () => loadContext();
    window.addEventListener(ACTIVE_STORE_EVENT, handleStoreChange);
    return () => window.removeEventListener(ACTIVE_STORE_EVENT, handleStoreChange);
  }, [loadContext]);

  // ==========================================
  // 4. HELPER: UPLOAD GAMBAR SEED KE STORAGE
  // ==========================================
  const uploadSeedImage = useCallback(async (item) => {
    if (!item.image_local_url) throw new Error('file gambar tidak tersedia');

    // Gambar dibaca dari src/seeds/images melalui route API internal.
    const response = await fetch(item.image_local_url);
    if (!response.ok) {
      throw new Error(`file ${item.image_local_url} tidak ditemukan (HTTP ${response.status})`);
    }

    const blob = await response.blob();
    const sourceFile = new File([blob], item.image_file, { type: blob.type || 'image/jpeg' });

    // Optimasi ke WebP seperti proses unggah manual di form produk
    const converted = await convertToWebP(sourceFile, 0.8);
    if (!converted.success) throw new Error(converted.error);

    const fileName = `${slugify(item.name)}-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    const uploaded = await uploadFile(converted.file, 'product-toko', fileName);
    if (!uploaded.success) throw new Error(uploaded.error);

    return uploaded.url;
  }, [convertToWebP]);

  // ==========================================
  // 5. PROSES UTAMA: SEED KATEGORI + PRODUK
  // ==========================================
  const runSeed = useCallback(async (options = {}) => {
    const {
      uploadImages = true,
      createInventory = true,
      existingMode = SEED_EXISTING_MODES.FILL_EMPTY,
      roundingStep = SEED_DEFAULT_ROUNDING_STEP,
      priceMode = SEED_PRICE_MODES.WITH_PRICE,
    } = options;

    setIsSeeding(true);
    setError(null);
    setSummary(null);
    setProgress(0);
    setLog([]);

    const result = {
      storeName: '',
      categoriesCreated: 0,
      categoriesReused: 0,
      productsCreated: 0,
      productsUpdated: 0,
      productsSkipped: 0,
      productsFailed: 0,
      pricesSynced: 0,
      pricesFailed: 0,
      imagesUploaded: 0,
      imagesFailed: 0,
      inventoryCreated: 0,
      roundingStep,
      existingMode,
      priceMode,
      failedRows: [],
      finishedAt: null,
    };

    try {
      const userId = await getCurrentUserId();
      if (!userId) throw new Error('Sesi login tidak ditemukan. Silakan login ulang.');
      if (catalog.products.length === 0) {
        throw new Error('Data seed kosong. Periksa kembali src/seeds/data.json.');
      }

      // --- STEP 1: Tentukan toko aktif ---
      setPhase('Menyiapkan toko aktif...');
      const activeStore = store || (await fetchActiveStore(userId));
      if (!activeStore?.id) {
        throw new Error('Tidak ada toko aktif. Buat toko terlebih dahulu di Pengaturan > Stores.');
      }

      const storeId = activeStore.id;
      result.storeName = activeStore.name || '-';

      // --- STEP 2: Kategori produk ---
      setPhase('Menyiapkan kategori produk...');
      const { data: existingCategories, error: categoryFetchError } = await supabase
        .from('categories')
        .select('id, name')
        .eq('store_id', storeId);

      if (categoryFetchError) throw new Error('Gagal memuat kategori: ' + categoryFetchError.message);

      const categoryMap = new Map(
        (existingCategories || []).map((category) => [normalizeKey(category.name), category.id])
      );

      const newCategories = catalog.categories.filter(
        (category) => !categoryMap.has(normalizeKey(category.name))
      );

      if (newCategories.length > 0) {
        const { data: insertedCategories, error: categoryInsertError } = await supabase
          .from('categories')
          .insert(newCategories.map((category) => ({ store_id: storeId, name: category.name })))
          .select('id, name');

        if (categoryInsertError) throw new Error('Gagal menyimpan kategori: ' + categoryInsertError.message);

        (insertedCategories || []).forEach((category) => {
          categoryMap.set(normalizeKey(category.name), category.id);
        });
        result.categoriesCreated = (insertedCategories || []).length;
        pushLog('success', `${result.categoriesCreated} kategori baru dibuat.`);
      }

      result.categoriesReused = catalog.categories.length - result.categoriesCreated;
      if (result.categoriesReused > 0) {
        pushLog('info', `${result.categoriesReused} kategori sudah ada dan dipakai ulang.`);
      }

      // --- STEP 3: Siapkan daftar produk yang akan di-seed ---
      setPhase('Menyiapkan daftar produk...');
      const { data: existingProducts, error: productFetchError } = await supabase
        .from('products')
        .select('id, name, sku, base_price, online_markup_pct, product_prices ( id, channel, price )')
        .eq('store_id', storeId);

      if (productFetchError) throw new Error('Gagal memuat produk: ' + productFetchError.message);

      // Peta produk lama: dipakai untuk memperbarui harga tanpa membuat duplikat.
      const existingByName = new Map();
      (existingProducts || []).forEach((product) => {
        const onlinePriceRow =
          (product.product_prices || []).find((price) => price.channel === 'online') || null;

        existingByName.set(normalizeKey(product.name), {
          id: product.id,
          name: product.name,
          sku: product.sku,
          base_price: Number(product.base_price) || 0,
          online_price_id: onlinePriceRow?.id || null,
          online_price: Number(onlinePriceRow?.price) || 0,
        });
      });

      // SKU bersifat unik global, jadi ambil semua SKU milik user (semua cabang)
      const { data: skuRows, error: skuFetchError } = await supabase.from('products').select('sku');
      if (skuFetchError) throw new Error('Gagal memuat SKU produk: ' + skuFetchError.message);
      const usedSkus = new Set(
        (skuRows || []).map((row) => String(row.sku || '').toUpperCase()).filter(Boolean)
      );

      // Harga offline dihitung ulang sesuai pembulatan yang dipilih user.
      // Jika priceMode adalah ZERO_PRICE, semua harga jadi 0.
      const pricedProducts = catalog.products.map((item) => {
        if (priceMode === SEED_PRICE_MODES.ZERO_PRICE) {
          return { ...item, base_price: 0, offline_price: 0, online_price: 0 };
        }
        const offlinePrice = calculateOfflinePrice(item.online_price, roundingStep);
        return { ...item, base_price: offlinePrice, offline_price: offlinePrice };
      });

      const productsToCreate = [];
      const productsToUpdate = [];

      pricedProducts.forEach((item) => {
        const existing = existingByName.get(normalizeKey(item.name));

        if (!existing) {
          productsToCreate.push(item);
          return;
        }

        if (existingMode === SEED_EXISTING_MODES.SKIP) {
          return;
        }

        // Mode "isi harga kosong": hanya sentuh harga yang masih 0/kosong.
        const updateBasePrice =
          existingMode === SEED_EXISTING_MODES.OVERWRITE || existing.base_price <= 0;
        const updateOnlinePrice =
          existingMode === SEED_EXISTING_MODES.OVERWRITE ||
          !existing.online_price_id ||
          existing.online_price <= 0;

        if (!updateBasePrice && !updateOnlinePrice) {
          return;
        }

        // Saat hanya mengisi harga kosong, patokan offline memakai harga online
        // yang sudah ada di database agar offline tidak melebihi online.
        const baseOnlinePrice =
          existingMode === SEED_EXISTING_MODES.FILL_EMPTY && existing.online_price > 0
            ? existing.online_price
            : item.online_price;
        const offlinePrice = calculateOfflinePrice(baseOnlinePrice, roundingStep);

        productsToUpdate.push({
          ...item,
          base_price: offlinePrice,
          offline_price: offlinePrice,
          existing,
          updateBasePrice,
          updateOnlinePrice,
        });
      });

      result.productsSkipped =
        pricedProducts.length - productsToCreate.length - productsToUpdate.length;

      const totalToProcess = productsToCreate.length + productsToUpdate.length;

      if (productsToCreate.length > 0) {
        pushLog('info', `${productsToCreate.length} produk baru akan ditambahkan lengkap dengan harga.`);
      }

      if (productsToUpdate.length > 0) {
        const modeLabel =
          existingMode === SEED_EXISTING_MODES.OVERWRITE
            ? 'semua harga ditimpa'
            : 'hanya harga yang masih 0 yang diisi';
        pushLog('info', `${productsToUpdate.length} produk lama akan diperbarui harganya (${modeLabel}).`);
      }

      if (result.productsSkipped > 0) {
        pushLog(
          'info',
          `${result.productsSkipped} produk dilewati karena harganya sudah terisi atau mode "lewati" dipilih.`
        );
      }

      if (totalToProcess === 0) {
        pushLog('info', 'Semua produk sudah punya harga. Tidak ada data yang perlu diubah.');
      }

      // --- STEP 4: Buat produk baru lengkap dengan harga ---
      let processed = 0;

      for (let start = 0; start < productsToCreate.length; start += SEED_CHUNK_SIZE) {
        const chunk = productsToCreate.slice(start, start + SEED_CHUNK_SIZE);
        const lastIndex = Math.min(start + chunk.length, productsToCreate.length);

        setPhase(`Membuat produk ${start + 1}-${lastIndex} dari ${productsToCreate.length}...`);

        const chunkResults = await Promise.all(
          chunk.map(async (item) => {
            try {
              // 4a. Gambar produk (opsional upload ke Supabase Storage)
              let imageUrl = null;

              if (item.image_file) {
                if (uploadImages) {
                  try {
                    imageUrl = await uploadSeedImage(item);
                    result.imagesUploaded += 1;
                  } catch (imageError) {
                    result.imagesFailed += 1;
                    imageUrl = item.image_local_url;
                    pushLog('error', `Gambar "${item.name}" gagal diunggah (${imageError.message}). Memakai path lokal.`);
                  }
                } else {
                  imageUrl = item.image_local_url;
                }
              }

              // 4b. Insert produk + harga offline (base_price)
              const payload = {
                store_id: storeId,
                category_id: categoryMap.get(normalizeKey(item.category_name)) || null,
                name: item.name,
                sku: ensureUniqueSku(item.sku, usedSkus),
                type: item.type,
                unit: item.unit,
                base_price: item.offline_price,
                hpp: 0,
                discount_pct: 0,
                online_markup_pct: item.online_markup_pct,
                image_url: imageUrl,
                is_active: true,
              };

              const { data, error: insertError } = await supabase
                .from('products')
                .insert(payload)
                .select('id, name')
                .single();

              if (insertError) throw new Error(insertError.message);

              // 4c. Simpan harga online ke product_prices
              let priceSynced = false;
              if (item.online_price > 0) {
                const { error: priceError } = await supabase.from('product_prices').insert({
                  product_id: data.id,
                  channel: 'online',
                  price: item.online_price,
                  platform_fee_pct: 0,
                });

                if (priceError) {
                  result.pricesFailed += 1;
                  pushLog('error', `Harga online "${item.name}" gagal disimpan: ${priceError.message}`);
                } else {
                  priceSynced = true;
                }
              }

              return { ok: true, product: data, item, priceSynced };
            } catch (rowError) {
              return { ok: false, item, message: rowError.message };
            }
          })
        );

        const createdIds = [];

        chunkResults.forEach((chunkResult) => {
          if (chunkResult.ok) {
            result.productsCreated += 1;
            createdIds.push(chunkResult.product.id);
            if (chunkResult.priceSynced) result.pricesSynced += 1;
          } else {
            result.productsFailed += 1;
            result.failedRows.push({
              name: chunkResult.item.name,
              sku: chunkResult.item.sku,
              reason: chunkResult.message,
            });
            pushLog('error', `Produk "${chunkResult.item.name}" gagal disimpan: ${chunkResult.message}`);
          }
        });

        // 4d. Inisialisasi stok awal produk baru
        if (createInventory && createdIds.length > 0) {
          const inventoryPayload = createdIds.map((productId) => ({
            store_id: storeId,
            product_id: productId,
            raw_material_id: null,
            qty_on_hand: 100,
            last_updated: new Date().toISOString(),
          }));

          const { error: inventoryError } = await supabase.from('inventory').insert(inventoryPayload);

          if (inventoryError) {
            pushLog('error', 'Gagal menyimpan baris stok produk baru: ' + inventoryError.message);
          } else {
            result.inventoryCreated += inventoryPayload.length;
          }
        }

        processed += chunk.length;
        setProgress(
          totalToProcess > 0 ? Math.round((processed / totalToProcess) * 100) : 100
        );
      }

      // --- STEP 5: Perbarui harga produk lama (tanpa menghapus data) ---
      if (productsToUpdate.length > 0) {
        for (let start = 0; start < productsToUpdate.length; start += SEED_CHUNK_SIZE) {
          const chunk = productsToUpdate.slice(start, start + SEED_CHUNK_SIZE);
          const lastIndex = Math.min(start + chunk.length, productsToUpdate.length);

          setPhase(`Memperbarui harga ${start + 1}-${lastIndex} dari ${productsToUpdate.length}...`);

          const chunkResults = await Promise.all(
            chunk.map(async (item) => {
              try {
                if (item.updateBasePrice) {
                  const { error: productError } = await supabase
                    .from('products')
                    .update({
                      base_price: item.offline_price,
                      online_markup_pct: item.online_markup_pct,
                    })
                    .eq('id', item.existing.id)
                    .eq('store_id', storeId);

                  if (productError) throw new Error(productError.message);
                }

                let priceSynced = false;

                if (item.updateOnlinePrice && item.online_price > 0) {
                  if (item.existing.online_price_id) {
                    const { error: priceError } = await supabase
                      .from('product_prices')
                      .update({ price: item.online_price })
                      .eq('id', item.existing.online_price_id);

                    if (priceError) throw new Error(priceError.message);
                  } else {
                    const { error: priceError } = await supabase.from('product_prices').insert({
                      product_id: item.existing.id,
                      channel: 'online',
                      price: item.online_price,
                      platform_fee_pct: 0,
                    });

                    if (priceError) throw new Error(priceError.message);
                  }

                  priceSynced = true;
                }

                return { ok: true, item, priceSynced };
              } catch (rowError) {
                return { ok: false, item, message: rowError.message };
              }
            })
          );

          chunkResults.forEach((chunkResult) => {
            if (chunkResult.ok) {
              result.productsUpdated += 1;
              if (chunkResult.priceSynced) result.pricesSynced += 1;
            } else {
              result.productsFailed += 1;
              result.failedRows.push({
                name: chunkResult.item.name,
                sku: chunkResult.item.sku,
                reason: chunkResult.message,
              });
              pushLog('error', `Harga "${chunkResult.item.name}" gagal diperbarui: ${chunkResult.message}`);
            }
          });

          processed += chunk.length;
          setProgress(
            totalToProcess > 0 ? Math.round((processed / totalToProcess) * 100) : 100
          );
        }
      }

      // --- STEP 6: Selesai ---
      result.finishedAt = new Date().toISOString();
      setProgress(100);
      setPhase('Selesai');
      setSummary(result);

      pushLog(
        'success',
        `Seed selesai: ${result.productsCreated} produk baru, ${result.productsUpdated} produk diperbarui, ` +
          `${result.pricesSynced} harga online disimpan (offline dibulatkan ke Rp${roundingStep.toLocaleString('id-ID')}).`
      );

      if (result.productsFailed > 0) {
        pushLog('error', `${result.productsFailed} produk gagal disimpan. Cek daftar di bawah.`);
      }

      // Perbarui statistik data yang sudah ada di toko
      try {
        setExistingStats(await countStoreData(storeId));
      } catch (statsError) {
        console.warn('Gagal memperbarui statistik toko:', statsError);
      }

      return { success: true, ...result };
    } catch (err) {
      console.error('Seed data error:', err);
      setError(err.message || 'Terjadi kesalahan saat menjalankan seed data.');
      setSummary(result);
      return { success: false, message: err.message };
    } finally {
      setIsSeeding(false);
    }
  }, [catalog, store, getCurrentUserId, fetchActiveStore, countStoreData, pushLog, uploadSeedImage]);

  // ==========================================
  // 6. RETURN VALUES
  // ==========================================
  return {
    catalog,
    store,
    existingStats,
    loading,
    isSeeding,
    progress,
    phase,
    log,
    summary,
    error,
    runSeed,
    resetSummary: () => setSummary(null),
    resetLog: () => setLog([]),
    refreshStats: loadContext,
  };
}

export default useSeedData;

