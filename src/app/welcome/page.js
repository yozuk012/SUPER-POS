'use client'

import Link from 'next/link'
import { Suspense, useEffect, useState, useSyncExternalStore } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import {
  FiLogIn,
  FiUserPlus,
  FiUser,
  FiPackage,
  FiShoppingCart,
  FiBarChart2,
  FiCreditCard,
  FiClock,
  FiSettings,
  FiLayout,
  FiAlertTriangle,
  FiHelpCircle,
  FiArrowLeft,
  FiArrowRight,
  FiBookOpen,
  FiCheckCircle,
  FiShield,
  FiSearch,
  FiDatabase,
  FiFilter,
  FiChevronRight,
  FiGrid,
  FiHash,
} from 'react-icons/fi'
import {
  hasCompletedOnboarding,
  markOnboardingCompleted,
} from '@/lib/onboarding'

const P = ({ children, className = '' }) => (
  <p className={`mb-3 text-sm leading-7 text-gray-600 ${className}`}>
    {children}
  </p>
)

const Strong = ({ children }) => (
  <span className="font-semibold text-gray-900">{children}</span>
)

const UL = ({ children }) => (
  <ul className="mb-4 list-disc space-y-2 pl-5 text-sm leading-7 text-gray-600">
    {children}
  </ul>
)

const Sub = ({ children }) => (
  <h4 className="mb-2 mt-4 text-sm font-bold text-blue-700">{children}</h4>
)

const Note = ({ children }) => (
  <div className="mt-4 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-6 text-amber-800">
    <FiAlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
    <div>{children}</div>
  </div>
)

const GUIDE_CATEGORIES = [
  { id: 'all', label: 'Semua Panduan', icon: FiBookOpen },
  { id: 'akun', label: 'Akun & Keamanan', icon: FiUser },
  { id: 'produk', label: 'Produk & HPP', icon: FiPackage },
  { id: 'transaksi', label: 'Transaksi & Kasir', icon: FiShoppingCart },
  { id: 'laporan', label: 'Laporan & Toko', icon: FiBarChart2 },
]

const GUIDE_STEPS = [
  {
    id: 1,
    category: 'akun',
    icon: FiUser,
    title: '1. Daftar Akun & PIN Keamanan',
    content: (
      <>
        <P>
          Buat akun toko melalui halaman <Strong>Register</Strong> dengan mengisi nama, telepon, nama toko, email, password, dan logo toko.
        </P>
        <P>
          Wajib membuat <Strong>PIN Keamanan 6 digit angka</Strong> sebagai pemulihan saat lupa password.
        </P>
      </>
    ),
  },
  {
    id: 2,
    category: 'akun',
    icon: FiLogIn,
    title: '2. Login & Seed Data Contoh',
    content: (
      <>
        <P>
          Masuk melalui halaman <Strong>Login</Strong> menggunakan email dan password terdaftar.
        </P>
        <P>
          Bagi pengguna baru yang ingin uji coba cepat, tersedia fitur <Strong>Seed Data</Strong> di menu Pengaturan untuk mengisi otomatis kategori, produk, dan bahan baku contoh.
        </P>
      </>
    ),
  },
  {
    id: 3,
    category: 'produk',
    icon: FiGrid,
    title: '3. Kategori & Bahan Baku',
    content: (
      <>
        <P>
          Input jenis kategori produk pada menu <Strong>Category</Strong> (misal: Frozen Food, Minuman).
        </P>
        <P>
          Input daftar bahan baku pada menu <Strong>Bahan Baku</Strong> lengkap dengan satuan pembelian dan stok gudangnya untuk keperluan perhitungan HPP.
        </P>
      </>
    ),
  },
  {
    id: 4,
    category: 'produk',
    icon: FiPackage,
    title: '4. Input Produk & Stok',
    content: (
      <>
        <P>
          Input produk pada menu <Strong>Product</Strong> dengan SKU otomatis, satuan (pcs/kg/liter), foto, dan opsi diskon produk.
        </P>
        <P>
          Centang <Strong>Stok dilacak otomatis</Strong> atau biarkan non-centang untuk <Strong>stok tanpa batas (unlimited)</Strong> seperti produk titipan atau jasa.
        </P>
      </>
    ),
  },
  {
    id: 5,
    category: 'produk',
    icon: FiHash,
    title: '5. Pengaturan HPP & Harga Jual',
    content: (
      <>
        <P>
          Gunakan fitur <Strong>Pencarian Cepat</Strong> di halaman <Strong>HPP Produk</Strong> untuk mencari produk dengan mudah.
        </P>
        <Sub>Mode Hitung HPP</Sub>
        <UL>
          <li><Strong>Mode Per 1:</Strong> Menghitung rekam bahan baku per 1 produk jadi.</li>
          <li><Strong>Mode Akumulasi:</Strong> Total belanja modal dibagi jumlah hasil produk jadi.</li>
        </UL>
        <P>
          Sistem otomatis menampilkan rekomendasi margin harga jual (35%, 50%, 75%) dan persentase harga online.
        </P>
      </>
    ),
  },
  {
    id: 6,
    category: 'transaksi',
    icon: FiShoppingCart,
    title: '6. Transaksi Penjualan & Diskon Cepat',
    content: (
      <>
        <P>
          Pilih produk pada halaman <Strong>Transaction</Strong> untuk masuk ke keranjang belanja. Atur jumlah atau hapus item dengan mudah.
        </P>
        <P>
          Tersedia fitur <Strong>Diskon Cepat (Total Transaksi)</Strong> untuk memotong total bayar secara instan dalam Rupiah.
        </P>
      </>
    ),
  },
  {
    id: 7,
    category: 'transaksi',
    icon: FiCreditCard,
    title: '7. Metode Pembayaran & Struk',
    content: (
      <>
        <Sub>Pilihan Pembayaran</Sub>
        <UL>
          <li><Strong>Tunai:</Strong> Input uang diterima, sistem otomatis menghitung rincian kembalian.</li>
          <li><Strong>Transfer Bank:</Strong> Konfirmasi setelah dana masuk ke rekening toko.</li>
          <li><Strong>E-Wallet / QRIS:</Strong> Tampilkan QRIS, gunakan tombol <Strong>Bagikan QRIS</Strong> untuk kirim rincian tagihan via WhatsApp/Telegram, atau <Strong>Salin Rincian</Strong>.</li>
        </UL>
        <P>
          Cetak struk belanja langsung setelah pembayaran berhasil dan riwayat otomatis tercatat di <Strong>History</Strong>.
        </P>
      </>
    ),
  },
  {
    id: 8,
    category: 'laporan',
    icon: FiBarChart2,
    title: '8. Laporan & Pengeluaran',
    content: (
      <>
        <P>
          Pantau ringkasan penjualan, produk terlaris, total modal HPP, dan laba rugi secara real-time pada halaman <Strong>Report</Strong>.
        </P>
        <P>
          Catat biaya operasional harian (listrik, air, gaji, dll) melalui menu <Strong>Pengeluaran</Strong>.
        </P>
      </>
    ),
  },
  {
    id: 9,
    category: 'laporan',
    icon: FiSettings,
    title: '9. Profil Toko, Multi-Toko & Salin Produk',
    content: (
      <>
        <P>
          Kelola profil toko, rekening bank, QRIS, ubah password (dengan PIN Keamanan), dan persentase harga online global.
        </P>
        <P>
          Gunakan fitur <Strong>Switch Toko</Strong> untuk menambah cabang dan menyalin produk dari toko utama ke cabang secara instan.
        </P>
      </>
    ),
  },
  {
    id: 10,
    category: 'laporan',
    icon: FiDatabase,
    title: '10. Backup Data & Dashboard',
    content: (
      <>
        <P>
          Unduh laporan dan master data ke file <Strong>Excel</Strong> dengan rentang waktu fleksibel (1 bulan, 3 bulan, 6 bulan, 1 tahun, atau full backup) pada menu Backup Data.
        </P>
        <P>
          Halaman <Strong>Dashboard</Strong> menyajikan ringkasan transaksi hari ini dan grafik performa bisnis 5 bulan terakhir.
        </P>
      </>
    ),
  },
]

const subscribeOnboarding = (onChange) => {
  if (typeof window === 'undefined') return () => {}
  window.addEventListener('storage', onChange)
  return () => window.removeEventListener('storage', onChange)
}

const getOnboardingSnapshot = () => hasCompletedOnboarding()
const getServerOnboardingSnapshot = () => false

function LoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" />
        <p className="text-sm font-medium text-gray-500">Menyiapkan panduan...</p>
      </div>
    </div>
  )
}

function WelcomeContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const isGuideMode = searchParams.get('guide') === '1'
  const completedOnboarding = useSyncExternalStore(
    subscribeOnboarding,
    getOnboardingSnapshot,
    getServerOnboardingSnapshot
  )

  const [activeTab, setActiveTab] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [openStepId, setOpenStepId] = useState(1)

  useEffect(() => {
    if (!completedOnboarding || isGuideMode) return

    let isMounted = true
    const resolveDestination = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!isMounted) return
        router.replace(session?.access_token ? '/dashboard' : '/auth/login')
      } catch {
        if (isMounted) router.replace('/auth/login')
      }
    }
    resolveDestination()
    return () => { isMounted = false }
  }, [completedOnboarding, isGuideMode, router])

  const handleStart = (href) => {
    markOnboardingCompleted()
    router.push(href)
  }

  if (completedOnboarding && !isGuideMode) {
    return <LoadingScreen />
  }

  const filteredSteps = GUIDE_STEPS.filter((step) => {
    const matchesTab = activeTab === 'all' || step.category === activeTab
    const matchesSearch =
      searchQuery.trim() === '' ||
      step.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      step.category.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesTab && matchesSearch
  })

  return (
    <main className="min-h-screen bg-gray-50 text-gray-900">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-3 px-4 py-3 lg:px-8">
          <Link href="/" className="flex min-w-0 items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm shadow-blue-600/20">
              <FiShoppingCart className="h-5 w-5" />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-bold tracking-tight text-gray-900">
                SuperPOS
              </span>
              <span className="block truncate text-[11px] text-gray-500">
                Panduan Operasional UMKM
              </span>
            </span>
          </Link>

          <div className="flex shrink-0 items-center gap-2">
            {isGuideMode ? (
              <button
                type="button"
                onClick={() => handleStart('/auth/login')}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-full border border-gray-200 bg-white px-4 text-xs font-semibold text-gray-700 transition hover:bg-blue-50 hover:text-blue-700"
              >
                <FiArrowLeft className="h-4 w-4" />
                Kembali ke Login
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleStart('/auth/login')}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-blue-600 px-4 text-xs font-semibold text-white transition hover:bg-blue-700"
              >
                Lewati Panduan
                <FiArrowRight className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="mx-auto w-full max-w-5xl px-4 py-6 lg:px-8 lg:py-10">
        {/* Hero */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 via-blue-600 to-blue-500 px-6 py-8 text-white shadow-xl shadow-blue-600/10 lg:px-10">
          <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-blue-300/20 blur-3xl" />

          <div className="relative">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/15 px-3 py-1 text-xs font-medium text-blue-50 backdrop-blur-sm">
              <FiCheckCircle className="h-4 w-4" />
              Panduan Interaktif & Ringkas
            </span>

            <h1 className="mt-3 max-w-2xl text-2xl font-extrabold leading-tight text-white lg:text-4xl">
              Kelola Penjualan, Stok, HPP, & Laporan UMKM dalam Satu Aplikasi
            </h1>

            <p className="mt-3 max-w-xl text-sm leading-6 text-blue-50">
              Pilih topik panduan di bawah atau gunakan pencarian untuk memahami cara penggunaan SuperPOS dengan cepat dan tepat.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => handleStart('/auth/login')}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-white px-6 text-sm font-semibold text-blue-700 shadow-sm transition hover:bg-blue-50 active:scale-[0.99]"
              >
                <FiLogIn className="h-4 w-4" />
                Login
              </button>

              <button
                type="button"
                onClick={() => handleStart('/auth/register')}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-white/40 bg-white/10 px-6 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/20 active:scale-[0.99]"
              >
                <FiUserPlus className="h-4 w-4" />
                Register
              </button>

              <a
                href="#panduan"
                className="inline-flex h-11 items-center gap-1.5 px-3 text-xs font-semibold text-blue-100 underline-offset-4 hover:text-white hover:underline"
              >
                Mulai baca panduan
                <FiChevronRight className="h-4 w-4" />
              </a>
            </div>
          </div>
        </section>

        {/* Panduan Section */}
        <section id="panduan" className="mt-8 scroll-mt-24">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900 lg:text-2xl">
                Panduan Penggunaan Aplikasi
              </h2>
              <p className="text-xs text-gray-500">
                Pilih kategori atau ketik kata kunci untuk mencari panduan spesifik.
              </p>
            </div>

            {/* Search input */}
            <div className="relative w-full sm:w-72">
              <FiSearch className="absolute left-3.5 top-3 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari topik (misal: HPP, QRIS, Struk)..."
                className="w-full rounded-xl border border-gray-200 bg-white py-2 pl-10 pr-4 text-xs text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Category Tabs */}
          <div className="flex flex-wrap gap-2 mb-6">
            {GUIDE_CATEGORIES.map((cat) => {
              const Icon = cat.icon
              const isActive = activeTab === cat.id
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setActiveTab(cat.id)}
                  className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition shadow-sm ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-blue-600/20'
                      : 'border border-gray-200 bg-white text-gray-600 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {cat.label}
                </button>
              )
            })}
          </div>

          {/* Guide Steps Accordion List */}
          {filteredSteps.length === 0 ? (
            <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center">
              <FiHelpCircle className="mx-auto h-8 w-8 text-gray-400 mb-2" />
              <p className="text-sm font-medium text-gray-700">Panduan tidak ditemukan</p>
              <p className="text-xs text-gray-400 mt-1">Coba kata kunci lain atau reset filter kategori.</p>
              <button
                type="button"
                onClick={() => { setActiveTab('all'); setSearchQuery(''); }}
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-blue-50 px-4 py-2 text-xs font-semibold text-blue-700 transition hover:bg-blue-100"
              >
                Reset Filter
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredSteps.map((step) => {
                const Icon = step.icon
                const isOpen = openStepId === step.id
                return (
                  <div
                    key={step.id}
                    className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition hover:border-blue-200"
                  >
                    <button
                      type="button"
                      aria-expanded={isOpen}
                      onClick={() => setOpenStepId(isOpen ? null : step.id)}
                      className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition hover:bg-gray-50/80"
                    >
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                          {Icon ? <Icon className="h-4 w-4" /> : null}
                        </span>
                        <span className="text-sm font-semibold text-gray-900">
                          {step.title}
                        </span>
                      </div>
                      <span className={`text-xs font-medium text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}>
                        ▼
                      </span>
                    </button>

                    {isOpen ? (
                      <div className="border-t border-gray-100 bg-gray-50/60 px-6 py-4">
                        {step.content}
                      </div>
                    ) : null}
                  </div>
                )
              })}
            </div>
          )}
        </section>

        <p className="mt-12 pb-4 text-center text-xs text-gray-400">
          SuperPOS · Aplikasi Kasir & Point of Sale UMKM
        </p>
      </div>
    </main>
  )
}

export default function WelcomePage() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <WelcomeContent />
    </Suspense>
  )
}
