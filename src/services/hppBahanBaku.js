import { supabase } from '@/lib/supabase';
import { 
  getProductByNameAndStore, 
  upsertProduct,
  updateProductHpp,
} from '@/repositories/products';
import { 
  getRecipeByProductId, 
  getRecipeIngredients, 
  upsertRecipe, 
  deleteRecipeIngredients, 
  insertRecipeIngredients 
} from '@/repositories/recipes';
import { 
  ensureProductInventoryExists, 
  getInventoryRecord, 
  updateInventoryQty 
} from '@/repositories/inventory';
import { 
  calculateHppSejati, 
  calculateSafeBasePrice, 
  calculateStockDelta 
} from '@/lib/hppCalculations';
import { convertToBaseQuantity } from '@/lib/rawMaterialUtils';
import { getOnlinePrice } from '@/lib/productUtils';

/**
 * Mengorkestrasi seluruh proses penyimpanan data HPP Bahan Baku & Resep.
 * 
 * Alur Kerja:
 * 1. Validasi & Kalkulasi HPP Sejati + Harga Jual Aman (Margin 50%).
 * 2. Upsert Produk (Update jika ada, Insert jika baru) + Auto-update harga online.
 * 3. Pastikan record inventory untuk produk jadi sudah ada.
 * 4. Upsert Resep (Header) & Ingredients (Detail).
 * 5. Adjust stok bahan baku berdasarkan delta (selisih resep lama vs baru).
 * 
 * @param {Object} formData - Data dari form HPP (namaProduk, hppPerProduk, totalBiayaOperasional, jumlahProduk, dll).
 * @param {number|string} storeId - ID toko aktif.
 * @returns {Promise<{ success: boolean, message: string, productId: number, recipeId: number }>}
 */
export async function processHppSubmission(formData, storeId) {
  if (!storeId) {
    throw new Error('Toko aktif tidak ditemukan.');
  }

  // ==========================================
  // 1. VALIDASI & KALKULASI
  // ==========================================
  const calculatedHpp = Math.round(Number(formData.hppPerProduk));
  if (!calculatedHpp || calculatedHpp <= 0) {
    throw new Error('HPP per produk harus lebih dari 0.');
  }

  const totalBiayaOperasional = Number(formData.totalBiayaOperasional) || 0;
  const jumlahProduk = Number(formData.jumlahProduk) || 1;
  
  // Hitung HPP Sejati dan Harga Jual Aman (Margin 50%)
  const hppSejatiRounded = calculateHppSejati(calculatedHpp, totalBiayaOperasional, jumlahProduk);
  const safeBasePrice = calculateSafeBasePrice(hppSejatiRounded, formData.hargaRekomendasi, 50);

  // ==========================================
  // 2. UPSERT PRODUK
  // ==========================================
  let productId = null;
  const existingProduct = await getProductByNameAndStore(formData.namaProduk, storeId);

  if (existingProduct) {
    productId = existingProduct.id;
    
    // Update produk yang sudah ada
    await updateProductHpp(productId, {
      hpp: calculatedHpp,
      base_price: safeBasePrice,
      category_id: formData.categoryId ? parseInt(formData.categoryId, 10) : null
    });

    // Auto-update harga online jika produk memiliki markup online
    if (existingProduct.online_markup_pct > 0) {
      const newOnlinePrice = getOnlinePrice(safeBasePrice, existingProduct.online_markup_pct);
      const onlinePriceRecord = existingProduct.product_prices?.find(pp => pp.channel === 'online');

      if (onlinePriceRecord) {
        const { error: updatePriceError } = await supabase
          .from('product_prices')
          .update({ price: newOnlinePrice })
          .eq('id', onlinePriceRecord.id);
        
        if (updatePriceError) {
          console.error('Gagal update harga online:', updatePriceError);
          // Tidak throw error agar proses HPP tetap berhasil disimpan
        }
      } else {
        const { error: insertPriceError } = await supabase
          .from('product_prices')
          .insert({
            product_id: productId,
            channel: 'online',
            price: newOnlinePrice,
            platform_fee_pct: 0,
          });
        
        if (insertPriceError) {
          console.error('Gagal insert harga online:', insertPriceError);
        }
      }
    }
  } else {
    // Buat produk baru dengan smart defaults
    const cleanName = formData.namaProduk.replace(/\s+/g, '').toUpperCase();
    const prefix = cleanName.substring(0, 3) || 'PRD';
    const uniqueId = Date.now().toString().slice(-6);
    const autoSku = `${prefix}-${uniqueId}`;
    
    const newProduct = await upsertProduct({
      store_id: storeId,
      category_id: formData.categoryId ? parseInt(formData.categoryId, 10) : null,
      name: formData.namaProduk,
      sku: autoSku,
      type: 'finished_good',
      hpp: calculatedHpp,
      base_price: safeBasePrice,
      is_active: true,
      unit: formData.satuanProduk || 'pcs'
    });
    productId = newProduct.id;
  }

  // ==========================================
  // 3. PASTIKAN INVENTORY PRODUK JADI ADA
  // ==========================================
  await ensureProductInventoryExists(storeId, productId);

  // ==========================================
  // 4. UPSERT RESEP & INGREDIENTS
  // ==========================================
  const existingRecipe = await getRecipeByProductId(productId);
  let previousIngredients = [];
  
  if (existingRecipe) {
    previousIngredients = await getRecipeIngredients(existingRecipe.id);
  }

  const totalHppBahanBakuBatch = Math.round(calculatedHpp * jumlahProduk);
  const today = new Date().toISOString().split('T')[0];
  const isQuickMode = formData.modeInput === 'cepat';
  const catatanResep = (formData.catatanResep || '').trim();
  const defaultCatatan = isQuickMode
    ? 'HPP mode cepat (akumulasi modal) - rincian bahan baku tidak dicatat'
    : null;

  const recipeData = {
    product_id: productId,
    total_hpp: totalHppBahanBakuBatch,
    yield_qty: jumlahProduk,
    total_yield: Number(formData.totalYield) || jumlahProduk,
    effective_date: today,
    notes: catatanResep || defaultCatatan || (existingRecipe ? 'Resep bahan baku diperbarui' : 'Resep bahan baku baru')
  };

  // Upsert akan otomatis mengupdate jika product_id sudah ada, atau insert jika belum
  const savedRecipe = await upsertRecipe(recipeData);
  const recipeId = savedRecipe.id;

  // Jika update, hapus ingredients lama dulu untuk mencegah duplikasi
  if (existingRecipe) {
    await deleteRecipeIngredients(recipeId);
  }

  // Insert ingredients baru (dilewati jika mode cepat)
  const ingredientsPayload = (formData.bahanBakuList || []).map(bahan => ({
    recipe_id: recipeId,
    raw_material_id: parseInt(bahan.raw_material_id, 10),
    qty_needed: parseFloat(bahan.qty_needed),
    unit: bahan.unit
  }));

  if (ingredientsPayload.length > 0) {
    await insertRecipeIngredients(ingredientsPayload);
  }

  // ==========================================
  // 5. ADJUST STOK BAHAN BAKU (DELTA)
  // ==========================================
  // Hitung selisih kebutuhan antara resep lama dan baru
  const stockChanges = calculateStockDelta(previousIngredients, ingredientsPayload, convertToBaseQuantity);

  for (const [rawMaterialId, change] of stockChanges.entries()) {
    if (change === 0) continue; // Tidak ada perubahan, skip

    const inventory = await getInventoryRecord(storeId, null, rawMaterialId);
    if (!inventory) {
      throw new Error(`Stok bahan baku untuk ID ${rawMaterialId} belum diinput di inventaris.`);
    }

    const currentQty = Number(inventory.qty_on_hand || 0);
    
    // Logika Delta:
    // change > 0 : Kebutuhan baru lebih besar dari lama -> Stok harus DIKURANGI
    // change < 0 : Kebutuhan baru lebih kecil dari lama -> Stok harus DITAMBAH (dikembalikan)
    const newQty = currentQty - change;

    if (newQty < 0) {
      throw new Error(
        `Stok bahan baku tidak cukup untuk ID ${rawMaterialId}. ` +
        `Tersedia: ${currentQty}, Dibutuhkan penyesuaian: ${Math.abs(change)}.`
      );
    }

    await updateInventoryQty(inventory.id, newQty);
  }

  return {
    success: true,
    message: 'HPP Bahan Baku berhasil dihitung dan disimpan dengan harga jual yang aman (Margin 50%)!',
    productId,
    recipeId
  };
}