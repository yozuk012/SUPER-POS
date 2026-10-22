'use client';

import { useState } from "react";
import PageLayout from "@/components/PageLayout";
import { useAuth } from "@/hooks/useAuth";
import { useDashboard } from "@/hooks/useDashboard";
import { useActiveStore } from "@/lib/activeStore";
import { useActiveStoreName } from "@/hooks/useActiveStoreName";
import { getDefaultDateRange } from "@/lib/dateUtils";
import { formatFullDate } from "@/lib/formatUtils";
import { FiCalendar, FiAlertCircle } from "react-icons/fi";

import MetricCards from "./components/MetricCards";
import MonthlyPerformanceChart from "./components/MonthlyPerformanceChart";
import RecentSalesList from "./components/RecentSalesList";
import TopProductsCarousel from "./components/TopProductsCarousel";

export default function DashboardPage() {
  const { user, merchant, loading: authLoading } = useAuth();
  const { storeId } = useActiveStore();
  const { storeName: activeStoreName } = useActiveStoreName(user?.id, storeId);
  const [dateRange, setDateRange] = useState(getDefaultDateRange);

  const {
    metrics,
    monthlyPerformance,
    recentSales,
    topProducts,
    isLoading: dashboardLoading,
    error
  } = useDashboard(storeId, user?.id, dateRange);

  const isLoading = authLoading || dashboardLoading;

  const storeName = activeStoreName || merchant?.store_name || "Toko Anda";
  const userName = merchant?.full_name || user?.email?.split('@')[0] || "Pengguna";

  const today = formatFullDate(new Date());

  // ── LOADING STATE ────────────────────────────────────────
  if (isLoading) {
    return (
      <PageLayout title="Dashboard">
        <div className="flex flex-col items-center justify-center h-[60vh]">
          <div className="relative">
            <div className="w-14 h-14 rounded-full border-4 border-blue-200" />
            <div className="absolute inset-0 w-14 h-14 rounded-full border-4 border-transparent border-t-blue-600 animate-spin" />
          </div>
          <p className="mt-5 text-sm text-slate-500">Memuat data dashboard & keuangan...</p>
        </div>
      </PageLayout>
    );
  }

  // ── ERROR STATE ──────────────────────────────────────────
  if (error) {
    return (
      <PageLayout title="Dashboard">
        <div className="p-5 bg-red-50 border border-red-200 rounded-xl flex items-start gap-4">
          <div className="w-9 h-9 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0">
            <FiAlertCircle className="text-red-600" size={20} />
          </div>
          <div>
            <h3 className="text-red-800 font-semibold">Gagal Memuat Data Dashboard</h3>
            <p className="text-red-600 text-sm mt-1">{error}</p>
            <p className="text-red-500 text-xs mt-2">
              Pastikan koneksi internet stabil atau coba refresh halaman.
            </p>
          </div>
        </div>
      </PageLayout>
    );
  }

  // ── TAMPILAN UTAMA ───────────────────────────────────────
  return (
    <PageLayout title="Dashboard">

      {/* 1. Header Sambutan — gradient biru cerah solid */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-blue-600 via-blue-500 to-blue-400 p-5 sm:p-6 mb-6 shadow-lg shadow-blue-500/30">
        {/* Dekorasi lingkaran */}
        <div className="absolute -top-12 -right-12 w-40 h-40 bg-white/10 rounded-full pointer-events-none" />
        <div className="absolute -bottom-20 -left-16 w-48 h-48 bg-white/5 rounded-full pointer-events-none" />

        <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-md bg-white flex items-center justify-center">
                <svg className="w-3.5 h-3.5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </div>
              <span className="text-xs font-bold text-white/90 uppercase tracking-wider">
                SuperPOS
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-white">
              Halo, {userName}! 👋
            </h1>
            <p className="text-blue-50 mt-2 flex flex-wrap items-center gap-2">
              Selamat datang di dashboard
              <span className="font-semibold text-blue-700 bg-white px-3 py-1 rounded-md shadow-sm">
                {storeName}
              </span>
            </p>
          </div>
          <div className="flex items-center gap-2 bg-white text-blue-700 px-4 py-2.5 rounded-lg shadow-sm w-fit">
            <FiCalendar className="text-lg" />
            <span className="font-semibold text-sm capitalize">{today}</span>
          </div>
        </div>
      </div>

      {/* 2. Filter Periode — gradient putih→biru lebih tegas */}
      <div className="bg-gradient-to-br from-white via-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200 shadow-sm mb-6">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0 shadow-sm">
              <FiCalendar className="text-white" size={18} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-blue-800">Periode Dashboard</h2>
              <p className="text-xs text-slate-600 mt-0.5">
                Pilih tanggal untuk menyesuaikan seluruh data dashboard.
              </p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <label
              className="text-xs font-bold text-blue-800 uppercase tracking-wide"
              htmlFor="dashboard-start-date"
            >
              Dari
            </label>
            <input
              id="dashboard-start-date"
              type="date"
              value={dateRange.start}
              onChange={(event) =>
                setDateRange((current) => ({ ...current, start: event.target.value }))
              }
              className="border border-blue-200 bg-white rounded-lg px-3 py-2 text-sm text-slate-700 focus:ring-2 focus:ring-blue-400 focus:border-blue-500 outline-none transition"
            />
            <label
              className="text-xs font-bold text-blue-800 uppercase tracking-wide"
              htmlFor="dashboard-end-date"
            >
              Sampai
            </label>
            <input
              id="dashboard-end-date"
              type="date"
              value={dateRange.end}
              onChange={(event) =>
                setDateRange((current) => ({ ...current, end: event.target.value }))
              }
              className="border border-blue-200 bg-white rounded-lg px-3 py-2 text-sm text-slate-700 focus:ring-2 focus:ring-blue-400 focus:border-blue-500 outline-none transition"
            />
          </div>
        </div>
        {dateRange.start > dateRange.end && (
          <p className="text-xs text-red-600 mt-2 font-medium">
            Tanggal mulai harus sama atau sebelum tanggal selesai.
          </p>
        )}
      </div>

      {/* 3. Kartu Metrik Keuangan */}
      <MetricCards metrics={metrics} />

      {/* 4. Grafik Performa Bulanan */}
      <MonthlyPerformanceChart
        data={monthlyPerformance}
        title="Performa Keuangan pada Periode Terpilih"
      />

      {/* 5. Grid Bawah: Riwayat Penjualan & Top Produk */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        <div className="lg:col-span-2">
          <RecentSalesList sales={recentSales} />
        </div>
        <div className="lg:col-span-1">
          <TopProductsCarousel products={topProducts} />
        </div>
      </div>
    </PageLayout>
  );
}