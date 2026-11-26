import { supabase } from '@/lib/supabase';

/**
 * Mengambil daftar produk dengan dukungan paginasi, pencarian, dan filter.
 */
export async function getProducts({
  storeIds,
  searchQuery = '',
  filterCategory = 'all',
  filterChannel = 'all',
  filterStatus = 'all',
  page = 1,
  itemsPerPage = 10,
}) {
  if (!storeIds || storeIds.length === 0) {
    return { data: [], count: 0, error: null };
  }

  // 1. Ambil semua product_id milik store ini terlebih dahulu
  const { data: storeProducts, error: spError } = await supabase
    .from('products')
    .select('id')
    .in('store_id', storeIds);

  if (spError) throw spError;

  let targetProductIds = (storeProducts || []).map((p) => p.id);

  if (targetProductIds.length === 0) {
    return { data: [], count: 0, error: null };
  }

  // 2. Jika ada filter channel, filter targetProductIds berdasarkan product_prices
  if (filterChannel === 'online' || filterChannel === 'offline') {
    const { data: priceData, error: priceError } = await supabase
      .from('product_prices')
      .select('product_id, channel')
      .in('product_id', targetProductIds);

    if (priceError) throw priceError;

    const onlineProductIds = new Set(
      (priceData || []).filter((p) => p.channel === 'online').map((p) => p.product_id)
    );

    if (filterChannel === 'online') {
      targetProductIds = Array.from(onlineProductIds);
    } else {
      targetProductIds = targetProductIds.filter((id) => !onlineProductIds.has(id));
    }

    if (targetProductIds.length === 0) {
      return { data: [], count: 0, error: null };
    }
  }

  // 3. Bangun Query Utama
  const from = (page - 1) * itemsPerPage;
  const to = from + itemsPerPage - 1;

  let query = supabase
    .from('products')
    .select(
      `
      *,
      categories ( name ),
      inventory ( qty_on_hand ),
      product_prices ( channel, price, platform_fee_pct )
      `,
      { count: 'exact' }
    )
    .in('id', targetProductIds)
    .order('created_at', { ascending: false });

  if (searchQuery && searchQuery.trim() !== '') {
    query = query.or(`name.ilike.%${searchQuery}%,sku.ilike.%${searchQuery}%`);
  }

  if (filterCategory && filterCategory !== 'all') {
    query = query.eq('category_id', filterCategory);
  }

  if (filterStatus !== 'all') {
    query = query.eq('is_active', filterStatus === 'active');
  }

  query = query.range(from, to);

  const { data, error, count } = await query;

  if (error) throw error;

  return { data: data || [], count: count || 0, error: null };
}

/**
 * Mengambil detail satu produk beserta relasinya.
 */
export async function getProductById(id) {
  const { data, error } = await supabase
    .from('products')
    .select(
      `
      *,
      categories ( name ),
      inventory ( qty_on_hand ),
      product_prices ( channel, price, platform_fee_pct )
      `
    )
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  return data;
}

/**
 * Mencari produk berdasarkan nama dan ID toko.
 * Digunakan di modul HPP untuk mengecek apakah produk sudah ada sebelum membuat baru.
 * 
 * @param {string} name - Nama produk.
 * @param {number|string} storeId - ID toko.
 * @returns {Promise<Object|null>} Data produk atau null jika tidak ditemukan.
 */
export async function getProductByNameAndStore(name, storeId) {
  const { data, error } = await supabase
    .from('products')
    .select('id, name, hpp, base_price, online_markup_pct, product_prices(id, channel, price)')
    .eq('name', name)
    .eq('store_id', storeId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

/**
 * Membuat atau memperbarui data produk (Upsert).
 */
export async function upsertProduct(productData) {
  const { data, error } = await supabase
    .from('products')
    .upsert(productData, { onConflict: 'id' })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateProductById(id, productData) {
  const { data, error } = await supabase
    .from('products')
    .update(productData)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateProductHpp(id, productData) {
  const { error } = await supabase
    .from('products')
    .update(productData)
    .eq('id', id);

  if (error) throw error;
}

/**
 * Mengubah status aktif/non-aktif produk.
 */
export async function updateProductStatus(id, isActive) {
  const { error } = await supabase
    .from('products')
    .update({ is_active: isActive })
    .eq('id', id);

  if (error) throw error;
}

/**
 * Mengubah pengaturan pelacakan stok (track_stock) produk.
 */
export async function updateProductStockTracking(id, trackStock) {
  const { error } = await supabase
    .from('products')
    .update({ track_stock: trackStock })
    .eq('id', id);

  if (error) throw error;
}

/**
 * Menghapus produk dari database.
 */
export async function deleteProduct(id) {
  const { error } = await supabase.from('products').delete().eq('id', id);
  if (error) throw error;
}

/**
 * Memeriksa apakah kolom `track_stock` didukung di tabel products.
 * Digunakan sebagai fallback ketika toko belum memiliki produk sama sekali.
 */
export async function checkSupportsStockTracking(storeId) {
  if (!storeId) return true; // fallback aman jika storeId tidak valid

  const { data, error } = await supabase
    .from('products')
    .select('id, track_stock')
    .eq('store_id', storeId)
    .limit(1);

  // Jika error karena kolom tidak ada, anggap tidak didukung
  if (error) {
    return false;
  }

  // Jika ada data, cek apakah properti `track_stock` ada di hasil
  if (data && data.length > 0) {
    return Object.prototype.hasOwnProperty.call(data[0], 'track_stock');
  }

  // Jika tabel kosong untuk toko ini, asumsikan didukung (environment terbaru)
  return true;
}