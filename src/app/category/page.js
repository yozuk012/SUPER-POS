// src/app/categories/page.js (sesuaikan path)
"use client";

import { useState } from "react";
import PageLayout from "@/components/PageLayout";
import useCategories from "@/hooks/useCategories";
import useCopyAvailability from "@/hooks/useCopyAvailability";
import CopyDataModal from "@/components/CopyDataModal";
import { formatDate } from "@/lib/formatUtils";
import { FaPlus, FaEdit, FaTrash, FaTimes, FaFolderOpen } from "react-icons/fa";
import { FiCopy } from "react-icons/fi";

export default function CategoriesPage() {
  const [isCopyModalOpen, setIsCopyModalOpen] = useState(false);
  const { canCopy } = useCopyAvailability();

  const {
    stores, categories, loading, formData, editingId, error, isSubmitting, isModalOpen,
    handleChange, handleSubmit, deleteCategory,
    openAddModal, openEditModal, closeModal, refetch
  } = useCategories();

  return (
    <PageLayout title="Kategori Produk">

      {/* ═══ HEADER HERO — gradient biru solid ═══ */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-blue-600 via-blue-500 to-blue-400 p-5 mb-4 shadow-lg shadow-blue-500/30">
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full pointer-events-none" />
        <div className="absolute -bottom-16 -left-12 w-40 h-40 bg-white/5 rounded-full pointer-events-none" />

        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-6 h-6 rounded-md bg-white flex items-center justify-center">
                <svg className="w-3.5 h-3.5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
                </svg>
              </div>
              <span className="text-xs font-bold text-white/90 uppercase tracking-wider">
                SuperPOS
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white">Manajemen Kategori</h1>
            <p className="text-blue-50 text-xs mt-0.5">
              Kelompokkan produk agar rapi saat transaksi.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {canCopy && (
              <button
                onClick={() => setIsCopyModalOpen(true)}
                className="flex items-center justify-center gap-2 px-3 py-2 bg-white text-blue-700 hover:bg-blue-50 text-sm font-semibold rounded-lg shadow-sm transition-colors"
                title="Salin kategori dari cabang lain"
              >
                <FiCopy size={13} />
                <span>Salin Kategori</span>
              </button>
            )}
            <button
              onClick={openAddModal}
              className="flex items-center justify-center gap-2 px-3 py-2 bg-white text-blue-700 hover:bg-blue-50 text-sm font-bold rounded-lg shadow-sm transition-colors"
            >
              <FaPlus size={12} />
              <span>Tambah</span>
            </button>
          </div>
        </div>
      </div>

      {/* ═══ KONTEN UTAMA — card gradient + top accent bar ═══ */}
      <div className="relative overflow-hidden bg-gradient-to-br from-white via-blue-50 to-blue-100 rounded-xl shadow-sm border border-blue-200 flex flex-col">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 via-blue-500 to-blue-400" />

        {loading ? (
          <div className="p-8 text-center text-slate-500 text-sm min-h-[200px] flex flex-col items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
            Memuat data...
          </div>
        ) : categories.length === 0 ? (
          <div className="p-10 text-center text-slate-500 min-h-[220px] flex flex-col items-center justify-center">
            <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center mb-3">
              <FaFolderOpen className="text-2xl text-blue-400" />
            </div>
            <p className="text-base font-bold text-slate-800">Belum ada kategori</p>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              Klik tombol &quot;Tambah&quot; atau salin dari cabang toko lain.
            </p>
            {canCopy && (
              <button
                onClick={() => setIsCopyModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 mt-5 bg-blue-600 text-white hover:bg-blue-700 rounded-xl font-semibold text-sm transition-colors shadow-sm active:scale-95"
              >
                <FiCopy size={13} />
                <span>Salin Kategori dari Cabang Lain</span>
              </button>
            )}
          </div>
        ) : (
          <>
            {/* ═══ MOBILE — card list ═══ */}
            <div className="md:hidden divide-y divide-blue-100">
              {categories.map((cat) => (
                <div key={cat.id} className="p-3 flex items-center justify-between gap-3 hover:bg-blue-50 active:bg-blue-100 transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-800 truncate">{cat.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] px-1.5 py-0.5 bg-blue-100 text-blue-700 border border-blue-200 rounded truncate max-w-[100px] font-semibold">
                        {cat.stores?.name}
                      </span>
                      <span className="text-[10px] text-slate-400">{formatDate(cat.created_at)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => openEditModal(cat)} className="p-2 text-blue-700 bg-blue-100 hover:bg-blue-200 rounded-lg transition-colors" aria-label="Edit kategori">
                      <FaEdit size={13} />
                    </button>
                    <button onClick={() => deleteCategory(cat.id)} className="p-2 text-red-700 bg-red-100 hover:bg-red-200 rounded-lg transition-colors" aria-label="Hapus kategori">
                      <FaTrash size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* ═══ DESKTOP — tabel ═══ */}
            <div className="hidden md:block overflow-x-auto rounded-b-xl">
              <table className="w-full text-left">
                <thead className="bg-gradient-to-r from-blue-100 to-blue-50 border-b-2 border-blue-200">
                  <tr>
                    <th className="px-4 py-3 text-xs font-bold text-blue-800 uppercase">No</th>
                    <th className="px-4 py-3 text-xs font-bold text-blue-800 uppercase">Nama Kategori</th>
                    <th className="px-4 py-3 text-xs font-bold text-blue-800 uppercase">Nama Toko</th>
                    <th className="px-4 py-3 text-xs font-bold text-blue-800 uppercase">Tanggal</th>
                    <th className="px-4 py-3 text-xs font-bold text-blue-800 uppercase text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-blue-100 bg-white">
                  {categories.map((cat, index) => (
                    <tr key={cat.id} className="hover:bg-blue-50 transition-colors">
                      <td className="px-4 py-3 text-sm font-semibold text-blue-700">{index + 1}</td>
                      <td className="px-4 py-3 text-sm font-bold text-slate-900">{cat.name}</td>
                      <td className="px-4 py-3 text-sm">
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 border border-blue-200 text-xs font-semibold rounded">
                          {cat.stores?.name}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-500">{formatDate(cat.created_at)}</td>
                      <td className="px-4 py-3 text-sm text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => openEditModal(cat)} className="min-h-11 min-w-11 p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors" aria-label="Edit kategori">
                            <FaEdit size={14} />
                          </button>
                          <button onClick={() => deleteCategory(cat.id)} className="min-h-11 min-w-11 p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors" aria-label="Hapus kategori">
                            <FaTrash size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* ═══ MODAL TAMBAH/EDIT — tema biru ═══ */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 transition-opacity"
            onClick={closeModal}
          />

          <form
            onSubmit={handleSubmit}
            className="relative bg-white w-full max-w-md rounded-xl shadow-2xl max-h-[85vh] flex flex-col border border-blue-200 overflow-hidden"
          >
            {/* Header gradient biru */}
            <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-blue-500 to-blue-400 p-4 shrink-0">
              <div className="absolute -top-6 -right-6 w-24 h-24 bg-white/10 rounded-full pointer-events-none" />
              <div className="relative flex items-center justify-between">
                <h2 className="text-sm font-bold text-white">
                  {editingId ? "Edit Kategori" : "Tambah Kategori"}
                </h2>
                <button
                  type="button"
                  onClick={closeModal}
                  className="p-1.5 text-white/90 hover:text-white hover:bg-white/20 rounded-lg transition-colors"
                  aria-label="Tutup modal"
                >
                  <FaTimes size={14} />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gradient-to-b from-white to-blue-50/40">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex items-start gap-2">
                  <span className="font-bold">Error:</span> {error}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Pilih Toko <span className="text-red-500">*</span>
                </label>
                <select
                  name="store_id"
                  value={formData.store_id}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-white border border-blue-200 rounded-lg text-sm text-slate-700 focus:ring-2 focus:ring-blue-400 focus:border-blue-500 outline-none transition"
                >
                  <option value="">-- Pilih Toko --</option>
                  {stores.map((store) => (
                    <option key={store.id} value={store.id}>{store.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Kategori <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Misal: Nugget & Sosis"
                  className="w-full px-3 py-2 bg-white border border-blue-200 rounded-lg text-sm text-slate-700 placeholder-slate-400 focus:ring-2 focus:ring-blue-400 focus:border-blue-500 outline-none transition"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-2 p-4 border-t border-blue-200 bg-gradient-to-r from-blue-50 to-white shrink-0">
              <button
                type="button"
                onClick={closeModal}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-blue-200 hover:bg-blue-50 rounded-lg transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Menyimpan...
                  </>
                ) : (
                  "Simpan"
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ═══ MODAL SALIN KATEGORI ═══ */}
      <CopyDataModal
        isOpen={isCopyModalOpen}
        onClose={() => setIsCopyModalOpen(false)}
        type="categories"
        title="Kategori"
        onCopySuccess={refetch}
      />
    </PageLayout>
  );
}