const CURRENCY_SYMBOL = 'Rs.';

export function formatCurrency(amount) {
  const value = typeof amount === 'number' ? amount : parseFloat(amount) || 0;
  return `${CURRENCY_SYMBOL} ${value.toFixed(2)}`;
}
