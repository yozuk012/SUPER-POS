import { SITE_NAME, SITE_URL } from "@/lib/site";

export const metadata = {
  title: "Masuk ke Akun Kasir",
  description:
    "Masuk ke akun SuperPOS untuk mulai mencatat transaksi, memantau stok, dan melihat laporan penjualan toko Anda.",
  alternates: { canonical: "/auth/login" },
  // Halaman formulir tidak perlu muncul di hasil pencarian. Halaman masuk
  // domain adalah /welcome, bukan halaman login.
  robots: { index: false, follow: true },
  openGraph: {
    url: `${SITE_URL}/auth/login`,
    title: `Masuk ke Akun Kasir | ${SITE_NAME}`,
  },
};

export default function LoginLayout({ children }) {
  return children;
}
