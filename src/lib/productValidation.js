/**
 * productValidation.js
 * 
 * Berisi fungsi-fungsi validasi dan helper murni (pure functions)
 * untuk modul produk. Tidak ada dependency ke React atau Supabase,
 * sehingga mudah di-unit test dan bisa dipakai ulang di fitur lain
 * (misal: import produk via CSV, bulk update, dsb).
 */

// ==========================================
// 1. KONSTANTA: POLA NAMA PRODUK TIDAK AMAN
// ==========================================
/**
 * Daftar regex untuk mendeteksi konten berbahaya pada nama produk.
 * Meliputi: HTML tags, script injection (XSS), dan SQL injection.
 */
export const UNSAFE_PRODUCT_NAME_PATTERNS = [
  // HTML tags (misal: <script>, </div>, <img onerror=...>)
  /<\/?[a-z][^>]*>/i,
  // Protocol berbahaya untuk XSS (javascript:, vbscript:, data:)
  /(?:javascript|vbscript|data):/i,
  // Event handler inline (onerror=, onload=, onclick=, dll)
  /\bon(?:abort|error|load|click|mouseover|submit)\s*=/i,
  // Pola SQL injection dasar (SELECT, INSERT, UPDATE, DELETE, DROP, ALTER, UNION)
  /(?:select\s+.+\s+from|insert\s+into|update\s+.+\s+set|delete\s+from|drop\s+(?:table|database)|alter\s+table|union\s+select)/i,
  // Komentar SQL dan statement terminator yang mencurigakan
  /(?:--|\/\*|\*\/|;\s*(?:select|insert|update|delete|drop|alter)\b)/i,
];

// ==========================================
// 2. VALIDASI NAMA PRODUK
// ==========================================
/**
 * Memeriksa apakah nama produk mengandung pola berbahaya (XSS/SQLi).
 * @param {string} name - Nama produk yang akan divalidasi.
 * @returns {boolean} `true` jika nama TIDAK AMAN (mengandung pola berbahaya).
 */
export const isUnsafeProductName = (name) => {
  if (typeof name !== 'string') return true;
  return UNSAFE_PRODUCT_NAME_PATTERNS.some((pattern) => pattern.test(name));
};

/**
 * Memeriksa apakah nama produk kosong atau hanya berisi whitespace.
 * @param {string} name - Nama produk.
 * @returns {boolean} `true` jika nama kosong/whitespace.
 */
export const isProductNameEmpty = (name) => {
  if (typeof name !== 'string') return true;
  return name.trim().length === 0;
};

/**
 * Memvalidasi nama produk secara lengkap (tidak kosong & aman).
 * @param {string} name - Nama produk.
 * @returns {{ valid: boolean, message: string|null }}
 */
export const validateProductName = (name) => {
  if (isProductNameEmpty(name)) {
    return { valid: false, message: 'Nama produk wajib diisi.' };
  }
  if (isUnsafeProductName(name)) {
    return {
      valid: false,
      message: 'Nama produk tidak boleh berisi script, tag HTML, atau perintah SQL.',
    };
  }
  return { valid: true, message: null };
};

// ==========================================
// 3. PARSER ANGKA (FORMAT & PARSE)
// ==========================================
/**
 * Mengubah string menjadi bilangan bulat (integer).
 * Karakter non-digit akan dihilangkan terlebih dahulu.
 * @param {string|number|null|undefined} val - Nilai yang akan diparse.
 * @returns {number} Bilangan bulat (0 jika tidak valid).
 */
export const parseNumber = (val) => {
  if (val === '' || val === null || val === undefined) return 0;
  const cleaned = String(val).replace(/\D/g, '');
  return parseFloat(cleaned) || 0;
};

/**
 * Mengubah string menjadi bilangan desimal.
 * @param {string|number|null|undefined} val - Nilai yang akan diparse.
 * @returns {number} Bilangan desimal (0 jika tidak valid).
 */
export const parseDecimal = (val) => {
  if (val === '' || val === null || val === undefined) return 0;
  return Number(val) || 0;
};

// ==========================================
// 4. VALIDASI ANGKA & PERSENTASE
// ==========================================
/**
 * Memvalidasi nilai stok (harus >= 0 jika dilacak).
 * @param {number} stock - Nilai stok.
 * @param {boolean} tracked - Apakah stok dilacak?
 * @returns {{ valid: boolean, message: string|null }}
 */
export const validateStock = (stock, tracked = true) => {
  if (tracked && stock < 0) {
    return { valid: false, message: 'Stok tidak boleh minus.' };
  }
  return { valid: true, message: null };
};

/**
 * Memvalidasi persentase (harus antara 0 - 100).
 * @param {number} pct - Nilai persentase.
 * @param {string} label - Label untuk pesan error (misal: 'diskon', 'harga online').
 * @returns {{ valid: boolean, message: string|null }}
 */
export const validatePercentage = (pct, label = 'persentase') => {
  if (pct < 0 || pct > 100) {
    return {
      valid: false,
      message: `Persentase ${label} harus antara 0 dan 100.`,
    };
  }
  return { valid: true, message: null };
};

/**
 * Memvalidasi harga (harus >= 0).
 * @param {number} price - Nilai harga.
 * @param {string} label - Label untuk pesan error (misal: 'harga dasar', 'HPP').
 * @returns {{ valid: boolean, message: string|null }}
 */
export const validatePrice = (price, label = 'harga') => {
  if (price < 0) {
    return { valid: false, message: `${label} tidak boleh minus.` };
  }
  return { valid: true, message: null };
};

// ==========================================
// 5. GENERATOR SKU OTOMATIS
// ==========================================
/**
 * Menghasilkan SKU otomatis berdasarkan nama produk.
 * Format: `{PREFIX}-{SUFFIX}`, dengan:
 *   - PREFIX: 3 huruf pertama nama (uppercase, hanya A-Z0-9).
 *   - SUFFIX: 5 digit terakhir timestamp (jika buat baru) atau suffix lama (jika edit).
 * 
 * @param {string} name - Nama produk.
 * @param {string} [existingSku=''] - SKU lama (jika sedang edit produk).
 * @returns {string} SKU yang dihasilkan.
 */
export const generateSkuFromName = (name, existingSku = '') => {
  const cleanName = (name || '').trim();
  const prefix = cleanName
    .substring(0, 3)
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');
  const safePrefix = prefix.length > 0 ? prefix : 'SKU';

  // Gunakan suffix dari SKU lama jika ada, fallback ke timestamp
  const oldSuffix =
    existingSku && existingSku.includes('-')
      ? existingSku.split('-').pop()
      : Date.now().toString().slice(-5);

  return `${safePrefix}-${oldSuffix}`;
};

/**
 * Menghasilkan SKU default (fallback) untuk produk baru.
 * Format: `SKU-{4 digit timestamp}`.
 * @returns {string}
 */
export const generateDefaultSku = () => {
  return `SKU-${Date.now().toString().slice(-4)}`;
};

// ==========================================
// 6. VALIDASI FORM LENGKAP (SUBMIT)
// ==========================================
/**
 * Memvalidasi seluruh data form produk sebelum submit.
 * Mengembalikan pesan error pertama yang ditemukan, atau null jika valid.
 * 
 * @param {Object} formData - Data form produk.
 * @param {Object} [options] - Opsi tambahan.
 * @param {boolean} [options.supportsStockTracking=true] - Apakah DB mendukung kolom track_stock.
 * @returns {{ valid: boolean, message: string|null }}
 */
export const validateProductForm = (formData, { supportsStockTracking = true } = {}) => {
  // 1. Validasi toko
  if (!formData.store_id) {
    return { valid: false, message: 'Pilih toko terlebih dahulu.' };
  }

  // 2. Validasi kategori
  if (!formData.category_id) {
    return { valid: false, message: 'Pilih kategori produk.' };
  }

  // 3. Validasi nama produk
  const nameCheck = validateProductName(formData.name);
  if (!nameCheck.valid) {
    return { valid: false, message: nameCheck.message };
  }

  // 4. Parse nilai numerik
  const stockTracked = formData.track_stock !== false;
  const stockVal = stockTracked ? parseNumber(formData.stock) : 0;
  const discountPct = parseDecimal(formData.discount_pct);
  const onlineMarkupPct = parseDecimal(formData.online_markup_pct);

  // 5. Validasi stok
  const stockCheck = validateStock(stockVal, stockTracked);
  if (!stockCheck.valid) {
    return { valid: false, message: stockCheck.message };
  }

  // 6. Validasi persentase
  const markupCheck = validatePercentage(onlineMarkupPct, 'harga online');
  if (!markupCheck.valid) {
    return { valid: false, message: markupCheck.message };
  }

  const discountCheck = validatePercentage(discountPct, 'diskon produk');
  if (!discountCheck.valid) {
    return { valid: false, message: discountCheck.message };
  }

  return { valid: true, message: null };
};