'use client';

import { notFound } from 'next/navigation';
import { useState } from 'react';
import { FiDatabase, FiShield } from 'react-icons/fi';

// Import Layout & Components
import PageLayout from '@/components/PageLayout';
import SeedSourceCard from './components/SeedSourceCard';
import SeedOptionsCard from './components/SeedOptionsCard';
import SeedPreviewTable from './components/SeedPreviewTable';
import SeedProgressCard from './components/SeedProgressCard';
import SeedSummaryCard from './components/SeedSummaryCard';

// Import Hooks
import useSeedData from '@/hooks/useSeedData';

// Konstanta aturan harga seed
import {
  SEED_DEFAULT_ROUNDING_STEP,
  SEED_EXISTING_MODES,
} from '@/lib/seedCatalog';

// Flag kontrol fitur seed data (Hanya untuk Developer):
// - Di local dev (npm run dev): Otomatis AKTIF
// - Di Vercel / Production: Otomatis NONAKTIF (bisa diaktifkan manual lewat NEXT_PUBLIC_ENABLE_SEED_DATA=true di Vercel jika perlu)
// - Di local dev bisa dinonaktifkan dengan memasang NEXT_PUBLIC_ENABLE_SEED_DATA=false di .env.local
const isSeedEnabled =
  process.env.NEXT_PUBLIC_ENABLE_SEED_DATA === 'true' ||
  (process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_ENABLE_SEED_DATA !== 'false');

export default function SeedDataPage() {
  // Jika diakses pada production (deploy) dan flag tidak diaktifkan, berikan 404
  if (!isSeedEnabled) {
    notFound();
  }

  return <SeedDataContent />;
}

function SeedDataContent() {
  // 1. Ambil katalog seed + fungsi eksekusi dari hook
  const {
    catalog,
    store,
    existingStats,
    loading,
    isSeeding,
    progress,
    phase,
    log,
    summary,
    error,
    runSeed,
    resetSummary,
  } = useSeedData();

  // 2. Opsi seed (dikontrol user sebelum dijalankan)
  const [options, setOptions] = useState({
    uploadImages: true,
    createInventory: true,
    existingMode: SEED_EXISTING_MODES.FILL_EMPTY,
    roundingStep: SEED_DEFAULT_ROUNDING_STEP,
  });

  const handleOptionChange = (e) => {
    const { name, type, checked, value } = e.target;
    setOptions((prev) => ({
      ...prev,
      [name]:
        type === 'checkbox'
          ? checked
          : name === 'roundingStep'
            ? Number(value)
            : value,
    }));
  };

  const existingModeLabel =
    options.existingMode === SEED_EXISTING_MODES.OVERWRITE
      ? 'semua harga produk lama ditimpa'
      : options.existingMode === SEED_EXISTING_MODES.SKIP
        ? 'produk lama dilewati'
        : 'hanya harga produk lama yang masih 0 yang diisi';

  // 3. Konfirmasi sebelum menjalankan seed (proses menulis data ke database)
  const handleRun = async () => {
    if (isSeeding) return;

    const confirmMessage =
      `Jalankan seed data ke toko "${store?.name || '-'}"?\n\n` +
      `• ${catalog.categories.length} kategori\n` +
      `• ${catalog.products.length} produk (harga offline dibulatkan ke Rp${options.roundingStep.toLocaleString('id-ID')})\n` +
      `• Harga online disimpan apa adanya, HPP tidak diubah\n` +
      `• Produk lama: ${existingModeLabel}\n\n` +
      `Tidak ada data yang dihapus. Lanjutkan?`;

    if (!window.confirm(confirmMessage)) return;

    await runSeed(options);
  };

  return (
    // === WRAPPER DENGAN PAGE LAYOUT ===
    <PageLayout title="Seed Data Produk">
      <div className="max-w-5xl mx-auto space-y-4 sm:space-y-6">
        {/* Header Halaman */}
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg shrink-0">
            <FiDatabase className="text-blue-600" size={24} />
          </div>
          <div className="min-w-0">
            <h1 className="text-lg sm:text-2xl font-bold text-gray-800">Seed Data Katalog Produk</h1>
            <p className="text-xs sm:text-sm text-gray-500">
              Tambahkan kategori &amp; produk beserta harganya dari data seed lokal. Aman dijalankan
              berulang tanpa menghapus data.
            </p>
          </div>
        </div>

        {/* Alert Keamanan */}
        <div className="p-3 sm:p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3">
          <FiShield className="text-amber-600 shrink-0 mt-0.5" size={20} />
          <div className="text-xs sm:text-sm text-amber-800">
            <p className="font-semibold">Aman dijalankan berulang, tanpa menghapus data.</p>
            <p className="mt-0.5">
              Harga offline dihitung dari harga online ÷ 1,25 lalu dibulatkan ke Rp500/Rp1.000.
              Harga online disimpan apa adanya di <code>product_prices</code>. HPP tidak diubah
              (produk baru mulai dari 0) dan bisa diisi lewat menu Hitung HPP.
            </p>
          </div>
        </div>

        {/* Notifikasi Error */}
        {error && (
          <div className="p-3 sm:p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <FiShield className="text-red-500 shrink-0 mt-0.5" size={18} />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Kartu Sumber Data */}
        <SeedSourceCard
          catalog={catalog}
          store={store}
          existingStats={existingStats}
          loading={loading}
        />

        {/* Opsi Seed */}
        <SeedOptionsCard options={options} onChange={handleOptionChange} disabled={isSeeding} />

        {/* Tombol Eksekusi + Progress + Log */}
        <SeedProgressCard
          isSeeding={isSeeding}
          progress={progress}
          phase={phase}
          log={log}
          onRun={handleRun}
          disabled={loading || !store}
          totalProducts={catalog.products.length}
        />

        {/* Ringkasan Hasil */}
        <SeedSummaryCard summary={summary} onReset={resetSummary} />

        {/* Pratinjau Data */}
        <SeedPreviewTable products={catalog.products} roundingStep={options.roundingStep} />
      </div>
    </PageLayout>
  );
}
