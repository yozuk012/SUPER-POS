// src/app/transection/components/TransactionOrderSummary.jsx
import { FiShoppingCart, FiX, FiCreditCard, FiLock, FiZap } from 'react-icons/fi';
import TransactionQuickDiscount from './TransactionQuickDiscount';
import { formatRupiah } from '@/lib/productUtils';

export default function TransactionOrderSummary({
  cartItems,
  updateQty,
  removeItem,
  clearCart,
  subtotal,
  discount = 0,
  setDiscount,
  grandTotal,
  customerName,
  setCustomerName,
  onCheckout,
  isMainBranch = false,
  storeName = '',
}) {

  return (
    <div className="w-full md:w-[400px] flex flex-col h-full">

      {/* ═══ Header Keranjang ═══ */}
      <div className="p-4 border-b border-blue-200 bg-gradient-to-r from-blue-50 to-blue-100 shrink-0">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <FiShoppingCart className="w-5 h-5 text-blue-600" /> Keranjang
            <span className="text-xs font-bold text-blue-700 bg-white border border-blue-200 px-2 py-0.5 rounded-full">
              {cartItems.length} item
            </span>
          </h2>
          {cartItems.length > 0 && (
            <button
              onClick={clearCart}
              className="text-xs text-red-600 hover:text-red-700 bg-white hover:bg-red-50 px-2 py-1 rounded-md transition-colors font-bold border border-red-200"
            >
              Kosongkan
            </button>
          )}
        </div>

        <div className={`mb-3 flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-[11px] font-semibold ${
          isMainBranch
            ? 'border-green-200 bg-green-50 text-green-700'
            : 'border-blue-200 bg-white text-blue-700'
        }`}>
          {isMainBranch
            ? <FiZap className="h-3.5 w-3.5 shrink-0" />
            : <FiLock className="h-3.5 w-3.5 shrink-0" />}
          <span className="truncate">
            {isMainBranch
              ? `Diskon Cepat aktif di ${storeName || 'Cabang Utama'}`
              : 'Diskon Cepat hanya tersedia di Cabang Utama'}
          </span>
        </div>

        <div className="relative">
          <input
            type="text"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            placeholder="Nama Pelanggan (Opsional)"
            className="block w-full px-3 py-2 bg-white border border-blue-200 rounded-lg text-sm text-slate-700 placeholder-slate-400 focus:ring-2 focus:ring-blue-400 focus:border-blue-500 transition-all outline-none"
          />
        </div>
      </div>

      {/* ═══ List Item ═══ */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gradient-to-b from-white to-blue-50/30">
        {cartItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400 p-4 text-center">
            <div className="bg-blue-100 p-4 rounded-full mb-3">
              <FiShoppingCart className="h-8 w-8 text-blue-400" />
            </div>
            <p className="text-sm font-bold text-slate-700">Keranjang masih kosong</p>
            <p className="text-xs text-slate-500 mt-1">Klik produk di sebelah kiri untuk menambahkan</p>
          </div>
        ) : (
          cartItems.map((item) => {
            return (
            <div key={item.id} className="bg-white p-3 rounded-lg border border-blue-200 hover:border-blue-400 transition-colors shadow-sm">
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1 pr-2">
                  <h4 className="text-sm font-bold text-slate-800 line-clamp-2 leading-tight">
                    {item.name}
                  </h4>
                  <p className="text-xs text-slate-500 mt-1">
                    {item.sku} •{' '}
                    <span className="font-semibold text-blue-700">{formatRupiah(item.unit_price)}</span>/{item.unit}
                    {item.discount_pct > 0 && (
                      <span className="ml-1 text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-bold">
                        -{item.discount_pct}%
                      </span>
                    )}
                    {item.track_stock === false && (
                      <span className="ml-1 text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded font-bold">
                        Stok tanpa batas
                      </span>
                    )}
                  </p>
                </div>
                <button
                  onClick={() => removeItem(item.id)}
                  className="text-slate-400 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-colors"
                  title="Hapus item"
                >
                  <FiX className="h-4 w-4" />
                </button>
              </div>

              <div className="flex justify-between items-center mt-2">
                <div className="flex items-center border border-blue-200 rounded-md bg-white overflow-hidden">
                  <button
                    onClick={() => updateQty(item.id, item.qty - 1)}
                    className="px-3 py-1.5 text-blue-700 hover:bg-blue-50 text-sm font-bold transition-colors"
                  >
                    -
                  </button>
                  <span className="px-3 py-1.5 text-sm font-bold text-slate-800 min-w-[40px] text-center border-x border-blue-200">
                    {item.qty}
                  </span>
                  <button
                    onClick={() => updateQty(item.id, item.qty + 1)}
                    className="px-3 py-1.5 text-blue-700 hover:bg-blue-50 text-sm font-bold transition-colors"
                  >
                    +
                  </button>
                </div>

                <div className="text-right">
                  <p className="text-sm font-bold text-blue-600">
                    {formatRupiah(item.unit_price * item.qty)}
                  </p>
                </div>
              </div>
            </div>
            );
          })
        )}
      </div>

      {/* ═══ Footer: Total & Bayar ═══ */}
      <div className="border-t border-blue-200 p-4 bg-gradient-to-b from-blue-50 to-blue-100 space-y-4 shrink-0">

        <div className="space-y-1.5 text-sm">
          <div className="flex justify-between text-slate-600">
            <span>Subtotal</span>
            <span className="font-semibold">{formatRupiah(subtotal)}</span>
          </div>
          {discount > 0 && (
            <div className="flex justify-between font-semibold text-red-600">
              <span>Diskon Cepat</span>
              <span>-{formatRupiah(discount)}</span>
            </div>
          )}
          {discount > 0 && (
            <div className="flex items-center justify-between rounded-md border border-green-200 bg-green-50 px-2 py-1 text-[11px] text-green-700">
              <span className="font-semibold">Pelanggan hemat</span>
              <span className="font-bold">{formatRupiah(discount)}</span>
            </div>
          )}
        </div>

        {/* Diskon Cepat — satu tombol untuk total transaksi */}
        {isMainBranch && (
          <TransactionQuickDiscount
            subtotal={subtotal}
            discount={discount}
            onApply={setDiscount}
            onClear={() => setDiscount(0)}
            disabled={cartItems.length === 0}
          />
        )}

        <div className="flex justify-between items-center pt-2 border-t border-blue-200">
          <span className="text-base font-bold text-slate-800">Total Harga</span>
          <span className="text-2xl font-extrabold text-blue-600">{formatRupiah(grandTotal)}</span>
        </div>

        <button
          onClick={onCheckout}
          disabled={cartItems.length === 0}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-lg shadow-md shadow-blue-500/30 transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
        >
          <FiCreditCard className="h-5 w-5" />
          Bayar Sekarang
        </button>
      </div>
    </div>
  );
}