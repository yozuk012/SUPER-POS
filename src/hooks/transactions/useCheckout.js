'use client';

import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { buildCheckoutReceipt, createCheckout, submitCheckout } from '@/lib/checkout';
import { readPendingCheckout, savePendingCheckout, removePendingCheckout } from '@/lib/pendingCheckout';

export function useCheckout({ userId, storeId, cartItems, customerName, channel, discount, storeInfo, onSuccess, onRollback }) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [pendingState, setPendingState] = useState(null);
  const [checkoutError, setCheckoutError] = useState(null);
  const [storageBlocked, setStorageBlocked] = useState(false);
  const [receiptData, setReceiptData] = useState(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const inFlight = useRef(false);
  const currentScope = useRef(null);
  const scope = userId && storeId ? `${userId}:${storeId}` : null;
  const [readyScope, setReadyScope] = useState(null);
  const pendingCheckout = pendingState?.scope === scope ? pendingState.checkout : null;
  const checkoutBlocked = !scope || isProcessing || readyScope !== scope || Boolean(pendingCheckout || storageBlocked);

  useEffect(() => {
    currentScope.current = scope;
    function load() {
      setReceiptData(null);
      setIsPaymentModalOpen(false);
      setCheckoutError(null);
      setStorageBlocked(false);
      try {
        const checkout = scope ? readPendingCheckout(window.localStorage, userId, storeId) : null;
        setPendingState({ scope, checkout });
      } catch (error) {
        setStorageBlocked(true);
        setCheckoutError(error.message);
      } finally {
        setReadyScope(scope);
      }
    }
    load();
    return () => { currentScope.current = null; };
  }, [scope, userId, storeId]);

  const confirmPayment = async (paymentData = {}) => {
    if (inFlight.current || !scope || readyScope !== scope || storageBlocked) return;
    if (!pendingCheckout && !cartItems.length) return;
    const attemptScope = scope;
    inFlight.current = true;
    setIsProcessing(true);
    setCheckoutError(null);
    let checkout;
    try {
      checkout = readPendingCheckout(window.localStorage, userId, storeId);
      if (!checkout) {
        checkout = createCheckout({ storeId, cartItems, customerName, channel, discount, storeInfo, paymentData });
        savePendingCheckout(window.localStorage, userId, storeId, checkout);
      }
      setPendingState({ scope: attemptScope, checkout });
      let sale;
      try {
        sale = await submitCheckout(supabase, checkout);
      } catch (error) {
        if (error.rolledBack) {
          removePendingCheckout(window.localStorage, userId, storeId);
          if (currentScope.current === attemptScope) {
            setPendingState(null);
            onRollback(checkout);
          }
        }
        throw error;
      }
      const receipt = buildCheckoutReceipt(checkout, sale);
      removePendingCheckout(window.localStorage, userId, storeId);
      if (currentScope.current !== attemptScope) return;
      setPendingState(null);
      setReceiptData(receipt);
      setIsPaymentModalOpen(false);
      onSuccess();
    } catch (error) {
      if (currentScope.current !== attemptScope) return;
      setIsPaymentModalOpen(false);
      setCheckoutError((error.rolledBack ? 'Transaksi dibatalkan tanpa perubahan data: ' :
        'Status transaksi belum dapat dipastikan. Jangan meminta pelanggan membayar lagi. ') + error.message);
    } finally {
      inFlight.current = false;
      setIsProcessing(false);
    }
  };

  return {
    isProcessing, pendingCheckout, receiptData, isPaymentModalOpen, checkoutBlocked, checkoutError, storageBlocked,
    handleCheckout() { if (!checkoutBlocked && cartItems.length) setIsPaymentModalOpen(true); },
    closePaymentModal() { if (!inFlight.current) setIsPaymentModalOpen(false); },
    confirmPayment,
    clearCheckoutError() { setCheckoutError(null); },
    finishReceipt() { setReceiptData(null); setIsPaymentModalOpen(false); },
  };
}