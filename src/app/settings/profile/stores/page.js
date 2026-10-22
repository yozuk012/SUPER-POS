// src/app/settings/profile/stores/page.js
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { useStoreManagement } from '@/hooks/useAddStore';

import PageLayout from '@/components/PageLayout';
import StoreHeader from './components/StoreHeader';
import StoreList from './components/StoreList';
import StoreFormModal from './components/StoreFormModal';
import ActionDialog from './components/ActionDialog';
import { getActiveStoreId, setActiveStoreId, ACTIVE_STORE_EVENT } from '@/lib/activeStore';

export default function StoresSettingsPage() {
  const storeHook = useStoreManagement();

  const [stores, setStores] = useState([]);
  const [isFetching, setIsFetching] = useState(true);

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [editingStoreId, setEditingStoreId] = useState(null);
  const [activeStoreId, setActiveStoreIdState] = useState(null);

  const [actionDialog, setActionDialog] = useState({
    isOpen: false,
    type: null,
    store: null,
  });

  const [backupDates, setBackupDates] = useState({ from: '', to: '' });

  const fetchStores = useCallback(async () => {
    setIsFetching(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('stores')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const mappedStores = data.map((s) => ({
        ...s,
        status: s.is_active ? 'active' : 'inactive',
      }));

      setStores(mappedStores);
    } catch (err) {
      console.error('Error fetching stores:', err);
    } finally {
      setIsFetching(false);
    }
  }, []);

  useEffect(() => {
    fetchStores();
  }, [fetchStores]);

  useEffect(() => {
    setActiveStoreIdState(getActiveStoreId());
    const handleStoreChange = (event) => setActiveStoreIdState(event.detail || getActiveStoreId());
    window.addEventListener(ACTIVE_STORE_EVENT, handleStoreChange);
    return () => window.removeEventListener(ACTIVE_STORE_EVENT, handleStoreChange);
  }, []);

  useEffect(() => {
    if (storeHook.successMsg) {
      fetchStores();
      if (isFormModalOpen) {
        setTimeout(() => setIsFormModalOpen(false), 1500);
      }
    }
  }, [storeHook.successMsg, isFormModalOpen, fetchStores]);

  const openAddModal = () => {
    setModalMode('add');
    storeHook.resetForm();
    storeHook.prepareNewStore();
    setIsFormModalOpen(true);
  };

  const handleSwitchStore = (storeId) => {
    setActiveStoreId(storeId);
    setActiveStoreIdState(String(storeId));
  };

  const handleOpenEdit = (store) => {
    setModalMode('edit');
    setEditingStoreId(store.id);
    storeHook.loadStoreData(store);
    setIsFormModalOpen(true);
  };

  const closeFormModal = () => {
    setIsFormModalOpen(false);
    storeHook.resetForm();
    setEditingStoreId(null);
  };

  const handleRealSubmitForm = () => {
    if (modalMode === 'add') {
      storeHook.handleAddStore();
    } else {
      storeHook.handleUpdateStore(editingStoreId);
    }
  };

  const openActionDialog = (type, store) => {
    setActionDialog({ isOpen: true, type, store });
    if (type === 'backup') {
      const today = new Date();
      const thirtyDaysAgo = new Date(today.setDate(today.getDate() - 30));
      setBackupDates({
        from: thirtyDaysAgo.toISOString().split('T')[0],
        to: new Date().toISOString().split('T')[0],
      });
    }
  };

  const closeActionDialog = () => {
    setActionDialog({ isOpen: false, type: null, store: null });
  };

  const confirmAction = async () => {
    const { type, store } = actionDialog;
    if (!store) return;

    if (type === 'toggle') {
      await storeHook.handleToggleStatus(store.id, store.is_active);
    } else if (type === 'archive') {
      await storeHook.handleArchiveStore(store.id);
    } else if (type === 'backup') {
      await storeHook.handleRequestBackup(store.id, backupDates.from, backupDates.to);
    }

    closeActionDialog();
  };

  const totalStores = stores.length;
  const activeStores = stores.filter((s) => s.is_active).length;
  const maxLimit = 10;

  const effectiveActiveStoreId = useMemo(() => {
    const matched = stores.find((s) => String(s.id) === String(activeStoreId));
    if (matched && matched.is_active) return String(matched.id);

    const firstActive = stores.find((s) => s.is_active);
    return firstActive ? String(firstActive.id) : null;
  }, [stores, activeStoreId]);

  const orderedStores = useMemo(() => {
    if (!effectiveActiveStoreId) return stores;

    return [...stores].sort((a, b) => {
      const aWeight = String(a.id) === effectiveActiveStoreId ? 0 : 1;
      const bWeight = String(b.id) === effectiveActiveStoreId ? 0 : 1;
      return aWeight - bWeight;
    });
  }, [stores, effectiveActiveStoreId]);

  const getDialogConfig = () => {
    const { type, store } = actionDialog;
    if (!store) return {};

    if (type === 'toggle') {
      const isActive = store.is_active;
      return {
        title: isActive ? 'Nonaktifkan Toko?' : 'Aktifkan Toko?',
        description: isActive
          ? `Toko "${store.name}" akan dinonaktifkan sementara. Kasir tidak bisa menggunakan toko ini untuk transaksi, tetapi data laporan tetap aman.`
          : `Toko "${store.name}" akan diaktifkan kembali dan bisa digunakan untuk transaksi.`,
        confirmLabel: isActive ? 'Nonaktifkan' : 'Aktifkan',
        confirmColor: isActive ? 'red' : 'green',
      };
    }

    if (type === 'archive') {
      return {
        title: 'Arsipkan / Tutup Permanen?',
        description: `Toko "${store.name}" akan ditutup permanen. Toko tidak akan muncul di sistem, namun data historis dan laporan keuangan tetap tersimpan untuk audit. Tindakan ini tidak dapat dibatalkan dengan mudah.`,
        confirmLabel: 'Ya, Arsipkan Toko',
        confirmColor: 'red',
      };
    }

    if (type === 'backup') {
      return {
        title: 'Backup Data Toko (Excel)',
        description: `Unduh laporan lengkap untuk "${store.name}". Pilih rentang tanggal data yang ingin di-backup.`,
        confirmLabel: 'Proses Backup',
        confirmColor: 'blue',
      };
    }

    return {};
  };

  const dialogConfig = getDialogConfig();

  return (
    <PageLayout title="Manajemen Toko">

      {/* ═══ HERO HEADER — gradient biru solid ═══ */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-blue-600 via-blue-500 to-blue-400 p-5 mb-4 shadow-lg shadow-blue-500/30">
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full pointer-events-none" />
        <div className="absolute -bottom-16 -left-12 w-40 h-40 bg-white/5 rounded-full pointer-events-none" />

        <div className="relative">
          <div className="flex items-center gap-2 mb-1.5">
            <div className="w-6 h-6 rounded-md bg-white flex items-center justify-center">
              <svg className="w-3.5 h-3.5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M3 21h18M5 21V7l7-4 7 4v14M9 9h.01M9 13h.01M9 17h.01M15 9h.01M15 13h.01M15 17h.01" />
              </svg>
            </div>
            <span className="text-xs font-bold text-white/90 uppercase tracking-wider">
              SuperPOS
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white">Manajemen Toko</h1>
          <p className="text-blue-50 text-xs mt-0.5">
            Kelola profil, alamat, dan informasi pembayaran cabang usaha Anda.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto space-y-5">

        <StoreHeader
          totalStores={totalStores}
          activeStores={activeStores}
          maxLimit={maxLimit}
          onAddStoreClick={openAddModal}
          stores={orderedStores}
          activeStoreId={effectiveActiveStoreId}
          onSwitchStore={handleSwitchStore}
        />

        {isFetching ? (
          <div className="relative overflow-hidden bg-gradient-to-br from-white via-blue-50 to-blue-100 rounded-xl shadow-sm border border-blue-200 text-center p-12">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 via-blue-500 to-blue-400" />
            <div className="animate-spin h-10 w-10 border-4 border-blue-200 border-t-blue-600 rounded-full mx-auto"></div>
            <p className="mt-4 text-slate-500 font-semibold text-sm">Memuat data toko...</p>
          </div>
        ) : (
          <StoreList
            stores={orderedStores}
            activeStoreId={effectiveActiveStoreId}
            onSwitchStore={handleSwitchStore}
            onEdit={handleOpenEdit}
            onToggleStatus={(store) => openActionDialog('toggle', store)}
            onBackup={(store) => openActionDialog('backup', store)}
            onArchive={(store) => openActionDialog('archive', store)}
          />
        )}

        <StoreFormModal
          isOpen={isFormModalOpen}
          onClose={closeFormModal}
          onSubmit={handleRealSubmitForm}
          mode={modalMode}
          isLoading={storeHook.isLoading}
          error={storeHook.error}
          successMsg={storeHook.successMsg}
          formData={storeHook.formData}
          updateField={storeHook.updateField}
          logoFile={storeHook.logoFile}
          setLogoFile={storeHook.setLogoFile}
          qrisFile={storeHook.qrisFile}
          setQrisFile={storeHook.setQrisFile}
          ownerInfo={storeHook.ownerInfo}
        />

        <ActionDialog
          isOpen={actionDialog.isOpen}
          onClose={closeActionDialog}
          onConfirm={confirmAction}
          title={dialogConfig.title}
          description={dialogConfig.description}
          confirmLabel={dialogConfig.confirmLabel}
          confirmColor={dialogConfig.confirmColor}
          isLoading={storeHook.isLoading}
        >
          {actionDialog.type === 'backup' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Dari Tanggal</label>
                <input
                  type="date"
                  value={backupDates.from}
                  onChange={(e) => setBackupDates(prev => ({ ...prev, from: e.target.value }))}
                  className="w-full px-3 py-2 bg-white border border-blue-200 rounded-lg text-sm text-slate-700 focus:ring-2 focus:ring-blue-400 focus:border-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Sampai Tanggal</label>
                <input
                  type="date"
                  value={backupDates.to}
                  onChange={(e) => setBackupDates(prev => ({ ...prev, to: e.target.value }))}
                  className="w-full px-3 py-2 bg-white border border-blue-200 rounded-lg text-sm text-slate-700 focus:ring-2 focus:ring-blue-400 focus:border-blue-500 outline-none"
                />
              </div>
            </div>
          )}
        </ActionDialog>

      </div>
    </PageLayout>
  );
}