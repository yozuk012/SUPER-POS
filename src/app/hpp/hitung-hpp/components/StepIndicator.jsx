'use client';

import { FiArrowLeft, FiCheck } from 'react-icons/fi';

export default function StepIndicator({ currentStep, onBack }) {
  // Konfigurasi langkah (DIPERBARUI: Hanya 2 Step)
  const steps = [
    { num: 1, label: 'BAHAN BAKU' },
    { num: 2, label: 'HASIL HPP' }
  ];

  // Mencari label langkah saat ini
  const currentLabel = steps.find(s => s.num === currentStep)?.label || '';

  return (
    <header className="px-3 sm:px-4 py-4 sm:py-5">
      {/* Baris Atas: Tombol Kembali & Judul */}
      <div className="flex items-center justify-between mb-5 sm:mb-6">
        <button 
          onClick={onBack}
          className="p-2 -ml-2 hover:bg-white/10 active:bg-white/20 rounded-full transition-colors text-white shrink-0"
          aria-label="Kembali ke halaman sebelumnya"
        >
          <FiArrowLeft className="w-6 h-6" />
        </button>
        
        {/* flex-1 dan px-2 memastikan judul selalu di tengah, tidak terdorong oleh tombol */}
        <div className="flex-1 text-center px-2 min-w-0">
          <h1 className="text-[10px] sm:text-xs md:text-sm font-semibold text-blue-100 tracking-widest uppercase opacity-80">
            Proses Perhitungan
          </h1>
          <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white mt-1 drop-shadow-sm truncate">
            {currentLabel}
          </h2>
        </div>
        
        {/* Spacer dengan lebar yang sama dengan tombol kembali agar judul benar-benar center */}
        <div className="w-10 shrink-0" /> 
      </div>

      {/* Progress Indicator (Garis & Lingkaran) */}
      <div className="flex items-center justify-center gap-1 md:gap-2">
        {steps.map((step, index) => (
          <div key={step.num} className="flex items-center">
            
            {/* Lingkaran Angka / Centang */}
            <div 
              className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold transition-all duration-500 border-2 ${
                currentStep >= step.num 
                  ? 'bg-white text-blue-600 border-white shadow-lg scale-110' 
                  : 'bg-blue-900/30 text-blue-200 border-blue-400/30'
              }`}
            >
              {/* Tampilkan ikon centang jika langkah sudah dilewati, jika tidak tampilkan angka */}
              {currentStep > step.num ? (
                <FiCheck className="w-4 h-4 sm:w-5 sm:h-5" />
              ) : (
                step.num
              )}
            </div>
            
            {/* Garis Penghubung (tidak ditampilkan di langkah terakhir) */}
            {index < steps.length - 1 && (
              <div 
                className={`w-10 sm:w-16 md:w-24 h-1 rounded-full transition-all duration-500 ${
                  currentStep > step.num 
                    ? 'bg-white shadow-[0_0_8px_rgba(255,255,255,0.6)]' 
                    : 'bg-blue-400/30'
                }`} 
              />
            )}
            
          </div>
        ))}
      </div>
    </header>
  );
}