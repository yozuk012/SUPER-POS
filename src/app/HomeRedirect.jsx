"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { hasCompletedOnboarding } from "@/lib/onboarding";

/**
 * Komponen pengalih halaman awal. Dipisah dari `page.js` (server component)
 * supaya halaman "/" bisa mengekspor metadata (mis. `noindex`) karena
 * halaman ini hanya berisi redirect tanpa konten.
 */
export default function HomeRedirect() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    // Hanya lakukan redirect setelah proses pengecekan auth selesai
    if (!loading) {
      if (user) {
        // User sudah login -> masuk dashboard
        router.replace("/dashboard");
      } else if (hasCompletedOnboarding()) {
        // Sudah pernah menyelesaikan panduan / baru logout -> langsung Login
        router.replace("/auth/login");
      } else {
        // Pembukaan pertama -> tampilkan Welcome Page + panduan
        router.replace("/welcome");
      }
    }
  }, [user, loading, router]);

  // Loading state yang konsisten dengan tema aplikasi my-pos
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" />
        <p className="text-sm font-medium text-gray-500">Memuat aplikasi...</p>
      </div>
    </div>
  );
}
