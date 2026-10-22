// src/app/auth/login/page.js
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FiHelpCircle } from 'react-icons/fi';
import { useAuth } from '@/hooks/useAuth';

export default function LoginPage() {
  const router = useRouter();
  const { loginForm, user, loading } = useAuth();

  // Pengguna yang masih punya sesi aktif tidak perlu melihat form login.
  // Ini juga menjaga agar alur "/" -> "/welcome" -> "/auth/login" tetap
  // berakhir di dashboard, bukan berhenti di halaman login.
  useEffect(() => {
    if (!loading && user) router.replace('/dashboard');
  }, [loading, user, router]);

  // ── Shared style tokens (konsisten dgn register page) ────────
  const inputClass =
    'mt-1.5 w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm ' +
    'text-slate-900 placeholder-slate-400 ' +
    'focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition';

  const labelClass =
    'block text-xs font-semibold text-slate-700 uppercase tracking-wide';

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header dengan brand */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-md mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Image
              src="/logo-SP.png"
              alt="Logo aplikasi SuperPOS"
              width={32}
              height={32}
              className="h-8 w-8 object-contain"
              priority
            />
            <span className="font-bold text-slate-900 tracking-tight">SuperPOS</span>
          </div>

          <Link
            href="/welcome?guide=1"
            className="inline-flex items-center justify-center w-9 h-9 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-blue-600 transition active:scale-95"
            aria-label="Buka panduan penggunaan aplikasi"
            title="Panduan / Bantuan"
          >
            <FiHelpCircle className="h-5 w-5" />
          </Link>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 pt-10 pb-10">
        {/* Heading */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-100 mb-3">
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-1">Masuk</h1>
          <p className="text-sm text-slate-500">
            Masuk ke akun SuperPOS Anda.
          </p>
        </div>

        {/* Form */}
        <form className="space-y-4" onSubmit={loginForm.handleSubmit}>
          {/* Email */}
          <div>
            <label htmlFor="email" className={labelClass}>Email</label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={loginForm.formData.email}
              onChange={loginForm.handleChange}
              className={inputClass}
              placeholder="nama@domain.com"
            />
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className={labelClass}>Password</label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={loginForm.formData.password}
              onChange={loginForm.handleChange}
              className={inputClass}
              placeholder="Masukkan password"
            />
            <div className="mt-2 text-right">
              <Link
                href="/auth/forgot-password"
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Lupa password?
              </Link>
            </div>
          </div>

          {/* Error */}
          {loginForm.error && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-3">
              <p className="text-sm text-red-700 text-center font-medium">
                {loginForm.error}
              </p>
            </div>
          )}

          {/* Submit */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={loginForm.isSubmitting}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 active:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition active:scale-[0.99]"
            >
              {loginForm.isSubmitting ? (
                <>
                  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Memproses...
                </>
              ) : (
                <>
                  Masuk
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Register link */}
        <p className="mt-6 text-center text-sm text-slate-600">
          Belum punya akun?{' '}
          <Link href="/auth/register" className="font-semibold text-blue-600 hover:text-blue-700">
            Daftar
          </Link>
        </p>

        {/* Footer help */}
        <div className="mt-8 pt-6 border-t border-slate-200 flex justify-center">
          <Link
            href="/welcome?guide=1"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-blue-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <FiHelpCircle className="h-3.5 w-3.5" />
            Panduan / Bantuan
          </Link>
        </div>
      </main>
    </div>
  );
}