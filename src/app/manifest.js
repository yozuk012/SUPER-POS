// src/app/manifest.js
import {
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_TITLE,
  THEME_COLOR,
} from "@/lib/site";

export default function manifest() {
  return {
    id: "/",
    name: SITE_TITLE, // "SuperPOS - Aplikasi Kasir & Point of Sale", selaras dengan metadata SEO
    short_name: SITE_NAME,
    description: SITE_DESCRIPTION,
    start_url: "/",
    scope: "/",
    display: "standalone",
    display_override: ["standalone", "minimal-ui"],
    orientation: "any",
    background_color: "#f9fafb", // Atau gunakan variabel jika ada, misal: BACKGROUND_COLOR
    theme_color: THEME_COLOR, // <-- Diubah agar konsisten dengan metadata.js & PWAProvider
    lang: "id",
    dir: "ltr",
    categories: ["business", "productivity", "finance"],
    icons: [
      {
        src: "/icons/icon-96.png",
        sizes: "96x96",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      {
        name: "Transaksi Baru",
        short_name: "Transaksi",
        description: "Buka halaman kasir untuk membuat transaksi baru",
        url: "/transaksi",
        icons: [
          { 
            src: "/icons/icon-192.png", 
            sizes: "192x192",
            type: "image/png" // <-- Ditambahkan untuk kompatibilitas browser yang lebih baik
          }
        ],
      },
      {
        name: "Produk",
        short_name: "Produk",
        description: "Kelola daftar produk toko",
        url: "/product",
        icons: [
          { 
            src: "/icons/icon-192.png", 
            sizes: "192x192",
            type: "image/png" // <-- Ditambahkan
          }
        ],
      },
      {
        name: "Laporan",
        short_name: "Laporan",
        description: "Lihat laporan penjualan",
        url: "/report",
        icons: [
          { 
            src: "/icons/icon-192.png", 
            sizes: "192x192",
            type: "image/png" // <-- Ditambahkan
          }
        ],
      },
    ],
  };
}