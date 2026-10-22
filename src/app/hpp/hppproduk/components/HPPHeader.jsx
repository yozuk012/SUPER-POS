// src/app/hpp/hppproduk/components/HPPHeader.jsx
'use client';

import { FiChevronDown, FiTag } from 'react-icons/fi';

export default function HPPHeader({
  onBack, // tetap diterima tapi tidak dipakai visual di sini (back ada di hero)
  selectedKategori,
  setSelectedKategori,
  kategoriList,
  isDropdownOpen,
  setIsDropdownOpen
}) {
  return (
    <div className="relative">
      <label className="block text-xs font-bold text-blue-800 uppercase tracking-wide mb-2">
        Filter Kategori
      </label>
      <button
        type="button"
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className="w-full bg-white hover:bg-blue-50 text-slate-700 font-semibold py-2.5 px-3 rounded-lg flex items-center justify-between transition-colors border border-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-400"
      >
        <span className="flex items-center gap-2 truncate">
          <FiTag className="w-4 h-4 text-blue-600 shrink-0" />
          <span className="truncate">{selectedKategori || 'Semua Kategori'}</span>
        </span>
        <FiChevronDown
          className={`w-5 h-5 text-blue-600 transition-transform duration-200 shrink-0 ${
            isDropdownOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      {isDropdownOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-xl border border-blue-200 z-20 max-h-60 overflow-y-auto animate-fadeIn">
          <button
            type="button"
            onClick={() => {
              setSelectedKategori('');
              setIsDropdownOpen(false);
            }}
            className={`w-full px-4 py-3 text-left text-sm transition-colors border-b border-blue-100 flex items-center gap-2 ${
              !selectedKategori
                ? 'bg-blue-100 text-blue-700 font-bold'
                : 'text-slate-700 hover:bg-blue-50'
            }`}
          >
            <FiTag className="w-4 h-4 shrink-0" />
            Semua Kategori
          </button>

          {kategoriList.length === 0 && !selectedKategori && (
            <div className="px-4 py-3 text-sm text-slate-400 italic">
              Belum ada kategori
            </div>
          )}

          {kategoriList.map((kategori, index) => (
            <button
              key={index}
              type="button"
              onClick={() => {
                setSelectedKategori(kategori);
                setIsDropdownOpen(false);
              }}
              className={`w-full px-4 py-3 text-left text-sm transition-colors flex items-center gap-2 ${
                selectedKategori === kategori
                  ? 'bg-blue-100 text-blue-700 font-bold'
                  : 'text-slate-700 hover:bg-blue-50'
              }`}
            >
              <FiTag className="w-4 h-4 shrink-0" />
              {kategori}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}