/**
 * hppCalculations.js
 * 
 * Berisi fungsi-fungsi kalkulasi murni (pure functions) untuk modul HPP.
 * Tidak memiliki side-effect (tidak memanggil database atau mengubah state global),
 * sehingga sangat mudah di-unit test dan bisa dipakai ulang di modul lain.
 */

/**
 * Menghitung HPP Sejati per unit produk.
 * HPP Sejati = HPP Bahan Baku per unit + (Total Biaya Operasional / Jumlah Produk)
 * 
 * @param {number} hppBahanBakuPerUnit - HPP murni dari bahan baku per 1 unit produk.
 * @param {number} [totalBiayaOperasional=0] - Total biaya operasional (listrik, gas, tenaga kerja, dll).
 * @param {number} [jumlahProduk=1] - Jumlah total unit produk yang dihasilkan dalam batch ini.
 * @returns {number} HPP Sejati per unit (dibulatkan ke bilangan bulat terdekat).
 */
export function calculateHppSejati(hppBahanBakuPerUnit, totalBiayaOperasional = 0, jumlahProduk = 1) {
  const hppBahan = Number(hppBahanBakuPerUnit) || 0;
  const biayaOperasional = Number(totalBiayaOperasional) || 0;
  const qtyProduk = Number(jumlahProduk) || 1;

  const hppSejatiPerUnit = hppBahan + (biayaOperasional / qtyProduk);
  return Math.round(hppSejatiPerUnit);
}

/**
 * Menghitung harga jual dasar yang aman berdasarkan HPP Sejati.
 * Secara default menggunakan Margin 50% di atas HPP Sejati untuk memastikan UMKM tidak rugi.
 * Jika user memberikan input harga rekomendasi manual yang valid, input tersebut yang akan dipakai.
 * 
 * @param {number} hppSejati - HPP Sejati per unit yang sudah dihitung.
 * @param {number|null} [hargaRekomendasiInput=null] - Harga rekomendasi manual dari user (opsional).
 * @param {number} [marginPct=50] - Persentase margin keamanan (default 50%).
 * @returns {number} Harga jual dasar yang aman (dibulatkan ke bilangan bulat terdekat).
 */
export function calculateSafeBasePrice(hppSejati, hargaRekomendasiInput = null, marginPct = 50) {
  // Jika user memberikan input harga rekomendasi yang valid, gunakan itu
  if (hargaRekomendasiInput !== null && Number.isFinite(Number(hargaRekomendasiInput))) {
    return Math.round(Number(hargaRekomendasiInput));
  }

  // Fallback: Hitung otomatis dengan Margin Keamanan (default 50% di atas HPP)
  // Rumus: Harga = HPP + (HPP * 50%) = HPP * 1.5
  const safePrice = hppSejati * (1 + marginPct / 100);
  return Math.round(safePrice);
}

/**
 * Menghitung selisih (delta) kebutuhan stok bahan baku antara resep lama dan resep baru.
 * 
 * Logika Delta:
 * - Delta Positif (+): Resep baru membutuhkan bahan lebih banyak -> Stok perlu DIKURANGI.
 * - Delta Negatif (-): Resep baru membutuhkan bahan lebih sedikit -> Stok perlu DITAMBAHKAN (dikembalikan).
 * - Delta Nol (0): Tidak ada perubahan kebutuhan -> Stok tidak perlu disentuh.
 * 
 * @param {Array<Object>} previousIngredients - Array bahan baku lama { raw_material_id, qty_needed, unit }.
 * @param {Array<Object>} newIngredients - Array bahan baku baru { raw_material_id, qty_needed, unit }.
 * @param {Function} convertToBaseQuantity - Fungsi utilitas untuk mengonversi qty ke satuan dasar (misal: gram -> kg).
 * @returns {Map<number, number>} Map dengan key: raw_material_id, value: delta perubahan stok.
 */
export function calculateStockDelta(previousIngredients, newIngredients, convertToBaseQuantity) {
  const stockChanges = new Map();

  // 1. Kurangi stok berdasarkan pemakaian resep lama 
  // (Ini akan "dikembalikan" sebagian jika resep baru ternyata lebih sedikit)
  previousIngredients.forEach((ingredient) => {
    const materialId = Number(ingredient.raw_material_id);
    const baseQty = convertToBaseQuantity(ingredient.qty_needed, ingredient.unit);
    stockChanges.set(materialId, (stockChanges.get(materialId) || 0) - baseQty);
  });

  // 2. Tambah kebutuhan stok berdasarkan resep baru
  newIngredients.forEach((ingredient) => {
    const materialId = Number(ingredient.raw_material_id);
    const baseQty = convertToBaseQuantity(ingredient.qty_needed, ingredient.unit);
    stockChanges.set(materialId, (stockChanges.get(materialId) || 0) + baseQty);
  });

  return stockChanges;
}

