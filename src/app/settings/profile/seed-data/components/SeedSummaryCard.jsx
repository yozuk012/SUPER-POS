'use client';

import { FiCheckCircle, FiAlertCircle, FiX, FiAlertTriangle } from 'react-icons/fi';

const formatNumber = (value) => Number(value || 0).toLocaleString('id-ID');

const MODE_LABELS = {
  skip: 'Produk lama dilewati',
  'fill-empty': 'Harga kosong diisi',
  overwrite: 'Semua harga ditimpa',
};

function ResultRow({ label, value, tone = 'gray' }) {
  const tones = {
    gray: 'text-gray-800',
    green: 'text-green-600',
    amber: 'text-amber-600',
    red: 'text-red-600',
  };

  const displayValue =
    typeof value === 'number' ? formatNumber(value) : value || '-';

  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
      <span className="text-sm text-gray-600">{label}</span>
      <span className={`text-sm font-bold ${tones[tone]}`}>{displayValue}</span>
    </div>
  );
}

export default function SeedSummaryCard({ summary, onReset }) {
  if (!summary) return null;

  const productFailures = summary.productsFailed || 0;
  const priceFailures = summary.pricesFailed || 0;
  const hasFailure = productFailures > 0 || priceFailures > 0;

  const failureParts = [];
  if (productFailures > 0) failureParts.push(`${formatNumber(productFailures)} produk`);
  if (priceFailures > 0) failureParts.push(`${formatNumber(priceFailures)} harga`);

  return (
    <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border border-gray-200">
      <div className="flex items-start justify-between gap-3 mb-4">
        <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          {hasFailure ? (
            <FiAlertCircle className="text-amber-600" size={20} />
          ) : (
            <FiCheckCircle className="text-green-600" size={20} />
          )}
          Ringkasan Hasil Seed
        </h2>
        <button
          type="button"
          onClick={onReset}
          className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-800 transition-colors"
        >
          <FiX size={14} /> Tutup
        </button>
      </div>

      {/* Status utama */}
      <div
        className={`p-3 sm:p-4 rounded-md flex items-start gap-3 border ${
          hasFailure ? 'bg-amber-50 border-amber-200' : 'bg-green-50 border-green-200'
        }`}
      >
        {hasFailure ? (
          <FiAlertTriangle className="text-amber-600 shrink-0 mt-0.5" size={18} />
        ) : (
          <FiCheckCircle className="text-green-600 shrink-0 mt-0.5" size={18} />
        )}
        <p className={`text-sm ${hasFailure ? 'text-amber-800' : 'text-green-800'}`}>
          {hasFailure
            ? `Seed selesai dengan catatan: ${failureParts.join(' & ')} gagal disimpan.`
            : `Seed berhasil untuk toko "${summary.storeName || '-'}": ${formatNumber(summary.productsCreated)} produk baru & ${formatNumber(summary.productsUpdated)} produk diperbarui.`}
        </p>
      </div>

      {/* Detail angka */}
      <div className="mt-4">
        <ResultRow label="Toko tujuan" value={summary.storeName || '-'} />
        <ResultRow label="Kategori dibuat" value={summary.categoriesCreated} tone="green" />
        <ResultRow label="Kategori dipakai ulang" value={summary.categoriesReused} />
        <ResultRow label="Produk baru dibuat" value={summary.productsCreated} tone="green" />
        <ResultRow label="Produk lama diperbarui" value={summary.productsUpdated} tone="green" />
        <ResultRow label="Harga online disimpan" value={summary.pricesSynced} tone="green" />
        <ResultRow label="Harga gagal disimpan" value={summary.pricesFailed} tone={priceFailures ? 'red' : 'gray'} />
        <ResultRow label="Produk dilewati (harga sudah ada / mode lewati)" value={summary.productsSkipped} tone="amber" />
        <ResultRow label="Produk gagal" value={summary.productsFailed} tone={productFailures ? 'red' : 'gray'} />
        <ResultRow label="Gambar terunggah" value={summary.imagesUploaded} tone="green" />
        <ResultRow label="Gambar gagal diunggah" value={summary.imagesFailed} tone={summary.imagesFailed ? 'amber' : 'gray'} />
        <ResultRow label="Baris stok awal dibuat" value={summary.inventoryCreated} />
      </div>

      <p className="text-xs text-gray-500 mt-3">
        Mode produk lama: {MODE_LABELS[summary.existingMode] || '-'} • Harga offline dibulatkan ke
        Rp{formatNumber(summary.roundingStep || 0)}
      </p>

      {/* Daftar produk gagal */}
      {productFailures > 0 && (
        <div className="mt-4">
          <p className="text-sm font-medium text-gray-700 mb-2">Produk yang gagal disimpan:</p>
          <div className="max-h-56 overflow-y-auto border border-red-100 rounded-lg divide-y divide-red-50">
            {(summary.failedRows || []).map((row, index) => (
              <div key={index} className="px-3 py-2">
                <p className="text-xs font-medium text-gray-800">
                  {row.name} <span className="text-gray-400">({row.sku})</span>
                </p>
                <p className="text-xs text-red-600 mt-0.5">{row.reason}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
