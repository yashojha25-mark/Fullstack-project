/**
 * Calculate cart totals
 */
const calculateCartTotals = (items) => {
  const subtotal = items.reduce((sum, item) => {
    return sum + item.price * item.quantity;
  }, 0);

  // Free shipping above 999, else 49
  const shipping = subtotal > 999 ? 0 : subtotal > 0 ? 49 : 0;
  const total = subtotal + shipping;

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    discount: 0,
    shipping,
    total: Math.round(total * 100) / 100,
  };
};

/**
 * Get discounted price
 */
const getDiscountedPrice = (price, discount) => {
  if (!discount || discount <= 0) return price;
  return Math.round(price * (1 - discount / 100) * 100) / 100;
};

module.exports = { calculateCartTotals, getDiscountedPrice };
