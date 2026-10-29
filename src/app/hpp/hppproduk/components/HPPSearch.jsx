// src/app/hpp/hppproduk/components/HPPSearch.jsx
'use client';

export default function HPPSearch({ value, onChange, placeholder = 'Cari produk...' }) {
  return (
    <div className="relative min-w-0 flex-1">
      <label className="block text-xs font-bold text-blue-800 uppercase tracking-wide mb-2">
        Cari Produk
      </label>
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-white hover:bg-blue-50 text-slate-700 font-semibold py-2.5 px-3 rounded-lg border border-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-400"
        aria-label="Cari produk HPP"
        spellCheck={false}
        autoComplete="off"
      />
    </div>
  );
}
