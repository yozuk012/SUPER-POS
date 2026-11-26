'use client';

import { useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { markOnboardingCompleted } from '@/lib/onboarding';
import { PHONE_REGEX, getSafeTextError, getEmailError, getPasswordError } from '@/lib/authValidation';
import { registerAccount, removeMainStoreSuffix } from '@/services/auth/registration';
import { useAuth } from './useAuth';

export function useRegisterForm() {
  const router = useRouter();
  const { refreshMerchant } = useAuth();
  const [registerStep, setRegisterStep] = useState('form');

  const [regFormData, setRegFormData] = useState({
    fullName: '', email: '', phone: '', storeName: '', password: '', confirmPassword: '',
  });
  const [regLogoFile, setRegLogoFile] = useState(null);
  const [regLogoPreview, setRegLogoPreview] = useState(null);
  const [regError, setRegError] = useState(null);

  const [pinData, setPinData] = useState({ pin: '', confirmPin: '' });
  const [pinError, setPinError] = useState(null);
  const [isSettingPin, setIsSettingPin] = useState(false);

  // ==========================================
  // 🔥 FIELD-LEVEL VALIDATION (computed, realtime)
  // ==========================================
  const regFieldErrors = useMemo(() => {
    const errors = {};

    const fullNameError = getSafeTextError(regFormData.fullName, 'Nama lengkap');
    const storeNameError = getSafeTextError(regFormData.storeName, 'Nama toko');
    if (fullNameError) errors.fullName = fullNameError;
    if (storeNameError) errors.storeName = storeNameError;

    if (regFormData.email) {
      const emailError = getEmailError(regFormData.email);
      if (emailError) errors.email = emailError;
    }

    // Phone — hanya cek format kalau sudah ada isinya
    if (regFormData.phone && !PHONE_REGEX.test(regFormData.phone.trim())) {
      errors.phone = 'Format nomor telepon tidak valid (8-16 digit angka)';
    }

    // Password — minimal 6 karakter
    if (regFormData.password && regFormData.password.length < 6) {
      errors.password = 'Password minimal 6 karakter';
    }
    if (regFormData.password) {
      const passwordError = getPasswordError(regFormData.password);
      if (passwordError && passwordError !== 'Password wajib diisi') errors.password = passwordError;
    }

    // Konfirmasi password — hanya muncul saat field konfirmasi sudah diisi
    if (regFormData.confirmPassword && regFormData.password !== regFormData.confirmPassword) {
      errors.confirmPassword = 'Konfirmasi password tidak cocok';
    }

    return errors;
  }, [regFormData]);

  const hasFieldErrors = Object.keys(regFieldErrors).length > 0;

  // ==========================================
  // HANDLERS
  // ==========================================
  const handleRegChange = useCallback((e) => {
    const { name, value } = e.target;
    setRegFormData((prev) => ({ ...prev, [name]: value }));
    setRegError(null);
  }, []);

  const handleRegFileChange = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { setRegError('Ukuran logo maksimal 2MB'); return; }
    if (!file.type.startsWith('image/')) { setRegError('File harus berupa gambar (JPG, PNG, dll)'); return; }
    setRegLogoFile(file);
    setRegLogoPreview(URL.createObjectURL(file));
    setRegError(null);
  }, []);

  const handlePinChange = useCallback((e) => {
    const { name, value } = e.target;
    const sanitizedValue = name === 'pin' || name === 'confirmPin'
      ? value.replace(/\D/g, '').slice(0, 6)
      : value;
    setPinData((prev) => ({ ...prev, [name]: sanitizedValue }));
    setPinError(null);
  }, []);

  // ==========================================
  // STEP 1: Validasi data akun tanpa menyimpan
  // ==========================================
  const submitRegister = useCallback((e) => {
    if (e) e.preventDefault();
    setRegError(null);

    if (hasFieldErrors) {
      // Ambil error pertama sebagai banner (opsional)
      const firstError = Object.values(regFieldErrors)[0];
      setRegError(firstError);
      return;
    }

    try {
      // --- Validasi required ---
      if (!regFormData.fullName.trim()) throw new Error('Nama lengkap wajib diisi');
      if (!regFormData.email.trim()) throw new Error('Email wajib diisi');
      if (!regFormData.phone.trim()) throw new Error('Nomor telepon wajib diisi');
      if (!regFormData.storeName.trim()) throw new Error('Nama toko wajib diisi');
      if (!regFormData.password) throw new Error('Password wajib diisi');
      if (!regFormData.confirmPassword) throw new Error('Konfirmasi password wajib diisi');

      const fullNameError = getSafeTextError(regFormData.fullName, 'Nama lengkap');
      const storeNameError = getSafeTextError(regFormData.storeName, 'Nama toko');
      if (fullNameError) throw new Error(fullNameError);
      if (storeNameError) throw new Error(storeNameError);

      // --- Validasi format (redundant dengan fieldErrors, tapi biar aman) ---
      const emailError = getEmailError(regFormData.email);
      if (emailError) throw new Error(emailError);
      if (!PHONE_REGEX.test(regFormData.phone.trim())) {
        throw new Error('Format nomor telepon tidak valid (8-16 digit angka)');
      }
      if (regFormData.password.length < 6) {
        throw new Error('Password minimal 6 karakter');
      }
      const passwordError = getPasswordError(regFormData.password);
      if (passwordError) throw new Error(passwordError);
      if (regFormData.password !== regFormData.confirmPassword) {
        throw new Error('Konfirmasi password tidak cocok');
      }

      const storeBaseName = removeMainStoreSuffix(regFormData.storeName);
      if (!storeBaseName) throw new Error('Nama toko wajib diisi');

      setRegisterStep('pin-setup');
    } catch (err) {
      setRegError(err.message);
    }
  }, [regFormData, regFieldErrors, hasFieldErrors]);

  // ==========================================
  // STEP 2: Validasi PIN dan simpan pendaftaran
  // ==========================================
  const submitRecoveryPin = useCallback(async (e) => {
    if (e) e.preventDefault();
    if (registerStep !== 'pin-setup' || isSettingPin) return;
    setPinError(null);
    setIsSettingPin(true);

    try {
      if (!pinData.pin) throw new Error('PIN wajib diisi');
      if (!/^\d{6}$/.test(pinData.pin)) throw new Error('PIN harus 6 digit angka');
      if (pinData.pin !== pinData.confirmPin) throw new Error('Konfirmasi PIN tidak cocok');

      const simplePins = ['123456', '654321', '111111', '000000', '121212', '696969'];
      if (simplePins.includes(pinData.pin)) {
        throw new Error('PIN terlalu mudah ditebak. Gunakan kombinasi angka yang lebih aman.');
      }

      await registerAccount(regFormData, regLogoFile, pinData.pin);
      await refreshMerchant();

      setRegFormData({ fullName: '', email: '', phone: '', storeName: '', password: '', confirmPassword: '' });
      setRegLogoFile(null);
      setRegLogoPreview(null);

      alert('🎉 Registrasi berhasil!\n\nPIN Pemulihan telah disimpan.\nSilakan login dengan email dan password Anda.\n\n📌 PENTING: Simpan PIN Anda di tempat aman!');

      setRegisterStep('form');
      setPinData({ pin: '', confirmPin: '' });

      markOnboardingCompleted();
      router.push('/auth/login');

    } catch (err) {
      console.warn('Register warning:', err.message);
      setPinError(err.message);
    } finally {
      setIsSettingPin(false);
    }
  }, [registerStep, isSettingPin, pinData, regFormData, regLogoFile, router, refreshMerchant]);

  const backToRegisterForm = useCallback(() => {
    if (isSettingPin) return;
    setRegisterStep('form');
    setPinData({ pin: '', confirmPin: '' });
    setPinError(null);
  }, [isSettingPin]);

  return {
    step: registerStep,
    formData: regFormData,
    logoFile: regLogoFile,
    logoPreview: regLogoPreview,
    error: regError,

    // 🔥 BARU — field-level errors & flag
    fieldErrors: regFieldErrors,
    hasFieldErrors,

    handleChange: handleRegChange,
    handleFileChange: handleRegFileChange,
    handleSubmit: submitRegister,

    pinSetup: {
      pinData: pinData,
      error: pinError,
      isSubmitting: isSettingPin,
      handleChange: handlePinChange,
      handleSubmit: submitRecoveryPin,
      handleBack: backToRegisterForm,
    },
  };
}
