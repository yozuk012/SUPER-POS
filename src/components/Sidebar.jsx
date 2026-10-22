"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  MdAssessment,
  MdCalculate,
  MdCategory,
  MdHistory,
  MdHome,
  MdInventory2,
  MdPayments,
  MdPointOfSale,
  MdSettings,
  MdShoppingBag,
  MdStorefront,
} from "react-icons/md";
import { FiLogOut, FiX, FiChevronDown, FiChevronUp } from "react-icons/fi";
import { useAuth } from "@/hooks/useAuth";
import { useActiveStoreName } from "@/hooks/useActiveStoreName";

/**
 * Urutan menu (grouped by function):
 *   1. Beranda
 *   2. MASTER DATA   → Kategori → Bahan Baku → Produk → HPP
 *   3. TRANSAKSI     → Transaksi → Histori
 *   4. KEUANGAN      → Pengeluaran → Laporan
 *   5. PENGATURAN    → Pengaturan
 */
const menuItems = [
  { name: "Beranda", href: "/", icon: MdHome },

  { group: "MASTER DATA" },
  { name: "Kategori", href: "/category", icon: MdCategory },
  { name: "Bahan Baku", href: "/bahan-baku", icon: MdInventory2 },
  { name: "Produk", href: "/product", icon: MdShoppingBag },
  {
    name: "HPP",
    icon: MdCalculate,
    children: [
      { name: "HPP Produk", href: "/hpp/hppproduk" },
      { name: "Hitung HPP", href: "/hpp/hitung-hpp" },
    ],
  },

  { group: "TRANSAKSI" },
  { name: "Transaksi", href: "/transaksi", icon: MdPointOfSale },
  { name: "Histori", href: "/history", icon: MdHistory },

  { group: "KEUANGAN" },
  { name: "Pengeluaran", href: "/pengeluaran", icon: MdPayments },
  { name: "Laporan", href: "/report", icon: MdAssessment },

  { group: "PENGATURAN" },
  { name: "Pengaturan", href: "/settings/profile", icon: MdSettings },
];

export default function Sidebar({ isOpen, setIsOpen }) {
  const pathname = usePathname();
  const { user, merchant, logout, loading } = useAuth();
  const { storeName: activeStoreName, storeLogo: activeStoreLogo } =
    useActiveStoreName(user?.id);

  // Deteksi apakah route aktif berada di dalam dropdown HPP
  const hppChildren =
    menuItems.find((i) => i.children)?.children || [];
  const isHppRouteActive = hppChildren.some(
    (c) => pathname === c.href || pathname.startsWith(c.href + "/")
  );

  const [isHppOpen, setIsHppOpen] = useState(isHppRouteActive);

  // Auto-buka dropdown saat user berada di route HPP
  useEffect(() => {
    if (isHppRouteActive) setIsHppOpen(true);
  }, [isHppRouteActive]);

  const handleLogout = async () => {
    await logout();
  };

  const storeLogo = activeStoreLogo || merchant?.store_logo_url || null;
  const userInitial =
    merchant?.full_name?.charAt(0).toUpperCase() ||
    user?.email?.charAt(0).toUpperCase() ||
    "U";
  const storeLabel = activeStoreName || merchant?.store_name || "Toko";

  const isMenuActive = (item) => {
    if (
      item.href &&
      (pathname === item.href || pathname.startsWith(item.href + "/"))
    ) {
      return true;
    }
    if (item.children) {
      return item.children.some(
        (child) =>
          pathname === child.href || pathname.startsWith(child.href + "/")
      );
    }
    return false;
  };

  return (
    <>
      {/* Overlay Mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 z-40 md:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside
        className={`
          fixed top-0 left-0 h-full w-64 bg-white flex flex-col z-50
          transition-transform duration-300 ease-in-out shadow-xl md:shadow-none
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
          md:translate-x-0 md:static md:inset-auto
        `}
      >
        {/* ═══ HEADER BRAND — gradient biru solid ═══ */}
        <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-500 to-blue-400 p-5 shadow-md shadow-blue-500/20">
          <div className="absolute -top-6 -right-6 w-20 h-20 bg-white/10 rounded-full pointer-events-none" />
          <div className="absolute -bottom-10 -left-8 w-24 h-24 bg-white/5 rounded-full pointer-events-none" />

          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Image
                src="/logo-SP.png"
                alt="Logo aplikasi SuperPOS"
                width={40}
                height={40}
                className="h-10 w-10 rounded-lg object-contain shadow-sm"
                priority
              />
              <div>
                <h1 className="text-lg font-bold text-white tracking-tight leading-tight">
                  SuperPOS
                </h1>
                <p className="text-[10px] text-blue-50 font-semibold uppercase tracking-wider mt-0.5">
                  Frozen Food
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="md:hidden p-1.5 text-white/90 hover:text-white hover:bg-white/20 rounded-lg transition-colors"
              aria-label="Tutup menu"
            >
              <FiX size={20} />
            </button>
          </div>
        </div>

        {/* ═══ NAVIGASI MENU ═══ */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {menuItems.map((item, idx) => {
            // ── Group label ──
            if (item.group) {
              return (
                <div
                  key={`group-${item.group}-${idx}`}
                  className="pt-3 pb-1 px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 select-none"
                >
                  {item.group}
                </div>
              );
            }

            const isActive = isMenuActive(item);
            const Icon = item.icon;

            // ── Dropdown dengan children (HPP) ──
            if (item.children) {
              return (
                <div key={item.name} className="space-y-1">
                  <button
                    onClick={() => setIsHppOpen(!isHppOpen)}
                    className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
                      isActive
                        ? "bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-md shadow-blue-500/30"
                        : "text-slate-600 hover:bg-blue-50 hover:text-blue-700"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon
                        className={`text-xl ${
                          isActive ? "text-white" : "text-slate-400"
                        }`}
                      />
                      <span>{item.name}</span>
                    </div>
                    {isHppOpen ? (
                      <FiChevronUp
                        className={`shrink-0 ${
                          isActive ? "text-white" : "text-blue-500"
                        }`}
                      />
                    ) : (
                      <FiChevronDown
                        className={`shrink-0 ${
                          isActive ? "text-white" : "text-blue-500"
                        }`}
                      />
                    )}
                  </button>

                  {isHppOpen && (
                    <div className="space-y-1 pl-3 border-l-2 border-blue-200 ml-4">
                      {item.children.map((child) => {
                        const isChildActive =
                          pathname === child.href ||
                          pathname.startsWith(child.href + "/");
                        return (
                          <Link
                            key={child.name}
                            href={child.href}
                            onClick={() => setIsOpen(false)}
                            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                              isChildActive
                                ? "bg-blue-100 text-blue-700 border border-blue-200"
                                : "text-slate-500 hover:bg-blue-50 hover:text-blue-700"
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                isChildActive ? "bg-blue-600" : "bg-slate-400"
                              }`}
                            ></span>
                            <span>{child.name}</span>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            // ── Item biasa ──
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
                  isActive
                    ? "bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-md shadow-blue-500/30"
                    : "text-slate-600 hover:bg-blue-50 hover:text-blue-700"
                }`}
              >
                <Icon
                  className={`text-xl ${
                    isActive ? "text-white" : "text-slate-400"
                  }`}
                />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* ═══ FOOTER PROFIL ═══ */}
        <div className="p-3 border-t border-blue-200 bg-gradient-to-r from-blue-50 to-white">
          {loading ? (
            <div className="animate-pulse flex items-center gap-3 p-1">
              <div className="w-10 h-10 bg-blue-100 rounded-full"></div>
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-blue-100 rounded w-3/4"></div>
                <div className="h-2 bg-blue-100 rounded w-1/2"></div>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 p-1">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-lg shrink-0 overflow-hidden ring-2 ring-blue-200">
                {storeLogo ? (
                  /* eslint-disable-next-line @next/next/no-img-element -- logo dari Supabase Storage */
                  <img
                    src={storeLogo}
                    alt={`Logo ${storeLabel}`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span>{userInitial}</span>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-900 truncate">
                  {merchant?.full_name || "User"}
                </p>
                <p
                  className="text-xs text-slate-500 truncate flex items-center gap-1"
                  title={storeLabel}
                >
                  <MdStorefront
                    className="shrink-0 text-blue-500"
                    aria-hidden="true"
                  />
                  <span className="truncate">{storeLabel}</span>
                </p>
              </div>

              <button
                onClick={handleLogout}
                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Logout"
                aria-label="Logout"
              >
                <FiLogOut className="text-xl" />
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}