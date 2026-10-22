// src/app/history/components/HistoryFilters.jsx
"use client";

import React from "react";
import { HiChevronLeft, HiChevronRight } from "react-icons/hi";

export default function HistoryFilters({
  filterChannel,
  setFilterChannel,
  periods,
  activePeriodIndex,
  setActivePeriodIndex
}) {

  const handleChannelChange = (channel) => {
    setFilterChannel(filterChannel === channel ? "all" : channel);
  };

  const handlePrevPeriod = () => {
    if (activePeriodIndex < periods.length - 1) {
      setActivePeriodIndex(activePeriodIndex + 1);
    }
  };

  const handleNextPeriod = () => {
    if (activePeriodIndex > 0) {
      setActivePeriodIndex(activePeriodIndex - 1);
    }
  };

  const currentPeriod = periods[activePeriodIndex];

  const channelBtn = (isActive) =>
    `px-3 py-1 rounded-full text-xs font-bold transition-all ${
      isActive
        ? "bg-blue-600 text-white shadow-sm shadow-blue-500/30"
        : "bg-white text-blue-700 border border-blue-200 hover:bg-blue-50"
    }`;

  return (
    <div className="border-b border-blue-200">

      {/* Toggle Channel */}
      <div className="px-4 py-3 border-b border-blue-100">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-bold text-blue-800 uppercase tracking-wide mr-1 whitespace-nowrap">
            Filter:
          </span>
          <button
            onClick={() => handleChannelChange("online")}
            className={channelBtn(filterChannel === "online")}
          >
            ONLINE
          </button>
          <button
            onClick={() => handleChannelChange("offline")}
            className={channelBtn(filterChannel === "offline")}
          >
            OFFLINE
          </button>
          {filterChannel !== "all" && (
            <button
              onClick={() => setFilterChannel("all")}
              className="text-xs font-semibold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 px-2 py-1 rounded-full transition-colors ml-1"
            >
              ✕ Reset
            </button>
          )}
        </div>
      </div>

      {/* Navigasi Periode */}
      <div className="px-4 py-3 flex items-center justify-between">
        <button
          onClick={handlePrevPeriod}
          disabled={activePeriodIndex >= periods.length - 1}
          className={`p-2 rounded-full transition-colors ${
            activePeriodIndex >= periods.length - 1
              ? "text-slate-300 cursor-not-allowed"
              : "text-blue-700 bg-blue-100 hover:bg-blue-200 active:scale-95"
          }`}
          aria-label="Periode sebelumnya"
        >
          <HiChevronLeft className="w-5 h-5" />
        </button>

        <div className="flex flex-col items-center bg-white border border-blue-200 px-4 py-1.5 rounded-lg shadow-sm">
          <span className="text-[10px] text-blue-700 uppercase tracking-wide font-bold">Periode</span>
          <span className="text-sm font-bold text-slate-800">
            {currentPeriod?.label || "Loading..."}
          </span>
        </div>

        <button
          onClick={handleNextPeriod}
          disabled={activePeriodIndex === 0}
          className={`p-2 rounded-full transition-colors ${
            activePeriodIndex === 0
              ? "text-slate-300 cursor-not-allowed"
              : "text-blue-700 bg-blue-100 hover:bg-blue-200 active:scale-95"
          }`}
          aria-label="Periode selanjutnya"
        >
          <HiChevronRight className="w-5 h-5" />
        </button>
      </div>

    </div>
  );
}