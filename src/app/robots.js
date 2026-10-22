import { SITE_URL } from "@/lib/site";

export default function robots() {
  return {
    rules: [
      {
        userAgent: "*",
        // Semua halaman publik boleh dirayapi. Halaman auth sengaja tetap
        // bisa dirayapi (tidak di-Disallow) supaya Google bisa membaca
        // meta `noindex` di halaman tersebut.
        allow: ["/"],
        // Halaman privat aplikasi, halaman sistem, dan API
        disallow: [
          "/dashboard",
          "/transaksi",
          "/product",
          "/bahan-baku",
          "/category",
          "/history",
          "/hpp",
          "/pengeluaran",
          "/report",
          "/settings",
          "/test-connection",
          "/offline",
          "/api/",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
