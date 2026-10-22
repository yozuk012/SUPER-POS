'use client';

import { FiTrendingDown, FiInfo } from 'react-icons/fi';

export default function ExpenseSummary({ totalOperationalCost, isLoading }) {
  const formatRupiah = (angka) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(angka || 0);
  };

  if (isLoading) {
    return (
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-blue-600 via-blue-500 to-blue-400 p-6 animate-pulse shadow-lg shadow-blue-500/30">
        <div className="h-5 bg-white/20 rounded w-1/3 mb-3"></div>
        <div className="h-10 bg-white/20 rounded w-1/2"></div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-blue-600 via-blue-500 to-blue-400 shadow-lg shadow-blue-500/30 p-5 sm:p-6 text-white">
      {/* Dekorasi */}
      <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full pointer-events-none" />
      <div className="absolute -bottom-16 -left-12 w-40 h-40 bg-white/5 rounded-full pointer-events-none" />

      <div className="relative">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
            <FiTrendingDown className="w-4 h-4 text-white" />
          </div>
          <div>
            <span className="inline-block bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wide">
              Pengeluaran
            </span>
          </div>
        </div>

        <p className="text-sm font-semibold text-blue-50 tracking-wide uppercase">
          Total Pengeluaran Operasional Bulan Ini
        </p>

        <div className="text-3xl md:text-4xl font-extrabold tracking-tight mt-2">
          {formatRupiah(totalOperationalCost)}
        </div>

        <div className="mt-4 flex items-start gap-2 bg-white/15 backdrop-blur-sm rounded-lg p-3 border border-white/25">
          <FiInfo className="w-5 h-5 text-blue-100 flex-shrink-0 mt-0.5" />
          <p className="text-xs md:text-sm text-blue-50 leading-relaxed">
            Angka ini adalah akumulasi biaya tidak langsung (Listrik, Gas, Sewa, Gaji, dll)
            yang akan dikurangkan dari Laba Kotor Anda di halaman Laporan untuk mendapatkan <strong className="text-white">Laba Bersih</strong>.
          </p>
        </div>
      </div>
    </div>
  );
}