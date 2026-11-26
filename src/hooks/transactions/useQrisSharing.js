'use client';

import { useState, useEffect } from 'react';
import {
  buildQrisFileName,
  buildQrisShareText,
  copyTextToClipboard,
  downloadQrisPaymentCard,
  generateQrisPaymentCardFile,
  isQrisFileShareSupported,
  shareQris,
} from '@/lib/qrisShare';

export function useQrisSharing({ isOpen, paymentMethod, storeQrisUrl, referenceNumber, grandTotal, customerName, storeInfo }) {
  // State fitur bagikan QRIS sebagai gambar (WhatsApp / media sosial)
  const [shareFeedback, setShareFeedback] = useState(null);
  const [isSharing, setIsSharing] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  // Pratinjau kartu QRIS (gambar yang akan dikirim ke pelanggan)
  const [preview, setPreview] = useState({ key: '', url: '', file: null });
  const [isFileShareSupported] = useState(() => isQrisFileShareSupported());
  useEffect(() => {
    function reset() {
      if (!isOpen) return;
      setShareFeedback(null);
      setIsSharing(false);
      setShareCopied(false);
      setPreview({ key: '', url: '', file: null });
    }
    reset();
  }, [isOpen]);
  // Kunci pratinjau: kartu digambar ulang setiap isi transaksi berubah.
  const previewKey = [
    storeQrisUrl,
    grandTotal,
    referenceNumber,
    customerName,
    storeInfo?.name,
  ].join('|');

  // Pratinjau gambar kartu QRIS yang nanti dibagikan ke pelanggan.
  useEffect(() => {
    if (!isOpen || paymentMethod !== 'qris' || !storeQrisUrl || !referenceNumber || !(grandTotal > 0)) {
      return undefined;
    }

    let active = true;
    let objectUrl = '';

    generateQrisPaymentCardFile({
      url: storeQrisUrl,
      storeName: storeInfo?.name,
      amount: grandTotal,
      customerName,
      referenceNumber,
      fileName: buildQrisFileName(storeInfo?.name, referenceNumber),
    }).then((file) => {
      if (!active || !file) return;
      objectUrl = URL.createObjectURL(file);
      setPreview({ key: previewKey, url: objectUrl, file });
    });

    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [isOpen, paymentMethod, previewKey, storeQrisUrl, grandTotal, customerName, referenceNumber, storeInfo?.name]);

  const previewUrl = preview.key === previewKey ? preview.url : '';
  // File kartu yang sudah siap dipakai ulang saat tombol bagikan ditekan.
  const previewCardFile = preview.key === previewKey ? preview.file : null;


  // ── Bagikan QRIS sebagai GAMBAR (QRIS + nominal + nomor transaksi) ──────
  const canShareQrisImage = Boolean(storeQrisUrl) && grandTotal > 0;

  const getQrisShareText = () =>
    buildQrisShareText({
      storeName: storeInfo?.name,
      amount: grandTotal,
      customerName,
      referenceNumber,
    });

  const getQrisCardPayload = () => ({
    url: storeQrisUrl,
    storeName: storeInfo?.name,
    amount: grandTotal,
    customerName,
    referenceNumber,
    date: new Date(),
    fileName: buildQrisFileName(storeInfo?.name, referenceNumber),
  });

  const showShareFeedback = (tone, message) => {
    setShareFeedback({ tone, message });
    setTimeout(() => setShareFeedback(null), 6000);
  };

  const handleShareQris = async () => {
    if (!canShareQrisImage || isSharing) return;

    setIsSharing(true);
    try {
      const result = await shareQris({
        ...getQrisCardPayload(),
        cardFile: previewCardFile,
        title: `Pembayaran QRIS ${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(grandTotal)}`,
        text: getQrisShareText(),
      });

      if (result.status === 'shared') {
        showShareFeedback('success', 'Gambar QRIS (nominal + nomor transaksi) berhasil dibagikan.');
      } else if (result.status === 'fallback') {
        const langkah = [];
        if (result.downloaded) langkah.push('gambar QRIS diunduh');
        if (result.copied) langkah.push('caption tagihan disalin');

        showShareFeedback(
          'info',
          langkah.length > 0
            ? `Perangkat ini belum punya menu bagikan gambar langsung — ${langkah.join(' dan ')}. Tinggal lampirkan gambarnya di WhatsApp/media sosial.`
            : 'Gunakan tombol Unduh Gambar, lalu lampirkan gambarnya di WhatsApp/media sosial.'
        );
      } else if (result.status === 'failed') {
        showShareFeedback('error', 'Gagal membagikan gambar QRIS. Coba tombol Unduh Gambar.');
      }
    } finally {
      setIsSharing(false);
    }
  };

  const handleDownloadQrisCard = async () => {
    if (!canShareQrisImage) return;

    const downloaded = await downloadQrisPaymentCard(getQrisCardPayload());

    showShareFeedback(
      downloaded ? 'success' : 'error',
      downloaded
        ? 'Gambar QRIS berhasil diunduh. Lampirkan gambar tersebut di WhatsApp/media sosial.'
        : 'Gagal mengunduh gambar QRIS. Periksa koneksi lalu coba lagi.'
    );
  };

  const handleCopyQrisDetails = async () => {
    const copied = await copyTextToClipboard(getQrisShareText());
    setShareCopied(copied);
    if (!copied) showShareFeedback('error', 'Gagal menyalin rincian tagihan.');
    setTimeout(() => setShareCopied(false), 2000);
  };


  return { shareFeedback, isSharing, shareCopied, previewUrl, isFileShareSupported,
    canShareQrisImage, handleShareQris, handleDownloadQrisCard, handleCopyQrisDetails };
}
