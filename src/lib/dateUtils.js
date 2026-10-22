/**
 * Utility functions untuk operasi tanggal.
 */

/**
 * Mengubah objek Date menjadi format YYYY-MM-DD untuk input type="date"
 * @param {Date} date - Objek Date yang akan diformat
 * @returns {string} Format YYYY-MM-DD
 */
export const getDateInputValue = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Mendapatkan rentang tanggal default: awal bulan ini sampai hari ini
 * @returns {{start: string, end: string}} Format YYYY-MM-DD
 */
export const getDefaultDateRange = () => {
  const today = new Date();
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  return {
    start: getDateInputValue(startOfMonth),
    end: getDateInputValue(today),
  };
};

/**
 * Mendapatkan rentang tanggal bulan ini (hari pertama sampai hari terakhir)
 * @returns {{firstDay: string, lastDay: string}} Format YYYY-MM-DD
 */
export const getCurrentMonthRange = () => {
  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).toLocaleDateString('sv-SE');
  const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0).toLocaleDateString('sv-SE');
  return { firstDay, lastDay };
};
