"use client";

import { useEffect, useState } from "react";
import { FiRefreshCw, FiWifi } from "react-icons/fi";

export default function OfflineActions() {
  const [isBackOnline, setIsBackOnline] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsBackOnline(true);
      // Beri jeda singkat agar pengguna melihat status, lalu muat ulang.
      window.setTimeout(() => window.location.reload(), 800);
    };

    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
  }, []);

  return (
    <div className="mt-6 space-y-3">
      <button
        type="button"
        onClick={() => window.location.reload()}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-blue-500/30 transition-colors hover:bg-blue-700"
      >
        {isBackOnline ? (
          <FiWifi className="text-lg" aria-hidden="true" />
        ) : (
          <FiRefreshCw className="text-lg" aria-hidden="true" />
        )}
        {isBackOnline ? "Koneksi kembali — memuat..." : "Coba lagi"}
      </button>

      <p className="text-xs text-slate-400">
        Halaman ini tersimpan otomatis oleh service worker SuperPOS.
      </p>
    </div>
  );
}
