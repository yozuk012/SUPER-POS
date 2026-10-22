// src/lib/onboarding.js
// Penanda lokal untuk membedakan pembukaan aplikasi pertama kali
// (Welcome Page + panduan) dengan pembukaan berikutnya (langsung Login).

export const ONBOARDING_STORAGE_KEY = 'has_completed_onboarding';

// Mengembalikan true jika user sudah pernah menyelesaikan/melewati panduan.
export const hasCompletedOnboarding = () => {
  if (typeof window === 'undefined') return false;

  try {
    return window.localStorage.getItem(ONBOARDING_STORAGE_KEY) === 'true';
  } catch {
    // localStorage bisa diblokir (mode privat/kebijakan browser).
    return false;
  }
};

// Dipanggil saat user melanjutkan dari Welcome Page, berhasil login,
// atau logout — sehingga Welcome Page tidak tampil lagi.
export const markOnboardingCompleted = () => {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.setItem(ONBOARDING_STORAGE_KEY, 'true');
  } catch {
    // Abaikan jika localStorage tidak tersedia.
  }
};
