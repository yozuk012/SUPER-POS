'use client';

import { useState, useEffect } from 'react';
import { FiX, FiInfo } from 'react-icons/fi';
import { getPurchaseEditValues, validateRawMaterialName } from '@/lib/rawMaterialUtils';

export default function BahanBakuFormModal({
  isOpen,
  onClose,
  editingItem,
  onSubmit,
  isSubmitting
}) {
  const [formData, setFormData] = useState({
    name: '',
    qty_beli: '1',
    satuan_beli: 'kg',
    total_harga_beli: '',
    initialStock: '0',
    is_perishable: false,
    shelf_life_days: ''
  });

  const [nameError, setNameError] = useState('');

  useEffect(() => {
    if (isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setNameError('');
      if (editingItem) {
        const purchaseValues = getPurchaseEditValues(editingItem);
        setFormData({
          name: editingItem.name || '',
          qty_beli: String(purchaseValues.quantity),
          satuan_beli: purchaseValues.unit || 'kg',
          total_harga_beli: String(purchaseValues.price || ''),
          initialStock: String(purchaseValues.stock),
          is_perishable: editingItem.is_perishable || false,
          shelf_life_days: editingItem.shelf_life_days || ''
        });
      } else {
        setFormData({
          name: '',
          qty_beli: '1',
          satuan_beli: 'kg',
          total_harga_beli: '',
          initialStock: '0',
          is_perishable: false,
          shelf_life_days: ''
        });
      }
    }
  }, [isOpen, editingItem]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    if (name === 'name') {
      if (!value.trim()) {
        setNameError('');
      } else {
        const validation = validateRawMaterialName(value);
        setNameError(validation.isValid ? '' : validation.error);
      }
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const nameValidation = validateRawMaterialName(formData.name);
    if (!nameValidation.isValid) {
      setNameError(nameValidation.error);
      alert(nameValidation.error);
      return;
    }

    if (!formData.name.trim() || !formData.qty_beli || !formData.satuan_beli || !formData.total_harga_beli) {
      alert('Mohon lengkapi Nama, Jumlah Beli, Satuan, dan Total Harga Beli!');
      return;
    }

    const payload = {
      name: formData.name.trim(),
      satuan_beli: formData.satuan_beli.toLowerCase(),
      qty_beli: parseFloat(formData.qty_beli),
      total_harga_beli: parseFloat(formData.total_harga_beli),
      is_perishable: formData.is_perishable,
      shelf_life_days: formData.shelf_life_days ? parseInt(formData.shelf_life_days) : null
    };

    const initialStockInput = parseFloat(formData.initialStock) || 0;

    onSubmit(payload, initialStockInput);
  };

  if (!isOpen) return null;

  const inputBase = "w-full px-3 py-2.5 bg-white border border-blue-200 rounded-lg text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-500 transition";
  const labelClass = "block text-xs font-semibold text-slate-700 mb-1";

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-blue-200">

        {/* ═══ HEADER MODAL — gradient biru ═══ */}
        <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-blue-500 to-blue-400 px-5 py-4 flex justify-between items-center">
          <div className="absolute -top-6 -right-6 w-24 h-24 bg-white/10 rounded-full pointer-events-none" />
          <div className="relative flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-white flex items-center justify-center">
              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <h3 className="text-base font-bold text-white">
              {editingItem ? 'Edit Bahan Baku' : 'Tambah Bahan Baku Baru'}
            </h3>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="relative text-white/90 hover:text-white hover:bg-white/20 p-1.5 rounded-lg transition-colors"
            aria-label="Tutup modal"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        {/* ═══ BODY MODAL ═══ */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[75vh] overflow-y-auto bg-gradient-to-b from-white to-blue-50/30">

          {/* Nama Bahan */}
          <div>
            <label className={labelClass}>
              Nama Bahan Baku <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Contoh: Daging Ayam Giling, Tepung Tapioka"
              className={`w-full px-3 py-2.5 bg-white border rounded-lg text-sm placeholder-slate-400 focus:outline-none focus:ring-2 transition ${
                nameError
                  ? 'border-red-400 focus:ring-red-200 bg-red-50/30 text-slate-700'
                  : 'border-blue-200 focus:ring-blue-400 focus:border-blue-500 text-slate-700'
              }`}
              required
            />
            {nameError && (
              <p className="text-xs text-red-600 mt-1 font-semibold flex items-center gap-1">
                <span>⚠</span> {nameError}
              </p>
            )}
          </div>

          {/* Jumlah & Satuan */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-1">
              <label className={labelClass}>
                Isi Beli <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="qty_beli"
                value={formData.qty_beli}
                onChange={handleChange}
                placeholder="1"
                step="0.01"
                min="0.01"
                className={inputBase}
                required
              />
            </div>
            <div className="col-span-2">
              <label className={labelClass}>
                Satuan Beli <span className="text-red-500">*</span>
              </label>
              <select
                name="satuan_beli"
                value={formData.satuan_beli}
                onChange={handleChange}
                className={inputBase}
                required
              >
                <option value="kg">Kilogram (kg)</option>
                <option value="gram">Gram (g)</option>
                <option value="liter">Liter (L)</option>
                <option value="ml">Mililiter (ml)</option>
                <option value="pack">Pack / Bungkus</option>
                <option value="lembar">Lembar</option>
                <option value="pcs">Pcs / Butir</option>
              </select>
            </div>
          </div>

          {/* Total Harga */}
          <div>
            <label className={labelClass}>
              Harga Total Pembelian (Rp) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              name="total_harga_beli"
              value={formData.total_harga_beli}
              onChange={handleChange}
              placeholder="Contoh: 45000"
              className={inputBase}
              required
            />
            <p className="text-[10px] text-slate-500 mt-1 flex items-start gap-1 leading-snug">
              <FiInfo className="w-3 h-3 mt-0.5 flex-shrink-0 text-blue-500" />
              Contoh: isi 1 kg dengan harga 15000 akan dihitung sebagai Rp15/gram di database.
            </p>
          </div>

          {/* Stok Awal */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 p-3 rounded-lg">
            <label className="block text-xs font-bold text-blue-800 mb-1">
              Stok Awal Gudang <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              name="initialStock"
              value={formData.initialStock}
              onChange={handleChange}
              placeholder="0"
              min="0"
              step="0.01"
              className="w-full px-3 py-2.5 bg-white border border-blue-200 rounded-lg text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-500 transition"
              required
            />
            <p className="text-xs text-blue-700 mt-1 font-medium">
              Masukkan stok dalam <strong className="text-blue-800">{formData.satuan_beli}</strong>. Contoh: punya 100 kg, ketik 100.
            </p>
          </div>

          {/* Checkbox Perishable */}
          <div className="flex items-center gap-3 bg-white border border-blue-200 p-3 rounded-lg">
            <input
              type="checkbox"
              name="is_perishable"
              id="is_perishable"
              checked={formData.is_perishable}
              onChange={handleChange}
              className="w-5 h-5 text-blue-600 rounded border-blue-300 focus:ring-blue-500"
            />
            <label htmlFor="is_perishable" className="text-slate-700 font-semibold cursor-pointer select-none text-sm">
              Bahan ini mudah busuk/rusak (Perishable)
            </label>
          </div>

          {/* Masa Simpan */}
          {formData.is_perishable && (
            <div className="animate-fadeIn">
              <label className={labelClass}>Masa Simpan Ideal (Hari)</label>
              <input
                type="number"
                name="shelf_life_days"
                value={formData.shelf_life_days}
                onChange={handleChange}
                placeholder="Contoh: 3"
                className={inputBase}
              />
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 bg-white border border-blue-200 hover:bg-blue-50 text-slate-700 font-bold py-2.5 rounded-lg transition-colors disabled:opacity-50 text-sm"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 shadow-md shadow-blue-500/30 text-sm"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Menyimpan...
                </>
              ) : (
                editingItem ? 'Simpan Perubahan' : 'Tambah & Stok'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}