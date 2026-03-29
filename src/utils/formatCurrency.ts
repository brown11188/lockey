export type Currency = 'VND' | 'USD';

export function formatCurrency(amount: number, currency: Currency): string {
  if (currency === 'VND') {
    const formatted = Math.round(amount)
      .toString()
      .replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return `₫${formatted}`;
  } else {
    return `$${amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
  }
}

export function parseAmount(value: string): number {
  const cleaned = value.replace(/[^0-9.]/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

export function formatAmountInput(value: string, currency: Currency): string {
  const cleaned = value.replace(/[^0-9]/g, '');
  if (!cleaned) return '';
  if (currency === 'VND') {
    return cleaned.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }
  // For USD allow decimals
  return cleaned.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}
