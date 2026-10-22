import { SITE_NAME, SITE_URL } from "@/lib/site";

export const metadata = {
  title: "Daftar Akun Toko",
  description:
    "Buat akun SuperPOS untuk mengelola beberapa cabang toko, produk, stok bahan baku, HPP, dan laporan keuangan dalam satu aplikasi kasir berbasis web & PWA.",
  alternates: { canonical: "/auth/register" },
  // Halaman formulir tidak perlu muncul di hasil pencarian. Halaman masuk
  // domain adalah /welcome, bukan halaman daftar.
  robots: { index: false, follow: true },
  openGraph: {
    url: `${SITE_URL}/auth/register`,
    title: `Daftar Akun Toko | ${SITE_NAME}`,
  },
};

export default function RegisterLayout({ children }) {
  return children;
}
