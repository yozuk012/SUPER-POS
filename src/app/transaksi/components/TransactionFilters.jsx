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
  setPage,
}) {
  return (
    <div className="grid grid-cols-2 gap-2 p-2 @min-[42rem]:grid-cols-[minmax(0,1fr)_10rem_12rem] sm:p-3">
        <div className="relative col-span-2 min-w-0 @min-[42rem]:col-span-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FiSearch className="h-5 w-5 text-blue-500" />
          </div>
          <input
            type="text"
            aria-label="Cari produk berdasarkan nama atau SKU"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Cari nama produk atau SKU..."
            className="block w-full pl-10 pr-3 py-2.5 bg-white border border-blue-200 rounded-lg text-sm text-slate-700 placeholder-slate-400 focus:ring-2 focus:ring-blue-400 focus:border-blue-500 transition-colors outline-none"
          />
        </div>

        <div className="relative min-w-0">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FiTag className="h-5 w-5 text-blue-500" />
          </div>
          <select
            aria-label="Kategori produk"
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
      <div className="flex min-w-0 rounded-lg bg-blue-100 p-1">
        <button
          type="button"
          aria-pressed={channel === 'offline'}
          onClick={() => {
            setChannel('offline');
            setPage(1);
          }}
          className={`min-w-0 flex-1 px-1 py-2 text-xs sm:text-sm font-bold rounded-md transition-all flex items-center justify-center gap-1 ${
            channel === 'offline'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30'
              : 'text-blue-700 hover:bg-blue-50'
          }`}
        >
          <MdStore className="w-4 h-4" /> Offline
        </button>
        <button
          type="button"
          aria-pressed={channel === 'online'}
          onClick={() => {
            setChannel('online');
            setPage(1);
          }}
          className={`min-w-0 flex-1 px-1 py-2 text-xs sm:text-sm font-bold rounded-md transition-all flex items-center justify-center gap-1 ${
            channel === 'online'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30'
              : 'text-blue-700 hover:bg-blue-50'
          }`}
        >
          <MdPublic className="w-4 h-4" /> Online
        </button>
      </div>

    </div>
  );
}