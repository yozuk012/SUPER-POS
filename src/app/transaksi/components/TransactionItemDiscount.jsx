// src/app/transection/components/TransactionItemDiscount.jsx
'use client';

import { useState } from 'react';
import { FiCheck, FiTag, FiTrash2, FiX } from 'react-icons/fi';
import { formatRupiah, parseNumberUI, resolveQuickDiscount } from '@/lib/productUtils';

const PRESET_DISCOUNTS = [1000, 2000, 5000, 10000];

export default function TransactionItemDiscount({ item, onApply, onClear }) {
  const [isOpen, setIsOpen] = useState(false);
  const [draft, setDraft] = useState('');

  const normalUnitPrice = Number(item.base_unit_price) || Number(item.unit_price) || 0;
  const currentDiscount = Number(item.quick_discount) || 0;
  const qty = Number(item.qty) || 0;
  const normalPrice = normalUnitPrice * qty;

  const openPanel = () => {
    setDraft(currentDiscount > 0 ? String(currentDiscount) : '');
    setIsOpen(true);
  };

  const inputValue = parseNumberUI(draft);
  const hasInput = draft.trim() !== '';
  const preview = resolveQuickDiscount({ normalPrice, value: inputValue });
  const canSave = hasInput && preview.isValid;
  const finalUnitPrice = qty > 0
    ? (canSave ? preview.finalPrice : normalPrice) / qty
    : 0;
  const presets = PRESET_DISCOUNTS.filter((amount) => amount <= normalPrice);

  const handleSave = () => {
    if (!canSave) return;
    onApply(preview.discount);
    setIsOpen(false);
  };

  const handleClear = () => {
    onClear();
    setDraft('');
    setIsOpen(false);
  };

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={openPanel}
        title="Beri potongan harga (Rp) untuk item ini"
        className={`mt-3 flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-bold transition-colors ${
          currentDiscount > 0
            ? 'border-amber-300 bg-amber-100 text-amber-700 hover:bg-amber-200'
            : 'border-blue-200 bg-white text-blue-700 hover:bg-blue-50'
        }`}
      >
        <FiTag className="h-3 w-3" />
        {currentDiscount > 0
          ? `Diskon ${formatRupiah(currentDiscount)}`
          : 'Diskon Cepat'}
      </button>
    );
  }

  return (
    <div className="mt-2 space-y-2 rounded-lg border border-amber-300 bg-amber-50 p-2.5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <span className="text-xs font-bold text-amber-800">Potongan harga (Rp)</span>

        <button
          type="button"
          onClick={() => setIsOpen(false)}
          title="Tutup tanpa menyimpan"
          className="self-end rounded p-2 text-slate-400 transition-colors hover:bg-white hover:text-slate-600 sm:self-auto"
        >
          <FiX className="h-4 w-4" />
        </button>
      </div>

      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-500">
          Rp
        </span>
        <input
          type="text"
          inputMode="numeric"
          value={inputValue > 0 ? inputValue.toLocaleString('id-ID') : ''}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="5000"
          className="w-full rounded-lg border border-amber-300 bg-white py-2 pl-10 pr-3 text-sm font-bold text-slate-800 outline-none transition-all focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
        />
      </div>

      {presets.length > 0 && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {presets.map((amount) => (
            <button
              key={amount}
              type="button"
              onClick={() => setDraft(String(amount))}
              className={`min-h-11 rounded-lg border px-2 py-2 text-xs font-bold transition-colors ${
                inputValue === amount
                  ? 'border-amber-500 bg-amber-500 text-white'
                  : 'border-amber-300 bg-white text-amber-700 hover:bg-amber-100'
              }`}
            >
              -{formatRupiah(amount)}
            </button>
          ))}
        </div>
      )}

      <div className="space-y-1 rounded-md border border-amber-200 bg-white p-2 text-[11px]">
        <div className="flex justify-between text-slate-500">
          <span>Harga normal ({qty} {item.unit || 'pcs'})</span>
          <span className="font-semibold text-slate-700">{formatRupiah(normalPrice)}</span>
        </div>
        <div className="flex justify-between text-slate-500">
          <span>Potongan total</span>
          <span className={`font-semibold ${canSave && preview.discount > 0 ? 'text-red-600' : 'text-slate-700'}`}>
            {canSave && preview.discount > 0 ? `-${formatRupiah(preview.discount)}` : formatRupiah(0)}
          </span>
        </div>
        <div className="flex justify-between border-t border-amber-200 pt-1">
          <span className="font-semibold text-slate-700">Harga jual / {qty} {item.unit || 'pcs'}</span>
          <span className="font-bold text-blue-700">{formatRupiah(finalUnitPrice)}</span>
        </div>
        <div className="flex justify-between text-slate-500">
          <span>Total {qty} {item.unit || 'pcs'}</span>
          <span className="font-bold text-blue-600">{formatRupiah(finalUnitPrice * qty)}</span>
        </div>
      </div>

      {hasInput && !preview.isValid && (
        <p className="text-[11px] font-medium leading-snug text-red-600">
          Potongan tidak boleh melebihi total harga normal ({formatRupiah(normalPrice)}).
        </p>
      )}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={!canSave}
          className="inline-flex flex-1 items-center justify-center gap-1 rounded-lg bg-amber-500 py-2 text-xs font-bold text-white transition-colors hover:bg-amber-600 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
        >
          <FiCheck className="h-3.5 w-3.5" />
          Terapkan
        </button>
        <button
          type="button"
          onClick={handleClear}
          disabled={currentDiscount === 0}
          className="inline-flex items-center justify-center gap-1 rounded-lg border border-blue-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition-colors hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <FiTrash2 className="h-3.5 w-3.5" />
          Hapus
        </button>
      </div>

      <p className="text-[10px] leading-snug text-amber-700">
        Potongan dihitung <strong>per baris transaksi</strong> dan hanya tersedia di
        Cabang Utama.
      </p>
    </div>
  );
}