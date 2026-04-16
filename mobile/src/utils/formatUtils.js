export const CURRENCY_SYMBOLS = {
  INR: '₹',
  USD: '$',
  EUR: '€',
  GBP: '£',
};

export function formatCurrency(amount, currencyCode = 'INR') {
  const value = typeof amount === 'number' ? amount : parseFloat(amount) || 0;
  const symbol = CURRENCY_SYMBOLS[currencyCode] || currencyCode || '₹';
  return `${symbol} ${value.toFixed(2)}`;
}
