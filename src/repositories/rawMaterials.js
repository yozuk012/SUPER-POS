import { supabase } from '@/lib/supabase';

/**
 * Helper untuk mendeteksi error akibat kolom metadata pembelian belum ada di database.
 * Ini terjadi jika migrasi SQL untuk kolom purchase_* belum dijalankan.
 */
const isMissingPurchaseMetadata = (error) => (
  /purchase_(unit|quantity|price)/.test(error?.message || '') &&
  (
    error?.code === 'PGRST204' ||
    error?.code === '42703' ||
    error?.status === 400 ||
    /schema cache|column .* not found|could not find/i.test(error?.message || '')
  )
);

/**
 * Mengambil daftar bahan baku berdasarkan ID toko.
 * Mencoba mengambil semua kolom terlebih dahulu. Jika gagal karena kolom purchase_* 
 * belum ada di database, akan fallback ke kolom dasar saja.
 * 
 * @param {number|string} storeId - ID toko.
 * @returns {Promise<Array>} Array data bahan baku.
 */
export async function getRawMaterialsByStoreId(storeId) {
  if (!storeId) {
    throw new Error('Store ID is required to fetch raw materials.');
  }

  // 1. Coba ambil dengan kolom lengkap (termasuk metadata pembelian)
  let { data, error } = await supabase
    .from('raw_materials')
    .select('id, name, unit, cost_per_unit, purchase_unit, purchase_quantity, purchase_price')
    .eq('store_id', storeId)
    .order('name', { ascending: true });

  // 2. Jika error disebabkan oleh kolom yang belum ada, lakukan fallback ke kolom dasar
  if (error && isMissingPurchaseMetadata(error)) {
    const fallbackResult = await supabase
      .from('raw_materials')
      .select('id, name, unit, cost_per_unit')
      .eq('store_id', storeId)
      .order('name', { ascending: true });
    
    data = fallbackResult.data;
    error = fallbackResult.error;
  }

  if (error) throw error;

  return data || [];
}

/**
 * Mengambil detail satu bahan baku berdasarkan ID.
 * @param {number|string} id - ID bahan baku.
 * @returns {Promise<Object|null>} Data bahan baku atau null jika tidak ditemukan.
 */
export async function getRawMaterialById(id) {
  const { data, error } = await supabase
    .from('raw_materials')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  return data;
}

/**
 * Membuat bahan baku baru.
 * @param {Object} rawData - Data bahan baku (wajib: { store_id, name, unit, cost_per_unit }).
 * @returns {Promise<Object>} Data bahan baku yang berhasil dibuat.
 */
export async function createRawMaterial(rawData) {
  const { data, error } = await supabase
    .from('raw_materials')
    .insert(rawData)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Memperbarui data bahan baku.
 * @param {number|string} id - ID bahan baku.
 * @param {Object} updates - Data yang diperbarui.
 * @returns {Promise<Object>} Data bahan baku yang diperbarui.
 */
export async function updateRawMaterial(id, updates) {
  const { data, error } = await supabase
    .from('raw_materials')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Menghapus bahan baku.
 * @param {number|string} id - ID bahan baku yang akan dihapus.
 * @returns {Promise<void>}
 */
export async function deleteRawMaterial(id) {
  const { error } = await supabase
    .from('raw_materials')
    .delete()
    .eq('id', id);

  if (error) throw error;
}