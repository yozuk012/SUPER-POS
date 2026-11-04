"use client";

/* eslint-disable @next/next/no-img-element -- gambar QRIS dari Supabase Storage */

import { useState, useEffect } from 'react';
import {
  FiAlertCircle,
  FiBriefcase,
  FiCheck,
  FiCheckCircle,
  FiClipboard,
  FiCreditCard,
  FiDollarSign,
  FiDownload,
  FiImage,
  FiInfo,
  FiLoader,
  FiShare2,
  FiSmartphone,
  FiX
} from 'react-icons/fi';
import { parseNumberUI } from '@/lib/productUtils';
import {
  buildQrisFileName,
  buildQrisReferenceNumber,
  buildQrisShareText,
  copyTextToClipboard,
  downloadQrisPaymentCard,
  generateQrisPaymentCardFile,
  isQrisFileShareSupported,
  shareQris,
} from '@/lib/qrisShare';

export default function TransactionPaymentModal({
  isOpen,
  onClose,
  grandTotal,
  customerName,
  channel,
  storeQrisUrl,
  storeInfo,
  onConfirmPayment
}) {
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [cashReceived, setCashReceived] = useState(0);
  const [referenceNumber, setReferenceNumber] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [qrisConfirmed, setQrisConfirmed] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  // State fitur bagikan QRIS sebagai gambar (WhatsApp / media sosial)
  const [shareFeedback, setShareFeedback] = useState(null);
  const [isSharing, setIsSharing] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  // Pratinjau kartu QRIS (gambar yang akan dikirim ke pelanggan)
  const [preview, setPreview] = useState({ key: '', url: '', file: null });
  const [isFileShareSupported] = useState(() => isQrisFileShareSupported());

  useEffect(() => {
    if (isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- disengaja: reset state form setiap modal dibuka
      setPaymentMethod('cash');
      setCashReceived(0);
      // Nomor transaksi dibuat sejak awal supaya sudah tercetak di gambar
      // QRIS yang dibagikan ke pelanggan (tidak lagi tampil "-").
      setReferenceNumber(buildQrisReferenceNumber());
      setIsProcessing(false);
      setQrisConfirmed(false);
      setImageError(false);
      setCopySuccess(false);
      setShareFeedback(null);
      setIsSharing(false);
      setShareCopied(false);
      setPreview({ key: '', url: '', file: null });
    }
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

  const formatRupiah = (number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency', currency: 'IDR', minimumFractionDigits: 0
    }).format(number);
  };

  const change = cashReceived - grandTotal;

  const isMethodValid = () => {
    if (paymentMethod === 'cash') return cashReceived >= grandTotal;
    if (paymentMethod === 'qris') return qrisConfirmed;
    if (paymentMethod === 'transfer') return true;
    return false;
  };

  const canSubmit = isMethodValid() && !isProcessing;

  const handleQuickCash = (amount) => {
    if (amount === 'pas') setCashReceived(grandTotal);
    else setCashReceived(prev => prev + amount);
  };

  const copyToClipboard = (text) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

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
        title: `Pembayaran QRIS ${formatRupiah(grandTotal)}`,
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

  const shareFeedbackClass =
    shareFeedback?.tone === 'success'
      ? 'border-green-200 bg-green-50 text-green-700'
      : shareFeedback?.tone === 'error'
        ? 'border-red-200 bg-red-50 text-red-700'
        : 'border-blue-200 bg-blue-50 text-blue-700';

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setIsProcessing(true);

    let finalReference = '';
    if (paymentMethod === 'qris') finalReference = referenceNumber;
    if (paymentMethod === 'transfer') finalReference = `TRF-${Date.now().toString().slice(-6)}`;

    const paymentData = {
      payment_method: paymentMethod,
      amount_paid: paymentMethod === 'cash' ? cashReceived : grandTotal,
      reference_number: finalReference,
      qris_status: paymentMethod === 'qris' ? 'success' : null,
      qris_paid_at: paymentMethod === 'qris' ? new Date().toISOString() : null,
    };

    await onConfirmPayment(paymentData);
    setIsProcessing(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-md p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh] border border-blue-200">

        {/* Header Modal — gradient biru */}
        <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-blue-500 to-blue-400 p-4 flex justify-between items-center">
          <div className="absolute -top-6 -right-6 w-24 h-24 bg-white/10 rounded-full pointer-events-none" />
          <div className="relative flex items-center gap-2 text-white">
            <FiCreditCard aria-hidden="true" className="w-5 h-5" />
            <h2 className="text-lg font-bold">Pembayaran</h2>
          </div>
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="relative text-white/90 hover:text-white hover:bg-white/20 p-1.5 rounded-lg transition-colors"
          >
            <FiX aria-hidden="true" className="h-5 w-5" />
          </button>
        </div>

        {/* Body Modal */}
        <div className="p-5 overflow-y-auto flex-1 space-y-5 bg-gradient-to-b from-white to-blue-50/40">

          {/* Info Total */}
          <div className="bg-gradient-to-br from-blue-600 via-blue-500 to-blue-400 p-4 rounded-xl shadow-md shadow-blue-500/30 relative overflow-hidden">
            <div className="absolute -top-6 -right-6 w-24 h-24 bg-white/10 rounded-full pointer-events-none" />
            <div className="relative">
              <p className="text-xs text-blue-100 font-bold uppercase tracking-wide">Total Tagihan</p>
              <p className="text-2xl font-extrabold text-white mt-1">{formatRupiah(grandTotal)}</p>
              <div className="pt-3 mt-3 border-t border-white/20 flex flex-col gap-1 text-xs text-blue-50">
                <p>Pelanggan: <span className="font-bold text-white">{customerName || 'Umum / Walk-in'}</span></p>
                <p>Channel: <span className="font-bold text-white capitalize">{channel === 'all' ? 'Offline' : channel}</span></p>
              </div>
            </div>
          </div>

          {/* Pilihan Metode */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-3">Metode Pembayaran</label>
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => setPaymentMethod('cash')}
                className={`py-3 px-2 rounded-xl text-sm font-bold border-2 transition-all flex flex-col items-center gap-1 ${
                  paymentMethod === 'cash'
                    ? 'bg-green-100 border-green-500 text-green-700 shadow-sm'
                    : 'bg-white border-blue-200 text-slate-600 hover:border-blue-400'
                }`}
              >
                <FiDollarSign aria-hidden="true" className="text-xl" />
                <span>Tunai</span>
              </button>
              <button
                onClick={() => setPaymentMethod('qris')}
                className={`py-3 px-2 rounded-xl text-sm font-bold border-2 transition-all flex flex-col items-center gap-1 ${
                  paymentMethod === 'qris'
                    ? 'bg-purple-100 border-purple-500 text-purple-700 shadow-sm'
                    : 'bg-white border-blue-200 text-slate-600 hover:border-blue-400'
                }`}
              >
                <FiSmartphone aria-hidden="true" className="text-xl" />
                <span>QRIS</span>
              </button>
              <button
                onClick={() => setPaymentMethod('transfer')}
                className={`py-3 px-2 rounded-xl text-sm font-bold border-2 transition-all flex flex-col items-center gap-1 ${
                  paymentMethod === 'transfer'
                    ? 'bg-blue-100 border-blue-500 text-blue-700 shadow-sm'
                    : 'bg-white border-blue-200 text-slate-600 hover:border-blue-400'
                }`}
              >
                <FiBriefcase aria-hidden="true" className="text-xl" />
                <span>Transfer</span>
              </button>
            </div>
          </div>

          {/* TUNAI */}
          {paymentMethod === 'cash' && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-200">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Uang Diterima</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-bold">Rp</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={cashReceived > 0 ? cashReceived.toLocaleString('id-ID') : ''}
                    onChange={(e) => setCashReceived(parseNumberUI(e.target.value))}
                    placeholder="0 atau 50.000"
                    aria-label="Nominal uang diterima"
                    className="block w-full pl-10 pr-3 py-3 bg-white border border-blue-200 rounded-xl focus:ring-2 focus:ring-green-400 focus:border-green-500 text-lg font-bold text-slate-800 outline-none transition-all"
                    autoFocus
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={() => handleQuickCash(20000)} className="min-h-11 rounded-lg bg-blue-100 px-3 py-2 text-sm font-bold text-blue-700 transition-colors hover:bg-blue-200">+20.000</button>
                <button type="button" onClick={() => handleQuickCash(50000)} className="min-h-11 rounded-lg bg-blue-100 px-3 py-2 text-sm font-bold text-blue-700 transition-colors hover:bg-blue-200">+50.000</button>
                <button type="button" onClick={() => handleQuickCash(100000)} className="min-h-11 rounded-lg bg-blue-100 px-3 py-2 text-sm font-bold text-blue-700 transition-colors hover:bg-blue-200">+100.000</button>
                <button type="button" onClick={() => handleQuickCash('pas')} className="min-h-11 rounded-lg bg-green-100 px-3 py-2 text-sm font-bold text-green-700 transition-colors hover:bg-green-200">Uang Pas</button>
              </div>

              <div className={`p-4 rounded-xl border-2 flex justify-between items-center transition-colors ${
                change >= 0 ? 'bg-green-50 border-green-300' : 'bg-red-50 border-red-300'
              }`}>
                <span className="text-sm font-bold text-slate-700">Kembalian</span>
                <span className={`text-xl font-extrabold ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatRupiah(Math.abs(change))}
                </span>
              </div>
              {change < 0 && (
                <p className="text-xs text-red-600 font-bold flex items-center gap-1">
                  <FiAlertCircle aria-hidden="true" className="w-4 h-4" />
                  Uang yang diterima kurang!
                </p>
              )}
            </div>
          )}

          {/* QRIS */}
          {paymentMethod === 'qris' && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-200">
              <div className="rounded-xl border-2 border-purple-200 bg-purple-50 p-4 text-center">
                <h3 className="mb-3 flex items-center justify-center gap-2 text-sm font-bold text-purple-800">
                  <FiSmartphone aria-hidden="true" className="h-4 w-4" />
                  Scan QRIS untuk Pembayaran
                </h3>

                {storeQrisUrl && !imageError ? (
                  <div className="inline-block rounded-xl border border-purple-200 bg-white p-3 shadow-sm">
                    <img
                      src={storeQrisUrl}
                      alt="QRIS Code"
                      className="h-44 w-44 object-contain"
                      onError={() => setImageError(true)}
                    />
                  </div>
                ) : (
                  <div className="mx-auto flex h-44 w-44 flex-col items-center justify-center rounded-xl border-2 border-dashed border-blue-300 bg-blue-50 p-4">
                    <FiImage aria-hidden="true" className="mb-2 h-10 w-10 text-blue-400" />
                    <p className="text-center text-xs font-medium text-slate-500">
                      {imageError
                        ? 'Gagal memuat QRIS. Periksa URL di Database.'
                        : 'QRIS belum diatur. Hubungi admin.'}
                    </p>
                  </div>
                )}

                <div className="mt-3 grid grid-cols-2 gap-2 rounded-lg border border-purple-200 bg-white p-3 text-left">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
                      Jumlah Pembelian
                    </p>
                    <p className="text-base font-extrabold text-slate-900">{formatRupiah(grandTotal)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
                      No. Transaksi
                    </p>
                    <p className="break-all font-mono text-xs font-bold text-purple-700">
                      {referenceNumber || '-'}
                    </p>
                  </div>
                </div>

                <p className="mt-3 text-xs font-semibold text-purple-600">
                  Pastikan nominal di aplikasi e-wallet pelanggan sesuai.
                </p>
              </div>

              {/* Bagikan QRIS sebagai GAMBAR (bukan link) */}
              <div className="space-y-3 rounded-xl border-2 border-dashed border-purple-300 bg-white p-3">
                <div className="flex items-start justify-between gap-2">
                  <p className="flex items-center gap-1.5 text-xs font-bold text-purple-800">
                    <FiShare2 aria-hidden="true" className="h-4 w-4" />
                    Bagikan Gambar QRIS
                  </p>
                  <span className="whitespace-nowrap rounded-md bg-purple-100 px-2 py-0.5 text-[11px] font-bold text-purple-700">
                    {formatRupiah(grandTotal)}
                  </span>
                </div>

                <p className="text-[11px] leading-snug text-slate-500">
                  Pelanggan menerima <span className="font-bold text-slate-700">gambar QRIS</span> berisi
                  jumlah pembelian <span className="font-bold text-slate-700">{formatRupiah(grandTotal)}</span> dan
                  nomor transaksi <span className="font-bold text-slate-700">{referenceNumber || '-'}</span> —
                  bukan berupa link.
                </p>

                {previewUrl ? (
                  <div className="rounded-lg border border-purple-200 bg-slate-50 p-2">
                    <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wide text-slate-500">
                      Pratinjau gambar yang dikirim
                    </p>
                    <img
                      src={previewUrl}
                      alt="Pratinjau kartu pembayaran QRIS"
                      className="mx-auto max-h-64 w-auto rounded-md border border-slate-200 object-contain"
                    />
                  </div>
                ) : canShareQrisImage ? (
                  <div className="flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-6 text-[11px] font-semibold text-slate-500">
                    <FiLoader aria-hidden="true" className="h-4 w-4 animate-spin" />
                    Menyiapkan pratinjau gambar...
                  </div>
                ) : (
                  <p className="rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-2 text-[11px] font-medium leading-snug text-amber-700">
                    {storeQrisUrl
                      ? 'Jumlah pembelian masih Rp 0. Tambahkan produk ke keranjang sebelum membagikan QRIS.'
                      : 'Gambar QRIS toko belum diatur. Lengkapi di Pengaturan Toko terlebih dahulu.'}
                  </p>
                )}

                <button
                  type="button"
                  onClick={handleShareQris}
                  disabled={!canShareQrisImage || isSharing}
                  className="flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-purple-600 px-3 py-2.5 text-sm font-bold text-white shadow-md shadow-purple-500/30 transition-all hover:bg-purple-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSharing ? (
                    <FiLoader aria-hidden="true" className="h-4 w-4 animate-spin" />
                  ) : (
                    <FiShare2 aria-hidden="true" className="h-4 w-4" />
                  )}
                  {isSharing ? 'Menyiapkan gambar...' : 'Bagikan Gambar QRIS'}
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={handleDownloadQrisCard}
                    disabled={!canShareQrisImage || isSharing}
                    className="flex min-h-11 items-center justify-center gap-2 rounded-lg border border-purple-200 bg-white px-2 py-2.5 text-[11px] font-bold text-purple-700 transition-colors hover:bg-purple-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <FiDownload aria-hidden="true" className="h-4 w-4" />
                    Unduh Gambar
                  </button>

                  <button
                    type="button"
                    onClick={handleCopyQrisDetails}
                    className="flex min-h-11 items-center justify-center gap-2 rounded-lg border border-purple-200 bg-white px-2 py-2.5 text-[11px] font-bold text-purple-700 transition-colors hover:bg-purple-50"
                  >
                    {shareCopied ? (
                      <FiCheck aria-hidden="true" className="h-4 w-4 text-green-600" />
                    ) : (
                      <FiClipboard aria-hidden="true" className="h-4 w-4" />
                    )}
                    {shareCopied ? 'Rincian Tersalin' : 'Salin Rincian'}
                  </button>
                </div>

                {shareFeedback && (
                  <p className={`rounded-lg border px-2.5 py-2 text-[11px] font-medium leading-snug ${shareFeedbackClass}`}>
                    {shareFeedback.message}
                  </p>
                )}

                <p className="text-[10px] leading-snug text-slate-400">
                  {isFileShareSupported
                    ? 'Tombol bagikan mengirim file gambar langsung ke WhatsApp, Telegram, dan media sosial lain.'
                    : 'Perangkat ini belum bisa membagikan file gambar langsung — gunakan Unduh Gambar lalu lampirkan di WhatsApp/media sosial.'}
                </p>
              </div>

              <div className="space-y-2">
                <button
                  onClick={() => {
                    setQrisConfirmed(true);
                    // Nomor transaksi sudah dibuat saat modal dibuka; pastikan
                    // tetap ada agar gambar QRIS & data transaksi konsisten.
                    if (!referenceNumber) setReferenceNumber(buildQrisReferenceNumber());
                  }}
                  className={`w-full py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                    qrisConfirmed
                      ? 'bg-green-100 text-green-700 border-2 border-green-500 cursor-default'
                      : 'bg-purple-600 text-white hover:bg-purple-700 shadow-md shadow-purple-500/30'
                  }`}
                  disabled={qrisConfirmed}
                >
                  {qrisConfirmed ? (
                    <>
                      <FiCheckCircle aria-hidden="true" className="w-5 h-5" />
                      Pembayaran Diverifikasi
                    </>
                  ) : (
                    <>
                      <FiCheck aria-hidden="true" className="w-5 h-5" />
                      Konfirmasi Pembayaran Diterima
                    </>
                  )}
                </button>
                {qrisConfirmed && (
                  <p className="text-xs text-slate-500 text-center bg-blue-50 py-2 rounded-lg border border-blue-200">
                    Ref ID: <span className="font-mono font-bold text-blue-700">{referenceNumber}</span>
                  </p>
                )}
              </div>
            </div>
          )}

          {/* TRANSFER */}
          {paymentMethod === 'transfer' && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-200">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-4">
                <h4 className="text-sm font-bold text-blue-800 mb-3 flex items-center gap-2">
                  <FiCreditCard aria-hidden="true" className="w-4 h-4" />
                  Informasi Rekening {storeInfo?.name || 'Toko'}
                </h4>

                <div className="space-y-3 text-sm bg-white p-4 rounded-lg border border-blue-200 shadow-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 font-semibold">Bank</span>
                    <span className="font-bold text-slate-800">
                      {storeInfo?.bank_name || <span className="text-red-500 italic">Belum Diatur</span>}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 font-semibold">No. Rekening</span>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-800 font-mono">
                        {storeInfo?.account_number || <span className="text-red-500 italic">Belum Diatur</span>}
                      </span>
                      {storeInfo?.account_number && (
                        <button
                          onClick={() => copyToClipboard(storeInfo.account_number)}
                          className="p-1.5 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-md transition-colors"
                          title="Salin Nomor Rekening"
                        >
                          {copySuccess ? (
                            <FiCheck aria-hidden="true" className="w-4 h-4 text-green-600" />
                          ) : (
                            <FiClipboard aria-hidden="true" className="w-4 h-4" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 font-semibold">Atas Nama</span>
                    <span className="font-bold text-slate-800 text-right">
                      {storeInfo?.account_name || <span className="text-red-500 italic">Belum Diatur</span>}
                    </span>
                  </div>
                </div>

                {!storeInfo?.bank_name && (
                  <p className="text-[10px] text-amber-600 mt-2 flex items-center gap-1 bg-amber-50 p-2 rounded border border-amber-200 font-semibold">
                    <FiAlertCircle aria-hidden="true" className="w-3 h-3" />
                    Silakan atur data rekening di menu Pengaturan Toko.
                  </p>
                )}

                <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
                  <FiInfo aria-hidden="true" className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-800 leading-relaxed">
                    <span className="font-bold">Penting:</span> Pastikan kasir telah menerima notifikasi dana masuk atau memeriksa mutasi rekening sebelum mengklik tombol di bawah.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-blue-200 bg-gradient-to-r from-blue-50 to-white">
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl shadow-md shadow-blue-500/30 transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
          >
            {isProcessing ? (
              <>
                <FiLoader aria-hidden="true" className="animate-spin h-5 w-5 text-white" />
                Memproses Transaksi...
              </>
            ) : (
              <>
                <FiCheckCircle aria-hidden="true" className="w-5 h-5" />
                Proses & Selesaikan
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}