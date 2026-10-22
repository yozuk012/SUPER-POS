// src/app/auth/register/page.js
'use client';

import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';

export default function RegisterPage() {
  const { registerForm } = useAuth();

  const {
    step,
    formData,
    logoPreview,
    error,
    isSubmitting: loading,
    fieldErrors,
    hasFieldErrors,
    handleChange,
    handleFileChange,
    handleSubmit,
    pinSetup,
  } = registerForm;

  // ── Shared style tokens (dipakai di kedua step) ───────────────
  const inputBase =
    'mt-1.5 w-full px-3.5 py-2.5 bg-white border rounded-lg text-sm text-slate-900 ' +
    'placeholder-slate-400 focus:outline-none focus:ring-2 transition disabled:opacity-60';

  const inputClass = (name) =>
    fieldErrors?.[name]
      ? `${inputBase} border-red-400 focus:border-red-500 focus:ring-red-100`
      : `${inputBase} border-slate-300 focus:border-blue-500 focus:ring-blue-100`;

  const labelClass =
    'block text-xs font-semibold text-slate-700 uppercase tracking-wide';

  const errorTextClass =
    'mt-1 text-xs text-red-600 font-medium flex items-center gap-1';

  const pinInputClass =
    `${inputBase} border-slate-300 text-center text-xl tracking-[0.5em] ` +
    'font-mono focus:border-blue-500 focus:ring-blue-100';

  // ── Brand mark (dipakai di header) ───────────────────────────
  const Brand = () => (
    <div className="flex items-center gap-2">
      <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center">
        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      </div>
      <span className="font-bold text-slate-900 tracking-tight">SuperPOS</span>
    </div>
  );

  const ErrorIcon = () => (
    <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );

  // ============================================================
  // STEP 1: FORM DATA AKUN
  // ============================================================
  if (step === 'form') {
    return (
      <div className="min-h-screen bg-slate-50">
        {/* Header */}
        <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
          <div className="max-w-md mx-auto px-4 h-14 flex items-center justify-between">
            <Link
              href="/auth/login"
              className="inline-flex items-center justify-center w-9 h-9 rounded-lg text-slate-600 hover:bg-slate-100 active:scale-95 transition"
              aria-label="Kembali"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </Link>
            <Brand />
          </div>
        </header>

        <main className="max-w-md mx-auto px-4 pt-6 pb-10">
          {/* Progress */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2 text-xs">
              <span className="font-semibold text-blue-600">1. Data Akun</span>
              <span className="font-medium text-slate-400">2. PIN Pemulihan</span>
            </div>
            <div className="flex gap-2">
              <div className="flex-1 h-1.5 rounded-full bg-blue-600" />
              <div className="flex-1 h-1.5 rounded-full bg-slate-200" />
            </div>
          </div>

          {/* Heading */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-slate-900 mb-1">Buat Akun</h1>
            <p className="text-sm text-slate-500">
              Lengkapi data toko Anda untuk memulai.
            </p>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit} noValidate>
            {/* Nama Lengkap */}
            <div>
              <label htmlFor="fullName" className={labelClass}>Nama Lengkap</label>
              <input
                id="fullName"
                name="fullName"
                type="text"
                required
                value={formData.fullName}
                onChange={handleChange}
                className={inputClass('fullName')}
                placeholder="Nama lengkap Anda"
                autoComplete="name"
              />
            </div>

            {/* Nomor Telepon */}
            <div>
              <label htmlFor="phone" className={labelClass}>Nomor Telepon</label>
              <input
                id="phone"
                name="phone"
                type="tel"
                required
                value={formData.phone}
                onChange={handleChange}
                className={inputClass('phone')}
                placeholder="Contoh: 08123456789"
                autoComplete="tel"
                aria-invalid={!!fieldErrors?.phone}
              />
              {fieldErrors?.phone && (
                <p className={errorTextClass}>
                  <ErrorIcon /> {fieldErrors.phone}
                </p>
              )}
            </div>

            {/* Nama Toko */}
            <div>
              <label htmlFor="storeName" className={labelClass}>Nama Toko</label>
              <input
                id="storeName"
                name="storeName"
                type="text"
                required
                value={formData.storeName}
                onChange={handleChange}
                className={inputClass('storeName')}
                placeholder="Mis. Toko Berkah Jaya"
                autoComplete="organization"
              />
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className={labelClass}>Email</label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleChange}
                className={inputClass('email')}
                placeholder="nama@domain.com"
                autoComplete="email"
                aria-invalid={!!fieldErrors?.email}
              />
              {fieldErrors?.email && (
                <p className={errorTextClass}>
                  <ErrorIcon /> {fieldErrors.email}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className={labelClass}>Password</label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={formData.password}
                onChange={handleChange}
                className={inputClass('password')}
                placeholder="Minimal 6 karakter"
                autoComplete="new-password"
                aria-invalid={!!fieldErrors?.password}
              />
              {fieldErrors?.password && (
                <p className={errorTextClass}>
                  <ErrorIcon /> {fieldErrors.password}
                </p>
              )}
            </div>

            {/* Konfirmasi Password */}
            <div>
              <label htmlFor="confirmPassword" className={labelClass}>
                Konfirmasi Password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                value={formData.confirmPassword}
                onChange={handleChange}
                className={inputClass('confirmPassword')}
                placeholder="Ulangi password"
                autoComplete="new-password"
                aria-invalid={!!fieldErrors?.confirmPassword}
              />
              {fieldErrors?.confirmPassword && (
                <p className={errorTextClass}>
                  <ErrorIcon /> {fieldErrors.confirmPassword}
                </p>
              )}
              {!fieldErrors?.confirmPassword &&
                formData.password &&
                formData.confirmPassword &&
                formData.password === formData.confirmPassword && (
                  <p className="mt-1 text-xs text-emerald-600 font-medium">✓ Password cocok</p>
                )}
            </div>

            {/* Logo Toko */}
            <div>
              <span className={labelClass}>
                Logo Toko{' '}
                <span className="text-slate-400 font-normal normal-case">(opsional)</span>
              </span>
              <label
                htmlFor="logo-dropzone"
                className="mt-1.5 flex items-center gap-3 w-full p-3 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 transition touch-manipulation"
              >
                {logoPreview ? (
                  <img
                    src={logoPreview}
                    alt="Preview logo toko"
                    className="w-12 h-12 object-cover rounded-lg border border-slate-200 flex-shrink-0"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 flex-shrink-0">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-700 truncate">
                    {logoPreview ? 'Ganti logo' : 'Unggah logo toko'}
                  </p>
                  <p className="text-xs text-slate-500">PNG atau JPG, maks 2MB</p>
                </div>
              </label>
              <input
                id="logo-dropzone"
                name="logo"
                type="file"
                className="hidden"
                accept="image/png, image/jpeg, image/jpg"
                onChange={handleFileChange}
              />
            </div>

            {/* Error banner server-side */}
            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 p-3">
                <p className="text-sm text-red-700 text-center font-medium">{error}</p>
              </div>
            )}

            {/* Submit */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading || hasFieldErrors}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 active:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition active:scale-[0.99]"
              >
                {loading ? (
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
                    Lanjut
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </>
                )}
              </button>
              {hasFieldErrors && (
                <p className="mt-2 text-xs text-center text-red-500">
                  Perbaiki kolom yang ditandai merah terlebih dahulu.
                </p>
              )}
            </div>
          </form>

          {/* Link login */}
          <p className="mt-6 text-center text-sm text-slate-600">
            Sudah punya akun?{' '}
            <Link href="/auth/login" className="font-semibold text-blue-600 hover:text-blue-700">
              Masuk
            </Link>
          </p>
        </main>
      </div>
    );
  }

  // ============================================================
  // STEP 2: SETUP PIN PEMULIHAN
  // ============================================================
  if (step === 'pin-setup') {
    const pinMismatch =
      pinSetup.pinData.pin &&
      pinSetup.pinData.confirmPin &&
      pinSetup.pinData.pin !== pinSetup.pinData.confirmPin;

    const pinMatch =
      pinSetup.pinData.pin &&
      pinSetup.pinData.confirmPin &&
      pinSetup.pinData.pin === pinSetup.pinData.confirmPin;

    return (
      <div className="min-h-screen bg-slate-50">
        {/* Header */}
        <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
          <div className="max-w-md mx-auto px-4 h-14 flex items-center justify-between">
            <button
              type="button"
              onClick={pinSetup.handleBack}
              className="inline-flex items-center justify-center w-9 h-9 rounded-lg text-slate-600 hover:bg-slate-100 active:scale-95 transition"
              aria-label="Kembali"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <Brand />
          </div>
        </header>

        <main className="max-w-md mx-auto px-4 pt-6 pb-10">
          {/* Progress */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2 text-xs">
              <span className="font-medium text-emerald-600 flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
                Data Akun
              </span>
              <span className="font-semibold text-blue-600">2. PIN Pemulihan</span>
            </div>
            <div className="flex gap-2">
              <div className="flex-1 h-1.5 rounded-full bg-emerald-500" />
              <div className="flex-1 h-1.5 rounded-full bg-blue-600" />
            </div>
          </div>

          {/* Heading */}
          <div className="mb-5">
            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center mb-3">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mb-1">Buat PIN Pemulihan</h1>
            <p className="text-sm text-slate-500">
              Amankan akun Anda dengan PIN 6 digit.
            </p>
          </div>

          {/* Info */}
          <div className="mb-5 rounded-lg bg-blue-50 border border-blue-100 p-3.5">
            <p className="text-xs text-blue-800 leading-relaxed">
              <span className="font-semibold">Kenapa perlu PIN?</span> PIN digunakan untuk
              mereset password jika Anda lupa. Simpan di tempat aman dan jangan bagikan
              ke siapa pun.
            </p>
          </div>

          <form className="space-y-4" onSubmit={pinSetup.handleSubmit} noValidate>
            {/* PIN */}
            <div>
              <label htmlFor="pin" className={labelClass}>PIN Pemulihan (6 Digit)</label>
              <input
                id="pin"
                name="pin"
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                required
                value={pinSetup.pinData.pin}
                onChange={pinSetup.handleChange}
                className={pinInputClass}
                placeholder="••••••"
                maxLength={6}
                autoComplete="off"
              />
              <p className="mt-1 text-xs text-slate-500">
                Tersisa{' '}
                <span className="font-semibold text-blue-600">
                  {6 - pinSetup.pinData.pin.length}
                </span>{' '}
                digit
              </p>
            </div>

            {/* Konfirmasi PIN */}
            <div>
              <label htmlFor="confirmPin" className={labelClass}>Konfirmasi PIN</label>
              <input
                id="confirmPin"
                name="confirmPin"
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                required
                value={pinSetup.pinData.confirmPin}
                onChange={pinSetup.handleChange}
                className={pinInputClass}
                placeholder="••••••"
                maxLength={6}
                autoComplete="off"
              />
              {pinMismatch && (
                <p className={errorTextClass}>
                  <ErrorIcon /> Konfirmasi PIN tidak cocok
                </p>
              )}
              {pinMatch && (
                <p className="mt-1 text-xs text-emerald-600 font-medium">✓ PIN cocok</p>
              )}
            </div>

            {/* Error PIN */}
            {pinSetup.error && (
              <div className="rounded-lg bg-red-50 border border-red-200 p-3">
                <p className="text-sm text-red-700 text-center font-medium">{pinSetup.error}</p>
              </div>
            )}

            {/* Submit */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={
                  pinSetup.isSubmitting ||
                  pinSetup.pinData.pin.length !== 6 ||
                  pinSetup.pinData.pin !== pinSetup.pinData.confirmPin
                }
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 active:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition active:scale-[0.99]"
              >
                {pinSetup.isSubmitting ? (
                  <>
                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Menyimpan PIN...
                  </>
                ) : (
                  <>
                    Selesai & Daftar
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </>
                )}
              </button>
            </div>

            {/* Skip */}
            <button
              type="button"
              onClick={pinSetup.handleSkip}
              className="w-full text-xs text-slate-500 hover:text-slate-700 underline underline-offset-2 transition"
            >
              Lewati step ini (tidak direkomendasikan)
            </button>
          </form>
        </main>
      </div>
    );
  }

  // ============================================================
  // FALLBACK: LOADING
  // ============================================================
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="text-center">
        <svg className="animate-spin h-8 w-8 text-blue-600 mx-auto mb-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
        <p className="text-sm text-slate-500">Memuat...</p>
      </div>
    </div>
  );
}