"use client";

import { FaPlus } from "react-icons/fa";
import { FiCopy } from "react-icons/fi";

export default function ProductHeader({ openAddModal, onOpenCopyModal }) {
  return (
    <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-blue-600 via-blue-500 to-blue-400 p-5 mb-4 shadow-lg shadow-blue-500/30">
      {/* Dekorasi */}
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full pointer-events-none" />
      <div className="absolute -bottom-16 -left-12 w-40 h-40 bg-white/5 rounded-full pointer-events-none" />

      <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <div className="w-6 h-6 rounded-md bg-white flex items-center justify-center">
              <svg className="w-3.5 h-3.5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <span className="text-xs font-bold text-white/90 uppercase tracking-wider">
              SuperPOS
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white">Daftar Produk</h1>
          <p className="text-blue-50 text-xs mt-0.5">
            Kelola stok, harga, dan foto produk Anda.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onOpenCopyModal && (
            <button
              onClick={onOpenCopyModal}
              className="flex items-center justify-center gap-2 px-3 py-2 bg-white text-blue-700 hover:bg-blue-50 text-sm font-semibold rounded-lg shadow-sm transition-colors"
              title="Salin produk dari cabang lain"
            >
              <FiCopy size={13} />
              <span>Salin Produk</span>
            </button>
          )}
          <button
            onClick={openAddModal}
            className="flex items-center justify-center gap-2 px-3 py-2 bg-white text-blue-700 hover:bg-blue-50 text-sm font-bold rounded-lg shadow-sm transition-colors"
            aria-label="Tambah produk baru"
          >
            <FaPlus size={12} />
            <span>Tambah Produk</span>
          </button>
        </div>
      </div>
    </div>
  );
}