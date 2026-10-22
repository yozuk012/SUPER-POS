import { OG_IMAGE, SITE_NAME, SITE_URL } from "@/lib/site";

/**
 * Halaman /welcome memakai `useSearchParams` (mode panduan `?guide=1`).
 * Tanpa render dinamis, Next.js membatalkan prerender dan crawler hanya
 * menerima layar "Menyiapkan panduan..." tanpa konten. Render dinamis
 * membuat seluruh teks panduan tersedia di HTML awal.
 */
export const dynamic = "force-dynamic";

export const metadata = {
  title: "Panduan Aplikasi Kasir & Point of Sale",
  description:
    "Pelajari cara pakai SuperPOS: kelola produk & stok, hitung HPP, proses transaksi kasir, cetak struk, dan pantau laporan penjualan toko Anda.",
  alternates: { canonical: "/welcome" },
  openGraph: {
    url: `${SITE_URL}/welcome`,
    title: `Panduan Aplikasi Kasir & Point of Sale | ${SITE_NAME}`,
    description:
      "Panduan lengkap fitur SuperPOS untuk UMKM frozen food: produk, stok, HPP, transaksi, struk, dan laporan keuangan.",
    images: [OG_IMAGE],
  },
};

export default function WelcomeLayout({ children }) {
  return children;
}
