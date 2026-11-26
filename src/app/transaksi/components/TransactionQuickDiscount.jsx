// src/app/transaksi/components/TransactionQuickDiscount.jsx
//
// Diskon Cepat versi SATU TOMBOL untuk seluruh transaksi (bukan per item).
// Kasir cukup menekan satu tombol di ringkasan keranjang, lalu mengisi nominal
// potongan (Rp) untuk total belanja pelanggan.
'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { FiCheck, FiTag, FiTrash2, FiX, FiZap } from 'react-icons/fi';
import { parseNumberUI, resolveQuickDiscount } from '@/lib/productUtils';
import { formatRupiah } from '@/lib/formatUtils';

const PRESET_DISCOUNTS = [1000, 2000, 5000, 10000];

export default function TransactionQuickDiscount({
  subtotal,
  discount,
  onApply,
  onClear,
  disabled = false,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const dialogRef = useRef(null);
  const titleId = useId();
  const inputId = useId();
  const errorId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (isOpen && dialog && !dialog.open) dialog.showModal();
    if (!isOpen && dialog?.open) dialog.close();
  }, [isOpen]);

  const normalTotal = Math.max(0, Math.round(Number(subtotal) || 0));
  const currentDiscount = Math.max(0, Math.round(Number(discount) || 0));

  const inputValue = parseNumberUI(draft);
  const hasInput = draft.trim() !== '';
  const preview = resolveQuickDiscount({ normalPrice: normalTotal, value: inputValue });
  const canSave = hasInput && preview.isValid;
  const finalTotal = canSave ? preview.finalPrice : Math.max(0, normalTotal - currentDiscount);
  const presets = PRESET_DISCOUNTS.filter((amount) => amount <= normalTotal);

  const openPanel = () => {
    setDraft(currentDiscount > 0 ? String(currentDiscount) : '');
    setIsOpen(true);
  };

  const closePanel = () => {
    setIsOpen(false);
    if (dialogRef.current?.open) dialogRef.current.close();
  };

  const handleSave = () => {
    if (!canSave) return;
    onApply(preview.discount);
    closePanel();
  };

  const handleClear = () => {
    onClear();
    setDraft('');
    closePanel();
  };

  return (
    <>
      <button
        type="button"
        onClick={openPanel}
        disabled={disabled}
        title="Beri potongan harga (Rp) untuk total transaksi ini"
        className={`flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
          currentDiscount > 0
            ? 'border-amber-300 bg-amber-100 text-amber-700 hover:bg-amber-200'
            : 'border-blue-200 bg-white text-blue-700 hover:bg-blue-50'
        }`}
      >
        <FiZap className="h-4 w-4" />
        {currentDiscount > 0
          ? `Diskon Cepat: -${formatRupiah(currentDiscount)}`
          : 'Diskon Cepat (Total Transaksi)'}
      </button>
      <dialog
        ref={dialogRef}
        aria-labelledby={titleId}
        onClose={() => setIsOpen(false)}
        className="m-auto max-h-[90vh] w-[calc(100%-2rem)] max-w-md overflow-y-auto rounded-lg border border-amber-300 bg-amber-50 p-0 shadow-2xl"
      >
        <div className="space-y-3 p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 id={titleId} className="flex items-center gap-1.5 text-base font-bold text-amber-900">
                <FiTag aria-hidden="true" className="h-4 w-4" />
                Diskon Cepat
              </h1>
              <p className="mt-1 text-xs leading-snug text-amber-800">
                Potongan dihitung sekali untuk seluruh keranjang, bukan per item.
              </p>
            </div>
            <button
              type="button"
              onClick={closePanel}
              aria-label="Tutup tanpa menyimpan"
              className="rounded p-2 text-slate-500 transition-colors hover:bg-white hover:text-slate-700"
            >
              <FiX aria-hidden="true" className="h-4 w-4" />
            </button>
          </div>

          <div>
            <label htmlFor={inputId} className="mb-1 block text-xs font-semibold text-slate-700">
              Nominal potongan harga total transaksi
            </label>
            <div className="relative">
              <span aria-hidden="true" className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-500">
                Rp
              </span>
              <input
                id={inputId}
                type="text"
                inputMode="numeric"
                value={inputValue > 0 ? inputValue.toLocaleString('id-ID') : ''}
                onChange={(event) => setDraft(event.target.value)}
                placeholder="5.000"
                aria-label="Nominal potongan harga total transaksi"
                aria-invalid={hasInput && !preview.isValid}
                aria-describedby={hasInput && !preview.isValid ? errorId : undefined}
                autoFocus
                className="w-full rounded-lg border border-amber-300 bg-white py-2.5 pl-10 pr-3 text-base font-bold text-slate-800 outline-none transition-all focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
              />
            </div>
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

          <div className="space-y-1 rounded-md border border-amber-200 bg-white p-3 text-xs">
            <div className="flex justify-between text-slate-500">
              <span>Total belanja</span>
              <span className="font-semibold text-slate-700">{formatRupiah(normalTotal)}</span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>Potongan</span>
              <span className={`font-semibold ${canSave && preview.discount > 0 ? 'text-red-600' : 'text-slate-700'}`}>
                {canSave && preview.discount > 0 ? `-${formatRupiah(preview.discount)}` : formatRupiah(0)}
              </span>
            </div>
            <div className="flex justify-between border-t border-amber-200 pt-1.5">
              <span className="font-semibold text-slate-700">Total bayar</span>
              <span className="font-bold text-blue-700">{formatRupiah(finalTotal)}</span>
            </div>
          </div>

          {hasInput && !preview.isValid && (
            <p id={errorId} className="text-xs font-medium leading-snug text-red-600">
              Potongan tidak boleh melebihi total belanja ({formatRupiah(normalTotal)}).
            </p>
          )}

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={handleSave}
              disabled={!canSave}
              className="inline-flex min-h-11 flex-1 items-center justify-center gap-1 rounded-lg bg-amber-500 px-3 py-2 text-sm font-bold text-white transition-colors hover:bg-amber-600 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
            >
              <FiCheck aria-hidden="true" className="h-4 w-4" />
              Terapkan
            </button>
            <button
              type="button"
              onClick={handleClear}
              disabled={currentDiscount === 0}
              className="inline-flex min-h-11 items-center justify-center gap-1 rounded-lg border border-blue-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 transition-colors hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <FiTrash2 aria-hidden="true" className="h-4 w-4" />
              Hapus
            </button>
          </div>
        </div>
      </dialog>
    </>
  );
}