// src/app/hpp/hppproduk/components/HPPProductList.jsx
'use client';

import { FiEdit2, FiTrash2, FiPackage, FiAlertCircle } from 'react-icons/fi';

export default function HPPProductList({
  products,
  isLoading,
  error,
  onEdit,
  onDelete,
  formatRupiah
}) {
  // ═══ LOADING ═══
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-slate-500">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-200 border-t-blue-600 mb-3"></div>
        <p className="font-semibold text-sm">Memuat daftar produk...</p>
      </div>
    );
  }

  // ═══ ERROR ═══
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-start gap-3 shadow-sm">
        <div className="w-9 h-9 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0">
          <FiAlertCircle className="w-5 h-5 text-red-600" />
        </div>
        <span className="font-medium pt-1.5">{error}</span>
      </div>
    );
  }

  // ═══ EMPTY STATE ═══
  if (!isLoading && products.length === 0) {
    return (
      <div className="text-center py-12 bg-gradient-to-br from-white via-blue-50 to-blue-100 rounded-xl border-2 border-dashed border-blue-300">
        <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-3">
          <FiPackage className="w-8 h-8 text-blue-400" />
        </div>
        <p className="text-slate-800 text-lg font-bold">Tidak ada produk HPP</p>
        <p className="text-slate-500 text-sm mt-1 max-w-md mx-auto px-4">
          Mulai hitung HPP di menu &quot;Hitung HPP&quot; untuk menambahkan produk ke sini.
        </p>
      </div>
    );
  }

  // ═══ DAFTAR PRODUK ═══
  return (
    <div className="space-y-3">
      {products.map((item) => (
        <div
          key={item.id}
          className="relative overflow-hidden bg-gradient-to-br from-white via-blue-50 to-blue-100 border border-blue-200 rounded-xl p-3 sm:p-4 shadow-sm hover:shadow-lg hover:border-blue-400 transition-all"
        >
          {/* Top accent bar */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 via-blue-500 to-blue-400" />

          <div className="relative flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4 pt-1">

            {/* Thumbnail + Info Produk */}
            <div className="flex items-start gap-3 sm:gap-4 flex-1 min-w-0">

              {/* Thumbnail */}
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center overflow-hidden shrink-0 border border-blue-300 shadow-sm">
                <span className="text-2xl sm:text-3xl" role="img" aria-label="produk">🍽️</span>
              </div>

              {/* Info Produk */}
              <div className="flex-1 min-w-0">
                <h3
                  className="font-bold text-slate-900 text-base sm:text-lg leading-snug break-words line-clamp-2"
                  title={item.namaProduk}
                >
                  {item.namaProduk}
                </h3>
                <p className="text-sm text-slate-600 font-medium break-words">
                  {item.kategori || '-'}
                </p>
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1.5">
                  <span className="text-[10px] bg-blue-100 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full font-bold uppercase tracking-wide">
                    HPP
                  </span>
                  <p className="text-sm font-bold text-blue-700 break-words">
                    {formatRupiah(item.hpp)} <span className="text-slate-500 font-medium text-xs">/ {item.unit}</span>
                  </p>
                </div>
                <p className="text-sm font-bold text-emerald-700 mt-1 break-words">
                  Harga rekomendasi: {formatRupiah(item.base_price)} <span className="text-slate-500 font-medium text-xs">/ {item.unit}</span>
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex sm:flex-col gap-2 w-full sm:w-auto shrink-0">
              <button
                onClick={() => onEdit(item)}
                className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-3 py-2 rounded-lg transition-colors shadow-sm shadow-blue-500/30 min-h-[44px] sm:min-h-9"
                title="Edit Resep & HPP"
              >
                <FiEdit2 className="w-3.5 h-3.5" />
                EDIT
              </button>

              <button
                onClick={() => {
                  if (window.confirm(`Yakin ingin menghapus '${item.namaProduk}'? Data resep terkait juga akan terhapus.`)) {
                    onDelete(item.id);
                  }
                }}
                className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-red-100 border border-red-200 text-red-700 hover:bg-red-200 font-bold text-xs px-3 py-2 rounded-lg transition-colors min-h-[44px] sm:min-h-9"
                title="Hapus Produk"
              >
                <FiTrash2 className="w-3.5 h-3.5" />
                HAPUS
              </button>
            </div>

          </div>
        </div>
      ))}
    </div>
  );
}