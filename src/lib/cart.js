export function calculateCartTotals(items, discount = 0) {
  const subtotal = Math.round(items.reduce((sum, item) => sum + item.line_total, 0));
  const discountAmount = Math.min(Math.max(0, Math.round(Number(discount) || 0)), subtotal);
  const platformFee = Math.round(items.reduce((sum, item) => sum + item.line_total * item.platform_fee_pct / 100, 0));
  return { subtotal, discountAmount, platformFee, grandTotal: Math.max(0, subtotal - discountAmount) };
}

export function createCartItem(product, channel) {
  const price = product.product_prices?.find(price => price.channel.toLowerCase() === channel);
  const basePrice = Number(price ? price.price : product.base_price);
  const discountPct = Number(product.discount_pct) || 0;
  const normalPrice = Math.round(basePrice - basePrice * discountPct / 100);
  return {
    id: product.id, name: product.name, sku: product.sku, unit: product.unit,
    hpp: Number(product.hpp) || 0, qty: 1, unit_price: normalPrice,
    original_price: basePrice, discount_pct: discountPct, base_unit_price: normalPrice,
    platform_fee_pct: price ? Number(price.platform_fee_pct) : 0,
    line_total: normalPrice, category_name: product.categories?.name || 'Umum', channel,
    track_stock: product.track_stock !== false, stock: Number(product.stock) || 0,
  };
}

export function setCartItemQuantity(item, qty) {
  const price = Number(item.base_unit_price ?? item.unit_price) || 0;
  return { ...item, qty, unit_price: price, line_total: Math.round(price * qty) };
}