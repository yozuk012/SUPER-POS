'use client';

import { useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { loginAccount } from '@/services/auth/login';
import { markOnboardingCompleted } from '@/lib/onboarding';
import { getEmailError, getPasswordError } from '@/lib/authValidation';
import { useAuth } from './useAuth';

export function useLoginForm() {
  const router = useRouter();
  const { refreshMerchant } = useAuth();
  const [loginFormData, setLoginFormData] = useState({ email: '', password: '' });
  const [loginError, setLoginError] = useState(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const loginFieldErrors = useMemo(() => {
    const errors = {};
    const emailError = getEmailError(loginFormData.email);
    const passwordError = getPasswordError(loginFormData.password);
    if (emailError) errors.email = emailError;
    if (passwordError) errors.password = passwordError;
    return errors;
  }, [loginFormData]);

  const hasLoginFieldErrors = Object.keys(loginFieldErrors).length > 0;

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
      if (hasLoginFieldErrors) {
        throw new Error(Object.values(loginFieldErrors)[0]);
      }

      const data = await loginAccount({
        email: loginFormData.email.trim(),
        password: loginFormData.password,
      });

      if (data.user) {
        markOnboardingCompleted();
        const merchantData = await refreshMerchant();

        if (merchantData && !merchantData.recovery_pin_hash) {
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
  }, [loginFormData, loginFieldErrors, hasLoginFieldErrors, router, refreshMerchant]);

  return {
    formData: loginFormData,
    error: loginError,
    isSubmitting: isLoggingIn,
    fieldErrors: loginFieldErrors,
    hasFieldErrors: hasLoginFieldErrors,
    handleChange: handleLoginChange,
    handleSubmit: submitLogin,
  };
}
