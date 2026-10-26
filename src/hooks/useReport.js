import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './useAuth';
import { ACTIVE_STORE_EVENT, resolveActiveStore } from '@/lib/activeStore';
import { getCurrentMonthRange } from '@/lib/dateUtils';

/**
 * Custom hook untuk mengelola data laporan penjualan
 * @param {Object} filters - Filter untuk laporan
 * @param {string} filters.channel - Channel filter: 'all', 'offline', 'online'
 * @param {Object} filters.dateRange - Rentang tanggal {start: string, end: string}
 * @returns {Object} Data laporan, expenses, products, summary, loading, error
 */
export default function useReport(filters = {}) {
  const { user } = useAuth();
  const [allReports, setAllReports] = useState([]);
  const [operationalExpenses, setOperationalExpenses] = useState([]);
  const [availableProducts, setAvailableProducts] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { channel = 'all', dateRange = { start: '', end: '' } } = filters;

  const fetchReports = useCallback(async (startDate = null, endDate = null) => {
    setLoading(true);
    setError(null);

    try {
      if (!user?.id) {
        setAllReports([]);
        setOperationalExpenses([]);
        setAvailableProducts(0);
        return;
      }

      // 1. Ambil Store Aktif
      const { data: stores, error: storeError } = await supabase
        .from('stores')
        .select('id')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('id', { ascending: true });

      if (storeError) throw storeError;
      const store = resolveActiveStore(stores);

      if (!store) {
        setAllReports([]);
        setOperationalExpenses([]);
        setAvailableProducts(0);
        return;
      }

      const { count: productCount, error: productsError } = await supabase
        .from('products')
        .select('id', { count: 'exact', head: true })
        .eq('store_id', store.id)
        .eq('is_active', true);

      if (productsError) throw productsError;
      setAvailableProducts(productCount || 0);

      // Tentukan rentang tanggal (default: bulan ini)
      const { firstDay, lastDay } = getCurrentMonthRange();
      const queryStart = startDate || firstDay;
      const queryEnd = endDate || lastDay;

      // 2. Ambil Data Penjualan & Detail Item (Difilter berdasarkan tanggal)
      let salesQuery = supabase
        .from('sales')
        .select(`
          id,
          sale_date,
          channel,
          payment_method,
          grand_total,
          notes,
          qris_status,
          sale_items (
            id,
            qty,
            unit_price,
            hpp_snapshot,
            line_total
          )
        `)
        .eq('store_id', store.id)
        .gte('sale_date', queryStart)
        .lte('sale_date', queryEnd)
        .order('sale_date', { ascending: false });

      const { data: salesData, error: salesError } = await salesQuery;
      if (salesError) throw salesError;

      // 3. Ambil Data Pengeluaran Operasional (Difilter berdasarkan tanggal)
      let expensesQuery = supabase
        .from('operational_expenses')
        .select('id, expense_date, category, description, amount')
        .eq('store_id', store.id)
        .gte('expense_date', queryStart)
        .lte('expense_date', queryEnd)
        .order('expense_date', { ascending: false });

      const { data: expenses, error: expensesError } = await expensesQuery;
      if (expensesError) throw expensesError;
      
      setOperationalExpenses(expenses || []);

      // 4. Transformasi Data Penjualan per Transaksi
      const transformedData = (salesData || []).map((sale) => {
        const customerName = sale.notes && sale.notes.trim() !== '' 
          ? sale.notes 
          : 'Pelanggan Umum';

        const paymentMethod = sale.payment_method || 'unknown';
        let statusText = paymentMethod.charAt(0).toUpperCase() + paymentMethod.slice(1);
        
        if (paymentMethod === 'qris') {
          const qrisStatusMap = { success: 'Selesai', failed: 'Gagal', pending: 'Pending' };
          statusText += ` (${qrisStatusMap[sale.qris_status] || 'Pending'})`;
        } else {
          statusText += ' (Selesai)';
        }

        const saleItems = sale.sale_items || [];
        const totalProducts = saleItems.reduce((sum, item) => sum + (parseFloat(item.qty) || 0), 0);
        const totalSales = parseFloat(sale.grand_total) || 0;
        
        // ✅ INI KUNCINYA: HPP dihitung berdasarkan snapshot saat transaksi
        const totalHpp = saleItems.reduce((sum, item) => {
          const qty = parseFloat(item.qty) || 0;
          const hpp = parseFloat(item.hpp_snapshot) || 0;
          return sum + (qty * hpp);
        }, 0);

        // Laba Kotor = Penjualan - HPP (Profit murni dari barang yang LARIS)
        const grossProfit = totalSales - totalHpp;
        const profitMargin = totalSales > 0 ? (grossProfit / totalSales) * 100 : 0;

        return {
          orderId: sale.id,
          customerName,
          dateTime: sale.sale_date,
          status: statusText,
          channel: sale.channel === 'offline' ? 'Offline' : 'Online',
          totalProducts,
          totalSales,
          totalHpp,
          grossProfit,
          profitMargin,
        };
      });

      setAllReports(transformedData);

    } catch (err) {
      console.error('Error fetching reports:', err);
      setError(err.message || 'Gagal memuat data laporan');
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Auto-fetch saat user login & listen switch store
  useEffect(() => {
    if (user?.id) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch laporan saat user login
      fetchReports();
    }
    const handleStoreChange = () => {
      // KETIKA SWITCH TOKO: LAPORAN KOSONG
      setAllReports([]);
      setOperationalExpenses([]);
      setAvailableProducts(0);
      fetchReports();
    };
    window.addEventListener(ACTIVE_STORE_EVENT, handleStoreChange);
    return () => window.removeEventListener(ACTIVE_STORE_EVENT, handleStoreChange);
  }, [user, fetchReports]);

  // ==========================================
  // FILTERING LOGIC
  // ==========================================
  const filteredReports = useMemo(() => {
    return allReports.filter((report) => {
      // Filter by channel
      const channelMatch =
        channel === 'all' ||
        report.channel.toLowerCase() === channel.toLowerCase();

      // Filter by date range
      let dateMatch = true;
      if (dateRange.start || dateRange.end) {
        const reportDate = new Date(report.dateTime);
        const startDate = dateRange.start ? new Date(dateRange.start) : null;
        const endDate = dateRange.end ? new Date(dateRange.end) : null;

        if (startDate) startDate.setHours(0, 0, 0, 0);
        if (endDate) endDate.setHours(23, 59, 59, 999);

        if (startDate && reportDate < startDate) dateMatch = false;
        if (endDate && reportDate > endDate) dateMatch = false;
      }

      return channelMatch && dateMatch;
    });
  }, [allReports, channel, dateRange]);

  // ==========================================
  // SUMMARY CALCULATION LOGIC
  // ==========================================
  const filteredSummary = useMemo(() => {
    const totalSales = filteredReports.reduce((sum, r) => sum + r.totalSales, 0);
    const totalHpp = filteredReports.reduce((sum, r) => sum + r.totalHpp, 0);
    
    // Filter expenses by date range
    const totalOps = operationalExpenses
      .filter((expense) => {
        if (!dateRange.start && !dateRange.end) return true;

        const expenseDate = new Date(`${expense.expense_date}T00:00:00`);
        const startDate = dateRange.start ? new Date(`${dateRange.start}T00:00:00`) : null;
        const endDate = dateRange.end ? new Date(`${dateRange.end}T23:59:59.999`) : null;

        return (!startDate || expenseDate >= startDate) && (!endDate || expenseDate <= endDate);
      })
      .reduce((sum, expense) => sum + (Number(expense.amount) || 0), 0);
    
    const totalProducts = filteredReports.reduce((sum, r) => sum + r.totalProducts, 0);

    return {
      totalSales,
      totalHpp,
      totalOps,
      grossProfit: totalSales - totalHpp,
      netProfit: totalSales - totalHpp - totalOps,
      totalTransactions: filteredReports.length,
      totalProducts,
    };
  }, [filteredReports, operationalExpenses, dateRange]);

  return {
    reports: filteredReports,
    operationalExpenses,
    availableProducts,
    summary: filteredSummary,
    loading,
    error,
    refetch: fetchReports,
  };
}