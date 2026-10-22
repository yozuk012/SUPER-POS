// src/app/settings/profile/stores/components/StoreFormModal.jsx
'use client';

import { useEffect, useState } from 'react';
import { FiX } from 'react-icons/fi';

export default function StoreFormModal({
  isOpen,
  onClose,
  onSubmit,
  mode,
  isLoading,
  error,
  successMsg,
  formData,
  updateField,
  logoFile,
  setLogoFile,
  qrisFile,
  setQrisFile,
  ownerInfo,
}) {
  const [logoPreview, setLogoPreview] = useState(null);
  const [qrisPreview, setQrisPreview] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setLogoPreview(formData.logo_url || null);
      setQrisPreview(formData.qris_code_url || null);
    }
  }, [isOpen, formData.logo_url, formData.qris_code_url]);

  const handleFileChange = (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    if (type === 'logo') {
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    } else {
      setQrisFile(file);
      setQrisPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit();
  };

  if (!isOpen) return null;

  const inputBase = "w-full px-3 py-2 bg-white border border-blue-200 rounded-lg text-sm text-slate-700 placeholder-slate-400 focus:ring-2 focus:ring-blue-400 focus:border-blue-500 outline-none transition";
  const labelClass = "block text-xs font-semibold text-slate-700 mb-1";
  const sectionTitleClass = "text-xs font-bold text-blue-800 uppercase tracking-wide mb-3 flex items-center gap-2";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden border border-blue-200 animate-slideUp">

        {/* Header Modal — gradient biru */}
        <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-blue-500 to-blue-400 px-6 py-4 flex items-center justify-between">
          <div className="absolute -top-6 -right-6 w-24 h-24 bg-white/10 rounded-full pointer-events-none" />
          <div className="relative flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center">
              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M3 21h18M5 21V7l7-4 7 4v14M9 9h.01M9 13h.01M9 17h.01M15 9h.01M15 13h.01M15 17h.01" />
              </svg>
            </div>
            <h2 className="text-lg font-bold text-white">
              {mode === 'edit' ? 'Edit Detail Toko' : 'Tambah Cabang Toko Baru'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="relative p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
            aria-label="Tutup modal"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        {/* Body Modal */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6 bg-gradient-to-b from-white to-blue-50/40">

          {error && (
            <div role="alert" className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 font-semibold">{error}</div>
          )}
          {successMsg && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700 font-semibold">{successMsg}</div>
          )}

          {/* SECTION 1: Informasi Dasar */}
          <div>
            <h3 className={sectionTitleClass}>
              <span className="w-1 h-4 bg-blue-500 rounded-full" />
              Informasi Dasar
            </h3>
            {mode === 'add' && (ownerInfo?.full_name || ownerInfo?.phone) && (
              <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900">
                <p className="font-bold mb-1">Data pemilik dari profil utama</p>
                <p className="text-xs">Nama Pemilik: <span className="font-semibold">{ownerInfo.full_name || '-'}</span></p>
                <p className="text-xs">No. Telepon: <span className="font-semibold">{ownerInfo.phone || '-'}</span></p>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className={labelClass}>Nama Toko <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => updateField('name', e.target.value)}
                  placeholder="Contoh: Cabang Jakarta Selatan"
                  aria-invalid={Boolean(error && !formData.name.trim())}
                  className={inputBase}
                  required
                />
              </div>
              <div>
                <label className={labelClass}>Tipe Lokasi</label>
                <select
                  value={formData.type}
                  onChange={(e) => updateField('type', e.target.value)}
                  className={inputBase}
                >
                  <option value="frozen_food">Outlet Frozen Food</option>
                  <option value="gudang">Gudang / Pusat Produksi</option>
                  <option value="outlet">Outlet / Cabang Biasa</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className={labelClass}>Alamat Lengkap <span className="text-red-500">*</span></label>
                <textarea
                  value={formData.address}
                  onChange={(e) => updateField('address', e.target.value)}
                  placeholder="Jl. Contoh No. 123, Kota, Provinsi"
                  aria-invalid={Boolean(error && !formData.address.trim())}
                  rows={2}
                  className={`${inputBase} resize-none`}
                  required
                />
              </div>
            </div>
          </div>

          {/* SECTION 2: Branding & QRIS */}
          <div>
            <h3 className={sectionTitleClass}>
              <span className="w-1 h-4 bg-blue-500 rounded-full" />
              Branding & Pembayaran Digital
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Logo Toko</label>
                <div className="flex items-center gap-3">
                  <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-blue-100 to-blue-200 border border-blue-300 flex items-center justify-center overflow-hidden">
                    {logoPreview ? (
                      <img src={logoPreview} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                    )}
                  </div>
                  <label className="cursor-pointer px-3 py-1.5 bg-blue-100 hover:bg-blue-200 text-blue-700 text-xs font-bold rounded-lg transition-colors">
                    Pilih Gambar
                    <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'logo')} />
                  </label>
                </div>
              </div>

              <div>
                <label className={labelClass}>Gambar QRIS</label>
                <div className="flex items-center gap-3">
                  <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-blue-100 to-blue-200 border border-blue-300 flex items-center justify-center overflow-hidden">
                    {qrisPreview ? (
                      <img src={qrisPreview} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"></path></svg>
                    )}
                  </div>
                  {mode === 'edit' && (
                    <label className="cursor-pointer px-3 py-1.5 bg-blue-100 hover:bg-blue-200 text-blue-700 text-xs font-bold rounded-lg transition-colors">
                      Pilih QRIS
                      <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'qris')} />
                    </label>
                  )}
                </div>
              </div>

              {mode === 'add' && formData.qris_code_url && (
                <p className="md:col-span-2 text-xs text-blue-700 bg-blue-50 border border-blue-200 p-2 rounded-lg">
                  QRIS cabang utama digunakan sebagai default. Tidak perlu upload QRIS cabang baru.
                </p>
              )}

              <div className="md:col-span-2">
                <label className={labelClass}>ID Merchant QRIS (Opsional)</label>
                <input
                  type="text"
                  value={formData.qris_merchant_id}
                  onChange={(e) => updateField('qris_merchant_id', e.target.value)}
                  placeholder="Contoh: ID.MERCHANT.12345"
                  className={inputBase}
                />
              </div>
            </div>
          </div>

          {/* SECTION 3: Keuangan & Rekening */}
          <div>
            <h3 className={sectionTitleClass}>
              <span className="w-1 h-4 bg-blue-500 rounded-full" />
              Pengaturan Harga & Rekening
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-3">
                <label className={labelClass}>Markup Harga Online Default (%)</label>
                <input
                  type="number"
                  value={formData.default_online_markup_pct}
                  onChange={(e) => updateField('default_online_markup_pct', e.target.value)}
                  placeholder="0"
                  min="0"
                  className={inputBase}
                />
                <p className="text-[10px] text-slate-500 mt-1">Persentase kenaikan harga otomatis untuk penjualan via Shopee/Grab/Gojek.</p>
              </div>

              <div>
                <label className={labelClass}>Nama Bank</label>
                <input
                  type="text"
                  value={formData.bank_name}
                  onChange={(e) => updateField('bank_name', e.target.value)}
                  placeholder="BCA / Mandiri / BRI"
                  className={inputBase}
                />
              </div>
              <div>
                <label className={labelClass}>No. Rekening</label>
                <input
                  type="text"
                  value={formData.account_number}
                  onChange={(e) => updateField('account_number', e.target.value)}
                  placeholder="1234567890"
                  className={inputBase}
                />
              </div>
              <div>
                <label className={labelClass}>Nama Pemilik Rek.</label>
                <input
                  type="text"
                  value={formData.account_name}
                  onChange={(e) => updateField('account_name', e.target.value)}
                  placeholder="Atas nama rekening"
                  className={inputBase}
                />
              </div>
            </div>
          </div>
        </form>

        {/* Footer Modal */}
        <div className="px-6 py-4 border-t border-blue-200 bg-gradient-to-r from-blue-50 to-white flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-semibold text-slate-700 bg-white border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
          >
            Batal
          </button>
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-blue-300 transition-colors flex items-center gap-2 shadow-md shadow-blue-500/30"
          >
            {isLoading && (
              <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            )}
            {isLoading ? 'Menyimpan...' : (mode === 'edit' ? 'Perbarui Toko' : 'Simpan Toko')}
          </button>
        </div>
      </div>
    </div>
  );
}