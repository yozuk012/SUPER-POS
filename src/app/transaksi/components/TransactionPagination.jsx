import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';

export default function TransactionPagination({ pagination, pageSize, setPage }) {
  const { currentPage, totalPages, totalItems } = pagination;
  const firstItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const lastItem = Math.min(currentPage * pageSize, totalItems);

  return (
    <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 rounded-b-xl border-t border-blue-200 bg-white p-2 text-xs text-slate-600 sm:p-3">
      <p aria-live="polite">
        <span className="font-bold text-blue-700">{firstItem}–{lastItem}</span> dari{' '}
        <span className="font-bold text-blue-700">{totalItems}</span> produk
      </p>
      <nav aria-label="Halaman produk" className="flex items-center gap-1">
        <button
          type="button"
          aria-label="Halaman produk sebelumnya"
          onClick={() => setPage(currentPage - 1)}
          disabled={currentPage <= 1}
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-blue-200 text-blue-700 transition-colors hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <FiChevronLeft className="h-4 w-4" />
        </button>
        <span className="px-2 font-semibold">{currentPage} / {Math.max(1, totalPages)}</span>
        <button
          type="button"
          aria-label="Halaman produk berikutnya"
          onClick={() => setPage(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-blue-200 text-blue-700 transition-colors hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <FiChevronRight className="h-4 w-4" />
        </button>
      </nav>
    </div>
  );
}