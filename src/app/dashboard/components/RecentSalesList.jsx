'use client';

import { FiClock, FiCheckCircle, FiXCircle, FiMinusCircle } from 'react-icons/fi';

const formatIDR = (value) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value || 0);
};

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const getStatusBadge = (status) => {
  const lowerStatus = status?.toLowerCase();
  if (lowerStatus === 'success') {
    return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700"><FiCheckCircle size={12} /> Sukses</span>;
  }
  if (lowerStatus === 'pending') {
    return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700"><FiClock size={12} /> Pending</span>;
  }
  if (lowerStatus === 'failed') {
    return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700"><FiXCircle size={12} /> Gagal</span>;
  }
  return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700"><FiMinusCircle size={12} /> {status || 'Cash'}</span>;
};

export default function RecentSalesList({ sales }) {
  if (!sales || sales.length === 0) {
    return (
      <div className="relative overflow-hidden bg-gradient-to-br from-white via-blue-50 to-blue-100 p-6 rounded-xl border border-blue-200 shadow-sm">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 via-blue-500 to-blue-400" />
        <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
          <span className="w-1.5 h-5 bg-gradient-to-b from-blue-600 to-blue-400 rounded-full" />
          Riwayat Penjualan Terakhir
        </h2>
        <p className="text-slate-500 text-sm text-center py-8">Belum ada transaksi tercatat.</p>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-white via-blue-50 to-blue-100 p-6 rounded-xl border border-blue-200 shadow-sm">
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 via-blue-500 to-blue-400" />

      <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
        <span className="w-1.5 h-5 bg-gradient-to-b from-blue-600 to-blue-400 rounded-full" />
        Riwayat Penjualan Terakhir
      </h2>

      {/* DESKTOP TABLE VIEW */}
      <div className="hidden md:block overflow-x-auto rounded-lg border border-blue-200 shadow-sm">
        <table className="min-w-full divide-y divide-blue-200 bg-white">
          <thead className="bg-gradient-to-r from-blue-100 to-blue-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-bold text-blue-800 uppercase tracking-wider">No. Struk</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-blue-800 uppercase tracking-wider">Tanggal</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-blue-800 uppercase tracking-wider">Channel</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-blue-800 uppercase tracking-wider">Total</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-blue-800 uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-blue-100">
            {sales.map((sale) => (
              <tr key={sale.id} className="hover:bg-blue-50 transition-colors">
                <td className="px-4 py-3 whitespace-nowrap text-sm font-bold text-blue-700">#{sale.id}</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600">{formatDate(sale.sale_date)}</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600 capitalize">{sale.channel}</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm font-bold text-slate-900">{formatIDR(sale.grand_total)}</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm">{getStatusBadge(sale.qris_status || sale.payment_method)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MOBILE CARD VIEW */}
      <div className="md:hidden space-y-3">
        {sales.map((sale) => (
          <div
            key={sale.id}
            className="bg-white border border-blue-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-xs font-bold text-blue-600 uppercase tracking-wider">No. Struk</p>
                <p className="text-sm font-bold text-blue-700">#{sale.id}</p>
              </div>
              <div className="text-right">
                {getStatusBadge(sale.qris_status || sale.payment_method)}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tanggal</p>
                <p className="text-sm text-slate-600">{formatDate(sale.sale_date)}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Channel</p>
                <p className="text-sm text-slate-600 capitalize">{sale.channel}</p>
              </div>
            </div>

            <div className="pt-3 border-t border-blue-100">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Total</p>
              <p className="text-lg font-bold text-slate-900">{formatIDR(sale.grand_total)}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}