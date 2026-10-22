"use client";

import Image from 'next/image';
import { FaGlobe, FaStore, FaExclamation } from "react-icons/fa";

export default function TransactionProductGrid({
  products,
  onAddToCart,
  isLoading,
  channel = 'all'
}) {
  const formatRupiah = (number) => {
    if (number === null || number === undefined || isNaN(number)) return "Rp 0";
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(number);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600"></div>
          <p className="text-sm text-blue-600 font-semibold">Memuat produk...</p>
        </div>
      </div>
    );
  }

  if (!products || products.length === 0) {
    return (
      <div className="flex flex-col justify-center items-center h-64 text-slate-500 bg-gradient-to-br from-white to-blue-50 rounded-lg m-4 border-2 border-dashed border-blue-200">
        <div className="bg-blue-100 p-4 rounded-full mb-3">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
        </div>
        <p className="text-base font-bold text-slate-800">Tidak ada produk ditemukan</p>
        <p className="text-sm text-slate-500 mt-1 text-center px-4">
          Coba ubah filter atau tambahkan produk baru.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 p-4">
      {products.map((product) => {
        const prices = Array.isArray(product.product_prices) ? product.product_prices : [];
        let displayPrice = Number(product.base_price) || 0;
        let isOnlineMode = false;

        if (channel === 'online') {
          const onlinePriceData = prices.find(p => {
            const cleanChannel = p?.channel ? String(p.channel).toLowerCase().trim() : '';
            return ['online', 'shopee', 'tokopedia', 'grabmart', 'gojek'].includes(cleanChannel);
          });
          if (onlinePriceData) {
            displayPrice = Number(onlinePriceData.price) || displayPrice;
            isOnlineMode = true;
          }
        } else {
          const offlinePriceData = prices.find(p => {
            const cleanChannel = p?.channel ? String(p.channel).toLowerCase().trim() : '';
            return cleanChannel === 'offline';
          });
          if (offlinePriceData) {
            displayPrice = Number(offlinePriceData.price) || displayPrice;
          }
          isOnlineMode = false;
        }

        const discountPct = Number(product.discount_pct) || 0;
        const hasDiscount = discountPct > 0;
        const finalPrice = hasDiscount
          ? Math.round(displayPrice - (displayPrice * (discountPct / 100)))
          : displayPrice;

        const stock = product.stock || 0;
        const isOutOfStock = stock === 0;
        const isLowStock = stock > 0 && stock <= 10;

        return (
          <div
            key={product.id}
            onClick={() => !isOutOfStock && onAddToCart(product)}
            className={`
              bg-white rounded-xl shadow-sm border overflow-hidden flex flex-col group transition-all duration-200
              ${isOutOfStock
                ? 'opacity-60 grayscale border-slate-200 cursor-not-allowed'
                : 'border-blue-100 hover:shadow-lg hover:border-blue-400 cursor-pointer active:scale-[0.98]'
              }
            `}
          >
            <div className="relative w-full aspect-square bg-gradient-to-br from-blue-100 to-blue-200 overflow-hidden">
              <div className="absolute inset-0 flex items-center justify-center text-blue-300 bg-gradient-to-br from-blue-100 to-blue-200">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              {product.image_url && (
                <Image
                  src={product.image_url}
                  alt={product.name}
                  fill
                  className={`object-cover transition-transform duration-200 ${!isOutOfStock && 'group-hover:scale-105'}`}
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                  onError={(event) => {
                    event.currentTarget.style.visibility = 'hidden';
                  }}
                />
              )}

              <div className="absolute top-2 right-2 flex flex-col gap-1 items-end">
                {hasDiscount && (
                  <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-md shadow-sm">
                    -{discountPct}%
                  </span>
                )}

                {isOnlineMode ? (
                  <span className="bg-purple-600 text-white text-[10px] font-bold px-2 py-1 rounded-md shadow-sm flex items-center gap-1">
                    <FaGlobe size={8} /> Online
                  </span>
                ) : (
                  <span className="bg-blue-600 text-white text-[10px] font-bold px-2 py-1 rounded-md shadow-sm flex items-center gap-1">
                    <FaStore size={8} /> Offline
                  </span>
                )}
              </div>
            </div>

            <div className="p-3 flex-1 flex flex-col">
              <h3 className="text-sm font-bold text-slate-800 line-clamp-2 leading-tight mb-1 min-h-[2.5rem]">
                {product.name}
              </h3>
              <p className="text-xs text-slate-500 mb-2">
                {product.sku} • {product.unit}
              </p>

              <div className="flex-1"></div>

              <div className="mt-2 space-y-1">
                {hasDiscount && (
                  <p className="text-xs text-slate-400 line-through">
                    {formatRupiah(displayPrice)}
                  </p>
                )}

                <p className={`text-lg font-bold ${hasDiscount ? 'text-red-600' : (isOnlineMode ? 'text-purple-700' : 'text-blue-600')}`}>
                  {formatRupiah(finalPrice)}
                </p>

                <div className={`text-xs font-semibold px-2 py-1.5 rounded-md flex items-center gap-1.5 w-fit ${
                  isOutOfStock
                    ? 'bg-red-100 text-red-700 border border-red-200'
                    : isLowStock
                      ? 'bg-amber-100 text-amber-700 border border-amber-200'
                      : 'bg-blue-100 text-blue-700 border border-blue-200'
                }`}>
                  {isOutOfStock ? (
                    <>Stok Habis</>
                  ) : isLowStock ? (
                    <>
                      <FaExclamation size={10} /> Sisa {stock}
                    </>
                  ) : (
                    <>Stok: {stock}</>
                  )}
                </div>

                <button
                  disabled={isOutOfStock}
                  className={`
                    w-full text-sm font-bold py-2.5 px-3 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 shadow-sm mt-2
                    ${isOutOfStock
                      ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white hover:shadow-md shadow-blue-500/30'
                    }
                  `}
                >
                  {isOutOfStock ? (
                    "Stok Habis"
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      <span>Tambah</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}