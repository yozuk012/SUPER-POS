import { supabase } from '@/lib/supabase';

/**
 * Mengambil data resep berdasarkan ID produk.
 * Digunakan untuk mengecek apakah resep sudah ada sebelum melakukan insert/update.
 * 
 * @param {number|string} productId - ID produk jadi.
 * @returns {Promise<Object|null>} Data resep atau null jika tidak ditemukan.
 */
export async function getRecipeByProductId(productId) {
  const { data, error } = await supabase
    .from('recipes')
    .select('*')
    .eq('product_id', productId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

/**
 * Mengambil daftar bahan baku (ingredients) untuk sebuah resep tertentu.
 * Digunakan untuk menghitung delta stok sebelum bahan lama dihapus.
 * 
 * @param {number|string} recipeId - ID resep.
 * @returns {Promise<Array>} Array data bahan baku resep.
 */
export async function getRecipeIngredients(recipeId) {
  const { data, error } = await supabase
    .from('recipe_ingredients')
    .select('raw_material_id, qty_needed, unit')
    .eq('recipe_id', recipeId);

  if (error) throw error;
  return data || [];
}

/**
 * Membuat atau memperbarui data header resep (Upsert).
 * Karena kolom `product_id` di tabel `recipes` bersifat UNIQUE, 
 * kita bisa menggunakan fitur upsert dengan onConflict: 'product_id'.
 * 
 * @param {Object} recipeData - Data resep (wajib: { product_id, total_hpp, yield_qty, total_yield, effective_date, notes }).
 * @returns {Promise<Object>} Data resep yang berhasil disimpan (termasuk ID).
 */
export async function upsertRecipe(recipeData) {
  const { data, error } = await supabase
    .from('recipes')
    .upsert(recipeData, { onConflict: 'product_id' })
    .select('id, product_id')
    .single();

  if (error) throw error;
  return data;
}

/**
 * Menghapus semua detail bahan baku (ingredients) dari sebuah resep.
 * Biasanya dipanggil sebelum melakukan insert bahan baku baru saat mode update,
 * untuk mencegah duplikasi atau data lama yang tidak relevan.
 * 
 * @param {number|string} recipeId - ID resep yang akan dibersihkan bahan bakunya.
 * @returns {Promise<void>}
 */
export async function deleteRecipeIngredients(recipeId) {
  const { error } = await supabase
    .from('recipe_ingredients')
    .delete()
    .eq('recipe_id', recipeId);

  if (error) throw error;
}

/**
 * Menyimpan detail bahan baku baru ke dalam sebuah resep (Bulk Insert).
 * 
 * @param {Array<Object>} ingredientsPayload - Array objek bahan baku 
 *   (format: { recipe_id, raw_material_id, qty_needed, unit }).
 * @returns {Promise<void>}
 */
export async function insertRecipeIngredients(ingredientsPayload) {
  if (!ingredientsPayload || ingredientsPayload.length === 0) {
    return; // Tidak ada yang perlu di-insert (misal: mode cepat)
  }

  const { error } = await supabase
    .from('recipe_ingredients')
    .insert(ingredientsPayload);

  if (error) throw error;
}