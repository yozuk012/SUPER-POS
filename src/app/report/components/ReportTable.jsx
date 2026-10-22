"use client";

import React, { useState, useEffect } from "react";
import { HiChevronLeft, HiChevronRight } from "react-icons/hi";

const formatDate = (dateString) => {
  if (!dateString) return "-";
  const date = new Date(dateString);
  return date.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const formatRupiah = (number) => {
  if (number === null || number === undefined) return "0";
  return new Intl.NumberFormat("id-ID", {
    style: "decimal",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(number);
};

const getStatusClass = (status = "") => {
  if (status.includes("Gagal")) return "bg-red-100 text-red-700";
  if (status.includes("Pending")) return "bg-yellow-100 text-yellow-700";
  return "bg-green-100 text-green-700";
};

const getChannelClass = (channel) =>
  channel === "Online"
    ? "bg-blue-100 text-blue-700 border border-blue-200"
    : "bg-slate-100 text-slate-700 border border-slate-200";

export default function ReportTable({ reports = [], loading, error }) {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const totalPages = Math.max(1, Math.ceil(reports.length / itemsPerPage));
  const safePage = Math.min(Math.max(1, currentPage), totalPages);

  useEffect(() => {
    setCurrentPage(1);
  }, [reports]);

  const startIndex = (safePage - 1) * itemsPerPage;
  const currentReports = reports.slice(startIndex, startIndex + itemsPerPage);

  if (error) {
    return (
      <div
        role="alert"
        className="mx-3 sm:mx-6 my-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-xs sm:text-sm"
      >
        <p className="font-bold mb-0.5">Gagal memuat data laporan</p>
        <p>{error}</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-slate-500 text-sm font-medium">Memuat data laporan...</span>
      </div>
    );
  }

  if (reports.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-slate-500 px-4 text-center">
        <p className="text-base font-bold text-slate-800 mb-1">Tidak ada data laporan</p>
        <p className="text-xs">Coba ubah filter tanggal atau channel penjualan.</p>
      </div>
    );
  }

  return (
    <div className="px-3 sm:px-6 py-4">

      {/* ═══ MOBILE & TABLET: Card List ═══ */}
      <div className="block md:hidden space-y-3">
        {currentReports.map((report, index) => (
          <div
            key={report.orderId + "-" + index}
            className="bg-white border border-blue-200 rounded-lg p-3 shadow-sm hover:shadow-md hover:border-blue-400 transition-all"
          >
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="min-w-0">
                <span className="block font-bold text-blue-700 text-sm truncate">
                  #{report.orderId}
                </span>
                <p className="text-xs text-slate-500">{formatDate(report.dateTime)}</p>
              </div>
              <div className="text-right min-w-0 shrink-0">
                <span className="block font-bold text-slate-900 text-sm tabular-nums">
                  {formatRupiah(report.totalSales)}
                </span>
                <p className="text-xs text-slate-500 truncate max-w-[9rem]" title={report.customerName}>
                  {report.customerName}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap justify-between items-center gap-2 mt-3 pt-3 border-t border-blue-100">
              <span className={`px-2 py-1 rounded text-[10px] font-bold ${getChannelClass(report.channel)}`}>
                {report.channel}
              </span>

              <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${getStatusClass(report.status)}`}>
                {report.status}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* ═══ DESKTOP: Table ═══ */}
      <div className="hidden md:block overflow-x-auto rounded-lg border border-blue-200 shadow-sm">
        <table className="min-w-full text-sm text-left text-slate-700">
          <thead className="text-xs text-blue-800 uppercase bg-gradient-to-r from-blue-100 to-blue-50 border-b-2 border-blue-200">
            <tr>
              <th scope="col" className="px-4 py-3 font-bold whitespace-nowrap">No</th>
              <th scope="col" className="px-4 py-3 font-bold whitespace-nowrap">Order Id</th>
              <th scope="col" className="px-4 py-3 font-bold whitespace-nowrap">Customer</th>
              <th scope="col" className="px-4 py-3 font-bold whitespace-nowrap">Date</th>
              <th scope="col" className="px-4 py-3 font-bold text-right whitespace-nowrap">Amount</th>
              <th scope="col" className="px-4 py-3 font-bold whitespace-nowrap">Status</th>
              <th scope="col" className="px-4 py-3 font-bold whitespace-nowrap">Jenis</th>
            </tr>
          </thead>
          <tbody className="bg-white">
            {currentReports.map((report, index) => (
              <tr
                key={report.orderId + "-" + index}
                className="border-b border-blue-100 hover:bg-blue-50 transition-colors last:border-b-0"
              >
                <td className="px-4 py-3 font-bold text-blue-700 whitespace-nowrap">
                  {startIndex + index + 1}
                </td>
                <td className="px-4 py-3 whitespace-nowrap font-semibold text-slate-700">
                  #{report.orderId}
                </td>
                <td className="px-4 py-3 whitespace-nowrap max-w-[150px] truncate" title={report.customerName}>
                  {report.customerName}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-slate-600">
                  {formatDate(report.dateTime)}
                </td>
                <td className="px-4 py-3 text-right font-bold text-slate-900 whitespace-nowrap tabular-nums">
                  {formatRupiah(report.totalSales)}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className={`px-2 py-1 rounded-full text-xs font-bold ${getStatusClass(report.status)}`}>
                    {report.status}
                  </span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className={`px-2 py-1 rounded text-xs font-bold ${getChannelClass(report.channel)}`}>
                    {report.channel}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ═══ Pagination ═══ */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-4 bg-gradient-to-r from-blue-50 to-blue-100 px-3 sm:px-4 py-3 border border-blue-200 rounded-lg">
          <span className="text-xs sm:text-sm text-slate-600 text-center sm:text-left">
            Menampilkan <span className="font-bold text-blue-700">{startIndex + 1}</span> -{" "}
            <span className="font-bold text-blue-700">
              {Math.min(startIndex + itemsPerPage, reports.length)}
            </span>{" "}
            dari <span className="font-bold text-blue-700">{reports.length}</span> data
          </span>
          <div className="flex gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={safePage === 1}
              aria-label="Halaman sebelumnya"
              className="flex-1 sm:flex-none px-2.5 sm:px-3 py-2 rounded border border-blue-200 bg-white text-blue-700 hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors shadow-sm font-semibold min-h-[44px] sm:min-h-[40px]"
            >
              <HiChevronLeft className="w-5 h-5 sm:mr-1" />
              <span className="hidden sm:inline text-sm font-semibold">Sebelumnya</span>
            </button>
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage === totalPages}
              aria-label="Halaman berikutnya"
              className="flex-1 sm:flex-none px-2.5 sm:px-3 py-2 rounded border border-blue-200 bg-white text-blue-700 hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors shadow-sm font-semibold min-h-[44px] sm:min-h-[40px]"
            >
              <span className="hidden sm:inline text-sm font-semibold">Selanjutnya</span>
              <HiChevronRight className="w-5 h-5 sm:ml-1" />
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
