'use client';

import { FiCheckCircle, FiArrowLeft, FiSave, FiTrendingUp, FiInfo, FiAlertTriangle } from 'react-icons/fi';
import { getRecommendedPrice } from '@/lib/productUtils';

const MARGIN_OPTIONS = [
  { value: 35, label: '35%', description: 'Minimal' },
  { value: 50, label: '50%', description: 'Rekomendasi' },
  { value: 75, label: '75%', description: 'Premium' },
];

export default function Step2Hasil({
  namaProduk,
  modeInput,
  jumlahProduk,
  satuanProduk = 'unit',
  totalHppBahanBaku,
  marginPct,
  setMarginPct,
  isSubmitting,
  onSubmit,
  onBack
}) {
  // Mode input: 'detail' (bahan baku 1 per 1) atau 'cepat' (akumulasi modal)
  const isModeCepat = modeInput === 'cepat';
  const satuanLabel = satuanProduk || 'unit';

  // 1. Kalkulasi HPP Bahan Baku Per Unit -> Rumus: Total Modal : Jumlah yang Dihasilkan
  const qty = parseFloat(jumlahProduk) || 1;
  const hppPerUnit = totalHppBahanBaku / qty;

  // 2. Kalkulasi Saran Harga Jual 
  // Kita gunakan margin yang lebih tinggi (50% - 75%) sebagai "pengaman" 
  // untuk menutup biaya operasional yang dicatat di halaman terpisah.
  const hitungMargin = (persen) => {
    const hargaJual = getRecommendedPrice(hppPerUnit, persen);
    const profitPerProduk = hargaJual - hppPerUnit;
    const totalProfit = profitPerProduk * qty;
    
    return {
      hargaJual: Math.round(hargaJual),
      profitPerProduk: Math.round(profitPerProduk),
      totalProfit: Math.round(totalProfit)
    };
  };

  const saranHarga = MARGIN_OPTIONS.map((option) => ({
    ...option,
    ...hitungMargin(option.value),
  }));

  // Helper format rupiah
  const formatRupiah = (angka) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(angka || 0);
  };

  // Handle tombol submit
  const handleSubmit = () => {
    const confirmMsg = `Anda akan menyimpan:\n\n` +
      `• Produk: ${namaProduk}\n` +
      `• ${isModeCepat ? 'HPP (mode cepat)' : 'HPP Bahan Baku'}: ${formatRupiah(hppPerUnit)} / ${qty} ${satuanLabel}\n` +
      `• ${isModeCepat ? 'Total Modal (Akumulasi)' : 'Total Modal Bahan'}: ${formatRupiah(totalHppBahanBaku)}\n` +
      (isModeCepat ? `• Mode: Cepat (akumulasi modal) - rincian bahan & stok bahan tidak dicatat\n` : '') +
      `\nCatatan: Jangan lupa catat biaya operasional (gas, listrik, dll) di halaman Pengeluaran agar laporan laba rugi akurat.\n\n` +
      `Lanjutkan penyimpanan?`;
      
    if (window.confirm(confirmMsg)) {
      onSubmit(marginPct);
    }
  };

  return (
    <main className="px-3 sm:px-4 py-4 sm:py-6 space-y-4 sm:space-y-6">
      
      {/* 1. Ringkasan Perhitungan HPP */}
      <div className="bg-white/95 backdrop-blur rounded-xl shadow-lg p-4 sm:p-5 border border-gray-100">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
          <h3 className="text-base sm:text-xl font-bold text-gray-800 flex items-start gap-2 min-w-0">
            <FiCheckCircle className="text-blue-600 shrink-0 mt-0.5 sm:mt-1" />
            <span className="break-words">Rincian HPP: {namaProduk || 'Produk Baru'}</span>
          </h3>
          <span className={`self-start sm:self-auto text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full border whitespace-nowrap ${
            isModeCepat
              ? 'bg-purple-50 text-purple-700 border-purple-200'
              : 'bg-blue-50 text-blue-700 border-blue-200'
          }`}>
            {isModeCepat ? 'Mode Cepat' : 'Input 1 Per 1'}
          </span>
        </div>
        
        <div className="space-y-4">
          {/* Breakdown Batch */}
          <div className="bg-gray-50 rounded-lg p-3 sm:p-4 space-y-2">
            <p className="text-[10px] sm:text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Modal 1 Batch</p>
            <div className="flex justify-between items-center gap-2">
              <span className="text-gray-600 text-xs sm:text-sm">
                {isModeCepat ? 'Total Modal (Akumulasi):' : 'Total Biaya Bahan Baku:'}
              </span>
              <span className="font-bold text-gray-800 text-base sm:text-lg">{formatRupiah(totalHppBahanBaku)}</span>
            </div>
            <div className="flex justify-between items-center gap-2 pt-2 border-t border-gray-200">
              <span className="text-gray-600 text-xs sm:text-sm">Jumlah Hasil (Yield):</span>
              <span className="font-semibold text-blue-700 text-sm sm:text-base">{qty} {satuanLabel}</span>
            </div>
          </div>

          {/* Info khusus Mode Cepat (Akumulasi) */}
          {isModeCepat && (
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 sm:p-4 flex gap-3">
              <FiInfo className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-purple-800 mb-1">Mode Cepat (Akumulasi)</p>
                <p className="text-xs text-purple-700 leading-relaxed">
                  HPP dihitung dengan rumus <strong>Total Modal : Jumlah yang Dihasilkan</strong>.
                  Rincian bahan baku tidak disimpan dan stok bahan baku tidak dipotong otomatis.
                </p>
              </div>
            </div>
          )}

          {/* HPP PER UNIT Highlight */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 py-3 sm:py-4 bg-blue-50 rounded-xl px-4 sm:px-5 border border-blue-200">
            <div className="flex flex-col">
              <span className="text-blue-800 font-bold text-base sm:text-lg">
                {isModeCepat ? `HPP / ${satuanLabel}` : `HPP BAHAN / ${satuanLabel}`}
              </span>
              <span className="text-[11px] sm:text-xs text-blue-600 font-medium">
                {isModeCepat
                  ? `${formatRupiah(totalHppBahanBaku)} : ${qty} ${satuanLabel}`
                  : 'Modal murni bahan baku'}
              </span>
            </div>
            <span className="font-bold text-2xl sm:text-3xl text-blue-700 break-words">{formatRupiah(hppPerUnit)}</span>
          </div>

          {/* Edukasi Operasional */}
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 sm:p-4 flex gap-3">
            <FiAlertTriangle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-orange-800 mb-1">Penting: Biaya Operasional</p>
              <p className="text-xs text-orange-700 leading-relaxed">
                Biaya seperti Gas, Listrik, Air, dan Kemasan <strong>tidak termasuk</strong> di angka HPP di atas. 
                Pastikan Anda mencatatnya di halaman <strong>Pengeluaran</strong>. 
                Gunakan rekomendasi harga jual di bawah ini (Margin 50%+) agar tetap profit setelah dikurangi biaya operasional.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Saran Harga Jual (Berdasarkan HPP Bahan + Buffer Operasional) */}
      <div className="bg-white/95 backdrop-blur rounded-xl shadow-lg p-4 sm:p-5 border border-gray-100">
        <div className="flex items-center gap-2 mb-4">
          <FiTrendingUp className="text-green-600 w-5 h-5 shrink-0" />
          <h3 className="text-base sm:text-lg font-bold text-gray-800">Rekomendasi Harga Jual</h3>
        </div>
        <p className="text-xs sm:text-sm text-gray-600 mb-3">Pilih margin yang akan dipakai sebagai harga rekomendasi produk.</p>
        
        <div className="space-y-3">
          {saranHarga.map((option) => {
            const isSelected = marginPct === option.value;

            return (
              <button
                key={option.value}
                type="button"
                onClick={() => setMarginPct(option.value)}
                aria-pressed={isSelected}
                className={`w-full rounded-xl p-3 sm:p-4 text-left transition-colors ${
                  isSelected
                    ? 'border-2 border-green-500 bg-green-50 shadow-sm'
                    : 'border border-gray-200 bg-gray-50 hover:border-green-300 hover:bg-green-50/50'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-3 mb-2">
                  <span className={`self-start px-2 sm:px-3 py-1 rounded-md text-[10px] sm:text-xs font-bold ${
                    isSelected ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700'
                  }`}>
                    {isSelected && <FiCheckCircle className="inline w-3 h-3 mr-1" />}
                    MARGIN {option.label} ({option.description})
                  </span>
                  <span className="text-gray-800 font-bold text-base sm:text-lg whitespace-nowrap">
                    {formatRupiah(option.hargaJual)}
                  </span>
                </div>
                <p className="text-xs text-gray-600">
                  Profit kotor/{satuanLabel}: <span className="font-bold text-green-700">{formatRupiah(option.profitPerProduk)}</span>
                </p>
              </button>
            );
          })}
        </div>
        <p className="mt-3 text-xs text-green-700">
          Margin terpilih: <strong>{marginPct}%</strong>. Harga ini akan disimpan sebagai harga rekomendasi.
        </p>
      </div>

      {/* 3. Tombol Aksi */}
      <div className="space-y-3 pb-6 sm:pb-8">
        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className={`w-full font-bold py-3.5 sm:py-4 px-3 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 text-sm sm:text-base min-h-[48px] ${
            isSubmitting 
              ? 'bg-gray-400 cursor-not-allowed text-gray-200' 
              : 'bg-green-600 hover:bg-green-700 text-white transform active:scale-[0.98]'
          }`}
        >
          {isSubmitting ? (
            <>
              <svg className="animate-spin h-5 w-5 text-white shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span className="text-center">MENYIMPAN DATA PRODUK & RESEP...</span>
            </>
          ) : (
            <>
              <FiSave className="w-5 h-5 shrink-0" />
              <span className="text-center">SIMPAN PRODUK & RESEP</span>
            </>
          )}
        </button>
        
        <button
          onClick={onBack}
          disabled={isSubmitting}
          className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3.5 sm:py-4 px-3 rounded-xl shadow transition-colors flex items-center justify-center gap-2 disabled:opacity-50 text-sm sm:text-base min-h-[48px]"
        >
          <FiArrowLeft className="w-5 h-5 shrink-0" />
          <span className="text-center">KEMBALI KE STEP 1</span>
        </button>
      </div>
    </main>
  );
}