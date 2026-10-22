// src/app/settings/profile/stores/components/StoreHeader.jsx
'use client';

export default function StoreHeader({ totalStores, activeStores, maxLimit, onAddStoreClick, stores, activeStoreId, onSwitchStore }) {
  const remainingSlots = maxLimit - totalStores;
  const isLimitReached = remainingSlots <= 0;

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-white via-blue-50 to-blue-100 rounded-xl shadow-sm border border-blue-200 p-5 mb-4">
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 via-blue-500 to-blue-400" />

      <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-4 pt-1">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Daftar Cabang Toko</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Kelola profil, alamat, dan pembayaran setiap cabang usaha.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <span className="sr-only">Toko aktif</span>
            <select
              value={activeStoreId || stores.find((store) => store.is_active)?.id || ''}
              onChange={(event) => onSwitchStore(event.target.value)}
              className="max-w-44 rounded-lg border border-blue-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              disabled={!stores.length}
            >
              {stores.map((store) => (
                <option key={store.id} value={store.id} disabled={!store.is_active}>
                  {store.name}{store.is_active ? '' : ' (Nonaktif)'}
                </option>
              ))}
            </select>
          </label>

          <div className="hidden sm:flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-blue-200">
            <div className={`w-2 h-2 rounded-full ${activeStores > 0 ? 'bg-green-500' : 'bg-slate-400'}`}></div>
            <span className="text-sm font-semibold text-slate-700">
              {activeStores} Aktif
            </span>
            <span className="text-blue-200">|</span>
            <span className="text-sm font-medium text-slate-500">
              {totalStores}/{maxLimit} Toko
            </span>
          </div>

          <button
            onClick={onAddStoreClick}
            disabled={isLimitReached}
            className={`
              inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold text-white transition-all
              ${isLimitReached
                ? 'bg-slate-300 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/30 active:scale-95'}
            `}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            {isLimitReached ? 'Limit Tercapai' : 'Tambah Toko Baru'}
          </button>
        </div>
      </div>

      {remainingSlots <= 2 && remainingSlots > 0 && (
        <div className="relative mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-amber-600 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <p className="text-sm text-amber-800 font-medium">
            Perhatian: Anda hanya memiliki <strong>{remainingSlots} sisa slot</strong> untuk menambah toko baru.
          </p>
        </div>
      )}
    </div>
  );
}