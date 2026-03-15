const DEFAULT_TAX_RATE = 0.08875; // 8.875%

/**
 * Calculate tax on a subtotal (all values in cents).
 * Returns tax amount in cents, rounded to the nearest cent.
 */
export function calculateTax(
  subtotalCents: number,
  rate: number = DEFAULT_TAX_RATE
): number {
  return Math.round(subtotalCents * rate);
}

export function getTaxRateDisplay(rate: number = DEFAULT_TAX_RATE): string {
  return (rate * 100).toFixed(3).replace(/0+$/, "").replace(/\.$/, "");
}

export const TAX_RATE = DEFAULT_TAX_RATE;
