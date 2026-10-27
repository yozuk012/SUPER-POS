"use client";

import { useState } from "react";
import PageLayout from "@/components/PageLayout";
import useProducts from "@/hooks/useProducts";
import useCopyAvailability from "@/hooks/useCopyAvailability";
import CopyDataModal from "@/components/CopyDataModal";

import ProductHeader from "./components/ProductHeader";
import ProductFilters from "./components/ProductFilters";
import ProductList from "./components/ProductList";
import ProductPagination from "./components/ProductPagination";
import ProductFormModal from "./components/ProductFormModal";

export default function ProductsPage() {
  const [isCopyModalOpen, setIsCopyModalOpen] = useState(false);
  const { canCopy } = useCopyAvailability();

  const {
    stores, categories, products, loading,
    formData, editingId, error, isSubmitting, isModalOpen,
    handleChange, handleFileChange, handleSubmit, deleteProduct, toggleProductStatus,
    toggleStockTracking,
    openAddModal, openEditModal, closeModal,
    searchQuery, setSearchQuery,
    filterCategory, setFilterCategory,
    filterChannel, setFilterChannel,
    filterStatus, setFilterStatus,
    currentPage, setCurrentPage,
    totalItems, itemsPerPage,
    refetch, fetchCategories
  } = useProducts();

  return (
    <PageLayout title="Manajemen Produk">
      <ProductHeader
        openAddModal={openAddModal}
        onOpenCopyModal={canCopy ? () => setIsCopyModalOpen(true) : null}
      />

      <ProductFilters
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        filterCategory={filterCategory}
        setFilterCategory={setFilterCategory}
        filterChannel={filterChannel}
        setFilterChannel={setFilterChannel}
        filterStatus={filterStatus}
        setFilterStatus={setFilterStatus}
        categories={categories}
      />

      <ProductPagination
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        totalItems={totalItems}
        itemsPerPage={itemsPerPage}
        loading={loading}
      />

      <ProductList
        loading={loading}
        products={products}
        searchQuery={searchQuery}
        filterCategory={filterCategory}
        filterChannel={filterChannel}
        filterStatus={filterStatus}
        openEditModal={openEditModal}
        toggleProductStatus={toggleProductStatus}
        toggleStockTracking={toggleStockTracking}
        deleteProduct={deleteProduct}
        onOpenCopyModal={canCopy ? () => setIsCopyModalOpen(true) : null}
      />

      <ProductFormModal
        isModalOpen={isModalOpen}
        closeModal={closeModal}
        editingId={editingId}
        handleSubmit={handleSubmit}
        error={error}
        isSubmitting={isSubmitting}
        formData={formData}
        handleChange={handleChange}
        handleFileChange={handleFileChange}
        stores={stores}
        categories={categories}
      />

      <CopyDataModal
        isOpen={isCopyModalOpen}
        onClose={() => setIsCopyModalOpen(false)}
        type="products"
        title="Produk"
        onCopySuccess={() => {
          refetch();
          if (fetchCategories) fetchCategories();
        }}
      />
    </PageLayout>
  );
}