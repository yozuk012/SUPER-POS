// src/lib/qrisShare.js
//
// Helper untuk membagikan gambar QRIS toko beserta nominal tagihan ke WhatsApp,
// Telegram, atau media sosial lain.
//
// Strategi berlapis (dari yang paling kaya ke paling sederhana):
//   1. Web Share API + lampiran file gambar QRIS — di ponsel memunculkan sheet
//      berisi WhatsApp, Instagram, Telegram, dll. sekaligus gambar QRIS & nominal.
//   2. Web Share API teks saja (gambar dikirim sebagai link URL QRIS).
//   3. Fallback desktop: unduh gambar QRIS + salin rincian tagihan ke clipboard.
//
// Tautan WhatsApp/Telegram disiapkan terpisah (buildWhatsAppShareUrl /
// buildTelegramShareUrl) sebagai jalur yang selalu tersedia tanpa API khusus.

import { formatRupiah } from './productUtils';

const sanitizeFileName = (value, fallback = 'qris') => {
  const cleaned = String(value || '')
    .trim()
    .replace(/[^a-zA-Z0-9-_]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return cleaned.length > 0 ? cleaned.toLowerCase() : fallback;
};

/**
 * Susun teks rincian tagihan QRIS yang siap dikirim ke chat/media sosial.
 */
export const buildQrisShareText = ({
  storeName,
  amount,
  customerName,
  referenceNumber,
  qrisUrl,
  channel,
} = {}) => {
  const lines = [`*Pembayaran QRIS${storeName ? ` - ${storeName}` : ''}*`, ''];

  lines.push(`Total yang harus dibayar: *${formatRupiah(amount)}*`);

  if (customerName && String(customerName).trim() !== '') {
    lines.push(`Nama pelanggan: ${String(customerName).trim()}`);
  }
  if (referenceNumber) {
    lines.push(`No. referensi: ${referenceNumber}`);
  }
  if (channel) {
    lines.push(`Channel: ${String(channel).toLowerCase() === 'all' ? 'offline' : channel}`);
  }

  lines.push('', 'Silakan scan gambar QRIS berikut untuk menyelesaikan pembayaran:');
  lines.push(qrisUrl || '(Gambar QRIS belum diatur di aplikasi — hubungi kasir.)');

  lines.push('', 'Terima kasih 🙏');
  return lines.join('\n');
};

/** Tautan share WhatsApp berisi rincian tagihan (dibuka di tab baru). */
export const buildWhatsAppShareUrl = (text) =>
  `https://wa.me/?text=${encodeURIComponent(text || '')}`;

/** Tautan share Telegram berisi rincian tagihan (dibuka di tab baru). */
export const buildTelegramShareUrl = ({ text = '', url = '' } = {}) => {
  const params = new URLSearchParams({ text });
  if (url) params.set('url', url);
  return `https://t.me/share/url?${params.toString()}`;
};

/** Nama file QRIS untuk diunduh/dilampirkan: mis. `qris-toko-saya`. */
export const buildQrisFileName = (storeName) => `qris-${sanitizeFileName(storeName, 'toko')}`;

/** Ambil gambar QRIS dari URL storage menjadi `File` agar bisa dilampirkan. */
export const fetchQrisImageFile = async (url, fileName = 'qris') => {
  if (!url) return null;

  try {
    const response = await fetch(url);
    if (!response.ok) return null;

    const blob = await response.blob();
    const type = blob.type || 'image/png';
    const extension = (type.split('/')[1] || 'png').split('+')[0];

    return new File([blob], `${fileName}.${extension}`, { type });
  } catch (error) {
    console.warn('Gagal menyiapkan gambar QRIS untuk dibagikan:', error?.message);
    return null;
  }
};

/** Unduh gambar QRIS ke perangkat (cadangan bila browser tanpa Web Share API). */
export const downloadQrisImage = async (url, fileName = 'qris') => {
  if (!url || typeof document === 'undefined') return false;

  try {
    const response = await fetch(url);
    if (!response.ok) return false;

    const blob = await response.blob();
    const extension = ((blob.type || 'image/png').split('/')[1] || 'png').split('+')[0];
    const objectUrl = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = objectUrl;
    link.download = `${fileName}.${extension}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(objectUrl);

    return true;
  } catch (error) {
    console.warn('Gagal mengunduh gambar QRIS:', error?.message);
    return false;
  }
};

/** Salin teks ke clipboard, dengan fallback untuk browser tanpa izin clipboard. */
export const copyTextToClipboard = async (text) => {
  if (!text) return false;

  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Lanjut ke fallback di bawah.
  }

  try {
    const area = document.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly', 'readonly');
    area.style.position = 'fixed';
    area.style.opacity = '0';
    document.body.appendChild(area);
    area.select();
    const copied = document.execCommand('copy');
    document.body.removeChild(area);
    return copied;
  } catch (error) {
    console.warn('Gagal menyalin rincian tagihan:', error?.message);
    return false;
  }
};

/**
 * Bagikan QRIS + nominal tagihan.
 *
 * @returns {Promise<{status:'shared'|'fallback'|'cancelled'|'failed', downloaded?:boolean, copied?:boolean}>}
 */
export const shareQris = async ({ url, fileName = 'qris', title, text } = {}) => {
  const canUseWebShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';

  // 1. Web Share API dengan lampiran gambar QRIS (WhatsApp, IG, Telegram, dll.)
  if (canUseWebShare) {
    const file = await fetchQrisImageFile(url, fileName);

    if (file && typeof navigator.canShare === 'function' && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({ title, text, files: [file] });
        return { status: 'shared' };
      } catch (error) {
        if (error?.name === 'AbortError') return { status: 'cancelled' };
        console.warn('Share dengan lampiran gambar gagal, mencoba teks saja:', error?.message);
      }
    }

    // 2. Web Share API teks saja (gambar dikirim sebagai link QRIS).
    try {
      await navigator.share({ title, text });
      return { status: 'shared' };
    } catch (error) {
      if (error?.name === 'AbortError') return { status: 'cancelled' };
      console.warn('Web Share API tidak tersedia atau gagal:', error?.message);
    }
  }

  // 3. Fallback desktop: simpan gambar QRIS + salin rincian tagihan.
  const downloaded = await downloadQrisImage(url, fileName);
  const copied = await copyTextToClipboard(text);

  if (downloaded || copied) return { status: 'fallback', downloaded, copied };
  return { status: 'failed' };
};