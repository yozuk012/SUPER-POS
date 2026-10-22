// src/app/report/page.js
"use client";

import React, { useState } from "react";
import PageLayout from "@/components/PageLayout";
import ReportFilters from "./components/ReportFilters";
import ReportSummaryCards from "./components/ReportSummaryCards";
import ReportTable from "./components/ReportTable";
import useReport from "@/hooks/useReport";

export default function ReportPage() {
  const [filterChannel, setFilterChannel] = useState("all");
  const [dateRange, setDateRange] = useState({
    start: "",
    end: "",
  });

  // Pass filters to the hook, and get filtered reports + summary back
  const { reports, availableProducts, summary, loading, error } = useReport({
    channel: filterChannel,
    dateRange,
  });

  return (
    <PageLayout title="Laporan">

      {/* ═══ HEADER HERO: gradient biru solid ═══ */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-blue-700 via-blue-600 to-blue-500 p-4 sm:p-5 mb-4 shadow-lg shadow-blue-500/30">
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full pointer-events-none" />
        <div className="absolute -bottom-16 -left-12 w-40 h-40 bg-white/5 rounded-full pointer-events-none" />

        <div className="relative flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-md bg-white flex items-center justify-center shrink-0">
                <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M9 17v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6m4 0h6m-6 0H3m6 0v-4m6 4V7a2 2 0 00-2-2h-2a2 2 0 00-2 2v10m6 0h6m-6 0h6m-6 0v-4m6 4v-6a2 2 0 00-2-2h-2a2 2 0 00-2 2v6" />
                </svg>
              </div>
              <span className="text-[10px] sm:text-xs font-bold text-white/90 uppercase tracking-wider">
                SuperPOS
              </span>
            </div>
            <h1 className="text-lg sm:text-2xl font-bold text-white">Laporan Penjualan</h1>
            <p className="text-blue-50 text-[11px] sm:text-xs mt-0.5 leading-relaxed">
              Pantau performa penjualan, biaya, dan laba pada periode terpilih.
            </p>
          </div>
        </div>
      </div>

      {/* ═══ KONTEN UTAMA ═══ */}
      <div className="flex flex-col w-full max-w-full overflow-x-hidden">

        {/* Card wrapper utama: gradient + top accent bar */}
        <div className="relative overflow-hidden bg-gradient-to-br from-white via-blue-50 to-blue-100 rounded-xl shadow-sm border border-blue-200 flex flex-col">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 via-blue-500 to-blue-400 z-10" />

          <div className="pt-1">
            {/* 1. Filters */}
            <ReportFilters
              filterChannel={filterChannel}
              setFilterChannel={setFilterChannel}
              dateRange={dateRange}
              setDateRange={setDateRange}
            />

            {/* 2. Summary Cards */}
            <ReportSummaryCards summary={summary} availableProducts={availableProducts} />

            {/* 3. Table */}
            <ReportTable reports={reports} loading={loading} error={error} />
          </div>
        </div>
      </div>
    </PageLayout>
  );
}