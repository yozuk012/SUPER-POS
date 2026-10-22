'use client';

import { useState } from 'react';
import PageLayout from '@/components/PageLayout';

import useBahanBaku from '@/hooks/useBahanBaku';
import useCopyAvailability from '@/hooks/useCopyAvailability';

import BahanBakuList from './components/BahanBakuList';
import BahanBakuFormModal from './components/BahanBakuFormModal';
import CopyDataModal from '@/components/CopyDataModal';
import { FiPlus, FiSearch, FiCopy } from 'react-icons/fi';

export default function BahanBakuPage() {

  const {
    bahanBaku,
    isLoading,
    isMutating,
    error,
    addBahanBaku,
    updateBahanBaku,
    deleteBahanBaku,
    refetch
  } = useBahanBaku();

  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCopyModalOpen, setIsCopyModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const { canCopy } = useCopyAvailability();

  const filteredBahanBaku = bahanBaku.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleEdit = (item) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    const isConfirmed = window.confirm('Yakin ingin menghapus bahan baku ini? Data stok di inventory juga akan ikut terhapus.');
    if (!isConfirmed) return;

    const result = await deleteBahanBaku(id);
    if (result.success) {
      alert(result.message);
    } else {
      alert(`Gagal menghapus: ${result.message}`);
    }
  };

  const handleAddNew = () => {
    setEditingItem(null);
    setIsModalOpen(true);
  };

  const handleSubmitForm = async (payload, initialStockInput = 0) => {
    let result;

    if (editingItem) {
      result = await updateBahanBaku(editingItem.id, payload, parseFloat(initialStockInput));
    } else {
      result = await addBahanBaku(payload, parseFloat(initialStockInput));
    }

    if (result.success) {
      alert(result.message);
      setIsModalOpen(false);
      setEditingItem(null);
    } else {
      alert(`Gagal menyimpan: ${result.message}`);
    }
  };

  return (
    <PageLayout title="Bahan Baku">

      {/* ═══ HEADER HERO — gradient biru solid ═══ */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-blue-600 via-blue-500 to-blue-400 p-5 mb-4 shadow-lg shadow-blue-500/30">
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full pointer-events-none" />
        <div className="absolute -bottom-16 -left-12 w-40 h-40 bg-white/5 rounded-full pointer-events-none" />

        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-6 h-6 rounded-md bg-white flex items-center justify-center">
                <svg className="w-3.5 h-3.5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <span className="text-xs font-bold text-white/90 uppercase tracking-wider">
                SuperPOS
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white">Manajemen Bahan Baku</h1>
            <p className="text-blue-50 text-xs mt-0.5">
              Kelola stok bahan mentah, kemasan, dan harga modal Anda.
            </p>
          </div>

          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 sm:gap-3">
            {canCopy && (
              <button
                type="button"
                onClick={() => setIsCopyModalOpen(true)}
                disabled={isMutating}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white text-blue-700 hover:bg-blue-50 rounded-lg font-semibold text-sm transition-all shadow-sm active:scale-95 disabled:opacity-50"
                title="Salin bahan baku dari cabang lain"
              >
                <FiCopy className="w-4 h-4" />
                <span>Salin Bahan Baku</span>
              </button>
            )}
            <button
              type="button"
              onClick={handleAddNew}
              disabled={isMutating}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white text-blue-700 hover:bg-blue-50 rounded-lg font-bold text-sm transition-all shadow-sm disabled:opacity-50 active:scale-95"
            >
              <FiPlus className="w-4 h-4" />
              <span>Tambah Bahan Baku</span>
            </button>
          </div>
        </div>
      </div>

      {/* ═══ SEARCH BAR — card gradient tipis ═══ */}
      <div className="bg-gradient-to-br from-white via-blue-50 to-blue-100 p-3 rounded-xl shadow-sm border border-blue-200 mb-4">
        <div className="relative">
          <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-500 w-5 h-5 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama bahan baku (contoh: Tepung, Gula)..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-blue-200 rounded-lg text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-500 transition-all"
          />
        </div>
      </div>

      {/* ═══ DAFTAR BAHAN BAKU ═══ */}
      <BahanBakuList
        bahanBaku={filteredBahanBaku}
        isLoading={isLoading}
        error={error}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onOpenCopyModal={canCopy ? () => setIsCopyModalOpen(true) : null}
      />

      {/* ═══ MODAL FORM ═══ */}
      <BahanBakuFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingItem(null);
        }}
        editingItem={editingItem}
        onSubmit={handleSubmitForm}
        isSubmitting={isMutating}
      />

      {/* ═══ MODAL SALIN ═══ */}
      <CopyDataModal
        isOpen={isCopyModalOpen}
        onClose={() => setIsCopyModalOpen(false)}
        type="raw_materials"
        title="Bahan Baku"
        onCopySuccess={refetch}
      />

    </PageLayout>
  );
}