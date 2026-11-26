'use client';

import { useState } from 'react';

export function useForgotPassword() {
  const [step, setStep] = useState('pin');
  const [pin, setPin] = useState('');
  const [resetEmail, setResetEmail] = useState('');
  const [resetFullName, setResetFullName] = useState('');
  const [resetPin, setResetPin] = useState('');
  const [confirmResetPin, setConfirmResetPin] = useState('');
  const [supportCode, setSupportCode] = useState('');
  const [showPinReset, setShowPinReset] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Password strength indicator
  const getPasswordStrength = (password) => {
    if (!password) return { score: 0, label: '', color: 'gray' };
    let score = 0;
    if (password.length >= 6) score += 1;
    if (password.length >= 8) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[a-z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;

    let label, color;
    if (score <= 2) { label = 'Lemah'; color = 'red'; }
    else if (score <= 4) { label = 'Sedang'; color = 'yellow'; }
    else { label = 'Kuat'; color = 'green'; }

    return { score, label, color };
  };

  const passwordStrength = getPasswordStrength(newPassword);
  const supportResetEnabled = process.env.NEXT_PUBLIC_ENABLE_PIN_SUPPORT_RESET === 'true';

  const handlePinChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setPin(value);
    setError(null);
  };

  const handleResetPinChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setResetPin(value);
    setError(null);
  };

  const handleResetEmailChange = (e) => {
    setResetEmail(e.target.value);
    setError(null);
  };

  const handleResetFullNameChange = (e) => {
    setResetFullName(e.target.value);
    setError(null);
  };

  const handleConfirmResetPinChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setConfirmResetPin(value);
    setError(null);
  };

  const handleSupportCodeChange = (e) => {
    setSupportCode(e.target.value);
    setError(null);
  };

  const validateNewPin = () => {
    if (resetPin.length !== 6) throw new Error('PIN baru harus 6 digit angka');
    if (resetPin !== confirmResetPin) throw new Error('Konfirmasi PIN tidak cocok');

    const simplePins = ['123456', '654321', '111111', '000000', '121212', '696969'];
    if (simplePins.includes(resetPin)) {
      throw new Error('PIN terlalu mudah ditebak. Gunakan kombinasi angka yang lebih aman.');
    }
  };

  const handleSelfResetPin = async (e) => {
    if (e) e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      validateNewPin();

      if (!resetEmail.trim()) throw new Error('Email wajib diisi');
      if (!resetFullName.trim()) throw new Error('Nama lengkap wajib diisi');
      const response = await fetch('/api/reset-recovery-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'self', email: resetEmail.trim(), fullName: resetFullName.trim(), pin: resetPin, confirmPin: confirmResetPin }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Reset PIN mandiri gagal');

      setResetPin('');
      setConfirmResetPin('');
      setResetFullName('');
      setShowPinReset(false);
      alert('✅ PIN pemulihan berhasil diubah. Simpan PIN baru Anda di tempat aman.');
    } catch (err) {
      console.warn('Self reset PIN warning:', err.message);
      setError(err.message || 'Terjadi kesalahan saat mereset PIN');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSupportResetPin = async (e) => {
    if (e) e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (!supportResetEnabled) throw new Error('Reset PIN oleh developer/CS sedang dinonaktifkan.');
      if (!supportCode.trim()) throw new Error('Kode reset developer/CS wajib diisi');
      validateNewPin();

      const response = await fetch('/api/reset-recovery-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mode: 'support', code: supportCode.trim(), email: resetEmail.trim(), fullName: resetFullName.trim(), pin: resetPin, confirmPin: confirmResetPin }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Reset PIN oleh developer/CS gagal');

      setResetPin('');
      setConfirmResetPin('');
      setSupportCode('');
      setShowPinReset(false);
      alert('✅ PIN pemulihan berhasil direset oleh developer/CS.');
    } catch (err) {
      console.warn('Support reset PIN warning:', err.message);
      setError(err.message || 'Terjadi kesalahan saat mereset PIN');
    } finally {
      setIsLoading(false);
    }
  };

  // ==========================================
  // VERIFY PIN - DENGAN ALERT USER-FRIENDLY
  // ==========================================
  const handleVerifyPin = async (e) => {
    if (e) e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (pin.length !== 6) {
        throw new Error('PIN harus 6 digit angka');
      }
      if (!resetEmail.trim()) throw new Error('Email akun wajib diisi');

      const response = await fetch('/api/reset-password-with-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'verify', email: resetEmail.trim(), pin }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Verifikasi PIN gagal');

      setStep('newPassword');
      alert('PIN berhasil diverifikasi!\n\nSilakan buat password baru Anda.');

    } catch (err) {
      // Gunakan console.warn (bukan console.error) agar tidak muncul merah di console
      console.warn('Verify PIN warning:', err.message);
      setError(err.message || 'Terjadi kesalahan saat memverifikasi PIN');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    if (name === 'newPassword') setNewPassword(value);
    else if (name === 'confirmPassword') setConfirmPassword(value);
    setError(null);
  };

  const handleUpdatePassword = async (e) => {
    if (e) e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (!newPassword) throw new Error('Password baru wajib diisi');
      if (newPassword.length < 6) throw new Error('Password minimal 6 karakter');
      if (newPassword !== confirmPassword) throw new Error('Konfirmasi password tidak cocok');

      const simplePasswords = ['password', '123456', 'qwerty', 'admin123'];
      if (simplePasswords.includes(newPassword.toLowerCase())) {
        throw new Error('Password terlalu mudah ditebak. Gunakan kombinasi yang lebih kuat.');
      }

      const response = await fetch('/api/reset-password-with-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'update',
          email: resetEmail.trim(),
          pin,
          password: newPassword,
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Gagal update password');

      setStep('success');

    } catch (err) {
      console.warn('Update password warning:', err.message);
      // Tampilkan alert untuk error update password
      alert('❌ ' + (err.message || 'Terjadi kesalahan saat mengubah password'));
      setError(err.message || 'Terjadi kesalahan saat mengubah password');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setStep('pin');
    setPin('');
    setNewPassword('');
    setConfirmPassword('');
    setError(null);
    setResetEmail('');
    setResetFullName('');
    setResetPin('');
    setConfirmResetPin('');
    setSupportCode('');
    setShowPinReset(false);
  };

  const goBackToPin = () => {
    setStep('pin');
    setNewPassword('');
    setConfirmPassword('');
    setError(null);
  };

  return {
    step,
    pin,
    newPassword,
    confirmPassword,
    error,
    isLoading,
    passwordStrength,
    resetEmail,
    resetFullName,
    resetPin,
    confirmResetPin,
    supportCode,
    showPinReset,
    supportResetEnabled,
    setShowPinReset,
    handlePinChange,
    handleResetEmailChange,
    handleResetFullNameChange,
    handleResetPinChange,
    handleConfirmResetPinChange,
    handleSupportCodeChange,
    handleVerifyPin,
    handleSelfResetPin,
    handleSupportResetPin,
    handlePasswordChange,
    handleUpdatePassword,
    resetForm,
    goBackToPin,
  };
}

export default useForgotPassword;