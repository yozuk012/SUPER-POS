// src/components/CopyDataModal.jsx
'use client';

import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { getActiveStoreId } from '@/lib/activeStore';
import { fetchItemsForCopy, executeCopyStoreData } from '@/lib/copyStoreData';
import { FiCopy, FiX, FiSearch, FiCheckSquare, FiSquare, FiArrowRight, FiCheck } from 'react-icons/fi';

export default function CopyDataModal({ isOpen, onClose, type, title, onCopySuccess }) {
  const { user } = useAuth();

  const [stores, setStores] = useState([]);
  const [sourceStoreId, setSourceStoreId] = useState('');
  const [targetStoreId, setTargetStoreId] = useState('');

  const [items, setItems] = useState([]);
  const [isLoadingItems, setIsLoadingItems] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [selectedIds, setSelectedIds] = useState([]);

  const [isCopying, setIsCopying] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);

  useEffect(() => {
    if (!isOpen || !user?.id) return;

    const fetchUserStores = async () => {
      setSelectedIds([]);
      setSearchQuery('');
      setCategoryFilter('all');
      setStatusMessage(null);
      try {
        const { data, error } = await supabase
          .from('stores')
          .select('id, name, is_active')
          .eq('user_id', user.id)
          .eq('is_active', true)
          .order('name');

        if (error) throw error;
        setStores(data || []);

        const activeId = getActiveStoreId();
        const initialTargetId = activeId || (data?.[0]?.id ? String(data[0].id) : '');
        setTargetStoreId(initialTargetId);

        const otherStore = (data || []).find((s) => String(s.id) !== String(initialTargetId));
        setSourceStoreId(otherStore ? String(otherStore.id) : '');
      } catch (err) {
        console.error('Gagal mengambil daftar toko:', err);
      }
    };

    fetchUserStores();
  }, [isOpen, user?.id]);

  useEffect(() => {
    let isMounted = true;
    if (isOpen && sourceStoreId) {
      Promise.resolve().then(() => {
        if (!isMounted) return;
        setIsLoadingItems(true);
        fetchItemsForCopy(type, sourceStoreId)
          .then((data) => {
            if (isMounted) {
              setItems(data || []);
              setSelectedIds([]);
              setIsLoadingItems(false);
            }
          })
          .catch((err) => {
            if (isMounted) {
              console.error('Gagal mengambil item toko sumber:', err);
              setStatusMessage({ type: 'error', text: 'Gagal memuat item dari cabang sumber.' });
              setIsLoadingItems(false);
            }
          });
      });
    } else {
      Promise.resolve().then(() => {
        if (isMounted) setItems([]);
      });
    }
    return () => {
      isMounted = false;
    };
  }, [isOpen, type, sourceStoreId]);

  const filteredItems = useMemo(() => {
    const categoryItems = type === 'products' && categoryFilter !== 'all'
      ? items.filter((item) => item.categoryName === categoryFilter)
      : items;

    if (!searchQuery.trim()) return categoryItems;
    const q = searchQuery.toLowerCase();
    return categoryItems.filter((item) =>
      item.name.toLowerCase().includes(q) || (item.subtitle && item.subtitle.toLowerCase().includes(q))
    );
  }, [items, searchQuery, type, categoryFilter]);

  const productCategories = useMemo(() => {
    if (type !== 'products') return [];
    return [...new Set(items.map((item) => item.categoryName || 'Tanpa Kategori'))].sort((a, b) =>
      a.localeCompare(b, 'id')
    );
  }, [items, type]);

  const toggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === filteredItems.length && filteredItems.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredItems.map((item) => item.id));
    }
  };

  const handleCopy = async () => {
    if (selectedIds.length === 0) {
      alert('Pilih setidaknya satu item yang ingin disalin.');
      return;
    }
    if (!sourceStoreId || !targetStoreId) {
      alert('Pilih cabang asal dan cabang tujuan terlebih dahulu.');
      return;
    }
    if (String(sourceStoreId) === String(targetStoreId)) {
      alert('Cabang asal dan cabang tujuan tidak boleh sama.');
      return;
    }

    const targetStore = stores.find((s) => String(s.id) === String(targetStoreId));
    const confirmMsg = `Salin ${selectedIds.length} ${title} terpilih ke cabang "${targetStore?.name || 'Tujuan'}"?` +
      (type === 'products' ? '\n\n💡 Resep (recipes) & komposisi bahan baku (recipe_ingredients) akan ikut disalin secara otomatis.' : '');

    if (!window.confirm(confirmMsg)) return;

    setIsCopying(true);
    setStatusMessage(null);

    try {
      const result = await executeCopyStoreData(type, sourceStoreId, targetStoreId, selectedIds);

      const detailParts = [];
      if (result.repairedCount > 0) {
        detailParts.push(`${result.repairedCount} gambar diperbarui`);
      }
      if (result.skippedCount > 0) {
        detailParts.push(`${result.skippedCount} dilewati karena sudah ada`);
      }

      setStatusMessage({
        type: 'success',
        text: `Berhasil menyalin ${result.count} ${title} ke cabang "${targetStore?.name}".` +
          (detailParts.length > 0 ? ` (${detailParts.join(', ')})` : ''),
      });

      if (onCopySuccess) {
        onCopySuccess();
      }

      setTimeout(() => {
        setIsCopying(false);
        onClose();
      }, 1200);
    } catch (err) {
      console.error('Error saat menyalin data:', err);
      setStatusMessage({
        type: 'error',
        text: 'Terjadi kesalahan saat menyalin: ' + (err.message || 'Silakan coba lagi.'),
      });
      setIsCopying(false);
    }
  };

  if (!isOpen) return null;

  const isAllSelected = filteredItems.length > 0 && selectedIds.length === filteredItems.length;
  const inputBase = "w-full px-3 py-2 bg-white border border-blue-200 rounded-lg text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-500 transition disabled:opacity-60 disabled:cursor-not-allowed";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/40 backdrop-blur-md">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden border border-blue-200 animate-in fade-in zoom-in-95 duration-150">

        {/* ═══ HEADER — gradient biru solid ═══ */}
        <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-blue-500 to-blue-400 p-4 sm:p-5">
          <div className="absolute -top-6 -right-6 w-24 h-24 bg-white/10 rounded-full pointer-events-none" />
          <div className="relative flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-white flex items-center justify-center shadow-sm">
                <FiCopy className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base sm:text-lg">
                  Salin {title} Antar Cabang
                </h3>
                <p className="text-xs text-blue-50">
                  Pilih cabang sumber dan cabang tujuan untuk menduplikasi data.
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={isCopying}
              className="p-1.5 text-white/90 hover:text-white hover:bg-white/20 rounded-lg transition-colors disabled:opacity-50"
              aria-label="Tutup modal"
            >
              <FiX className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ═══ BODY ═══ */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4 bg-gradient-to-b from-white to-blue-50/40">

          {statusMessage && (
            <div
              className={`p-3 rounded-lg text-xs sm:text-sm flex items-center gap-2 font-semibold ${
                statusMessage.type === 'success'
                  ? 'bg-green-50 text-green-700 border border-green-200'
                  : 'bg-red-50 text-red-700 border border-red-200'
              }`}
            >
              {statusMessage.type === 'success' && <FiCheck className="w-4 h-4 shrink-0" />}
              <span>{statusMessage.text}</span>
            </div>
          )}

          {stores.length < 2 ? (
            <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl text-amber-800 text-sm">
              <p className="font-bold mb-1 flex items-center gap-2">⚠️ Cabang Toko Kurang dari 2</p>
              <p className="text-xs text-amber-700 leading-relaxed">
                Anda hanya memiliki {stores.length} cabang toko. Fitur salin data membutuhkan minimal 2 cabang toko.
                Silakan tambahkan cabang toko baru di menu <strong>Pengaturan &gt; Manajemen Cabang Toko</strong> terlebih dahulu.
              </p>
            </div>
          ) : (
            <>
              {/* Pemilihan Cabang */}
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-3.5 sm:p-4 rounded-xl border border-blue-200 grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                <div>
                  <label className="block text-xs font-bold text-blue-800 mb-1">
                    Dari Cabang (Sumber):
                  </label>
                  <select
                    value={sourceStoreId}
                    onChange={(e) => setSourceStoreId(e.target.value)}
                    disabled={isCopying}
                    className={inputBase}
                  >
                    <option value="" disabled>-- Pilih Cabang Sumber --</option>
                    {stores.map((s) => (
                      <option key={s.id} value={s.id} disabled={String(s.id) === String(targetStoreId)}>
                        {s.name} {String(s.id) === String(targetStoreId) ? '(Tujuan)' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-blue-800 mb-1 flex items-center gap-1">
                    <span>Ke Cabang (Tujuan):</span>
                    <FiArrowRight className="w-3.5 h-3.5 text-blue-600 hidden sm:inline" />
                  </label>
                  <select
                    value={targetStoreId}
                    onChange={(e) => setTargetStoreId(e.target.value)}
                    disabled={isCopying}
                    className={inputBase}
                  >
                    <option value="" disabled>-- Pilih Cabang Tujuan --</option>
                    {stores.map((s) => (
                      <option key={s.id} value={s.id} disabled={String(s.id) === String(sourceStoreId)}>
                        {s.name} {String(s.id) === String(sourceStoreId) ? '(Sumber)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {type === 'products' && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-800 flex items-start gap-2">
                  <span className="text-base">💡</span>
                  <div>
                    <strong>Penyalinan Lengkap Otomatis:</strong> Saat menyalin produk, resep (<em>recipes</em>), komposisi bahan baku (<em>recipe_ingredients</em>), kategori, dan harga multi-channel akan otomatis ikut disalin ke cabang tujuan!
                  </div>
                </div>
              )}

              {/* Toolbar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-1">
                <div className="relative flex-1">
                  <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-500 w-4 h-4 pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={`Cari ${title.toLowerCase()}...`}
                    disabled={isLoadingItems || items.length === 0}
                    className={`${inputBase} pl-9`}
                  />
                </div>

                {type === 'products' && (
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    disabled={isLoadingItems || items.length === 0}
                    aria-label="Filter kategori produk"
                    className={`${inputBase} sm:w-52`}
                  >
                    <option value="all">Semua kategori</option>
                    {productCategories.map((category) => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                )}

                {items.length > 0 && (
                  <button
                    type="button"
                    onClick={handleSelectAll}
                    disabled={isLoadingItems}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-white border border-blue-200 hover:bg-blue-50 text-xs font-bold text-blue-700 transition-colors shrink-0 disabled:opacity-50"
                  >
                    {isAllSelected ? (
                      <>
                        <FiCheckSquare className="w-4 h-4" />
                        <span>Batal Pilih Semua</span>
                      </>
                    ) : (
                      <>
                        <FiSquare className="w-4 h-4" />
                        <span>Pilih Semua ({filteredItems.length})</span>
                      </>
                    )}
                  </button>
                )}
              </div>

              {/* List Item */}
              <div className="border border-blue-200 rounded-xl overflow-hidden bg-white shadow-sm">
                <div className="bg-gradient-to-r from-blue-100 to-blue-50 px-3 py-2 border-b border-blue-200 flex items-center justify-between text-xs font-bold">
                  <span className="text-blue-800">Daftar {title} ({filteredItems.length})</span>
                  <span className="text-blue-700 bg-white border border-blue-200 px-2 py-0.5 rounded-full">
                    {selectedIds.length} dipilih
                  </span>
                </div>

                <div className="max-h-60 sm:max-h-72 overflow-y-auto divide-y divide-blue-100">
                  {isLoadingItems ? (
                    <div className="p-8 text-center text-xs sm:text-sm text-slate-500">
                      <div className="animate-spin rounded-full h-6 w-6 border-4 border-blue-200 border-t-blue-600 mx-auto mb-2"></div>
                      Memuat daftar {title.toLowerCase()}...
                    </div>
                  ) : items.length === 0 ? (
                    <div className="p-8 text-center text-xs sm:text-sm text-slate-400 italic">
                      Cabang sumber ini belum memiliki data {title.toLowerCase()}.
                    </div>
                  ) : filteredItems.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-400">
                      Tidak ada {title.toLowerCase()} yang cocok dengan kata kunci &quot;{searchQuery}&quot;.
                    </div>
                  ) : (
                    filteredItems.map((item) => {
                      const isChecked = selectedIds.includes(item.id);
                      return (
                        <div
                          key={item.id}
                          onClick={() => toggleSelect(item.id)}
                          className={`p-3 flex items-center gap-3 cursor-pointer transition-colors ${
                            isChecked ? 'bg-blue-50' : 'hover:bg-blue-50/50'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {}}
                            className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-blue-300 pointer-events-none"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="text-xs sm:text-sm font-semibold text-slate-800 truncate">
                                {item.name}
                              </p>
                              {item.recipeBadge && (
                                <span
                                  className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                                    item.hasRecipe
                                      ? 'bg-green-100 text-green-700 border border-green-200'
                                      : 'bg-slate-100 text-slate-500 border border-slate-200'
                                  }`}
                                >
                                  {item.recipeBadge}
                                </span>
                              )}
                            </div>
                            {item.subtitle && (
                              <p className="text-[11px] text-slate-500 truncate mt-0.5">
                                {item.subtitle}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* ═══ FOOTER ═══ */}
        <div className="p-3 sm:p-4 border-t border-blue-200 flex items-center justify-between bg-gradient-to-r from-blue-50 to-white">
          <div className="text-xs text-slate-500 font-medium">
            {selectedIds.length > 0 ? (
              <span className="text-blue-700 font-bold">
                {selectedIds.length} {title.toLowerCase()} siap disalin
              </span>
            ) : (
              <span>Pilih {title.toLowerCase()} untuk disalin</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isCopying}
              className="px-3.5 py-2 text-xs sm:text-sm font-semibold text-slate-700 bg-white border border-blue-200 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleCopy}
              disabled={
                isCopying ||
                selectedIds.length === 0 ||
                !sourceStoreId ||
                !targetStoreId ||
                String(sourceStoreId) === String(targetStoreId)
              }
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-bold text-white transition-all ${
                isCopying || selectedIds.length === 0 || String(sourceStoreId) === String(targetStoreId)
                  ? 'bg-slate-300 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 active:scale-95 shadow-md shadow-blue-500/30'
              }`}
            >
              <FiCopy className="w-4 h-4" />
              <span>{isCopying ? 'Menyalin...' : `Salin ${selectedIds.length > 0 ? `(${selectedIds.length})` : ''}`}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}