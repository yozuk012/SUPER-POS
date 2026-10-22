// src/app/hpp/hppproduk/page.js
'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import PageLayout from '@/components/PageLayout';
import useHppProduk from '@/hooks/useHppProduk';

import HPPHeader from './components/HPPHeader';
import HPPProductList from './components/HPPProductList';
import ProductPagination from '@/app/product/components/ProductPagination';

import { FiPlus } from 'react-icons/fi';

const ITEMS_PER_PAGE = 10;

export default function HPPProdukPage() {
  const router = useRouter();

  const { products, isLoading, error, deleteProduct } = useHppProduk();

  const [selectedKategori, setSelectedKategori] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const kategoriList = useMemo(() => {
    const uniqueKategori = [...new Set(products.map(p => p.kategori).filter(Boolean))];
    return uniqueKategori.sort();
  }, [products]);

  const filteredProducts = useMemo(() => {
    if (!selectedKategori) return products;
    return products.filter(item => item.kategori === selectedKategori);
  }, [products, selectedKategori]);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / ITEMS_PER_PAGE));
  const activePage = Math.min(currentPage, totalPages);
  const startIndex = (activePage - 1) * ITEMS_PER_PAGE;

  const paginatedProducts = useMemo(
    () => filteredProducts.slice(startIndex, startIndex + ITEMS_PER_PAGE),
    [filteredProducts, startIndex]
  );

  // Ganti kategori selalu kembali ke halaman pertama.
  const handleKategoriChange = (value) => {
    setSelectedKategori(value);
    setCurrentPage(1);
  };

  const handleEdit = (item) => {
    const params = new URLSearchParams({
      productId: String(item.id),
      namaProduk: item.namaProduk,
    });

    router.push(`/hpp/hitung-hpp?${params.toString()}`);
  };

  const handleDelete = async (id) => {
    const result = await deleteProduct(id);
    if (!result.success) {
      alert(`Gagal menghapus: ${result.message}`);
    }
  };

  const formatRupiah = (angka) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(angka || 0);
  };

  return (
    <PageLayout title="HPP Produk">

      {/* ═══ HERO HEADER: gradient biru solid + brand ═══ */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-blue-600 via-blue-500 to-blue-400 p-4 sm:p-5 mb-4 shadow-lg shadow-blue-500/30">
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full pointer-events-none" />
        <div className="absolute -bottom-16 -left-12 w-40 h-40 bg-white/5 rounded-full pointer-events-none" />

        <div className="relative flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <button
              onClick={() => router.back()}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors active:scale-95 shrink-0"
              aria-label="Kembali"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-5 h-5 rounded bg-white flex items-center justify-center shrink-0">
                  <svg className="w-3 h-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
                <span className="text-[10px] sm:text-xs font-bold text-white/90 uppercase tracking-wider">
                  SuperPOS
                </span>
              </div>
              <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-white truncate">
                HPP Produk
              </h1>
              <p className="text-blue-50 text-[11px] sm:text-xs mt-0.5 truncate">
                Kelola harga pokok produksi & resep produk Anda.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ FILTER KATEGORI: card gradient tipis ═══ */}
      <div className="bg-gradient-to-br from-white via-blue-50 to-blue-100 p-3 rounded-xl shadow-sm border border-blue-200 mb-4">
        <HPPHeader
          onBack={() => router.back()}
          selectedKategori={selectedKategori}
          setSelectedKategori={handleKategoriChange}
          kategoriList={kategoriList}
          isDropdownOpen={isDropdownOpen}
          setIsDropdownOpen={setIsDropdownOpen}
        />
      </div>

      {/* ═══ KONTEN UTAMA ═══ */}
      <main className="max-w-4xl mx-auto">

        {/* Tombol Tambah + Info jumlah */}
        <div className="flex flex-col gap-3 mb-4">
          <div className="min-w-0">
            <h2 className="text-base sm:text-lg font-bold text-slate-900">Daftar Produk HPP</h2>
            <p className="text-xs sm:text-sm text-slate-500 break-words">
              {filteredProducts.length} produk
              {selectedKategori ? ` · Kategori: ${selectedKategori}` : ''}
            </p>
          </div>

          <button
            type="button"
            onClick={() => router.push('/hpp/hitung-hpp')}
            className="w-full inline-flex items-center justify-center gap-2 px-4 sm:px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-md shadow-blue-500/30 transition-all active:scale-95 text-sm sm:text-base min-h-[44px]"
            title="Hitung HPP Produk Baru"
          >
            <FiPlus className="w-5 h-5 shrink-0" />
            <span>Tambah HPP Baru</span>
          </button>
        </div>

        <div className="mb-4">
          <ProductPagination
            currentPage={activePage}
            setCurrentPage={setCurrentPage}
            totalItems={filteredProducts.length}
            itemsPerPage={ITEMS_PER_PAGE}
            loading={isLoading}
          />
        </div>

        <HPPProductList
          products={paginatedProducts}
          isLoading={isLoading}
          error={error}
          onEdit={handleEdit}
          onDelete={handleDelete}
          formatRupiah={formatRupiah}
        />
      </main>
    </PageLayout>
  );
}