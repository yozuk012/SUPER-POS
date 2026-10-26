'use client';

/* eslint-disable @next/next/no-img-element -- thumbnail produk dinamis (storage URL) berukuran tetap via CSS */

import { FiAward } from 'react-icons/fi';

const formatIDR = (value) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value || 0);
};

export default function TopProductsCarousel({ products }) {
  if (!products || products.length === 0) {
    return (
      <div className="relative overflow-hidden bg-gradient-to-br from-white via-blue-50 to-blue-100 p-6 rounded-xl border border-blue-200 shadow-sm">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 via-blue-500 to-blue-400" />
        <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
          <span className="w-1.5 h-5 bg-gradient-to-b from-blue-600 to-blue-400 rounded-full" />
          Top 5 Produk Terlaris
        </h2>
        <p className="text-slate-500 text-sm text-center py-8">Belum ada data produk terlaris bulan ini.</p>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-white via-blue-50 to-blue-100 p-6 rounded-xl border border-blue-200 shadow-sm">
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 via-blue-500 to-blue-400" />

      <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
        <span className="w-1.5 h-5 bg-gradient-to-b from-blue-600 to-blue-400 rounded-full" />
        <FiAward className="text-blue-600" /> Top 5 Produk Terlaris (Bulan Ini)
      </h2>
      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x">
        {products.map((product, index) => (
          <div
            key={index}
            className="min-w-[220px] bg-white rounded-lg p-4 border border-blue-200 snap-start hover:shadow-lg hover:border-blue-400 hover:-translate-y-0.5 transition-all duration-200"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-md flex items-center justify-center border border-blue-300 overflow-hidden shrink-0">
                {product.image_url ? (
                  <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-2xl">📦</span>
                )}
              </div>
              <div className="min-w-0">
                <span className="inline-block text-xs font-bold text-white bg-blue-600 px-1.5 py-0.5 rounded">
                  #{index + 1}
                </span>
                <h4 className="text-sm font-semibold text-slate-900 truncate mt-1" title={product.name}>{product.name}</h4>
              </div>
            </div>
            <div className="space-y-1.5 pt-2 border-t border-blue-200">
              <div className="flex justify-between text-xs text-slate-600">
                <span>Terjual:</span>
                <span className="font-bold text-slate-900">{product.totalQty} pcs</span>
              </div>
              <div className="flex justify-between text-xs text-slate-600">
                <span>Omzet:</span>
                <span className="font-bold text-blue-700">{formatIDR(product.totalRevenue)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}