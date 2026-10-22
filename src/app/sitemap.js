import { SITE_URL } from "@/lib/site";

/**
 * Sitemap hanya memuat halaman publik yang punya konten nyata.
 *
 * Halaman privat (dashboard, produk, transaksi, dll.) sengaja tidak
 * dimasukkan dan sudah diblokir di `robots.js`.
 *
 * Halaman auth (login, register, forgot-password) juga tidak dimasukkan
 * karena hanya berisi formulir dan sudah diberi `noindex`. Memasukkannya
 * ke sitemap membuat Google bisa memilih halaman tersebut sebagai
 * halaman masuk domain, bukan /welcome.
 *
 * Catatan: URL "/" tidak dimasukkan karena halaman tersebut hanya
 * mengalihkan pengunjung ke /welcome.
 */
export default function sitemap() {
  const lastModified = new Date();

  return [
    {
      url: `${SITE_URL}/welcome`,
      lastModified,
      changeFrequency: "monthly",
      priority: 1,
    },
  ];
}
