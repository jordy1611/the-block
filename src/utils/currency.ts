/**
 * Money formatting. Every dollar figure in the app goes through here — never
 * toLocaleString() at a call site, or the 112 vehicles with a null current_bid
 * will eventually render "$null" somewhere.
 *
 * Bids in the dataset are whole dollars, so cents are suppressed.
 */
const cad = new Intl.NumberFormat('en-CA', {
  style: 'currency',
  currency: 'CAD',
  maximumFractionDigits: 0,
});

/** 14500 -> "$14,500" */
export function formatCurrency(amount: number): string {
  return cad.format(amount);
}

/**
 * For inputs and other places that need the digits without the symbol.
 * 14500 -> "14,500"
 */
const plain = new Intl.NumberFormat('en-CA', { maximumFractionDigits: 0 });

export function formatAmount(amount: number): string {
  return plain.format(amount);
}
