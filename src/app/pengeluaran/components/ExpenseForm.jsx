'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { FiSave, FiCalendar, FiTag, FiDollarSign, FiFileText, FiX, FiAlertCircle } from 'react-icons/fi';
import { MAX_TEXT_LENGTH, validateSafeText } from '@/lib/inputValidation';

const THOUSAND_SEPARATOR = '.';

export default function ExpenseForm({ onSubmit, isSubmitting, editingItem, onCancel }) {
  const today = useMemo(() => new Date().toLocaleDateString('sv-SE'), []);

  const getInitialFormData = useCallback(() => ({
    date: editingItem?.expense_date || today,
    category: editingItem?.category || '',
    amount: String(editingItem?.amount || ''),
    description: editingItem?.description || ''
  }), [editingItem, today]);

  const [formData, setFormData] = useState(() => getInitialFormData());

  const descriptionError = useMemo(() => {
    if (!formData.description) return '';
    const check = validateSafeText(formData.description, {
      label: 'Keterangan',
      maxLength: MAX_TEXT_LENGTH
    });
    return check.isValid ? '' : check.message;
  }, [formData.description]);

  const categories = [
    'Gas LPG',
    'Listrik & Air',
    'Kemasan (Cup, Plastik, Stiker)',
    'Tenaga Kerja / Gaji Harian',
    'Sewa Tempat',
    'Pemasaran / Iklan',
    'Perawatan Peralatan',
    'Transportasi / Bensin',
    'Lainnya'
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const formatRibuan = (value) =>
    String(value ?? '').replace(/\B(?=(\d{3})+(?!\d))/g, THOUSAND_SEPARATOR);

  const handleAmountChange = (e) => {
    const digits = e.target.value
      .replace(/\D/g, '')
      .replace(/^0+(?=\d)/, '')
      .slice(0, 15);
    setFormData(prev => ({ ...prev, amount: digits }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.category) {
      alert('Mohon pilih kategori pengeluaran.');
      return;
    }

    const categoryCheck = validateSafeText(formData.category, { label: 'Kategori pengeluaran' });
    if (!categoryCheck.isValid) {
      alert(categoryCheck.message);
      return;
    }

    const descriptionCheck = validateSafeText(formData.description, {
      label: 'Keterangan',
      maxLength: MAX_TEXT_LENGTH
    });
    if (!descriptionCheck.isValid) {
      alert(descriptionCheck.message);
      return;
    }

    const amount = Number(formData.amount);
    if (!Number.isFinite(amount) || !Number.isInteger(amount) || amount <= 0) {
      alert('Mohon masukkan jumlah pengeluaran yang valid (lebih dari 0).');
      return;
    }

    onSubmit({
      expense_date: formData.date,
      category: categoryCheck.value,
      amount,
      description: descriptionCheck.value
    });

    setFormData({
      date: today,
      category: '',
      amount: '',
      description: ''
    });
  };

  const inputBase = "w-full px-3 py-2.5 bg-white border border-blue-200 rounded-lg text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-500 transition";
  const labelClass = "block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-2";

  return (
    <div className={`relative overflow-hidden bg-gradient-to-br from-white via-blue-50 to-blue-100 rounded-xl shadow-sm p-5 sm:p-6 border transition-all ${
      editingItem ? 'border-amber-300 ring-2 ring-amber-100' : 'border-blue-200'
    }`}>
      {/* Top accent bar */}
      <div className={`absolute top-0 left-0 right-0 h-1 ${
        editingItem
          ? 'bg-gradient-to-r from-amber-500 via-amber-400 to-amber-300'
          : 'bg-gradient-to-r from-blue-600 via-blue-500 to-blue-400'
      }`} />

      <div className="relative flex items-center justify-between mb-5 pt-1">
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
            editingItem
              ? 'bg-amber-200 text-amber-700'
              : 'bg-blue-200 text-blue-700'
          }`}>
            <FiSave className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              {editingItem ? 'Edit Pengeluaran' : 'Catat Pengeluaran Baru'}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {editingItem ? 'Perbarui data pengeluaran yang dipilih.' : 'Isi detail biaya operasional Anda.'}
            </p>
          </div>
        </div>

        {editingItem && (
          <button
            type="button"
            onClick={onCancel}
            className="flex items-center gap-1 text-xs text-slate-600 hover:text-red-600 font-bold bg-white border border-amber-200 hover:border-red-200 px-3 py-1.5 rounded-lg transition-colors"
          >
            <FiX className="w-3.5 h-3.5" />
            Batal Edit
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="relative space-y-4">

        {/* Baris 1: Tanggal & Kategori */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>
              <FiCalendar className="w-3.5 h-3.5 text-blue-600" />
              Tanggal Pengeluaran
            </label>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              className={inputBase}
              required
            />
          </div>

          <div>
            <label className={labelClass}>
              <FiTag className="w-3.5 h-3.5 text-blue-600" />
              Kategori Pengeluaran <span className="text-red-500">*</span>
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className={inputBase}
              required
            >
              <option value="">-- Pilih Kategori --</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Baris 2: Nominal */}
        <div>
          <label className={labelClass}>
            <FiDollarSign className="w-3.5 h-3.5 text-blue-600" />
            Jumlah Nominal (Rp) <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-700 font-bold text-sm">Rp</span>
            <input
              type="text"
              name="amount"
              value={formData.amount ? formatRibuan(formData.amount) : ''}
              onChange={handleAmountChange}
              placeholder="0"
              inputMode="numeric"
              autoComplete="off"
              aria-label="Jumlah nominal pengeluaran"
              className="w-full pl-10 pr-3 py-2.5 bg-white border border-blue-200 rounded-lg text-base font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-500 transition"
              required
            />
          </div>
        </div>

        {/* Baris 3: Keterangan */}
        <div>
          <label className={labelClass}>
            <FiFileText className="w-3.5 h-3.5 text-blue-600" />
            Keterangan / Catatan <span className="text-slate-400 font-normal">(Opsional)</span>
          </label>
          <input
            type="text"
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Contoh: Beli gas elpiji 3kg untuk produksi minggu ini"
            maxLength={MAX_TEXT_LENGTH}
            aria-invalid={Boolean(descriptionError)}
            aria-describedby="description-help"
            className={`w-full px-3 py-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 transition-colors ${
              descriptionError
                ? 'border border-red-400 bg-red-50 focus:ring-red-400 text-slate-700 placeholder-slate-400'
                : 'bg-white border border-blue-200 focus:ring-blue-400 focus:border-blue-500 text-slate-700 placeholder-slate-400'
            }`}
          />
          {descriptionError ? (
            <p id="description-help" className="text-xs text-red-600 mt-1.5 font-semibold flex items-start gap-1.5">
              <FiAlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
              <span>{descriptionError}</span>
            </p>
          ) : (
            <p id="description-help" className="text-[11px] text-slate-500 mt-1.5">
              Hanya teks biasa. Perintah SQL dan script tidak diizinkan.
            </p>
          )}
        </div>

        {/* Tombol Submit */}
        <button
          type="submit"
          disabled={isSubmitting}
          className={`w-full font-bold py-3 rounded-lg shadow-md transition-all flex items-center justify-center gap-2 ${
            isSubmitting
              ? 'bg-slate-300 cursor-not-allowed text-slate-500'
              : editingItem
                ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/30 active:scale-[0.98]'
                : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/30 active:scale-[0.98]'
          }`}
        >
          {isSubmitting ? (
            <>
              <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Menyimpan Data...
            </>
          ) : (
            <>
              <FiSave className="w-4 h-4" />
              {editingItem ? 'Simpan Perubahan' : 'Simpan Pengeluaran'}
            </>
          )}
        </button>
      </form>
    </div>
  );
}