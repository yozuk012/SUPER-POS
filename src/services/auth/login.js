import { supabase } from '@/lib/supabase';

export async function loginAccount(credentials) {
  const { data, error } = await supabase.auth.signInWithPassword(credentials);
  if (error) {
    if (error.message.includes('Invalid login credentials')) {
      throw new Error('Email atau password yang Anda masukkan salah.');
    }
    throw new Error(error.message);
  }
  return data;
}