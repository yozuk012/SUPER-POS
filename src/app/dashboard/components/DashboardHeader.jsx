'use client';

import { FiCalendar } from 'react-icons/fi';

export default function DashboardHeader() {
  const today = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="rounded-xl bg-gradient-to-r from-white via-blue-50 to-blue-100 border border-blue-100 p-5 sm:p-6 mb-6 shadow-sm">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <div className="w-6 h-6 rounded-md bg-blue-600 flex items-center justify-center">
              <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </div>
            <span className="text-xs font-semibold text-blue-700 uppercase tracking-wide">
              SuperPOS
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard Overview</h1>
          <p className="text-slate-600 text-sm mt-1">
            Pantau performa toko dan keuangan UMKM Anda secara real-time.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-white text-blue-700 px-4 py-2.5 rounded-lg border border-blue-200 shadow-sm w-fit">
          <FiCalendar className="text-lg" />
          <span className="font-medium text-sm capitalize">{today}</span>
        </div>
      </div>
    </div>
  );
}