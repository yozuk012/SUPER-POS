import Link from "next/link";
import { FiHome, FiWifiOff } from "react-icons/fi";
import OfflineActions from "./OfflineActions";

export const metadata = {
  title: "Tidak Ada Koneksi",
  description: "Halaman cadangan SuperPOS saat perangkat sedang offline.",
  robots: { index: false, follow: false },
};

export default function OfflinePage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-white to-slate-100 p-6">
      <section className="w-full max-w-md rounded-3xl border border-blue-100 bg-white p-8 text-center shadow-xl shadow-blue-100/60">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-blue-400 shadow-lg shadow-blue-500/30">
          <FiWifiOff className="text-4xl text-white" aria-hidden="true" />
        </div>

        <span className="mt-5 inline-block rounded-full bg-amber-50 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-amber-700">
          Mode Offline
        </span>

        <h1 className="mt-3 text-xl font-bold text-slate-900">
          Koneksi internet terputus
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          SuperPOS memerlukan koneksi internet untuk menyimpan transaksi dan
          mengambil data terbaru. Halaman yang pernah dibuka mungkin masih bisa
          diakses dari cache.
        </p>

        <OfflineActions />

        <div className="mt-5 border-t border-slate-100 pt-5">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 transition-colors hover:text-blue-700"
          >
            <FiHome aria-hidden="true" />
            Kembali ke beranda
          </Link>
        </div>
      </section>
    </main>
  );
}
