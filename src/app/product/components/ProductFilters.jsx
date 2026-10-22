"use client";

import { FaSearch, FaTimes, FaFilter, FaGlobe } from "react-icons/fa";

export default function ProductFilters({
  searchQuery,
  setSearchQuery,
  filterCategory,
  setFilterCategory,
  filterChannel,
  setFilterChannel,
  filterStatus,
  setFilterStatus,
  categories,
}) {
  return (
    <div className="bg-gradient-to-br from-white via-blue-50 to-blue-100 p-3 rounded-xl shadow-sm border border-blue-200 mb-4">
      <div className="flex flex-col md:flex-row gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-500 text-sm" />
          <input
            type="text"
            placeholder="Cari nama atau SKU produk..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-8 py-2 bg-white border border-blue-200 rounded-lg text-sm text-slate-700 placeholder-slate-400 focus:ring-2 focus:ring-blue-400 focus:border-blue-500 outline-none transition-all"
            aria-label="Cari produk"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-red-500 transition-colors"
              aria-label="Hapus pencarian"
            >
              <FaTimes size={12} />
            </button>
          )}
        </div>

        {/* Category Filter */}
        <div className="relative md:w-48">
          <FaFilter className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-500 text-xs pointer-events-none" />
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="w-full pl-8 pr-3 py-2 bg-white border border-blue-200 rounded-lg text-sm text-slate-700 focus:ring-2 focus:ring-blue-400 focus:border-blue-500 outline-none appearance-none cursor-pointer transition-shadow"
            aria-label="Filter kategori"
          >
            <option value="all">Semua Kategori</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Channel Filter */}
        <div className="relative md:w-40">
          <FaGlobe className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-500 text-xs pointer-events-none" />
          <select
            value={filterChannel}
            onChange={(e) => setFilterChannel(e.target.value)}
            className="w-full pl-8 pr-3 py-2 bg-white border border-blue-200 rounded-lg text-sm text-slate-700 focus:ring-2 focus:ring-blue-400 focus:border-blue-500 outline-none appearance-none cursor-pointer transition-shadow"
            aria-label="Filter channel"
          >
            <option value="all">Semua Channel</option>
            <option value="online">Online Only</option>
            <option value="offline">Offline Only</option>
          </select>
        </div>

        {/* Status Filter */}
        <div className="relative md:w-36">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full px-3 py-2 bg-white border border-blue-200 rounded-lg text-sm text-slate-700 focus:ring-2 focus:ring-blue-400 focus:border-blue-500 outline-none appearance-none cursor-pointer transition-shadow"
            aria-label="Filter status"
          >
            <option value="all">Semua Status</option>
            <option value="active">Aktif</option>
            <option value="inactive">Nonaktif</option>
          </select>
        </div>
      </div>
    </div>
  );
}