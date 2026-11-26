import { calculateCartTotals } from './cart';

export function createCheckout({ storeId, cartItems, customerName, channel, discount, storeInfo, paymentData }) {
  const { subtotal, discountAmount, platformFee, grandTotal } = calculateCartTotals(cartItems, discount);
  const amountPaid = Number(paymentData.amount_paid ?? grandTotal);
  return {
    requestId: crypto.randomUUID(),
    cartItems: structuredClone(cartItems),
    sale: {
      store_id: storeId, channel, payment_method: paymentData.payment_method,
      subtotal, discount: discountAmount, platform_fee: platformFee, grand_total: grandTotal,
      notes: customerName ? `Customer: ${customerName}` : 'Umum',
      qris_reference: paymentData.reference_number || null,
      qris_status: paymentData.qris_status || null,
      qris_paid_at: paymentData.qris_paid_at || null,
    },
    items: cartItems.map(item => ({
      product_id: item.id, qty: item.qty, unit_price: item.unit_price,
      hpp_snapshot: item.hpp, line_total: item.line_total,
    })),
    receipt: {
      store: storeInfo, customer_name: customerName.trim() || '-',
      items: cartItems.map(item => ({
        name: item.name, qty: item.qty, unit_price: item.unit_price,
        line_total: item.line_total, original_unit_price: item.base_unit_price ?? item.unit_price,
      })),
      amount_paid: amountPaid, change: Math.max(0, amountPaid - grandTotal),
    },
  };
}

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