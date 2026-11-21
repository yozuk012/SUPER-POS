// src/app/history/page.js
"use client";

import { useState } from "react";
import PageLayout from "@/components/PageLayout";
import HistoryFilters from "./components/HistoryFilters";
import HistoryList from "./components/HistoryList";
import useHistory from "@/hooks/useHistory";
import ReceiptModal from "@/app/transaksi/components/ReceiptModal";

export default function HistoryPage() {
  const [receiptData, setReceiptData] = useState(null);
  const [voidTarget, setVoidTarget] = useState(null);
  const [voidReason, setVoidReason] = useState('');
  const [voidError, setVoidError] = useState('');
  const {
    paginatedData,
    periods,
    activePeriodIndex,
    setActivePeriodIndex,
    filterChannel,
    setFilterChannel,
    loading,
    error,
    isVoiding,
    voidTransaction,
  } = useHistory();

  const handleVoid = async (event) => {
    event.preventDefault();
    setVoidError('');
    try {
      await voidTransaction(voidTarget.orderId, voidReason);
      setVoidTarget(null);
      setVoidReason('');
    } catch (err) {
      setVoidError(err.message || 'Gagal membatalkan transaksi.');
    }
  };

  return (
    <PageLayout title="Riwayat Transaksi">

      {/* ═══ HERO HEADER — gradient biru solid ═══ */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-blue-600 via-blue-500 to-blue-400 p-5 mb-4 shadow-lg shadow-blue-500/30">
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full pointer-events-none" />
        <div className="absolute -bottom-16 -left-12 w-40 h-40 bg-white/5 rounded-full pointer-events-none" />

        <div className="relative flex items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-6 h-6 rounded-md bg-white flex items-center justify-center">
                <svg className="w-3.5 h-3.5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className="text-xs font-bold text-white/90 uppercase tracking-wider">
                SuperPOS
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white">Riwayat Transaksi</h1>
            <p className="text-blue-50 text-xs mt-0.5">
              Lihat semua transaksi yang telah tercatat di toko Anda.
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col w-full max-w-full overflow-x-hidden">

        {/* Card wrapper utama — gradient + top accent bar */}
        <div className="relative overflow-hidden bg-gradient-to-br from-white via-blue-50 to-blue-100 rounded-xl shadow-sm border border-blue-200">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 via-blue-500 to-blue-400 z-10" />

          <div className="pt-1">

            {/* Banner Error */}
            {error && (
              <div className="mx-4 sm:mx-6 mt-4 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm flex items-start gap-2">
                <span className="font-bold">⚠️</span>
                <span>{error}</span>
              </div>
            )}

            {/* 1. Filter & Navigasi Periode */}
            <HistoryFilters
              filterChannel={filterChannel}
              setFilterChannel={setFilterChannel}
              periods={periods}
              activePeriodIndex={activePeriodIndex}
              setActivePeriodIndex={setActivePeriodIndex}
            />

            {/* 2. List Transaksi */}
            <HistoryList
              paginatedData={paginatedData}
              loading={loading}
              onPrintReceipt={setReceiptData}
              onVoidTransaction={(item) => { setVoidTarget(item); setVoidReason(''); setVoidError(''); }}
            />

          </div>
        </div>
      </div>
      {receiptData && <ReceiptModal receiptData={receiptData} onClose={() => setReceiptData(null)} />}
      {voidTarget && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !isVoiding) setVoidTarget(null); }}>
          <form onSubmit={handleVoid} className="w-full max-w-md rounded-lg bg-white p-5 shadow-xl" role="dialog" aria-modal="true" aria-labelledby="void-title">
            <h2 id="void-title" className="text-lg font-bold text-slate-900">Batalkan transaksi #{voidTarget.orderId}</h2>
            <p className="mt-1 text-sm text-slate-600">Transaksi tetap tercatat dan tidak dihitung dalam laporan. Stok tidak dikembalikan.</p>
            <label htmlFor="void-reason" className="mt-4 block text-sm font-medium text-slate-700">Catatan pembatalan <span className="text-red-600">*</span></label>
            <textarea id="void-reason" required minLength={3} maxLength={500} value={voidReason} onChange={(event) => setVoidReason(event.target.value)} className="mt-1 min-h-24 w-full rounded border border-slate-300 p-2 text-sm focus:border-blue-500 focus:outline-none" placeholder="Contoh: salah input harga" />
            {voidError && <p role="alert" className="mt-2 text-sm text-red-700">{voidError}</p>}
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" disabled={isVoiding} onClick={() => setVoidTarget(null)} className="rounded border border-slate-300 px-3 py-2 text-sm">Kembali</button>
              <button type="submit" disabled={isVoiding || voidReason.trim().length < 3} className="rounded bg-red-600 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50">{isVoiding ? 'Memproses...' : 'Batalkan transaksi'}</button>
            </div>
          </form>
        </div>
      )}
    </PageLayout>
  );
}