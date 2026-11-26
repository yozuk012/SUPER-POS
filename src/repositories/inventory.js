import { supabase } from '@/lib/supabase';

/**
 * Mengambil record inventory berdasarkan kombinasi store_id dan (product_id ATAU raw_material_id).
 * Tabel inventory bisa menyimpan stok untuk produk jadi atau bahan baku, 
 * sehingga salah satu dari product_id/raw_material_id akan bernilai null.
 * 
 * @param {number|string} storeId - ID toko.
 * @param {number|string|null} productId - ID produk jadi (null jika mencari bahan baku).
 * @param {number|string|null} rawMaterialId - ID bahan baku (null jika mencari produk jadi).
 * @returns {Promise<Object|null>} Data inventory atau null jika tidak ditemukan.
 */
export async function getInventoryRecord(storeId, productId = null, rawMaterialId = null) {
  let query = supabase
    .from('inventory')
    .select('id, qty_on_hand, last_updated')
    .eq('store_id', storeId);

  if (productId !== null) {
    query = query.eq('product_id', productId).is('raw_material_id', null);
  } else if (rawMaterialId !== null) {
    query = query.eq('raw_material_id', rawMaterialId).is('product_id', null);
  } else {
    throw new Error('Either productId or rawMaterialId must be provided.');
  }

  const { data, error } = await query.maybeSingle();

  if (error) throw error;
  return data;
}

/**
 * Memperbarui jumlah stok (qty_on_hand) dan timestamp terakhir update.
 * 
 * @param {number|string} inventoryId - ID record inventory.
 * @param {number} newQty - Jumlah stok baru.
 * @param {string} [lastUpdated] - Timestamp ISO string (default: sekarang).
 * @returns {Promise<void>}
 */
export async function updateInventoryQty(inventoryId, newQty, lastUpdated = null) {
  const payload = {
    qty_on_hand: newQty,
    last_updated: lastUpdated || new Date().toISOString(),
  };

  const { error } = await supabase
    .from('inventory')
    .update(payload)
    .eq('id', inventoryId);

  if (error) throw error;
}

/**
 * Membuat record inventory baru.
 * 
 * @param {Object} inventoryData - Data inventory (wajib: { store_id, qty_on_hand, dan salah satu product_id/raw_material_id }).
 * @returns {Promise<Object>} Data inventory yang berhasil dibuat.
 */
export async function createInventoryRecord(inventoryData) {
  const payload = {
    store_id: inventoryData.store_id,
    product_id: inventoryData.product_id || null,
    raw_material_id: inventoryData.raw_material_id || null,
    qty_on_hand: inventoryData.qty_on_hand || 0,
    last_updated: inventoryData.last_updated || new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('inventory')
    .insert(payload)
    .select('id')
    .single();

  if (error) throw error;
  return data;
}

/**
 * Memastikan record inventory untuk produk jadi sudah ada.
 * Jika belum ada, akan membuat record baru dengan qty_on_hand = 0.
 * Ini penting agar produk jadi bisa dilacak stoknya setelah proses produksi.
 * 
 * @param {number|string} storeId - ID toko.
 * @param {number|string} productId - ID produk jadi.
 * @returns {Promise<void>}
 */
export async function ensureProductInventoryExists(storeId, productId) {
  const existing = await getInventoryRecord(storeId, productId, null);
  
  if (!existing) {
    await createInventoryRecord({
      store_id: storeId,
      product_id: productId,
      raw_material_id: null,
      qty_on_hand: 0,
    });
  }
}

/**
 * Menyesuaikan stok bahan baku berdasarkan delta (selisih antara resep lama dan baru).
 * Delta positif = stok ditambah (bahan baku dikembalikan).
 * Delta negatif = stok dikurangi (bahan baku dipakai).
 * 
 * @param {number|string} storeId - ID toko.
 * @param {number|string} rawMaterialId - ID bahan baku.
 * @param {number} delta - Selisih perubahan stok (bisa positif atau negatif).
 * @returns {Promise<void>}
 */
export async function adjustRawMaterialStock(storeId, rawMaterialId, delta) {
  if (delta === 0) return; // Tidak ada perubahan

  const inventory = await getInventoryRecord(storeId, null, rawMaterialId);

  if (!inventory) {
    throw new Error(`Stok bahan baku untuk ID ${rawMaterialId} belum diinput.`);
  }

  const currentQty = Number(inventory.qty_on_hand || 0);
  const newQty = currentQty - delta; // delta sudah dihitung sebagai pengurangan di service layer

  if (newQty < 0) {
    throw new Error(
      `Stok bahan baku tidak cukup untuk ID ${rawMaterialId}. Tersedia ${currentQty}, dibutuhkan ${Math.abs(delta)}.`
    );
  }

  await updateInventoryQty(inventory.id, newQty);
}