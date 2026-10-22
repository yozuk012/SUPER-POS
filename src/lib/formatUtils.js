/**
 * Utility functions untuk formatting tampilan data.
 * Untuk format Rupiah gunakan formatRupiah dari lib/productUtils.
 */

/**
 * Memformat tanggal menjadi format Indonesia (5 Okt 2026)
 * @param {string|Date|null} dateString - String tanggal atau objek Date
 * @returns {string} Tanggal terformat atau "-" jika kosong
 */
export const formatDate = (dateString) => {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

/**
 * Memformat tanggal menjadi format lengkap Indonesia (Senin, 5 Oktober 2026)
 * @param {string|Date|null} dateString - String tanggal atau objek Date
 * @returns {string} Tanggal terformat atau "-" jika kosong
 */
export const formatFullDate = (dateString) => {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleDateString("id-ID", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};
