// Simpan sebelum mengirim RPC: respons jaringan yang hilang belum berarti rollback.
export const checkoutStorageKey = (userId, storeId) => `pending-checkout:${userId}:${storeId}`;

export async function submitCheckout(client, checkout) {
  const { data, error } = await client.rpc('checkout_sale', {
    p_request_id: checkout.requestId,
    p_sale: checkout.sale,
    p_items: checkout.items,
  });

  if (error) {
    const failure = new Error(error.code === 'PGRST202'
      ? 'Fungsi checkout belum tersedia. Jalankan migrasi checkout_sale pada schema aplikasi terlebih dahulu.'
      : error.message || 'Respons transaksi belum diterima.');
    // Error SQL berarti seluruh RPC di-rollback. Error jaringan tetap ambigu.
    failure.rolledBack = /^(P0001|22\w{3}|23\w{3}|42501|42883|PGRST202)$/.test(error.code || '');
    throw failure;
  }

  if (!data?.id || !data?.sale_date) {
    throw new Error('Status transaksi belum dapat dipastikan. Silakan periksa kembali.');
  }
  return data;
}

export function buildCheckoutReceipt(checkout, sale) {
  return {
    ...checkout.receipt,
    transaction_id: `TRX-${sale.id}`,
    date: new Date(sale.sale_date).toLocaleString('id-ID', {
      day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
    }),
    subtotal: Number(sale.subtotal),
    discount: Number(sale.discount),
    grand_total: Number(sale.grand_total),
    total_savings: Number(sale.discount),
    change: Math.max(0, checkout.receipt.amount_paid - Number(sale.grand_total)),
    payment_method: sale.payment_method,
  };
}