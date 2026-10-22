// src/app/history/components/HistoryList.jsx
"use client";

import React from "react";
import { HiCalendar, HiInbox } from "react-icons/hi";

const getStatusStyle = (status = "") => {
  if (status.includes("Gagal")) return "bg-red-100 text-red-700 border border-red-200";
  if (status.includes("Pending")) return "bg-yellow-100 text-yellow-700 border border-yellow-200";
  return "bg-green-100 text-green-700 border border-green-200";
};

const getChannelStyle = (channel) =>
  channel === "online"
    ? "bg-blue-100 text-blue-700 border border-blue-200"
    : "bg-slate-100 text-slate-700 border border-slate-200";

const formatRupiah = (number) =>
  new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 }).format(number || 0);

const formatItems = (items = []) =>
  items.map((item) => `${item.name} x ${item.qty}`).join(", ");

/* ═══ Card Mobile ═══ */
const HistoryCard = ({ item, index }) => (
  <div className="bg-white border border-blue-200 rounded-lg p-3 shadow-sm hover:shadow-md hover:border-blue-400 transition-all">
    <div className="flex items-start justify-between gap-2">
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-xs font-bold text-blue-600 w-5 shrink-0">{index + 1}.</span>
        <div className="min-w-0">
          <p className="text-sm font-bold text-slate-900 truncate">#{item.orderId}</p>
          <p className="text-xs text-slate-500 truncate">{item.customerName}</p>
          <p className="text-xs text-slate-700 truncate" title={formatItems(item.items)}>
            {formatItems(item.items) || "Tidak ada detail produk"}
          </p>
        </div>
      </div>
      <div className="text-right shrink-0">
        <p className="text-sm font-bold text-slate-900">Rp {formatRupiah(item.totalAmount)}</p>
        {item.discountAmount > 0 && (
          <p className="text-[11px] font-semibold text-red-600">
            Diskon -Rp {formatRupiah(item.discountAmount)}
          </p>
        )}
        <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${getChannelStyle(item.channel)}`}>
          {item.channel === "online" ? "Online" : "Offline"}
        </span>
      </div>
    </div>
    <div className="flex items-center justify-between mt-2 pt-2 border-t border-blue-100">
      <span className="text-xs text-slate-500">
        {item.date} • {item.time}
      </span>
      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${getStatusStyle(item.status)}`}>
        {item.status}
      </span>
    </div>
  </div>
);

/* ═══ Table Desktop ═══ */
const HistoryTable = ({ items }) => (
  <div className="hidden sm:block overflow-x-auto rounded-lg border border-blue-200 shadow-sm">
    <table className="min-w-full text-sm text-left text-slate-700">
      <thead className="text-xs uppercase bg-gradient-to-r from-blue-100 to-blue-50 border-b-2 border-blue-200">
        <tr>
          <th className="px-4 py-3 font-bold text-blue-800 whitespace-nowrap">No</th>
          <th className="px-4 py-3 font-bold text-blue-800 whitespace-nowrap">Order Id</th>
          <th className="px-4 py-3 font-bold text-blue-800 whitespace-nowrap">Customer</th>
          <th className="px-4 py-3 font-bold text-blue-800 whitespace-nowrap">Produk</th>
          <th className="px-4 py-3 font-bold text-blue-800 whitespace-nowrap">Date</th>
          <th className="px-4 py-3 font-bold text-blue-800 whitespace-nowrap">Jam</th>
          <th className="px-4 py-3 font-bold text-blue-800 whitespace-nowrap">Status</th>
          <th className="px-4 py-3 font-bold text-blue-800 text-right whitespace-nowrap">Diskon</th>
          <th className="px-4 py-3 font-bold text-blue-800 text-right whitespace-nowrap">Amount</th>
        </tr>
      </thead>
      <tbody className="bg-white">
        {items.map((item, index) => (
          <tr key={item.orderId} className="border-b border-blue-100 hover:bg-blue-50 transition-colors last:border-b-0">
            <td className="px-4 py-3 font-bold text-blue-700 whitespace-nowrap">{index + 1}</td>
            <td className="px-4 py-3 font-semibold text-slate-900 whitespace-nowrap">#{item.orderId}</td>
            <td className="px-4 py-3 whitespace-nowrap max-w-[160px] truncate" title={item.customerName}>
              {item.customerName}
            </td>
            <td className="px-4 py-3 max-w-[220px]" title={formatItems(item.items)}>
              <span className="block truncate">
                {formatItems(item.items) || "Tidak ada detail produk"}
              </span>
            </td>
            <td className="px-4 py-3 whitespace-nowrap text-slate-600">{item.date}</td>
            <td className="px-4 py-3 whitespace-nowrap text-slate-600">{item.time}</td>
            <td className="px-4 py-3 whitespace-nowrap">
              <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${getStatusStyle(item.status)}`}>
                {item.status}
              </span>
            </td>
            <td className="px-4 py-3 text-right whitespace-nowrap">
              {item.discountAmount > 0 ? (
                <span className="font-semibold text-red-600">-Rp {formatRupiah(item.discountAmount)}</span>
              ) : (
                <span className="text-slate-400">-</span>
              )}
            </td>
            <td className="px-4 py-3 text-right font-bold text-slate-900 whitespace-nowrap">
              Rp {formatRupiah(item.totalAmount)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

/* ═══ Section per Bulan ═══ */
const MonthSection = ({ monthKey, items }) => (
  <section>
    <div className="flex items-center justify-between mb-2">
      <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900">
        <span className="w-1 h-4 bg-gradient-to-b from-blue-600 to-blue-400 rounded-full" />
        <HiCalendar className="w-4 h-4 text-blue-600" />
        {monthKey}
      </h2>
      <span className="text-xs font-bold text-blue-700 bg-blue-100 border border-blue-200 px-2 py-0.5 rounded-full">
        {items.length} transaksi
      </span>
    </div>

    {items.length === 0 ? (
      <p className="text-xs text-slate-500 italic bg-white border border-dashed border-blue-200 rounded-lg px-4 py-3">
        Tidak ada transaksi pada bulan ini.
      </p>
    ) : (
      <>
        <div className="sm:hidden space-y-2">
          {items.map((item, index) => (
            <HistoryCard key={item.orderId} item={item} index={index} />
          ))}
        </div>
        <HistoryTable items={items} />
      </>
    )}
  </section>
);

/* ═══ Komponen Utama ═══ */
export default function HistoryList({ paginatedData, loading }) {

  if (loading) {
    return (
      <div className="flex justify-center items-center py-16">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-200 border-t-blue-600"></div>
        <span className="ml-3 text-sm text-slate-500 font-semibold">Memuat riwayat...</span>
      </div>
    );
  }

  const monthKeys = Object.keys(paginatedData || {});
  const hasAnyData = monthKeys.some((key) => (paginatedData[key] || []).length > 0);

  if (!hasAnyData) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-slate-500 px-4 text-center">
        <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mb-3">
          <HiInbox className="w-8 h-8 text-blue-400" />
        </div>
        <p className="text-base font-bold text-slate-800">Tidak ada riwayat transaksi</p>
        <p className="text-xs mt-1">pada periode yang dipilih.</p>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 py-4 space-y-6">
      {monthKeys.map((monthKey) => (
        <MonthSection
          key={monthKey}
          monthKey={monthKey}
          items={paginatedData[monthKey] || []}
        />
      ))}
    </div>
  );
}