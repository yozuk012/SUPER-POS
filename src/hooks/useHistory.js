// src/hooks/useHistory.js
import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { ACTIVE_STORE_EVENT, resolveActiveStore } from '@/lib/activeStore';
import { useAuth } from './useAuth';

export default function useHistory() {
  const { user } = useAuth();
  const [rawData, setRawData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // State Filter
  const [filterChannel, setFilterChannel] = useState("all"); // all, online, offline
  const [activePeriodIndex, setActivePeriodIndex] = useState(0);
  const [isVoiding, setIsVoiding] = useState(false);

  const fetchHistory = useCallback(async () => {
    if (!user?.id) {
      setRawData([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 1. Ambil Toko Aktif
      const { data: stores, error: storeError } = await supabase
        .from('stores')
        .select('id, name, address, logo_url, bank_name, account_number, account_name, is_active')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('id', { ascending: true });

      if (storeError) throw storeError;
      const activeStore = resolveActiveStore(stores);

      if (!activeStore) {
        setRawData([]);
        setLoading(false);
        return;
      }

      // 2. Ambil transaksi toko aktif saja (limit 1000 untuk performa)
      const { data, error: fetchError } = await supabase
        .from('sales')
        .select(`
          id,
          sale_date,
          channel,
          payment_method,
          subtotal,
          discount,
          grand_total,
          notes,
          qris_status,
          qris_paid_at,
          is_voided,
          voided_at,
          voided_by,
          void_reason,
          sale_items (
            qty,
            unit_price,
            line_total,
            products ( name )
          )
        `)
        .eq('store_id', activeStore.id)
        .order('sale_date', { ascending: false })
        .limit(1000);

      if (fetchError) throw fetchError;

      // Transformasi data dasar
      const transformed = (data || []).map((sale) => {
        const saleDate = new Date(sale.sale_date);
        const customerName = sale.notes?.replace(/^Customer:\s*/, '').trim() || 'Pelanggan Umum';

        let statusText = sale.payment_method.charAt(0).toUpperCase() + sale.payment_method.slice(1);
        if (sale.is_voided) {
          statusText = 'Dibatalkan';
        } else if (sale.payment_method === 'qris') {
          const qrisStatusMap = { success: 'Selesai', failed: 'Gagal', pending: 'Pending' };
          statusText += ` (${qrisStatusMap[sale.qris_status] || 'Pending'})`;
        } else {
          statusText += ' (Selesai)';
        }

        return {
          orderId: sale.id,
          dateTime: sale.sale_date,
          saleDate: sale.sale_date,
          date: saleDate.toLocaleDateString("id-ID", { day: '2-digit', month: '2-digit', year: 'numeric' }),
          time: saleDate.toLocaleTimeString("id-ID", { hour: '2-digit', minute: '2-digit' }),
          customerName,
          items: (sale.sale_items || []).map((item) => ({
            name: item.products?.name || 'Produk tidak ditemukan',
            qty: item.qty,
            unit_price: Number(item.unit_price) || 0,
            line_total: Number(item.line_total) || 0,
          })),
          subtotalAmount: Number(sale.subtotal) || 0,
          totalAmount: parseFloat(sale.grand_total) || 0,
          discountAmount: parseFloat(sale.discount) || 0,
          paymentMethod: sale.payment_method,
          isVoided: Boolean(sale.is_voided),
          isSuccessful: !sale.is_voided && (sale.payment_method !== 'qris' || sale.qris_status === 'success'),
          canVoid: !sale.is_voided && (sale.payment_method !== 'qris' || sale.qris_status === 'success'),
          voidReason: sale.void_reason,
          receiptData: {
            store: activeStore,
            transaction_id: `TRX-${sale.id}`,
            date: saleDate.toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
            customer_name: customerName,
            items: (sale.sale_items || []).map((item) => ({
              name: item.products?.name || 'Produk tidak ditemukan',
              qty: item.qty,
              unit_price: Number(item.unit_price) || 0,
              line_total: Number(item.line_total) || 0,
              original_unit_price: Number(item.unit_price) || 0,
            })),
            subtotal: Number(sale.subtotal) || 0,
            discount: Number(sale.discount) || 0,
            grand_total: Number(sale.grand_total) || 0,
            amount_paid: Number(sale.grand_total) || 0,
            change: 0,
            payment_method: sale.payment_method,
            is_voided: Boolean(sale.is_voided),
            void_reason: sale.void_reason,
          },
          status: statusText,
          channel: sale.channel === 'offline' ? 'offline' : 'online',
          month: saleDate.getMonth(),    // 0-11
          year: saleDate.getFullYear(),
        };
      });

      setRawData(transformed);
    } catch (err) {
      console.error('Error fetching history:', err);
      setError(err.message || 'Gagal memuat riwayat');
    } finally {
      setLoading(false);
    }
  }, [user]);

  const voidTransaction = useCallback(async (saleId, reason) => {
    const trimmedReason = String(reason || '').trim();
    if (!trimmedReason) throw new Error('Catatan pembatalan wajib diisi.');
    if (!user?.id) throw new Error('Sesi login tidak ditemukan.');

    setIsVoiding(true);
    try {
      const { data, error: voidError } = await supabase
        .from('sales')
        .update({ is_voided: true, voided_at: new Date().toISOString(), voided_by: user.id, void_reason: trimmedReason })
        .eq('id', saleId)
        .eq('is_voided', false)
        .select('id');

      if (voidError) throw voidError;
      if (!data?.length) throw new Error('Transaksi sudah dibatalkan atau tidak dapat diakses.');
      await fetchHistory();
    } catch (error) {
      setError(error.message || 'Gagal membatalkan transaksi.');
      throw error;
    } finally {
      setIsVoiding(false);
    }
  }, [user, fetchHistory]);

  useEffect(() => {
    if (user?.id) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch riwayat transaksi saat user login / toko berganti
      fetchHistory();
    }
    const handleStoreChange = () => {
      // KETIKA SWITCH TOKO: HISTORY KOSONG
      setRawData([]);
      fetchHistory();
    };
    window.addEventListener(ACTIVE_STORE_EVENT, handleStoreChange);
    return () => window.removeEventListener(ACTIVE_STORE_EVENT, handleStoreChange);
  }, [user, fetchHistory]);

  // 1. Filter berdasarkan channel
  const filteredData = useMemo(() => {
    if (filterChannel === "all") return rawData;
    return rawData.filter(item => item.channel === filterChannel);
  }, [rawData, filterChannel]);

  // 2. Generate Periode 3 Bulanan (dari sekarang ke belakang)
  const periods = useMemo(() => {
    const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni",
                        "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
    
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    const result = [];
    let tempMonth = currentMonth;
    let tempYear = currentYear;
    
    // Buat periode 3 bulan ke belakang (misal 8 periode = 2 tahun)
    for (let i = 0; i < 8; i++) {
      const endMonthIdx = tempMonth;
      const startMonthIdx = (tempMonth - 2 + 12) % 12;
      const startYear = tempMonth >= 2 ? tempYear : tempYear - 1;
      
      result.push({
        label: `${monthNames[startMonthIdx]} - ${monthNames[endMonthIdx]} ${tempYear}`,
        months: [
          { month: startMonthIdx, year: startYear },
          { month: (startMonthIdx + 1) % 12, year: startMonthIdx + 1 > 11 ? startYear + 1 : startYear },
          { month: endMonthIdx, year: tempYear },
        ]
      });
      
      // Mundur 3 bulan
      tempMonth -= 3;
      if (tempMonth < 0) {
        tempMonth += 12;
        tempYear -= 1;
      }
    }
    
    return result;
  }, []);

  // 3. Data yang dipaginate per 3 bulan
  const paginatedData = useMemo(() => {
    const activePeriod = periods[activePeriodIndex];
    if (!activePeriod) return {};

    // Filter data yang masuk dalam periode aktif
    const inPeriod = filteredData.filter(item => {
      return activePeriod.months.some(
        p => p.month === item.month && p.year === item.year
      );
    });

    // Grouping berdasarkan Bulan
    const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni",
                        "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
    
    const grouped = {};
    activePeriod.months.forEach(p => {
      grouped[`${monthNames[p.month]} ${p.year}`] = [];
    });

    inPeriod.forEach(item => {
      const key = `${monthNames[item.month]} ${item.year}`;
      if (grouped[key]) {
        grouped[key].push(item);
      }
    });

    return grouped;
  }, [filteredData, activePeriodIndex, periods]);

  return {
    rawData,
    filteredData,
    paginatedData,
    periods,
    activePeriodIndex,
    setActivePeriodIndex,
    filterChannel,
    setFilterChannel,
    loading,
    isVoiding,
    error,
    voidTransaction,
    refetch: fetchHistory,
  };
}