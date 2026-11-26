export const checkoutStorageKey = (userId, storeId) => `pending-checkout:${userId}:${storeId}`;

export function readPendingCheckout(storage, userId, storeId) {
  const value = storage.getItem(checkoutStorageKey(userId, storeId));
  if (!value) return null;
  let checkout;
  try {
    checkout = JSON.parse(value);
  } catch {
    throw new Error('Data checkout tersimpan tidak dapat dibaca. Periksa histori sebelum membuat transaksi baru.');
  }
  if (!checkout?.requestId || String(checkout.sale?.store_id) !== String(storeId)
    || !Array.isArray(checkout.cartItems) || !checkout.cartItems.length
    || !Array.isArray(checkout.items) || !checkout.items.length || !checkout.receipt) {
    throw new Error('Data checkout tersimpan tidak lengkap. Periksa histori sebelum membuat transaksi baru.');
  }
  return checkout;
}

export function savePendingCheckout(storage, userId, storeId, checkout) {
  storage.setItem(checkoutStorageKey(userId, storeId), JSON.stringify(checkout));
}

export function removePendingCheckout(storage, userId, storeId) {
  storage.removeItem(checkoutStorageKey(userId, storeId));
}