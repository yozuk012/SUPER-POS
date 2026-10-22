'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import PageLayout from '@/components/PageLayout';
import useHppOperasional from '@/hooks/useHppOperasional';

import ExpenseSummary from './components/ExpenseSummary';
import ExpenseForm from './components/ExpenseForm';
import ExpenseList from './components/ExpenseList';

import { FiArrowLeft } from 'react-icons/fi';

export default function PengeluaranPage() {
  const router = useRouter();

  const {
    expenses,
    isLoading,
    isSubmitting,
    error,
    totalOperationalCost,
    addExpense,
    updateExpense,
    deleteExpense,
  } = useHppOperasional();

  const [editingItem, setEditingItem] = useState(null);
  const formRef = useRef(null);

  const handleSubmitForm = async (formData) => {
    let result;

    if (editingItem) {
      result = await updateExpense(editingItem.id, formData);
    } else {
      result = await addExpense(formData);
    }

    if (result.success) {
      alert(result.message);
      setEditingItem(null);
    } else {
      alert(`Gagal menyimpan: ${result.message}`);
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    if (formRef.current) {
      formRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const handleDelete = async (id) => {
    const result = await deleteExpense(id);
    if (result.success) {
      alert(result.message);
    } else {
      alert(`Gagal menghapus: ${result.message}`);
    }
  };

  const handleCancelEdit = () => {
    setEditingItem(null);
  };

  useEffect(() => {
    if (error) {
      console.error('Error dari hook:', error);
    }
  }, [error]);

  return (
    <PageLayout title="Pengeluaran Operasional">

      {/* ═══ HERO HEADER — gradient biru solid ═══ */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-blue-600 via-blue-500 to-blue-400 p-5 mb-4 shadow-lg shadow-blue-500/30">
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full pointer-events-none" />
        <div className="absolute -bottom-16 -left-12 w-40 h-40 bg-white/5 rounded-full pointer-events-none" />

        <div className="relative flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors active:scale-95"
              aria-label="Kembali"
            >
              <FiArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-5 h-5 rounded bg-white flex items-center justify-center">
                  <svg className="w-3 h-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                  </svg>
                </div>
                <span className="text-xs font-bold text-white/90 uppercase tracking-wider">
                  SuperPOS
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-white">Pengeluaran Operasional</h1>
              <p className="text-blue-50 text-xs mt-0.5">
                Catat semua biaya tidak langsung (Listrik, Gas, Sewa, Gaji, dll).
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ KONTEN UTAMA ═══ */}
      <div className="max-w-4xl mx-auto space-y-5 pb-6">

        <ExpenseSummary
          totalOperationalCost={totalOperationalCost}
          isLoading={isLoading}
        />

        <div ref={formRef}>
          <ExpenseForm
            onSubmit={handleSubmitForm}
            isSubmitting={isSubmitting}
            editingItem={editingItem}
            onCancel={handleCancelEdit}
          />
        </div>

        <ExpenseList
          expenses={expenses}
          isLoading={isLoading}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />

      </div>
    </PageLayout>
  );
}