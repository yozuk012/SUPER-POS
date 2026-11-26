import bcrypt from 'bcryptjs';
import { supabase, uploadFile } from '@/lib/supabase';

const MAIN_STORE_SUFFIX = ' - Cabang Utama';
export const removeMainStoreSuffix = (name) => name.trim().replace(/(?:\s*-\s*cabang\s*utama)+$/i, '').trim();

export async function registerAccount(formData, logoFile, pin) {
  const hashedPin = await bcrypt.hash(pin, 10);
  const storeBaseName = removeMainStoreSuffix(formData.storeName);

  // 1. Buat user di Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: formData.email.trim(),
    password: formData.password,
    options: {
      data: {
        full_name: formData.fullName.trim(),
        store_name: storeBaseName,
        phone: formData.phone.trim(),
      },
    },
  });
  if (authError) throw authError;
  if (!authData.user) throw new Error('Registrasi gagal: User tidak ditemukan');

  // 2. Upload logo jika ada
  let storeLogoUrl = null;
  if (logoFile) {
    const fileName = `logo-${authData.user.id}-${Date.now()}`;
    const uploadResult = await uploadFile(logoFile, 'logo-toko', fileName);
    if (!uploadResult.success) throw new Error('Gagal upload logo: ' + uploadResult.error);
    storeLogoUrl = uploadResult.url;
  }

  // 3. Insert ke merchants
  const { error: merchantError } = await supabase.from('merchants').insert({
    id: authData.user.id,
    full_name: formData.fullName,
    phone: formData.phone || null,
    store_name: storeBaseName,
    store_logo_url: storeLogoUrl || null,
    recovery_pin_hash: hashedPin,
    pin_attempts: 0,
    pin_locked_until: null,
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


}
