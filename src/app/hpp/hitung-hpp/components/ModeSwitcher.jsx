// src/app/hpp/hitung-hpp/components/ModeSwitcher.jsx
'use client';

import { FiList, FiZap } from 'react-icons/fi';

// Dua cara input HPP:
// - detail : input bahan baku 1 per 1 (resep rinci, stok bahan ikut terpotong)
// - cepat  : akumulasi modal, HPP = Total Modal : Jumlah Hasil
const MODES = [
  { id: 'detail', label: 'INPUT 1 PER 1', icon: FiList },
  { id: 'cepat', label: 'MODE CEPAT', icon: FiZap }
];

export default function ModeSwitcher({ modeInput, setModeInput, disabled = false }) {
  return (
    <div className="bg-white/95 backdrop-blur rounded-xl shadow-lg p-3 sm:p-4 border border-gray-100">
      <div className="flex items-center justify-between gap-2 mb-3">
        <h3 className="text-xs sm:text-sm font-bold text-gray-800 flex items-center gap-2 min-w-0">
          <FiZap className="text-blue-600 w-4 h-4 shrink-0" />
          <span className="truncate">Pilih Cara Input HPP</span>
        </h3>
        <span className="shrink-0 text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 border border-blue-100 px-2 py-1 rounded-full">
          {modeInput === 'cepat' ? 'Akumulasi' : 'Rinci'}
        </span>
      </div>

      <div className="flex bg-gray-100 p-1 rounded-lg">
        {MODES.map(mode => {
          const Icon = mode.icon;
          const isActive = modeInput === mode.id;

          return (
            <button
              key={mode.id}
              type="button"
              disabled={disabled}
              onClick={() => setModeInput(mode.id)}
              className={`flex-1 px-2 sm:px-3 py-2.5 text-[11px] sm:text-sm font-semibold rounded-md transition-all flex items-center justify-center gap-1.5 sm:gap-2 ${
                isActive
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="truncate">{mode.label}</span>
            </button>
          );
        })}
      </div>

      <p className="text-[11px] sm:text-xs text-gray-500 mt-2 leading-relaxed">
        {modeInput === 'cepat'
          ? 'Mode cepat (akumulasi): HPP per unit = Total Modal : Jumlah Hasil. Cocok kalau rincian bahan baku tidak dicatat.'
          : 'Mode rinci: catat setiap bahan baku satu per satu agar resep tersimpan dan stok bahan ikut terpotong otomatis.'}
      </p>
    </div>
  );
}
