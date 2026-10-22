// src/app/transection/components/TransactionFilters.jsx
import { FiSearch, FiTag, FiChevronDown } from 'react-icons/fi';
import { MdStore, MdPublic } from 'react-icons/md';

export default function TransactionFilters({
  search,
  setSearch,
  channel,
  setChannel,
  categories = [],
  categoryId,
  setCategoryId,
  pagination,
  setPage,
}) {
  const getPageNumbers = () => {
    const { currentPage, totalPages } = pagination;
    const pages = [];

    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, currentPage + 2);

    if (endPage - startPage < 4) {
      if (startPage === 1) endPage = Math.min(totalPages, startPage + 4);
      else startPage = Math.max(1, endPage - 4);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  };

  return (
    <div className="p-4">
      {/* Baris 1: Search & Kategori */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FiSearch className="h-5 w-5 text-blue-500" />
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama produk atau SKU..."
            className="block w-full pl-10 pr-3 py-2.5 bg-white border border-blue-200 rounded-lg text-sm text-slate-700 placeholder-slate-400 focus:ring-2 focus:ring-blue-400 focus:border-blue-500 transition-colors outline-none"
          />
        </div>

        <div className="relative sm:w-48">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FiTag className="h-5 w-5 text-blue-500" />
          </div>
          <select
            value={categoryId}
            onChange={(e) => {
              setCategoryId(e.target.value);
              setPage(1);
            }}
            className="block w-full pl-10 pr-8 py-2.5 bg-white border border-blue-200 rounded-lg text-sm text-slate-700 focus:ring-2 focus:ring-blue-400 focus:border-blue-500 transition-colors outline-none appearance-none cursor-pointer"
          >
            <option value="all">Semua Kategori</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
          <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
            <FiChevronDown className="w-4 h-4 text-blue-600" />
          </div>
        </div>
      </div>

      {/* Baris 2: Channel Toggle */}
      <div className="flex bg-blue-100 p-1 rounded-lg mb-4">
        <button
          onClick={() => {
            setChannel('offline');
            setPage(1);
          }}
          className={`flex-1 px-4 py-2 text-sm font-bold rounded-md transition-all flex items-center justify-center gap-2 ${
            channel === 'offline'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30'
              : 'text-blue-700 hover:bg-blue-50'
          }`}
        >
          <MdStore className="w-4 h-4" /> Offline
        </button>
        <button
          onClick={() => {
            setChannel('online');
            setPage(1);
          }}
          className={`flex-1 px-4 py-2 text-sm font-bold rounded-md transition-all flex items-center justify-center gap-2 ${
            channel === 'online'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30'
              : 'text-blue-700 hover:bg-blue-50'
          }`}
        >
          <MdPublic className="w-4 h-4" /> Online
        </button>
      </div>

      {/* Baris 3: Pagination & Info */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-3 border-t border-blue-200">
        <div className="text-sm text-slate-600 text-center sm:text-left">
          Menampilkan <span className="font-bold text-blue-700">
            {pagination.totalItems === 0 ? 0 : (pagination.currentPage - 1) * 10 + 1}
          </span> - <span className="font-bold text-blue-700">
            {Math.min(pagination.currentPage * 10, pagination.totalItems)}
          </span> dari <span className="font-bold text-blue-700">{pagination.totalItems}</span> produk
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setPage(pagination.currentPage - 1)}
            disabled={pagination.currentPage === 1}
            className="px-3 py-1.5 text-sm font-semibold text-blue-700 bg-white border border-blue-200 rounded-md hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Prev
          </button>

          {getPageNumbers().map((num) => (
            <button
              key={num}
              onClick={() => setPage(num)}
              className={`px-3 py-1.5 text-sm font-semibold rounded-md border transition-colors ${
                pagination.currentPage === num
                  ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                  : 'bg-white text-blue-700 border-blue-200 hover:bg-blue-50'
              }`}
            >
              {num}
            </button>
          ))}

          <button
            onClick={() => setPage(pagination.currentPage + 1)}
            disabled={pagination.currentPage === pagination.totalPages || pagination.totalPages === 0}
            className="px-3 py-1.5 text-sm font-semibold text-blue-700 bg-white border border-blue-200 rounded-md hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}