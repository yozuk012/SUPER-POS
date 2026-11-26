'use client';

import { useState } from 'react';
import { FiBox, FiShoppingCart } from 'react-icons/fi';
import PageLayout from '@/components/PageLayout';
import useTransaction from '@/hooks/transactions/useTransaction';
import TransactionFilters from './components/TransactionFilters';
import TransactionPagination from './components/TransactionPagination';
import TransactionProductGrid from './components/TransactionProductGrid';
import TransactionOrderSummary from './components/TransactionOrderSummary';
import TransactionPaymentModal from './components/TransactionPaymentModal';
import ReceiptModal from './components/ReceiptModal';

export default function TransactionPage() {
  const transaction = useTransaction();
  const [showCart, setShowCart] = useState(false);

  const totalCartItems = transaction.cartItems.reduce((sum, item) => sum + item.qty, 0);

  return (
    <PageLayout title="Transaksi Kasir" contentClassName="min-w-0 flex-1 p-2 sm:p-3 xl:p-6">
      <div className="flex min-w-0 flex-col xl:h-[calc(100dvh-3rem)] xl:min-h-[40rem]">

      {/* ═══ HEADER HERO — gradient biru solid ═══ */}
      <div className="relative mb-3 hidden shrink-0 overflow-hidden rounded-xl bg-gradient-to-br from-blue-600 via-blue-500 to-blue-400 px-4 py-3 shadow-lg shadow-blue-500/30 md:block">
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full pointer-events-none" />
        <div className="absolute -bottom-16 -left-12 w-40 h-40 bg-white/5 rounded-full pointer-events-none" />

        <div className="relative flex items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-white">Transaksi Kasir</h1>
            <p className="text-blue-50 text-xs mt-0.5">
              Pilih produk dan proses pembayaran pelanggan.
            </p>
          </div>

          {/* Info ringkas keranjang di header */}
          <div className="hidden sm:flex items-center gap-2 bg-white text-blue-700 px-3 py-2 rounded-lg shadow-sm">
            <FiShoppingCart className="w-4 h-4" />
            <span className="font-bold text-sm">{totalCartItems} item</span>
          </div>
        </div>
      </div>

      {transaction.checkoutError && (
        <div role="alert" className="mb-3 shrink-0 rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-900">
          <p>{transaction.checkoutError}</p>
          {!transaction.pendingCheckout && !transaction.storageBlocked && (
            <button type="button" onClick={transaction.clearCheckoutError} className="mt-2 font-bold underline">Tutup Pesan</button>
          )}
        </div>
      )}

      {transaction.pendingCheckout && (
        <div role="status" className="mb-3 shrink-0 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
          <p>Ada transaksi yang belum mendapat konfirmasi. Periksa dan lanjutkan transaksi ini sebelum membuat pembayaran baru. Jangan meminta pelanggan membayar lagi.</p>
          <button
            type="button"
            disabled={transaction.isProcessing}
            onClick={() => transaction.confirmPayment()}
            className="mt-2 rounded-lg bg-amber-800 px-4 py-2 font-bold text-white disabled:opacity-50"
          >
            {transaction.isProcessing ? 'Memeriksa Transaksi...' : 'Periksa & Lanjutkan Transaksi'}
          </button>
        </div>
      )}

      {/* ═══ TOGGLE MOBILE ═══ */}
      <div className="mb-2 flex shrink-0 gap-2 xl:hidden">
        <button
          type="button"
          aria-pressed={!showCart}
          onClick={() => setShowCart(false)}
          className={`flex-1 py-2.5 rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2 ${
            !showCart
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30'
              : 'bg-white text-slate-600 border border-blue-200'
          }`}
        >
          <FiBox className="w-5 h-5" />
          <span>Produk</span>
        </button>
        <button
          type="button"
          aria-pressed={showCart}
          onClick={() => setShowCart(true)}
          className={`flex-1 py-2.5 rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2 relative ${
            showCart
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30'
              : 'bg-white text-slate-600 border border-blue-200'
          }`}
        >
          <FiShoppingCart className="w-5 h-5" />
          <span>Keranjang</span>
          {totalCartItems > 0 && (
            <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center border-2 border-white shadow-sm">
              {totalCartItems}
            </span>
          )}
        </button>
      </div>

      {/* ═══ MAIN POS CONTAINER ═══ */}
      <div className="relative flex min-h-0 min-w-0 flex-1 flex-col rounded-xl border border-blue-200 bg-gradient-to-br from-white via-blue-50 to-blue-100 shadow-sm xl:flex-row xl:overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 via-blue-500 to-blue-400 z-10" />

        {/* ═══ KIRI — Katalog ═══ */}
        <div className={`${showCart ? 'hidden' : 'flex'} min-h-0 min-w-0 flex-1 flex-col pt-1 xl:flex`}>
          <div className="@container shrink-0 rounded-t-xl border-b border-blue-200 bg-gradient-to-r from-white to-blue-50">
            <TransactionFilters
              search={transaction.search}
              setSearch={transaction.setSearch}
              channel={transaction.channel}
              setChannel={transaction.setChannel}
              categories={transaction.categories}
              categoryId={transaction.categoryId}
              setCategoryId={transaction.setCategoryId}
              setPage={transaction.setPage}
            />
          </div>

          <div className="min-h-0 flex-1 bg-gradient-to-b from-white to-blue-50/40 xl:overflow-y-auto">
            <TransactionProductGrid
              products={transaction.products}
              onAddToCart={transaction.addToCart}
              isLoading={transaction.isLoadingProducts}
              channel={transaction.channel}
            />
          </div>
          <TransactionPagination
            pagination={transaction.pagination}
            pageSize={transaction.limit}
            setPage={transaction.setPage}
          />
        </div>

        {/* ═══ KANAN — Keranjang ═══ */}
        <div className={`${!showCart ? 'hidden' : 'flex'} min-h-[calc(100dvh-9rem)] min-w-0 w-full shrink-0 flex-col rounded-xl bg-white pt-1 xl:flex xl:min-h-0 xl:w-80 xl:rounded-l-none xl:border-l xl:border-blue-200 2xl:w-90`}>
          <TransactionOrderSummary
            cartItems={transaction.cartItems}
            updateQty={transaction.updateQty}
            removeItem={transaction.removeItem}
            clearCart={transaction.clearCart}
            subtotal={transaction.subtotal}
            discount={transaction.discount}
            setDiscount={transaction.setDiscount}
            grandTotal={transaction.grandTotal}
            customerName={transaction.customerName}
            setCustomerName={transaction.setCustomerName}
            onCheckout={transaction.handleCheckout}
            isMainBranch={transaction.isMainBranch}
            storeName={transaction.storeName}
          />
        </div>
      </div>
      </div>

      <TransactionPaymentModal
        isOpen={transaction.isPaymentModalOpen}
        onClose={transaction.closePaymentModal}
        grandTotal={transaction.grandTotal}
        customerName={transaction.customerName}
        channel={transaction.channel}
        storeQrisUrl={transaction.storeQrisUrl}
        storeInfo={transaction.storeInfo}
        onConfirmPayment={transaction.confirmPayment}
      />

      {transaction.receiptData && (
        <ReceiptModal
          receiptData={transaction.receiptData}
          onClose={transaction.finishReceipt}
        />
      )}
    </PageLayout>
  );
}