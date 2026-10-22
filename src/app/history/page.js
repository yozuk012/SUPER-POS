// src/app/history/page.js
"use client";

import React from "react";
import PageLayout from "@/components/PageLayout";
import HistoryFilters from "./components/HistoryFilters";
import HistoryList from "./components/HistoryList";
import useHistory from "@/hooks/useHistory";

export default function HistoryPage() {
  const {
    paginatedData,
    periods,
    activePeriodIndex,
    setActivePeriodIndex,
    filterChannel,
    setFilterChannel,
    loading,
    error,
  } = useHistory();

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
            />

          </div>
        </div>
      </div>
    </PageLayout>
  );
}