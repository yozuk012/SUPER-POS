/**
 * Identitas & konfigurasi situs yang dipakai bersama oleh
 * metadata SEO (layout, robots, sitemap) dan manifest PWA.
 */

export const SITE_NAME = "SuperPOS";
export const SITE_TAGLINE = "Aplikasi Kasir & Point of Sale";
export const SITE_TITLE = `${SITE_NAME} - ${SITE_TAGLINE}`;
export const SITE_DESCRIPTION =
  "SuperPOS adalah aplikasi kasir (POS) berbasis web & PWA untuk UMKM: kelola transaksi, stok, HPP, dan laporan keuangan secara real-time.";
export const THEME_COLOR = "#2563eb";
export const LOCALE = "id_ID";

/**
 * Domain produksi (tanpa protokol). Memakai `www.superpos.web.id` karena
 * Vercel menyajikan konten di host ini dan mengalihkan apex ke sana. Semua
 * canonical, sitemap, robots, dan Open Graph mengikuti nilai ini.
 */
export const SITE_DOMAIN = "www.superpos.web.id";
export const PRODUCTION_SITE_URL = `https://${SITE_DOMAIN}`;

export const SITE_KEYWORDS = [
  "Aplikasi POS",
  "Sistem Kasir",
  "Point of Sale",
  "Aplikasi Kasir Online",
  "SuperPOS",
  "Manajemen Stok",
  "Hitung HPP",
  "Kasir Toko",
  "POS System Indonesia",
  "Aplikasi Kasir UMKM",
];

/**
 * URL absolut situs (dipakai canonical, Open Graph, robots.txt, sitemap).
 * Urutan prioritas:
 * 1. NEXT_PUBLIC_SITE_URL (opsional, dari .env.local / dashboard hosting)
 * 2. http://localhost:3000 saat `next dev`
 * 3. https://www.superpos.web.id (domain produksi)
 *
 * Preview deployment (mis. Vercel) sengaja tetap mengarah ke domain produksi
 * supaya halaman preview tidak dianggap versi duplikat oleh mesin pencari.
 */
function resolveSiteUrl() {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicit) return explicit.replace(/\/+$/, "");

  if (process.env.NODE_ENV === "development") return "http://localhost:3000";

  return PRODUCTION_SITE_URL;
}

export const SITE_URL = resolveSiteUrl();

/**
 * Gambar Open Graph/Twitter. Ganti ke "/og-image.png" (1200x630) setelah
 * menjalankan `scripts/generate-og-image.ps1`.
 */
export const OG_IMAGE = {
  url: "/logo-SP.png",
  width: 500,
  height: 500,
  alt: `${SITE_NAME} — ${SITE_TAGLINE}`,
};
export const TWITTER_CARD = "summary";
