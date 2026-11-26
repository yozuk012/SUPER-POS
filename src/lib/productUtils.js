// Parse "Rp 43.000" → 43000
export const parseNumberUI = (val) => {
  if (!val) return 0;
  return Number(String(val).replace(/\D/g, "")) || 0;
};

// Hitung harga setelah diskon. Return null kalau tidak ada diskon.
export const getDiscountedPrice = (basePrice, discountPct) => {
  const pct = parseFloat(discountPct) || 0;
  if (pct <= 0) return null;
  return parseFloat(basePrice) - parseFloat(basePrice) * (pct / 100);
};

export const getRecommendedPrice = (hppPerUnit, marginPct = 50) => {
  const hpp = Number(hppPerUnit) || 0;
  if (hpp <= 0) return 0;
  const margin = Number(marginPct) || 0;
  const calculatedPrice = hpp * (1 + margin / 100);
  return Math.max(Math.round(calculatedPrice / 500), Math.ceil(hpp / 500)) * 500;
};

export const getOnlinePrice = (basePrice, markupPct = 0) => {
  const base = Number(basePrice) || 0;
  const markup = Number(markupPct) || 0;
  const calculatedPrice = base * (1 + markup / 100);
  return Math.ceil(calculatedPrice / 1000) * 1000;
};

/**
 * Terjemahkan input kasir menjadi potongan & harga jual per unit.
 * @returns {{normalPrice:number, discount:number, finalPrice:number, isValid:boolean}}
 *          isValid = false kalau potongan melebihi harga normal.
 */
export const resolveQuickDiscount = ({
  normalPrice = 0,
  value = 0,
} = {}) => {
  const normal = Math.max(0, Math.round(Number(normalPrice) || 0));
  const input = Math.max(0, Math.round(Number(value) || 0));
  const discount = input;
  const finalPrice = normal - discount;

  return {
    normalPrice: normal,
    discount,
    finalPrice,
    isValid: discount >= 0 && discount <= normal,
  };
};

// Batasi nominal potongan agar tidak minus dan tidak melebihi harga normal.
export const clampQuickDiscount = (amount, normalPrice) => {
  const normal = Math.max(0, Math.round(Number(normalPrice) || 0));
  const value = Math.round(Number(amount) || 0);
  return Math.min(Math.max(value, 0), normal);
};

/**
 * "Stok tanpa batas" = kolom `products.track_stock` bernilai false.
 *
 * Dipakai untuk menonaktifkan pelacakan stok sebuah produk:
 *   - kasir tidak dibatasi stok (produk tetap bisa dijual walau stok 0),
 *   - stok tidak dikurangi otomatis setelah transaksi berhasil.
 *
 * Produk lama yang belum punya kolom `track_stock` dianggap tetap dilacak
 * (true), sehingga perilaku lamanya tidak berubah.
 */
export const isStockUnlimited = (product) => product?.track_stock === false;

export async function deleteProductRecord(supabase, id, storeId) {
  if (!storeId) throw new Error('Toko produk tidak ditemukan.');

  // Biarkan database menangani relasi dalam satu operasi, agar kegagalan tidak menghapus sebagian data.
  const { data, error } = await supabase
    .from('products')
    .delete()
    .eq('id', id)
    .eq('store_id', storeId)
    .select('image_url')
    .maybeSingle();

  if (error?.code === '23503') {
    throw new Error('Produk masih terkait dengan data lain dan tidak bisa dihapus. Nonaktifkan produk di halaman Produk agar tidak muncul di kasir.');
  }
  if (error) throw error;
  if (!data) throw new Error('Produk tidak ditemukan atau Anda tidak memiliki izin untuk menghapusnya.');

  return data;
}

/**
 * Deteksi error Postgres/PostgREST karena kolom belum ada di database —
 * misalnya saat migrasi `products.track_stock` belum dijalankan.
 *
 * Dipakai sebagai jalur cadangan supaya aplikasi tetap berfungsi (menyimpan
 * produk tanpa kolom tersebut) sambil memberi tahu pengguna untuk menjalankan
 * SQL migrasi.
 */
export const isMissingColumnError = (error, column) => {
  if (!error || !column) return false;

  const code = String(error.code || '');
  // 42703 = undefined_column (Postgres), PGRST204 = kolom tidak dikenal PostgREST.
  if (code === '42703' || code === 'PGRST204') return true;

  const message = `${error.message || ''} ${error.details || ''}`.toLowerCase();
  if (!message.includes(String(column).toLowerCase())) return false;

  return message.includes('does not exist') || message.includes('schema cache');
};
