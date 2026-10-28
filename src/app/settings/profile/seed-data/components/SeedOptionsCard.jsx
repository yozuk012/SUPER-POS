'use client';

import { FiSliders } from 'react-icons/fi';
import {
  SEED_DEFAULT_ROUNDING_STEP,
  SEED_EXISTING_MODES,
  SEED_PRICE_MODES,
  SEED_PRICE_ROUNDING_OPTIONS,
} from '@/lib/seedCatalog';

const OPTIONS = [
  {
    name: 'uploadImages',
    label: 'Unggah gambar produk ke Supabase Storage',
    description:
      'Gambar dioptimasi ke WebP lalu diunggah ke folder product-toko (seperti saat menambah produk manual). Jika dimatikan, produk memakai gambar dari src/seeds/images.',
  },
  {
    name: 'createInventory',
    label: 'Buat baris stok awal (100) untuk setiap produk baru',
    description:
      'Sama seperti perilaku form produk: setiap produk baru langsung punya baris di tabel inventory.',
  },
];

const PRICE_MODE_OPTIONS = [
  {
    value: SEED_PRICE_MODES.WITH_PRICE,
    label: 'Dengan Nominal Harga',
    description:
      'Produk dibuat dengan harga sesuai data seed (harga online disimpan, offline dihitung & dibulatkan).',
  },
  {
    value: SEED_PRICE_MODES.ZERO_PRICE,
    label: 'Harga Kosong (0)',
    description:
      'Produk dibuat tanpa harga (harga offline & online = 0). Isi harga manual nanti di menu Produk.',
  },
];

const EXISTING_MODE_OPTIONS = [
  {
    value: SEED_EXISTING_MODES.FILL_EMPTY,
    label: 'Isi harga yang masih 0 (disarankan)',
    description:
      'Produk lama yang harga offline atau online-nya masih 0 akan diisi. Harga yang sudah Anda ubah manual tidak ditimpa. Jika harga online sudah ada, harga offline dihitung dari harga online tersebut.',
  },
  {
    value: SEED_EXISTING_MODES.OVERWRITE,
    label: 'Timpa semua harga produk lama',
    description:
      'Harga offline & online semua produk lama disamakan dengan data seed. HPP, stok, dan data lain tetap aman.',
  },
  {
    value: SEED_EXISTING_MODES.SKIP,
    label: 'Lewati produk lama',
    description: 'Hanya produk baru yang ditambahkan. Harga produk yang sudah ada tidak diubah.',
  },
];

const ROUNDING_OPTIONS = [
  {
    value: 1000,
    label: 'Rp1.000',
    description: 'Contoh: online Rp22.000 → 22.000 ÷ 1,25 = 17.600 → dibulatkan Rp18.000.',
  },
  {
    value: 500,
    label: 'Rp500',
    description: 'Contoh: online Rp22.000 → 22.000 ÷ 1,25 = 17.600 → dibulatkan Rp17.500.',
  },
];

const optionCardClass = (disabled) =>
  `flex items-start gap-3 p-3 rounded-lg border transition-colors ${
    disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer hover:bg-gray-50'
  } border-gray-200`;

export default function SeedOptionsCard({ options, onChange, disabled }) {
  return (
    <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border border-gray-200">
      <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
        <FiSliders className="text-blue-600" size={20} />
        Opsi Seed
      </h2>

      <div className="space-y-3">
        {OPTIONS.map((option) => (
          <label key={option.name} className={optionCardClass(disabled)}>
            <input
              type="checkbox"
              name={option.name}
              checked={Boolean(options[option.name])}
              onChange={onChange}
              disabled={disabled}
              className="mt-0.5 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <span>
              <span className="block text-sm font-medium text-gray-800">{option.label}</span>
              <span className="block text-xs text-gray-500 mt-0.5">{option.description}</span>
            </span>
          </label>
        ))}
      </div>

      {/* Mode untuk produk yang sudah ada */}
      <div className="mt-5 pt-4 border-t border-gray-100">
        <p className="text-sm font-semibold text-gray-800">Produk yang namanya sudah ada</p>
        <p className="text-xs text-gray-500 mt-0.5">
          Tidak ada produk yang dihapus. Pilih bagaimana harga produk lama diperlakukan.
        </p>

        <div className="space-y-2 mt-3">
          {EXISTING_MODE_OPTIONS.map((option) => (
            <label key={option.value} className={optionCardClass(disabled)}>
              <input
                type="radio"
                name="existingMode"
                value={option.value}
                checked={options.existingMode === option.value}
                onChange={onChange}
                disabled={disabled}
                className="mt-0.5 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
              />
              <span>
                <span className="block text-sm font-medium text-gray-800">{option.label}</span>
                <span className="block text-xs text-gray-500 mt-0.5">{option.description}</span>
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Mode harga produk */}
      <div className="mt-5 pt-4 border-t border-gray-100">
        <p className="text-sm font-semibold text-gray-800">Mode Harga Produk</p>
        <p className="text-xs text-gray-500 mt-0.5">
          Pilih apakah produk dibuat dengan nominal harga atau harga kosong (isi nanti).
        </p>

        <div className="space-y-2 mt-3">
          {PRICE_MODE_OPTIONS.map((option) => (
            <label key={option.value} className={optionCardClass(disabled)}>
              <input
                type="radio"
                name="priceMode"
                value={option.value}
                checked={options.priceMode === option.value}
                onChange={onChange}
                disabled={disabled}
                className="mt-0.5 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
              />
              <span>
                <span className="block text-sm font-medium text-gray-800">{option.label}</span>
                <span className="block text-xs text-gray-500 mt-0.5">{option.description}</span>
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Pembulatan harga offline */}
      <div className="mt-5 pt-4 border-t border-gray-100">
        <p className="text-sm font-semibold text-gray-800">Pembulatan harga offline</p>
        <p className="text-xs text-gray-500 mt-0.5">
          Harga online dari data seed dibagi 1,25 (markup 25%), lalu dibulatkan ke kelipatan
          terdekat. Harga online tetap disimpan apa adanya.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">
          {ROUNDING_OPTIONS.map((option) => (
            <label key={option.value} className={optionCardClass(disabled)}>
              <input
                type="radio"
                name="roundingStep"
                value={option.value}
                checked={Number(options.roundingStep) === option.value}
                onChange={onChange}
                disabled={disabled}
                className="mt-0.5 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
              />
              <span>
                <span className="block text-sm font-medium text-gray-800">{option.label}</span>
                <span className="block text-xs text-gray-500 mt-0.5">{option.description}</span>
              </span>
            </label>
          ))}
        </div>

        <p className="text-xs text-gray-400 mt-2">
          Default: Rp{SEED_DEFAULT_ROUNDING_STEP.toLocaleString('id-ID')}. Pilihan:{' '}
          {SEED_PRICE_ROUNDING_OPTIONS.map((step) => `Rp${step.toLocaleString('id-ID')}`).join(
            ' / '
          )}
          .
        </p>
      </div>
    </div>
  );
}
