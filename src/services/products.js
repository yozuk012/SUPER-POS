import { supabase, uploadFile } from '@/lib/supabase';
import { getOnlinePrice, isMissingColumnError } from '@/lib/productUtils';
import { upsertProduct, updateProductById } from '@/repositories/products';

/**
 * Menghapus gambar dari storage Supabase.
 */
export const deleteImageFromStorage = async (imageUrl) => {
  if (!imageUrl) return;
  try {
    const url = new URL(imageUrl);
    const pathParts = url.pathname.split('/product-toko/'); 
    if (pathParts.length > 1) {
      const filePath = `product-toko/${pathParts[1]}`; 
      const { error } = await supabase.storage.from('UMKM-POS').remove([filePath]);
      if (error) console.warn('Gagal hapus gambar lama:', error.message);
    }
  } catch (err) {
    console.error('Error parsing image URL for deletion:', err);
  }
};

/**
 * Mengecek apakah file gambar masih dipakai oleh produk lain.
 */
export const isImageStillUsed = async (imageUrl, excludeProductId = null) => {
  if (!imageUrl) return false;
  try {
    let query = supabase
      .from('products')
      .select('id', { count: 'exact', head: true })
      .eq('image_url', imageUrl);

    if (excludeProductId) {
      query = query.neq('id', excludeProductId);
    }

    const { count, error } = await query;
    if (error) {
      console.warn('Gagal memeriksa pemakaian gambar:', error.message);
      return true; // Anggap masih dipakai agar file tidak terhapus (safe fallback)
    }

    return (count || 0) > 0;
  } catch (err) {
    console.warn('Gagal memeriksa pemakaian gambar:', err.message);
    return true;
  }
};

/**
 * Orkestrasi penyimpanan detail produk (Termasuk gambar, harga online, dan stok).
 */
export async function saveProductDetails({ 
  formData, 
  existingImageUrl, 
  editingId, 
  stockVal, 
  basePrice, 
  discountPct, 
  onlineMarkupPct, 
  stockTracked, 
  supportsStockTracking 
}) {
  let finalImageUrl = existingImageUrl;

  // 1. Handle Upload / Hapus Gambar
  if (formData.image_file) {
    if (existingImageUrl && !(await isImageStillUsed(existingImageUrl, editingId))) {
      await deleteImageFromStorage(existingImageUrl);
    } 
    
    const fileName = `prod-${Date.now()}-${formData.image_file.name.replace(/\s/g, '-')}`;
    const uploadResult = await uploadFile(formData.image_file, 'product-toko', fileName);
    if (!uploadResult.success) throw new Error('Gagal upload foto: ' + uploadResult.error);
    finalImageUrl = uploadResult.url;
  }

  // 2. Siapkan Payload Produk (BUG base_price: 0 sudah diperbaiki di sini)
  const productPayload = {
    store_id: parseInt(formData.store_id, 10),
    category_id: parseInt(formData.category_id, 10),
    name: formData.name.trim(),
    sku: formData.sku.trim() || `SKU-${Date.now()}`,
    type: 'finished_good',
    unit: formData.unit,
    base_price: basePrice, // <-- Diperbaiki: selalu gunakan basePrice, jangan 0
    image_url: finalImageUrl,
    is_active: formData.is_active !== false,
    online_markup_pct: formData.is_online ? onlineMarkupPct : 0,
    discount_pct: discountPct,
    track_stock: stockTracked,
  };

  // 3. Simpan Produk via Repository (dengan fallback jika kolom track_stock belum ada)
  const buildProductPayload = (includeTrackStock) => {
    const { track_stock, ...basePayload } = productPayload;
    return includeTrackStock ? { ...basePayload, track_stock } : basePayload;
  };

  let savedProduct;
  const saveProduct = (includeTrackStock) => editingId
    ? updateProductById(editingId, buildProductPayload(includeTrackStock))
    : upsertProduct(buildProductPayload(includeTrackStock));

  try {
    savedProduct = await saveProduct(supportsStockTracking);
  } catch (error) {
    if (!supportsStockTracking || !isMissingColumnError(error, 'track_stock')) {
      throw new Error(`Gagal ${editingId ? 'update' : 'insert'} produk: ${error.message}`);
    }

    supportsStockTracking = false;
    try {
      savedProduct = await saveProduct(false);
    } catch (fallbackError) {
      throw new Error(`Gagal ${editingId ? 'update' : 'insert'} produk: ${fallbackError.message}`);
    }
  }

  const productId = editingId || savedProduct?.id;
  if (!productId) throw new Error('ID produk tidak ditemukan setelah menyimpan produk.');

  // 4. Handle Product Prices (Channel Online)
  const { data: existingOnlinePrice } = await supabase
    .from('product_prices')
    .select('id')
    .eq('product_id', productId)
    .eq('channel', 'online')
    .maybeSingle();

  const shouldHaveOnlinePrice = formData.is_online || (existingOnlinePrice && onlineMarkupPct > 0);

  if (shouldHaveOnlinePrice) {
    const onlinePrice = getOnlinePrice(basePrice, onlineMarkupPct);
    const onlinePricePayload = {
      product_id: productId,
      channel: 'online',
      price: onlinePrice,
      platform_fee_pct: 0,
    };

    const { error: onlinePriceError } = existingOnlinePrice
      ? await supabase.from('product_prices').update(onlinePricePayload).eq('id', existingOnlinePrice.id)
      : await supabase.from('product_prices').insert(onlinePricePayload);

    if (onlinePriceError) throw new Error('Gagal menyimpan harga online: ' + onlinePriceError.message);
  } else if (existingOnlinePrice) {
    const { error: onlinePriceError } = await supabase
      .from('product_prices')
      .delete()
      .eq('id', existingOnlinePrice.id);

    if (onlinePriceError) throw new Error('Gagal menghapus harga online: ' + onlinePriceError.message);
  }

  // 5. Handle Inventory (Stok)
  const { data: existingInv } = await supabase
    .from('inventory')
    .select('id')
    .eq('product_id', productId)
    .maybeSingle();

  const inventoryPayload = {
    store_id: parseInt(formData.store_id, 10),
    product_id: productId,
    qty_on_hand: stockVal, // Akan bernilai 0 jika stockTracked === false
    last_updated: new Date().toISOString(),
  };

  if (existingInv) {
    const { error } = await supabase.from('inventory').update(inventoryPayload).eq('id', existingInv.id);
    if (error) throw new Error('Gagal update stok: ' + error.message);
  } else {
    const { error } = await supabase.from('inventory').insert(inventoryPayload);
    if (error) throw new Error('Gagal insert stok: ' + error.message);
  }

  return { supportsStockTracking, productId };
}