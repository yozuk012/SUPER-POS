// src/app/settings/profile/stores/components/StoreList.jsx
'use client';

import StoreCard from './StoreCard';

export default function StoreList({ stores, onEdit, onToggleStatus, onBackup, onArchive, activeStoreId, onSwitchStore }) {
  if (!stores || stores.length === 0) {
    return (
      <div className="relative overflow-hidden bg-gradient-to-br from-white via-blue-50 to-blue-100 rounded-xl shadow-sm border-2 border-dashed border-blue-300 p-12 text-center">
        <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-3">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        </div>
        <h3 className="text-lg font-bold text-slate-800">Belum Ada Toko</h3>
        <p className="mt-1 text-sm text-slate-500 max-w-md mx-auto">
          Anda belum menambahkan cabang toko. Klik tombol &quot;Tambah Toko Baru&quot; di atas untuk memulai.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {stores.map((store) => (
        <StoreCard
          key={store.id}
          store={store}
          isActiveStore={String(store.id) === String(activeStoreId)}
          onSwitchStore={() => onSwitchStore && onSwitchStore(store.id)}
          onEdit={onEdit}
          onToggleStatus={onToggleStatus}
          onBackup={onBackup}
          onArchive={onArchive}
        />
      ))}
    </div>
  );
}