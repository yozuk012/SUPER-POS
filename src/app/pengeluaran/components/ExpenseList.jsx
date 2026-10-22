'use client';

import { FiCalendar, FiEdit2, FiTrash2, FiInbox, FiTag } from 'react-icons/fi';

export default function ExpenseList({ expenses, isLoading, onEdit, onDelete }) {
  const formatRupiah = (angka) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(angka || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const options = { day: 'numeric', month: 'long', year: 'numeric' };
    return new Date(dateString).toLocaleDateString('id-ID', options);
  };

  const handleDeleteClick = (item) => {
    if (window.confirm(`Yakin ingin menghapus pengeluaran "${item.category}" sebesar ${formatRupiah(item.amount)}?`)) {
      onDelete(item.id);
    }
  };

  // ═══ LOADING ═══
  if (isLoading) {
    return (
      <div className="relative overflow-hidden bg-gradient-to-br from-white via-blue-50 to-blue-100 rounded-xl shadow-sm p-6 border border-blue-200">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 via-blue-500 to-blue-400" />
        <div className="flex items-center justify-between mb-4 pt-1">
          <div className="h-6 bg-blue-200/60 rounded w-1/3 animate-pulse"></div>
          <div className="h-6 bg-blue-200/60 rounded w-1/6 animate-pulse"></div>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex justify-between items-center p-4 bg-white/60 rounded-lg animate-pulse">
              <div className="flex-1">
                <div className="h-4 bg-blue-200/60 rounded w-1/4 mb-2"></div>
                <div className="h-3 bg-blue-200/40 rounded w-1/2"></div>
              </div>
              <div className="h-5 bg-blue-200/60 rounded w-20"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ═══ EMPTY STATE ═══
  if (!isLoading && expenses.length === 0) {
    return (
      <div className="relative overflow-hidden bg-gradient-to-br from-white via-blue-50 to-blue-100 rounded-xl shadow-sm p-10 border-2 border-dashed border-blue-300 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 mb-4">
          <FiInbox className="w-8 h-8 text-blue-400" />
        </div>
        <h3 className="text-lg font-bold text-slate-800 mb-1">Belum Ada Pengeluaran</h3>
        <p className="text-sm text-slate-500 max-w-sm mx-auto">
          Gunakan formulir di atas untuk mulai mencatat biaya operasional toko Anda hari ini.
        </p>
      </div>
    );
  }

  // ═══ LIST ═══
  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-white via-blue-50 to-blue-100 rounded-xl shadow-sm p-5 sm:p-6 border border-blue-200">
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 via-blue-500 to-blue-400" />

      <div className="relative flex items-center justify-between mb-4 pt-1">
        <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <span className="w-1 h-5 bg-gradient-to-b from-blue-600 to-blue-400 rounded-full" />
          <FiInbox className="text-blue-600 w-5 h-5" />
          Riwayat Pengeluaran
        </h3>
        <span className="bg-blue-100 text-blue-700 border border-blue-200 text-xs font-bold px-3 py-1 rounded-full">
          {expenses.length} Catatan
        </span>
      </div>

      <div className="relative space-y-2.5">
        {expenses.map((item) => (
          <div
            key={item.id}
            className="group flex flex-col md:flex-row md:items-center justify-between p-3.5 bg-white hover:bg-blue-50 rounded-lg border border-blue-200 hover:border-blue-400 transition-all duration-200"
          >
            {/* Kiri: Info */}
            <div className="flex-1 mb-2 md:mb-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="bg-blue-100 border border-blue-200 text-blue-700 text-xs font-bold px-2.5 py-1 rounded-lg flex items-center gap-1">
                  <FiTag className="w-3 h-3" />
                  {item.category}
                </span>
                <span className="text-xs text-slate-500 flex items-center gap-1">
                  <FiCalendar className="w-3 h-3" />
                  {formatDate(item.expense_date)}
                </span>
              </div>

              {item.description && (
                <p className="text-sm text-slate-600 mt-1 pl-0.5">
                  {item.description}
                </p>
              )}
            </div>

            {/* Kanan: Nominal & Aksi */}
            <div className="flex items-center justify-between md:justify-end gap-3">
              <span className="text-base font-bold text-red-600 whitespace-nowrap bg-red-50 border border-red-200 px-2.5 py-1 rounded-md">
                − {formatRupiah(item.amount)}
              </span>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => onEdit(item)}
                  className="p-2 text-blue-700 bg-blue-100 hover:bg-blue-200 rounded-lg transition-colors min-h-9 min-w-9 flex items-center justify-center"
                  title="Edit"
                >
                  <FiEdit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDeleteClick(item)}
                  className="p-2 text-red-700 bg-red-100 hover:bg-red-200 rounded-lg transition-colors min-h-9 min-w-9 flex items-center justify-center"
                  title="Hapus"
                >
                  <FiTrash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}