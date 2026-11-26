import { useState, useCallback } from 'react';
import { useAuth } from '../auth/useAuth';
import { useTransactionCatalog } from './useTransactionCatalog';
import { useCheckout } from './useCheckout';
import { isStockUnlimited } from '@/lib/productUtils';
import { calculateCartTotals, createCartItem, setCartItemQuantity } from '@/lib/cart';

export default function useTransaction() {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [channel, setChannel] = useState('offline');
  const [categoryId, setCategoryId] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [cartItems, setCartItems] = useState([]);
  const [customerName, setCustomerName] = useState('');
  const [discount, setDiscount] = useState(0);

  const resetCart = useCallback(() => {
    setCartItems([]);
    setDiscount(0);
    setCustomerName('');
  }, []);
  const resetStore = useCallback(() => {
    resetCart();
    setCategoryId('all');
    setSearch('');
    setCurrentPage(1);
  }, [resetCart]);
  const catalog = useTransactionCatalog(user?.id, { search, channel, categoryId, currentPage, onStoreChange: resetStore });
  const { products, storeId, storeInfo } = catalog;
  const totals = calculateCartTotals(cartItems, discount);
  const checkout = useCheckout({
    userId: user?.id, storeId, cartItems, customerName, channel, discount, storeInfo,
    onSuccess() { resetCart(); void catalog.fetchProducts(); },
    onRollback(checkout) {
      setCartItems(checkout.cartItems);
      setCustomerName(checkout.receipt.customer_name === '-' ? '' : checkout.receipt.customer_name);
      setDiscount(checkout.sale.discount);
      setChannel(checkout.sale.channel);
    },
  });

  const addToCart = (product) => {
    if (checkout.checkoutBlocked) return;
    const stockTracked = !isStockUnlimited(product);
    const availableStock = Number(product.stock) || 0;

    setCartItems(prev => {
      const existingItem = prev.find(item => item.id === product.id);
      const currentQtyInCart = existingItem ? existingItem.qty : 0;

      // PERBAIKAN 2: Validasi saat menambah 1 item.
      // Dilewati bila stok produk tanpa batas (track_stock = false).
      if (stockTracked && currentQtyInCart + 1 > availableStock) {
        alert(`⚠️ Stok tidak mencukupi!\nStok tersedia hanya ${availableStock} ${product.unit}.`);
        return prev; // Batalkan penambahan
      }

      if (existingItem) {
        return prev.map(item => item.id === product.id ? setCartItemQuantity(item, item.qty + 1) : item);
      }
      
      return [...prev, createCartItem(product, channel)];
    });
  };

  // ==========================================
  // 4b. DISKON CEPAT (NOMINAL Rp) — LEVEL TRANSAKSI
  // Satu tombol di ringkasan keranjang (TransactionQuickDiscount) mengisi state
  // `discount`. Nilainya dipotong dari subtotal sehingga
  // grand_total = subtotal - discount — konsisten dengan kolom `sales.discount`,
  // laporan keuangan, dan struk.
  // ==========================================
  const updateQty = (productId, newQty) => {
    if (checkout.checkoutBlocked) return;
    if (newQty <= 0) {
      removeItem(productId);
      return;
    }

    // PERBAIKAN 3: Validasi saat mengubah jumlah secara manual.
    // Dilewati bila stok produk tanpa batas (track_stock = false).
    const cartItem = cartItems.find(item => item.id === productId);
    const originalProduct = products.find(p => p.id === productId);
    const stockTracked =
      cartItem?.track_stock !== false && !isStockUnlimited(originalProduct);
    const availableStock = Number(originalProduct?.stock ?? cartItem?.stock) || 0;

    if (stockTracked && newQty > availableStock) {
      alert(`⚠️ Stok tidak mencukupi!\nMaksimal jumlah yang bisa dimasukkan adalah ${availableStock}.`);
      return; // Batalkan update, kembalikan ke nilai lama (tidak di-set)
    }

    setCartItems(prev => prev.map(item => item.id === productId ? setCartItemQuantity(item, newQty) : item));
  };

  const removeItem = (productId) => {
    if (checkout.checkoutBlocked) return;
    setCartItems(prev => prev.filter(item => item.id !== productId));
  };

  const clearCart = () => {
    if (checkout.checkoutBlocked) return;
    setCartItems([]);
    setDiscount(0);
    setCustomerName('');
  };


  return {
    ...catalog, ...checkout, search, setSearch, channel, setChannel, categoryId, setCategoryId,
    pagination: { currentPage, totalPages: Math.ceil(catalog.totalItems / catalog.limit) || 1, totalItems: catalog.totalItems },
    setPage: setCurrentPage, cartItems, addToCart, updateQty, removeItem, clearCart, customerName, setCustomerName,
    discount: totals.discountAmount, setDiscount, subtotal: totals.subtotal, platformFee: totals.platformFee, grandTotal: totals.grandTotal,
  };
}
