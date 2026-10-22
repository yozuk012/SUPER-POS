"use client";

import React from "react";

export default function ReportFilters({
  filterChannel,
  setFilterChannel,
  dateRange,
  setDateRange
}) {

  const channelButtonClass = (isActive) =>
    `w-full md:w-auto px-3 sm:px-4 py-2 rounded-full text-[11px] sm:text-xs font-bold transition-all duration-200 whitespace-nowrap min-h-[44px] md:min-h-[38px] ${
      isActive
        ? "bg-blue-600 text-white shadow-md shadow-blue-500/30"
        : "bg-white hover:bg-blue-100 text-blue-700 border border-blue-200"
    }`;

  return (
    <div className="px-3 sm:px-6 py-4 border-b border-blue-200 flex flex-col md:flex-row md:flex-wrap md:items-center justify-between gap-4">

      {/* Toggle Channel */}
      <div className="w-full md:w-auto">
        <span className="block md:hidden text-[11px] font-bold text-blue-800 mb-2 uppercase tracking-wide">
          Tipe Laporan
        </span>

        <div className="grid grid-cols-3 gap-2 md:flex md:items-center">
          <span className="hidden md:inline text-xs font-bold text-blue-800 mr-2 whitespace-nowrap uppercase tracking-wide">
            Tipe Laporan:
          </span>

          <button
            type="button"
            onClick={() => setFilterChannel("all")}
            className={channelButtonClass(filterChannel === "all")}
          >
            SEMUA
          </button>

          <button
            type="button"
            onClick={() => setFilterChannel("online")}
            className={channelButtonClass(filterChannel === "online")}
          >
            ONLINE
          </button>

          <button
            type="button"
            onClick={() => setFilterChannel("offline")}
            className={channelButtonClass(filterChannel === "offline")}
          >
            OFFLINE
          </button>
        </div>
      </div>

      {/* Filter Tanggal */}
      <div className="w-full md:w-auto">
        <label className="block md:hidden text-[11px] font-bold text-blue-800 mb-2 uppercase tracking-wide">
          Periode
        </label>

        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 md:flex md:gap-3">
          <label className="hidden md:inline text-xs font-bold text-blue-800 uppercase tracking-wide whitespace-nowrap">
            Periode:
          </label>

          <input
            type="date"
            value={dateRange.start}
            onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
            aria-label="Tanggal mulai"
            className="w-full min-w-0 md:w-36 bg-white border border-blue-200 rounded-lg px-2.5 sm:px-3 py-2 text-xs text-slate-700 focus:ring-2 focus:ring-blue-400 focus:border-blue-500 outline-none transition-colors min-h-[44px] md:min-h-[38px]"
          />

          <span className="text-xs text-blue-600 font-bold">s/d</span>

          <input
            type="date"
            value={dateRange.end}
            onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
            aria-label="Tanggal akhir"
            className="w-full min-w-0 md:w-36 bg-white border border-blue-200 rounded-lg px-2.5 sm:px-3 py-2 text-xs text-slate-700 focus:ring-2 focus:ring-blue-400 focus:border-blue-500 outline-none transition-colors min-h-[44px] md:min-h-[38px]"
          />
        </div>
      </div>

    </div>
  );
}
