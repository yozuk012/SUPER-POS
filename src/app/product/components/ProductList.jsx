"use client";

/* eslint-disable @next/next/no-img-element -- thumbnail produk dinamis (storage URL) berukuran tetap via CSS */

import { FaBoxOpen, FaEdit, FaTrash, FaPowerOff, FaGlobe, FaExclamation } from "react-icons/fa";
import { FiCopy } from "react-icons/fi";

const formatRupiah = (number) => {
  if (number === null || number === undefined || number === "") return "Rp 0";
  return "Rp " + Number(number).toLocaleString("id-ID");
};

const getDiscountedPrice = (price, discountPct) => {
  const pct = parseFloat(discountPct) || 0;
  if (pct <= 0) return null;
  return Math.round(parseFloat(price) - (parseFloat(price) * (pct / 100)));
};

const LOW_STOCK_LIMIT = 10;

export default function ProductList({
  loading,
  products,
  searchQuery,
  filterCategory,
  filterChannel,
  filterStatus,
  openEditModal,
  toggleProductStatus,
  deleteProduct,
  onOpenCopyModal,
}) {
  const hasActiveFilters =
    searchQuery ||
    filterCategory !== "all" ||
    filterChannel !== "all" ||
    filterStatus !== "all";

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-white via-blue-50 to-blue-100 rounded-xl shadow-sm border border-blue-200 flex flex-col">
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 via-blue-500 to-blue-400" />

      {loading ? (
        <div className="p-8 text-center text-slate-500 text-sm min-h-[200px] flex flex-col items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
          Memuat data produk...
        </div>
      ) : products.length === 0 ? (
        <div className="p-10 text-center text-slate-500 min-h-[220px] flex flex-col items-center justify-center">
          <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center mb-3">
            <FaBoxOpen className="text-2xl text-blue-400" />
          </div>
          <p className="text-base font-bold text-slate-800">
            {hasActiveFilters ? "Tidak ada produk yang cocok dengan filter." : "Belum Ada Produk"}
          </p>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            {hasActiveFilters
              ? "Coba ubah kata kunci atau reset filter Anda."
              : 'Belum ada produk di cabang ini. Anda dapat menyalin data produk dari cabang lain (termasuk resep & bahan baku) atau menambahkan produk baru melalui tombol di atas.'}
          </p>
          {!hasActiveFilters && onOpenCopyModal && (
            <div className="flex flex-wrap items-center justify-center gap-3 mt-5">
              <button
                type="button"
                onClick={onOpenCopyModal}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-xl font-semibold text-sm transition-colors shadow-sm active:scale-95"
              >
                <FiCopy className="w-4 h-4" />
                <span>Salin Produk dari Cabang Lain</span>
              </button>
            </div>
          )}
        </div>
      ) : (
        <>
          {/* === MOBILE === */}
          <div className="md:hidden divide-y divide-blue-100">
            {products.map((prod) => {
              const offlineFinalPrice = getDiscountedPrice(prod.base_price, prod.discount_pct);
              const onlineFinalPrice = prod.has_online_price
                ? getDiscountedPrice(prod.online_price, prod.discount_pct)
                : null;

              return (
                <div key={prod.id} className="p-3 flex gap-3 hover:bg-blue-50 active:bg-blue-100 transition-colors">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg overflow-hidden shrink-0 flex items-center justify-center border border-blue-300">
                    {prod.image_url ? (
                      <img src={prod.image_url} alt={prod.name} className="w-full h-full object-cover" onError={(event) => { event.currentTarget.style.visibility = 'hidden'; }} />
                    ) : (
                      <FaBoxOpen className="text-blue-400 text-xl" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-800 truncate">{prod.name}</p>
                    <p className="text-[10px] text-slate-500 truncate">{prod.category_name} • {prod.unit}</p>

                    <div className="flex flex-col gap-1 mt-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-500 font-semibold w-12">Offline:</span>
                        {offlineFinalPrice ? (
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-red-600">{formatRupiah(offlineFinalPrice)}</span>
                            <span className="text-[10px] text-slate-400 line-through">{formatRupiah(prod.base_price)}</span>
                          </div>
                        ) : (
                          <span className="text-xs font-bold text-slate-900">{formatRupiah(prod.base_price)}</span>
                        )}
                      </div>

                      {prod.has_online_price && (
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-purple-600 font-semibold w-12 flex items-center gap-1">
                            <FaGlobe size={8} /> Online:
                          </span>
                          {onlineFinalPrice ? (
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-purple-700">{formatRupiah(onlineFinalPrice)}</span>
                              <span className="text-[10px] text-slate-400 line-through">{formatRupiah(prod.online_price)}</span>
                            </div>
                          ) : (
                            <span className="text-xs font-bold text-purple-700">{formatRupiah(prod.online_price)}</span>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-2 mt-3 pt-2 border-t border-blue-100">
                      <div className="flex items-center gap-1.5">
                        {prod.stock === 0 ? (
                          <span className="text-[10px] px-1.5 py-0.5 rounded font-semibold bg-red-100 text-red-700 border border-red-200">
                            Habis
                          </span>
                        ) : prod.stock <= LOW_STOCK_LIMIT ? (
                          <span className="text-[10px] px-1.5 py-0.5 rounded font-semibold bg-amber-100 text-amber-700 border border-amber-200 flex items-center gap-1">
                            <FaExclamation size={8} /> Sisa {prod.stock}
                          </span>
                        ) : (
                          <span className="text-[10px] px-1.5 py-0.5 rounded font-semibold bg-blue-100 text-blue-700 border border-blue-200">
                            Stok: {prod.stock}
                          </span>
                        )}

                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${prod.is_active !== false ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-slate-100 text-slate-600 border border-slate-200'}`}>
                          {prod.is_active !== false ? 'Aktif' : 'Nonaktif'}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 w-full">
                        <button type="button" onClick={() => openEditModal(prod)} className="min-h-11 flex items-center justify-center gap-1.5 px-2 text-blue-700 bg-blue-100 hover:bg-blue-200 rounded-lg transition-colors text-xs font-bold" aria-label="Edit produk">
                          <FaEdit size={13} />
                          <span>Edit</span>
                        </button>
                        <button type="button" onClick={() => toggleProductStatus(prod)} title={prod.is_active !== false ? 'Nonaktifkan produk' : 'Aktifkan produk'} className={`min-h-11 flex items-center justify-center gap-1.5 px-2 rounded-lg transition-colors text-xs font-bold ${prod.is_active !== false ? 'text-amber-700 bg-amber-100 hover:bg-amber-200' : 'text-green-700 bg-green-100 hover:bg-green-200'}`} aria-label="Toggle status produk">
                          <FaPowerOff size={13} />
                          <span>{prod.is_active !== false ? 'Nonaktif' : 'Aktif'}</span>
                        </button>
                        <button type="button" onClick={() => deleteProduct(prod.id)} className="min-h-11 flex items-center justify-center gap-1.5 px-2 text-red-700 bg-red-100 hover:bg-red-200 rounded-lg transition-colors text-xs font-bold" aria-label="Hapus produk">
                          <FaTrash size={13} />
                          <span>Hapus</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* === DESKTOP === */}
          <div className="hidden md:block overflow-x-auto rounded-b-xl">
            <table className="w-full text-left">
              <thead className="bg-gradient-to-r from-blue-100 to-blue-50 border-b-2 border-blue-200">
                <tr>
                  <th className="px-4 py-3 text-xs font-bold text-blue-800 uppercase">Produk</th>
                  <th className="px-4 py-3 text-xs font-bold text-blue-800 uppercase">Kategori</th>
                  <th className="px-4 py-3 text-xs font-bold text-blue-800 uppercase">Harga (Offline / Online)</th>
                  <th className="px-4 py-3 text-xs font-bold text-blue-800 uppercase text-center">Stok</th>
                  <th className="px-4 py-3 text-xs font-bold text-blue-800 uppercase text-center">Status</th>
                  <th className="px-4 py-3 text-xs font-bold text-blue-800 uppercase text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-blue-100 bg-white">
                {products.map((prod) => {
                  const offlineFinalPrice = getDiscountedPrice(prod.base_price, prod.discount_pct);
                  const onlineFinalPrice = prod.has_online_price
                    ? getDiscountedPrice(prod.online_price, prod.discount_pct)
                    : null;

                  return (
                    <tr key={prod.id} className="hover:bg-blue-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg overflow-hidden shrink-0 flex items-center justify-center border border-blue-300">
                            {prod.image_url ? (
                              <img src={prod.image_url} alt={prod.name} className="w-full h-full object-cover" onError={(event) => { event.currentTarget.style.visibility = 'hidden'; }} />
                            ) : (
                              <FaBoxOpen className="text-blue-400" />
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-900">{prod.name}</p>
                            <p className="text-xs text-slate-500">{prod.sku}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">{prod.category_name}</td>

                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1.5">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-500 font-semibold w-14">Offline:</span>
                            {offlineFinalPrice ? (
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-bold text-red-600">{formatRupiah(offlineFinalPrice)}</span>
                                <span className="text-xs text-slate-400 line-through">{formatRupiah(prod.base_price)}</span>
                              </div>
                            ) : (
                              <span className="text-sm font-bold text-slate-900">{formatRupiah(prod.base_price)}</span>
                            )}
                          </div>

                          {prod.has_online_price && (
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-purple-600 font-semibold w-14 flex items-center gap-1">
                                <FaGlobe size={10} /> Online:
                              </span>
                              {onlineFinalPrice ? (
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-bold text-purple-700">{formatRupiah(onlineFinalPrice)}</span>
                                  <span className="text-xs text-slate-400 line-through">{formatRupiah(prod.online_price)}</span>
                                </div>
                              ) : (
                                <span className="text-sm font-bold text-purple-700">{formatRupiah(prod.online_price)}</span>
                              )}
                            </div>
                          )}
                        </div>
                      </td>

                      <td className="px-4 py-3 text-center">
                        {prod.stock === 0 ? (
                          <span className="text-xs px-2 py-1 rounded font-semibold bg-red-100 text-red-700">
                            Habis
                          </span>
                        ) : prod.stock <= LOW_STOCK_LIMIT ? (
                          <span className="text-xs px-2 py-1 rounded font-semibold bg-amber-100 text-amber-700 inline-flex items-center justify-center gap-1">
                            <FaExclamation size={10} /> Sisa {prod.stock}
                          </span>
                        ) : (
                          <span className="text-xs px-2 py-1 rounded font-semibold bg-blue-100 text-blue-700">
                            {prod.stock}
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3 text-center">
                        <span className={`text-xs px-2 py-1 rounded font-semibold ${prod.is_active !== false ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
                          {prod.is_active !== false ? 'Aktif' : 'Nonaktif'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button type="button" onClick={() => openEditModal(prod)} className="min-h-11 min-w-11 p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors" aria-label="Edit produk">
                            <FaEdit size={14} />
                          </button>
                          <button type="button" onClick={() => toggleProductStatus(prod)} title={prod.is_active !== false ? 'Nonaktifkan produk' : 'Aktifkan produk'} className={`min-h-11 min-w-11 p-2 rounded-lg transition-colors ${prod.is_active !== false ? 'text-amber-600 hover:bg-amber-100' : 'text-green-600 hover:bg-green-100'}`} aria-label="Toggle status produk">
                            <FaPowerOff size={14} />
                          </button>
                          <button type="button" onClick={() => deleteProduct(prod.id)} className="min-h-11 min-w-11 p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors" aria-label="Hapus produk">
                            <FaTrash size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}