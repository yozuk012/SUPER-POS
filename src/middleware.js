import { NextResponse } from "next/server";

/**
 * Menambahkan header `X-Robots-Tag: noindex` untuk halaman privat aplikasi.
 *
 * `robots.txt` (src/app/robots.js) sudah melarang crawler mengakses halaman
 * ini, tetapi URL yang tetap terindeks lewat tautan eksternal masih bisa
 * muncul di hasil pencarian. Header ini adalah lapisan pengaman tambahan.
 *
 * Catatan: redirect antar-domain (apex ↔ www) TIDAK dilakukan di sini. Vercel
 * menormalkan header `Host` ke domain utama, sehingga pengecekan host di
 * middleware bisa memicu redirect berulang (loop). Atur redirect tersebut di
 * Project → Settings → Domains.
 */
const NOINDEX_VALUE = "noindex, nofollow";

export function middleware() {
  const response = NextResponse.next();
  response.headers.set("X-Robots-Tag", NOINDEX_VALUE);
  return response;
}

/**
 * Hanya dijalankan untuk halaman privat. Rute publik (/, /welcome, /auth/*),
 * aset statis, service worker, dan API tidak terkena middleware ini sehingga
 * tidak ada penurunan performa yang tidak perlu.
 */
export const config = {
  matcher: [
    "/dashboard",
    "/dashboard/:path*",
    "/product",
    "/product/:path*",
    "/category",
    "/category/:path*",
    "/transaksi",
    "/transaksi/:path*",
    "/history",
    "/history/:path*",
    "/report",
    "/report/:path*",
    "/pengeluaran",
    "/pengeluaran/:path*",
    "/bahan-baku",
    "/bahan-baku/:path*",
    "/hpp",
    "/hpp/:path*",
    "/settings",
    "/settings/:path*",
    "/test-connection",
    "/test-connection/:path*",
    "/offline",
  ],
};
