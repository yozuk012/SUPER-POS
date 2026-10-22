"use client";

import React from "react";

const formatRupiah = (number) => {
  if (number === null || number === undefined) return "0";
  return new Intl.NumberFormat("id-ID", {
    style: "decimal",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(number);
};

const SummaryCard = ({ title, value, isCurrency = false, highlight = false }) => {
  const displayValue = isCurrency ? `Rp ${formatRupiah(value)}` : value;

  return (
    <div
      className={`flex flex-col items-center justify-center p-2.5 sm:p-4 rounded-xl shadow-sm transition-all hover:scale-[1.02] hover:shadow-md ${
        highlight
          ? "relative overflow-hidden bg-gradient-to-br from-blue-700 via-blue-600 to-blue-600 border border-blue-600"
          : "bg-white border border-blue-200"
      }`}
    >
      {highlight && (
        <div className="absolute -top-4 -right-4 w-16 h-16 bg-white/10 rounded-full pointer-events-none" />
      )}

      <span className={`relative text-[10px] sm:text-xs mb-1 text-center leading-tight ${
        highlight ? "text-blue-50 font-semibold" : "text-slate-500 font-semibold"
      }`}>
        {title}
      </span>
      <span className={`relative text-[13px] sm:text-base lg:text-lg font-bold text-center break-words tabular-nums ${
        highlight ? "text-white" : "text-slate-900"
      }`}>
        {displayValue}
      </span>
    </div>
  );
};

export default function ReportSummaryCards({ summary, availableProducts }) {
  return (
    <div className="px-3 sm:px-6 py-4">

      {/* Grid 6 kolom di desktop */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3 mb-3">
        <SummaryCard title="Produk Terjual" value={summary.totalProducts || 0} />
        <SummaryCard title="Total Penjualan" value={summary.totalSales} isCurrency />
        <SummaryCard title="Biaya Operasional" value={summary.totalOps} isCurrency />

        <SummaryCard title="Total Modal (HPP)" value={summary.totalHpp} isCurrency />
        <SummaryCard title="Total Transaksi" value={summary.totalTransactions || 0} />
        <SummaryCard title="Produk Tersedia" value={availableProducts || 0} />
      </div>

      {/* Laba Kotor & Bersih: highlight gradient biru */}
      <div className="grid grid-cols-2 gap-2 sm:gap-3 mt-4 pt-4 border-t border-blue-200">
        <SummaryCard
          title="Laba Kotor"
          value={summary.grossProfit}
          isCurrency
          highlight
        />
        <SummaryCard
          title="Laba Bersih"
          value={summary.netProfit}
          isCurrency
          highlight
        />
      </div>

    </div>
  );
}
