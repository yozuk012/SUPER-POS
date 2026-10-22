"use client";

import { FaChevronLeft, FaChevronRight } from "react-icons/fa";

export default function ProductPagination({
  currentPage,
  setCurrentPage,
  totalItems,
  itemsPerPage,
  loading,
  itemLabel = "produk",
}) {
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  // Jaga agar halaman aktif tidak melewati jumlah halaman setelah data berubah
  // (mis. setelah hapus produk atau ganti kategori).
  const safePage = Math.min(Math.max(1, currentPage), totalPages);
  const firstItem = totalItems === 0 ? 0 : (safePage - 1) * itemsPerPage + 1;
  const lastItem = Math.min(safePage * itemsPerPage, totalItems);

  const getPageNumbers = () => {
    const pages = [];
    let startPage = Math.max(1, safePage - 2);
    let endPage = Math.min(totalPages, safePage + 2);

    if (endPage - startPage < 4) {
      if (startPage === 1) endPage = Math.min(totalPages, startPage + 4);
      else startPage = Math.max(1, endPage - 4);
    }

    for (let page = startPage; page <= endPage; page += 1) {
      pages.push(page);
    }

    return pages;
  };

  return (
    <div className="flex flex-col sm:flex-row justify-between items-center gap-3 px-3 sm:px-4 py-3 border-y border-blue-200 bg-gradient-to-r from-blue-50 to-blue-100">
      <div className="text-xs sm:text-sm text-slate-600 text-center sm:text-left">
        Menampilkan <span className="font-bold text-blue-700">{firstItem}</span> -{" "}
        <span className="font-bold text-blue-700">{lastItem}</span> dari{" "}
        <span className="font-bold text-blue-700">{totalItems}</span> {itemLabel}
      </div>

      <div className="flex flex-wrap items-center justify-center gap-1">
        <button
          type="button"
          onClick={() => setCurrentPage(Math.max(1, safePage - 1))}
          disabled={safePage === 1 || loading}
          aria-label="Halaman sebelumnya"
          className="inline-flex items-center justify-center gap-1 px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm font-semibold text-blue-700 bg-white border border-blue-200 rounded-md hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-h-[44px] min-w-[44px] sm:min-h-[36px]"
        >
          <FaChevronLeft size={10} />
          <span className="hidden sm:inline">Prev</span>
        </button>

        {getPageNumbers().map((page) => (
          <button
            type="button"
            key={page}
            onClick={() => setCurrentPage(page)}
            disabled={loading}
            aria-current={safePage === page ? "page" : undefined}
            aria-label={`Halaman ${page}`}
            className={`inline-flex items-center justify-center px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm font-semibold rounded-md border transition-colors min-h-[44px] min-w-[44px] sm:min-h-[36px] ${
              safePage === page
                ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                : "bg-white text-blue-700 border-blue-200 hover:bg-blue-50"
            }`}
          >
            {page}
          </button>
        ))}

        <button
          type="button"
          onClick={() => setCurrentPage(Math.min(totalPages, safePage + 1))}
          disabled={safePage === totalPages || totalItems === 0 || loading}
          aria-label="Halaman berikutnya"
          className="inline-flex items-center justify-center gap-1 px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm font-semibold text-blue-700 bg-white border border-blue-200 rounded-md hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-h-[44px] min-w-[44px] sm:min-h-[36px]"
        >
          <span className="hidden sm:inline">Next</span>
          <FaChevronRight size={10} />
        </button>
      </div>
    </div>
  );
}
