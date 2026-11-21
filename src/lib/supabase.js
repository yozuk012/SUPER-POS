// src/lib/supabase.js
import { createClient } from '@supabase/supabase-js';

// 1. Ambil variabel environment
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// ✅ BARU: Ambil skema dari environment (default ke 'public' jika tidak diset)
const supabaseSchema = process.env.NEXT_PUBLIC_SUPABASE_SCHEMA || 'public';

// Validasi - pastikan variabel environment ada
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Check .env file.');
}

// 2. Buat Supabase Client dengan konfigurasi skema dinamis
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  db: {
    schema: supabaseSchema, // 🔑 INI KUNCINYA: Otomatis switch ke 'dev' atau 'public'
  },
  auth: {
    persistSession: true, // Simpan session di localStorage
    autoRefreshToken: true, // Auto refresh token
  },
});

// ==========================================
// FUNGSI UPLOAD KE SUPABASE STORAGE
// ==========================================
// ⚠️ CATATAN PENTING: 
// Storage bucket di Supabase bersifat GLOBAL (tidak terikat pada skema database).
// Jadi, fungsi ini tetap sama. File akan masuk ke bucket 'UMKM-POS' manapun 
// skema database yang sedang aktif ('dev' atau 'public').
export const uploadFile = async (file, folder, fileName) => {
  try {
    // Ambil ekstensi file (contoh: 'jpg', 'png')
    const fileExt = file.name.split('.').pop();
    // Buat path file: contoh 'logo-toko/logo-1690000000000.jpg'
    const filePath = `${folder}/${fileName}.${fileExt}`;

    // Upload file ke bucket 'UMKM-POS'
    const { data, error } = await supabase.storage
      .from('UMKM-POS')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true, // Timpa file jika nama sama
      });

    if (error) throw error;

    // Dapatkan URL publik agar bisa langsung ditampilkan di <img>
    const { data: urlData } = supabase.storage
      .from('UMKM-POS')
      .getPublicUrl(filePath);

    return { 
      success: true, 
      url: urlData.publicUrl, 
      path: data.path 
    };
  } catch (err) {
    console.error('❌ [Supabase Storage] Upload error:', err.message);
    return { success: false, error: err.message };
  }
};

// ==========================================
// FUNGSI TEST KONEKSI DATABASE
// ==========================================
// ✅ CATATAN: 
// Karena client di atas sudah di-set ke schema tertentu, 
// query ini otomatis akan mencari di dev.merchants atau public.merchants 
// tergantung nilai NEXT_PUBLIC_SUPABASE_SCHEMA.
export const testConnection = async () => {
  try {
    // Coba query sederhana ke tabel merchants
    const { data, error } = await supabase
      .from('merchants')
      .select('id')
      .limit(1);

    if (error) {
      console.error(`❌ [Supabase] Connection test failed on schema '${supabaseSchema}':`, error.message);
      return { success: false, error: error.message };
    }

    console.log(`✅ [Supabase] Connection successful! Active Schema: '${supabaseSchema}'`);
    return { success: true, data, activeSchema: supabaseSchema };
  } catch (err) {
    console.error('❌ [Supabase] Connection test error:', err.message);
    return { success: false, error: err.message };
  }
};

export default supabase;