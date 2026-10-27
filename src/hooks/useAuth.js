'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { supabase, uploadFile } from '@/lib/supabase';
import { markOnboardingCompleted } from '@/lib/onboarding';
import { useRouter } from 'next/navigation';
import bcrypt from 'bcryptjs';

const MAIN_STORE_SUFFIX = ' - Cabang Utama';
const removeMainStoreSuffix = (storeName) =>
  storeName.trim().replace(/(?:\s*-\s*cabang\s*utama)+$/i, '').trim();

// ==========================================
// REGEX VALIDASI (dipakai di computed & submit)
// ==========================================
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[0-9+\-\s()]{8,16}$/;

export function useAuth() {
  const router = useRouter();

  // ==========================================
  // 1. GLOBAL AUTH STATE
  // ==========================================
  const [user, setUser] = useState(null);
  const [merchant, setMerchant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ==========================================
  // 2. CORE UTILITY
  // ==========================================
  const fetchMerchant = useCallback(async (userId) => {
    try {
      const { data, error } = await supabase.from('merchants').select('*').eq('id', userId).maybeSingle();
      if (error) throw error;
      setMerchant(data);
      return data;
    } catch (err) {
      console.warn('Fetch merchant warning:', err.message);
      return null;
    }
  }, []);

  // ==========================================
  // 3. REGISTER FORM STATE & LOGIC
  // ==========================================
  const [registerStep, setRegisterStep] = useState('form');
  const [registeredUserId, setRegisteredUserId] = useState(null);

  const [regFormData, setRegFormData] = useState({
    fullName: '', email: '', phone: '', storeName: '', password: '', confirmPassword: '',
  });
  const [regLogoFile, setRegLogoFile] = useState(null);
  const [regLogoPreview, setRegLogoPreview] = useState(null);
  const [regError, setRegError] = useState(null);
  const [isRegistering, setIsRegistering] = useState(false);

  const [pinData, setPinData] = useState({ pin: '', confirmPin: '' });
  const [pinError, setPinError] = useState(null);
  const [isSettingPin, setIsSettingPin] = useState(false);

  // ==========================================
  // 🔥 FIELD-LEVEL VALIDATION (computed, realtime)
  // ==========================================
  const regFieldErrors = useMemo(() => {
    const errors = {};

    // Email — hanya cek format kalau sudah ada isinya
    if (regFormData.email && !EMAIL_REGEX.test(regFormData.email.trim())) {
      errors.email = 'Format email tidak valid (contoh: nama@domain.com)';
    }

    // Phone — hanya cek format kalau sudah ada isinya
    if (regFormData.phone && !PHONE_REGEX.test(regFormData.phone.trim())) {
      errors.phone = 'Format nomor telepon tidak valid (8-16 digit angka)';
    }

    // Password — minimal 6 karakter
    if (regFormData.password && regFormData.password.length < 6) {
      errors.password = 'Password minimal 6 karakter';
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
  // STEP 1: Submit Register (dengan validasi lengkap)
  // ==========================================
  const submitRegister = useCallback(async (e) => {
    if (e) e.preventDefault();
    setRegError(null);

    // 🛑 Cek field errors dulu sebelum hit API
    if (hasFieldErrors) {
      // Ambil error pertama sebagai banner (opsional)
      const firstError = Object.values(regFieldErrors)[0];
      setRegError(firstError);
      return;
    }

    setIsRegistering(true);

    try {
      // --- Validasi required ---
      if (!regFormData.fullName.trim()) throw new Error('Nama lengkap wajib diisi');
      if (!regFormData.email.trim()) throw new Error('Email wajib diisi');
      if (!regFormData.phone.trim()) throw new Error('Nomor telepon wajib diisi');
      if (!regFormData.storeName.trim()) throw new Error('Nama toko wajib diisi');
      if (!regFormData.password) throw new Error('Password wajib diisi');
      if (!regFormData.confirmPassword) throw new Error('Konfirmasi password wajib diisi');

      // --- Validasi format (redundant dengan fieldErrors, tapi biar aman) ---
      if (!EMAIL_REGEX.test(regFormData.email.trim())) {
        throw new Error('Format email tidak valid (contoh: nama@domain.com)');
      }
      if (!PHONE_REGEX.test(regFormData.phone.trim())) {
        throw new Error('Format nomor telepon tidak valid (8-16 digit angka)');
      }
      if (regFormData.password.length < 6) {
        throw new Error('Password minimal 6 karakter');
      }
      if (regFormData.password !== regFormData.confirmPassword) {
        throw new Error('Konfirmasi password tidak cocok');
      }

      const storeBaseName = removeMainStoreSuffix(regFormData.storeName);
      if (!storeBaseName) throw new Error('Nama toko wajib diisi');

      // 1. Buat user di Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: regFormData.email.trim(),
        password: regFormData.password,
        options: {
          data: {
            full_name: regFormData.fullName.trim(),
            store_name: storeBaseName,
            phone: regFormData.phone.trim(),
          },
        },
      });
      if (authError) throw authError;
      if (!authData.user) throw new Error('Registrasi gagal: User tidak ditemukan');

      // 2. Upload logo jika ada
      let storeLogoUrl = null;
      if (regLogoFile) {
        const fileName = `logo-${authData.user.id}-${Date.now()}`;
        const uploadResult = await uploadFile(regLogoFile, 'logo-toko', fileName);
        if (!uploadResult.success) throw new Error('Gagal upload logo: ' + uploadResult.error);
        storeLogoUrl = uploadResult.url;
      }

      // 3. Insert ke merchants
      const { error: merchantError } = await supabase.from('merchants').insert({
        id: authData.user.id,
        full_name: regFormData.fullName,
        phone: regFormData.phone || null,
        store_name: storeBaseName,
        store_logo_url: storeLogoUrl || null,
      });
      if (merchantError) throw merchantError;

      // 4. Insert ke stores
      const { error: storeError } = await supabase.from('stores').insert({
        user_id: authData.user.id,
        name: storeBaseName + MAIN_STORE_SUFFIX,
        type: 'frozen_food',
        address: null,
        logo_url: storeLogoUrl || null,
        is_active: true,
      });
      if (storeError) throw storeError;

      // 5. Lanjut ke step PIN
      setRegisteredUserId(authData.user.id);
      setRegisterStep('pin-setup');

      setRegFormData({ fullName: '', email: '', phone: '', storeName: '', password: '', confirmPassword: '' });
      setRegLogoFile(null);
      setRegLogoPreview(null);

    } catch (err) {
      console.warn('Register warning:', err.message);
      setRegError(err.message);
    } finally {
      setIsRegistering(false);
    }
  }, [regFormData, regLogoFile, regFieldErrors, hasFieldErrors]);

  // ==========================================
  // STEP 2: Submit Recovery PIN
  // ==========================================
  const submitRecoveryPin = useCallback(async (e) => {
    if (e) e.preventDefault();
    setPinError(null);
    setIsSettingPin(true);

    try {
      if (!pinData.pin) throw new Error('PIN wajib diisi');
      if (pinData.pin.length !== 6) throw new Error('PIN harus 6 digit angka');
      if (pinData.pin !== pinData.confirmPin) throw new Error('Konfirmasi PIN tidak cocok');
      if (!registeredUserId) throw new Error('Sesi registrasi tidak valid. Silakan daftar ulang.');

      const simplePins = ['123456', '654321', '111111', '000000', '121212', '696969'];
      if (simplePins.includes(pinData.pin)) {
        throw new Error('PIN terlalu mudah ditebak. Gunakan kombinasi angka yang lebih aman.');
      }

      const hashedPin = await bcrypt.hash(pinData.pin, 10);

      const { error: updateError } = await supabase
        .from('merchants')
        .update({
          recovery_pin_hash: hashedPin,
          pin_attempts: 0,
          pin_locked_until: null,
        })
        .eq('id', registeredUserId);

      if (updateError) throw updateError;

      alert('🎉 Registrasi berhasil!\n\nPIN Pemulihan telah disimpan.\nSilakan login dengan email dan password Anda.\n\n📌 PENTING: Simpan PIN Anda di tempat aman!');

      setRegisterStep('form');
      setRegisteredUserId(null);
      setPinData({ pin: '', confirmPin: '' });

      markOnboardingCompleted();
      router.push('/auth/login');

    } catch (err) {
      console.warn('Setup PIN warning:', err.message);
      setPinError(err.message);
    } finally {
      setIsSettingPin(false);
    }
  }, [pinData, registeredUserId, router]);

  const skipPinSetup = useCallback(async () => {
    if (!registeredUserId) return;
    const confirm = window.confirm(
      '⚠️ PERINGATAN!\n\n' +
      'Jika Anda skip setup PIN sekarang, Anda TIDAK BISA mereset password sendiri jika lupa.\n' +
      'Anda harus menghubungi CS untuk bantuan.\n\n' +
      'Yakin ingin melewati step ini?'
    );
    if (!confirm) return;

    setRegisterStep('form');
    setRegisteredUserId(null);
    setPinData({ pin: '', confirmPin: '' });
    markOnboardingCompleted();
    router.push('/auth/login');
  }, [registeredUserId, router]);

  const backToRegisterForm = useCallback(() => {
    const confirm = window.confirm(
      'Kembali ke form registrasi akan membatalkan pendaftaran.\n' +
      'Anda harus mendaftar ulang dari awal.\n\n' +
      'Lanjutkan?'
    );
    if (confirm) {
      setRegisterStep('form');
      setRegisteredUserId(null);
      setPinData({ pin: '', confirmPin: '' });
      setPinError(null);
    }
  }, []);

  // ==========================================
  // 4. LOGIN
  // ==========================================
  const [loginFormData, setLoginFormData] = useState({ email: '', password: '' });
  const [loginError, setLoginError] = useState(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleLoginChange = useCallback((e) => {
    const { name, value } = e.target;
    setLoginFormData((prev) => ({ ...prev, [name]: value }));
    setLoginError(null);
  }, []);

  const submitLogin = useCallback(async (e) => {
    if (e) e.preventDefault();
    setLoginError(null);
    setIsLoggingIn(true);

    try {
      if (!loginFormData.email.trim()) throw new Error('Email wajib diisi');
      if (!loginFormData.password) throw new Error('Password wajib diisi');

      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginFormData.email.trim(),
        password: loginFormData.password,
      });

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          throw new Error('Email atau password yang Anda masukkan salah.');
        }
        throw new Error(error.message);
      }

      if (data.user) {
        setUser(data.user);
        markOnboardingCompleted();
        const merchantData = await fetchMerchant(data.user.id);

        if (merchantData && !merchantData.recovery_pin_hash) {
          setRegisteredUserId(data.user.id);
          router.push('/auth/setup-pin');
          return;
        }

        router.push('/dashboard');
      }
    } catch (err) {
      console.warn('Login gagal:', err.message);
      setLoginError(err.message);
      alert(err.message);
    } finally {
      setIsLoggingIn(false);
    }
  }, [loginFormData, fetchMerchant, router]);

  // ==========================================
  // 5. SESSION CHECK
  // ==========================================
  useEffect(() => {
    const checkSession = async () => {
      try {
        setLoading(true);
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        if (session?.user) {
          setUser(session.user);
          await fetchMerchant(session.user.id);
        } else {
          setUser(null);
          setMerchant(null);
        }
      } catch (err) {
        console.warn('Session check warning:', err.message);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setUser(session.user);
        await fetchMerchant(session.user.id);
      } else {
        setUser(null);
        setMerchant(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [fetchMerchant]);

  // ==========================================
  // 6. LOGOUT
  // ==========================================
  const logout = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);
      setUser(null);
      setMerchant(null);

      // Bersihkan semua local/session storage aplikasi — termasuk sisa token
      // sesi Supabase — supaya tidak ada data lama yang tertinggal.
      if (typeof window !== 'undefined') {
        localStorage.clear();
        sessionStorage.clear();
      }

      // Penanda onboarding dipasang SETELAH storage dibersihkan agar tidak
      // ikut terhapus: setelah logout user harus langsung diarahkan ke
      // halaman login, bukan dipaksa melewati Welcome Page lagi.
      markOnboardingCompleted();

      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      router.push('/auth/login');
    } catch (err) {
      console.warn('Logout warning:', err.message);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [router]);

  // ==========================================
  // 7. RETURN VALUES
  // ==========================================
  return {
    user, merchant, loading, error, logout, isAuthenticated: !!user,

    registerForm: {
      step: registerStep,
      formData: regFormData,
      logoFile: regLogoFile,
      logoPreview: regLogoPreview,
      error: regError,
      isSubmitting: isRegistering,

      // 🔥 BARU — field-level errors & flag
      fieldErrors: regFieldErrors,
      hasFieldErrors,

      handleChange: handleRegChange,
      handleFileChange: handleRegFileChange,
      handleSubmit: submitRegister,

      pinSetup: {
        userId: registeredUserId,
        pinData: pinData,
        error: pinError,
        isSubmitting: isSettingPin,
        handleChange: handlePinChange,
        handleSubmit: submitRecoveryPin,
        handleSkip: skipPinSetup,
        handleBack: backToRegisterForm,
      },
    },

    loginForm: {
      formData: loginFormData,
      error: loginError,
      isSubmitting: isLoggingIn,
      handleChange: handleLoginChange,
      handleSubmit: submitLogin,
    },
  };
}