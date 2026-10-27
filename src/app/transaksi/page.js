'use client';

import { useState } from 'react';
import { FiBox, FiShoppingCart } from 'react-icons/fi';
import PageLayout from '@/components/PageLayout';
import useTransaction from '@/hooks/useTransaction';
import TransactionFilters from './components/TransactionFilters';
import TransactionProductGrid from './components/TransactionProductGrid';
import TransactionOrderSummary from './components/TransactionOrderSummary';
import TransactionPaymentModal from './components/TransactionPaymentModal';
import ReceiptModal from './components/ReceiptModal';

export default function TransactionPage() {
  const transaction = useTransaction();
  const [showCart, setShowCart] = useState(false);

  const totalCartItems = transaction.cartItems.reduce((sum, item) => sum + item.qty, 0);

  return (
    <PageLayout title="Transaksi Kasir">

      {/* ═══ HEADER HERO — gradient biru solid ═══ */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-blue-600 via-blue-500 to-blue-400 p-4 sm:p-5 mb-3 shadow-lg shadow-blue-500/30">
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full pointer-events-none" />
        <div className="absolute -bottom-16 -left-12 w-40 h-40 bg-white/5 rounded-full pointer-events-none" />

        <div className="relative flex items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-6 h-6 rounded-md bg-white flex items-center justify-center">
                <svg className="w-3.5 h-3.5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <span className="text-xs font-bold text-white/90 uppercase tracking-wider">
                SuperPOS
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white">Transaksi Kasir</h1>
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

      {/* ═══ TOGGLE MOBILE ═══ */}
      <div className="md:hidden flex gap-2 mb-3">
        <button
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
      <div className="relative overflow-hidden flex flex-col md:flex-row h-[calc(100vh-10rem)] md:h-[calc(100vh-12rem)] bg-gradient-to-br from-white via-blue-50 to-blue-100 rounded-xl shadow-sm border border-blue-200">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 via-blue-500 to-blue-400 z-10" />

        {/* ═══ KIRI — Katalog ═══ */}
        <div className={`${showCart ? 'hidden' : 'flex'} md:flex flex-1 flex-col overflow-hidden pt-1`}>
          <div className="shrink-0 border-b border-blue-200 bg-gradient-to-r from-white to-blue-50">
            <TransactionFilters
              search={transaction.search}
              setSearch={transaction.setSearch}
              channel={transaction.channel}
              setChannel={transaction.setChannel}
              categories={transaction.categories}
              categoryId={transaction.categoryId}
              setCategoryId={transaction.setCategoryId}
              pagination={transaction.pagination}
              setPage={transaction.setPage}
            />
          </div>

          <div className="flex-1 overflow-y-auto bg-gradient-to-b from-white to-blue-50/40">
            <TransactionProductGrid
              products={transaction.products}
              onAddToCart={transaction.addToCart}
              isLoading={transaction.isLoadingProducts}
              channel={transaction.channel}
            />
          </div>
        </div>

        {/* ═══ KANAN — Keranjang ═══ */}
        <div className={`${!showCart ? 'hidden' : 'flex'} md:flex w-full md:w-[400px] bg-white border-t md:border-t-0 md:border-l border-blue-200 flex-col h-full shrink-0 pt-1`}>
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