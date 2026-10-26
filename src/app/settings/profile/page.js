'use client';

/* eslint-disable @next/next/no-img-element -- logo toko dinamis dari Supabase Storage */

import { useState, useEffect } from 'react';
import { FiLoader } from 'react-icons/fi';
import {
  MdChevronLeft,
  MdExpandLess,
  MdExpandMore,
  MdFileDownload,
  MdInventory2,
  MdLockOutline,
  MdOutlineEdit,
  MdPercent,
  MdPerson,
  MdSettings,
  MdStorefront,
  MdSync,
} from 'react-icons/md';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useActiveStore } from '@/lib/activeStore';
import PageLayout from '../../../components/PageLayout';

export default function ProfilePage() {
  const router = useRouter();
  const { storeId } = useActiveStore();

  const [businessName, setBusinessName] = useState('Memuat...');
  const [userName, setUserName] = useState('Memuat...');
  const [logoUrl, setLogoUrl] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    async function fetchProfile() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push('/auth/login');
          return;
        }

        const [{ data: merchant, error: merchantError }, { data: store, error: storeError }] = await Promise.all([
          supabase
            .from('merchants')
            .select('full_name, store_name, store_logo_url')
            .eq('id', user.id)
            .single(),
          storeId
            ? supabase
                .from('stores')
                .select('name, logo_url')
                .eq('id', storeId)
                .eq('user_id', user.id)
                .maybeSingle()
            : Promise.resolve({ data: null, error: null }),
        ]);

        if (merchantError) throw merchantError;
        if (storeError) throw storeError;

        if (merchant) {
          setUserName(merchant.full_name || 'Pengguna');
          setBusinessName(store?.name || merchant.store_name || 'Nama Toko');
          setLogoUrl(store?.logo_url || merchant.store_logo_url || null);
        }
      } catch (err) {
        console.error('Gagal memuat profil:', err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchProfile();
  }, [router, storeId]);

  const menuItems = [
    { label: 'Edit Profile', icon: MdOutlineEdit, href: '/settings/profile/edit-profile' },
    { label: 'Change Password', icon: MdLockOutline, href: '/settings/profile/change-password' },
    { label: 'Persentase Online', icon: MdPercent, href: '/settings/profile/persentase-online' },
    { label: 'Switch Store', icon: MdSync, href: '/settings/profile/stores' },
    { label: 'Export Data', icon: MdFileDownload, href: '/settings/profile/export-data' },
  ];

  const isSeedEnabled =
    process.env.NEXT_PUBLIC_ENABLE_SEED_DATA === 'true' ||
    (process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_ENABLE_SEED_DATA !== 'false');

  const moreItems = [
    ...(isSeedEnabled
      ? [{ label: 'Seed Data Produk', icon: MdInventory2, href: '/settings/profile/seed-data' }]
      : []),
  ];

  const handleMenuClick = (href) => {
    router.push(href);
  };

  // ═══ LOADING STATE ═══
  if (isLoading) {
    return (
      <PageLayout title="Pengaturan">
        <div className="flex flex-col items-center justify-center min-h-[50vh]">
          <div className="relative">
            <div className="w-14 h-14 rounded-full border-4 border-blue-200" />
            <div className="absolute inset-0 w-14 h-14 rounded-full border-4 border-transparent border-t-blue-600 animate-spin" />
          </div>
          <p className="mt-4 text-sm text-slate-500 font-semibold">Memuat profil...</p>
        </div>
      </PageLayout>
    );
  }

  // ═══ MAIN RENDER ═══
  return (
    <PageLayout title="Pengaturan">
      <div className="relative max-w-2xl mx-auto">

        {/* ═══ PROFILE HERO: gradient biru solid + brand ═══ */}
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-blue-600 via-blue-500 to-blue-400 p-6 mb-4 shadow-lg shadow-blue-500/30">
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full pointer-events-none" />
          <div className="absolute -bottom-16 -left-12 w-40 h-40 bg-white/5 rounded-full pointer-events-none" />

          <div className="relative flex flex-col items-center">
            {/* Brand Chip SuperPOS */}
            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-6 rounded-md bg-white flex items-center justify-center">
                <svg className="w-3.5 h-3.5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <span className="text-xs font-bold text-white/90 uppercase tracking-wider">
                SuperPOS
              </span>
            </div>

            {/* Avatar / Logo Toko */}
            <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mb-4 border-4 border-white/40 shadow-xl overflow-hidden ring-4 ring-white/20">
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt="Logo Toko"
                  className="w-full h-full object-cover"
                />
              ) : (
                <MdPerson className="w-12 h-12 text-blue-300" />
              )}
            </div>

            {/* Business Name & User */}
            <h2 className="text-xl font-bold text-white text-center">
              {businessName}
            </h2>
            <p className="text-blue-50 text-sm mt-1">
              {userName}
            </p>
          </div>
        </div>

        {/* ═══ DROPDOWN MENU PENGATURAN: card gradient + top accent bar ═══ */}
        <div className="relative overflow-hidden bg-gradient-to-br from-white via-blue-50 to-blue-100 rounded-xl shadow-sm border border-blue-200">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 via-blue-500 to-blue-400" />

          {/* Tombol pembuka dropdown */}
          <button
            type="button"
            onClick={() => setIsMenuOpen((prev) => !prev)}
            aria-expanded={isMenuOpen}
            aria-controls="settings-dropdown"
            className="w-full px-4 py-4 flex items-center justify-between hover:bg-blue-50/70 transition-colors pt-5"
          >
            <div className="flex items-center gap-3">
              <span className="p-2 rounded-lg bg-blue-600 text-white shadow-sm shadow-blue-500/30">
                <MdSettings className="w-5 h-5" />
              </span>
              <span className="text-left">
                <span className="block font-bold text-slate-900">Pengaturan</span>
                <span className="block text-xs text-slate-500">
                  {isMenuOpen
                    ? `${menuItems.length + moreItems.length} menu pengaturan`
                    : 'Ketuk untuk melihat menu pengaturan'}
                </span>
              </span>
            </div>
            {isMenuOpen ? (
              <MdExpandLess className="w-5 h-5 text-blue-600 shrink-0" />
            ) : (
              <MdExpandMore className="w-5 h-5 text-blue-600 shrink-0" />
            )}
          </button>

          {/* Isi dropdown */}
          {isMenuOpen && (
            <div
              id="settings-dropdown"
              className="border-t border-blue-200 divide-y divide-blue-100 animate-in fade-in slide-in-from-top-2 duration-200"
            >
              {menuItems.map((item) => (
                <button
                  key={item.href}
                  type="button"
                  onClick={() => handleMenuClick(item.href)}
                  className="w-full px-4 py-4 flex items-center justify-between text-slate-700 hover:bg-blue-100/70 transition-colors"
                >
                  <span className="flex items-center gap-3">
                    <span className="p-1.5 rounded-lg bg-blue-100 text-blue-700">
                      <item.icon className="w-4 h-4" />
                    </span>
                    <span className="font-semibold text-slate-800">{item.label}</span>
                  </span>
                  <MdChevronLeft className="w-4 h-4 text-blue-500" />
                </button>
              ))}

              {/* Sub-menu More */}
              {moreItems.length > 0 && (
                <div className="bg-blue-100/50">
                  <div className="px-4 pt-3 pb-1 flex items-center gap-2">
                    <MdStorefront className="w-4 h-4 text-blue-700" />
                    <p className="text-[11px] font-bold uppercase tracking-wide text-blue-700">
                      More
                    </p>
                  </div>
                  {moreItems.map((item) => (
                    <button
                      key={item.href}
                      type="button"
                      onClick={() => handleMenuClick(item.href)}
                      className="w-full px-4 py-4 flex items-center justify-between text-slate-700 hover:bg-white transition-colors"
                    >
                      <span className="flex items-center gap-3">
                        <span className="p-1.5 rounded-lg bg-blue-100 text-blue-700">
                          <item.icon className="w-4 h-4" />
                        </span>
                        <span className="font-semibold text-slate-800">{item.label}</span>
                      </span>
                      <MdChevronLeft className="w-4 h-4 text-blue-500" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Bottom Navigation Spacer */}
        <div className="h-20" />
      </div>
    </PageLayout>
  );
}