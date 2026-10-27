"use client";

/* eslint-disable @next/next/no-img-element -- preview foto produk (blob/storage URL), tidak bisa dioptimasi next/image */

import { FaTimes, FaCamera, FaCheckCircle, FaBan, FaInfinity } from "react-icons/fa";

export default function ProductFormModal({
  isModalOpen,
  closeModal,
  editingId,
  handleSubmit,
  error,
  isSubmitting,
  formData,
  handleChange,
  handleFileChange,
  stores,
  categories,
}) {
  if (!isModalOpen) return null;

  const inputBase = "w-full px-3 py-2 bg-white border border-blue-200 rounded-lg text-sm text-slate-700 placeholder-slate-400 focus:ring-2 focus:ring-blue-400 focus:border-blue-500 outline-none transition";
  const labelClass = "block text-xs font-semibold text-slate-700 mb-1";
  const sectionTitleClass = "text-xs font-bold text-blue-800 uppercase mb-3 tracking-wider flex items-center gap-2";

  return (
    <div className="fixed z-50 inset-x-0 bottom-0 md:inset-0 md:flex md:items-center md:justify-center p-0 md:p-4">
      <div
        className="absolute inset-0 bg-black/40 md:bg-black/50 pointer-events-none md:pointer-events-auto transition-opacity"
        onClick={closeModal}
      />

      <form
        onSubmit={handleSubmit}
        className="relative bg-white w-full md:max-w-lg md:rounded-xl shadow-2xl rounded-t-2xl max-h-[90vh] flex flex-col border-t-4 md:border-t-0 md:border border-blue-200 animate-in slide-in-from-bottom-10 md:slide-in-from-bottom-0 fade-in duration-200 overflow-hidden"
      >
        {/* Header dengan gradient biru */}
        <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-blue-500 to-blue-400 p-4 shrink-0">
          <div className="absolute -top-6 -right-6 w-24 h-24 bg-white/10 rounded-full pointer-events-none" />
          <div className="relative flex items-center justify-between">
            <h2 className="text-sm font-bold text-white">
              {editingId ? "Edit Produk" : "Tambah Produk Baru"}
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

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5 bg-gradient-to-b from-white to-blue-50/40">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex items-start gap-2">
              <span className="font-bold">Error:</span> {error}
            </div>
          )}

          {/* SECTION 1: Info Dasar */}
          <div>
            <h3 className={sectionTitleClass}>
              <span className="w-1 h-4 bg-blue-500 rounded-full" />
              Info Dasar
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>
                  Toko <span className="text-red-500">*</span>
                </label>
                <select
                  name="store_id"
                  value={formData.store_id}
                  onChange={handleChange}
                  className={inputBase}
                >
                  <option value="">-- Pilih Toko --</option>
                  {stores.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>
                  Kategori <span className="text-red-500">*</span>
                </label>
                <select
                  name="category_id"
                  value={formData.category_id}
                  onChange={handleChange}
                  className={inputBase}
                >
                  <option value="">-- Pilih Kategori --</option>
                  {categories
                    .filter((c) => c.store_id.toString() === formData.store_id)
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className={labelClass}>
                  Nama Produk <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  maxLength={120}
                  autoComplete="off"
                  aria-invalid={Boolean(error && !formData.name.trim())}
                  placeholder="Misal: Nugget Ayam Original 500gr"
                  className={inputBase}
                />
              </div>
              <div>
                <label className={labelClass}>SKU / Kode Barang</label>
                <input
                  type="text"
                  name="sku"
                  value={formData.sku}
                  onChange={handleChange}
                  className={inputBase}
                  placeholder="Otomatis atau ketik manual"
                />
              </div>
              <div>
                <label className={labelClass}>Satuan Jual</label>
                <select
                  name="unit"
                  value={formData.unit}
                  onChange={handleChange}
                  className={inputBase}
                >
                  <option value="pack">Pack</option>
                  <option value="pcs">Pcs</option>
                  <option value="box">Box</option>
                  <option value="kg">Kg</option>
                </select>
              </div>
            </div>
          </div>

          {editingId && (
            <div>
              <h3 className={sectionTitleClass}>
                <span className="w-1 h-4 bg-blue-500 rounded-full" />
                Harga & HPP
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className={labelClass}>Harga Offline</label>
                  <input
                    type="number"
                    name="base_price"
                    value={formData.base_price}
                    onChange={handleChange}
                    min="0"
                    placeholder="0"
                    className={inputBase}
                  />
                </div>
                <div>
                  <label className={labelClass}>HPP Modal</label>
                  <input
                    type="number"
                    value={formData.hpp}
                    readOnly
                    className="w-full px-3 py-2 border border-blue-100 rounded-lg text-sm bg-blue-50 text-slate-500 cursor-not-allowed"
                  />
                </div>
              </div>
              <p className="text-[10px] text-slate-400 mt-2">
                Hanya harga offline yang dapat diubah di halaman ini. HPP diperbarui dari menu Hitung HPP.
              </p>
            </div>
          )}

          <div>
            <h3 className={sectionTitleClass}>
              <span className="w-1 h-4 bg-blue-500 rounded-full" />
              Diskon Produk
            </h3>
            <div className="relative max-w-xs">
              <input
                type="number"
                name="discount_pct"
                value={formData.discount_pct}
                onChange={handleChange}
                min="0"
                max="100"
                step="0.01"
                placeholder="0"
                className={`${inputBase} pr-8`}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-blue-500 font-semibold">%</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-2">
              Diskon otomatis diterapkan saat produk masuk ke transaksi.
            </p>
          </div>

          {/* SECTION 2: Stok & Penjualan */}
          <div>
            <h3 className={sectionTitleClass}>
              <span className="w-1 h-4 bg-blue-500 rounded-full" />
              Stok & Penjualan
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>
                  Stok Awal {formData.track_stock !== false && <span className="text-red-500">*</span>}
                </label>
                <input
                  type="number"
                  name="stock"
                  value={formData.stock}
                  onChange={handleChange}
                  placeholder="0"
                  min="0"
                  disabled={formData.track_stock === false}
                  className={`${inputBase} ${
                    formData.track_stock === false ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : ''
                  }`}
                />
                {formData.track_stock === false && (
                  <p className="text-[10px] text-emerald-700 mt-1 font-semibold">
                    Diabaikan karena stok produk tanpa batas.
                  </p>
                )}
              </div>

              {/* Stok tanpa batas (unlimited) */}
              <div className="sm:col-span-2 rounded-lg border border-emerald-200 bg-emerald-50/60 p-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="track_stock"
                    checked={formData.track_stock !== false}
                    onChange={handleChange}
                    className="w-4 h-4 text-emerald-600 border-emerald-300 rounded focus:ring-emerald-500"
                  />
                  <span className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                    {formData.track_stock === false ? (
                      <FaInfinity size={12} className="text-emerald-600" />
                    ) : (
                      <FaCheckCircle size={12} className="text-green-600" />
                    )}
                    {formData.track_stock === false
                      ? "Stok tanpa batas (unlimited)"
                      : "Stok dilacak otomatis"}
                  </span>
                </label>
                <p className="text-[10px] text-slate-500 mt-2 leading-snug">
                  Hilangkan centang ini bila jumlah stok produk tidak perlu dihitung (mis.
                  produk titipan atau jasa). Produk tetap bisa dijual walau stok 0 dan stoknya
                  tidak berkurang otomatis setelah transaksi.
                </p>
              </div>

              <div className="sm:col-span-2 rounded-lg border border-blue-200 bg-blue-50/50 p-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="is_online"
                    checked={formData.is_online}
                    onChange={handleChange}
                    className="w-4 h-4 text-blue-600 border-blue-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-xs font-semibold text-slate-700">
                    Masukkan ke penjualan online
                  </span>
                </label>
                {formData.is_online && (
                  <div className="mt-3">
                    <label className={labelClass}>Persentase kenaikan harga online</label>
                    <div className="relative">
                      <input
                        type="number"
                        name="online_markup_pct"
                        value={formData.online_markup_pct}
                        onChange={handleChange}
                        min="0"
                        max="100"
                        className={`${inputBase} pr-8`}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-blue-500 font-semibold">%</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex flex-col justify-end pb-1">
                <label className="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-blue-50 transition-colors border border-blue-100">
                  <input
                    type="checkbox"
                    name="is_active"
                    checked={formData.is_active}
                    onChange={handleChange}
                    className="w-4 h-4 text-blue-600 border-blue-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                    {formData.is_active ? (
                      <FaCheckCircle size={12} className="text-green-600" />
                    ) : (
                      <FaBan size={12} className="text-red-500" />
                    )}
                    {formData.is_active ? "Produk Aktif" : "Produk Nonaktif"}
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* SECTION 3: Foto Produk */}
          <div>
            <h3 className={sectionTitleClass}>
              <span className="w-1 h-4 bg-blue-500 rounded-full" />
              Foto Produk
            </h3>
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg border-2 border-dashed border-blue-300 flex items-center justify-center overflow-hidden shrink-0">
                {formData.image_preview ? (
                  <img
                    src={formData.image_preview}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <FaCamera className="text-blue-400 text-xl" />
                )}
              </div>
              <div className="flex-1">
                <label className={labelClass}>Unggah Foto (Max 2MB)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="block w-full text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-100 file:text-blue-700 hover:file:bg-blue-200 cursor-pointer"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Format: JPG, PNG, WEBP. Gambar lama akan otomatis terhapus jika diganti.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
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
              "Simpan Produk"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}