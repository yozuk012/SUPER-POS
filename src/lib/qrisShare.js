// src/lib/qrisShare.js
//
// Helper untuk membagikan pembayaran QRIS sebagai GAMBAR (bukan link).
// QRIS dirangkai menjadi kartu digital (Canvas) berisi:
//   - Judul "PEMBAYARAN QRIS", nama toko, dan tanggal transaksi
//   - Jumlah pembelian (nominal tagihan) yang besar & mudah dibaca
//   - Nomor transaksi, nama pelanggan, dan metode pembayaran
//   - Gambar QRIS asli (utuh, tidak dipotong) + instruksi scan
// Kartu inilah yang dibagikan lewat Web Share API (WhatsApp, Telegram,
// Instagram, dll.) atau diunduh untuk dilampirkan manual.

import { formatRupiah } from './productUtils';

// ── Konstanta desain kartu (px CSS, digambar dengan skala 2x agar tajam) ──
const CARD_WIDTH = 720;
const CARD_SCALE = 2;
const CARD_PADDING = 48;
const CARD_RADIUS = 20;
const FONT_STACK = '"Segoe UI", "Helvetica Neue", Arial, sans-serif';
const MONO_STACK = 'Consolas, "Courier New", monospace';

const COLOR = {
  blue: '#2563eb',
  blueLight: '#3b82f6',
  ink: '#0f172a',
  body: '#334155',
  muted: '#64748b',
  faint: '#94a3b8',
  line: '#e2e8f0',
  softLine: '#eef2f7',
  cardBg: '#f8fafc',
  white: '#ffffff',
};

const sanitizeFileName = (value, fallback = 'qris') => {
  const cleaned = String(value || '')
    .trim()
    .replace(/[^a-zA-Z0-9-_]+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-+|-+$/g, '');
  return cleaned.length > 0 ? cleaned.toLowerCase() : fallback;
};

/** Format tanggal kartu: "04 Nov 2026, 14.05". */
export const formatQrisDate = (value = new Date()) => {
  if (!value) return '';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  return date.toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Nomor transaksi QRIS yang dibuat lebih awal (sebelum pelanggan membayar)
 * supaya nomor tersebut sudah bisa dicetak di gambar QRIS yang dibagikan.
 * Contoh: `QRIS-261104-140825`.
 */
export const buildQrisReferenceNumber = (date = new Date()) => {
  const time = date instanceof Date ? date : new Date(date);
  const source = Number.isNaN(time.getTime()) ? new Date() : time;
  const pad = (value) => String(value).padStart(2, '0');

  const day = `${pad(source.getFullYear() % 100)}${pad(source.getMonth() + 1)}${pad(source.getDate())}`;
  const clock = `${pad(source.getHours())}${pad(source.getMinutes())}${pad(source.getSeconds())}`;

  return `QRIS-${day}-${clock}`;
};

/**
 * Susun teks (caption) rincian tagihan QRIS — tanpa link/URL.
 */
export const buildQrisShareText = ({
  storeName,
  amount,
  customerName,
  referenceNumber,
  date = new Date(),
} = {}) => {
  const lines = [`*PEMBAYARAN QRIS${storeName ? ` - ${storeName}` : ''}*`, ''];

  lines.push(`Jumlah pembelian: *${formatRupiah(amount)}*`);

  if (referenceNumber) lines.push(`No. Transaksi: ${referenceNumber}`);

  const trimmedCustomer = String(customerName || '').trim();
  if (trimmedCustomer) lines.push(`Nama pelanggan: ${trimmedCustomer}`);

  const when = formatQrisDate(date);
  if (when) lines.push(`Waktu: ${when}`);

  lines.push('', 'Gambar QRIS saya lampirkan pada chat ini.');
  lines.push('Silakan scan gambar QRIS tersebut untuk menyelesaikan pembayaran.');
  lines.push('Terima kasih 🙏');

  return lines.join('\n');
};

/** Nama file kartu QRIS: mis. `qris-abercio-frozen-food-qris-261104-140825`. */
export const buildQrisFileName = (storeName, referenceNumber) => {
  const parts = ['qris', sanitizeFileName(storeName, 'toko')];
  if (referenceNumber) parts.push(sanitizeFileName(referenceNumber, 'trx'));
  return parts.join('-');
};

// ── Helper gambar (Canvas) ───────────────────────────────────────────────

const loadImage = (url) =>
  new Promise((resolve) => {
    if (!url || typeof window === 'undefined') {
      resolve(null);
      return;
    }

    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => resolve(image);
    image.onerror = () => resolve(null);
    image.src = url;
  });

const drawRoundedRect = (ctx, x, y, width, height, radius, { fill, stroke, lineWidth = 1 } = {}) => {
  const r = Math.min(radius, width / 2, height / 2);

  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + width - r, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + r);
  ctx.lineTo(x + width, y + height - r);
  ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  ctx.lineTo(x + r, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();

  if (fill) {
    ctx.fillStyle = fill;
    ctx.fill();
  }
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = lineWidth;
    ctx.stroke();
  }
};

/** Potong teks dengan elipsis agar tidak melewati lebar kotak. */
const truncateText = (ctx, text, maxWidth) => {
  const value = String(text ?? '');
  if (!value) return '';
  if (ctx.measureText(value).width <= maxWidth) return value;

  const ellipsis = '…';
  let trimmed = value;
  while (trimmed.length > 0 && ctx.measureText(`${trimmed}${ellipsis}`).width > maxWidth) {
    trimmed = trimmed.slice(0, -1);
  }

  return trimmed ? `${trimmed.trimEnd()}${ellipsis}` : '';
};

/** Kecilkan ukuran font bertahap sampai teks muat dalam lebar tertentu. */
const fitFontSize = (ctx, text, { maxWidth, startSize, minSize = 18, font = FONT_STACK, weight = 'bold' }) => {
  let size = startSize;

  while (size > minSize) {
    ctx.font = `${weight} ${size}px ${font}`;
    if (ctx.measureText(String(text ?? '')).width <= maxWidth) break;
    size -= 1;
  }

  ctx.font = `${weight} ${size}px ${font}`;
  return size;
};

/** Gambar QRIS utuh di dalam kotak (tidak dipotong / tidak gepeng). */
const drawImageContain = (ctx, image, x, y, width, height) => {
  const imageWidth = image.width || image.naturalWidth || 0;
  const imageHeight = image.height || image.naturalHeight || 0;
  if (!imageWidth || !imageHeight) return;

  const ratio = Math.min(width / imageWidth, height / imageHeight);
  const drawWidth = imageWidth * ratio;
  const drawHeight = imageHeight * ratio;

  ctx.drawImage(image, x + (width - drawWidth) / 2, y + (height - drawHeight) / 2, drawWidth, drawHeight);
};

/**
 * Buat file gambar kartu pembayaran QRIS (PNG) berisi QRIS + jumlah pembelian
 * + nomor transaksi. Tinggi kartu dihitung otomatis dari isinya sehingga tidak
 * ada ruang kosong berlebih.
 *
 * @returns {Promise<File|null>} File gambar siap dibagikan, atau `null` bila gagal.
 */
export const generateQrisPaymentCardFile = async ({
  url,
  storeName,
  amount,
  customerName,
  referenceNumber,
  date = new Date(),
  fileName = 'qris-pembayaran',
} = {}) => {
  if (!url || typeof document === 'undefined') return null;

  const image = await loadImage(url);
  if (!image) {
    console.warn('Gagal memuat gambar QRIS untuk kartu pembayaran.');
    return null;
  }

  const when = formatQrisDate(date);
  const trimmedCustomer = String(customerName || '').trim();

  const rows = [{ label: 'No. Transaksi', value: referenceNumber || '-', mono: true }];
  if (trimmedCustomer) rows.push({ label: 'Nama Pelanggan', value: trimmedCustomer });
  if (when) rows.push({ label: 'Tanggal', value: when });
  rows.push({ label: 'Metode Pembayaran', value: 'QRIS' });

  // ── Hitung tinggi kartu sesuai isi ─────────────────────────────────────
  const headerHeight = 136;
  const gapAfterHeader = 26;
  const amountHeight = 112;
  const gapBetweenCards = 14;
  const detailPaddingY = 16;
  const detailRowHeight = 44;
  const detailHeight = detailPaddingY * 2 + rows.length * detailRowHeight;
  const gapBeforeQr = 28;
  const qrBoxSize = 400;
  const gapAfterQr = 26;
  const footerHeight = 92;
  const bottomAccentHeight = 12;
  const cardWidth = CARD_WIDTH;
  const cardHeight =
    headerHeight +
    gapAfterHeader +
    amountHeight +
    gapBetweenCards +
    detailHeight +
    gapBeforeQr +
    qrBoxSize +
    gapAfterQr +
    footerHeight +
    bottomAccentHeight;

  try {
    const canvas = document.createElement('canvas');
    canvas.width = cardWidth * CARD_SCALE;
    canvas.height = cardHeight * CARD_SCALE;

    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.scale(CARD_SCALE, CARD_SCALE);
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';

    const contentWidth = cardWidth - CARD_PADDING * 2;

    // ── Latar kartu ─────────────────────────────────────────────────────
    ctx.fillStyle = COLOR.white;
    ctx.fillRect(0, 0, cardWidth, cardHeight);

    // ── Header biru + aksen lingkaran ───────────────────────────────────
    const headerGradient = ctx.createLinearGradient(0, 0, cardWidth, headerHeight);
    headerGradient.addColorStop(0, COLOR.blue);
    headerGradient.addColorStop(1, COLOR.blueLight);

    ctx.fillStyle = headerGradient;
    ctx.fillRect(0, 0, cardWidth, headerHeight);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.beginPath();
    ctx.arc(cardWidth - 46, 16, 104, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.beginPath();
    ctx.arc(24, headerHeight - 10, 78, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = COLOR.white;
    ctx.font = `bold 27px ${FONT_STACK}`;
    ctx.fillText('PEMBAYARAN QRIS', cardWidth / 2, 52);

    ctx.font = `600 19px ${FONT_STACK}`;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    ctx.fillText(truncateText(ctx, storeName || 'Pembayaran QRIS', contentWidth), cardWidth / 2, 88);

    if (when) {
      ctx.font = `13px ${FONT_STACK}`;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.fillText(when, cardWidth / 2, 114);
    }

    let currentY = headerHeight + gapAfterHeader;

    // ── Kotak jumlah pembelian ──────────────────────────────────────────
    drawRoundedRect(ctx, CARD_PADDING, currentY, contentWidth, amountHeight, 18, {
      fill: COLOR.cardBg,
      stroke: COLOR.line,
      lineWidth: 1.5,
    });

    ctx.fillStyle = COLOR.muted;
    ctx.font = `bold 13px ${FONT_STACK}`;
    ctx.fillText('JUMLAH PEMBELIAN', cardWidth / 2, currentY + 36);

    ctx.fillStyle = COLOR.ink;
    ctx.textAlign = 'center';
    fitFontSize(ctx, formatRupiah(amount), {
      maxWidth: contentWidth - 56,
      startSize: 40,
      minSize: 22,
    });
    ctx.fillText(formatRupiah(amount), cardWidth / 2, currentY + 78);

    currentY += amountHeight + gapBetweenCards;

    // ── Kotak detail transaksi ──────────────────────────────────────────
    drawRoundedRect(ctx, CARD_PADDING, currentY, contentWidth, detailHeight, 18, {
      fill: COLOR.white,
      stroke: COLOR.line,
      lineWidth: 1.5,
    });

    rows.forEach((row, index) => {
      const rowCenterY = currentY + detailPaddingY + index * detailRowHeight + detailRowHeight / 2;

      if (index > 0) {
        ctx.strokeStyle = COLOR.softLine;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(CARD_PADDING + 24, rowCenterY - detailRowHeight / 2);
        ctx.lineTo(CARD_PADDING + contentWidth - 24, rowCenterY - detailRowHeight / 2);
        ctx.stroke();
      }

      ctx.textAlign = 'left';
      ctx.fillStyle = COLOR.muted;
      ctx.font = `13px ${FONT_STACK}`;
      ctx.fillText(row.label, CARD_PADDING + 24, rowCenterY);

      const labelWidth = ctx.measureText(row.label).width;
      const valueMaxWidth = contentWidth - 48 - labelWidth - 24;

      ctx.textAlign = 'right';
      ctx.fillStyle = COLOR.ink;
      ctx.font = row.mono ? `bold 15px ${MONO_STACK}` : `bold 15px ${FONT_STACK}`;
      ctx.fillText(truncateText(ctx, row.value, valueMaxWidth), CARD_PADDING + contentWidth - 24, rowCenterY);
    });

    currentY += detailHeight + gapBeforeQr;

    // ── Kotak QRIS (QR utuh + ruang putih untuk scan) ───────────────────
    drawRoundedRect(ctx, CARD_PADDING, currentY, contentWidth, qrBoxSize, CARD_RADIUS, {
      fill: COLOR.white,
      stroke: COLOR.line,
      lineWidth: 2,
    });

    const qrImageBox = qrBoxSize - 56;
    const qrImageX = CARD_PADDING + (contentWidth - qrImageBox) / 2;
    drawImageContain(ctx, image, qrImageX, currentY + 28, qrImageBox, qrImageBox);

    currentY += qrBoxSize + gapAfterQr;

    // ── Footer instruksi ────────────────────────────────────────────────
    ctx.textAlign = 'center';
    ctx.fillStyle = COLOR.body;
    ctx.font = `bold 15px ${FONT_STACK}`;
    ctx.fillText('Scan gambar QRIS di atas untuk menyelesaikan pembayaran', cardWidth / 2, currentY + 32);

    ctx.fillStyle = COLOR.faint;
    ctx.font = `13px ${FONT_STACK}`;
    ctx.fillText('Terima kasih atas kunjungan Anda', cardWidth / 2, currentY + 58);

    // ── Aksen bawah ─────────────────────────────────────────────────────
    const accentGradient = ctx.createLinearGradient(0, 0, cardWidth, 0);
    accentGradient.addColorStop(0, COLOR.blue);
    accentGradient.addColorStop(1, COLOR.blueLight);
    ctx.fillStyle = accentGradient;
    ctx.fillRect(0, cardHeight - bottomAccentHeight, cardWidth, bottomAccentHeight);

    // ── Ekspor ke PNG ───────────────────────────────────────────────────
    const blob = await new Promise((resolve) => {
      canvas.toBlob((result) => resolve(result), 'image/png');
    });

    if (!blob) return null;

    return new File([blob], `${fileName}.png`, { type: 'image/png' });
  } catch (error) {
    console.warn('Gagal membuat gambar kartu QRIS:', error?.message);
    return null;
  }
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

/** Cek apakah browser bisa membagikan file gambar (WhatsApp, Telegram, dll.). */
export const isQrisFileShareSupported = () => {
  if (
    typeof navigator === 'undefined' ||
    typeof navigator.share !== 'function' ||
    typeof navigator.canShare !== 'function' ||
    typeof File === 'undefined'
  ) {
    return false;
  }

  try {
    const probe = new File([new Blob([''], { type: 'image/png' })], 'probe.png', { type: 'image/png' });
    return navigator.canShare({ files: [probe] });
  } catch {
    return false;
  }
};

const triggerFileDownload = (file, fileName) => {
  try {
    const objectUrl = URL.createObjectURL(file);
    const link = document.createElement('a');
    link.href = objectUrl;
    link.download = `${fileName}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(objectUrl);
    return true;
  } catch (error) {
    console.warn('Gagal mengunduh gambar kartu QRIS:', error?.message);
    return false;
  }
};

/** Unduh gambar QRIS mentah (cadangan bila kartu gagal dibuat). */
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

/**
 * Buat lalu unduh kartu QRIS (gambar QRIS + jumlah pembelian + nomor transaksi).
 * Dipakai saat perangkat tidak punya menu bagikan gambar.
 */
export const downloadQrisPaymentCard = async (options = {}) => {
  if (typeof document === 'undefined') return false;

  const { fileName = 'qris-pembayaran' } = options;
  const file = await generateQrisPaymentCardFile({ ...options, fileName });
  if (!file) return false;

  return triggerFileDownload(file, fileName);
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
 * Bagikan kartu QRIS sebagai GAMBAR (QRIS + jumlah pembelian + nomor transaksi).
 * Tidak pernah membagikan link/URL toko.
 *
 * @returns {Promise<{status:'shared'|'fallback'|'cancelled'|'failed', downloaded?:boolean, copied?:boolean}>}
 */
export const shareQris = async ({
  url,
  storeName,
  amount,
  customerName,
  referenceNumber,
  date = new Date(),
  fileName = 'qris-pembayaran',
  title,
  text,
  cardFile: presetCardFile = null,
} = {}) => {
  // Pakai kartu yang sudah dibuat (mis. dari pratinjau) supaya menu bagikan
  // perangkat bisa dibuka secepat mungkin.
  const cardFile =
    presetCardFile ||
    (await generateQrisPaymentCardFile({
      url,
      storeName,
      amount,
      customerName,
      referenceNumber,
      date,
      fileName,
    }));

  // Cadangan: bila kartu gagal dibuat (mis. gambar QRIS gagal dimuat),
  // tetap bagikan gambar QRIS mentah supaya tidak berubah menjadi link.
  const file = cardFile || (await fetchQrisImageFile(url, fileName));
  const shareText =
    text ||
    buildQrisShareText({ storeName, amount, customerName, referenceNumber, date });

  // 1. Web Share API dengan lampiran file gambar (WhatsApp, IG, Telegram, dll.)
  //    Hanya dipakai bila file gambar benar-benar bisa dilampirkan, supaya
  //    pelanggan tidak pernah menerima teks/link saja.
  const canShareFile =
    Boolean(file) &&
    typeof navigator !== 'undefined' &&
    typeof navigator.canShare === 'function' &&
    navigator.canShare({ files: [file] });

  if (canShareFile && typeof navigator.share === 'function') {
    try {
      await navigator.share({
        title: title || `Pembayaran QRIS ${formatRupiah(amount)}`,
        text: shareText,
        files: [file],
      });
      return { status: 'shared', usedCard: Boolean(cardFile) };
    } catch (error) {
      if (error?.name === 'AbortError') return { status: 'cancelled' };
      console.warn('Web Share API gagal:', error?.message);
    }
  }

  // 2. Fallback desktop / browser tanpa share file:
  //    unduh gambar kartu QRIS + salin caption (tanpa link).
  let downloaded = false;
  if (file && typeof document !== 'undefined') {
    downloaded = triggerFileDownload(file, fileName);
  }

  const copied = await copyTextToClipboard(shareText);

  if (downloaded || copied) {
    return { status: 'fallback', downloaded, copied, usedCard: Boolean(cardFile) };
  }

  return { status: 'failed' };
};

