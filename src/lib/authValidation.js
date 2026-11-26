const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const PHONE_REGEX = /^[0-9+\-\s()]{8,16}$/;
const SAFE_TEXT_REGEX = /^[^<>]*$/;
const CONTROL_CHAR_REGEX = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/;
const MAX_NAME_LENGTH = 100;
const MAX_EMAIL_LENGTH = 254;
const MAX_PASSWORD_LENGTH = 256;

export const getSafeTextError = (value, label) => {
  const trimmedValue = value.trim();
  if (!trimmedValue) return null;
  if (trimmedValue.length > MAX_NAME_LENGTH) {
    return `${label} maksimal ${MAX_NAME_LENGTH} karakter`;
  }
  if (!SAFE_TEXT_REGEX.test(trimmedValue) || CONTROL_CHAR_REGEX.test(trimmedValue)) {
    return `${label} mengandung karakter yang tidak diizinkan`;
  }
  return null;
};

export const getEmailError = (value) => {
  const email = value.trim();
  if (!email) return 'Email wajib diisi';
  if (email.length > MAX_EMAIL_LENGTH) return `Email maksimal ${MAX_EMAIL_LENGTH} karakter`;
  if (!EMAIL_REGEX.test(email) || CONTROL_CHAR_REGEX.test(email)) {
    return 'Format email tidak valid (contoh: nama@domain.com)';
  }
  return null;
};

export const getPasswordError = (value) => {
  if (!value) return 'Password wajib diisi';
  if (value.length > MAX_PASSWORD_LENGTH) {
    return `Password maksimal ${MAX_PASSWORD_LENGTH} karakter`;
  }
  if (CONTROL_CHAR_REGEX.test(value)) return 'Password mengandung karakter yang tidak diizinkan';
  return null;
};

