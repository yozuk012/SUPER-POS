'use client'

import Link from 'next/link'
import { Suspense, useEffect, useState, useSyncExternalStore } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  FiLogIn,
  FiUserPlus,
  FiChevronDown,
  FiUser,
  FiGrid,
  FiPackage,
  FiHash,
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
  FiZap,
  FiChevronRight,
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
  <h4 className="mb-2 mt-5 text-sm font-bold text-blue-700">{children}</h4>
)

const Note = ({ children }) => (
  <div className="mt-4 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-6 text-amber-800">
    <FiAlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
    <div>{children}</div>
  </div>
)

const HIGHLIGHTS = [
  {
    icon: FiUser,
    title: 'Daftar & Login',
    description: 'Buat akun toko, atur PIN pemulihan, lalu masuk ke aplikasi.',
  },
  {
    icon: FiPackage,
    title: 'Atur Produk',
    description: 'Kelola kategori, produk, bahan baku, dan harga melalui HPP.',
  },
  {
    icon: FiShoppingCart,
    title: 'Transaksi',
    description: 'Layani pembayaran tunai, transfer bank, E-Wallet, dan QRIS.',
  },
  {
    icon: FiBarChart2,
    title: 'Laporan',
    description: 'Pantau penjualan, pengeluaran, laba rugi, dan stok toko.',
  },
]

function GuideSection({ icon: Icon, title, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-colors hover:border-blue-200">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
        className="flex w-full cursor-pointer items-center justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-gray-50"
      >
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            {Icon ? <Icon className="h-5 w-5" /> : null}
          </span>
          <span className="text-sm font-semibold text-gray-800">{title}</span>
        </div>

        <FiChevronDown
          className={`h-5 w-5 shrink-0 text-gray-400 transition-transform duration-300 ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>

      {open ? (
        <div className="border-t border-gray-100 bg-gray-50/70 px-5 pb-5 pt-4">
          {children}
        </div>
      ) : null}
    </div>
  )
}

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

  // ?guide=1 dipakai dari halaman Login agar panduan tetap bisa dibuka
  // walaupun flag onboarding sudah bernilai true.
  // Nilai diambil dari state router Next.js (bukan window.location) supaya
  // tetap benar saat navigasi client-side, karena URL baru diperbarui
  // setelah render selesai.
  const isGuideMode = searchParams.get('guide') === '1'
  const completedOnboarding = useSyncExternalStore(
    subscribeOnboarding,
    getOnboardingSnapshot,
    getServerOnboardingSnapshot
  )

  useEffect(() => {
    if (completedOnboarding && !isGuideMode) {
      // Pembukaan berikutnya / setelah logout -> bypass Welcome Page.
      router.replace('/auth/login')
    }
  }, [completedOnboarding, isGuideMode, router])

  const handleStart = (href) => {
    // User sudah melanjutkan dari Welcome Page -> jangan tampilkan lagi.
    markOnboardingCompleted()
    router.push(href)
  }

  if (completedOnboarding && !isGuideMode) {
    return <LoadingScreen />
  }

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
                Point of Sale untuk UMKM
              </span>
            </span>
          </Link>

          <div className="flex shrink-0 items-center gap-2">
            <span className="hidden items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 sm:inline-flex">
              <FiBookOpen className="h-4 w-4" />
              Panduan Awal
            </span>

            {isGuideMode ? (
              <button
                type="button"
                onClick={() => handleStart('/auth/login')}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-full border border-gray-200 bg-white px-4 text-xs font-semibold text-gray-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
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
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 via-blue-600 to-blue-500 px-6 py-10 text-white shadow-xl shadow-blue-600/10 lg:px-10">
          <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-blue-300/20 blur-3xl" />

          <div className="relative">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/15 px-3 py-1 text-xs font-medium text-blue-50 backdrop-blur-sm">
              <FiCheckCircle className="h-4 w-4" />
              Selamat datang di SuperPOS
            </span>

            <h1 className="mt-4 max-w-3xl text-3xl font-extrabold leading-tight text-white lg:text-5xl">
              Kelola penjualan, stok, HPP, dan laporan UMKM dalam satu aplikasi
            </h1>

            <p className="mt-4 max-w-2xl text-sm leading-7 text-blue-50 lg:text-base">
              Bacalah panduan singkat berikut agar aplikasi dapat digunakan dengan
              benar. Setelah itu, silakan login jika sudah memiliki akun atau
              daftar akun baru untuk mulai menggunakan SuperPOS.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => handleStart('/auth/login')}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-white px-6 text-sm font-semibold text-blue-700 shadow-sm transition hover:bg-blue-50 active:scale-[0.99]"
              >
                <FiLogIn className="h-5 w-5" />
                Login
              </button>

              <button
                type="button"
                onClick={() => handleStart('/auth/register')}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-white/40 bg-white/10 px-6 text-sm font-semibold text-white backdrop-blur-sm transition hover:border-white/60 hover:bg-white/20 active:scale-[0.99]"
              >
                <FiUserPlus className="h-5 w-5" />
                Register
              </button>

              <a
                href="#panduan"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-full px-4 text-sm font-semibold text-blue-50 underline-offset-4 transition hover:text-white hover:underline"
              >
                Lihat panduan lengkap
                <FiChevronRight className="h-4 w-4" />
              </a>
            </div>

            <p className="mt-6 flex items-start gap-2 text-xs leading-6 text-blue-100">
              <FiShield className="mt-0.5 h-4 w-4 shrink-0" />
              Halaman ini tampil otomatis saat aplikasi pertama kali dibuka.
              Setelah Anda melanjutkan, halaman ini tidak muncul lagi — panduan
              tetap bisa dibuka kapan saja melalui ikon tanya di halaman Login.
            </p>
          </div>
        </section>

        {/* Ringkasan alur */}
        <section className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {HIGHLIGHTS.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <Icon className="h-5 w-5" />
              </span>
              <h3 className="mt-3 text-sm font-semibold text-gray-900">{title}</h3>
              <p className="mt-1 text-xs leading-6 text-gray-500">{description}</p>
            </div>
          ))}
        </section>

        {/* Panduan Aplikasi */}
        <section id="panduan" className="mt-10 scroll-mt-24">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                <FiBookOpen className="h-4 w-4" />
                11 langkah penggunaan
              </span>
              <h2 className="mt-3 text-xl font-bold text-gray-900 lg:text-2xl">
                Panduan Menggunakan Aplikasi
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Ikuti alur berikut agar aplikasi dapat digunakan dengan benar.
              </p>
            </div>

            {isGuideMode ? (
              <button
                type="button"
                onClick={() => handleStart('/auth/login')}
                className="inline-flex items-center gap-2 text-xs font-semibold text-blue-600 transition hover:text-blue-700"
              >
                <FiArrowLeft className="h-4 w-4" />
                Kembali ke Login
              </button>
            ) : null}
          </div>

          <div className="space-y-4">
            {/* 1 Register */}
            <GuideSection icon={FiUser} title="1. Daftar Akun" defaultOpen>
              <P>
                Untuk mulai menggunakan aplikasi, user harus membuat akun terlebih
                dahulu melalui halaman <Strong>Register</Strong>.
              </P>

              <UL>
                <li>Nama Lengkap</li>
                <li>Nomor Telepon</li>
                <li>Nama Toko</li>
                <li>Email</li>
                <li>Password</li>
                <li>Konfirmasi Password</li>
                <li>Upload Logo Toko</li>
              </UL>

              <P>
                Pada langkah lanjutan, user wajib membuat <Strong>PIN Keamanan</Strong>{' '}
                sepanjang <Strong>6 digit angka</Strong>. PIN ini digunakan sebagai PIN
                pemulihan jika user lupa password.
              </P>

              <P>
                Setelah semua data terisi, klik tombol <Strong>Daftar</Strong>. User
                kemudian akan diarahkan ke halaman login untuk masuk ke aplikasi.
              </P>
            </GuideSection>

            {/* 2 Login */}
            <GuideSection icon={FiLogIn} title="2. Login ke Aplikasi">
              <P>
                Setelah akun berhasil dibuat, user masuk melalui halaman{' '}
                <Strong>Login</Strong>.
              </P>

              <UL>
                <li>Email</li>
                <li>Password</li>
              </UL>

              <P>
                Klik tombol <Strong>Login</Strong>, maka user akan diarahkan ke halaman
                dashboard aplikasi.
              </P>
            </GuideSection>

            {/* 3 Kategori */}
            <GuideSection icon={FiGrid} title="3. Mengisi Kategori Produk">
              <P>
                User terlebih dahulu harus mengisi daftar jenis kategori pada halaman{' '}
                <Strong>Category</Strong>.
              </P>

              <UL>
                <li>Pilih toko mana yang ingin diinputkan kategori.</li>
                <li>
                  Klik tombol <Strong>Tambah Kategori</Strong>.
                </li>
                <li>
                  Input nama kategori, misalnya <Strong>Frozen Food</Strong>.
                </li>
                <li>
                  Klik tombol <Strong>Simpan</Strong>.
                </li>
              </UL>
            </GuideSection>

            {/* 4 Produk */}
            <GuideSection icon={FiPackage} title="4. Menginputkan Produk">
              <P>
                Setelah kategori tersedia, user menginputkan produk pada halaman{' '}
                <Strong>Product</Strong>.
              </P>

              <UL>
                <li>Pilih toko mana yang ingin diinputkan produk.</li>
                <li>Pilih kategori mana yang ingin diinputkan produk.</li>
                <li>Input nama produk.</li>
                <li>SKU otomatis digenerasi oleh sistem.</li>
                <li>Input jenis satuan produk, misalnya pcs, kg, liter, dan lain-lain.</li>
                <li>
                  User bisa input diskon atau tidak. Jika iya, user inputkan diskon
                  produk. Opsi ini optional.
                </li>
                <li>Input stok produk.</li>
                <li>
                  User bisa checklist opsi untuk memasukkan produk ke dalam daftar produk
                  online dan memasukkan persentasenya. Opsi ini optional.
                </li>
                <li>Upload foto produk.</li>
                <li>
                  Untuk masalah harga, akan diatur pada halaman <Strong>HPP Produk</Strong>.
                </li>
              </UL>
            </GuideSection>

            {/* 5 HPP Produk */}
            <GuideSection icon={FiHash} title="5. Mengatur Harga Produk Melalui HPP">
              <P>
                User masuk ke halaman <Strong>HPP</Strong>, lalu pilih{' '}
                <Strong>HPP Produk</Strong> untuk menginputkan harga produk.
              </P>

              <P>
                Klik <Strong>Edit</Strong> pada produk yang ingin diinputkan harga, maka
                user akan diarahkan ke halaman <Strong>Hitung HPP Produk</Strong>. Di
                halaman ini terdapat dua jenis mode.
              </P>

              <Sub>Mode 1 - Per 1</Sub>

              <P>
                Mode ini digunakan untuk menghitung produk satu per satu dari bahan baku
                yang digunakan untuk membuat produk tersebut.
              </P>

              <UL>
                <li>
                  User harus sudah menginputkan daftar bahan baku di halaman{' '}
                  <Strong>Bahan Baku</Strong>.
                </li>
                <li>Pada halaman Bahan Baku, user harus menginputkan nama bahan baku.</li>
                <li>
                  Input isian pembelian, misalnya 1 kg, 1 liter, 1 pcs, dan lain-lain.
                </li>
                <li>
                  Input stok gudang bahan baku, misalnya 1 kg, 1 liter, 1 pcs, atau
                  disamakan dengan isian pembelian seperti 250g atau 500g.
                </li>
                <li>
                  Setelah bahan baku diinputkan, kembali ke halaman{' '}
                  <Strong>Hitung HPP Produk</Strong>.
                </li>
                <li>
                  Input nama produk jadi, misalnya <Strong>nugget ayam</Strong>.
                </li>
                <li>
                  Input kategori produk, misalnya <Strong>frozen food</Strong>.
                </li>
                <li>
                  Input jumlah yang dihasilkan, misalnya 20 kg, 20 liter, atau 20 pcs.
                </li>
                <li>
                  Input bahan baku yang digunakan untuk membuat 1 produk jadi tersebut,
                  misalnya 1 kg ayam, 1 kg tepung, 1 liter minyak goreng, dan lain-lain.
                </li>
                <li>
                  Setelah selesai, klik <Strong>Selanjutnya</Strong>.
                </li>
                <li>
                  Sistem akan menampilkan jumlah HPP produk jadi tersebut dan memberikan
                  rekomendasi harga jual dari margin 35%, 50%, dan 75%.
                </li>
                <li>User bisa memilih salah satu harga dan menyimpan produk jadi tersebut.</li>
              </UL>

              <Sub>Mode 2 - Akumulasi</Sub>

              <P>
                Mode ini menggunakan konsep akumulasi dari bahan baku yang dibeli. Rumus
                pada mode ini adalah <Strong>Total Modal dibagi Jumlah Hasil Produk</Strong>{' '}
                untuk mendapatkan HPP Produk.
              </P>

              <UL>
                <li>
                  Input nama produk jadi, misalnya <Strong>nugget ayam</Strong>.
                </li>
                <li>
                  Input kategori produk, misalnya <Strong>frozen food</Strong>.
                </li>
                <li>
                  Input jumlah yang dihasilkan, misalnya 20 kg, 20 liter, atau 20 pcs.
                </li>
                <li>
                  Input total batch yang telah dibeli user dalam sekali belanja. Contoh:
                  jika total belanja habis Rp300.000, maka user inputkan Rp300.000.
                </li>
                <li>
                  Klik <Strong>Selanjutnya</Strong>.
                </li>
                <li>
                  Sistem akan menampilkan jumlah HPP produk jadi tersebut dan memberikan
                  rekomendasi harga jual dari margin 35%, 50%, dan 75%.
                </li>
                <li>User bisa memilih salah satu harga dan menyimpan produk jadi tersebut.</li>
              </UL>
            </GuideSection>

            {/* 6 Transaksi */}
            <GuideSection icon={FiShoppingCart} title="6. Melakukan Transaksi Penjualan">
              <P>
                User masuk ke halaman <Strong>Transaction</Strong> untuk melakukan
                transaksi penjualan.
              </P>

              <UL>
                <li>User memilih produk yang diinginkan pembeli.</li>
                <li>Produk yang diklik akan masuk ke keranjang belanja.</li>
                <li>
                  User bisa menambah jumlah produk yang dibeli atau mengurangi jumlah
                  produk yang dibeli.
                </li>
                <li>User juga bisa menghapus produk dari keranjang belanja.</li>
                <li>
                  Di halaman transaksi terdapat fitur <Strong>Diskon Cepat</Strong> yang
                  bisa digunakan untuk memberikan diskon kepada pembeli. Namun fitur ini
                  hanya berlaku pada toko utama.
                </li>
                <li>
                  Format potongan harga menggunakan format seperti <Strong>10rb</Strong>,{' '}
                  <Strong>20rb</Strong>, atau <Strong>30rb</Strong>.
                </li>
                <li>
                  Jika user ingin memberikan diskon kepada pembeli, user bisa menginputkan
                  jumlah diskon yang diinginkan.
                </li>
                <li>
                  Jika tidak, user bisa langsung klik tombol <Strong>Bayar</Strong>.
                </li>
              </UL>

              <Sub>Metode Pembayaran</Sub>

              <P>
                Setelah klik <Strong>Bayar</Strong>, aplikasi akan menampilkan total harga
                yang harus dibayar oleh pembeli. User dapat memilih metode pembayaran.
              </P>

              <UL>
                <li>
                  <Strong>Tunai</Strong>: user tinggal input uang yang diterima dan akan
                  ada rincian kembalian yang harus diberikan kepada pembeli.
                </li>
                <li>
                  <Strong>Transfer Bank</Strong>: pembeli bisa transfer ke rekening bank
                  UMKM yang telah diinputkan oleh user di halaman profil toko. Jika pembeli
                  sudah transfer, user bisa klik tombol konfirmasi pembayaran.
                </li>
                <li>
                  <Strong>E-Wallet / QRIS</Strong>: OVO, DANA, GOPAY, LINK AJA alias QRIS.
                  User bisa scan QRIS pembeli pada aplikasi ini, dan jika uang sudah masuk
                  user bisa melakukan konfirmasi pembayaran.
                </li>
              </UL>

              <Note>
                Pastikan uang harus sudah masuk ke rekening bank UMKM terlebih dahulu
                sebelum konfirmasi pembayaran untuk metode Transfer Bank. Hal yang sama
                juga berlaku untuk E-Wallet / QRIS. Pastikan uang sudah masuk terlebih
                dahulu sebelum konfirmasi pembayaran.
              </Note>

              <P className="mt-4">
                Setelah pembayaran berhasil, user bisa mencetak struk pembelian dan struk
                pembelian akan otomatis masuk ke daftar riwayat transaksi.
              </P>
            </GuideSection>

            {/* 7 Laporan */}
            <GuideSection icon={FiBarChart2} title="7. Melihat Laporan Penjualan">
              <P>
                User masuk ke halaman <Strong>Report</Strong> untuk melihat laporan
                penjualan.
              </P>

              <P>Di halaman ini user dapat melihat beberapa hal berikut:</P>

              <UL>
                <li>Laporan produk yang terjual</li>
                <li>Laporan total penjualan</li>
                <li>Laporan biaya operasional</li>
                <li>Laporan total modal HPP</li>
                <li>Laporan total transaksi</li>
                <li>Laporan produk yang tersedia</li>
                <li>Laporan laba rugi</li>
              </UL>
            </GuideSection>

            {/* 8 Pengeluaran */}
            <GuideSection icon={FiCreditCard} title="8. Menginputkan Pengeluaran">
              <P>
                Halaman <Strong>Pengeluaran</Strong> digunakan untuk menginputkan
                pengeluaran yang dikeluarkan oleh UMKM.
              </P>

              <P>User dapat menginputkan data berikut:</P>

              <UL>
                <li>Tanggal pengeluaran</li>
                <li>
                  Kategori pengeluaran, misalnya biaya listrik, biaya air, biaya gaji
                  karyawan, dan lain-lain.
                </li>
                <li>
                  Bisa juga akumulasi semua pengeluaran dalam satu kategori, misalnya
                  biaya operasional.
                </li>
                <li>Jumlah pengeluaran</li>
                <li>Catatan pengeluaran (opsional)</li>
              </UL>
            </GuideSection>

            {/* 9 Histori */}
            <GuideSection icon={FiClock} title="9. Melihat Histori Transaksi">
              <P>
                Halaman <Strong>History</Strong> digunakan untuk melihat daftar riwayat
                transaksi yang telah dilakukan oleh UMKM.
              </P>

              <P>User dapat melihat daftar riwayat transaksi berdasarkan:</P>

              <UL>
                <li>Tanggal</li>
                <li>Bulan</li>
                <li>Tahun</li>
                <li>Pencarian berdasarkan nama produk yang dijual</li>
              </UL>
            </GuideSection>

            {/* 10 Pengaturan Toko */}
            <GuideSection icon={FiSettings} title="10. Profil Toko dan Pengaturan">
              <P>
                Halaman <Strong>Profil Toko</Strong> atau <Strong>Setting Toko</Strong>{' '}
                digunakan untuk mengatur profil toko dan kebutuhan operasional aplikasi.
              </P>

              <Sub>Edit Profile</Sub>

              <UL>
                <li>Nama Pemilik Toko</li>
                <li>Nama Toko</li>
                <li>Alamat Toko</li>
                <li>Nomor Telepon Toko</li>
                <li>Logo Toko</li>
              </UL>

              <Sub>Edit Rekening Bank / QRIS</Sub>

              <UL>
                <li>Gambar QRIS</li>
                <li>ID Merchant QRIS (opsional)</li>
                <li>Nama Bank</li>
                <li>Nomor Rekening Bank</li>
                <li>Nama Pemilik Rekening Bank</li>
              </UL>

              <Sub>Change Password</Sub>

              <UL>
                <li>
                  Input password lama. Jika user lupa password lama, maka user bisa
                  menggunakan PIN Keamanan yang telah dibuat sebelumnya.
                </li>
                <li>Input password baru.</li>
                <li>Konfirmasi password baru.</li>
              </UL>

              <Sub>Persentase Harga Online Secara Global</Sub>

              <P>
                User harus menginputkan persentase harga online secara global untuk semua
                produk yang dijual di toko online, misalnya 10%, 20%, 30%, dan lain-lain.
              </P>

              <P>
                Jika user ingin mengatur persentase harga online per produk, maka user
                bisa mengaturnya di halaman <Strong>HPP Produk</Strong>. Ini berlaku untuk
                produk yang dichecklist masuk ke daftar produk online.
              </P>

              <Sub>Switch Toko</Sub>

              <UL>
                <li>
                  Jika user memiliki lebih dari satu toko, maka user bisa switch toko
                  untuk mengatur toko yang diinginkan.
                </li>
                <li>User bisa menambahkan toko baru di halaman ini.</li>
                <li>Input nama toko.</li>
                <li>Input tipe lokasi toko, misalnya toko utama atau cabang.</li>
                <li>Input alamat toko.</li>
                <li>Upload logo toko.</li>
                <li>
                  Untuk QRIS, secara default otomatis menggunakan QRIS toko utama. Jika
                  user ingin menggunakan QRIS toko cabang, maka user harus menginputkan
                  QRIS toko cabang di halaman profil toko cabang tersebut.
                </li>
                <li>
                  Sama halnya dengan nama pemilik dan nomor telepon toko cabang, dapat
                  diatur pada halaman profil toko cabang.
                </li>
                <li>
                  User bisa input rekening bank toko cabang di halaman profil toko cabang
                  tersebut.
                </li>
                <li>
                  User bisa menonaktifkan toko cabang jika tidak ingin menggunakan toko
                  cabang tersebut.
                </li>
                <li>
                  Penonaktifan dapat bersifat sementara atau permanen, tetapi usahakan
                  sudah melakukan backup data toko cabang tersebut sebelum menonaktifkan
                  toko cabang.
                </li>
                <li>
                  Jika sudah switch toko ke cabang kedua, user bisa menyalin data produk
                  dari toko utama ke toko cabang kedua.
                </li>
                <li>
                  User bisa menyalin semua produk atau menyalin produk tertentu saja.
                </li>
                <li>
                  Jika user ingin menyalin semua produk, user bisa klik tombol{' '}
                  <Strong>Salin Semua Produk</Strong>.
                </li>
                <li>
                  Jika user ingin menyalin produk tertentu, user bisa klik tombol{' '}
                  <Strong>Salin Produk Tertentu</Strong> dan pilih produk yang ingin
                  disalin ke toko cabang.
                </li>
              </UL>

              <Sub>Backup Data</Sub>

              <UL>
                <li>
                  User bisa melakukan backup data pada toko yang statusnya aktif.
                </li>
                <li>Data backup dapat disimpan dalam bentuk file Excel.</li>
                <li>
                  User bisa memilih rentang waktu backup data antara lain: 1 bulan, 3
                  bulan, 6 bulan, 1 tahun, atau full backup.
                </li>
              </UL>

              <P>User dapat memilih jenis backup antara lain:</P>

              <UL>
                <li>Laporan Penjualan</li>
                <li>Master Produk, termasuk produk resep bahan baku</li>
                <li>Laporan Stok Saat Ini</li>
                <li>Laporan Pengeluaran atau Operasional</li>
                <li>Full Backup</li>
              </UL>
            </GuideSection>

            {/* 11 Dashboard */}
            <GuideSection icon={FiLayout} title="11. Dashboard Aplikasi">
              <P>
                Pada halaman <Strong>Dashboard</Strong>, user dapat melihat ringkasan
                kondisi bisnis toko.
              </P>

              <P>Beberapa hal yang dapat dilihat antara lain:</P>

              <UL>
                <li>Total penjualan hari ini</li>
                <li>Total pengeluaran hari ini</li>
                <li>Laba kotor hari ini</li>
                <li>Laba bersih hari ini</li>
                <li>Grafik penjualan dalam 5 bulan terakhir</li>
                <li>Riwayat penjualan terakhir</li>
                <li>Produk paling laris atau paling diminati pembeli</li>
              </UL>
            </GuideSection>
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="mt-10 rounded-3xl border border-blue-100 bg-white px-6 py-8 text-center shadow-sm">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
            <FiZap className="h-4 w-4" />
            Siap mulai?
          </span>

          <h2 className="mt-3 text-lg font-bold text-gray-900">
            Siap menggunakan SuperPOS?
          </h2>

          <p className="mx-auto mt-2 max-w-xl text-sm leading-7 text-gray-500">
            Jika sudah memiliki akun, silakan login. Jika belum, daftar terlebih
            dahulu untuk membuat akun toko Anda.
          </p>

          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => handleStart('/auth/login')}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-blue-600 px-6 text-sm font-semibold text-white transition hover:bg-blue-700 active:scale-[0.99]"
            >
              <FiLogIn className="h-5 w-5" />
              Login
            </button>

            <button
              type="button"
              onClick={() => handleStart('/auth/register')}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-gray-200 bg-white px-6 text-sm font-semibold text-gray-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 active:scale-[0.99]"
            >
              <FiUserPlus className="h-5 w-5" />
              Register
            </button>
          </div>

          {isGuideMode ? (
            <Link
              href="/auth/login"
              className="mt-5 inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 transition hover:text-blue-600"
            >
              <FiArrowLeft className="h-4 w-4" />
              Kembali ke halaman login
            </Link>
          ) : (
            <p className="mt-5 inline-flex items-center gap-1.5 text-xs text-gray-400">
              <FiHelpCircle className="h-4 w-4" />
              Panduan dapat dibuka kembali dari ikon tanya di halaman Login.
            </p>
          )}
        </section>

        <p className="mt-8 pb-4 text-center text-xs text-gray-400">
          SuperPOS · Panduan operasional aplikasi POS untuk UMKM
        </p>
      </div>
    </main>
  )
}

export default function WelcomePage() {
  // useSearchParams() butuh Suspense boundary karena halaman ini di-prerender
  // statis. Fallback memakai loading screen yang sama agar transisinya mulus.
  return (
    <Suspense fallback={<LoadingScreen />}>
      <WelcomeContent />
    </Suspense>
  )
}

