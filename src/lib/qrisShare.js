// src/lib/qrisShare.js
//
// Helper untuk membagikan gambar QRIS toko beserta nominal tagihan & nomor transaksi ke WhatsApp/media sosial.
// QRIS dibungkus dalam gambar kartu digital (Canvas) berisi QRIS, jumlah pembelian, dan nomor transaksi (tanpa link).

import { formatRupiah } from './productUtils';

const sanitizeFileName = (value, fallback = 'qris') => {
  const cleaned = String(value || '')
    .trim()
    .replace(/[^a-zA-Z0-9-_]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return cleaned.length > 0 ? cleaned.toLowerCase() : fallback;
};

/**
 * Susun teks rincian tagihan QRIS (tanpa link URL mentah).
 */
export const buildQrisShareText = ({
  storeName,
  amount,
  customerName,
  referenceNumber,
  channel,
} = {}) => {
  const lines = [`*Pembayaran QRIS${storeName ? ` - ${storeName}` : ''}*`, ''];

  lines.push(`Total yang harus dibayar: *${formatRupiah(amount)}*`);

  if (customerName && String(customerName).trim() !== '') {
    lines.push(`Nama pelanggan: ${String(customerName).trim()}`);
  }
  if (referenceNumber) {
    lines.push(`No. Transaksi: ${referenceNumber}`);
  }
  if (channel) {
    lines.push(`Channel: ${String(channel).toLowerCase() === 'all' ? 'offline' : channel}`);
  }

  lines.push('', 'Silakan scan gambar QRIS terlampir di atas untuk menyelesaikan pembayaran.');
  lines.push('Terima kasih 🙏');
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

/**
 * Buat file gambar kartu QRIS komposit (Canvas) berisi:
 * - Header toko & "PEMBAYARAN QRIS"
 * - Kotak Jumlah Pembelian (Nominal)
 * - Nomor Transaksi & Nama Pelanggan
 * - Gambar QRIS asli yang bersih
 */
export const generateQrisPaymentCardFile = async ({
  url,
  storeName,
  amount,
  customerName,
  referenceNumber,
  fileName = 'qris-pembayaran',
} = {}) => {
  if (!url || typeof document === 'undefined') return null;

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const width = 600;
        const height = 880;
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        // Background putih bersih
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);

        // Header biru
        ctx.fillStyle = '#2563eb';
        ctx.fillRect(0, 0, width, 120);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 24px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('PEMBAYARAN QRIS', width / 2, 50);

        if (storeName) {
          ctx.font = '16px sans-serif';
          ctx.fillText(storeName, width / 2, 85);
        }

        let currentY = 145;

        // Box Jumlah Pembelian
        ctx.fillStyle = '#f8fafc';
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 1;
        ctx.fillRect(40, currentY, width - 80, 90);
        ctx.strokeRect(40, currentY, width - 80, 90);

        ctx.fillStyle = '#64748b';
        ctx.font = '13px sans-serif';
        ctx.fillText('JUMLAH PEMBELIAN', width / 2, currentY + 28);

        ctx.fillStyle = '#1e293b';
        ctx.font = 'bold 28px sans-serif';
        ctx.fillText(formatRupiah(amount), width / 2, currentY + 68);

        currentY += 105;

        // Box Detail Transaksi (No. Transaksi & Pelanggan)
        const detailHeight = customerName ? 95 : 65;
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(40, currentY, width - 80, detailHeight);
        ctx.strokeRect(40, currentY, width - 80, detailHeight);

        ctx.textAlign = 'left';
        ctx.font = '13px sans-serif';
        ctx.fillStyle = '#64748b';
        ctx.fillText('No. Transaksi:', 65, currentY + 30);
        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 14px sans-serif';
        ctx.fillText(referenceNumber || '-', 180, currentY + 30);

        if (customerName) {
          ctx.fillStyle = '#64748b';
          ctx.font = '13px sans-serif';
          ctx.fillText('Nama Pelanggan:', 65, currentY + 65);
          ctx.fillStyle = '#0f172a';
          ctx.font = 'bold 14px sans-serif';
          ctx.fillText(customerName, 180, currentY + 65);
        }

        currentY += detailHeight + 20;

        // QRIS Image Box
        const qrisBoxSize = 270;
        const qrisX = (width - qrisBoxSize) / 2;
        const qrisY = currentY;

        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 2;
        ctx.fillRect(qrisX, qrisY, qrisBoxSize, qrisBoxSize);
        ctx.strokeRect(qrisX, qrisY, qrisBoxSize, qrisBoxSize);

        const padding = 12;
        const drawSize = qrisBoxSize - padding * 2;
        ctx.drawImage(img, qrisX + padding, qrisY + padding, drawSize, drawSize);

        currentY += qrisBoxSize + 25;

        // Footer instruksi
        ctx.textAlign = 'center';
        ctx.fillStyle = '#334155';
        ctx.font = 'bold 13px sans-serif';
        ctx.fillText('Scan gambar QRIS di atas untuk menyelesaikan pembayaran', width / 2, currentY);

        ctx.fillStyle = '#94a3b8';
        ctx.font = '11px sans-serif';
        ctx.fillText('Terima kasih atas kunjungan Anda 🙏', width / 2, currentY + 22);

        canvas.toBlob((blob) => {
          if (!blob) {
            resolve(null);
            return;
          }
          const file = new File([blob], `${fileName}.png`, { type: 'image/png' });
          resolve(file);
        }, 'image/png', 0.95);
      } catch (err) {
        console.warn('Gagal membuat gambar kartu QRIS canvas:', err);
        resolve(null);
      }
    };
    img.onerror = (err) => {
      console.warn('Gagal memuat gambar QRIS untuk canvas:', err);
      resolve(null);
    };
    img.src = url;
  });
};

/** Ambil gambar QRIS mentah dari URL storage menjadi `File` (cadangan). */
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

/** Unduh gambar QRIS ke perangkat. */
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

/** Salin teks ke clipboard. */
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
 * Bagikan kartu QRIS (Gambar QRIS + Nominal + Nomor Transaksi) tanpa link.
 *
 * @returns {Promise<{status:'shared'|'fallback'|'cancelled'|'failed', downloaded?:boolean, copied?:boolean}>}
 */
export const shareQris = async ({
  url,
  storeName,
  amount,
  customerName,
  referenceNumber,
  fileName = 'qris-pembayaran',
  title,
  text,
} = {}) => {
  const canUseWebShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';

  // Buat file kartu QRIS komposit (QRIS + Nominal + No. Transaksi)
  const file = await generateQrisPaymentCardFile({
    url,
    storeName,
    amount,
    customerName,
    referenceNumber,
    fileName,
  });

  // 1. Web Share API dengan lampiran file gambar kartu QRIS (WhatsApp, IG, Telegram, dll.)
  if (canUseWebShare) {
    const shareData = { title, text };
    if (file && typeof navigator.canShare === 'function' && navigator.canShare({ files: [file] })) {
      shareData.files = [file];
    }

    try {
      await navigator.share(shareData);
      return { status: 'shared' };
    } catch (error) {
      if (error?.name === 'AbortError') return { status: 'cancelled' };
      console.warn('Web Share API gagal:', error?.message);
    }
  }

  // 2. Fallback desktop / browser tanpa share files: unduh gambar kartu QRIS + salin rincian teks.
  let downloaded = false;
  if (file && typeof document !== 'undefined') {
    try {
      const objectUrl = URL.createObjectURL(file);
      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = `${fileName}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(objectUrl);
      downloaded = true;
    } catch (err) {
      console.warn('Gagal mengunduh kartu QRIS:', err);
    }
  }

  const copied = await copyTextToClipboard(text);

  if (downloaded || copied) return { status: 'fallback', downloaded, copied };
  return { status: 'failed' };
};
